import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* COST-01 (CEO 지시 2026-08-23): 예산 집행 없음. 무료 범위 안에서만 돈다.
   유료 API(Anthropic)는 기본적으로 아예 호출하지 않는다 — 잔액이 없으면
   호출마다 400을 받느라 시간만 버리고, 잔액이 생기면 그때부터 과금된다.
   둘 다 지금 원하는 동작이 아니다.

   켜려면 Vercel 환경변수 `PAID_LLM_ENABLED=true`를 명시적으로 넣어야 한다.
   그전까지 이 라우트는 Gemini 무료 등급만 쓴다.

   무료 등급 한도(2026-08 실측): gemini-2.5-flash-lite 분당 10건. 이 한도를
   넘기면 429가 나므로, 호출하는 쪽(`/api/cron`)이 건수를 그 안에 맞춰야 한다. */
const PAID_LLM_ENABLED = process.env.PAID_LLM_ENABLED === "true";

/* 모델 라우팅 (CLAUDE.md 비용 60-30-10 원칙 실제 적용).
   PAID_LLM_ENABLED가 켜졌을 때만 의미가 있다. */
const SONNET_MODEL = "claude-sonnet-4-6";
const HAIKU_MODEL = "claude-haiku-4-6";
const TOP_MODEL = "claude-opus-4-6";

const HAIKU_AGENTS = new Set(["SCOUT", "REX"]);
const TOP_AGENTS = new Set(["CONDUCTOR", "AEGIS", "NOVA"]);

function modelForAgent(agentName?: string): string {
  if (!agentName) return SONNET_MODEL;
  const key = agentName.toUpperCase();
  if (HAIKU_AGENTS.has(key)) return HAIKU_MODEL;
  if (TOP_AGENTS.has(key)) return TOP_MODEL;
  return SONNET_MODEL;
}

async function callClaude(systemPrompt: string, userMessage: string, agentName?: string): Promise<{ text: string; model: string }> {
  const client = new Anthropic();
  const model = modelForAgent(agentName);
  try {
    const msg = await client.messages.create({
      model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    return { text: msg.content[0]?.type === "text" ? msg.content[0].text : "(응답 없음)", model };
  } catch (err) {
    /* Haiku/상위 모델 ID가 이 계정에서 아직 유효하지 않을 수 있음 —
       기존에 검증된 Sonnet으로 즉시 재시도 후 그래도 실패하면 상위(Gemini)로 전파 */
    if (model !== SONNET_MODEL) {
      const msg = await client.messages.create({
        model: SONNET_MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });
      console.log(`[agent] ${model} 실패 → Sonnet 폴백 사용:`, (err as Error).message);
      return { text: msg.content[0]?.type === "text" ? msg.content[0].text : "(응답 없음)", model: `${SONNET_MODEL} (fallback from ${model})` };
    }
    throw err;
  }
}

/* 무료 경로. COST-01 이후로는 이쪽이 기본이고 Claude가 예외다.
   GEMINI_API_KEY는 이미 api/ocr에서 쓰고 있는 값을 그대로 재사용하고,
   모델명도 api/ocr에서 실사용 검증된 것과 동일하게 맞춘다.
   이 모델은 무료 등급에서 제공되며, 한도를 넘으면 과금되는 게 아니라
   429로 거절된다 — 자동 유료 전환이 없다. */
async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY 미설정 — Gemini 대체도 불가");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(userMessage);
  return result.response.text() || "(응답 없음)";
}

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userMessage, agentName } = await req.json();
    if (!systemPrompt || !userMessage) {
      return NextResponse.json({ error: "systemPrompt and userMessage required" }, { status: 400 });
    }

    /* 무료 경로 우선. 유료 경로는 명시적으로 켰을 때만 시도한다. */
    if (!PAID_LLM_ENABLED) {
      try {
        const text = await callGemini(systemPrompt, userMessage);
        return NextResponse.json({ text, provider: "gemini-free" });
      } catch (geminiErr: unknown) {
        const msg = (geminiErr as Error).message;
        /* 429는 고장이 아니라 무료 한도다 — 문구를 나눠야 원인을 안 헤맨다. */
        const quota = msg.includes("429") || msg.toLowerCase().includes("quota");
        console.error("[agent] Gemini 무료 경로 실패", { quota, message: msg });
        return NextResponse.json(
          {
            error: quota
              ? `무료 등급 한도 초과(분당 10건). 호출 건수를 줄이거나 간격을 벌려야 한다 — ${msg}`
              : `Gemini 호출 실패 — ${msg}`,
            quotaExceeded: quota,
          },
          { status: 502 }
        );
      }
    }

    try {
      const { text, model } = await callClaude(systemPrompt, userMessage, agentName);
      return NextResponse.json({ text, provider: "claude", model });
    } catch (claudeErr: unknown) {
      try {
        const text = await callGemini(systemPrompt, userMessage);
        console.log("[agent] Claude 실패 → Gemini 무료 대체 사용:", (claudeErr as Error).message);
        return NextResponse.json({ text, provider: "gemini-fallback" });
      } catch (geminiErr: unknown) {
        console.error("[agent] Claude·Gemini 둘 다 실패", {
          claude: (claudeErr as Error).message,
          gemini: (geminiErr as Error).message,
        });
        return NextResponse.json(
          {
            error: `Claude 실패: ${(claudeErr as Error).message} / Gemini 대체도 실패: ${(geminiErr as Error).message}`,
          },
          { status: 502 }
        );
      }
    }
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
