import { NextRequest, NextResponse } from "next/server";
import { Client, type BlockObjectRequest, type PageObjectResponse } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB_ID = process.env.NOTION_DATABASE_ID ?? "";

/* GET /api/notion?limit=20 — 최근 Notion 기록 조회 (에이전트 컨텍스트용) */
export async function GET(req: NextRequest) {
  if (!process.env.NOTION_API_KEY || !DB_ID) {
    return NextResponse.json({ error: "env 미설정" }, { status: 500 });
  }
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "20"), 50);
  try {
    // @notionhq/client v5+: 조회는 database가 아니라 그 안의 data source 단위로 한다.
    const db = await notion.databases.retrieve({ database_id: DB_ID });
    const dataSourceId = (db as unknown as { data_sources: { id: string }[] }).data_sources[0]?.id;
    if (!dataSourceId) {
      return NextResponse.json({ error: "데이터베이스에 data source가 없습니다." }, { status: 500 });
    }
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: limit,
    });
    const entries = (res.results as unknown[]).map((p) => {
      const page = p as PageObjectResponse;
      const props = page.properties as Record<string, { type: string; title?: { plain_text: string }[]; select?: { name: string }; date?: { start: string } }>;
      return {
        id: page.id,
        url: page.url,
        title: props.Name?.title?.[0]?.plain_text ?? "",
        type: props.Type?.select?.name ?? "",
        status: props.Status?.select?.name ?? "",
        date: props.Date?.date?.start ?? "",
      };
    });
    return NextResponse.json({ entries });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    if (action === "save_log") {
      const { source, title, content } = payload as {
        source: string;
        title: string;
        content: string;
      };
      const children: BlockObjectRequest[] = paragraphs(content);
      const page = await notion.pages.create({
        parent: { database_id: DB_ID },
        properties: {
          Name: { title: [{ text: { content: `[${source}] ${title}` } }] },
          Type: { select: { name: "로그" } },
          Status: { select: { name: "기록됨" } },
          Date: { date: { start: new Date().toISOString() } },
        },
        children,
      });
      return NextResponse.json({ url: (page as { url: string }).url });
    }

    if (action === "save_review") {
      const { version, track, good, bad, improve, next, agent } = payload as {
        version: string; track: string; good: string; bad: string;
        improve: string; next: string; agent: string;
      };
      const children: BlockObjectRequest[] = [
        heading(`트랙: ${track} — ${version} / 담당: ${agent}`),
        heading("✅ 좋았던 점"), ...paragraphs(good || "(없음)"),
        heading("❌ 부족한 점"), ...paragraphs(bad || "(없음)"),
        heading("🔄 개선 방향"), ...paragraphs(improve || "(없음)"),
        heading("➡️ 다음 수정"), ...paragraphs(next || "(없음)"),
      ];
      const page = await notion.pages.create({
        parent: { database_id: DB_ID },
        properties: {
          Name: { title: [{ text: { content: `[리뷰] ${track} ${version} by ${agent}` } }] },
          Type: { select: { name: "리뷰" } },
          Status: { select: { name: "기록됨" } },
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
