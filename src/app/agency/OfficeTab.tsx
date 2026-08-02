"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { ZONES, STAFF, ERRANDS, MEETINGS, seatIn, type ZoneId, type Staff } from "./office";
import { MEMORY } from "./memory";

/* ══════════════════════════════════════════════════
   BALMYGARDEN 오피스 — 2D 근무 현황
   캐릭터가 구역을 오가며 업무한다. 클릭하면 지시할 수 있다.
   ══════════════════════════════════════════════════ */

type Activity = "대기" | "이동" | "업무" | "회의";

type Agent = {
  staff: Staff;
  x: number;
  y: number;
  at: ZoneId;
  activity: Activity;
  task: string;
};

type LogLine = { id: number; t: string; who: string; color: string; text: string };

const TICK_MS = 4000; // 한 사이클 = 4초
const MAX_LOG = 40;

const card = (border = "#1e293b"): CSSProperties => ({
  background: "#0d1629",
  border: `1px solid ${border}`,
  borderRadius: "12px",
  padding: "14px",
});

const nowText = () =>
  new Date().toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

function initialAgents(): Agent[] {
  return STAFF.map((s) => {
    const zone = ZONES.find((z) => z.id === s.home)!;
    const mates = STAFF.filter((m) => m.home === s.home);
    const seat = seatIn(zone, mates.findIndex((m) => m.key === s.key), mates.length);
    return { staff: s, x: seat.x, y: seat.y, at: s.home, activity: "대기", task: "" };
  });
}

export default function OfficeTab({ isMobile }: { isMobile: boolean }) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [log, setLog] = useState<LogLine[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [order, setOrder] = useState("");
  const [sending, setSending] = useState(false);
  const [meeting, setMeeting] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const logId = useRef(0);
  const tick = useRef(0);
  /* updater 안에서 부수효과를 쓰지 않으려고 최신 상태를 따로 들고 있는다. */
  const agentsRef = useRef<Agent[]>(agents);
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  const addLog = useCallback((who: string, color: string, text: string) => {
    logId.current += 1;
    setLog((p) => [{ id: logId.current, t: nowText(), who, color, text }, ...p].slice(0, MAX_LOG));
  }, []);

  /* 구역으로 인원을 재배치한다. 같은 구역에 있는 인원끼리 자리를 나눠 앉는다. */
  const placeAll = useCallback((list: Agent[]): Agent[] => {
    const byZone = new Map<ZoneId, Agent[]>();
    list.forEach((a) => {
      const arr = byZone.get(a.at) ?? [];
      arr.push(a);
      byZone.set(a.at, arr);
    });
    return list.map((a) => {
      const zone = ZONES.find((z) => z.id === a.at)!;
      const mates = byZone.get(a.at)!;
      const seat = seatIn(zone, mates.findIndex((m) => m.staff.key === a.staff.key), mates.length);
      return { ...a, x: seat.x, y: seat.y };
    });
  }, []);

  /* ── 자동 업무 루프 ── */
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      tick.current += 1;

      /* 6사이클마다 회의를 소집한다. */
      if (tick.current % 6 === 0) {
        const m = MEETINGS[Math.floor(Math.random() * MEETINGS.length)];
        setMeeting(m.title);
        addLog("회의실", "#f59e0b", `${m.title} 소집 — ${m.members.join(", ")}`);
        setAgents((prev) =>
          placeAll(
            prev.map((a) =>
              m.members.includes(a.staff.key)
                ? { ...a, at: "meeting" as ZoneId, activity: "회의", task: m.title }
                : a
            )
          )
        );
        return;
      }

      /* 회의 다음 사이클에 해산한다. */
      if (tick.current % 6 === 1 && meeting) {
        addLog("회의실", "#f59e0b", `${meeting} 종료 — 각자 복귀`);
        setMeeting(null);
        setAgents((prev) =>
          placeAll(
            prev.map((a) =>
              a.activity === "회의"
                ? { ...a, at: a.staff.home, activity: "대기", task: "" }
                : a
            )
          )
        );
        return;
      }

      /* 평시: 한 명이 심부름을 간다.
         제자리 배정은 걸러낸다 — 움직이지 않으면 화면에 아무 일도 일어나지 않는다. */
      const cur = agentsRef.current;
      const movable = ERRANDS.filter((e) => {
        const a = cur.find((x) => x.staff.key === e.staff);
        return a && a.activity !== "회의" && a.at !== e.to;
      });
      if (movable.length === 0) return;
      const errand = movable[Math.floor(Math.random() * movable.length)];
      const target = cur.find((a) => a.staff.key === errand.staff)!;

      addLog(errand.staff, target.staff.color, `${errand.task} → ${ZONES.find((z) => z.id === errand.to)!.name}`);

      setAgents((prev) =>
        placeAll(
          prev.map((a) =>
            a.staff.key === errand.staff
              ? { ...a, at: errand.to, activity: "이동", task: errand.task }
              : a.activity === "이동"
                ? { ...a, at: a.staff.home, activity: "대기", task: "" }
                : a
          )
        )
      );
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, meeting, addLog, placeAll]);

  /* ── 지시 전송 ── */
  const send = async () => {
    if (!selected || !order.trim() || sending) return;
    const agent = agents.find((a) => a.staff.key === selected)!;
    setSending(true);
    addLog("CEO", "#a5b4fc", `→ ${selected}: ${order.trim()}`);

    setAgents((prev) =>
      prev.map((a) => (a.staff.key === selected ? { ...a, activity: "업무", task: order.trim() } : a))
    );

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt:
            `당신은 BALMYGARDEN 에이전시의 ${agent.staff.name}입니다. 담당: ${agent.staff.role}.\n` +
            `한국어로, 300자 이내로, 액션 아이템 중심으로 답한다.\n\n` +
            `[BALMYGARDEN 기업 컨텍스트]\n` +
            MEMORY.map((m) => `[${m.tag}] ${m.txt}`).join("\n"),
          userMessage: order.trim(),
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (data.text) {
        addLog(selected, agent.staff.color, data.text.slice(0, 160));
      } else {
        addLog(selected, "#ef4444", `응답 실패 — ${data.error ?? res.status}`);
      }
    } catch (e) {
      addLog(selected, "#ef4444", `호출 실패 — ${(e as Error).message}`);
    } finally {
      setSending(false);
      setOrder("");
    }
  };

  const sel = agents.find((a) => a.staff.key === selected) ?? null;

  return (
    <div>
      {/* ── 상단 바 ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#a5b4fc" }}>
            🏢 BALMYGARDEN 오피스
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {meeting ? `회의 중 — ${meeting}` : `근무 중 · ${STAFF.length}명`}
          </div>
        </div>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            border: `1px solid ${running ? "#22c55e" : "#475569"}`,
            background: running ? "#22c55e22" : "#0d1629",
            color: running ? "#22c55e" : "#64748b",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {running ? "● 자동 진행 중" : "○ 일시정지"}
        </button>
      </div>

      {/* ── 오피스 평면도 ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: isMobile ? "3 / 4" : "16 / 10",
          background: "#0a1120",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "12px",
        }}
      >
        {/* 바닥 격자 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(#12203a 1px, transparent 1px), linear-gradient(90deg, #12203a 1px, transparent 1px)",
            backgroundSize: "5% 8%",
            opacity: 0.5,
          }}
        />

        {/* 구역 */}
        {ZONES.map((z) => {
          const here = agents.filter((a) => a.at === z.id).length;
          const active = z.id === "meeting" && meeting;
          return (
            <div
              key={z.id}
              style={{
                position: "absolute",
                left: `${z.x}%`,
                top: `${z.y}%`,
                width: `${z.w}%`,
                height: `${z.h}%`,
                background: active ? `${z.color}22` : "#0f1c33",
                border: `1px solid ${active ? z.color : z.color + "44"}`,
                borderRadius: "10px",
                boxShadow: active ? `0 0 16px ${z.color}44` : "none",
                transition: "background .4s, box-shadow .4s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "5px",
                  left: "8px",
                  fontSize: isMobile ? "9px" : "10px",
                  color: z.color,
                  fontWeight: 700,
                  letterSpacing: "1px",
                }}
              >
                {z.emoji} {z.name}
                {here > 0 && <span style={{ color: "#475569", marginLeft: "5px" }}>{here}</span>}
              </div>
            </div>
          );
        })}

        {/* 캐릭터 */}
        {agents.map((a) => {
          const isSel = a.staff.key === selected;
          return (
            <button
              key={a.staff.key}
              onClick={() => setSelected(isSel ? null : a.staff.key)}
              title={`${a.staff.name} — ${a.staff.role}`}
              style={{
                position: "absolute",
                left: `${a.x}%`,
                top: `${a.y}%`,
                transform: "translate(-50%,-50%)",
                transition: "left .9s cubic-bezier(.4,0,.2,1), top .9s cubic-bezier(.4,0,.2,1)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                zIndex: isSel ? 5 : 2,
              }}
            >
              <div
                style={{
                  width: isMobile ? "20px" : "26px",
                  height: isMobile ? "20px" : "26px",
                  borderRadius: "50%",
                  background: a.staff.color + "33",
                  border: `2px solid ${isSel ? "#fff" : a.staff.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? "10px" : "13px",
                  boxShadow:
                    a.activity === "회의"
                      ? "0 0 10px #f59e0b"
                      : a.activity === "업무"
                        ? `0 0 8px ${a.staff.color}`
                        : "none",
                }}
              >
                {a.staff.emoji}
              </div>
              <span
                style={{
                  fontSize: isMobile ? "7px" : "9px",
                  color: isSel ? "#fff" : a.staff.color,
                  background: "#0a1120cc",
                  padding: "0 3px",
                  borderRadius: "3px",
                  whiteSpace: "nowrap",
                  fontWeight: isSel ? 700 : 400,
                }}
              >
                {a.staff.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 지시창 + 로그 ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "12px",
          alignItems: "start",
        }}
      >
        {/* 지시창 */}
        <div style={card(selected ? "#6366F1" : "#1e293b")}>
          <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "2px", marginBottom: "8px" }}>
            🎙️ 지시창
          </div>

          {sel ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                background: "#111827",
                borderRadius: "8px",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "16px" }}>{sel.staff.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", color: sel.staff.color, fontWeight: 700 }}>
                  {sel.staff.name}
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>{sel.staff.role}</div>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  background: "#1e293b",
                  color: "#94a3b8",
                }}
              >
                {sel.activity}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "#475569", padding: "10px 0", lineHeight: 1.6 }}>
              평면도에서 담당자를 클릭하면 여기서 직접 지시할 수 있다.
            </div>
          )}

          <textarea
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder={sel ? `${sel.staff.name}에게 지시…` : "담당자를 먼저 선택한다"}
            disabled={!sel || sending}
            style={{
              width: "100%",
              minHeight: "70px",
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "6px",
              color: "#e2e8f0",
              fontSize: "12px",
              padding: "8px 10px",
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={send}
            disabled={!sel || !order.trim() || sending}
            style={{
              width: "100%",
              marginTop: "7px",
              padding: "9px",
              borderRadius: "6px",
              border: "none",
              cursor: !sel || !order.trim() || sending ? "not-allowed" : "pointer",
              background: !sel || !order.trim() || sending ? "#1e293b" : "#6366F1",
              color: !sel || !order.trim() || sending ? "#475569" : "#fff",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            {sending ? "전송 중…" : "지시 전송"}
          </button>

          {sel?.task && (
            <div style={{ marginTop: "8px", fontSize: "10px", color: "#64748b", lineHeight: 1.5 }}>
              현재 업무: {sel.task}
            </div>
          )}
        </div>

        {/* 업무 로그 */}
        <div style={{ ...card(), maxHeight: "300px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "2px", marginBottom: "8px" }}>
            📋 업무 로그
          </div>
          <div style={{ overflowY: "auto", flex: 1, minHeight: "120px" }}>
            {log.length === 0 ? (
              <div style={{ fontSize: "11px", color: "#475569" }}>업무 시작 대기 중…</div>
            ) : (
              log.map((l) => (
                <div
                  key={l.id}
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.6,
                    paddingBottom: "4px",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <span style={{ color: "#334155", fontFamily: "monospace", flexShrink: 0 }}>{l.t}</span>
                  <span style={{ color: l.color, fontWeight: 700, flexShrink: 0 }}>{l.who}</span>
                  <span style={{ color: "#94a3b8" }}>{l.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
