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

function text(value, size, weight, color) {
  return {
    type: "root",
    children: [
      {
        type: "paragraph-set",
        children: [
          {
            type: "paragraph",
            children: [
              {
                text: value,
                ...FONT,
                fontSize: String(size),
                fontWeight: String(weight),
                fills: [{ fillColor: color, fillOpacity: 1 }],
              },
            ],
          },
        ],
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
  ctx.addBoard({
    name: b.name ?? `${b.preset}-${p.width}x${p.height}`,
    x,
    y: 0,
    width: p.width,
    height: p.height,
    fills: [{ fillColor: COLORS.bg, fillOpacity: 1 }],
  });
  ctx.addRect({ name: "accent", x: x + p.pad - 40, y: p.pad, width: 12, height: p.title * 3, fills: [{ fillColor: COLORS.accent, fillOpacity: 1 }] });
  ctx.addText({ name: "title", x: x + p.pad, y: p.pad, width: inner, height: p.title * 3, grow: "fixed", content: text(b.title, p.title, 700, COLORS.ink) });
  if (b.sub) {
    ctx.addText({ name: "sub", x: x + p.pad, y: p.pad + p.title * 3 + 40, width: inner, height: p.sub * 3, grow: "fixed", content: text(b.sub, p.sub, 400, COLORS.sub) });
  }
  if (b.footer) {
    ctx.addText({ name: "footer", x: x + p.pad, y: p.height - p.pad, width: inner, height: p.footer * 2, grow: "fixed", content: text(b.footer, p.footer, 500, COLORS.accent) });
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
