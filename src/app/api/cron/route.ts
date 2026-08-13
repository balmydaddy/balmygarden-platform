import { NextRequest, NextResponse } from "next/server";
import { STAFF, type ZoneId } from "@/app/agency/office";
import { MEMORY } from "@/app/agency/memory";
import { SCOUT_PRESETS } from "@/app/api/naver-news/route";
import { publishToBlogger } from "@/lib/blogger";

/**
 * 일일 자동화 배치 — Vercel Cron이 매일 00:00 UTC(09:00 KST)에 호출한다.
 *
 * 1) SCOUT: 프리셋 전량(music/app/game/safety/trend) 수집 + Notion 저장.
 * 2) 블로그팀: trend 조사 결과를 INK(정리)→CHECK(1차검토)→CHIEF(최종검토)로
 *    넘겨 네이버 블로그 초안을 만든다. 단계별 결과 전부 Notion 기록.
 * 3) 나머지 전 직원: 병렬로 하루 업무 1건씩 실행 — 화면 애니메이션과 별개로
 *    서버에서 실제로 진행되는 자동화.
 *
 * Hobby 플랜은 cron 실행 빈도가 1일 1회로 제한된다.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron은 배포 고유 URL(Deployment Protection 적용됨)로 호출하므로
// req.nextUrl.origin을 쓰면 내부 fetch가 전부 막힌다. 보호되지 않는
// 프로덕션 별칭을 고정으로 쓴다.
const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://balmygarden-platform.vercel.app";

/* 담당자 홈존 → Notion Track. Track select 옵션명과 정확히 일치해야 한다. */
const ZONE_TRACK: Partial<Record<ZoneId, string>> = {
  music: "음악",
  app: "영수증앱",
  game: "게임",
};

async function callAgent(name: string, role: string, userMessage: string): Promise<string | null> {
  try {
    const res = await fetch(`${SITE_ORIGIN}/api/agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt:
          `당신은 BALMYGARDEN 에이전시의 ${name}입니다. 담당: ${role}.\n한국어로 답한다.\n\n` +
          `[BALMYGARDEN 기업 컨텍스트]\n` + MEMORY.map((m) => `[${m.tag}] ${m.txt}`).join("\n"),
        userMessage,
      }),
    });
    const data = (await res.json()) as { text?: string };
    return data.text ?? null;
  } catch {
    return null;
  }
}

async function saveLog(source: string, title: string, content: string, businessTrack?: string) {
  try {
    await fetch(`${SITE_ORIGIN}/api/notion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_log", payload: { source, title, content, businessTrack } }),
    });
  } catch {
    /* 저장 실패해도 파이프라인은 계속 진행 */
  }
}

/**
 * INK 초안("제목: ...\n이미지프롬프트: ...\n\n본문...") → {title, imagePrompt, body} 파싱.
 * 형식이 어긋나면 첫 줄을 제목으로, 이미지프롬프트는 제목으로 대체 폴백.
 */
function parseDraft(draft: string): { title: string; imagePrompt: string; body: string } {
  const match = draft.match(/^\s*제목\s*[:：]\s*(.+?)\n\s*이미지\s*프롬프트\s*[:：]\s*(.+?)\n+([\s\S]+)$/);
  if (match) {
    return { title: match[1].trim(), imagePrompt: match[2].trim(), body: match[3].trim() };
  }
  const titleOnly = draft.match(/^\s*제목\s*[:：]\s*(.+?)\n+([\s\S]+)$/);
  if (titleOnly) {
    return { title: titleOnly[1].trim(), imagePrompt: titleOnly[1].trim(), body: titleOnly[2].trim() };
  }
  const lines = draft.trim().split("\n");
  const title = (lines[0] || "제목 없음").slice(0, 100);
  return { title, imagePrompt: title, body: lines.slice(1).join("\n").trim() || draft };
}

type ScoutResult = {
  preset: string;
  status?: number;
  body?: { groups?: { query: string; entries: { title: string; summary: string }[] }[] };
  error?: string;
};

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const today = new Date().toISOString().slice(0, 10);

  // 1) SCOUT — 프리셋 전량 수집 + Notion 저장 (music/app/game/safety/trend)
  const scoutSettled = await Promise.allSettled(
    Object.keys(SCOUT_PRESETS).map(async (preset) => {
      const res = await fetch(`${SITE_ORIGIN}/api/naver-news`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });
      return { preset, status: res.status, body: await res.json() } as ScoutResult;
    })
  );
  const scout: ScoutResult[] = scoutSettled.map((r) =>
    r.status === "fulfilled" ? r.value : { preset: "?", error: r.reason?.message }
  );
  results.scout = scout;

  // 2) 블로그팀 파이프라인 — trend 조사 결과 → INK 정리 → CHECK 1차검토 → CHIEF 최종검토
  const trend = scout.find((r) => r.preset === "trend");
  const research = (trend?.body?.groups ?? [])
    .map((g) => `[${g.query}]\n` + g.entries.slice(0, 5).map((e) => `- ${e.title}: ${e.summary}`).join("\n"))
    .join("\n\n");

  if (research.trim()) {
    const draft = await callAgent(
      "INK",
      "블로그 초안 정리",
      `아래는 SCOUT가 오늘 조사한 트렌드 뉴스다. 이 중 네이버 블로그 글감으로 가장 좋은 주제 1개를 골라 ` +
        `1200자 내외 블로그 초안(제목+본문)을 작성해라. 반드시 첫 줄은 "제목: "으로 시작하고, ` +
        `둘째 줄은 "이미지프롬프트: "로 시작해 이 글 대표 이미지를 생성할 영문 프롬프트(핵심 소재를 ` +
        `구체적으로 묘사하는 10~20단어, 텍스트·글자 요청 금지)를 쓴 뒤, 빈 줄 하나 띄우고 본문을 쓴다 ` +
        `(자동 발행 시스템이 이 두 줄을 파싱해 이미지 생성과 발행에 그대로 쓴다).\n\n` +
        `너는 이 분야 상위 1% 수익형 네이버 블로거다. 아마추어가 정보를 나열하는 방식이 아니라, ` +
        `그 주제로 실제 상위 노출·수익화에 성공한 블로거라면 어떤 제목·구조·분량·키워드 배치로 썼을지를 ` +
        `먼저 스스로 떠올려 그 수준을 기준(벤치마킹)으로 삼아 써라 — 흔한 글솜씨가 아니라 "무엇을 ` +
        `기준으로 썼는가"의 차이로 상위 1%가 된다는 전제로 접근한다.\n\n` +
        `작성 전 아래 기준을 스스로 순서대로 적용하되, 결과물에는 완성된 최종 글(제목+본문)만 남겨라:\n` +
        `1) 검색 의도 파악 — 이 주제를 검색하는 사람이 진짜 알고 싶어하는 것 3가지를 먼저 정리하고, ` +
        `그 3가지에 실제로 답하는 글이 되도록 쓴다 (내가 쓰고 싶은 글이 아니라 사람들이 찾는 글).\n` +
        `2) 차별화 — 같은 주제의 흔한 글과 똑같은 구조·정보로 쓰지 말고, 이 글만의 구체적 정보나 관점을 ` +
        `최소 1개 이상 포함한다.\n` +
        `3) 도입부 — 궁금증이나 공감을 유발하는 문장으로 시작한다 (첫 세 줄에서 이탈하면 나머지는 아무도 안 읽는다).\n` +
        `4) 구체화 — "좋다/편하다/추천한다" 같은 막연한 표현을 전부 실제 경험·수치·근거로 바꾼다.\n` +
        `5) 이탈 포인트 점검 — 글을 읽다가 지루해서 나갈 만한 지점이 있는지 스스로 점검하고 보완한다.\n` +
        `6) 마지막 줄에 "다음 소재 후보"로 이어질 만한 주제 2~3개를 팀 내부 참고용으로 짧게 덧붙인다 ` +
        `(발행 본문과는 구분해서 표시).\n\n[오늘 조사 내용]\n${research}`
    );
    if (draft) {
      await saveLog("블로그팀", `블로그 초안 ${today} (INK)`, draft, "블로그팀");

      const check = await callAgent(
        "CHECK",
        "블로그 1차 검토",
        `아래는 INK가 쓴 블로그 초안이다. 과장급 검토자로서 다음을 점검해라: ` +
          `①사실관계·톤·표시광고 리스크 ②검색 의도 3가지에 실제로 답하고 있는지 ` +
          `③"좋다/편하다" 식 막연한 표현이 구체적 경험·수치로 바뀌었는지 ④도입부가 궁금증·공감으로 ` +
          `시작하는지. 수정 필요 시 구체적으로, 문제없으면 "승인"이라 명확히 밝혀라.\n\n${draft}`
      );
      if (check) {
        await saveLog("블로그팀", `블로그 1차 검토 ${today} (CHECK)`, check, "블로그팀");

        const chief = await callAgent(
          "CHIEF",
          "블로그 최종 검토·승인",
          `아래는 초안과 과장(CHECK) 1차 검토다. 15년 차 콘텐츠 마케터 관점에서 이 글이 검색 상위 노출될 ` +
            `가능성을 평가하고, 부족한 부분이 있으면 짚어라. 그 후 팀장으로서 게시 여부를 "승인" 또는 ` +
            `"반려"로 명확히 결정하고 이유를 짧게 남겨라.\n\n[초안]\n${draft}\n\n[1차 검토]\n${check}`
        );
        if (chief) await saveLog("블로그팀", `블로그 최종 검토 ${today} (CHIEF)`, chief, "블로그팀");

        if (chief && chief.includes("승인")) {
          const { title, imagePrompt, body } = parseDraft(draft);
          try {
            const postUrl = await publishToBlogger(title, body, imagePrompt);
            await saveLog("블로그팀", `블로그 발행 완료 ${today}`, `${title}\n${postUrl}`, "블로그팀");
            results.blogTeam = { ok: true, published: postUrl };
          } catch (e: unknown) {
            await saveLog("블로그팀", `블로그 발행 실패 ${today}`, (e as Error).message, "블로그팀");
            results.blogTeam = { ok: false, stage: "발행 실패", error: (e as Error).message };
          }
        } else {
          results.blogTeam = { ok: !!chief, published: false };
        }
      } else {
        results.blogTeam = { ok: false, stage: "CHECK 실패" };
      }
    } else {
      results.blogTeam = { ok: false, stage: "INK 실패" };
    }
  } else {
    results.blogTeam = { ok: false, stage: "트렌드 조사 결과 없음" };
  }

  // 3) 나머지 전 직원 — 병렬로 하루 업무 1건씩 (SCOUT·블로그팀은 위에서 이미 실행)
  const dailyStaff = STAFF.filter((s) => !["SCOUT", "INK", "CHECK", "CHIEF"].includes(s.key));
  const dailySettled = await Promise.allSettled(
    dailyStaff.map(async (s) => {
      const text = await callAgent(
        s.name,
        s.role,
        "오늘 하루 담당 업무 중 우선순위가 가장 높은 것 하나를 정해서, 지금 바로 실행 가능한 구체적인 결과물이나 다음 행동을 300자 이내로 제시해."
      );
      if (text) await saveLog("자동화", `${s.name} — 일일 업무 (${today})`, text, ZONE_TRACK[s.home] ?? "전체");
      return { key: s.key, ok: !!text };
    })
  );
  results.daily = dailySettled.map((r) => (r.status === "fulfilled" ? r.value : { error: r.reason?.message }));

  console.log("[cron] run result", JSON.stringify({ ran: new Date().toISOString(), results }));

  return NextResponse.json({ ran: new Date().toISOString(), results });
}
