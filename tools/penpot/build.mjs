/**
 * 원고 스펙(JSON) → Penpot 파일(.penpot). TOOL-01 7차 적용, CEO 지시 2026-09-29.
 *
 * 왜 Penpot인가: Canva Pro는 90일 한정(CANVA-01)이라 마감 단계(표지·도표·대사 오버레이)를
 * 거기에만 묶으면 만료일에 끊긴다. Penpot은 오픈소스(MPL-2.0)·무료라 같은 자리를 비용 0으로
 * 받쳐 준다. 이미지 "생성" 도구는 아니다 — 사진·그림 생성은 기존 무료 파이프라인(Pollinations)
 * 그대로이고, 여기서는 그 위에 얹는 레이아웃·글자를 만든다.
 *
 * 이 세션에서는 파일까지만 만든다. design.penpot.app은 세션 egress가 막아 열 수 없으므로
 * 가져오기(import)·PNG 내보내기·발행은 CEO가 Penpot에서 한다(CANVA-01과 같은 원칙: 발행은 CEO).
 *
 * 사용: node build.mjs spec.json out.penpot
 *   spec = { "file": "이름", "boards": [ { "preset": "blogger"|"insta"|"threads", "name": "...",
 *            "title": "...", "sub": "...", "footer": "..." } ] }
 */
import * as penpot from "@penpot/library";
import { createWriteStream, readFileSync } from "fs";
import { Writable } from "stream";

/* 채널마다 비율을 새로 잡는다(MULTI-01). 인스타·Threads는 1:1(TOON-01·SNS-01), Blogger는 16:9. */
const PRESETS = {
  blogger: { width: 1920, height: 1080, pad: 140, title: 88, sub: 44, footer: 28 },
  insta: { width: 1080, height: 1080, pad: 96, title: 72, sub: 38, footer: 26 },
  threads: { width: 1080, height: 1080, pad: 96, title: 72, sub: 38, footer: 26 },
};

/* 한글이 있는 글꼴이어야 한다 — 기본 글꼴(Source Sans Pro)은 한글 글리프가 없다.
   Penpot 내장 Google Fonts의 Noto Sans KR을 쓴다(무료, OFL). */
const FONT = { fontFamily: "Noto Sans KR", fontId: "gfont-noto-sans-kr" };
const COLORS = { bg: "#F5F1EA", ink: "#1B1B1B", sub: "#4A4A4A", accent: "#1F3A5F" };
/* 행간. Penpot 기본 1.2는 두 줄 제목이 붙어 보였다(2026-10-13 CEO "행간 간격 넓혀줘"). */
const LINE_HEIGHT = 1.5;

/* Penpot은 한글을 글자 단위로 줄바꿈해서 "채점하 / 게 했다"처럼 낱말 중간이 잘린다
   (2026-10-13 CEO 가져오기 화면으로 확인). 그래서 줄을 여기서 미리 나눠 문단으로 넣는다.
   폭은 글자 종류별 대략치로 어림하고, 실제보다 넓게 잡아 Penpot이 다시 자를 일을 줄인다.
   스펙에 "\n"을 넣으면 그 자리에서 강제로 끊는다. */
/* 폭 계수는 Noto Sans KR 굵게(700) 글꼴 파일의 글자 폭(advance)에 맞췄다 — 한글 음절 0.92em,
   대문자 평균 0.67, 소문자 평균 0.57, 숫자 0.59, 띄어쓰기 0.23. 2026-10-13 CEO Penpot 화면(v2)에서
   잰 한글 폭은 약 0.89em로 글꼴값보다 3% 좁았고, 처음 값(한글 1.0×1.08)은 글꼴값보다 17% 넓어
   줄이 필요 이상 짧았다. 여기에 안전계수 1.04를 곱한다 — 좁게 잡으면 Penpot이 다시 낱말을 자른다.
   평균보다 넓은 글자(m·w·M·W, %·…·→ 등 기호)는 따로 잡는다. 모르는 글자는 1em으로 넓게 본다. */
const WIDE = new Set([..."mwMW"]);
const SYMBOL = { "%": 1.0, "…": 1.0, "→": 1.0, "—": 1.0, "@": 1.0, "&": 0.8 };
const MID = new Set([..."~·?\"+#=<>$^_*"]);
function charWidth(ch) {
  if (ch === " ") return 0.3;
  if (/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/.test(ch)) return 0.92;
  if (WIDE.has(ch)) return 0.97;
  if (/[A-Z]/.test(ch)) return 0.7;
  if (/[a-z]/.test(ch)) return 0.6;
  if (/[0-9]/.test(ch)) return 0.62;
  if (ch in SYMBOL) return SYMBOL[ch];
  if (MID.has(ch)) return 0.62;
  if (/[\x21-\x7e]/.test(ch)) return 0.4;
  return 1.0;
}

function measure(s, size) {
  let w = 0;
  for (const ch of s) w += charWidth(ch);
  return w * size * 1.04;
}

function wrapLines(value, size, maxWidth) {
  const lines = [];
  for (const hard of String(value).split("\n")) {
    let line = "";
    for (const word of hard.split(" ").filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && measure(next, size) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

/* 실제로 차지할 줄 수. 띄어쓰기 없는 긴 낱말은 wrapLines가 못 나누고 Penpot이 다시 자르므로
   그 줄은 폭만큼 여러 줄로 센다 — 막대·글상자·부제 위치가 이 값을 따른다. */
function lineCount(lines, size, maxWidth) {
  return lines.reduce((n, line) => n + Math.max(1, Math.ceil(measure(line, size) / maxWidth)), 0);
}

function text(lines, size, weight, color) {
  const span = (s) => ({
    text: s,
    ...FONT,
    fontSize: String(size),
    lineHeight: String(LINE_HEIGHT),
    fontWeight: String(weight),
    fills: [{ fillColor: color, fillOpacity: 1 }],
  });
  return {
    type: "root",
    children: [
      {
        type: "paragraph-set",
        children: lines.map((line) => ({ type: "paragraph", lineHeight: String(LINE_HEIGHT), children: [span(line)] })),
      },
    ],
  };
}

function addBoard(ctx, b, index) {
  const p = PRESETS[b.preset];
  if (!p) throw new Error(`알 수 없는 preset: ${b.preset} (blogger|insta|threads)`);
  if (!b.title) throw new Error(`boards[${index}] 제목이 비어 있다`);
  /* 보드는 가로로 나란히 놓는다 — 가져온 뒤 한 화면에서 비교하기 쉽다. */
  const x = index * 2100;
  const inner = p.width - p.pad * 2;
  /* 제목은 쉼표 뒤에서 끊는다 — 폭으로만 자르면 "맡기고, 다른 AI가 / 채점하게 했다"처럼 한 구절이
     두 줄에 걸친다(2026-10-13 CEO "쉼표 다음 줄바꿈"). "1,000"처럼 뒤에 띄어쓰기 없는 쉼표와
     제목 끝 쉼표는 그대로 둔다(빈 줄이 생기면 막대·부제가 한 줄 내려간다). */
  const titleWrapped = wrapLines(String(b.title).replace(/,[ \t]+(?=\S)/g, ",\n"), p.title, inner);
  /* 제목 상자·강조 막대 높이를 실제 줄 수×행간에 맞춘다. 고정 3줄 높이로 두면 2줄 제목에서 막대가
     글자보다 길게 남았다(2026-10-13 v2 화면). 부제는 제목 바로 아래에 붙는다. */
  const titleH = Math.ceil(p.title * LINE_HEIGHT * lineCount(titleWrapped, p.title, inner));
  ctx.addBoard({
    name: b.name ?? `${b.preset}-${p.width}x${p.height}`,
    x,
    y: 0,
    width: p.width,
    height: p.height,
    fills: [{ fillColor: COLORS.bg, fillOpacity: 1 }],
  });
  ctx.addRect({ name: "accent", x: x + p.pad - 40, y: p.pad, width: 12, height: titleH, fills: [{ fillColor: COLORS.accent, fillOpacity: 1 }] });
  ctx.addText({ name: "title", x: x + p.pad, y: p.pad, width: inner, height: titleH, grow: "fixed", content: text(titleWrapped, p.title, 700, COLORS.ink) });
  if (b.sub) {
    ctx.addText({ name: "sub", x: x + p.pad, y: p.pad + titleH + 40, width: inner, height: Math.ceil(p.sub * LINE_HEIGHT * 3), grow: "fixed", content: text(wrapLines(b.sub, p.sub, inner), p.sub, 400, COLORS.sub) });
  }
  if (b.footer) {
    ctx.addText({ name: "footer", x: x + p.pad, y: p.height - p.pad, width: inner, height: Math.ceil(p.footer * LINE_HEIGHT * 2), grow: "fixed", content: text(wrapLines(b.footer, p.footer, inner), p.footer, 500, COLORS.accent) });
  }
  ctx.closeBoard();
}

async function main() {
  const [specPath, outPath] = process.argv.slice(2);
  if (!specPath || !outPath) {
    console.error("사용: node build.mjs spec.json out.penpot");
    process.exit(2);
  }
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  if (!Array.isArray(spec.boards) || spec.boards.length === 0) throw new Error("boards가 비어 있다");
  const ctx = penpot.createBuildContext();
  ctx.addFile({ name: spec.file ?? "BALMYGARDEN" });
  ctx.addPage({ name: "원고" });
  spec.boards.forEach((b, i) => addBoard(ctx, b, i));
  ctx.closeFile();
  await penpot.exportStream(ctx, Writable.toWeb(createWriteStream(outPath)));
  console.log(`${outPath} — 보드 ${spec.boards.length}개`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
