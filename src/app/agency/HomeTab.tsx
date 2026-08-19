"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { STAFF } from "./office";
import OfficeTab from "./OfficeTab";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "700", "800"] });

/* ══════════════════════════════════════════════════
   BALMYGARDEN 홈 — 벤토 그리드 대시보드 (2026 개인 대시보드 벤치마킹)
   CEO 지시(2026-08-19, 2차): 화면에 필요한 것만 남긴다 —
   ①상단(인사+CEO 결정 대기+팀)은 압축 ②트레이딩은 확대 ③업무화면은 별도 구획
   ④4트랙 현황·업무 수치 카드는 지금은 숨김(필요하면 CEO가 다시 요청).
   ══════════════════════════════════════════════════ */

type Portfolio = { total_asset?: number; cash?: number; eval_total?: number; total_pnl?: number };
type Signal = { symbol: string; action: "BUY" | "SELL" | "HOLD"; price?: string };
type TradingStatus = { portfolio?: Portfolio; signals?: Signal[]; updated?: string };
type LogEntry = { id: string; url: string; title: string; type: string; date: string };

const card = (): CSSProperties => ({
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "18px",
});

const label: CSSProperties = {
  fontSize: "10.5px",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 700,
};

const fmtWon = (n: number | undefined) => `${Math.round(n || 0).toLocaleString("ko-KR")}원`;

const ACTION_STYLE: Record<Signal["action"], { bg: string; fg: string }> = {
  BUY: { bg: "#dcfce7", fg: "#16a34a" },
  SELL: { bg: "#fef2f2", fg: "#dc2626" },
  HOLD: { bg: "#f1f5f9", fg: "#64748b" },
};

export default function HomeTab({ isMobile }: { isMobile: boolean }) {
  const [trading, setTrading] = useState<{ online: boolean; data?: TradingStatus; reason?: string }>({ online: false });
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/trading", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { online: boolean; data?: TradingStatus; reason?: string }) => alive && setTrading(j))
      .catch(() => {});
    fetch("/api/notion?limit=6", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { entries?: LogEntry[] }) => alive && setLog(j.entries ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const p = trading.data?.portfolio ?? {};
  const pnl = p.total_pnl ?? 0;
  const signals = (trading.data?.signals ?? []).slice(0, 6);
  const roster = STAFF.slice(0, 8);

  return (
    <div className={display.className}>
      {/* ── 압축 상단 — 인사 + CEO 결정 대기 + 팀, 한 줄에 묶어 세로 공간을 아낀다 ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.6fr) minmax(0,1fr)", gap: "12px", marginBottom: "14px" }}>
        <div
          style={{
            ...card(),
            background: "linear-gradient(135deg, #fef2f2 0%, #ffffff 55%)",
            borderColor: "#fecaca",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: isMobile ? "17px" : "19px", fontWeight: 700, color: "#1e293b" }}>
            안녕하세요, 김태을 대표님
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: "999px" }}>
              CEO 결정 대기
            </span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>Bridge v0.1 P-13 재독</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", lineHeight: 1.5, fontFamily: "inherit" }}>
            GOSARI EP 전체가 이 한 건에 멈춰 있습니다 — 재독 후 결과만 알려주시면 이어서 진행합니다.
          </div>
        </div>

        <div style={card()}>
          <div style={label}>팀 · {STAFF.length}명</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
            {roster.map((s) => (
              <div
                key={s.key}
                title={`${s.name} — ${s.role}`}
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: s.wear,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  boxShadow: "0 0 0 1px #e2e8f0",
                }}
              >
                {s.emoji}
              </div>
            ))}
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                border: "1px dashed #cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                color: "#94a3b8",
              }}
            >
              +{STAFF.length - roster.length}
            </div>
          </div>
        </div>
      </div>

      {/* ── 트레이딩 — 확대 ── */}
      <div style={{ ...card(), marginBottom: "14px", padding: isMobile ? "20px" : "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div style={label}>트레이딩</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: trading.online ? "#16a34a" : "#94a3b8" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: trading.online ? "#22C55E" : "#cbd5e1", boxShadow: trading.online ? "0 0 6px #22C55E" : "none" }} />
            {trading.online ? "LIVE · 자동매매 가동 중" : `오프라인 — ${trading.reason ?? "연결 대기"}`}
          </div>
        </div>

        {trading.online ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: "16px", marginBottom: signals.length ? "22px" : 0 }}>
              {[
                { name: "총 자산", value: fmtWon(p.total_asset), color: "#1e293b" },
                { name: "현금 잔고", value: fmtWon(p.cash), color: "#334155" },
                { name: "평가금액", value: fmtWon(p.eval_total), color: "#334155" },
                { name: "총 손익", value: `${pnl >= 0 ? "+" : ""}${fmtWon(pnl)}`, color: pnl >= 0 ? "#16a34a" : "#dc2626" },
              ].map((s) => (
                <div key={s.name}>
                  <div style={label}>{s.name}</div>
                  <div style={{ fontSize: isMobile ? "20px" : "26px", fontWeight: 800, marginTop: "6px", color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            {signals.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {signals.map((s) => (
                  <div
                    key={s.symbol}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", fontFamily: "monospace" }}>{s.symbol}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 7px", borderRadius: "999px", background: ACTION_STYLE[s.action].bg, color: ACTION_STYLE[s.action].fg }}>
                      {s.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: "13px", color: "#94a3b8" }}>트레이딩 서버 연결 대기 중</div>
        )}
      </div>

      {/* ── 업무 로그 ── */}
      <div style={{ ...card(), marginBottom: "26px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={label}>업무 로그</div>
          <div style={{ fontSize: "9px", color: "#c4b5fd", fontWeight: 700 }}>NOTION</div>
        </div>
        {log.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>최근 기록 없음</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "10px" }}>
            {log.map((e) => (
              <a
                key={e.id}
                href={e.url}
                target="_blank"
                rel="noreferrer"
                title="Notion에서 열기"
                style={{ display: "block", textDecoration: "none", padding: "10px 12px", background: "#f8fafc", borderRadius: "10px" }}
              >
                <div style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>
                  {e.date ? new Date(e.date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : ""}
                </div>
                <div style={{ fontSize: "12px", marginTop: "3px", lineHeight: 1.45, color: "#334155", fontFamily: "inherit" }}>{e.title}</div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── 업무화면 — 별도 구획 ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={label}>업무화면</div>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        </div>
        {/* 오피스뷰는 16:10 고정비라 전체 폭을 주면 화면을 혼자 다 먹는다 — 폭을 제한해
            위쪽 카드들과 비율을 맞춘다(CEO 지시: "비율도 조정"). */}
        <div style={{ maxWidth: isMobile ? "100%" : "980px" }}>
          <OfficeTab isMobile={isMobile} locked={false} />
        </div>
      </div>
    </div>
  );
}
