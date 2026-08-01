"use client";

import { useState, type CSSProperties } from "react";

/* ══════════════════════════════════════════════════
   Agency OS v4.0 — PRP / CDG / FAP / RFS
   문서에만 있던 4개 프로토콜을 실제 판정 도구로 구현
   ══════════════════════════════════════════════════ */

const card = (border = "#1e293b"): CSSProperties => ({
  background: "#0d1629",
  border: `1px solid ${border}`,
  borderRadius: "12px",
  padding: "16px",
});

const label: CSSProperties = {
  fontSize: "10px",
  color: "#64748b",
  letterSpacing: "2px",
  marginBottom: "10px",
};

const input: CSSProperties = {
  width: "100%",
  background: "#111827",
  border: "1px solid #1e293b",
  borderRadius: "6px",
  color: "#e2e8f0",
  fontSize: "12px",
  padding: "8px 10px",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

/* ── FAP: 결정 권한 매트릭스 ── */
type Authority = "CONDUCTOR" | "CEO";

const FAP_ITEMS: { id: string; text: string; auth: Authority; why: string }[] = [
  { id: "f1", text: "에이전트 배정 변경", auth: "CONDUCTOR", why: "운영 조정 — 즉시 실행" },
  { id: "f2", text: "작업 우선순위 조정", auth: "CONDUCTOR", why: "운영 조정 — 즉시 실행" },
  { id: "f3", text: "Rewrite / Freeze 판정", auth: "CONDUCTOR", why: "품질 판단 — Kill 제외" },
  { id: "f4", text: "일정 조율", auth: "CONDUCTOR", why: "운영 조정 — 즉시 실행" },
  { id: "f5", text: "코드 개선·리팩터링", auth: "CONDUCTOR", why: "CEO 위임 완료 (2026-08-01)" },
  { id: "f6", text: "Kill 결정 (트랙·프로젝트 폐기)", auth: "CEO", why: "되돌릴 수 없음" },
  { id: "f7", text: "예산 사용 (Higgsfield 크레딧 포함)", auth: "CEO", why: "과금 발생" },
  { id: "f8", text: "외부 배급·계약", auth: "CEO", why: "법적 구속력" },
  { id: "f9", text: "발매 최종 승인", auth: "CEO", why: "대외 공개 — 회수 불가" },
];

function FapPanel() {
  const [sel, setSel] = useState<string | null>(null);
  const hit = FAP_ITEMS.find((i) => i.id === sel);

  return (
    <div style={card()}>
      <div style={label}>⚖️ FAP — 결정 권한 판정</div>
      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "10px", lineHeight: 1.6 }}>
        결정 사항을 고르면 실행 주체가 나온다. CONDUCTOR 항목은 보고 없이 즉시 실행한다.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {FAP_ITEMS.map((i) => {
          const on = sel === i.id;
          const ceo = i.auth === "CEO";
          return (
            <button
              key={i.id}
              onClick={() => setSel(on ? null : i.id)}
              style={{
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                background: on ? (ceo ? "#2d1a0a" : "#052e16") : "#111827",
                border: `1px solid ${on ? (ceo ? "#f59e0b" : "#22c55e") : "#1e293b"}`,
                color: "#cbd5e1",
                fontFamily: "inherit",
              }}
            >
              {i.text}
            </button>
          );
        })}
      </div>
      {hit && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: hit.auth === "CEO" ? "#2d1a0a" : "#052e16",
            border: `1px solid ${hit.auth === "CEO" ? "#f59e0b" : "#22c55e"}`,
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: hit.auth === "CEO" ? "#f59e0b" : "#22c55e",
            }}
          >
            {hit.auth === "CEO" ? "CEO 승인 필수" : "CONDUCTOR 단독 결정"}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px" }}>{hit.why}</div>
        </div>
      )}
    </div>
  );
}

/* ── RFS: 리스크 5항목 ── */
const RFS_ITEMS = [
  { id: "r1", text: "법적 — 저작권·계약·규정 위반 가능성" },
  { id: "r2", text: "품질 — AEGIS 95점 미달 가능성" },
  { id: "r3", text: "일정 — 미결 의존 항목 존재" },
  { id: "r4", text: "평판 — CEO·브랜드 이미지 영향" },
  { id: "r5", text: "기술 — 배포·연동 실패 가능성" },
];

function RfsPanel() {
  const [on, setOn] = useState<Record<string, boolean>>({});
  const count = Object.values(on).filter(Boolean).length;
  const blocked = count >= 3;

  return (
    <div style={card(blocked ? "#7f1d1d" : "#1e293b")}>
      <div style={label}>🚩 RFS — 리스크 체크</div>
      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "10px", lineHeight: 1.6 }}>
        CEO 보고 전 필수. 3개 이상 체크되면 CONDUCTOR 재검토 후 보고한다.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {RFS_ITEMS.map((i) => (
          <button
            key={i.id}
            onClick={() => setOn((p) => ({ ...p, [i.id]: !p[i.id] }))}
            style={{
              textAlign: "left",
              padding: "8px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              background: on[i.id] ? "#2d0a0a" : "#111827",
              border: `1px solid ${on[i.id] ? "#ef4444" : "#1e293b"}`,
              color: on[i.id] ? "#fca5a5" : "#cbd5e1",
              fontFamily: "inherit",
            }}
          >
            {on[i.id] ? "☑" : "☐"} {i.text}
          </button>
        ))}
      </div>
      <div
        style={{
          marginTop: "10px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: blocked ? "#2d0a0a" : "#111827",
          border: `1px solid ${blocked ? "#ef4444" : "#1e293b"}`,
          fontSize: "12px",
          color: blocked ? "#fca5a5" : "#64748b",
          fontWeight: blocked ? 700 : 400,
        }}
      >
        {count}/5 체크 — {blocked ? "재검토 필요. 이 상태로 보고하지 않는다." : "보고 가능"}
      </div>
    </div>
  );
}

/* ── PRP: 병렬 분석 조합 ── */
const PRP_SETS: { area: string; agents: string[]; trigger: string }[] = [
  { area: "음악 결정", agents: ["SAGE", "LYRA", "NOVA", "SCOUT"], trigger: "트랙 방향·가사 관점 충돌 시" },
  { area: "전략 결정", agents: ["NOVA", "AEGIS", "SCOUT"], trigger: "신규 트랙·마케팅 전략 수립 전" },
  { area: "개발 결정", agents: ["ZERO", "ARIA", "PHANTOM", "AEGIS"], trigger: "기능 추가·구조 전환 전" },
];

function PrpPanel() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div style={card()}>
      <div style={label}>🔀 PRP — 병렬 분석 조합</div>
      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "10px", lineHeight: 1.6 }}>
        주요 결정 전 관련 에이전트를 동시 수행시킨다. 각자 전문 영역만 제출하고 CONDUCTOR가 종합한다.
      </div>
      {PRP_SETS.map((s) => (
        <div key={s.area} style={{ marginBottom: "8px" }}>
          <button
            onClick={() => setOpen(open === s.area ? null : s.area)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "9px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              background: "#111827",
              border: `1px solid ${open === s.area ? "#6366F1" : "#1e293b"}`,
              color: "#cbd5e1",
              fontFamily: "inherit",
            }}
          >
            {s.area}
          </button>
          {open === s.area && (
            <div style={{ padding: "8px 10px", fontSize: "11px", color: "#94a3b8" }}>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "5px" }}>
                {s.agents.map((a) => (
                  <span
                    key={a}
                    style={{
                      fontSize: "10px",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      background: "#6366F122",
                      color: "#a5b4fc",
                      border: "1px solid #6366F144",
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
              <div style={{ color: "#475569" }}>트리거: {s.trigger}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── CDG: 찬반 토론 ── */
type Debate = { id: number; topic: string; forTxt: string; againstTxt: string; verdict: string };

function CdgPanel() {
  const [topic, setTopic] = useState("");
  const [forTxt, setForTxt] = useState("");
  const [againstTxt, setAgainstTxt] = useState("");
  const [verdict, setVerdict] = useState("");
  const [log, setLog] = useState<Debate[]>([]);

  const ready = topic.trim() && forTxt.trim() && againstTxt.trim() && verdict.trim();

  const save = () => {
    if (!ready) return;
    setLog((p) => [{ id: Date.now(), topic, forTxt, againstTxt, verdict }, ...p]);
    setTopic("");
    setForTxt("");
    setAgainstTxt("");
    setVerdict("");
  };

  return (
    <div style={card()}>
      <div style={label}>⚔️ CDG — 찬반 토론 게이트</div>
      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "10px", lineHeight: 1.6 }}>
        Level 2 이상 결정에 필수. 찬성과 반대를 모두 적은 뒤에만 결정한다. 편향 방지 장치다.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        <input
          style={input}
          placeholder="안건"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <textarea
          style={{ ...input, minHeight: "56px", resize: "vertical" }}
          placeholder="찬성 (FOR) — 이 방향을 택해야 하는 이유"
          value={forTxt}
          onChange={(e) => setForTxt(e.target.value)}
        />
        <textarea
          style={{ ...input, minHeight: "56px", resize: "vertical" }}
          placeholder="반대 (AGAINST) — 리스크·약점"
          value={againstTxt}
          onChange={(e) => setAgainstTxt(e.target.value)}
        />
        <input
          style={input}
          placeholder="CONDUCTOR 결정 + 이유 한 줄"
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
        />
        <button
          onClick={save}
          disabled={!ready}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "none",
            cursor: ready ? "pointer" : "not-allowed",
            background: ready ? "#6366F1" : "#1e293b",
            color: ready ? "#fff" : "#475569",
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "inherit",
          }}
        >
          {ready ? "기록" : "4항목 모두 입력 필요"}
        </button>
      </div>

      {log.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <div style={{ ...label, marginBottom: "6px" }}>기록 ({log.length})</div>
          {log.map((d) => (
            <div
              key={d.id}
              style={{
                padding: "9px 11px",
                background: "#111827",
                borderRadius: "8px",
                marginBottom: "6px",
                fontSize: "11px",
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: "#a5b4fc", fontWeight: 700, marginBottom: "3px" }}>{d.topic}</div>
              <div style={{ color: "#22c55e" }}>FOR — {d.forTxt}</div>
              <div style={{ color: "#ef4444" }}>AGAINST — {d.againstTxt}</div>
              <div style={{ color: "#f59e0b", marginTop: "3px" }}>결정 — {d.verdict}</div>
            </div>
          ))}
          <div style={{ fontSize: "10px", color: "#475569" }}>
            브라우저 새로고침 시 사라진다. 확정된 결정은 노션 DecisionLog에 옮긴다.
          </div>
        </div>
      )}
    </div>
  );
}

export default function OsV4Tab({ isMobile }: { isMobile: boolean }) {
  return (
    <div>
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#a5b4fc" }}>
          🏛️ Agency OS v4.0 — 의사결정 프로토콜
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", lineHeight: 1.6 }}>
          TradingAgents 논문 구조 적용. 병렬 분석(PRP) → 찬반 토론(CDG) → 권한 판정(FAP) → 리스크 확인(RFS)
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "12px",
          alignItems: "start",
        }}
      >
        <FapPanel />
        <RfsPanel />
        <PrpPanel />
        <CdgPanel />
      </div>
    </div>
  );
}
