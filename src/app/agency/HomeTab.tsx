"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { STAFF } from "./office";
import { resolveStaffKey, staffColor } from "./staffLog";
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
type Blocker = { id: string; title: string; priority: string; status: string; owner: string };
type TaskStats =
  | {
      ok: true;
      total: number;
      done: number;
      inProgress: number;
      notStarted: number;
      blockers: Blocker[];
      /* 잠금해제되지 않은 요청에는 서버가 항목 내용을 빼고 이 값을 세운다 —
         이 경우의 빈 배열은 "없음"이 아니라 "안 보여줌"이다. */
      blockersGated?: boolean;
    }
  | { ok: false; error: string };

/* 상시 가동 시스템의 대시보드는 "언제 기준 화면인가"가 보여야 한다 —
   열어둔 채 방치하면 낡은 숫자를 현재로 오독하게 된다. */
const POLL_MS = 60_000;


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
  const [log, setLog] = useState<LogEntry[] | null>(null); // null = 아직 못 불러옴(실패/로딩), [] = 진짜 없음
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;

    /* 실패와 "데이터 없음"은 화면에서 반드시 구분돼야 한다 — 예전엔 둘 다 "최근 기록
       없음"으로 보여서 연동이 끊긴 걸 알 방법이 없었다.
       이 API들은 실패해도 HTTP 500 + {error} JSON을 돌려준다 — 즉 .catch가 안 걸린다.
       r.ok를 직접 보지 않으면 "실패"가 "데이터 없음"으로 둔갑하고, 연동이 끊긴 상태에서
       화면은 평온해 보인다. 세 요청 모두 같은 기준으로 막는다. */
    const asJson = async (url: string) => {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    };

    const load = () => {
      /* 트레이딩은 502/503 본문에도 의미가 있다({online:false, reason} — 왜 못 붙었는지).
         그래서 여기만 r.ok를 따지지 않고 본문을 살려 쓴다. */
      const trading$ = fetch("/api/trading", { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { online: boolean; data?: TradingStatus; reason?: string }) => {
          if (alive) setTrading(j);
          return true;
        })
        .catch(() => {
          if (alive) setTrading({ online: false, reason: "상태 조회 실패" });
          return false;
        });

      const log$ = asJson("/api/notion?limit=6")
        .then((j: { entries?: LogEntry[] }) => {
          const ok = Array.isArray(j?.entries);
          if (alive) setLog(ok ? j.entries! : null);
          return ok; // 형태가 틀리면 실패다 — 이걸 true로 돌리면 기준시각이 헛돈다
        })
        .catch(() => {
          if (alive) setLog(null);
          return false;
        });

      /* 성공 형태(ok:true)가 아니면 전부 실패로 취급 — 환경변수 미설정 시 이 API는
         {error}만 반환하는데, 그걸 "블로커 0건 성공"으로 오인하면 연동이 끊긴 상태에서
         "결정 대기 항목 없습니다"라고 안심시키는 최악의 오표시가 된다. */
      const stats$ = asJson("/api/notion?stats=1")
        .then((j: Partial<TaskStats> & { error?: string }) => {
          if (!alive) return false;
          const ok = j && (j as { ok?: boolean }).ok === true;
          setStats(ok ? (j as TaskStats) : { ok: false, error: j?.error ?? "응답 형식 오류" });
          return ok;
        })
        .catch(() => {
          if (alive) setStats({ ok: false, error: "조회 실패" });
          return false;
        });

      /* "몇 시 기준"은 실제로 뭔가 받아온 뒤에만 갱신한다. 요청 직후에 찍으면 전부
         실패해도 시각만 최신으로 올라가 낡은 화면을 최신으로 오독하게 된다.
         (allSettled는 .catch로 삼킨 실패까지 fulfilled로 세므로 성공 여부를 값으로
         돌려받아 직접 확인한다.) */
      Promise.all([trading$, log$, stats$]).then((results) => {
        if (alive && results.some(Boolean)) setSyncedAt(new Date());
      });
    };

    load();
    const id = setInterval(() => {
      if (!document.hidden) load(); // 탭이 안 보일 때까지 계속 때리지 않는다
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const p = trading.data?.portfolio ?? {};
  const pnl = p.total_pnl ?? 0;
  const signals = (trading.data?.signals ?? []).slice(0, 6);
  const roster = STAFF.slice(0, 8);
  const blockers = stats?.ok ? stats.blockers : [];

  return (
    <div className={display.className}>
      {/* ── 압축 상단 — 인사 + CEO 결정 대기 + 팀, 한 줄에 묶어 세로 공간을 아낀다 ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.6fr) minmax(0,1fr)", gap: "12px", marginBottom: "14px" }}>
        {/* CEO 개입 대기 항목은 Notion 미결 사항에서 실시간으로 가져온다. 하드코딩하면
            해소된 뒤에도 계속 붉게 남고 새 P0가 생겨도 안 뜬다 — 붉은 표시를 습관적으로
            무시하게 만드는 원인이라, 0건이면 조용한 상태로 바뀌게 했다. */}
        <div
          style={{
            ...card(),
            background: blockers.length
              ? "linear-gradient(135deg, #fef2f2 0%, #ffffff 55%)"
              : "#ffffff",
            borderColor: blockers.length ? "#fecaca" : "#e2e8f0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: isMobile ? "17px" : "19px", fontWeight: 700, color: "#1e293b" }}>
            안녕하세요, 김태을 대표님
          </div>

          {stats === null ? (
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "10px" }}>미결 사항 확인 중…</div>
          ) : stats.ok === false ? (
            <div style={{ fontSize: "12px", color: "#b45309", marginTop: "10px", lineHeight: 1.5 }}>
              미결 사항을 불러오지 못했습니다 ({stats.error})
            </div>
          ) : stats.blockersGated ? (
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "10px", lineHeight: 1.5 }}>
              미결 항목 내용은 서버 인증 후 표시됩니다 — 우측 상단 자물쇠를 눌러 비밀번호를 입력하세요.
              (진행 {stats.inProgress}건 · 미진행 {stats.notStarted}건)
            </div>
          ) : blockers.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "10px", lineHeight: 1.5, fontFamily: "inherit" }}>
              지금 대표님 결정을 기다리는 항목은 없습니다. 진행 {stats.inProgress}건 · 미진행 {stats.notStarted}건은 팀이 처리 중입니다.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              {blockers.slice(0, 3).map((b, i) => (
                <div key={b.id || b.title || i} style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: "999px" }}>
                    {b.priority || b.status}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{b.title}</span>
                  {b.owner && <span style={{ fontSize: "11px", color: "#94a3b8" }}>{b.owner}</span>}
                </div>
              ))}
              {blockers.length > 3 && (
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>외 {blockers.length - 3}건</div>
              )}
            </div>
          )}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <div style={label}>업무 로그</div>
            {/* "오늘 N건"은 넣지 않는다 — 최근 6건만 받아오므로 하루 12~15건을
                쓰는 cron 기준으로는 항상 절단된 수치가 되어 사실과 다르다. */}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {syncedAt && (
              <span style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>
                {syncedAt.toLocaleTimeString("ko-KR", { hour12: false })} 기준
              </span>
            )}
            <span style={{ fontSize: "9px", color: "#c4b5fd", fontWeight: 700 }}>NOTION</span>
          </div>
        </div>
        {log === null ? (
          <div style={{ fontSize: "12px", color: "#b45309" }}>불러오기 실패 — Notion 연동 확인 필요</div>
        ) : log.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>최근 기록 없음</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "10px" }}>
            {log.map((e) => {
              const who = resolveStaffKey(e.title);
              return (
                <a
                  key={e.id}
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  title="Notion에서 열기"
                  style={{ display: "block", textDecoration: "none", padding: "10px 12px", background: "#f8fafc", borderRadius: "10px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {who && (
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "#ffffff",
                          background: staffColor(who),
                          padding: "1px 6px",
                          borderRadius: "999px",
                        }}
                      >
                        {who}
                      </span>
                    )}
                    <span style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>
                      {e.date ? new Date(e.date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", marginTop: "5px", lineHeight: 1.45, color: "#334155", fontFamily: "inherit" }}>{e.title}</div>
                </a>
              );
            })}
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
