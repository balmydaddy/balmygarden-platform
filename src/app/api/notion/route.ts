import { NextRequest, NextResponse } from "next/server";
import { Client, type BlockObjectRequest, type PageObjectResponse } from "@notionhq/client";
import { isUnlocked } from "@/lib/unlockAuth";

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

/* 사업(Track) 태그. music/app/game/safety/blog/전체 5종 — Notion "Track" select와 값이 정확히 일치해야 한다. */
function trackProp(businessTrack?: string) {
  return { select: { name: businessTrack || "전체" } };
}

/* "BALMYGARDEN — 미결 사항 & Action Items" 페이지 — PM-01 규칙상 실제 업무 상태(Draft/
   Ready/In Progress/Waiting/Blocked/Review/Approved/Done/Archived)를 갖는 유일한 표가
   "1. CEO 요청사항" 표다(다른 카테고리 표엔 이 의미의 Status 컬럼이 없음) — 그 표만
   집계한다. 페이지 구조가 바뀌면(표 위치·헤더명) 파싱이 실패할 수 있어, 실패 시 숫자를
   지어내지 않고 ok:false로 알린다. */
const BACKLOG_PAGE_ID = "393987a25d6181058168d54da40a5d77";

type NotionBlock = { id: string; type: string; [k: string]: unknown };

async function listChildren(blockId: string): Promise<NotionBlock[]> {
  const out: NotionBlock[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    out.push(...(res.results as unknown as NotionBlock[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out;
}

function blockPlainText(block: NotionBlock): string {
  const t = block.type as string;
  const body = block[t] as { rich_text?: { plain_text: string }[] } | undefined;
  return (body?.rich_text ?? []).map((r) => r.plain_text).join("");
}

/* CEO 개입이 실제로 필요한 항목 — 예외 기반 감독(management by exception) 원칙상
   화면의 붉은 카드는 "지금 진짜 막혀 있는 것"일 때만 떠야 한다. 0건이면 카드를
   비워서 CEO가 붉은 표시를 습관적으로 무시하게 되는 것을 막는다. */
type Blocker = { id: string; title: string; priority: string; status: string; owner: string };

type TaskStats =
  | { ok: true; total: number; done: number; inProgress: number; notStarted: number; blockers: Blocker[] }
  | { ok: false; error: string };

async function fetchTaskStatusCounts(): Promise<TaskStats> {
  try {
    const top = await listChildren(BACKLOG_PAGE_ID);
    const startIdx = top.findIndex((b) => blockPlainText(b).includes("CEO 요청사항"));
    if (startIdx === -1) return { ok: false, error: "CEO 요청사항 섹션을 찾을 수 없음" };
    const nextHeadingIdx = top.findIndex(
      (b, i) => i > startIdx && /^heading_/.test(b.type) && blockPlainText(b).trim().length > 0
    );
    const section = top.slice(startIdx + 1, nextHeadingIdx === -1 ? undefined : nextHeadingIdx);
    const table = section.find((b) => b.type === "table");
    if (!table) return { ok: false, error: "CEO 요청사항 표를 찾을 수 없음" };

    const rows = (await listChildren(table.id)).filter((b) => b.type === "table_row") as (NotionBlock & {
      table_row: { cells: { plain_text: string }[][] };
    })[];
    if (rows.length < 2) return { ok: false, error: "표 행이 비어있음" };

    const cellText = (row: (typeof rows)[number], col: number) =>
      (row.table_row.cells[col] ?? []).map((t) => t.plain_text).join("").trim();

    const header = rows[0].table_row.cells.map((c) => c.map((t) => t.plain_text).join(""));
    const statusCol = header.findIndex((h) => h.includes("상태"));
    if (statusCol === -1) return { ok: false, error: "상태 컬럼을 찾을 수 없음" };
    /* 나머지 컬럼은 없어도 집계는 가능하므로 실패시키지 않고 빈 문자열로 흘린다. */
    const idCol = header.findIndex((h) => h.trim() === "ID");
    const titleCol = header.findIndex((h) => h.includes("요청"));
    const prioCol = header.findIndex((h) => h.includes("우선순위"));
    const ownerCol = header.findIndex((h) => h.includes("담당"));

    const body = rows.slice(1);
    const statuses = body.map((r) => cellText(r, statusCol));
    const total = statuses.length;
    const done = statuses.filter((s) => s === "Done" || s === "Archived").length;
    const inProgress = statuses.filter((s) => s === "In Progress" || s === "Review").length;
    const notStarted = total - done - inProgress;

    /* Blocked(명시적으로 막힘)와 P0(최우선)만 CEO 개입 대상으로 본다. Waiting은
       선행 작업이 끝나면 팀이 알아서 진행하는 상태라 제외 — 여기 넣으면 대기 항목이
       전부 붉게 떠서 "진짜 막힌 것"이 묻힌다(예외 기반 감독의 취지가 사라짐). */
    const blockers: Blocker[] = body
      .filter((r) => {
        const st = cellText(r, statusCol);
        if (st === "Done" || st === "Archived") return false;
        const prio = prioCol === -1 ? "" : cellText(r, prioCol);
        return st === "Blocked" || prio === "P0";
      })
      .map((r) => ({
        id: idCol === -1 ? "" : cellText(r, idCol),
        title: titleCol === -1 ? "" : cellText(r, titleCol),
        priority: prioCol === -1 ? "" : cellText(r, prioCol),
        status: cellText(r, statusCol),
        owner: ownerCol === -1 ? "" : cellText(r, ownerCol),
      }));

    return { ok: true, total, done, inProgress, notStarted, blockers };
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message };
  }
}

/* GET /api/notion?limit=20 — 최근 Notion 기록 조회 (에이전트 컨텍스트용)
   GET /api/notion?stats=1 — "미결 사항" 페이지 CEO 요청사항 표에서 실제 업무 상태 집계 */
export async function GET(req: NextRequest) {
  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json({ error: "env 미설정" }, { status: 500 });
  }
  if (req.nextUrl.searchParams.get("stats") === "1") {
    const counts = await fetchTaskStatusCounts();
    /* 집계 수치는 그대로 두되, 미결 항목의 제목·담당자는 잠금해제된 요청에만
       내보낸다 — 이 엔드포인트엔 인증이 없어 공개 링크로도 호출 가능하다.
       `blockers` 자체를 생략하지 않고 blockersGated로 알려, 화면이 "0건(=문제
       없음)"으로 오해하지 않게 한다. */
    if (counts.ok && !isUnlocked(req)) {
      const { blockers: _gated, ...safe } = counts;
      return NextResponse.json({ ...safe, blockers: [], blockersGated: true });
    }
    return NextResponse.json(counts);
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
        track: props.Track?.select?.name ?? "",
        date: props.Date?.date?.start ?? "",
      };
    });
    /* 이 목록은 공개 업무화면(OfficeTab)이 쓰기 때문에 통째로 막을 수 없다.
       대신 미인증 요청에는 cron이 남긴 업무 로그("로그")만 남기고, CEO 지시창
       기록("[대화]" 등 다른 Type)과 Notion 페이지 링크·ID는 제거한다 —
       지금까지는 전량을 내려보내고 브라우저에서만 걸러서, 방문자가 응답을
       직접 열면 CEO 지시 제목이 그대로 보였다. */
    if (!isUnlocked(req)) {
      const publicEntries = entries
        .filter((e) => e.type === "로그")
        .map(({ id, title, type, status, track, date }) => ({ id, title, type, status, track, date }));
      return NextResponse.json({ entries: publicEntries, redacted: true });
    }
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
      const { workflowName, input, results, businessTrack } = payload as {
        workflowName: string;
        input: string;
        results: { agent: string; role: string; text: string; done: boolean }[];
        businessTrack?: string;
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
          Track: trackProp(businessTrack),
          Date: { date: { start: new Date().toISOString() } },
        },
        children,
      });

      return NextResponse.json({ url: (page as { url: string }).url });
    }

    if (action === "save_chat") {
      const { agentKey, agentRole, messages, businessTrack } = payload as {
        agentKey: string;
        agentRole: string;
        messages: { role: "user" | "agent"; text: string }[];
        businessTrack?: string;
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
          Track: trackProp(businessTrack),
          Date: { date: { start: new Date().toISOString() } },
        },
        children,
      });

      return NextResponse.json({ url: (page as { url: string }).url });
    }

    if (action === "save_prompt") {
      const { id, name, content, category, businessTrack } = payload as {
        id: string;
        name: string;
        content: string;
        category: string;
        businessTrack?: string;
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
          Track: trackProp(businessTrack),
          Date: { date: { start: new Date().toISOString() } },
        },
        children,
      });

      return NextResponse.json({ url: (page as { url: string }).url });
    }

    if (action === "save_log") {
      const { source, title, content, businessTrack } = payload as {
        source: string;
        title: string;
        content: string;
        businessTrack?: string;
      };
      const children: BlockObjectRequest[] = paragraphs(content);
      const page = await notion.pages.create({
        parent,
        properties: {
          Name: { title: [{ text: { content: `[${source}] ${title}` } }] },
          Type: { select: { name: "로그" } },
          Status: { select: { name: "기록됨" } },
          Track: trackProp(businessTrack),
          Date: { date: { start: new Date().toISOString() } },
        },
        children,
      });
      return NextResponse.json({ url: (page as { url: string }).url });
    }

    if (action === "save_review") {
      const { version, track, good, bad, improve, next, agent, businessTrack } = payload as {
        version: string; track: string; good: string; bad: string;
        improve: string; next: string; agent: string; businessTrack?: string;
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
          Track: trackProp(businessTrack || "음악"),
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
