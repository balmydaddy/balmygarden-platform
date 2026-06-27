"use client";

import { useState, useCallback, useRef, useEffect, CSSProperties } from "react";

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */
interface Agent {
  code: string;
  av: string;
  color: string;
  type: string;
  role: string;
  desc: string;
  sys: string;
}

interface Workflow {
  id: string;
  emoji: string;
  cat: string;
  name: string;
  chain: string[];
  desc: string;
  quickSkill?: string;
  parallel?: string[][];
}

interface LearnPrompt {
  id: string;
  name: string;
  src: string;
  tpl: string;
}

interface MarketingPrompt {
  id: string;
  name: string;
  src: string;
  color: string;
  items: string[];
}

interface LadderStep {
  step: number;
  name: string;
  icon: string;
  color: string;
  desc: string;
  signal: string[];
  problem: string;
  next: string;
}

interface MemoryEntry { id: string; tag: string; txt: string; }
interface ScheduleEntry { time: string; agent: string; task: string; }
interface ToolEntry { name: string; use: string; fb: string; warn?: boolean; }
interface ChainResult { key: string; ag: Agent; txt: string; done: boolean; }
interface NotionToast { msg: string; url?: string; ok: boolean; }

/* ══════════════════════════════════════════════════════
   AGENTS
══════════════════════════════════════════════════════ */
const AGENTS: Record<string, Agent> = {
  ARIA: {
    code: "A-01", av: "🗂️", color: "#6366F1", type: "Thinker",
    role: "영수증 앱 PM",
    desc: "Next.js 14 · Supabase · Gemini API · Vercel",
    sys: `당신은 ARIA, BALMYGARDEN 소속 영수증 OCR 앱 PM입니다.
스택: Next.js 14 / Supabase / Gemini API / Vercel / Resend. 사전 테스팅 단계.
CEO 결정 사안 외 기업 영리 기준 독립 의사결정. 결과물은 구체적 액션 아이템으로 마무리.
응답 300자 이내, 핵심만.`,
  },
  PHANTOM: {
    code: "A-02", av: "⚔️", color: "#8B5CF6", type: "Thinker",
    role: "LOD 게임 PM",
    desc: "React 다크판타지 턴제 RPG · 프로토타입 완성",
    sys: `당신은 PHANTOM, BALMYGARDEN 소속 LOD (Lord of Dynasty) 게임 PM입니다.
다크 판타지 턴제 RPG React 리마스터. 프로토타입 완성 단계.
스토리, 밸런스, 아트 방향성 포함 전체 개발 일정 관장.
CEO 결정 사안 외 독립 의사결정. 응답 300자 이내.`,
  },
  ZERO: {
    code: "A-03", av: "💻", color: "#10B981", type: "Coder",
    role: "개발/기술",
    desc: "풀스택 · GitHub balmydaddy/lord-of-dark",
    sys: `당신은 ZERO, BALMYGARDEN 풀스택 개발자 에이전트입니다.
기술 스택: Next.js 14, React, Supabase, Gemini API, Vercel, Resend, TypeScript, Harness CI/CD.
코드 작성 시 에러 핸들링·타입 안전성·성능 최적화 필수.
GitHub 링크나 패키지명 제공 시 즉시 기술 평가 후 통합 방안 제시. 응답 300자 이내.`,
  },
  MUSE: {
    code: "A-04", av: "🎨", color: "#F59E0B", type: "Creative",
    role: "크리에이티브",
    desc: "Suno AI · Midjourney · 릴스 · 앨범 아트",
    sys: `당신은 MUSE, BALMYGARDEN 크리에이티브 에이전트입니다.
음악: Suno AI로 BALMYDADDY 명의 심포닉/클래시컬 메탈·다크 판타지·복음 발라드.
게임 아트: Midjourney 다크 판타지 컨셉 아트. 영상: Remotion·Manus AI 릴스.
BALMYGARDEN 정체성(다크+서정+보호자 테마) 항상 유지. 응답 300자 이내.`,
  },
  AEGIS: {
    code: "A-05", av: "⚖️", color: "#EF4444", type: "Verifier",
    role: "법무/경영/QA",
    desc: "리스크 검토 · QA 95/100 게이트",
    sys: `당신은 AEGIS, BALMYGARDEN 법무·경영·QA 에이전트입니다.
리스크를 먼저 열거 후 해결책 제시. QA 95/100 통과 여부 명시 필수.
중대재해처벌법·저작권·개인정보보호법 사안 반드시 플래그.
숨은 빈틈 탐지 후 직접 지적. 봐주지 않음. 응답 300자 이내.`,
  },
  NOVA: {
    code: "A-06", av: "🔭", color: "#06B6D4", type: "Thinker",
    role: "전략/마케팅",
    desc: "브랜드 포지셔닝 · 광고 카피 · 이메일",
    sys: `당신은 NOVA, BALMYGARDEN 전략·마케팅 에이전트입니다.
전문: 브랜드 포지셔닝·고객 조사·광고 카피·이메일 마케팅·SNS 전략.
데이터 기반 판단. 경쟁자 포지셔닝 공백 파악. 감정 트리거 활용 우선.
기능이 아닌 결과 중심 메시지.
전략 판단 시 @platformtree_ 12단계 사업 성장 사다리를 기준으로 BALMYGARDEN의 현재 단계를 파악하고 다음 단계 이동을 위한 액션을 제시하세요.
현재 진단: 음원=2단계(기술판매)→3단계(제품), 앱=3단계(제품)→4단계(정보), 게임=3단계(제품). 응답 300자 이내.`,
  },
  REX: {
    code: "A-07", av: "📋", color: "#64748B", type: "Tool",
    role: "총무/행정",
    desc: "일정 · DistroKid · ISO 문서",
    sys: `당신은 REX, BALMYGARDEN 총무·행정 에이전트입니다.
일정 관리·문서 체계화·DistroKid 음원 배급 일정·정부 보고서·ISO 문서 관리.
체크리스트 형식 선호. 체계적·명확·누락 없이. 응답 300자 이내.`,
  },
  SCOUT: {
    code: "A-08", av: "🔍", color: "#F97316", type: "Researcher",
    role: "리서치/분석",
    desc: "AI 트렌드 · 크레딧 모니터 · 경쟁사",
    sys: `당신은 SCOUT, BALMYGARDEN 리서치·분석 에이전트입니다.
모니터링: @parky0ngnam, @_business.story, @shoppduddn_, @platformtree_, trenddalkak_ai, keanu_visuals, PEAKON.
새 AI 도구·무료 크레딧 현황·경쟁사 동향·콘텐츠 트렌드 추적.
Higgsfield 월 크레딧 잔여량 항상 확인. 대체 무료 도구 목록 유지.
BALMYGARDEN의 현재 사업 단계(@platformtree_ 12단계 기준) 파악 및 다음 단계 이동 조건 모니터링. 응답 300자 이내.`,
  },
  CONDUCTOR: {
    code: "A-09", av: "🎯", color: "#94A3B8", type: "Orchestrator",
    role: "지휘자 (투명 라우팅)",
    desc: "Fugu 원칙 · 블랙박스 금지 · QA 최종",
    sys: `당신은 CONDUCTOR, BALMYGARDEN 에이전트 오케스트레이터입니다.
요청 배정 시 반드시 (1) 어떤 에이전트, (2) 왜 그 에이전트인지 먼저 공개.
블랙박스 의사결정 절대 금지. 투명 라우팅이 CONDUCTOR 핵심 원칙 (Fugu 반면교사).
QA 게이트: 모든 결과물 95/100 통과 여부 최종 검증. 응답 300자 이내.`,
  },
};

/* ══════════════════════════════════════════════════════
   WORKFLOWS
══════════════════════════════════════════════════════ */
const WORKFLOWS: Workflow[] = [
  {
    id: "stage_diag", emoji: "📈", cat: "전략", name: "사업 단계 진단 (12단계)",
    chain: ["SCOUT", "NOVA", "AEGIS", "CONDUCTOR"],
    parallel: [["SCOUT", "NOVA"], ["AEGIS"], ["CONDUCTOR"]],
    desc: "platformtree_ 12단계 기준 현재 위치 → 다음 단계 전략",
    quickSkill: "BALMYGARDEN 음악/앱/게임 3트랙의 현재 사업 단계(12단계 기준)를 진단하고, 각 트랙별 다음 단계 이동을 위한 구체적 액션 아이템 3가지씩 제시해주세요.",
  },
  {
    id: "receipt_feat", emoji: "🗂️", cat: "개발", name: "영수증 앱 기능 개발",
    chain: ["ZERO", "MUSE", "NOVA", "ARIA"],
    parallel: [["ZERO", "MUSE"], ["NOVA"], ["ARIA"]],
    desc: "OCR 신규 기능 설계 → PM 승인",
    quickSkill: "영수증 OCR 앱에 추가할 핵심 기능 3가지를 제안하고, 우선순위 기준 및 기술 구현 방안을 포함해 PM 결재 기준으로 정리해주세요.",
  },
  {
    id: "lod_story", emoji: "⚔️", cat: "게임", name: "LOD 스토리/기획",
    chain: ["MUSE", "ZERO", "NOVA", "PHANTOM"],
    desc: "다크판타지 스토리·밸런스·아트 방향",
    quickSkill: "LOD(Lord of Dynasty) 다크판타지 턴제 RPG의 메인 스토리 3막 구조와 주요 캐릭터 2인, 첫 번째 보스 챕터 설계안을 작성해주세요.",
  },
  {
    id: "music_release", emoji: "🎵", cat: "음악", name: "음원 발매 파이프라인",
    chain: ["MUSE", "SCOUT", "REX", "NOVA"],
    parallel: [["MUSE", "SCOUT"], ["REX"], ["NOVA"]],
    desc: "Suno AI → DistroKid → SNS 마케팅",
    quickSkill: "BALMYDADDY 신규 트랙 발매 파이프라인 전체(Suno AI 제작 → DistroKid 배급 → SNS 마케팅)를 D-30부터 D-Day까지 타임라인으로 작성해주세요.",
  },
  {
    id: "marketing", emoji: "📣", cat: "마케팅", name: "마케팅 콘텐츠 제작",
    chain: ["SCOUT", "MUSE", "NOVA", "ARIA"],
    parallel: [["SCOUT", "MUSE"], ["NOVA"], ["ARIA"]],
    desc: "고객조사 → 광고카피 → 이메일 → 릴스",
    quickSkill: "BALMYGARDEN 타깃 고객 조사 → 광고 카피 5안 → 이메일 마케팅 시퀀스 3단계 → 인스타 릴스 스크립트 1편을 순서대로 작성해주세요.",
  },
  {
    id: "brand_pos", emoji: "🔭", cat: "전략", name: "브랜드 포지셔닝",
    chain: ["SCOUT", "NOVA", "AEGIS", "CONDUCTOR"],
    parallel: [["SCOUT", "NOVA"], ["AEGIS"], ["CONDUCTOR"]],
    desc: "경쟁사 분석 → 포지셔닝 공백 → 차별화",
    quickSkill: "BALMYGARDEN의 경쟁사 3곳을 분석하고, 포지셔닝 공백을 찾아 차별화 전략과 카테고리 선언문을 작성해주세요.",
  },
  {
    id: "knowledge", emoji: "🧠", cat: "학습", name: "지식 강화 모드",
    chain: ["SCOUT", "ZERO", "CONDUCTOR"],
    desc: "파인만·빈틈탐지·맞춤 학습경로",
    quickSkill: "AI 에이전트 활용과 클로드 코드 7단계 운영 능력을 7일 안에 실무 수준으로 끌어올리는 맞춤 학습 경로를 설계해주세요.",
  },
  {
    id: "content_bank", emoji: "📝", cat: "콘텐츠", name: "콘텐츠 뱅크 제작",
    chain: ["SCOUT", "MUSE", "NOVA"],
    parallel: [["SCOUT", "MUSE"], ["NOVA"]],
    desc: "훅 문구 + 스토리텔링 + How-To 배치",
    quickSkill: "BALMYGARDEN 인스타그램용 콘텐츠 뱅크: 저장 유도 훅 5개 + 스토리텔링 주제 5개 + How-To 아이디어 5개를 테마별로 정리해주세요.",
  },
  {
    id: "legal", emoji: "⚖️", cat: "법무", name: "법무/리스크 검토",
    chain: ["AEGIS", "REX", "CONDUCTOR"],
    desc: "계약·개인정보·저작권·중대재해 검토",
    quickSkill: "BALMYGARDEN 현재 사업(앱/게임/음원배급) 운영 시 발생 가능한 법적 리스크를 영역별(저작권·개인정보·중대재해)로 검토하고 대응 체크리스트를 작성해주세요.",
  },
  {
    id: "game_art", emoji: "🎮", cat: "게임", name: "LOD 게임 아트 생성",
    chain: ["MUSE", "PHANTOM", "AEGIS"],
    desc: "크레딧 확인 → 게임 아트 → CEO 승인",
    quickSkill: "LOD 프로토타입에 필요한 핵심 게임 아트 목록(배경 3종·캐릭터 2종·UI 요소 5종)과 Higgsfield/Midjourney 프롬프트 가이드를 작성해주세요. 크레딧 사용 승인 요청 포함.",
  },
  {
    id: "qa_gate", emoji: "✅", cat: "품질", name: "QA 게이트 검증",
    chain: ["AEGIS", "CONDUCTOR"],
    desc: "95/100 기준 최종 검증 → CEO 보고",
    quickSkill: "제출할 결과물을 95/100 QA 기준으로 검증해주세요. 감점 항목 명시 후 개선 방안과 CEO 보고용 최종 요약을 작성해주세요.",
  },
  {
    id: "weekly", emoji: "📊", cat: "행정", name: "주간 현황 보고",
    chain: ["REX", "SCOUT", "CONDUCTOR"],
    desc: "프로젝트 현황·크레딧·다음 주 계획",
    quickSkill: "이번 주 BALMYGARDEN 3트랙(음악/앱/게임) 진행 현황, AI 크레딧 잔여량, 완료/미완료 태스크, 다음 주 우선순위 3가지를 CEO 보고 형식으로 정리해주세요.",
  },
];

/* ══════════════════════════════════════════════════════
   PROMPT BANK
══════════════════════════════════════════════════════ */
const LEARN_PROMPTS: LearnPrompt[] = [
  {
    id: "L-01", name: "학습 곡선 파괴자", src: "@parky0ngnam",
    tpl: `당신은 나와 단 4시간만 함께할 수 있고, 다시는 나를 보지 못하는 선생님입니다.
당신의 유일한 목표는 시간이 끝나기 전에 내가 [기술]을 실제로 사용할 수 있게 만드는 것입니다.
실용성 없는 이론과 단순 목록은 주지 마세요.
알려주세요: 무엇을 가장 먼저 배워야 하는지, 무엇은 완전히 무시해야 하는지,
단 한 번만 해도 몇 달 공부한 사람들 70%보다 앞서게 만드는 연습은 무엇인지.`,
  },
  {
    id: "L-02", name: "실제 오류 시뮬레이터", src: "@parky0ngnam",
    tpl: `[개념]을 설명하지 마세요.
그 개념을 실제로 사용해야 하고, 내가 실수할 가능성이 높은 현실 상황에 바로 넣어주세요.
내가 실수하면 답을 바로 주지 마세요. 내 추론이 어디서 무너졌는지 스스로 발견하게 만드는 질문을 해주세요.
내가 최소 두 번 시도한 뒤에만 답을 알려주세요.
내가 망설임 없이 맞힐 수 있을 때까지 이 과정을 반복하세요.`,
  },
  {
    id: "L-03", name: "불가능한 언어 번역기", src: "@parky0ngnam",
    tpl: `아래 내용이 나에게는 혼란스럽습니다.
설명 전에 먼저 알려주세요: 이 한 문장만 이해하면 나머지가 저절로 이해되는 핵심 문장은?
그 문장 하나만 먼저 설명하세요. 전문 용어 없이, 일상적 비유로.
그다음 정말 이해한 사람만 답할 수 있는 질문 3개를 해주세요.
내가 세 질문을 모두 통과하기 전까지 다음으로 넘어가지 마세요.
[여기에 내용을 붙여넣기]`,
  },
  {
    id: "L-04", name: "개인 맞춤 학습 경로 설계자", src: "@parky0ngnam",
    tpl: `나의 진짜 목표는 [목표]입니다.
[기술]을 일반적으로 배우려는 게 아니라 [기한] 안에 [구체적 결과]를 달성하려는 것입니다.
이미 [이미 숙달한 것]을 알고 있습니다.
이를 바탕으로 7일짜리 학습 경로를 만들어주세요.
각 날짜: 45분 안에 끝낼 수 있는 단 하나의 과제,
내가 제대로 했는지 알 수 있는 명확한 기준,
그날 시간을 낭비하지 않기 위해 하지 말아야 할 것.
전체 경로가 목표로 이어지지 않는다면 목표에 맞을 때까지 다시 설계하세요.`,
  },
  {
    id: "L-05", name: "숨은 빈틈 탐지기", src: "@parky0ngnam",
    tpl: `나는 내가 이미 [기술]을 숙달했다고 생각합니다.
내가 틀렸다는 것을 증명해주세요.
겉보기에는 단순하지만, 진짜 깊이 들어가본 적 없는 사람의 빈틈을 드러내는 질문 5개를 해주세요.
내가 답할 때마다 알려주세요: 내 답이 기초에서 아직 무엇이 부족한지.
봐주지 마세요. 내가 알게 말하고 있다면 직접적으로 말해주세요.`,
  },
  {
    id: "L-06", name: "강제 파인만 기법", src: "@parky0ngnam",
    tpl: `나는 방금 [주제]를 공부했습니다.
이제 내가 이해한 내용을 10살 아이에게 설명하듯 말해보겠습니다.
내가 설명하는 동안 다음 상황이 나오면 바로 멈춰주세요:
· 뜻도 모르면서 전문 용어를 사용할 때
· 추론 단계를 건너뛸 때
· 너무 단순화해서 오히려 틀린 설명이 될 때
마지막에는 그 실수들이 내 머릿속에서 아직 무엇이 단단하지 않은지를 정확히 알려주세요.`,
  },
];

const MARKETING_PROMPTS: MarketingPrompt[] = [
  {
    id: "M-01", name: "고객 조사", src: "@_business.story", color: "#06B6D4",
    items: [
      "내 시장과 관련된 Reddit 댓글에서 반복적으로 나타나는 불만을 추출해줘.",
      "고객이 자신의 문제를 감정적으로 표현할 때 사용하는 문구를 찾아줘.",
      "고객 행동 뒤에 숨겨진 구매 동기를 밝혀줘.",
      "고객이 공개적으로는 잘 말하지 않지만 실제로 원하는 것을 요약해줘.",
    ],
  },
  {
    id: "M-02", name: "이메일 마케팅", src: "@_business.story", color: "#4F6EF7",
    items: [
      "자동화 메일이 아니라 사람이 직접 쓴 것처럼 느껴지는 웰컴 이메일을 작성해줘.",
      "클릭베이트처럼 보이지 않으면서도 오픈율을 높이는 제목을 만들어줘.",
      "부드러운 CTA가 포함된 스토리 기반 세일즈 이메일을 작성해줘.",
      "이 고객의 반대 의견을 설득력 있는 이메일 시퀀스로 바꿔줘.",
    ],
  },
  {
    id: "M-03", name: "광고 카피", src: "@_business.story", color: "#F59E0B",
    items: [
      "10단어 이하로 호기심을 자극하는 콜드 오디언스용 광고 훅 5개를 작성해줘.",
      "고객의 가장 큰 고통 한 가지에만 집중한 페이스북 광고 문구를 작성해줘.",
      "이 광고를 더 쉬운 언어와 더 강한 감정 대비를 사용해 다시 작성해줘.",
      "클릭은 했지만 구매하지 않은 사람들을 위한 리타겟팅 광고 3개를 만들어줘.",
    ],
  },
  {
    id: "M-04", name: "브랜드 포지셔닝", src: "@_business.story", color: "#8B5CF6",
    items: [
      "내 시장을 분석하고 경쟁사들이 놓치고 있는 포지셔닝 공백 5가지를 찾아줘.",
      "내 브랜드가 즉시 차별화되어 보이는 카테고리 선언문을 만들어줘.",
      "기능 중심이 아닌 결과 중심으로 내 오퍼 메시지를 다시 작성해줘.",
      "고객이 구매 전에 반응하는 핵심 감정 트리거를 찾아줘.",
    ],
  },
  {
    id: "M-05", name: "상세 페이지 심리학", src: "@_business.story", color: "#10B981",
    items: [
      "더 명확한 감정적 결과를 강조하도록 내 상세페이지를 다시 작성해줘.",
      "내 세일즈 카피가 어디에서 독자의 관심을 잃는지 분석해줘.",
      "공격적으로 들리지 않으면서도 더 강력한 CTA 버전을 만들어줘.",
      "구매 망설임을 줄이는 가격 설명 문구를 작성해줘.",
    ],
  },
  {
    id: "M-06", name: "크리에이터 성장", src: "@_business.story", color: "#EF4444",
    items: [
      "이 크리에이터의 콘텐츠가 왜 중독성 있게 느껴지는지 분석해줘.",
      "저장 및 공유를 유도하도록 설계된 캐러셀 콘텐츠 아이디어 10개를 만들어줘.",
      "내 시장에서 아무도 이야기하지 않는 문제를 중심으로 콘텐츠 각도를 만들어줘.",
      "하나의 아이디어를 5개의 플랫폼별 콘텐츠 형식으로 변환해줘.",
    ],
  },
  {
    id: "M-07", name: "영상 콘텐츠 스크립트", src: "@_business.story", color: "#F97316",
    items: [
      "시청 지속 시간을 즉시 높이는 30초 오프닝 훅을 작성해줘.",
      "이 주제를 5초마다 패턴 인터럽트가 들어가는 숏폼 스크립트로 만들어줘.",
      "이 스크립트를 더 대화체이고 창업자 중심의 톤으로 다시 작성해줘.",
      "결론을 너무 빨리 공개하지 않으면서 궁금증을 유발하는 인스타/유튜브 인트로를 만들어줘.",
    ],
  },
];

/* ══════════════════════════════════════════════════════
   12단계 사업 성장 사다리
══════════════════════════════════════════════════════ */
const LADDER_12: LadderStep[] = [
  { step: 1, name: "시간을 판다", icon: "⏰", color: "#94A3B8", desc: "일한 시간만큼 수입. 일이 멈추면 수입도 멈춤.", signal: ["출근/근무/수작업 해야 돈 들어옴", "일정/가격/규모 통제 어려움", "컨디션 떨어지면 수입 감소"], problem: "레버리지 없음. 더 벌려면 더 오래 일해야.", next: "기술 하나 골라 연습, 작업 결과 기록 → 2단계" },
  { step: 2, name: "기술을 판다", icon: "✏️", color: "#6366F1", desc: "능력에 돈이 낸다. 디자이너·작가·개발자·컨설턴트.", signal: ["수입은 클라이언트 작업/맞춤 제공", "실력 좋을수록 단가 올라감", "대부분 1:1 구조"], problem: "시간/고객 수/개인 역량 때문에 수입 상한 생김.", next: "반복 요청 → 명확한 오퍼, 서비스 패키지 → 3단계" },
  { step: 3, name: "제품을 판다", icon: "📦", color: "#8B5CF6", desc: "매번 직접 노동 없이도 수입. 실물/디지털 모두 가능.", signal: ["상품 페이지/결제/스토어 있음", "상담 없이 구매 가능", "같은 오퍼 여러 번 판매"], problem: "유통/신뢰/고객 없는데 제품부터 만들어 여기서 멈추는 경우 많음.", next: "제품이 해결하는 문제 중심 콘텐츠, 무료 자산(체크리스트) → 4/5단계" },
  { step: 4, name: "정보를 판다", icon: "📚", color: "#06B6D4", desc: "지식이 상품. 가이드/템플릿/전자책/워크숍/교육/강의.", signal: ["과정/지름길/프레임워크 배우기 위해 돈 냄", "파일/영상/수업/라이브로 전달", "오퍼는 명확성과 변화에 맞춰 설계"], problem: "신뢰/증거/고객 없으면 정보만으로는 쉽게 무시됨.", next: "전문성 보여주는 간단한 콘텐츠, 리드 마그넷 → 5단계" },
  { step: 5, name: "주목을 판다", icon: "👁️", color: "#10B981", desc: "청중 자체가 가치. 도달/조회수/반응/커뮤니티가 자산.", signal: ["게시물/영상/뉴스레터가 꾸준한 트래픽", "브랜드/스폰서/구매자는 청중 반응 중요시", "콘텐츠가 인바운드 기회 만듦"], problem: "빌린 주목은 약함. 플랫폼 변화 시 도달이 하루아침에 줄 수 있음.", next: "팔로워 → 이메일/커뮤니티/리드(내 채널), 핵심 오퍼 연결 → 6단계" },
  { step: 6, name: "시스템을 판다", icon: "⚙️", color: "#F59E0B", desc: "진짜 상품은 꾸준히 결과 내는 시스템.", signal: ["업무가 단계/템플릿/SOP/자동화로 문서화", "팀/외부 인력이 결과 함께 낼 수 있음", "결과가 예측 가능, 한 사람에 덜 의존"], problem: "유통 없으면 좋은 시스템도 작게 머무를 수 있음.", next: "제휴/추천 루프/어필리에이트/플랫폼 유통, 운영 모델 → 7단계" },
  { step: 7, name: "채널을 판다", icon: "📡", color: "#EF4444", desc: "접근 자체가 자산. 유통을 쥔 사람이 레버리지를 가짐.", signal: ["트래픽 제휴/어필리에이트/리셀러 네트워크", "다른 사업자가 오디언스/파이프라인에 접근 원함", "유통이 있어서 거래가 더 쉬워짐"], problem: "신뢰 없는 채널은 잠깐 튀어도 충성도는 약함.", next: "정체성/메시지/평판 강화, 사람들이 일부러 고르는 브랜드 → 8단계" },
  { step: 8, name: "브랜드를 판다", icon: "👑", color: "#F97316", desc: "신뢰가 마찰을 줄임. 이름 그 자체가 수요를 만듦.", signal: ["사람들은 평판/스타일/정체성/권위 때문에 구매", "입소문이 커짐", "프리미엄 포지셔닝 가능"], problem: "브랜드만 있고 자산이 없으면 개인 존재감에 너무 의존.", next: "이익 → 소유권/자산/장기 보유, 지분/매출 쉐어 탐색 → 9단계" },
  { step: 9, name: "자본을 판다", icon: "💰", color: "#22C55E", desc: "매일의 생산보다 소유권과 자산 배분이 더 중요.", signal: ["수입이 지분/투자/배당/소유 지분", "시간보다 의사결정의 질이 더 중요", "자본은 잘 쓰면 복리로 커짐"], problem: "통찰 없는 자본은 잘못 배분될 수 있음.", next: "기준/인프라/플랫폼이 큰 지배력을 만드는 곳 찾기 → 10단계" },
  { step: 10, name: "룰을 판다", icon: "📋", color: "#A78BFA", desc: "판의 틀을 세우는 단계. 플랫폼/기준/생태계/인프라.", signal: ["다른 사람들이 그 시스템 위에서 사업을 만듦", "사람들이 움직이는 조건/기준/환경을 이 사업이 좌우함", "네트워크 효과가 나타나기 시작"], problem: "깊은 전략/타이밍/강한 실행이 필요.", next: "인프라를 더 큰 미래 이야기로 확장 → 11단계" },
  { step: 11, name: "미래를 판다", icon: "🚀", color: "#60A5FA", desc: "사람들이 다음에 올 미래의 비전을 지지하는 단계.", signal: ["제안이 지금의 제품보다 더 큰 방향성", "시장은 결과뿐만 아니라 어디로 가는지에 반응", "새로운 시장이나 카테고리를 만들 수 있음"], problem: "현실 없는 비전은 신뢰를 무너뜨림.", next: "믿음 체계와 미래 연결, 사고방식을 바꾸며 → 12단계" },
  { step: 12, name: "세계관을 판다", icon: "🌍", color: "#FB923C", desc: "가장 깊은 자산은 공유된 믿음. 운동/미션/유산/영향력.", signal: ["사람들은 하나의 세계관에 모임", "미션이 개별 상품이나 캠페인보다 오래 남음", "공동체 정체성이 단일 제안보다 강해짐"], problem: "메시지는 진짜여야 함. 미션이 가짜처럼 느껴지면 그 아래 모든 것이 약해짐.", next: "제품/사람/메시지를 하나의 분명한 믿음에 맞춰 계속 정렬" },
];

const HOOKS = [
  "다들 이건 안 될 거라고 했어요... 그런데 결국 됐습니다.",
  "__를 처음 시작하는 분이라면, 이건 꼭 들으셔야 해요.",
  "아무도 __에 대해 말해주지 않는 진실입니다.",
  "저는 몇 달 동안 이 실수를 했어요 — 여러분은 같은 실수 하지 마세요.",
  "이 작은 변화 하나가 제 결과를 완전히 바꿨어요.",
  "아마 여러분은 __를 잘못하고 있을 가능성이 커요 (그것도 모른 채).",
  "이걸 해보기 전까지는 __에서 영원히 벗어나지 못할 줄 알았어요.",
  "__를 시작하기 전에 누군가가 이걸 알려줬다면 좋았을 텐데요.",
  "__가 막막하게 느껴진다면, 저한테 도움이 됐던 건 이거예요.",
  "왜 내 __는 효과가 없는지 (그리고 어떻게 고치는지).",
  "루틴에서 이 간단한 조정 하나가 모든 걸 바꿨어요.",
  "제가 __를 거의 포기할 뻔했던 이유 (하지만 결국 포기하지 않은 이유).",
  "수년 동안 무시했던 조언 — 그리고 지금은 후회합니다.",
  "다들 __를 너무 복잡하게 만들어요. 진짜 핵심은 이거예요.",
  "제가 __에서 진전을 망치고 있던 숨은 원인.",
  "과소평가된 이 팁 하나로 __ 성과가 하룻밤 사이에 확 달라졌어요.",
  "대부분의 사람들을 제자리에 묶어두는 __에 대한 오해.",
  "지금 __를 하고 있다면, 대신 이렇게 해보세요.",
  "아무도 __가 이렇게 어려울 줄은 말해주지 않았어요.",
  "__를 위해 3가지 전략을 써봤고, 진짜 효과가 있었던 건 이거예요.",
];

const TEMPLATES: Record<string, string[]> = {
  "How-To · 초보자용": [
    "압도되지 않고 __를 시작하는 법.",
    "제가 __를 시작할 때 꼭 있었으면 좋을 초보자 가이드.",
    "__를 단순하게 만드는 제가 쓰는 3단계 방법.",
    "처음부터 끝까지 __ 과정을 계획하는 제 방법.",
    "제가 실제로 쓰는 __ 워크플로우 (그대로 따라 하셔도 됩니다).",
    "꾸준히 유지되는 __ 습관을 만드는 법.",
    "초보자들이 __에서 꼭 하는 실수.",
    "번아웃 없이 __를 꾸준히 하는 법.",
    "__를 시작하기 전에 알았더라면 좋았을 5가지.",
    "이 방법으로 __에서 더 빠르게 결과 내는 법.",
  ],
  "팁 · 도구 · 해킹": [
    "__를 즉시 개선해준 작은 습관 5가지.",
    "__를 대하는 방식을 바꾼 10분 루틴.",
    "이 앱 하나가 제 __ 과정을 완전히 단순하게 만들어줬어요.",
    "__를 위한 초보자용 도구 3가지 — 제가 매일 씁니다.",
    "매번 __ 전에 제가 확인하는 체크리스트.",
    "제가 __를 정리하는 게으른 방법 (그런데 효과는 좋습니다).",
    "품질은 유지하면서 __ 시간을 절반으로 줄이는 법.",
    "__를 꾸준히 하기 위한 제 단계별 시스템.",
    "__에서 진행 상황을 가장 쉽게 측정하는 방법.",
    "1시간 만에 __ 콘텐츠 1주치를 계획하는 법.",
  ],
  "스토리텔링 · 마인드셋": [
    "__를 시작했을 때, 저는 제가 뭘 하는지도 몰랐어요.",
    "__에서의 이 실패는 어떤 성공보다 많은 걸 가르쳐줬어요.",
    "30일 동안 매일 __를 하며 제가 배운 것들입니다.",
    "시작하기 전에 __에 대해 이걸 알았더라면 좋았을 텐데요.",
    "__를 거의 그만둘 뻔했던 그날, 하지만 그러지 않았어요.",
    "몇 달간 __를 하며 얻은 가장 큰 깨달음.",
    "저는 __가 저를 행복하게 해줄 줄 알았어요. 틀렸습니다.",
    "제가 __에서 완벽을 쫓는 걸 멈춘 이유.",
    "이 마인드셋의 변화가 __의 모든 걸 바꿨어요.",
    "가끔 __가 얼마나 외롭게 느껴지는지 아무도 말하지 않아요.",
  ],
};

const MEMORY: MemoryEntry[] = [
  { id: "M-01", tag: "기업", txt: "BALMYGARDEN = BALMYDADDY 전속 음반사. 심포닉/클래시컬 메탈, 다크판타지, 복음 발라드." },
  { id: "M-02", tag: "앱", txt: "영수증 OCR: Next.js 14 / Supabase / Gemini API / Vercel / Resend. 사전 테스팅 단계." },
  { id: "M-03", tag: "게임", txt: "LOD (Lord of Dynasty): React 다크판타지 턴제 RPG 리마스터. 프로토타입 완성." },
  { id: "M-04", tag: "CEO", txt: "김태을 대표. 파라텍 안전보건팀 과장. 모바일 낮 / PC 23시 이후." },
  { id: "M-05", tag: "QA", txt: "전 결과물 QA 95/100 통과 후 CEO 보고. AEGIS → CONDUCTOR 최종 확인." },
  { id: "M-06", tag: "크레딧", txt: "Higgsfield 월 크레딧 = LOD 게임 아트 전용. CEO 승인 전 타 용도 절대 금지." },
  { id: "M-07", tag: "Fugu", txt: "에이전트 배정 시 이유 공개 필수. 블랙박스 금지 (CONDUCTOR 핵심)." },
  { id: "M-08", tag: "배급", txt: "DistroKid 음원 배급. 아티스트: BALMYDADDY, JEDMIR, DUBUREN." },
  { id: "M-09", tag: "스택", txt: "GitHub: balmydaddy/lord-of-dark. CI/CD: Harness.io → Vercel. Obsidian: D:\\obsidian\\obsidian." },
  { id: "M-10", tag: "소스", txt: "모니터링: @parky0ngnam, @_business.story, @shoppduddn_, @platformtree_, trenddalkak_ai, keanu_visuals." },
  { id: "M-11", tag: "학습", txt: "v3.0 탑재: 파인만·오류시뮬·번역기·경로설계·빈틈탐지·곡선파괴 6종." },
  { id: "M-12", tag: "마케팅", txt: "v3.0 탑재: 고객조사·이메일·광고카피·포지셔닝·상세페이지·크리에이터·영상스크립트 7종." },
  { id: "M-13", tag: "콘텐츠", txt: "훅 20개 + How-To·팁·스토리텔링 각 10개 탑재. MUSE/NOVA 우선 활용." },
  { id: "M-14", tag: "안전", txt: "ISO 45001/14001, 중대재해처벌법, 산업안전기사 준비 중. 파라텍 20개 현장." },
  { id: "M-15", tag: "버전", txt: "Dashboard v3.1 (2026.06.24). 신규: @platformtree_ 12단계 사업 사다리 통합." },
  { id: "M-16", tag: "12단계", txt: "@platformtree_ 사업 성장 사다리. BG 현황: 음악=2단계(기술판매), 앱/게임=3단계(제품판매). 목표: 음악→제품화, 앱→정보상품, 게임→주목확보." },
];

const SCHEDULES: ScheduleEntry[] = [
  { time: "매일 07:00", agent: "SCOUT", task: "Higgsfield 크레딧 잔여량 + 무료 AI 도구 업데이트 체크" },
  { time: "매일 08:00", agent: "REX", task: "일일 업무 우선순위 정리 (앱/게임/음악 3트랙)" },
  { time: "매주 월 09:00", agent: "CONDUCTOR", task: "주간 에이전트 업무 배분 + QA 스케줄 수립" },
  { time: "매주 금 17:00", agent: "REX·SCOUT", task: "주간 성과 보고 + 다음 주 계획 초안 CEO 제출" },
  { time: "발매 D-7", agent: "NOVA·MUSE", task: "마케팅 콘텐츠 + 릴스 스크립트 완성" },
  { time: "발매 D-1", agent: "REX", task: "DistroKid 배급 확인 + 플랫폼별 메타데이터 검수" },
  { time: "매월 1일", agent: "SCOUT", task: "월간 AI 도구 크레딧 현황 점검 + 신규 무료 도구 보고" },
  { time: "분기 말", agent: "AEGIS·REX", task: "법무/경영 리스크 검토 + ISO 감사 대응 체크" },
];

const TOOLS: ToolEntry[] = [
  { name: "Higgsfield", use: "🔒 LOD 게임 아트 전용", fb: "Runway ML", warn: true },
  { name: "Runway ML", use: "무료 영상 AI 125크레딧/월", fb: "Kling AI" },
  { name: "Kling AI", use: "일 66크레딧 무료", fb: "Pika 2.1" },
  { name: "Pika 2.1", use: "무료 티어 (워터마크)", fb: "Luma" },
  { name: "Suno AI", use: "음악/BGM — BALMYDADDY 명의", fb: "—" },
  { name: "Midjourney", use: "게임 컨셉 아트", fb: "DALL-E" },
  { name: "DALL-E", use: "앨범 커버 아트", fb: "—" },
  { name: "Manus AI", use: "인스타 릴스 자동생성", fb: "—" },
  { name: "Remotion", use: "영상 편집 · MP4 출력", fb: "—" },
  { name: "DistroKid", use: "음원 배급", fb: "—" },
];

/* ══════════════════════════════════════════════════════
   DIRECT CHAT — single agent
══════════════════════════════════════════════════════ */
interface DirectChatMsg { role: "user" | "agent"; text: string; }

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function BALMYGARDENDashboard() {
  const [tab, setTab] = useState("home");
  const [wfId, setWfId] = useState<string | null>(null);
  const [wfInput, setWfInput] = useState("");
  const [chainRes, setChainRes] = useState<ChainResult[]>([]);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [awaitCEO, setAwaitCEO] = useState(false);
  const [agentOpen, setAgentOpen] = useState<string | null>(null);
  const [promptTab, setPromptTab] = useState("학습");
  const [tmplCat, setTmplCat] = useState(Object.keys(TEMPLATES)[0]);
  const [hookQ, setHookQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Direct chat with single agent
  const [chatAgent, setChatAgent] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<DirectChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Notion
  const [notionToast, setNotionToast] = useState<NotionToast | null>(null);
  const [notionSaving, setNotionSaving] = useState(false);

  // Level 2: Context injection toggle
  const [ctxEnabled, setCtxEnabled] = useState(true);

  // Level 7: Dual team mode
  const [teamMode, setTeamMode] = useState(false);
  const [teamWfId, setTeamWfId] = useState<string | null>(null);
  const [teamInput, setTeamInput] = useState("");
  const [teamRes, setTeamRes] = useState<ChainResult[]>([]);
  const [teamRunning, setTeamRunning] = useState(false);

  // Notion history
  const [notionHistory, setNotionHistory] = useState<{ id: string; url: string; title: string; type: string; status: string; date: string }[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await fetch("/api/notion?limit=20");
      const data = await res.json();
      if (data.entries) setNotionHistory(data.entries);
    } catch {
      // silent
    } finally {
      setHistLoading(false);
    }
  }, []);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const abortRef = useRef(false);

  const copy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  }, []);

  const CopyBtn = ({ text, id, small }: { text: string; id: string; small?: boolean }) => (
    <button
      onClick={() => copy(text, id)}
      style={{
        padding: small ? "2px 7px" : "4px 10px",
        fontSize: small ? "10px" : "11px",
        background: copied === id ? "#22C55E" : "#1e293b",
        color: "#fff",
        border: `1px solid ${copied === id ? "#22C55E" : "#334155"}`,
        borderRadius: "5px",
        cursor: "pointer",
        whiteSpace: "nowrap" as const,
        flexShrink: 0,
      }}
    >
      {copied === id ? "✓" : "복사"}
    </button>
  );

  /* ── Notion save helper */
  const saveToNotion = useCallback(async (action: string, payload: unknown) => {
    setNotionSaving(true);
    setNotionToast(null);
    try {
      const res = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNotionToast({ msg: "노션에 저장됐습니다!", url: data.url, ok: true });
    } catch (e: unknown) {
      setNotionToast({ msg: `저장 실패: ${(e as Error).message}`, ok: false });
    }
    setNotionSaving(false);
    setTimeout(() => setNotionToast(null), 5000);
  }, []);

  const NotionBtn = ({
    action, payload, label, small,
  }: {
    action: string;
    payload: unknown;
    label?: string;
    small?: boolean;
  }) => (
    <button
      onClick={() => saveToNotion(action, payload)}
      disabled={notionSaving}
      style={{
        padding: small ? "2px 8px" : "6px 14px",
        fontSize: small ? "10px" : "12px",
        background: notionSaving ? "#334155" : "#1e1e2e",
        color: "#e2e8f0",
        border: "1px solid #4a4a6a",
        borderRadius: "6px",
        cursor: notionSaving ? "not-allowed" : "pointer",
        whiteSpace: "nowrap" as const,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span style={{ fontSize: small ? "10px" : "12px" }}>N</span>
      {label ?? "노션 저장"}
    </button>
  );

  /* ── callAgent: secure server proxy (Level 2: context injection) */
  const callAgent = async (agentKey: string, userMessage: string): Promise<string> => {
    const ag = AGENTS[agentKey];
    const memCtx = ctxEnabled
      ? `\n\n[BALMYGARDEN 기업 컨텍스트 — 항상 참조]\n${MEMORY.map((m) => `[${m.tag}] ${m.txt}`).join("\n")}`
      : "";
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt: ag.sys + memCtx, userMessage }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text as string;
  };

  /* ── Chain execution (Level 6: parallel groups support) */
  const runChain = useCallback(async () => {
    if (!wfId || !wfInput.trim()) return;
    const wf = WORKFLOWS.find((w) => w.id === wfId)!;
    setRunning(true);
    setChainRes([]);
    setStep(0);
    setAwaitCEO(false);
    abortRef.current = false;
    const results: ChainResult[] = [];

    if (wf.parallel) {
      // Level 6: parallel group execution
      let prevOutputs: string[] = [wfInput];
      for (let gi = 0; gi < wf.parallel.length; gi++) {
        if (abortRef.current) break;
        const group = wf.parallel[gi];
        setStep(gi);
        const prevCtx = prevOutputs.join("\n\n---\n\n");
        const groupResults = await Promise.all(
          group.map(async (key) => {
            const ag = AGENTS[key];
            try {
              const userMsg =
                gi === 0
                  ? `업무 요청: ${wfInput}`
                  : `이전 에이전트 결과:\n${prevCtx}\n\n당신의 전문 영역에서 다음 단계를 처리하세요.`;
              const txt = await callAgent(key, userMsg);
              return { key, ag, txt, done: true } as ChainResult;
            } catch (e: unknown) {
              return { key, ag, txt: `⚠️ 오류: ${(e as Error).message}`, done: false } as ChainResult;
            }
          })
        );
        results.push(...groupResults);
        setChainRes([...results]);
        prevOutputs = groupResults.map((r) => `[${r.key}] ${r.txt}`);
        await new Promise((r) => setTimeout(r, 300));
      }
    } else {
      // Sequential execution
      let prev = wfInput;
      for (let i = 0; i < wf.chain.length; i++) {
        if (abortRef.current) break;
        const key = wf.chain[i];
        const ag = AGENTS[key];
        setStep(i);
        try {
          const userMsg =
            i === 0
              ? `업무 요청: ${prev}`
              : `이전 단계(${wf.chain[i - 1]}) 결과:\n${prev}\n\n당신의 전문 영역에서 다음 단계를 처리하세요.`;
          const txt = await callAgent(key, userMsg);
          results.push({ key, ag, txt, done: true });
          setChainRes([...results]);
          prev = txt;
          await new Promise((r) => setTimeout(r, 400));
        } catch (e: unknown) {
          const err = e as Error;
          results.push({ key, ag, txt: `⚠️ 오류: ${err.message}`, done: false });
          setChainRes([...results]);
          break;
        }
      }
    }

    setRunning(false);
    setStep(-1);
    setAwaitCEO(true);

    // 자동 노션 저장
    if (results.length > 0) {
      fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_workflow",
          payload: {
            workflowName: wf.name,
            input: wfInput,
            results: results.map((r) => ({ agent: r.key, role: r.ag.role, text: r.txt, done: r.done })),
          },
        }),
      }).catch(() => {});
    }
  }, [wfId, wfInput, ctxEnabled]);

  /* ── Level 7: Team chain run (second parallel chain) */
  const runTeamChain = useCallback(async () => {
    if (!teamWfId || !teamInput.trim()) return;
    const wf = WORKFLOWS.find((w) => w.id === teamWfId)!;
    setTeamRunning(true);
    setTeamRes([]);
    const results: ChainResult[] = [];
    let prev = teamInput;
    for (let i = 0; i < wf.chain.length; i++) {
      const key = wf.chain[i];
      const ag = AGENTS[key];
      try {
        const userMsg = i === 0 ? `업무 요청: ${prev}` : `이전 단계(${wf.chain[i - 1]}) 결과:\n${prev}\n\n당신의 전문 영역에서 다음 단계를 처리하세요.`;
        const txt = await callAgent(key, userMsg);
        results.push({ key, ag, txt, done: true });
        setTeamRes([...results]);
        prev = txt;
      } catch (e: unknown) {
        results.push({ key, ag, txt: `⚠️ 오류: ${(e as Error).message}`, done: false });
        setTeamRes([...results]);
        break;
      }
    }
    setTeamRunning(false);
  }, [teamWfId, teamInput, ctxEnabled]);

  /* ── Direct chat send */
  const sendChat = useCallback(async () => {
    if (!chatAgent || !chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs((prev) => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const reply = await callAgent(chatAgent, msg);
      setChatMsgs((prev) => [...prev, { role: "agent", text: reply }]);
    } catch (e: unknown) {
      const err = e as Error;
      setChatMsgs((prev) => [...prev, { role: "agent", text: `⚠️ 오류: ${err.message}` }]);
    }
    setChatLoading(false);
  }, [chatAgent, chatInput, chatLoading]);

  /* ── STYLE HELPERS */
  const S = {
    card: (border?: string): CSSProperties => ({
      background: "#0d1629",
      borderRadius: "12px",
      border: `1px solid ${border || "#1e293b"}`,
      padding: "16px",
    }),
    tabBtn: (active: boolean, color?: string): CSSProperties => ({
      padding: "6px 14px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: active ? "700" : "400",
      border: "none",
      background: active ? color || "#6366F1" : "#0d1629",
      color: active ? "#fff" : "#64748b",
    }),
    sideItem: (active: boolean): CSSProperties => ({
      padding: "10px 14px",
      marginBottom: "6px",
      borderRadius: "8px",
      cursor: "pointer",
      background: active ? "#1a2847" : "#0d1629",
      border: `1px solid ${active ? "#6366F1" : "#1e293b"}`,
    }),
    badge: (color: string): CSSProperties => ({
      fontSize: "10px",
      padding: "2px 7px",
      borderRadius: "4px",
      background: color + "22",
      color,
      border: `1px solid ${color}44`,
    }),
  };

  const filteredHooks = HOOKS.filter((h) => !hookQ || h.includes(hookQ));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060d1f",
        color: "#e2e8f0",
        fontFamily: "'Pretendard','Apple SD Gothic Neo','Segoe UI',sans-serif",
      }}
    >
      {/* ── HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg,#080f22 0%,#0f0d30 100%)",
          borderBottom: "1px solid #1a2547",
          padding: isMobile ? "10px 14px" : "14px 22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{ fontSize: isMobile ? "20px" : "26px" }}>🌿</div>
          <div>
            <div style={{ fontSize: isMobile ? "15px" : "18px", fontWeight: "800", color: "#a5b4fc", letterSpacing: "2px" }}>
              BALMYGARDEN
            </div>
            <div style={{ fontSize: "10px", color: "#475569", marginTop: "1px" }}>
              AI AGENCY · 9 AGENTS · v3.0
            </div>
          </div>
          {!isMobile && (
            <div style={{ marginLeft: "auto", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {Object.entries(AGENTS).map(([k, a]) => (
                <span key={k} style={S.badge(a.color)}>{a.av} {k}</span>
              ))}
            </div>
          )}
        </div>
        {/* 탭 — 모바일에선 가로 스크롤 */}
        <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: isMobile ? "4px" : "0", flexWrap: isMobile ? "nowrap" : "wrap" }}>
          {[
            { id: "home", label: "🏠 홈" },
            { id: "workflow", label: "⚡ 워크플로" },
            { id: "agents", label: "🤖 에이전트" },
            { id: "chat", label: "💬 대화" },
            { id: "prompts", label: "📚 프롬프트" },
            { id: "content", label: "📝 콘텐츠" },
            { id: "system", label: "⚙️ 시스템" },
            { id: "ladder", label: "📈 사다리" },
            { id: "history", label: "📒 히스토리" },
            { id: "guide", label: "📚 가이드" },
          ].map((t) => (
            <button
              key={t.id}
              style={{ ...S.tabBtn(tab === t.id), flexShrink: 0, fontSize: isMobile ? "11px" : "12px", padding: isMobile ? "5px 10px" : "6px 14px" }}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── NOTION TOAST */}
      {notionToast && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, padding: "12px 18px", borderRadius: "10px", background: notionToast.ok ? "#1e2d1e" : "#2d1e1e", border: `1px solid ${notionToast.ok ? "#22C55E" : "#EF4444"}`, display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 24px #00000077" }}>
          <span style={{ fontSize: "14px" }}>{notionToast.ok ? "✅" : "❌"}</span>
          <span style={{ fontSize: "13px", color: notionToast.ok ? "#86efac" : "#fca5a5" }}>{notionToast.msg}</span>
          {notionToast.url && (
            <a href={notionToast.url} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#a5b4fc", textDecoration: "underline" }}>
              노션에서 열기 →
            </a>
          )}
        </div>
      )}

      <div style={{ padding: isMobile ? "12px 10px" : "20px 22px" }}>
        {/* ══════ HOME ══════ */}
        {tab === "home" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              {[
                { emoji: "🗂️", name: "영수증 OCR 앱", status: "사전 테스팅", color: "#6366F1", detail: "Next.js 14 · Supabase · Gemini API · Vercel" },
                { emoji: "⚔️", name: "LOD: Lord of Dynasty", status: "프로토타입 완성", color: "#8B5CF6", detail: "React 다크판타지 턴제 RPG · Harness CI/CD" },
                { emoji: "🎵", name: "BALMYDADDY", status: "배급 중", color: "#F59E0B", detail: "DistroKid · 심포닉 메탈 · 다크판타지 · 복음" },
              ].map((p) => (
                <div key={p.name} style={S.card(p.color + "44")}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>{p.emoji}</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "3px" }}>{p.name}</div>
                  <div style={{ fontSize: "11px", color: p.color, marginBottom: "6px" }}>● {p.status}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{p.detail}</div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card(), marginBottom: "18px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "12px" }}>
                🆕 v3.0 업그레이드 (2026.06.24)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "10px" }}>
                {[
                  { icon: "🧠", title: "학습 강화 프롬프트 6종", src: "@parky0ngnam", items: ["학습 곡선 파괴자", "실제 오류 시뮬레이터", "불가능한 언어 번역기", "개인 맞춤 학습 경로 설계자", "숨은 빈틈 탐지기", "강제 파인만 기법"], color: "#6366F1" },
                  { icon: "📣", title: "마케팅 프롬프트 7종", src: "@_business.story", items: ["고객 조사", "이메일 마케팅", "광고 카피", "브랜드 포지셔닝", "상세 페이지 심리학", "크리에이터 성장", "영상 콘텐츠 스크립트"], color: "#06B6D4" },
                  { icon: "📝", title: "콘텐츠 뱅크 80개+", src: "@shoppduddn_", items: ["즉시 시선 끄는 훅 20개", "초보자/How-To 10개", "팁·도구·해킹 10개", "스토리텔링 10개"], color: "#F59E0B" },
                ].map((u) => (
                  <div key={u.title} style={{ padding: "12px", background: "#111827", borderRadius: "8px", borderLeft: `3px solid ${u.color}` }}>
                    <div style={{ fontSize: "16px", marginBottom: "4px" }}>{u.icon}</div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: u.color, marginBottom: "2px" }}>{u.title}</div>
                    <div style={{ fontSize: "10px", color: "#475569", marginBottom: "8px" }}>{u.src}</div>
                    {u.items.map((i) => (
                      <div key={i} style={{ fontSize: "10px", color: "#94a3b8", padding: "1px 0" }}>· {i}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* 7단계 레벨 현황 */}
            <div style={{ ...S.card(), marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc" }}>📊 클로드 코드 7단계 — BALMYGARDEN 현황</div>
                <a href="/guide" target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#d97757", textDecoration: "none", background: "#d9775715", border: "1px solid #d9775740", borderRadius: "20px", padding: "3px 10px" }}>📚 전체 가이드 →</a>
              </div>
              {[
                { lv: 1, name: "프롬프트", pct: 100, state: "✅", note: "9 에이전트 시스템 프롬프트 완비", color: "#22c55e" },
                { lv: 2, name: "컨텍스트", pct: ctxEnabled ? 90 : 50, state: ctxEnabled ? "✅" : "⚠️", note: ctxEnabled ? "MEMORY 16개 → 전 에이전트 자동 주입 ON" : "컨텍스트 주입 OFF", color: ctxEnabled ? "#22c55e" : "#eab308" },
                { lv: 3, name: "도구", pct: 100, state: "✅", note: "Claude API 서버 프록시 동작", color: "#22c55e" },
                { lv: 4, name: "MCP 연결", pct: 95, state: "✅", note: "Notion 자동 로깅 — 워크플로우/대화/로그", color: "#22c55e" },
                { lv: 5, name: "스킬", pct: 85, state: "✅", note: "12 워크플로우 + 퀵 스킬 원클릭 런처", color: "#22c55e" },
                { lv: 6, name: "서브에이전트", pct: 80, state: "✅", note: "병렬 그룹 실행 (Promise.all) 적용", color: "#22c55e" },
                { lv: 7, name: "에이전트 팀", pct: 55, state: "🔧", note: "듀얼 체인 팀 모드 — 워크플로우 탭 하단", color: "#f97316" },
              ].map((l) => (
                <div key={l.lv} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "11px", color: "#475569", minWidth: "16px" }}>{l.lv}</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: l.color, minWidth: "90px" }}>{l.state} {l.name}</span>
                    <div style={{ flex: 1, background: "#1e293b", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                      <div style={{ width: `${l.pct}%`, height: "100%", background: l.color, borderRadius: "4px", transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: "10px", color: "#64748b", minWidth: "30px", textAlign: "right" }}>{l.pct}%</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#475569", marginLeft: "24px" }}>{l.note}</div>
                </div>
              ))}
              {/* Context toggle */}
              <div style={{ marginTop: "12px", padding: "10px 12px", background: "#111827", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: ctxEnabled ? "#22c55e" : "#64748b" }}>
                    {ctxEnabled ? "🟢" : "⚫"} Level 2 컨텍스트 주입 {ctxEnabled ? "ON" : "OFF"}
                  </div>
                  <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>MEMORY 16개를 모든 에이전트 시스템 프롬프트에 자동 추가</div>
                </div>
                <button
                  onClick={() => setCtxEnabled(!ctxEnabled)}
                  style={{ padding: "5px 14px", background: ctxEnabled ? "#22c55e22" : "#334155", border: `1px solid ${ctxEnabled ? "#22c55e" : "#475569"}`, borderRadius: "20px", color: ctxEnabled ? "#22c55e" : "#94a3b8", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                >
                  {ctxEnabled ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            <div style={S.card()}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "12px" }}>
                ⚡ 빠른 시작 — 워크플로우 선택
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "8px" }}>
                {WORKFLOWS.map((wf) => (
                  <button
                    key={wf.id}
                    onClick={() => { setWfId(wf.id); setTab("workflow"); }}
                    style={{ padding: "10px 12px", background: "#111827", borderRadius: "8px", border: "1px solid #1e293b", cursor: "pointer", textAlign: "left", color: "#e2e8f0" }}
                  >
                    <span style={{ fontSize: "16px" }}>{wf.emoji}</span>
                    <span style={{ fontSize: "12px", fontWeight: "600", marginLeft: "6px" }}>{wf.name}</span>
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "3px" }}>{wf.chain.join(" → ")}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════ WORKFLOW ══════ */}
        {tab === "workflow" && (
          <>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: "14px" }}>
            {/* 모바일: 드롭다운 선택 / 데스크탑: 사이드 목록 */}
            {isMobile ? (
              <select
                value={wfId ?? ""}
                onChange={(e) => { setWfId(e.target.value || null); setChainRes([]); setAwaitCEO(false); }}
                style={{ width: "100%", padding: "10px 12px", background: "#0d1629", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0", fontSize: "13px" }}
              >
                <option value="">— 워크플로우 선택 —</option>
                {WORKFLOWS.map((wf) => (
                  <option key={wf.id} value={wf.id}>{wf.emoji} {wf.name}</option>
                ))}
              </select>
            ) : (
              <div>
                <div style={{ fontSize: "11px", color: "#475569", marginBottom: "8px" }}>워크플로우</div>
                {WORKFLOWS.map((wf) => (
                  <div
                    key={wf.id}
                    style={S.sideItem(wfId === wf.id)}
                    onClick={() => { setWfId(wf.id); setChainRes([]); setAwaitCEO(false); }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: "700" }}>{wf.emoji} {wf.name}</div>
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>{wf.chain.join(" → ")}</div>
                  </div>
                ))}
              </div>
            )}

            <div>
              {wfId ? (() => {
                const wf = WORKFLOWS.find((w) => w.id === wfId)!;
                return (
                  <>
                    <div style={{ ...S.card(), marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "16px", fontWeight: "700" }}>{wf.emoji} {wf.name}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{wf.desc}</div>
                        </div>
                        {wf.parallel && (
                          <span style={{ fontSize: "10px", padding: "2px 8px", background: "#22c55e22", border: "1px solid #22c55e44", borderRadius: "10px", color: "#22c55e", flexShrink: 0 }}>
                            ⚡ L6 병렬 실행
                          </span>
                        )}
                      </div>

                      {/* Agent chain visualization */}
                      <div style={{ marginBottom: "14px", marginTop: "12px" }}>
                        {wf.parallel ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            {wf.parallel.map((group, gi) => (
                              <div key={gi} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                {gi > 0 && <span style={{ color: "#334155", fontSize: "14px" }}>→</span>}
                                <div style={{ display: "flex", gap: "4px", padding: group.length > 1 ? "4px 6px" : "0", background: group.length > 1 ? "#22c55e0d" : "transparent", border: group.length > 1 ? "1px dashed #22c55e44" : "none", borderRadius: "8px" }}>
                                  {group.map((k) => {
                                    const ag = AGENTS[k];
                                    const active = running && step === gi;
                                    return (
                                      <div key={k} style={{ padding: "5px 10px", borderRadius: "6px", background: active ? ag.color : ag.color + "22", border: `1px solid ${ag.color}`, fontSize: "11px", fontWeight: "700", color: active ? "#fff" : ag.color, boxShadow: active ? `0 0 10px ${ag.color}66` : "none", transition: "all 0.3s" }}>
                                        {ag.av} {k}
                                      </div>
                                    );
                                  })}
                                  {group.length > 1 && <span style={{ fontSize: "9px", color: "#22c55e", alignSelf: "center", marginLeft: "2px" }}>병렬</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            {wf.chain.map((k, i) => {
                              const ag = AGENTS[k];
                              const active = running && step === i;
                              return (
                                <div key={k} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <div style={{ padding: "5px 10px", borderRadius: "6px", background: active ? ag.color : ag.color + "22", border: `1px solid ${ag.color}`, fontSize: "11px", fontWeight: "700", color: active ? "#fff" : ag.color, boxShadow: active ? `0 0 10px ${ag.color}66` : "none", transition: "all 0.3s" }}>
                                    {ag.av} {k}
                                  </div>
                                  {i < wf.chain.length - 1 && <span style={{ color: "#334155", fontSize: "14px" }}>→</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Quick Skill button */}
                      {wf.quickSkill && (
                        <div style={{ marginBottom: "10px" }}>
                          <button
                            onClick={() => setWfInput(wf.quickSkill!)}
                            style={{ fontSize: "11px", padding: "4px 12px", background: "#d9775715", border: "1px solid #d9775740", borderRadius: "20px", color: "#d97757", cursor: "pointer" }}
                          >
                            ⚡ L5 퀵 스킬 — 기본 입력 불러오기
                          </button>
                        </div>
                      )}

                      <textarea
                        value={wfInput}
                        onChange={(e) => setWfInput(e.target.value)}
                        placeholder={`${wf.name} 업무 내용을 입력하세요...`}
                        style={{ width: "100%", minHeight: "80px", background: "#111827", border: "1px solid #1e293b", borderRadius: "8px", padding: "10px", color: "#e2e8f0", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          onClick={runChain}
                          disabled={running || !wfInput.trim()}
                          style={{ padding: "10px 22px", background: running ? "#334155" : "#6366F1", color: "#fff", border: "none", borderRadius: "8px", cursor: running ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px" }}
                        >
                          {running ? `⏳ ${wf.parallel ? `병렬 그룹 ${step + 1}/${wf.parallel.length}` : `실행 중… ${wf.chain[step] || ""}`}` : "▶ 체인 실행"}
                        </button>
                        {running && (
                          <button onClick={() => { abortRef.current = true; setRunning(false); }} style={{ padding: "10px 16px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                            ■ 중단
                          </button>
                        )}
                        <div style={{ marginLeft: "auto", fontSize: "11px", color: ctxEnabled ? "#22c55e" : "#475569" }}>
                          {ctxEnabled ? "🟢 컨텍스트 ON" : "⚫ 컨텍스트 OFF"}
                        </div>
                      </div>
                    </div>

                    {chainRes.map((r, i) => (
                      <div key={i} style={{ ...S.card(r.ag.color + "44"), marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                          <span style={{ fontSize: "20px" }}>{r.ag.av}</span>
                          <div>
                            <span style={{ color: r.ag.color, fontWeight: "700", fontSize: "14px" }}>{r.key}</span>
                            <span style={{ color: "#475569", fontSize: "11px", marginLeft: "8px" }}>{r.ag.role}</span>
                          </div>
                          <span style={{ marginLeft: "auto", fontSize: "11px", color: r.done ? "#22C55E" : "#EF4444" }}>
                            {r.done ? "✓ 완료" : "✗ 오류"}
                          </span>
                        </div>
                        <div style={{ background: "#111827", borderRadius: "8px", padding: "12px", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap", color: "#cbd5e1" }}>
                          {r.txt}
                        </div>
                      </div>
                    ))}

                    {awaitCEO && (
                      <div style={{ ...S.card("#6366F1"), background: "#0f1d40", border: "2px solid #6366F1", textAlign: "center", padding: "24px" }}>
                        <div style={{ fontSize: "20px", marginBottom: "6px" }}>👑</div>
                        <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "4px" }}>CEO(대표이사) 최종 결재 대기</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "16px" }}>QA 95/100 통과 완료 · 대표이사 승인 필요</div>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                          <button onClick={() => setAwaitCEO(false)} style={{ padding: "10px 22px", background: "#22C55E", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>✅ 최종 승인</button>
                          <button onClick={() => { setAwaitCEO(false); setChainRes([]); }} style={{ padding: "10px 22px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>🔄 반려 · 재검토</button>
                          <NotionBtn
                            action="save_workflow"
                            payload={{
                              workflowName: WORKFLOWS.find((w) => w.id === wfId)?.name ?? "",
                              input: wfInput,
                              results: chainRes.map((r) => ({ agent: r.key, role: r.ag.role, text: r.txt, done: r.done })),
                            }}
                            label="📎 노션 저장"
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })() : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#334155", fontSize: "14px" }}>
                  ← 워크플로우를 선택하세요
                </div>
              )}
            </div>
          </div>

          {/* ══ Level 7: Dual Team Mode ══ */}
          <div style={{ marginTop: "20px", ...S.card("#f9731644") }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#f97316" }}>🏆 Level 7 — 에이전트 팀 (듀얼 체인)</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>두 워크플로우를 동시에 실행해 결과를 비교합니다</div>
              </div>
              <button
                onClick={() => setTeamMode(!teamMode)}
                style={{ padding: "5px 14px", background: teamMode ? "#f9731622" : "#334155", border: `1px solid ${teamMode ? "#f97316" : "#475569"}`, borderRadius: "20px", color: teamMode ? "#f97316" : "#94a3b8", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
              >
                {teamMode ? "팀 모드 ON ▲" : "팀 모드 열기 ▼"}
              </button>
            </div>
            {teamMode && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                {/* Chain A (current) */}
                <div style={{ padding: "14px", background: "#0d1629", borderRadius: "10px", border: "1px solid #6366F144" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#6366F1", marginBottom: "10px" }}>🔵 체인 A (현재 워크플로우)</div>
                  {wfId ? (
                    <>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px" }}>
                        {WORKFLOWS.find(w => w.id === wfId)?.emoji} {WORKFLOWS.find(w => w.id === wfId)?.name}
                      </div>
                      <div style={{ fontSize: "11px", color: wfInput ? "#e2e8f0" : "#475569" }}>
                        {wfInput ? `"${wfInput.slice(0, 60)}..."` : "← 워크플로우 탭에서 입력 필요"}
                      </div>
                      {chainRes.length > 0 && (
                        <div style={{ marginTop: "8px", fontSize: "10px", color: "#22c55e" }}>✓ {chainRes.length}개 에이전트 완료</div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: "11px", color: "#475569" }}>← 좌측에서 워크플로우 선택</div>
                  )}
                </div>

                {/* Chain B (team) */}
                <div style={{ padding: "14px", background: "#0d1629", borderRadius: "10px", border: "1px solid #f9731644" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#f97316", marginBottom: "10px" }}>🟠 체인 B (비교 워크플로우)</div>
                  <select
                    value={teamWfId ?? ""}
                    onChange={(e) => { setTeamWfId(e.target.value || null); setTeamRes([]); }}
                    style={{ width: "100%", padding: "7px 10px", background: "#111827", border: "1px solid #1e293b", borderRadius: "6px", color: "#e2e8f0", fontSize: "11px", marginBottom: "8px" }}
                  >
                    <option value="">— 비교 워크플로우 선택 —</option>
                    {WORKFLOWS.map((wf) => (
                      <option key={wf.id} value={wf.id}>{wf.emoji} {wf.name}</option>
                    ))}
                  </select>
                  <textarea
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    placeholder="체인 B 업무 내용 (체인 A와 다르게 설정 가능)"
                    style={{ width: "100%", minHeight: "60px", background: "#111827", border: "1px solid #1e293b", borderRadius: "6px", padding: "8px", color: "#e2e8f0", fontSize: "11px", resize: "vertical", boxSizing: "border-box", marginBottom: "8px" }}
                  />
                  <button
                    onClick={runTeamChain}
                    disabled={teamRunning || !teamWfId || !teamInput.trim()}
                    style={{ padding: "8px 16px", background: teamRunning ? "#334155" : "#f97316", color: "#fff", border: "none", borderRadius: "6px", cursor: teamRunning ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "11px" }}
                  >
                    {teamRunning ? "⏳ B 실행 중..." : "▶ 체인 B 실행"}
                  </button>
                  {teamRes.length > 0 && (
                    <div style={{ marginTop: "8px", fontSize: "10px", color: "#22c55e" }}>✓ {teamRes.length}개 에이전트 완료</div>
                  )}
                </div>

                {/* Dual results */}
                {(chainRes.length > 0 || teamRes.length > 0) && (
                  <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#6366F1", marginBottom: "8px" }}>🔵 체인 A 결과</div>
                      {chainRes.map((r, i) => (
                        <div key={i} style={{ marginBottom: "6px", padding: "10px", background: "#111827", borderRadius: "8px", borderLeft: `3px solid ${r.ag.color}` }}>
                          <div style={{ fontSize: "11px", color: r.ag.color, fontWeight: "700", marginBottom: "4px" }}>{r.ag.av} {r.key}</div>
                          <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.6" }}>{r.txt.slice(0, 200)}{r.txt.length > 200 ? "..." : ""}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#f97316", marginBottom: "8px" }}>🟠 체인 B 결과</div>
                      {teamRes.map((r, i) => (
                        <div key={i} style={{ marginBottom: "6px", padding: "10px", background: "#111827", borderRadius: "8px", borderLeft: `3px solid ${r.ag.color}` }}>
                          <div style={{ fontSize: "11px", color: r.ag.color, fontWeight: "700", marginBottom: "4px" }}>{r.ag.av} {r.key}</div>
                          <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.6" }}>{r.txt.slice(0, 200)}{r.txt.length > 200 ? "..." : ""}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
        )}

        {/* ══════ AGENTS ══════ */}
        {tab === "agents" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "12px" }}>
            {Object.entries(AGENTS).map(([k, a]) => (
              <div
                key={k}
                style={S.card(agentOpen === k ? a.color : "#1e293b")}
                onClick={() => setAgentOpen(agentOpen === k ? null : k)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "26px" }}>{a.av}</span>
                  <div>
                    <div style={{ color: a.color, fontWeight: "800", fontSize: "15px" }}>{k}</div>
                    <div style={{ fontSize: "10px", color: "#475569" }}>{a.code} · {a.type}</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>{a.role}</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: agentOpen === k ? "12px" : "0" }}>{a.desc}</div>
                {agentOpen === k && (
                  <div style={{ background: "#111827", borderRadius: "8px", padding: "10px", fontSize: "11px", color: "#94a3b8", lineHeight: "1.7", whiteSpace: "pre-wrap", borderLeft: `3px solid ${a.color}` }}>
                    {a.sys}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center" }}>
                  <div style={{ fontSize: "10px", color: "#334155", flex: 1 }}>{agentOpen === k ? "▲ 닫기" : "▼ 시스템 프롬프트 보기"}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setChatAgent(k); setChatMsgs([]); setTab("chat"); }}
                    style={{ padding: "4px 10px", background: a.color + "33", color: a.color, border: `1px solid ${a.color}55`, borderRadius: "6px", cursor: "pointer", fontSize: "10px", fontWeight: "700" }}
                  >
                    💬 대화
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════ DIRECT CHAT ══════ */}
        {tab === "chat" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "220px 1fr", gap: "14px" }}>
            {isMobile ? (
              <select
                value={chatAgent ?? ""}
                onChange={(e) => { setChatAgent(e.target.value || null); setChatMsgs([]); }}
                style={{ width: "100%", padding: "10px 12px", background: "#0d1629", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0", fontSize: "13px" }}
              >
                <option value="">— 에이전트 선택 —</option>
                {Object.entries(AGENTS).map(([k, a]) => (
                  <option key={k} value={k}>{a.av} {k} — {a.role}</option>
                ))}
              </select>
            ) : (
              <div>
                <div style={{ fontSize: "11px", color: "#475569", marginBottom: "8px" }}>에이전트 선택</div>
                {Object.entries(AGENTS).map(([k, a]) => (
                  <div
                    key={k}
                    style={{ ...S.sideItem(chatAgent === k), borderLeft: chatAgent === k ? `3px solid ${a.color}` : undefined }}
                    onClick={() => { setChatAgent(k); setChatMsgs([]); }}
                  >
                    <span style={{ fontSize: "14px" }}>{a.av}</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", marginLeft: "8px", color: a.color }}>{k}</span>
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>{a.role}</div>
                  </div>
                ))}
              </div>
            )}

            <div>
              {chatAgent ? (() => {
                const ag = AGENTS[chatAgent];
                return (
                  <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
                    <div style={{ ...S.card(ag.color + "44"), marginBottom: "12px", padding: "12px 16px" }}>
                      <span style={{ fontSize: "18px" }}>{ag.av}</span>
                      <span style={{ color: ag.color, fontWeight: "800", fontSize: "15px", marginLeft: "8px" }}>{chatAgent}</span>
                      <span style={{ color: "#475569", fontSize: "11px", marginLeft: "8px" }}>{ag.role}</span>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                      {chatMsgs.length === 0 && (
                        <div style={{ textAlign: "center", color: "#334155", fontSize: "13px", marginTop: "40px" }}>
                          {ag.av} {chatAgent}에게 메시지를 보내세요
                        </div>
                      )}
                      {chatMsgs.map((m, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap", background: m.role === "user" ? "#6366F1" : "#111827", color: m.role === "user" ? "#fff" : "#cbd5e1", border: m.role === "agent" ? `1px solid ${ag.color}44` : "none" }}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                          <div style={{ padding: "10px 14px", borderRadius: "12px", background: "#111827", color: ag.color, fontSize: "13px", border: `1px solid ${ag.color}44` }}>
                            {ag.av} 응답 중…
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                          placeholder={`${chatAgent}에게 메시지 입력 (Enter 전송, Shift+Enter 줄바꿈)`}
                          rows={2}
                          style={{ flex: 1, background: "#111827", border: "1px solid #1e293b", borderRadius: "8px", padding: "10px", color: "#e2e8f0", fontSize: "13px", resize: "none" }}
                        />
                        <button
                          onClick={sendChat}
                          disabled={chatLoading || !chatInput.trim()}
                          style={{ padding: "0 20px", background: chatLoading ? "#334155" : ag.color, color: "#fff", border: "none", borderRadius: "8px", cursor: chatLoading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px" }}
                        >
                          전송
                        </button>
                      </div>
                      {chatMsgs.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <NotionBtn
                            action="save_chat"
                            payload={{ agentKey: chatAgent, agentRole: ag.role, messages: chatMsgs }}
                            label="📎 대화 노션 저장"
                            small
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#334155", fontSize: "14px" }}>
                  ← 에이전트를 선택하세요
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ PROMPTS ══════ */}
        {tab === "prompts" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {["학습", "마케팅", "훅"].map((t) => (
                <button key={t} style={S.tabBtn(promptTab === t)} onClick={() => setPromptTab(t)}>
                  {t === "학습" ? "🧠 학습 강화" : t === "마케팅" ? "📣 마케팅" : "💡 훅 문구"}
                </button>
              ))}
            </div>

            {promptTab === "학습" && LEARN_PROMPTS.map((p) => (
              <div key={p.id} style={{ ...S.card(), marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={S.badge("#6366F1")}>{p.id}</span>
                  <span style={{ fontSize: "14px", fontWeight: "700" }}>{p.name}</span>
                  <span style={{ fontSize: "10px", color: "#475569", marginLeft: "auto" }}>{p.src}</span>
                  <CopyBtn text={p.tpl} id={p.id} />
                  <NotionBtn action="save_prompt" payload={{ id: p.id, name: p.name, content: p.tpl, category: "학습" }} small />
                </div>
                <div style={{ background: "#111827", borderRadius: "8px", padding: "12px", fontSize: "12px", color: "#94a3b8", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
                  {p.tpl}
                </div>
              </div>
            ))}

            {promptTab === "마케팅" && MARKETING_PROMPTS.map((p) => (
              <div key={p.id} style={{ ...S.card(p.color + "33"), marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={S.badge(p.color)}>{p.id}</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: p.color }}>{p.name}</span>
                  <span style={{ fontSize: "10px", color: "#475569", marginLeft: "auto" }}>{p.src}</span>
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {p.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", background: "#111827", borderRadius: "8px", padding: "10px 12px" }}>
                      <span style={{ fontSize: "11px", color: p.color, minWidth: "16px", fontWeight: "700" }}>{i + 1}.</span>
                      <span style={{ fontSize: "12px", color: "#94a3b8", flex: 1 }}>{item}</span>
                      <CopyBtn text={item} id={`${p.id}-${i}`} small />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {promptTab === "훅" && (
              <div>
                <input
                  value={hookQ}
                  onChange={(e) => setHookQ(e.target.value)}
                  placeholder="훅 검색... (예: 실수, 변화, 진실)"
                  style={{ width: "100%", padding: "10px 14px", background: "#0d1629", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0", fontSize: "13px", marginBottom: "12px", boxSizing: "border-box" }}
                />
                {filteredHooks.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", ...S.card(), marginBottom: "8px", padding: "10px 14px" }}>
                    <span style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "700", minWidth: "34px" }}>H-{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: "13px", flex: 1 }}>{h}</span>
                    <CopyBtn text={h} id={`H-${i}`} small />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ CONTENT BANK ══════ */}
        {tab === "content" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {Object.keys(TEMPLATES).map((k) => (
                <button key={k} style={S.tabBtn(tmplCat === k, "#F59E0B")} onClick={() => setTmplCat(k)}>{k}</button>
              ))}
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              {TEMPLATES[tmplCat].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", ...S.card(), padding: "10px 14px" }}>
                  <span style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "700", minWidth: "24px" }}>{i + 1}.</span>
                  <span style={{ fontSize: "13px", flex: 1 }}>{item}</span>
                  <CopyBtn text={item} id={`T-${tmplCat}-${i}`} small />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════ SYSTEM ══════ */}
        {tab === "system" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>🧠 메모리 (16건)</div>
              {MEMORY.map((m) => (
                <div key={m.id} style={{ ...S.card(), marginBottom: "8px", padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10px", color: "#6366F1", fontWeight: "700" }}>{m.id}</span>
                    <span style={S.badge("#6366F1")}>{m.tag}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{m.txt}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>📅 자동 스케줄 (8건)</div>
              {SCHEDULES.map((s, i) => (
                <div key={i} style={{ ...S.card(), marginBottom: "8px", padding: "10px 14px" }}>
                  <div style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "700" }}>⏰ {s.time}</div>
                  <div style={{ fontSize: "11px", color: "#06B6D4", margin: "2px 0" }}>👤 {s.agent}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{s.task}</div>
                </div>
              ))}
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px", marginTop: "18px" }}>🛠️ Tool Pool</div>
              {TOOLS.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", ...S.card(t.warn ? "#EF444433" : "#1e293b"), marginBottom: "6px", padding: "8px 12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: t.warn ? "#EF4444" : "#22C55E", minWidth: "110px" }}>{t.name}</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8", flex: 1 }}>{t.use}</span>
                  {t.fb !== "—" && <span style={{ fontSize: "10px", color: "#475569" }}>↳ {t.fb}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════ LADDER ══════ */}
        {tab === "ladder" && (
          <div>
            <div style={{ ...S.card(), marginBottom: "18px", padding: "20px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#a5b4fc", marginBottom: "12px" }}>
                🎯 BALMYGARDEN 현재 단계 진단 (@platformtree_)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
                {[
                  { label: "🎵 음악 (BALMYDADDY)", stage: 2, name: "기술판매", next: "제품화 (앨범 번들/굿즈/게이트웨이)", color: "#F59E0B" },
                  { label: "🗂️ 영수증 OCR 앱", stage: 3, name: "제품판매", next: "정보 상품화 (가이드/SaaS 교육)", color: "#6366F1" },
                  { label: "⚔️ LOD 게임", stage: 3, name: "제품판매", next: "주목 확보 (커뮤니티/팬베이스)", color: "#8B5CF6" },
                ].map((b) => (
                  <div key={b.label} style={{ background: "#111827", borderRadius: "10px", border: `2px solid ${b.color}`, padding: "14px" }}>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>{b.label}</div>
                    <div style={{ fontSize: "22px", fontWeight: "800", color: b.color }}>{b.stage}단계</div>
                    <div style={{ fontSize: "11px", color: b.color, fontWeight: "600", marginBottom: "6px" }}>{b.name}</div>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>▶ 다음: {b.next}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: "14px", fontWeight: "700", color: "#a5b4fc", marginBottom: "12px" }}>📈 12단계 사업 성장 사다리</div>
            <div style={{ display: "grid", gap: "10px" }}>
              {LADDER_12.map((l) => {
                const isCurrent = l.step === 2 || l.step === 3;
                return (
                  <div key={l.step} style={{ background: "#0d1629", borderRadius: "10px", border: `1px solid ${isCurrent ? l.color : "#1e293b"}`, borderLeft: `4px solid ${l.color}`, padding: "14px 16px", boxShadow: isCurrent ? `0 0 12px ${l.color}33` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "20px" }}>{l.icon}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: l.color, fontWeight: "800", fontSize: "15px" }}>{l.step}단계</span>
                        <span style={{ fontSize: "14px", fontWeight: "700", marginLeft: "8px" }}>{l.name}</span>
                        {isCurrent && (
                          <span style={{ marginLeft: "8px", fontSize: "10px", padding: "2px 7px", background: l.color + "33", color: l.color, borderRadius: "10px", border: `1px solid ${l.color}` }}>
                            ← BG 현재
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px" }}>{l.desc}</div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "8px" }}>
                      <div style={{ background: "#111827", borderRadius: "6px", padding: "8px" }}>
                        <div style={{ fontSize: "10px", color: "#22C55E", fontWeight: "700", marginBottom: "4px" }}>✓ 현재 이 단계 신호</div>
                        {l.signal.map((s, i) => <div key={i} style={{ fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>· {s}</div>)}
                      </div>
                      <div style={{ background: "#111827", borderRadius: "6px", padding: "8px" }}>
                        <div style={{ fontSize: "10px", color: "#EF4444", fontWeight: "700", marginBottom: "4px" }}>⚠️ 핵심 문제</div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>{l.problem}</div>
                      </div>
                      <div style={{ background: "#111827", borderRadius: "6px", padding: "8px" }}>
                        <div style={{ fontSize: "10px", color: "#06B6D4", fontWeight: "700", marginBottom: "4px" }}>→ 다음 단계</div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>{l.next}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* ══════ HISTORY ══════ */}
        {tab === "history" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc" }}>📒 노션 활동 히스토리</div>
              <button
                onClick={fetchHistory}
                disabled={histLoading}
                style={{ padding: "5px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: "6px", color: "#e2e8f0", fontSize: "12px", cursor: histLoading ? "not-allowed" : "pointer" }}
              >
                {histLoading ? "로딩 중…" : "🔄 새로고침"}
              </button>
              <span style={{ fontSize: "11px", color: "#475569" }}>워크플로우·대화·로그가 자동으로 기록됩니다</span>
            </div>
            {notionHistory.length === 0 && !histLoading && (
              <div style={{ textAlign: "center", color: "#334155", padding: "40px", fontSize: "13px" }}>
                새로고침 버튼을 눌러 최근 기록을 불러오세요
              </div>
            )}
            {notionHistory.map((e) => {
              const typeColor: Record<string, string> = { "워크플로우": "#6366F1", "대화": "#06B6D4", "프롬프트": "#F59E0B", "로그": "#10B981" };
              const color = typeColor[e.type] ?? "#64748b";
              return (
                <div key={e.id} style={{ ...S.card(color + "33"), marginBottom: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "4px", background: color + "22", color, border: `1px solid ${color}44`, whiteSpace: "nowrap" }}>
                    {e.type}
                  </span>
                  <span style={{ fontSize: "13px", flex: 1, color: "#e2e8f0" }}>{e.title}</span>
                  <span style={{ fontSize: "10px", color: "#475569", whiteSpace: "nowrap" }}>{e.date ? new Date(e.date).toLocaleString("ko-KR") : ""}</span>
                  <a href={e.url} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#a5b4fc", whiteSpace: "nowrap", textDecoration: "none" }}>
                    열기 →
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════ GUIDE ══════ */}
        {tab === "guide" && (
          <div>
            <div style={{ ...S.card("#d9775730"), marginBottom: "16px", padding: "20px" }}>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#d97757", marginBottom: "4px" }}>📚 클로드 코드 7단계 가이드</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>ⓒ @3dragon_pd — BALMYGARDEN Agency 가이드로 채택 · 활용 중</div>
              <a
                href="/guide"
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-block", padding: "10px 22px", background: "#d97757", color: "#000", fontWeight: "800", borderRadius: "8px", textDecoration: "none", fontSize: "13px", marginBottom: "16px" }}
              >
                📖 전체 가이드 열기 (새 탭) →
              </a>
              <div style={{ fontSize: "12px", color: "#64748b" }}>가이드 페이지에서 각 레벨별 설명, 복붙 예시, 체크리스트, 참고 링크를 확인할 수 있습니다.</div>
            </div>

            {/* Agency Level Assessment */}
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#a5b4fc", marginBottom: "12px" }}>📊 BALMYGARDEN Agency — 7단계 달성 현황</div>
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                { lv: 1, emoji: "💬", name: "프롬프트", pct: 100, state: "✅ 완료", color: "#22c55e", impl: ["ARIA·PHANTOM·ZERO·MUSE·AEGIS·NOVA·REX·SCOUT·CONDUCTOR", "9개 에이전트 각각 전문화된 시스템 프롬프트", "300자 이내 핵심만, BALMYGARDEN 컨텍스트 내장"], next: "—" },
                { lv: 2, emoji: "📎", name: "컨텍스트", pct: ctxEnabled ? 90 : 50, state: ctxEnabled ? "✅ 활성" : "⚠️ 비활성", color: ctxEnabled ? "#22c55e" : "#eab308", impl: ["MEMORY 16개 항목 (기업/앱/게임/CEO/QA/크레딧/Fugu 등)", ctxEnabled ? "전 에이전트 API 호출 시 자동 주입 ON" : "컨텍스트 주입 현재 OFF", "홈 탭에서 ON/OFF 토글 가능"], next: "Notion 기록을 실시간 컨텍스트로 주입 (Phase 2)" },
                { lv: 3, emoji: "🛠️", name: "도구", pct: 100, state: "✅ 완료", color: "#22c55e", impl: ["Claude API — claude-sonnet-4-6", "/api/agent 서버 프록시 (API키 노출 없음)", "파일 읽기/쓰기 · 체인 실행 · 병렬 처리"], next: "스트리밍 응답 (실시간 타이핑 효과)" },
                { lv: 4, emoji: "🔌", name: "MCP 연결", pct: 95, state: "✅ 완료", color: "#22c55e", impl: ["Notion 자동 로깅 — save_workflow / save_log / save_chat", "GET /api/notion — 히스토리 조회", "워크플로우 완료 시 + 대화 시 자동 fire-and-forget 저장"], next: "Google Drive · Slack 연동 (Phase 2)" },
                { lv: 5, emoji: "⚡", name: "스킬", pct: 85, state: "✅ 적용", color: "#22c55e", impl: ["12개 워크플로우 = 12개 스킬", "각 워크플로우별 퀵 스킬 — 원클릭 기본 입력 세팅", "카테고리별 분류 (전략/개발/게임/음악/마케팅/법무 등)"], next: "/명령어 슬래시 커맨드 스타일 런처 (Phase 2)" },
                { lv: 6, emoji: "🪄", name: "서브에이전트", pct: 80, state: "✅ 적용", color: "#22c55e", impl: ["병렬 그룹 실행 (Promise.all)", "8개 워크플로우에 parallel 그룹 정의", "예: 사업 단계 진단 = [SCOUT+NOVA 병렬] → [AEGIS] → [CONDUCTOR]", "시각적 병렬 표시 (녹색 점선 박스)"], next: "독립 에이전트 인스턴스 분리 실행 (Worker API)" },
                { lv: 7, emoji: "🏆", name: "에이전트 팀", pct: 55, state: "🔧 베타", color: "#f97316", impl: ["듀얼 체인 팀 모드 — 워크플로우 탭 하단", "체인 A(메인) + 체인 B(비교)를 동시 실행", "결과 사이드바이사이드 비교 뷰"], next: "영구 에이전트 멀티인스턴스 · 에이전트간 메시지 패싱" },
              ].map((l) => (
                <div key={l.lv} style={{ background: "#0d1629", borderRadius: "12px", border: `1px solid ${l.color}33`, borderLeft: `4px solid ${l.color}`, padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "20px" }}>{l.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ color: l.color, fontWeight: "800", fontSize: "14px" }}>Level {l.lv}</span>
                        <span style={{ fontSize: "13px", fontWeight: "700" }}>{l.name}</span>
                        <span style={{ fontSize: "10px", padding: "2px 8px", background: l.color + "22", color: l.color, borderRadius: "10px", border: `1px solid ${l.color}44` }}>{l.state}</span>
                      </div>
                    </div>
                    <div style={{ background: "#1e293b", borderRadius: "4px", height: "6px", width: "80px", overflow: "hidden" }}>
                      <div style={{ width: `${l.pct}%`, height: "100%", background: l.color, borderRadius: "4px" }} />
                    </div>
                    <span style={{ fontSize: "11px", color: l.color, fontWeight: "700", minWidth: "32px" }}>{l.pct}%</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: "8px" }}>
                    {l.impl.map((s, i) => (
                      <div key={i} style={{ fontSize: "11px", color: "#94a3b8", paddingLeft: "8px", borderLeft: `2px solid ${l.color}33` }}>· {s}</div>
                    ))}
                  </div>
                  {l.next !== "—" && (
                    <div style={{ fontSize: "10px", color: "#475569" }}>▶ 다음 단계: {l.next}</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ ...S.card("#6366F133"), marginTop: "16px", padding: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "8px" }}>🚀 v3.x 로드맵 — Phase 2 업그레이드</div>
              {[
                "스트리밍 응답 (Claude API streaming → 실시간 타이핑)",
                "Notion → 실시간 컨텍스트 주입 (최근 N개 로그 자동 포함)",
                "슬래시 커맨드 스타일 /스킬명 런처",
                "에이전트 독립 인스턴스 — 각자 대화 히스토리 유지",
                "Google Drive · Slack MCP 연동",
                "영수증 앱 하위 프로젝트 연동 (monorepo apps/receipt)",
              ].map((item, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#94a3b8", padding: "4px 0", display: "flex", gap: "8px" }}>
                  <span style={{ color: "#6366F1" }}>{i + 1}.</span> {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
