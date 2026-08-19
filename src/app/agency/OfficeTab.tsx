"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { ZONES, STAFF, MEETINGS, seatIn, type ZoneId, type Staff } from "./office";
import { MEMORY } from "./memory";

/* ══════════════════════════════════════════════════
   BALMYGARDEN 오피스 — 탑다운 근무 화면
   방·책상·의자 위에서 캐릭터가 오가며 업무한다.
   ══════════════════════════════════════════════════ */

type Activity = "대기" | "이동" | "업무" | "회의";

type Agent = {
  staff: Staff;
  x: number;
  y: number;
  at: ZoneId;
  activity: Activity;
  task: string;
  say: string;
};

type LogLine = { id: number; t: string; who: string; color: string; text: string };
type ChatMsg = { role: "user" | "agent"; text: string; t: string };
type Threads = Record<string, ChatMsg[]>;

const POLL_MS = 20000;
const RETURN_DELAY_MS = 7000;
const MAX_LOG = 40;
const THREADS_KEY = "balmygarden_office_threads_v1";

/* Notion 로그 제목("[소스] 제목")에서 실제 담당자 key를 추론한다.
   형식이 케이스마다 다르다 — 대괄호 소스(PHANTOM 등), "(NAME)" 접미사
   (블로그팀 INK/CHECK/CHIEF/AEGIS), "NAME — 일일 업무"(dailyStaff),
   그 외엔 제목 안에 어떤 STAFF key든 등장하는지로 최후 폴백. */
function resolveStaffKey(title: string): string | undefined {
  const bracket = title.match(/^\[([^\]]+)\]/)?.[1];
  if (bracket && STAFF.some((s) => s.key === bracket)) return bracket;
  const paren = title.match(/\(([A-Z]+)\)\s*$/)?.[1];
  if (paren && STAFF.some((s) => s.key === paren)) return paren;
  const dash = title.match(/^([A-Z]+)\s*—/)?.[1];
  if (dash && STAFF.some((s) => s.key === dash)) return dash;
  return STAFF.find((s) => title.includes(s.key))?.key;
}

const stripSource = (title: string) => title.replace(/^\[[^\]]+\]\s*/, "");

/* 실제 로그 제목 키워드로 자연스러운 말풍선 한 줄을 고른다 — 실제 내용
   전문을 다 보여주는 대신, 어떤 단계 업무인지만 짧게 티 낸다. */
function bubbleFor(title: string): string {
  if (title.includes("초안")) return "초안 작성했어요";
  if (title.includes("법무") || title.includes("AEGIS")) return "법무 확인했어요";
  if (title.includes("발행")) return "발행 완료했어요";
  if (title.includes("검토") && (title.includes("최종") || title.includes("승인"))) return "검토 결과 전달";
  if (title.includes("검토")) return "검토했습니다";
  if (title.includes("일일 업무")) return "오늘 업무 보고드려요";
  if (title.includes("논의") || title.includes("PRP")) return "의견 냈습니다";
  if (title.includes("독려") || title.includes("진행")) return "진행상황 확인했어요";
  return "업무 완료했습니다";
}

/* 담당자 홈존 → Notion Track. 사업별 보드와 값이 일치해야 한다. */
const ZONE_TRACK: Partial<Record<ZoneId, string>> = {
  music: "음악",
  app: "영수증앱",
  game: "게임",
};

const WALL = "#1a1410";

const card = (border = "#e2e8f0"): CSSProperties => ({
  background: "#ffffff",
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
    return { staff: s, x: seat.x, y: seat.y, at: s.home, activity: "대기", task: "", say: "" };
  });
}

/* 대화 이력은 새로고침해도 남아야 한다 — Notion에도 저장하지만(save_chat),
   화면에 바로 다시 보여주려면 브라우저에도 들고 있어야 한다. */
function loadThreads(): Threads {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(THREADS_KEY);
    return raw ? (JSON.parse(raw) as Threads) : {};
  } catch {
    return {};
  }
}

function saveThreads(t: Threads) {
  try {
    window.localStorage.setItem(THREADS_KEY, JSON.stringify(t));
  } catch {
    /* 저장 공간 부족 등은 화면 동작에 영향 주지 않게 무시 */
  }
}

/* ── 사람 캐릭터 ── 각진 사각 몸통 대신 둥근 캡슐형 + 작은 팔로 부드럽게. */
function Person({
  a,
  selected,
  scale,
  onClick,
}: {
  a: Agent;
  selected: boolean;
  scale: number;
  onClick: () => void;
}) {
  const head = 7.5 * scale;
  const bodyW = 9 * scale;
  const bodyH = 10 * scale;
  const armSize = 3.4 * scale;

  return (
    <button
      onClick={onClick}
      title={`${a.staff.name} — ${a.staff.role}`}
      style={{
        position: "absolute",
        left: `${a.x}%`,
        top: `${a.y}%`,
        transform: "translate(-50%,-100%)",
        transition: "left 1s cubic-bezier(.45,0,.25,1), top 1s cubic-bezier(.45,0,.25,1)",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: selected ? 40 : 20,
      }}
    >
      {/* 말풍선 */}
      {a.say && (
        <div
          style={{
            marginBottom: "3px",
            padding: "3px 7px",
            background: "#fefce8",
            color: "#1c1917",
            fontSize: `${8 * scale}px`,
            borderRadius: "10px",
            whiteSpace: "nowrap",
            border: "1px solid #a8a29e",
            fontWeight: 600,
            maxWidth: "120px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {a.say}
        </div>
      )}

      {/* 머리 */}
      <div
        style={{
          width: `${head}px`,
          height: `${head}px`,
          borderRadius: "50%",
          background: "#e8c39e",
          border: `1px solid ${selected ? "#fff" : "#00000055"}`,
          boxShadow: selected
            ? "0 0 0 2px #fff"
            : "inset -2px -2px 3px #00000022, inset 2px 2px 3px #ffffff33",
          zIndex: 2,
        }}
      />
      {/* 몸통 + 팔 */}
      <div style={{ position: "relative", marginTop: `-${1.5 * scale}px` }}>
        {/* 팔(왼) */}
        <div
          style={{
            position: "absolute",
            left: `-${armSize * 0.55}px`,
            top: `${bodyH * 0.1}px`,
            width: `${armSize}px`,
            height: `${armSize}px`,
            borderRadius: "50%",
            background: a.staff.wear,
            border: "1px solid #00000044",
          }}
        />
        {/* 팔(오) */}
        <div
          style={{
            position: "absolute",
            right: `-${armSize * 0.55}px`,
            top: `${bodyH * 0.1}px`,
            width: `${armSize}px`,
            height: `${armSize}px`,
            borderRadius: "50%",
            background: a.staff.wear,
            border: "1px solid #00000044",
          }}
        />
        {/* 몸통 — 둥근 캡슐형 */}
        <div
          style={{
            width: `${bodyW}px`,
            height: `${bodyH}px`,
            background: a.staff.wear,
            borderRadius: "48% 48% 34% 34%",
            border: "1px solid #00000055",
            boxShadow:
              a.activity === "회의"
                ? "0 0 8px #f59e0b"
                : a.activity === "업무"
                  ? `0 0 6px ${a.staff.color}`
                  : "none",
          }}
        />
      </div>
      {/* 이름표 */}
      <span
        style={{
          marginTop: "2px",
          fontSize: `${7 * scale}px`,
          color: selected ? "#fff" : "#e7e5e4",
          background: "#000000aa",
          padding: "1px 5px",
          borderRadius: "8px",
          whiteSpace: "nowrap",
          fontWeight: selected ? 700 : 500,
          letterSpacing: "-0.2px",
        }}
      >
        {a.staff.name}
      </span>
    </button>
  );
}

export default function OfficeTab({ isMobile, locked = false }: { isMobile: boolean; locked?: boolean }) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [log, setLog] = useState<LogLine[]>([]);
  const [threads, setThreads] = useState<Threads>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [order, setOrder] = useState("");
  const [sending, setSending] = useState(false);
  const [meeting, setMeeting] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const logId = useRef(0);
  const lastSeenRef = useRef<string>("");

  useEffect(() => {
    setThreads(loadThreads());
  }, []);

  const scale = isMobile ? 1.1 : 1.6;

  const addLog = useCallback((who: string, color: string, text: string) => {
    logId.current += 1;
    setLog((p) => [{ id: logId.current, t: nowText(), who, color, text }, ...p].slice(0, MAX_LOG));
  }, []);

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

  /* ── 실제 업무 연동 ── 랜덤 시뮬레이션 대신, 서버에서 실제로 일어난 업무
     (cron 일일 배치의 save_log 기록 — SCOUT/블로그팀/PHANTOM/dailyStaff 등)를
     Notion에서 폴링해 그게 있을 때만 담당자를 움직인다. 아무 일도 없으면
     화면도 조용하다 — 그게 맞다(CEO 지시 2026-08-19). */
  const logRealEntry = useCallback(
    (e: { title: string }) => {
      const key = resolveStaffKey(e.title);
      const staff = STAFF.find((s) => s.key === key);
      addLog(key ?? e.title.match(/^\[([^\]]+)\]/)?.[1] ?? "업무", staff?.color ?? "#94a3b8", stripSource(e.title));
    },
    [addLog]
  );

  const animateRealEvent = useCallback(
    (e: { title: string }) => {
      logRealEntry(e);

      /* 3일 주기 PRP 시스템 논의는 실제로 여러 명이 동시에 참여하는
         병렬 이벤트다 — 그때만 회의실 애니메이션을 쓴다. */
      if (e.title.includes("게임 시스템 논의")) {
        const m = MEETINGS.find((mm) => mm.title.startsWith("게임 시스템 논의"));
        if (!m) return;
        setMeeting(m.title);
        setAgents((prev) =>
          placeAll(
            prev.map((a) =>
              m.members.includes(a.staff.key)
                ? { ...a, at: "meeting" as ZoneId, activity: "회의", task: stripSource(e.title), say: "실제 논의 중" }
                : a
            )
          )
        );
        setTimeout(() => {
          setMeeting(null);
          setAgents((prev) =>
            placeAll(
              prev.map((a) =>
                a.activity === "회의"
                  ? { ...a, at: a.staff.home, activity: "대기", task: "", say: "" }
                  : a
              )
            )
          );
        }, RETURN_DELAY_MS);
        return;
      }

      const key = resolveStaffKey(e.title);
      if (!key) return;
      setAgents((prev) =>
        placeAll(
          prev.map((a) =>
            a.staff.key === key
              ? { ...a, at: "conductor" as ZoneId, activity: "업무", task: stripSource(e.title), say: bubbleFor(e.title) }
              : a
          )
        )
      );
      setTimeout(() => {
        setAgents((prev) =>
          placeAll(
            prev.map((a) =>
              a.staff.key === key && a.at === "conductor"
                ? { ...a, at: a.staff.home, activity: "대기", task: "", say: "" }
                : a
            )
          )
        );
      }, RETURN_DELAY_MS);
    },
    [logRealEntry, placeAll]
  );

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function fetchLogEntries() {
      const res = await fetch("/api/notion?limit=15", { cache: "no-store" });
      const data = (await res.json()) as { entries?: { title: string; type: string; date: string }[] };
      /* Type "로그" = cron의 save_log 기록만 대상 — "[대화]"(CEO 지시창)는
         이미 send()에서 실시간으로 애니메이션 처리되므로 중복 방지 위해 제외. */
      return (data.entries ?? []).filter((e) => e.type === "로그" && e.date);
    }

    async function seedThenPoll() {
      try {
        const entries = await fetchLogEntries();
        if (cancelled) return;
        if (entries.length > 0) {
          [...entries].reverse().forEach(logRealEntry); // 과거 이력은 조용히 로그에만(애니메이션 없음)
          lastSeenRef.current = entries[0].date;
        } else {
          lastSeenRef.current = new Date().toISOString();
        }
      } catch {
        if (!cancelled) lastSeenRef.current = new Date().toISOString();
      }

      intervalId = setInterval(async () => {
        if (cancelled || document.hidden) return;
        try {
          const entries = await fetchLogEntries();
          const fresh = entries.filter((e) => e.date > lastSeenRef.current).reverse(); // 오래된 순
          if (fresh.length === 0) return;
          lastSeenRef.current = entries[0].date;
          fresh.forEach((e, i) => setTimeout(() => animateRealEvent(e), i * 3500));
        } catch {
          /* 폴링 실패는 조용히 다음 주기에 재시도 */
        }
      }, POLL_MS);
    }

    seedThenPoll();
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [running, logRealEntry, animateRealEvent]);

  /* ── 지시 전송 ── */
  const send = async () => {
    if (!selected || !order.trim() || sending) return;
    const agent = agents.find((a) => a.staff.key === selected)!;
    const orderText = order.trim();
    const agentKey = selected;
    setSending(true);
    addLog("CEO", "#4f46e5", `→ ${agentKey}: ${orderText}`);

    setThreads((prev) => {
      const next = { ...prev, [agentKey]: [...(prev[agentKey] ?? []), { role: "user" as const, text: orderText, t: nowText() }] };
      saveThreads(next);
      return next;
    });

    setAgents((prev) =>
      prev.map((a) =>
        a.staff.key === agentKey
          ? { ...a, activity: "업무", task: orderText, say: "확인했습니다" }
          : a
      )
    );

    try {
      const history = (threads[agentKey] ?? [])
        .slice(-6)
        .map((m) => `${m.role === "user" ? "CEO" : agent.staff.name}: ${m.text}`)
        .join("\n");
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt:
            `당신은 BALMYGARDEN 에이전시의 ${agent.staff.name}입니다. 담당: ${agent.staff.role}.\n` +
            `한국어로, 300자 이내로, 액션 아이템 중심으로 답한다.\n\n` +
            (history ? `[최근 대화]\n${history}\n\n` : "") +
            `[BALMYGARDEN 기업 컨텍스트]\n` +
            MEMORY.map((m) => `[${m.tag}] ${m.txt}`).join("\n"),
          userMessage: orderText,
          agentName: agent.staff.name,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (data.text) {
        addLog(agentKey, agent.staff.color, data.text.slice(0, 160));
        setThreads((prev) => {
          const next = { ...prev, [agentKey]: [...(prev[agentKey] ?? []), { role: "agent" as const, text: data.text!, t: nowText() }] };
          saveThreads(next);
          return next;
        });
        setAgents((prev) =>
          prev.map((a) => (a.staff.key === agentKey ? { ...a, say: "완료했습니다" } : a))
        );
        /* 화면 로그·이력은 위에서 이미 남겼다 — Notion에도 영구 기록을 남긴다.
           실패해도 화면 동작에는 영향 주지 않는다(best-effort). */
        try {
          await fetch("/api/notion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "save_chat",
              payload: {
                agentKey,
                agentRole: agent.staff.role,
                messages: [
                  { role: "user", text: orderText },
                  { role: "agent", text: data.text },
                ],
                businessTrack: ZONE_TRACK[agent.staff.home] ?? "전체",
              },
            }),
          });
        } catch {
          /* 저장 실패는 조용히 무시 */
        }
      } else {
        addLog(agentKey, "#ef4444", `응답 실패 — ${data.error ?? res.status}`);
      }
    } catch (e) {
      addLog(agentKey, "#ef4444", `호출 실패 — ${(e as Error).message}`);
    } finally {
      setSending(false);
      setOrder("");
    }
  };

  const sel = agents.find((a) => a.staff.key === selected) ?? null;
  const selThread = selected ? threads[selected] ?? [] : [];

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
          marginBottom: "10px",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#4f46e5" }}>
            🏢 BALMYGARDEN HEADQUARTERS
          </div>
          <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
            {meeting ? `회의 중 — ${meeting}` : `근무 중 · ${STAFF.length}명`}
          </div>
        </div>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            border: `1px solid ${running ? "#22c55e" : "#334155"}`,
            background: running ? "#22c55e22" : "#ffffff",
            color: running ? "#22c55e" : "#475569",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {running ? "● 자동 진행 중" : "○ 일시정지"}
        </button>
      </div>

      {/* ── 오피스 ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: isMobile ? "3 / 4" : "16 / 10",
          background: WALL,
          border: `3px solid ${WALL}`,
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "12px",
          boxShadow: "inset 0 0 40px #00000099",
        }}
      >
        {/* 방 */}
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
                background: z.floor,
                border: `2px solid ${WALL}`,
                boxSizing: "border-box",
                boxShadow: active ? `inset 0 0 30px ${z.color}55` : "none",
                transition: "box-shadow .5s",
              }}
            >
              {/* 바닥 타일 */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(#ffffff0a 1px, transparent 1px), linear-gradient(90deg, #ffffff0a 1px, transparent 1px)",
                  backgroundSize: "14px 14px",
                }}
              />
              {/* 방 이름 */}
              <div
                style={{
                  position: "absolute",
                  top: "3px",
                  left: "6px",
                  fontSize: isMobile ? "7px" : "9px",
                  color: z.color,
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  fontFamily: "monospace",
                  textShadow: "0 1px 2px #000",
                }}
              >
                {z.label}
                {here > 0 && <span style={{ color: "#ffffff66", marginLeft: "5px" }}>·{here}</span>}
              </div>
            </div>
          );
        })}

        {/* 책상 + 의자 */}
        {ZONES.flatMap((z) =>
          z.desks.map((d, i) => (
            <div key={`${z.id}-${i}`}>
              {/* 책상 */}
              <div
                style={{
                  position: "absolute",
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  transform: "translate(-50%,-50%)",
                  width: `${13 * scale}px`,
                  height: `${8 * scale}px`,
                  background: "#7c5c3b",
                  border: "1px solid #4a3520",
                  borderTop: "1px solid #9c7449",
                  borderRadius: "4px",
                  boxShadow: "0 2px 0 #3d2e1e",
                  zIndex: 10,
                }}
              />
              {/* 모니터 */}
              <div
                style={{
                  position: "absolute",
                  left: `${d.x}%`,
                  top: `${d.y - 1.6}%`,
                  transform: "translate(-50%,-50%)",
                  width: `${7 * scale}px`,
                  height: `${5 * scale}px`,
                  background: "#0f172a",
                  border: "1px solid #cbd5e1",
                  borderRadius: "2px",
                  zIndex: 11,
                }}
              />
              {/* 의자 */}
              <div
                style={{
                  position: "absolute",
                  left: `${d.x}%`,
                  top: `${d.y + (d.face === "down" ? 5.5 : -5.5)}%`,
                  transform: "translate(-50%,-50%)",
                  width: `${7 * scale}px`,
                  height: `${7 * scale}px`,
                  background: "#3f3f46",
                  border: "1px solid #27272a",
                  borderRadius: "50%",
                  zIndex: 9,
                }}
              />
            </div>
          ))
        )}

        {/* 사람 */}
        {agents.map((a) => (
          <Person
            key={a.staff.key}
            a={a}
            scale={scale}
            selected={a.staff.key === selected}
            onClick={() => { if (!locked) setSelected(a.staff.key === selected ? null : a.staff.key); }}
          />
        ))}
      </div>

      {/* ── 지시창(원위치, 접힘) + 로그 ── 잠금 상태(공개 링크)에서는 실제 지시·업무
          내용이 보이지 않도록 자리만 안내 문구로 대체한다. ── */}
      {locked ? (
        <div style={card("#e2e8f0")}>
          <div style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "10px 0" }}>
            🔒 업무화면 보기 전용 — 지시·업무 로그는 CEO 잠금해제 후 확인 가능
          </div>
        </div>
      ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "12px",
          alignItems: "start",
        }}
      >
        <div style={card("#e2e8f0")}>
          <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "2px", marginBottom: "8px" }}>
            🎙️ 지시창
          </div>
          <div style={{ fontSize: "12px", color: "#334155", padding: "10px 0", lineHeight: 1.6 }}>
            화면에서 담당자를 클릭하면 대화창이 열린다.
          </div>
        </div>

        <div style={{ ...card(), maxHeight: "300px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "2px", marginBottom: "8px" }}>
            📋 업무 로그
          </div>
          <div style={{ overflowY: "auto", flex: 1, minHeight: "120px" }}>
            {log.length === 0 ? (
              <div style={{ fontSize: "11px", color: "#334155" }}>업무 시작 대기 중…</div>
            ) : (
              log.map((l) => (
                <div
                  key={l.id}
                  style={{ fontSize: "11px", lineHeight: 1.6, paddingBottom: "4px", display: "flex", gap: "6px" }}
                >
                  <span style={{ color: "#94a3b8", fontFamily: "monospace", flexShrink: 0 }}>{l.t}</span>
                  <span style={{ color: l.color, fontWeight: 700, flexShrink: 0 }}>{l.who}</span>
                  <span style={{ color: "#64748b" }}>{l.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {/* ── 확대 대화창(모달) — 담당자 선택 시에만 뜬다.
          바깥(배경) 클릭 시 자동으로 닫혀 위 "원래 지시창 위치"로 돌아간다. ── */}
      {sel && !locked && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "#000000b3",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "12px" : "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...card("#6366F1"),
              width: "min(640px, 100%)",
              height: isMobile ? "88vh" : "min(680px, 88vh)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px #000000aa",
            }}
          >
            {/* 헤더 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                background: "#f1f5f9",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "18px" }}>{sel.staff.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", color: sel.staff.color, fontWeight: 700 }}>
                  {sel.staff.name}
                </div>
                <div style={{ fontSize: "10px", color: "#475569" }}>{sel.staff.role}</div>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  background: "#e2e8f0",
                  color: "#64748b",
                }}
              >
                {sel.activity}
              </span>
              <button
                onClick={() => setSelected(null)}
                title="닫기"
                style={{
                  background: "none",
                  border: "none",
                  color: "#475569",
                  fontSize: "18px",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "0 2px",
                }}
              >
                ✕
              </button>
            </div>

            {/* 대화 이력 */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "4px 2px",
                marginBottom: "10px",
              }}
            >
              {selThread.length === 0 ? (
                <div style={{ fontSize: "12px", color: "#334155", padding: "20px 0", textAlign: "center" }}>
                  아직 대화 이력이 없다. 아래에서 첫 지시를 보내면 이 창에 쌓인다.
                </div>
              ) : (
                selThread.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      background: m.role === "user" ? "#4338ca33" : "#e2e8f0",
                      border: `1px solid ${m.role === "user" ? "#6366F1" : "#cbd5e1"}`,
                      borderRadius: "10px",
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#475569",
                        marginBottom: "3px",
                        display: "flex",
                        gap: "6px",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: m.role === "user" ? "#4f46e5" : sel.staff.color }}>
                        {m.role === "user" ? "CEO" : sel.staff.name}
                      </span>
                      <span>{m.t}</span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 입력 */}
            <textarea
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder={`${sel.staff.name}에게 지시…`}
              disabled={sending}
              style={{
                width: "100%",
                minHeight: "64px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                color: "#1e293b",
                fontSize: "13px",
                padding: "8px 10px",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={send}
              disabled={!order.trim() || sending}
              style={{
                width: "100%",
                marginTop: "7px",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                cursor: !order.trim() || sending ? "not-allowed" : "pointer",
                background: !order.trim() || sending ? "#e2e8f0" : "#6366F1",
                color: !order.trim() || sending ? "#334155" : "#fff",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              {sending ? "전송 중…" : "지시 전송"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
