import { NextRequest, NextResponse } from "next/server";
import { Client, type BlockObjectRequest, type PageObjectResponse } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * NOTION_DATABASE_ID 수동 복사가 반복적으로 틀린 ID(페이지/뷰 ID)로
 * 등록되는 문제가 있어, 검색으로 실제 접근 가능한 data source를 찾는다.
 * 통합(integration)에 연결된 데이터소스 중 이름에 "Agency"가 들어간
 * 것을 우선한다 — 그것도 없으면 연결된 첫 번째 data source를 쓴다.
 */
let cachedDataSourceId: string | null = null;

async function resolveDataSourceId(): Promise<string> {
  if (cachedDataSourceId) return cachedDataSourceId;

  const res = await notion.search({
    filter: { property: "object", value: "data_source" },
    page_size: 20,
  });

  if (res.results.length === 0) {
    throw new Error(
      "연동(BALMYGARDEN Agency)에 연결된 데이터베이스가 하나도 없습니다. " +
        "Notion에서 대상 데이터베이스를 열어 '···' → 연결 추가하기에서 직접 연결해주세요."
    );
  }

  type SearchDataSource = { id: string; title?: { plain_text: string }[] };
  const results = res.results as unknown as SearchDataSource[];
  const preferred = results.find((r) =>
    (r.title ?? []).some((t) => t.plain_text?.includes("Agency"))
  );
  cachedDataSourceId = (preferred ?? results[0]).id;
  return cachedDataSourceId;
}

/* GET /api/notion?limit=20 — 최근 Notion 기록 조회 (에이전트 컨텍스트용) */
export async function GET(req: NextRequest) {
  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json({ error: "env 미설정" }, { status: 500 });
  }
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "20"), 50);
  try {
    const dataSourceId = await resolveDataSourceId();
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
  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json(
      { error: "NOTION_API_KEY 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const { action, payload } = await req.json();
    const dataSourceId = await resolveDataSourceId();
    const parent = { data_source_id: dataSourceId, type: "data_source_id" as const };

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
        parent,
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
        parent,
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
        parent,
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
        parent,
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
        parent,
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
