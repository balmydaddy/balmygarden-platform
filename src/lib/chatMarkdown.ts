/**
 * 지시창 답변(무료 모델 마크다운)을 블록으로 나눈다. 화면(ChatMarkdown)과 Notion 저장이 같이 쓴다.
 * 모델이 실제로 쓰는 문법만 읽는다 — 표 / 소제목 / 목록 / 문단.
 */

export type ChatBlock =
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "para"; text: string };

const isTableLine = (l: string) => l.trim().startsWith("|") && l.trim().endsWith("|");
const isSeparator = (l: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(l.trim());
const cells = (l: string) =>
  l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
/* 기호 뒤 공백을 요구한다 — "**결론**"으로 시작하는 줄을 목록으로 읽어 별표 하나만 떼던 문제(2026-09-27). */
const LIST_RE = /^\s*(?:[-*•]\s+|\d+[.)]\s+|[①-⑳]\s*)/;

export function parseChatMarkdown(text: string): ChatBlock[] {
  /* 모델이 가끔 <br>로 줄을 바꾼다 — 줄바꿈으로 되돌린다. */
  const lines = text.replace(/<br\s*\/?>/gi, "\n").split("\n");
  const blocks: ChatBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (isTableLine(line)) {
      const group: string[] = [];
      while (i < lines.length && isTableLine(lines[i])) group.push(lines[i++]);
      const rows = group.filter((l) => !isSeparator(l)).map(cells);
      /* 구분선만 있는 표는 버린다 — 빈 표는 Notion API가 거절해 대화 로그 저장 전체가 실패한다. */
      if (!rows.length) continue;
      const hasHeader = group.length > 1 && isSeparator(group[1]);
      blocks.push(hasHeader ? { kind: "table", header: rows[0], rows: rows.slice(1) } : { kind: "table", header: [], rows });
      continue;
    }
    const h = line.match(/^\s*#{1,4}\s+(.*)$/) ?? line.match(/^\s*\[(.+)\]\s*$/);
    if (h) {
      blocks.push({ kind: "heading", text: h[1] });
      i++;
      continue;
    }
    if (LIST_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && LIST_RE.test(lines[i]) && !isTableLine(lines[i])) {
        items.push(lines[i++].replace(LIST_RE, ""));
      }
      blocks.push({ kind: "list", items });
      continue;
    }
    blocks.push({ kind: "para", text: line });
    i++;
  }
  return blocks;
}
