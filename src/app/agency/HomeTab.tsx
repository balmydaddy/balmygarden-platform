"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { STAFF } from "./office";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "700", "800"] });

/* ══════════════════════════════════════════════════
   BALMYGARDEN 홈 — 벤토 그리드 대시보드 (2026 개인 대시보드 벤치마킹)
   CEO 지시(2026-08-19): 디자인 시안(artifact) 방향을 실제 코드에 반영, 밝은 톤으로.
   ══════════════════════════════════════════════════ */

type Portfolio = { total_asset?: number; total_pnl?: number };
type TradingStatus = { portfolio?: Portfolio; updated?: string };
type LogEntry = { id: string; url: string; title: string; type: string; date: string };

/* 4트랙 현황 — Notion "BALMYGARDEN — 미결 사항" Executive Summary와 동일하게 유지한다.
   그 페이지가 갱신되면 이 상수도 같이 업데이트할 것(자동 연동 아님, STAFF/ZONES와 동일한
   수동 큐레이션 패턴). */
const TRACK_STATUS: { name: string; emoji: string; status: "red" | "amber" | "green"; note: string }[] = [
  { name: "GOSARI EP", emoji: "🌿", status: "red", note: "STEP 8 지연 — Bridge 재독 대기" },
  { name: "OCR 앱", emoji: "🧾", status: "amber", note: "Beta 테스팅 진행 중 (ARIA)" },
  { name: "LOD 게임", emoji: "🎮", status: "green", note: "세계관 재작성 완료 (SAGE)" },
  { name: "안전관리", emoji: "🦺", status: "green", note: "크몽 판매 중 (WARDEN)" },
];

const STATUS_DOT: Record<string, string> = { red: "#EF4444", amber: "#f59e0b", green: "#22C55E" };

const card = (): CSSProperties => ({
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "20px",
});

const label: CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 700,
};

const fmtWon = (n: number | undefined) => `${Math.round(n || 0).toLocaleString("ko-KR")}원`;

export default function HomeTab({ isMobile }: { isMobile: boolean }) {
  const [trading, setTrading] = useState<{ online: boolean; data?: TradingStatus }>({ online: false });
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/trading", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { online: boolean; data?: TradingStatus }) => alive && setTrading(j))
      .catch(() => {});
    fetch("/api/notion?limit=6", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { entries?: LogEntry[] }) => alive && setLog(j.entries ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const pnl = trading.data?.portfolio?.total_pnl ?? 0;
  const roster = STAFF.slice(0, 9);

  return (
    <div className={display.className}>
      {/* ── 인사 ── */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "6px" }}>
        <div>
          <div style={{ fontSize: isMobile ? "22px" : "30px", fontWeight: 700, color: "#1e293b", letterSpacing: "-0.01em" }}>
            안녕하세요, 김태을 대표님
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", fontFamily: "inherit" }}>
            4트랙 동시 운영 중 · 자동화 상시 가동
          </div>
        </div>
      </div>

      {/* ── 벤토 그리드 ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(12, minmax(0,1fr))", gap: "14px" }}>
        {/* CEO 결정 대기 — 하이라이트 셀 */}
        <div
          style={{
            ...card(),
            gridColumn: isMobile ? "auto" : "span 5",
            background: "linear-gradient(160deg, #fef2f2 0%, #ffffff 60%)",
            borderColor: "#fecaca",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ ...label, color: "#dc2626" }}>CEO 결정 대기 · P0</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "3px 10px", borderRadius: "999px" }}>
              지연 중
            </div>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "12px", color: "#1e293b" }}>Bridge v0.1 P-13 재독</div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "6px", lineHeight: 1.6, fontFamily: "inherit" }}>
            GOSARI EP 전체가 이 한 건에 멈춰 있습니다 — 재독 후 결과만 알려주시면 이어서 진행합니다.
          </div>
        </div>

        {/* 트레이딩 스냅샷 */}
        <div style={{ ...card(), gridColumn: isMobile ? "auto" : "span 4" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={label}>트레이딩</div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: trading.online ? "#16a34a" : "#94a3b8" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: trading.online ? "#22C55E" : "#cbd5e1" }} />
              {trading.online ? "LIVE" : "오프라인"}
            </div>
          </div>
          {trading.online ? (
            <>
              <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "10px", color: "#1e293b" }}>
                {fmtWon(trading.data?.portfolio?.total_asset)}
              </div>
              <div style={{ fontSize: "12px", color: pnl >= 0 ? "#16a34a" : "#dc2626", marginTop: "2px", fontFamily: "monospace" }}>
                {pnl >= 0 ? "+" : ""}
                {fmtWon(pnl)}
              </div>
            </>
          ) : (
            <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "14px" }}>트레이딩 서버 연결 대기 중</div>
          )}
        </div>

        {/* 최근 업무 로그 (실데이터, Notion) */}
        <div style={{ ...card(), gridColumn: isMobile ? "auto" : "span 3", gridRow: isMobile ? "auto" : "span 2" }}>
          <div style={label}>업무 로그</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
            {log.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>최근 기록 없음</div>
            ) : (
              log.map((e) => (
                <div key={e.id}>
                  <div style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>
                    {e.date ? new Date(e.date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : ""}
                  </div>
                  <div style={{ fontSize: "12.5px", marginTop: "3px", lineHeight: 1.5, color: "#334155", fontFamily: "inherit" }}>
                    {e.title}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 근무 중 팀 (실제 STAFF 데이터) */}
        <div style={{ ...card(), gridColumn: isMobile ? "auto" : "span 5" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={label}>팀 · {STAFF.length}명</div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {roster.map((s) => (
              <div key={s.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: s.wear,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    boxShadow: "0 0 0 1px #e2e8f0",
                  }}
                  title={`${s.name} — ${s.role}`}
                >
                  {s.emoji}
                </div>
                <div style={{ fontSize: "10px", color: "#94a3b8" }}>{s.name}</div>
              </div>
            ))}
            {STAFF.length > roster.length && (
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "1px dashed #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "#94a3b8",
                }}
              >
                +{STAFF.length - roster.length}
              </div>
            )}
          </div>
        </div>

        {/* 4트랙 현황 */}
        {TRACK_STATUS.map((t) => (
          <div key={t.name} style={{ ...card(), gridColumn: isMobile ? "auto" : "span 4" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={label}>
                {t.emoji} {t.name}
              </div>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: STATUS_DOT[t.status] }} />
            </div>
            <div style={{ fontSize: "13px", marginTop: "8px", color: "#334155", fontFamily: "inherit" }}>{t.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
