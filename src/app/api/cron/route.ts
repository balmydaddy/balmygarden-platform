import { NextRequest, NextResponse } from "next/server";
import { STAFF, type ZoneId } from "@/app/agency/office";
import { MEMORY } from "@/app/agency/memory";
import { SCOUT_PRESETS } from "@/app/api/naver-news/route";
import { publishToBlogger } from "@/lib/blogger";

/**
 * 일일 자동화 배치 — Vercel Cron이 매일 00:00 UTC(09:00 KST)에 호출한다.
 *
 * 1) SCOUT: 프리셋 전량(music/app/game/safety/trend) 수집 + Notion 저장.
 * 2) 블로그팀: trend 조사 결과를 INK(정리)→CHECK(1차검토)→CHIEF(최종검토)→
 *    AEGIS(법무·수익화 정책 검증)로 넘겨 통과한 것만 Google Blogger에 실제
 *    발행한다. 단계별 결과 전부 Notion 기록.
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
 * INK 초안("제목: ...\n이미지프롬프트: ...\n\n본문...\n\n===다음소재===\n(내부용)")
 * → {title, imagePrompt, body} 파싱. body는 "===다음소재===" 이전까지만 —
 * 그 뒤는 팀 내부 참고용이라 발행 대상에서 제외한다. 형식이 어긋나면
 * 첫 줄을 제목으로 대체 폴백. 마크다운 강조(**)는 발행용 텍스트가 아니므로
 * 제목·본문 모두에서 제거한다(AI 티 나는 강조 남발 방지 + Blogger에는
 * 마크다운이 렌더링되지 않아 그대로 두면 별표가 글자 그대로 노출됨).
 */
function parseDraft(draft: string): { title: string; imagePrompt: string; body: string } {
  const stripBold = (s: string) => s.replace(/\*\*/g, "");
  const stripNextTopics = (s: string) => s.split(/\n+===\s*다음\s*소재\s*===[\s\S]*$/)[0].trim();

  const match = draft.match(/^\s*제목\s*[:：]\s*(.+?)\n\s*이미지\s*프롬프트\s*[:：]\s*(.+?)\n+([\s\S]+)$/);
  if (match) {
    return {
      title: stripBold(match[1].trim()),
      imagePrompt: match[2].trim(),
      body: stripBold(stripNextTopics(match[3])),
    };
  }
  const titleOnly = draft.match(/^\s*제목\s*[:：]\s*(.+?)\n+([\s\S]+)$/);
  if (titleOnly) {
    const title = stripBold(titleOnly[1].trim());
    return { title, imagePrompt: title, body: stripBold(stripNextTopics(titleOnly[2])) };
  }
  const lines = draft.trim().split("\n");
  const title = stripBold((lines[0] || "제목 없음").slice(0, 100));
  return { title, imagePrompt: title, body: stripBold(stripNextTopics(lines.slice(1).join("\n"))) || draft };
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
        `[문체 규칙 — 반드시 지켜라]\n` +
        `- 마크다운 강조(**단어**)를 쓰지 않는다. AI가 쓴 티가 나고, Blogger에는 마크다운이 렌더링되지 ` +
        `않아 별표가 글자 그대로 노출된다. 강조하고 싶으면 문장 자체를 명확하게 쓴다.\n` +
        `- 이모지는 이 글 성격에 필요한 만큼만 정해서 쓴다(예: 소제목 앞 1개 정도) — 남발 금지. 정말 ` +
        `필요하면 늘려도 되지만 기본은 최소한으로.\n` +
        `- 직관적으로 확인 가능한 사실만 근거로 쓴다. 확인 안 된 정보를 사실처럼 단정하지 않는다. ` +
        `예측·추측이 꼭 필요하면 "~일 가능성이 있다", "~로 추정된다"처럼 사실이 아니라 추측임을 문장에서 ` +
        `명확히 구분해 표시한다 — 이후 문제(정정 요청, 신뢰도 하락)가 생기지 않게 하기 위함이다.\n\n` +
        `[구조 규칙 — 2026년 상위 블로그 벤치마킹, 초보 티 벗기]\n` +
        `- 소제목(##으로 시작하는 줄)을 4~6개 넣어 글을 구획한다. 각 소제목 바로 다음 문장이 그 ` +
        `소제목이 다루는 질문에 대한 직접적인 답이 되게 쓴다(스크롤만 해도 요점이 파악되도록).\n` +
        `- 첫 문단에서 이 글의 핵심 결론·답을 먼저 던진다 — 끝까지 안 읽어도 핵심은 파악되게 쓰고, ` +
        `그 뒤 문단들이 근거·구체 사례로 살을 붙이는 구조로 간다.\n` +
        `- 문단은 2~3문장을 넘기지 않는다(모바일에서 한 화면에 다 보이는 길이).\n` +
        `- 개인이 실제로 겪은 듯한 구체적 소감·경험 문장을 최소 1군데 넣는다(정보 나열이 아니라 ` +
        `"경험한 사람이 쓴 글"이라는 신호를 준다).\n` +
        `- 마지막 소제목은 "## 자주 묻는 질문"으로 하고, 이 글 주제에 대해 독자가 실제로 궁금해할 ` +
        `질문 2~3개와 짧은 답을 붙인다.\n\n` +
        `작성 전 아래 기준을 스스로 순서대로 적용하되, 결과물에는 완성된 최종 글(제목+본문)만 남겨라:\n` +
        `1) 검색 의도 파악 — 이 주제를 검색하는 사람이 진짜 알고 싶어하는 것 3가지를 먼저 정리하고, ` +
        `그 3가지에 실제로 답하는 글이 되도록 쓴다 (내가 쓰고 싶은 글이 아니라 사람들이 찾는 글).\n` +
        `2) 차별화 — 같은 주제의 흔한 글과 똑같은 구조·정보로 쓰지 말고, 이 글만의 구체적 정보나 관점을 ` +
        `최소 1개 이상 포함한다.\n` +
        `3) 도입부 — 궁금증이나 공감을 유발하는 문장으로 시작한다 (첫 세 줄에서 이탈하면 나머지는 아무도 안 읽는다).\n` +
        `4) 구체화 — "좋다/편하다/추천한다" 같은 막연한 표현을 전부 실제 경험·수치·근거로 바꾼다.\n` +
        `5) 이탈 포인트 점검 — 글을 읽다가 지루해서 나갈 만한 지점이 있는지 스스로 점검하고 보완한다.\n` +
        `6) 본문을 다 쓴 뒤, 빈 줄을 두 번 띄우고 정확히 "===다음소재===" 한 줄만 쓴 다음, 그 아래에 ` +
        `"다음 소재 후보" 2~3개를 짧게 적는다. 이 부분은 팀 내부 참고용이며 자동 발행 시스템이 이 마커 ` +
        `기준으로 잘라내 절대 블로그에 게시되지 않으니, 본문 안에는 "다음 소재 후보" 같은 문구를 ` +
        `절대 섞어 쓰지 않는다.\n\n[오늘 조사 내용]\n${research}`
    );
    if (draft) {
      await saveLog("블로그팀", `블로그 초안 ${today} (INK)`, draft, "블로그팀");

      const check = await callAgent(
        "CHECK",
        "블로그 1차 검토",
        `아래는 INK가 쓴 블로그 초안이다. 과장급 검토자로서 다음을 점검해라: ` +
          `①사실관계·톤·표시광고 리스크 ②검색 의도 3가지에 실제로 답하고 있는지 ` +
          `③"좋다/편하다" 식 막연한 표현이 구체적 경험·수치로 바뀌었는지 ④도입부가 궁금증·공감으로 ` +
          `시작하는지 ⑤마크다운 강조(**)를 쓰지 않았는지 ⑥이모지를 남발하지 않았는지 ` +
          `⑦확인 안 된 정보를 사실처럼 단정하지 않고, 예측·추측은 "~로 추정된다" 식으로 명확히 ` +
          `구분했는지 ⑧"다음 소재 후보" 같은 내부용 문구가 본문(===다음소재=== 마커 이전)에 섞여 ` +
          `있지 않은지 ⑨소제목(##)이 4~6개 있고 첫 문단에서 핵심 결론을 먼저 제시하는지 ⑩문단이 ` +
          `2~3문장을 넘지 않는지 ⑪"자주 묻는 질문" 섹션이 있는지. 수정 필요 시 구체적으로, ` +
          `문제없으면 "승인"이라 명확히 밝혀라.\n\n${draft}`
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
          // AEGIS 법무 게이트 — 광고 수익 정책(구글 애드센스·네이버 애드포스트 등) 위반으로
          // 수익화 대상에서 제외되지 않도록 발행 직전 마지막으로 검증한다.
          const aegis = await callAgent(
            "AEGIS",
            "블로그 법무·수익화 정책 검증",
            `아래는 CHIEF까지 승인한 블로그 최종본이다. 법무·QA 게이트로서, 이 글이 구글 애드센스· ` +
              `네이버 애드포스트 등 광고 수익 프로그램 정책을 위반해 이 글 또는 블로그 전체가 수익화 ` +
              `대상에서 제외될 소지가 있는지 검증해라. 확인 항목: ①폭력·성인·도박·불법약물 등 금지 ` +
              `콘텐츠 ②원문 기사를 그대로 베낀 저작권 침해 소지 ③의료·금융 등 민감 주제에 대한 ` +
              `근거 없는 단정이나 오해를 부를 수 있는 표현 ④낚시성·기만적 제목이나 표현 ⑤개인정보 ` +
              `노출. 문제없으면 "통과"라고 명확히 밝히고, 문제가 있으면 "보류"와 구체적 사유를 ` +
              `밝혀라.\n\n${draft}`
          );
          if (aegis) await saveLog("블로그팀", `블로그 법무 검증 ${today} (AEGIS)`, aegis, "블로그팀");

          if (aegis && aegis.includes("통과")) {
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
            results.blogTeam = { ok: false, stage: "AEGIS 법무 검증 보류", published: false };
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
  const dailyStaff = STAFF.filter((s) => !["SCOUT", "INK", "CHECK", "CHIEF", "AEGIS"].includes(s.key));
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
