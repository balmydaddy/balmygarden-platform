import { NextRequest, NextResponse } from "next/server";
import { Client, type BlockObjectRequest } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB_ID = process.env.NOTION_DATABASE_ID ?? "";

/* ──────────────────────────────────────────
  POST /api/notion
  body: { action, payload }

  actions:
    "save_workflow" — 워크플로우 체인 결과 저장
    "save_chat"     — 1:1 에이전트 대화 저장
    "save_prompt"   — 프롬프트/훅 즐겨찾기 저장
────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  if (!process.env.NOTION_API_KEY || !DB_ID) {
    return NextResponse.json(
      { error: "NOTION_API_KEY 또는 NOTION_DATABASE_ID 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const { action, payload } = await req.json();

    if (action === "save_workflow") {
      const { workflowName, input, results } = payload as {
        workflowName: string;
        input: string;
        results: { agent: string; role: string; text: string; done: boolean }[];
      };

      const children: BlockObjectRequest[] = [
        heading("📋 업무 요청"),
        ...paragraphs(input),
        divider(),
        ...results.flatMap((r) => [
          heading(`${r.done ? "✅" : "❌"} ${r.agent} — ${r.role}`),
          ...paragraphs(r.text),
          divider(),
        ]),
      ];

      const page = await notion.pages.create({
        parent: { database_id: DB_ID },
        properties: {
          Name: { title: [{ text: { content: `[워크플로우] ${workflowName}` } }] },
          Type: { select: { name: "워크플로우" } },
          Status: { select: { name: results.every((r) => r.done) ? "완료" : "오류" } },
          Date: { date: { start: new Date().toISOString() } },
        },
        children,
      });

      return NextResponse.json({ url: (page as { url: string }).url });
    }

    if (action === "save_chat") {
      const { agentKey, agentRole, messages } = payload as {
        agentKey: string;
        agentRole: string;
        messages: { role: "user" | "agent"; text: string }[];
      };

      const children: BlockObjectRequest[] = messages.flatMap((m) => [
        heading(m.role === "user" ? "👤 CEO" : `🤖 ${agentKey}`),
        ...paragraphs(m.text),
        divider(),
      ]);

      const page = await notion.pages.create({
        parent: { database_id: DB_ID },
        properties: {
          Name: { title: [{ text: { content: `[대화] ${agentKey} — ${agentRole}` } }] },
          Type: { select: { name: "대화" } },
          Status: { select: { name: "완료" } },
          Date: { date: { start: new Date().toISOString() } },
        },
        children,
      });

      return NextResponse.json({ url: (page as { url: string }).url });
    }

    if (action === "save_prompt") {
      const { id, name, content, category } = payload as {
        id: string;
        name: string;
        content: string;
        category: string;
      };

      const children: BlockObjectRequest[] = [
        heading(`${id} — ${name}`),
        ...paragraphs(content),
      ];

      const page = await notion.pages.create({
        parent: { database_id: DB_ID },
        properties: {
          Name: { title: [{ text: { content: `[${category}] ${name}` } }] },
          Type: { select: { name: "프롬프트" } },
          Status: { select: { name: "저장됨" } },
          Date: { date: { start: new Date().toISOString() } },
        },
        children,
      });

      return NextResponse.json({ url: (page as { url: string }).url });
    }

    return NextResponse.json({ error: "알 수 없는 action입니다." }, { status: 400 });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message ?? "Notion API 오류" }, { status: 500 });
  }
}

/* ── Notion block helpers ── */
function heading(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "heading_3",
    heading_3: {
      rich_text: [{ type: "text", text: { content: text.slice(0, 2000) } }],
    },
  };
}

function paragraphs(text: string): BlockObjectRequest[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += 2000) chunks.push(text.slice(i, i + 2000));
  return chunks.map((chunk) => ({
    object: "block" as const,
    type: "paragraph" as const,
    paragraph: {
      rich_text: [{ type: "text" as const, text: { content: chunk } }],
    },
  }));
}

function divider(): BlockObjectRequest {
  return { object: "block", type: "divider", divider: {} };
}
