import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userMessage } = await req.json();
    if (!systemPrompt || !userMessage) {
      return NextResponse.json({ error: "systemPrompt and userMessage required" }, { status: 400 });
    }

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      msg.content[0]?.type === "text" ? msg.content[0].text : "(응답 없음)";
    return NextResponse.json({ text });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
