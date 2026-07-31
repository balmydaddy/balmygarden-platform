"use client";

import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";

/* ══════════════════════════════════════════════════
   TradingTab — BALMYGARDEN 트레이딩 탭
   데이터: /api/trading 프록시 → 실패 시 로컬 직결 폴백
   ══════════════════════════════════════════════════ */

type Action = "BUY" | "SELL" | "HOLD";

type Signal = {
  symbol: string;
  action: Action;
  price?: string;
  reason?: string;
  rsi?: number | string;
};

type Trade = { msg: string; ts?: string };
type LogEntry = { msg?: string; ts?: string; level?: string };

type Portfolio = {
  total_asset?: number;
  cash?: number;
  eval_total?: number;
  total_pnl?: number;
};

type TradingStatus = {
  portfolio?: Portfolio;
  signals?: Signal[];
  trades?: Trade[];
  log?: LogEntry[];
  updated?: string;
};

const CRYPTO = new Set(["BTC", "ETH", "XRP", "DOGE", "SOL"]);
const POLL_MS = 5000;

const fmt = (n: number | undefined) => Math.round(n || 0).toLocaleString("ko-KR");

/* 대시보드 공통 팔레트에 맞춘 카드 스타일 */
const card = (border = "#1e293b"): CSSProperties => ({
  background: "#0d1629",
  border: `1px solid ${border}`,
  borderRadius: "12px",
  padding: "16px",
});

const sectionLabel: CSSProperties = {
  fontSize: "10px",
  color: "#64748b",
  letterSpacing: "2px",
  marginBottom: "10px",
};

/* ── RSI 게이지 ── */
function RsiBadge({ value }: { value: number }) {
  const color = value <= 30 ? "#ef4444" : value >= 70 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
      <span style={{ fontSize: "10px", color: "#64748b", width: "26px" }}>RSI</span>
      <div style={{ flex: 1, height: "4px", background: "#1e293b", borderRadius: "2px" }}>
        <div
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            height: "100%",
            background: color,
            borderRadius: "2px",
            transition: "width .6s ease",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "11px",
          color,
          width: "26px",
          textAlign: "right",
        }}
      >
        {value.toFixed(0)}
      </span>
    </div>
  );
}

/* ── 매매 신호 배지 ── */
function SignalBadge({ action }: { action: Action }) {
  const map: Record<Action, { bg: string; fg: string }> = {
    BUY: { bg: "#052e16", fg: "#22c55e" },
    SELL: { bg: "#2d0a0a", fg: "#ef4444" },
    HOLD: { bg: "#1c1408", fg: "#f59e0b" },
  };
  const s = map[action] ?? map.HOLD;
  return (
    <span
      style={{
        fontSize: "10px",
        padding: "2px 8px",
        borderRadius: "4px",
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.fg}55`,
        fontWeight: 700,
        letterSpacing: "1px",
      }}
    >
      {action}
    </span>
  );
}

/* reason 문자열 파싱은 폴백일 뿐 — 서버가 rsi 필드를 주면 그것을 신뢰한다. */
function readRsi(signal: Signal): number {
  if (signal.rsi !== undefined && signal.rsi !== null) {
    const direct = Number(signal.rsi);
    if (Number.isFinite(direct)) return direct;
  }
  const m = (signal.reason || "").match(/RSI\D*([\d.]+)/i);
  const parsed = m ? Number(m[1]) : NaN;
  return Number.isFinite(parsed) ? parsed : 50;
}

function CoinCard({ signal }: { signal: Signal }) {
  const rsi = readRsi(signal);
  const flag = CRYPTO.has(signal.symbol) ? "🪙" : signal.price?.startsWith("$") ? "🇺🇸" : "🇰🇷";
  const glow =
    signal.action === "BUY"
      ? "0 0 10px rgba(34,197,94,.25)"
      : signal.action === "SELL"
        ? "0 0 10px rgba(239,68,68,.25)"
        : "none";

  return (
    <div style={{ ...card("#1e3a5f"), padding: "12px 14px", boxShadow: glow }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <span
          style={{ fontFamily: "monospace", fontSize: "15px", color: "#a5b4fc", fontWeight: 700 }}
        >
          {signal.symbol}
        </span>
        <span style={{ fontSize: "10px" }}>{flag}</span>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: "17px", color: "#e2e8f0", marginBottom: "6px" }}>
        {signal.price || "--"}
      </div>
      <SignalBadge action={signal.action} />
      <RsiBadge value={rsi} />
      <div style={{ fontSize: "10px", color: "#475569", marginTop: "5px", lineHeight: 1.3 }}>
        {(signal.reason || "").slice(0, 45)}
      </div>
    </div>
  );
}

export default function TradingTab({ isMobile }: { isMobile: boolean }) {
  const [data, setData] = useState<TradingStatus | null>(null);
  const [online, setOnline] = useState(false);
  const [reason, setReason] = useState("연결 확인 중…");
  const [updated, setUpdated] = useState("--:--:--");
  const alive = useRef(true);

  const load = useCallback(async () => {
    /* 1차: 서버 프록시. 배포본에서 mixed content 차단을 피하는 유일한 경로. */
    try {
      const res = await fetch("/api/trading", { cache: "no-store" });
      const json = (await res.json()) as {
        online: boolean;
        data?: TradingStatus;
        reason?: string;
      };
      if (json.online && json.data) {
        if (!alive.current) return;
        setData(json.data);
        setOnline(true);
        setUpdated(json.data.updated || new Date().toLocaleTimeString("ko-KR"));
        return;
      }
      if (alive.current) setReason(json.reason || "트레이딩 서버 응답 없음");
    } catch {
      if (alive.current) setReason("프록시 호출 실패");
    }

    /* 2차: 로컬 개발 중에는 브라우저에서 직접 붙는 게 더 빠르고 확실하다. */
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    if (host === "localhost" || host === "127.0.0.1") {
      try {
        const res = await fetch("http://localhost:5000/api/status", {
          signal: AbortSignal.timeout(4000),
          cache: "no-store",
        });
        const json = (await res.json()) as TradingStatus;
        if (!alive.current) return;
        setData(json);
        setOnline(true);
        setUpdated(json.updated || new Date().toLocaleTimeString("ko-KR"));
        return;
      } catch {
        /* 폴백도 실패 — 아래에서 오프라인 처리 */
      }
    }
    if (alive.current) setOnline(false);
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    /* 탭이 화면에 없을 때 5초마다 때리는 건 낭비 — 보일 때만 폴링한다. */
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive.current = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const p = data?.portfolio ?? {};
  const trades = data?.trades ?? [];
  const logs = data?.log ?? [];
  const pnl = p.total_pnl ?? 0;

  /* 같은 종목 신호가 여러 번 오면 최신 것만 남긴다. */
  const uniq: Record<string, Signal> = {};
  (data?.signals ?? []).forEach((s) => {
    uniq[s.symbol] = s;
  });
  const signals = Object.values(uniq);

  const stats = [
    { label: "총 자산", value: `${fmt(p.total_asset)}원`, color: "#f59e0b" },
    { label: "현금 잔고", value: `${fmt(p.cash)}원`, color: "#38bdf8" },
    { label: "평가금액", value: `${fmt(p.eval_total)}원`, color: "#22c55e" },
    {
      label: "총 손익",
      value: `${pnl >= 0 ? "+" : ""}${fmt(pnl)}원`,
      color: pnl >= 0 ? "#22c55e" : "#ef4444",
    },
  ];

  return (
    <div>
      {/* ── 상태 바 ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: online ? "#22c55e" : "#ef4444",
              boxShadow: online ? "0 0 6px #22c55e" : "none",
            }}
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: isMobile ? "11px" : "12px",
              color: online ? "#22c55e" : "#ef4444",
            }}
          >
            {online ? "LIVE · 자동매매 가동 중" : `오프라인 — ${reason}`}
          </span>
        </div>
        <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#475569" }}>
          갱신 {updated}
        </span>
      </div>

      {/* 오프라인 원인과 조치를 같이 적는다 — 상태만 보여주면 CEO가 원인을 못 찾는다. */}
      {!online && (
        <div
          style={{
            ...card("#7f1d1d"),
            marginBottom: "14px",
            fontSize: "12px",
            color: "#fca5a5",
            lineHeight: 1.7,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>연결 조건</div>
          <div>· 로컬: `python server.py` 실행 후 localhost:3000 접속 시 직결</div>
          <div>· 배포본: 트레이딩 서버를 터널(ngrok·cloudflared)로 노출하고</div>
          <div style={{ paddingLeft: "10px" }}>
            Vercel 환경변수 <code style={{ color: "#fde68a" }}>TRADING_SERVER_URL</code> 에 그 HTTPS 주소 등록
          </div>
          <div style={{ marginTop: "6px", color: "#94a3b8" }}>
            배포본이 localhost를 직접 호출하면 브라우저가 mixed content로 차단한다.
          </div>
        </div>
      )}

      {/* ── 포트폴리오 ── */}
      <div style={{ ...card(), marginBottom: "14px" }}>
        <div style={sectionLabel}>📊 포트폴리오</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
            gap: "12px",
          }}
        >
          {stats.map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>{label}</div>
              <div style={{ fontFamily: "monospace", fontSize: "14px", color, fontWeight: 700 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 실시간 신호 ── */}
      <div style={{ marginBottom: "14px" }}>
        <div style={sectionLabel}>📡 실시간 신호</div>
        {signals.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2,1fr)"
                : "repeat(auto-fill,minmax(160px,1fr))",
              gap: "10px",
            }}
          >
            {signals.map((s) => (
              <CoinCard key={s.symbol} signal={s} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#475569", fontSize: "13px", padding: "20px" }}>
            {online ? "신호 없음" : "서버 연결 후 표시됩니다"}
          </div>
        )}
      </div>

      {/* ── 체결 내역 + 시스템 로그 ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "12px",
        }}
      >
        <div style={card()}>
          <div style={sectionLabel}>⚔️ 체결 내역</div>
          {trades.length > 0 ? (
            trades.slice(-6).map((t, i) => (
              <div
                key={`${t.ts}-${i}`}
                style={{
                  display: "flex",
                  gap: "8px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid #1e293b",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>{t.msg.includes("매수") ? "🟢" : "🔴"}</span>
                <div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: 1.4 }}>
                    {t.msg.slice(0, 50)}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#475569" }}>
                    {t.ts?.slice(11, 19)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", color: "#475569", fontSize: "12px", padding: "12px" }}>
              체결 내역 없음
            </div>
          )}
        </div>

        <div style={{ ...card(), maxHeight: "220px", overflow: "hidden" }}>
          <div style={sectionLabel}>📋 시스템 로그</div>
          <div
            style={{ fontFamily: "monospace", fontSize: "10px", overflowY: "auto", maxHeight: "170px" }}
          >
            {logs.length > 0 ? (
              logs.slice(-15).map((l, i) => (
                <div
                  key={`${l.ts}-${i}`}
                  style={{
                    paddingBottom: "3px",
                    lineHeight: 1.4,
                    color:
                      l.level === "ERROR"
                        ? "#ef4444"
                        : l.msg?.includes("매수")
                          ? "#22c55e"
                          : l.msg?.includes("매도")
                            ? "#f87171"
                            : "#475569",
                  }}
                >
                  <span style={{ color: "#334155" }}>{l.ts?.slice(11, 19)} </span>
                  {(l.msg || "").slice(0, 60)}
                </div>
              ))
            ) : (
              <div style={{ color: "#475569", fontSize: "12px" }}>로그 없음</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
