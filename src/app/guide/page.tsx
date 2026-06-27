"use client";
import { useState } from "react";

const LEVELS = [
  {
    num: "1",
    emoji: "💬",
    title: "프롬프트",
    badge: "🟢 누구나",
    badgeColor: "#22c55e",
    install: false,
    tagline: "설치 없이 지금 바로",
    desc: "그냥 클로드한테 말로 시키는 것. 카톡 하듯이요.",
    why: `시작점이에요. "얼마나 구체적으로 부탁하냐"가 결과를 거의 다 결정해요.`,
    steps: [
      "https://claude.ai 접속 → 로그인 (구글 계정으로 가입 가능)",
      "채팅창에 하고 싶은 걸 구체적으로 적기",
      `답이 아쉬우면 "더 구체적으로", "예시 들어줘", "표로 정리해줘"`,
    ],
    code: `npm install -g @anthropic-ai/claude-code`,
    success: "한 번 부탁으로 쓸만한 결과의 70%가 나오면 통과!",
  },
  {
    num: "2",
    emoji: "📎",
    title: "컨텍스트",
    badge: "🟢 누구나",
    badgeColor: "#22c55e",
    install: false,
    tagline: "설치 없이 지금 바로",
    desc: "클로드한테 내 자료를 미리 쥐여주는 것. 브랜드 규칙, 지난 게시물 등.",
    why: "1단계는 남 얘기, 2단계는 내 얘기로 답해요.",
    steps: [
      "채팅창에 파일을 드래그하거나 📎 버튼으로 올리기 (브랜드 가이드, 말투 예시 등)",
      `"이 자료 스타일에 맞춰서 ~ 해줘"라고 부탁`,
      "💡 고급: CLAUDE.md에 내 규칙을 적어두면 매번 자동으로 읽어요 (3단계 이후)",
    ],
    code: `claude`,
    success: `"내 자료 스타일대로 써줘"가 먹히면 통과!`,
  },
  {
    num: "3",
    emoji: "🛠️",
    title: "도구",
    badge: "🟡 조금 익숙해지면",
    badgeColor: "#eab308",
    install: true,
    tagline: "클로드 코드 필요",
    desc: "이제 클로드가 말만 하는 게 아니라 직접 실행해요. 파일을 읽고, 만들고, 고치고, 프로그램을 돌립니다.",
    why: '"이거 해줘" 하면 진짜로 해놔요. 복사·붙여넣기 안 해도 됩니다.',
    steps: [
      "작업할 폴더 안에서 claude 실행",
      "평소처럼 부탁하면 알아서 도구를 써요",
      '"이거 해도 돼요?" 확인 창이 떠요 → Yes 누르면 진행 (안전장치)',
    ],
    code: `# 다온컴퍼니 콘텐츠 프로젝트
## 나에 대해
- 인스타 @3dragon_pd 운영. 카드뉴스/릴스 제작.
- 말투: 친근하고 후킹 강한 반말체. 이모지 적당히.

## 브랜드 규칙
- 메인 컬러: #d97757 (오렌지)
- 폰트: Pretendard
- 카드 사이즈: 1080 x 1350 (4:5)

## 콘텐츠 우선순위
1) 후킹(표지)  2) 정보 정확성  3) 저장 유도 CTA`,
    success: "파일 수정·실행·결과 확인이 한 번에 되면 통과!",
    tip: "대부분 사람이 여기서 멈춰요. 여기까지만 해도 엄청 강력합니다.",
  },
  {
    num: "4",
    emoji: "🔌",
    title: "MCP (앱 연결)",
    badge: "🟢 누구나",
    badgeColor: "#22c55e",
    install: false,
    tagline: "클릭만으로 OK",
    desc: "클로드를 내가 쓰던 앱에 연결하는 것. 노션, 캔바, 구글드라이브 등. MCP = 앱 연결 규격.",
    why: "연결하면 클로드가 노션 문서를 읽고, 캔바 디자인을 만드는 식으로 내 앱 안에서 일해요.",
    steps: [
      "claude.ai/settings/connectors 접속",
      "원하는 앱 (Notion, Canva, Google Drive, Figma) 옆 [추가] 클릭",
      "그 앱에 로그인 → 권한 허용 → 끝!",
    ],
    code: `이 폴더의 카드뉴스 HTML을 읽고,
표지 제목 폰트를 Pretendard ExtraBold로 바꾼 뒤,
결과를 캡처해서 보여줘.`,
    success: "클로드가 내 노션/드라이브 자료를 직접 읽어오면 통과!",
  },
  {
    num: "5",
    emoji: "⚡",
    title: "스킬",
    badge: "🟡 조금 익숙해지면",
    badgeColor: "#eab308",
    install: true,
    tagline: "나만의 단축 명령",
    desc: "자주 시키는 긴 작업을 /이름 한 줄 버튼으로 만들어 두는 것.",
    why: "반복 작업이 버튼 하나가 돼요. 시간 엄청 절약.",
    steps: [
      "작업 폴더 안에 .claude/commands 폴더 만들기 (클로드한테 시켜도 됩니다!)",
      "카드뉴스.md 파일을 만들고 평소 시키던 내용을 적기",
      "이제 클로드에서 /카드뉴스 라고 치면 자동 실행!",
    ],
    code: `# 로컬 서버
claude mcp add github -- npx -y @modelcontextprotocol/server-github

# 원격(HTTP) 서버
claude mcp add --transport http <이름> <서버 URL>`,
    success: "반복 작업을 /명령어 한 줄로 돌리면 통과!",
    link: "남이 만든 스킬도 가져다 쓸 수 있어요 → github.com/anthropics/skills",
  },
  {
    num: "6",
    emoji: "🪄",
    title: "서브에이전트",
    badge: "🔴 고급",
    badgeColor: "#ef4444",
    install: true,
    tagline: "분신술",
    desc: "일을 여러 명의 클로드(전문가)에게 나눠서 동시에 시키는 것.",
    why: "큰 작업을 동시에 처리해서 빨라요. 한 명은 본문, 한 명은 검수, 한 명은 해시태그.",
    steps: [
      "클로드에서 복잡한 작업 입력",
      "안내에 따라 새 전문가(에이전트)의 이름·역할 정하기",
      `"이건 검수원한테 시켜"처럼 일을 나눠주면 동시에 처리`,
    ],
    code: `주제 "$ARGUMENTS"로 인스타 카드뉴스 8장을 만들어줘.
- 1장: 후킹 강한 표지 (질문형 제목)
- 2~7장: 핵심 정보 (한 장당 1메시지)
- 8장: 팔로우 + 댓글 유도 CTA
- 브랜드 컬러 #d97757, Pretendard, 1080x1350
완성하면 HTML로 만들고 PNG로 렌더링까지 해줘.`,
    success: "한 번 부탁에 여러 작업이 동시에 굴러가면 통과!",
  },
  {
    num: "7",
    emoji: "🏆",
    title: "에이전트 팀",
    badge: "🔴 최종 보스",
    badgeColor: "#ef4444",
    install: true,
    tagline: "최고 수준",
    desc: "여러 클로드 '창'이 한 팀처럼 서로 일을 나눠 갖고 동시에 굴러가는 것.",
    why: "⚠️ 아직 실험 단계. 방법이 자주 바뀝니다. 공식 문서 확인 → code.claude.com/docs/ko",
    steps: [
      "터미널 창(탭)을 2~3개 열기",
      "각 창에서 claude 실행하고 역할 나누기 (1번: 표지 / 2번: 본문 / 3번: 검수)",
      "내가 '팀장'이 되어 결과를 모으면 끝!",
    ],
    code: `노션 "콘텐츠 캘린더" DB에서 이번 주 '발행예정' 항목을 가져와서,
각각 카드뉴스 표지 제목 3안씩 만들어 표로 정리해줘.`,
    success: "여러 창이 각자 일을 맡아 동시에 돌아가면 7단계 도달! 🏆",
  },
];

const LINKS = [
  { label: "클로드 (웹·앱)", url: "https://claude.ai" },
  { label: "앱 연결(커넥터)", url: "https://claude.ai/settings/connectors" },
  { label: "공식 설명서(한국어)", url: "https://code.claude.com/docs/ko" },
  { label: "5분 시작 가이드", url: "https://code.claude.com/docs/ko/quickstart" },
  { label: "무료 스킬 모음", url: "https://github.com/anthropics/skills" },
  { label: "Node.js 설치", url: "https://nodejs.org" },
];

const CHECKLIST = [
  { num: "1", title: "프롬프트", goal: "구체적으로 부탁하기", install: false },
  { num: "2", title: "컨텍스트", goal: "내 자료 올려서 시키기", install: false },
  { num: "3", title: "도구", goal: "파일 직접 고치게 하기", install: true },
  { num: "4", title: "MCP", goal: "노션·캔바 연결하기", install: false },
  { num: "5", title: "스킬", goal: "/명령어 만들기", install: true },
  { num: "6", title: "서브에이전트", goal: "여러 명에게 나눠 시키기", install: true },
  { num: "7", title: "에이전트 팀", goal: "창 여러 개로 협업", install: true },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div style={{ position: "relative", marginTop: 12 }}>
      <pre
        style={{
          background: "#0d0d0d",
          border: "1px solid #2a2a2a",
          borderRadius: 10,
          padding: "14px 16px",
          fontSize: 13,
          color: "#e0e0e0",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {code}
      </pre>
      <button
        onClick={copy}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: copied ? "#22c55e22" : "#1e1e1e",
          border: `1px solid ${copied ? "#22c55e" : "#333"}`,
          borderRadius: 6,
          color: copied ? "#22c55e" : "#999",
          fontSize: 11,
          padding: "3px 8px",
          cursor: "pointer",
        }}
      >
        {copied ? "✓ 복사됨" : "복사"}
      </button>
    </div>
  );
}

export default function GuidePage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (num: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#f0f0f0",
        fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
        padding: "0 0 80px",
      }}
    >
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 100%)",
          borderBottom: "1px solid #1e1e1e",
          padding: "56px 20px 44px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 13, color: "#d97757", fontWeight: 700, letterSpacing: 3, marginBottom: 16 }}>
          @3dragon_pd · 2026년 6월 기준
        </div>
        <h1
          style={{
            fontSize: "clamp(26px, 6vw, 44px)",
            fontWeight: 900,
            margin: "0 0 12px",
            lineHeight: 1.2,
          }}
        >
          🚀 클로드 코드{" "}
          <span style={{ color: "#d97757" }}>7단계</span>{" "}
          완전 가이드
        </h1>
        <p style={{ fontSize: 15, color: "#aaa", margin: "0 auto", maxWidth: 480, lineHeight: 1.7 }}>
          코딩 몰라도 괜찮아요.<br />
          아래 순서대로 따라만 오시면 됩니다 🙂
        </p>
        <div
          style={{
            display: "inline-flex",
            gap: 10,
            marginTop: 24,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {["🟢 1~2단계: 설치 X", "🟡 3·5·6·7단계: 클로드 코드", "🟢 4단계: 클릭만"].map((t) => (
            <span
              key={t}
              style={{
                background: "#111",
                border: "1px solid #2a2a2a",
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 12,
                color: "#ccc",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* 30초 요약 */}
      <div style={{ maxWidth: 700, margin: "32px auto 0", padding: "0 16px" }}>
        <div
          style={{
            background: "#0f0f0f",
            border: "1px solid #d97757",
            borderRadius: 14,
            padding: "20px 24px",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10, color: "#d97757" }}>
            ⏱️ 30초 요약
          </div>
          <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.8 }}>
            <div>• 클로드(Claude)를 <b style={{ color: "#fff" }}>7단계로 점점 더 잘</b> 쓰는 법이에요.</div>
            <div>• 대부분은 <b style={{ color: "#fff" }}>3단계에서 멈추지만</b>, 고수는 <b style={{ color: "#d97757" }}>7단계까지</b> 씁니다.</div>
            <div>• <b style={{ color: "#fff" }}>순서</b>: 프롬프트 → 컨텍스트 → 도구 → MCP → 스킬 → 서브에이전트 → 에이전트 팀</div>
            <div>• <b style={{ color: "#22c55e" }}>처음이라면?</b> 1~3단계만 해도 충분히 강력해요. 한 칸씩!</div>
          </div>
        </div>

        {/* 설치 안내 */}
        <div
          style={{
            background: "#0c0c0c",
            border: "1px solid #2a2a2a",
            borderRadius: 14,
            padding: "20px 24px",
            marginTop: 16,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10, color: "#eab308" }}>
            ⚙️ 클로드 코드 설치 (3단계부터 필요)
          </div>
          <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.8, marginBottom: 12 }}>
            <span style={{ color: "#fff", fontWeight: 700 }}>클로드 코드 = 내 컴퓨터에서 클로드가 직접 파일을 만들고 고치는 버전.</span> 한 번만 깔면 돼요.
          </div>
          {[
            ["①", "터미널 열기", "Windows: 시작 → 'PowerShell' / Mac: ⌘+Space → '터미널'"],
            ["②", "(Windows 처음이면) Node.js 먼저 설치", "nodejs.org에서 LTS 버튼 눌러 설치"],
            ["③", "터미널에 아래 명령어 복붙 후 Enter", ""],
          ].map(([n, t, s]) => (
            <div key={n} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: "#d97757", fontWeight: 800, minWidth: 20 }}>{n}</span>
              <div>
                <span style={{ color: "#fff" }}>{t}</span>
                {s && <span style={{ color: "#888" }}> — {s}</span>}
              </div>
            </div>
          ))}
          <CodeBlock code={`npm install -g @anthropic-ai/claude-code`} />
          <div style={{ marginTop: 10, fontSize: 13, color: "#aaa" }}>
            설치 후 <code style={{ background: "#1a1a1a", padding: "1px 6px", borderRadius: 4, color: "#d97757" }}>claude</code> 입력 → 로그인 창 자동 → Claude 계정으로 로그인하면 완료!
          </div>
        </div>
      </div>

      {/* Level Cards */}
      <div style={{ maxWidth: 700, margin: "32px auto 0", padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {LEVELS.map((lv) => (
          <div
            key={lv.num}
            style={{
              background: "#0c0c0c",
              border: "1px solid #1e1e1e",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* Card Header */}
            <div
              style={{
                background: "#111",
                borderBottom: "1px solid #1e1e1e",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "#0d0d0d",
                  border: "1px solid #2a2a2a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {lv.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "#d97757",
                      color: "#000",
                      fontWeight: 900,
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 20,
                    }}
                  >
                    Level {lv.num}
                  </span>
                  <span
                    style={{
                      background: lv.badgeColor + "22",
                      border: `1px solid ${lv.badgeColor}`,
                      color: lv.badgeColor,
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 20,
                    }}
                  >
                    {lv.badge}
                  </span>
                  {!lv.install && (
                    <span style={{ fontSize: 11, color: "#22c55e" }}>
                      ✓ 설치 불필요
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, marginTop: 4 }}>
                  {lv.title}
                  <span style={{ fontSize: 12, color: "#888", fontWeight: 400, marginLeft: 8 }}>
                    — {lv.tagline}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 14, color: "#ddd", marginBottom: 10, lineHeight: 1.7 }}>
                <b style={{ color: "#aaa" }}>이게 뭐예요? </b>{lv.desc}
              </div>
              <div style={{ fontSize: 13, color: "#aaa", marginBottom: 14, lineHeight: 1.7 }}>
                <b style={{ color: "#888" }}>왜 좋아요? </b>{lv.why}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
                  이렇게 하세요
                </div>
                {lv.steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "#ccc" }}>
                    <span style={{ color: "#d97757", fontWeight: 800, minWidth: 18 }}>{i + 1}.</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>
                  복붙 예시
                </div>
                <CodeBlock code={lv.code} />
              </div>

              {lv.tip && (
                <div
                  style={{
                    background: "#d9775710",
                    border: "1px solid #d9775730",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#d97757",
                    marginBottom: 12,
                  }}
                >
                  💡 {lv.tip}
                </div>
              )}

              {lv.link && (
                <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
                  💡 {lv.link}
                </div>
              )}

              <div
                style={{
                  background: "#0d1a0d",
                  border: "1px solid #1a3a1a",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#22c55e",
                }}
              >
                ✅ 이러면 성공 — {lv.success}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div style={{ maxWidth: 700, margin: "32px auto 0", padding: "0 16px" }}>
        <div
          style={{
            background: "#0c0c0c",
            border: "1px solid #1e1e1e",
            borderRadius: 16,
            padding: "20px",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: "#fff" }}>
            ✅ 단계별 체크리스트
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CHECKLIST.map((c) => {
              const done = checked.has(c.num);
              return (
                <div
                  key={c.num}
                  onClick={() => toggle(c.num)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: done ? "#0d1a0d" : "#111",
                    border: `1px solid ${done ? "#1a3a1a" : "#222"}`,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `2px solid ${done ? "#22c55e" : "#444"}`,
                      background: done ? "#22c55e" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "#000",
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {done ? "✓" : ""}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: done ? "#22c55e" : "#ddd" }}>
                      Level {c.num} — {c.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{c.goal}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: c.install ? "#eab308" : "#22c55e",
                      flexShrink: 0,
                    }}
                  >
                    {c.install ? "🟡 설치 필요" : "🟢 설치 X"}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "#0d0d0d",
              borderRadius: 10,
              fontSize: 13,
              color: "#aaa",
              lineHeight: 1.7,
            }}
          >
            🎯 <b style={{ color: "#fff" }}>처음이라면</b> 1 → 2 → 4 → 3 순서를 추천!
            (쉬운 것부터 → 설치 필요한 것)
          </div>
        </div>
      </div>

      {/* Links */}
      <div style={{ maxWidth: 700, margin: "24px auto 0", padding: "0 16px" }}>
        <div
          style={{
            background: "#0c0c0c",
            border: "1px solid #1e1e1e",
            borderRadius: 16,
            padding: "20px",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14, color: "#fff" }}>
            🔗 참고 사이트 (즐겨찾기 추천)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#111",
                  borderRadius: 10,
                  border: "1px solid #222",
                  textDecoration: "none",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13, color: "#ddd" }}>{l.label}</span>
                <span style={{ fontSize: 12, color: "#d97757", flexShrink: 0 }}>
                  {l.url.replace("https://", "")} →
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          maxWidth: 700,
          margin: "24px auto 0",
          padding: "0 16px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1a0a00, #0a0a0a)",
            border: "1px solid #d9775730",
            borderRadius: 16,
            padding: "28px 24px",
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 10 }}>🎯</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
            처음부터 7단계 다 할 필요 없어요.
          </div>
          <div style={{ fontSize: 15, color: "#d97757", fontWeight: 700, marginBottom: 16 }}>
            오늘은 1단계.
          </div>
          <div style={{ fontSize: 14, color: "#aaa", lineHeight: 1.8, marginBottom: 20 }}>
            claude.ai 들어가서 카드뉴스 제목 하나만 뽑아보세요.<br />
            그게 시작이에요. 한 칸씩이면 충분합니다 💪
          </div>
          <div
            style={{
              background: "#d9775715",
              border: "1px solid #d9775740",
              borderRadius: 10,
              padding: "12px",
              fontSize: 13,
              color: "#d97757",
            }}
          >
            ✅ 도움 됐다면 저장·공유 부탁드려요! 😊
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: "#444" }}>
            클로드는 업데이트가 잦아요. 화면이 다르면 공식 문서(code.claude.com/docs/ko) 기준으로 보세요.
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
            ⓒ @3dragon_pd · 클로드 코드 7단계 가이드
          </div>
        </div>
      </div>
    </div>
  );
}
