import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  return msg.content[0]?.type === "text" ? msg.content[0].text : "(응답 없음)";
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
    const { systemPrompt, userMessage } = await req.json();
    if (!systemPrompt || !userMessage) {
      return NextResponse.json({ error: "systemPrompt and userMessage required" }, { status: 400 });
    }

    try {
      const text = await callClaude(systemPrompt, userMessage);
      return NextResponse.json({ text, provider: "claude" });
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
