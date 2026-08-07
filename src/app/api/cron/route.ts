import { NextRequest, NextResponse } from "next/server";
import { STAFF } from "@/app/agency/office";
import { MEMORY } from "@/app/agency/memory";
import { SCOUT_PRESETS } from "@/app/api/naver-news/route";

/**
 * 일일 자동화 배치 — Vercel Cron이 매일 00:00 UTC(09:00 KST)에 호출한다.
 *
 * R-03: SCOUT 뉴스 프리셋 전량 수집 + Notion 저장.
 * 캐릭터 로테이션: STAFF 12명 중 그날짜 기준 1명을 골라 실제 업무 1건을
 * Claude로 실행시키고 결과를 Notion에 남긴다 — 화면 애니메이션과 별개로
 * 서버에서 실제로 진행되는 유일한 자동화 단위.
 *
 * Hobby 플랜은 cron 실행 빈도가 1일 1회로 제한된다 — 그래서 "실시간 상시
 * 업무"가 아니라 "하루 1명씩 순번제로 실제 업무 1건" 구조로 설계했다.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function dayIndex(mod: number): number {
  const start = Date.UTC(new Date().getUTCFullYear(), 0, 1);
  const now = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const dayOfYear = Math.floor((now - start) / 86400000);
  return dayOfYear % mod;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const origin = req.nextUrl.origin;
  const results: Record<string, unknown> = {};

  // 1) SCOUT — 프리셋 전량 수집 + Notion 저장
  const scoutResults = await Promise.allSettled(
    Object.keys(SCOUT_PRESETS).map(async (preset) => {
      const res = await fetch(`${origin}/api/naver-news`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });
      return { preset, status: res.status, body: await res.json() };
    })
  );
  results.scout = scoutResults.map((r) => (r.status === "fulfilled" ? r.value : { error: r.reason?.message }));

  // 2) 캐릭터 로테이션 — 오늘 담당자 1명 실제 업무 실행
  const agent = STAFF[dayIndex(STAFF.length)];
  try {
    const agentRes = await fetch(`${origin}/api/agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt:
          `당신은 BALMYGARDEN 에이전시의 ${agent.name}입니다. 담당: ${agent.role}.\n` +
          `한국어로, 300자 이내로, 오늘 실행할 액션 아이템 중심으로 답한다.\n\n` +
          `[BALMYGARDEN 기업 컨텍스트]\n` +
          MEMORY.map((m) => `[${m.tag}] ${m.txt}`).join("\n"),
        userMessage:
          "오늘 하루 담당 업무 중 우선순위가 가장 높은 것 하나를 정해서, 지금 바로 실행 가능한 구체적인 결과물이나 다음 행동을 제시해.",
      }),
    });
    const agentData = (await agentRes.json()) as { text?: string; error?: string };

    if (agentData.text) {
      const notionRes = await fetch(`${origin}/api/notion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_log",
          payload: {
            source: "자동화",
            title: `${agent.name} — 일일 업무 (${new Date().toISOString().slice(0, 10)})`,
            content: agentData.text,
          },
        }),
      });
      results.agent = { key: agent.key, ok: notionRes.ok, text: agentData.text.slice(0, 200) };
    } else {
      results.agent = { key: agent.key, error: agentData.error };
    }
  } catch (e: unknown) {
    results.agent = { key: agent.key, error: (e as Error).message };
  }

  return NextResponse.json({ ran: new Date().toISOString(), results });
}
