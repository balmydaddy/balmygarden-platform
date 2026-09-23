import { Client, type PageObjectResponse } from "@notionhq/client";
import { createBloggerDraft } from "@/lib/blogger";

/**
 * Notion "Blogger 초안 대기열" → Blogger 초안 (SNS-01, CEO 지시 2026-09-23).
 *
 * CONDUCTOR 세션은 이 플랫폼에 직접 요청을 보낼 수 없고(세션 egress가 vercel.app을
 * 막는다) Blogger 자격증명도 없다. 대신 Notion에는 쓸 수 있으므로, 세션이 대기열에
 * 원고를 넣으면 플랫폼이 자기 자격증명으로 초안을 만든다. 자격증명이 세션에 복제되지
 * 않는 게 이 구조를 고른 이유다.
 *
 * 발행은 하지 않는다. 초안만 만들고 편집 주소를 대기열 행에 적는다 — CEO가 이미지를
 * 넣고 발행한다(ADSENSE-01 1번).
 */

const notion = new Client({ auth: process.env.NOTION_API_KEY });

/* Agency HQ 아래 "Blogger 초안 대기열" 데이터 소스. 검색으로 찾지 않고 고정한다 —
   이름 검색은 같은 이름의 복제본이 생기면 엉뚱한 곳을 읽는다. */
const QUEUE_DATA_SOURCE_ID = "c032206d-cbba-4e4c-8149-c3049731ba7d";

/* cron 한 번이 maxDuration(60초) 안에 끝나야 한다. 초안 1건에 Notion 읽기 +
   Blogger 쓰기 + Notion 갱신이 붙으므로 한 번에 몇 건만 처리하고 나머지는 다음 실행으로 넘긴다. */
const MAX_PER_RUN = 3;

type NotionBlock = { id: string; type: string; has_children?: boolean; [k: string]: unknown };

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

function richText(value: unknown): string {
  const items = (value as { plain_text: string }[] | undefined) ?? [];
  return items.map((r) => r.plain_text).join("");
}

function blockText(block: NotionBlock): string {
  const body = block[block.type] as { rich_text?: unknown } | undefined;
  return richText(body?.rich_text);
}

async function tableToText(block: NotionBlock): Promise<string> {
  const rows = await listChildren(block.id);
  const lines = rows
    .filter((r) => r.type === "table_row")
    .map((r) => {
      const cells = ((r.table_row as { cells?: unknown[] } | undefined)?.cells ?? []).map(richText);
      return `| ${cells.join(" | ")} |`;
    });
  return lines.join("\n");
}

/**
 * Notion 블록 → blogger.ts toHtml이 읽는 텍스트 형식(빈 줄로 블록 구분, "## " 소제목,
 * "- " 목록, "| " 표, "> " 인용). 연속된 목록 항목은 한 블록으로 묶어야 <ul> 하나가 된다.
 */
export async function pageToText(pageId: string): Promise<string> {
  const blocks = await listChildren(pageId);
  const parts: string[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length) parts.push(list.join("\n"));
    list = [];
  };
  for (const b of blocks) {
    if (b.type === "bulleted_list_item" || b.type === "numbered_list_item" || b.type === "to_do") {
      list.push(`- ${blockText(b)}`);
      continue;
    }
    flushList();
    if (b.type === "heading_1" || b.type === "heading_2" || b.type === "heading_3") {
      parts.push(`## ${blockText(b)}`);
    } else if (b.type === "paragraph") {
      const t = blockText(b).trim();
      if (t) parts.push(t);
    } else if (b.type === "quote" || b.type === "callout") {
      parts.push(blockText(b).split("\n").map((l) => `> ${l}`).join("\n"));
    } else if (b.type === "table") {
      const t = await tableToText(b);
      if (t) parts.push(t);
    }
    /* 이미지·구분선 등은 건너뛴다. 이미지는 CEO가 Blogger 편집기에서 넣는다. */
  }
  flushList();
  return parts.join("\n\n");
}

async function markRow(pageId: string, status: "등록" | "실패", fields: { link?: string; error?: string }) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      상태: { select: { name: status } },
      ...(fields.link ? { "초안 링크": { url: fields.link } } : {}),
      오류: { rich_text: fields.error ? [{ text: { content: fields.error.slice(0, 1900) } }] : [] },
    },
  });
}

export type DraftSyncResult = { title: string; ok: boolean; link?: string; error?: string };

/** 대기열의 "대기" 행을 Blogger 초안으로 옮긴다. 행마다 성공·실패를 대기열에 적는다. */
export async function syncBloggerDrafts(): Promise<DraftSyncResult[]> {
  if (!process.env.NOTION_API_KEY) throw new Error("NOTION_API_KEY 미설정");
  const res = await notion.dataSources.query({
    data_source_id: QUEUE_DATA_SOURCE_ID,
    filter: { property: "상태", select: { equals: "대기" } },
    page_size: MAX_PER_RUN,
  });
  const results: DraftSyncResult[] = [];
  for (const p of res.results) {
    const page = p as PageObjectResponse;
    const titleProp = page.properties["제목"] as { title?: { plain_text: string }[] } | undefined;
    const title = (titleProp?.title ?? []).map((t) => t.plain_text).join("").trim();
    try {
      if (!title) throw new Error("제목이 비어 있다");
      const body = await pageToText(page.id);
      if (!body.trim()) throw new Error("본문이 비어 있다");
      const link = await createBloggerDraft(title, body);
      await markRow(page.id, "등록", { link });
      results.push({ title, ok: true, link });
    } catch (e: unknown) {
      const error = (e as Error).message;
      /* 행 갱신까지 실패하면 다음 실행이 같은 행을 다시 집는다 — 초안이 이미 만들어진
         뒤라면 중복이 생길 수 있어 결과에 그대로 남긴다. */
      await markRow(page.id, "실패", { error }).catch(() => undefined);
      results.push({ title, ok: false, error });
    }
  }
  return results;
}
