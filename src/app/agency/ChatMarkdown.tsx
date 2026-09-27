import type { ReactNode } from "react";
import { parseChatMarkdown } from "@/lib/chatMarkdown";

/**
 * 지시창 말풍선용 최소 마크다운 렌더러.
 * 무료 모델(Gemini)이 표·목록·굵게를 마크다운으로 쓰는데, 지금까지는 그걸 글자 그대로
 * 찍어서 "**", "| --- |"가 화면에 남았다(CEO 피드백 2026-09-27 "가독성 너무 떨어진다").
 * 라이브러리를 들이지 않고 모델이 실제로 쓰는 문법만 읽는다 — 표 / 소제목 / 목록 / **굵게**.
 * HTML을 직접 넣지 않으므로(dangerouslySetInnerHTML 없음) 모델 출력이 마크업이 되지 않는다.
 */

/** **굵게**와 `코드`만 읽는다. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      m[1] !== undefined ? (
        <strong key={k++}>{m[1]}</strong>
      ) : (
        <code key={k++} style={{ background: "#cbd5e1", borderRadius: "3px", padding: "0 3px", fontSize: "11.5px" }}>
          {m[2]}
        </code>
      )
    );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* 상태 칸 색 — 🔴/🟡/🟢 대신 칩으로(NOTION-01 색 구분과 같은 뜻). */
function statusTone(cell: string): { bg: string; fg: string } | null {
  if (/미확인|막힘|blocked|실패|CEO 조치|대표 조치|필요/i.test(cell)) return { bg: "#fee2e2", fg: "#b91c1c" };
  if (/진행|대기|준비|초안|검토/.test(cell)) return { bg: "#fef3c7", fg: "#92400e" };
  if (/완료|확정|유지|판매|freeze|pass|자동/i.test(cell)) return { bg: "#dcfce7", fg: "#166534" };
  return null;
}

export function ChatMarkdown({ text }: { text: string }) {
  const blocks = parseChatMarkdown(text);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {blocks.map((b, i) => {
        if (b.kind === "heading") {
          return (
            <div key={i} style={{ fontWeight: 800, fontSize: "12.5px", color: "#0f172a", marginTop: i ? "4px" : 0 }}>
              {inline(b.text)}
            </div>
          );
        }
        if (b.kind === "list") {
          return (
            <ul key={i} style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "2px" }}>
              {b.items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </ul>
          );
        }
        if (b.kind === "table") {
          const statusCol = b.header.findIndex((h) => /상태|현황|status/i.test(h));
          return (
            <div key={i} style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table style={{ borderCollapse: "collapse", fontSize: "11.5px", minWidth: "100%", background: "#f8fafc" }}>
                {b.header.length > 0 && (
                  <thead>
                    <tr>
                      {b.header.map((h, j) => (
                        <th
                          key={j}
                          style={{ textAlign: "left", padding: "4px 6px", borderBottom: "2px solid #94a3b8", whiteSpace: "nowrap", color: "#334155" }}
                        >
                          {inline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {b.rows.map((r, j) => (
                    <tr key={j}>
                      {r.map((c, k) => {
                        const tone = k === statusCol ? statusTone(c) : null;
                        return (
                          <td key={k} style={{ padding: "4px 6px", borderBottom: "1px solid #e2e8f0", verticalAlign: "top" }}>
                            {tone ? (
                              <span style={{ background: tone.bg, color: tone.fg, borderRadius: "999px", padding: "1px 7px", fontWeight: 700, whiteSpace: "nowrap" }}>
                                {inline(c)}
                              </span>
                            ) : (
                              inline(c)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <div key={i}>{inline(b.text)}</div>;
      })}
    </div>
  );
}
