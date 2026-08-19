import { STAFF } from "./office";

/**
 * Notion 로그 제목에서 담당 에이전트를 추론한다.
 *
 * cron(`/api/cron`)이 남기는 제목 형태가 몇 가지로 갈린다:
 *   "[PHANTOM] LOD 진행 확인"      → 대괄호 소스
 *   "[음악팀] 블로그 초안 (INK)"    → 괄호 접미사(블로그팀 INK/CHECK/CHIEF/AEGIS)
 *   "ZERO — 일일 업무"              → dailyStaff 루프
 * 어느 형태도 아니면 제목 안에 STAFF key가 등장하는지로 최후 폴백하고,
 * 그래도 없으면 undefined를 돌려준다 — 추측해서 엉뚱한 담당자를 붙이지 않는다.
 *
 * OfficeTab과 HomeTab이 같은 로그를 다르게 해석하면 화면끼리 어긋나므로
 * 한 곳에 둔다.
 */
export function resolveStaffKey(title: string): string | undefined {
  const bracket = title.match(/^\[([^\]]+)\]/)?.[1];
  if (bracket && STAFF.some((s) => s.key === bracket)) return bracket;
  const paren = title.match(/\(([A-Z]+)\)\s*$/)?.[1];
  if (paren && STAFF.some((s) => s.key === paren)) return paren;
  const dash = title.match(/^([A-Z]+)\s*—/)?.[1];
  if (dash && STAFF.some((s) => s.key === dash)) return dash;
  return STAFF.find((s) => title.includes(s.key))?.key;
}

/** 담당자 배지 색 — 오피스뷰 캐릭터 옷 색과 같은 값을 쓴다(화면 간 일관성). */
export function staffColor(key: string | undefined): string {
  if (!key) return "#94a3b8";
  return STAFF.find((s) => s.key === key)?.wear ?? "#94a3b8";
}
