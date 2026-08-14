import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* 모델 라우팅 (CLAUDE.md 비용 60-30-10 원칙 실제 적용).
   Haiku 60% : 분류·요약·형식 검증·단순 판단 (SCOUT, REX)
   Sonnet 30% : 실무 생성 (그 외 전 직원 — 기본값)
   상위 10% : 판단·설계·통합 (CONDUCTOR, AEGIS, NOVA) */
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

/* Claude 크레딧 소진 등으로 위 호출이 실패할 때만 쓰는 무료 대체 경로.
   GEMINI_API_KEY는 이미 api/ocr에서 쓰고 있는 값을 그대로 재사용하고,
   모델명도 api/ocr에서 실사용 검증된 것과 동일하게 맞춘다. */
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
