"use client";

import { useState, useCallback, useRef, useEffect, CSSProperties } from "react";
import TradingTab from "./TradingTab";
import { MEMORY, type MemoryEntry } from "./memory";
import OsV4Tab from "./OsV4Tab";

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

interface ScheduleEntry { time: string; agent: string; task: string; wfId?: string; chatAgent?: string; cat?: string; }
interface ToolEntry { name: string; use: string; fb: string; warn?: boolean; }
interface ChainResult { key: string; ag: Agent; txt: string; done: boolean; }
interface AutomationPrompt {
  id: string; num: number; cat: string; catColor: string;
  name: string; tools: string; star: boolean;
  items: { title: string; desc: string }[];
}
interface NotionToast { msg: string; url?: string; ok: boolean; }
interface DriveFile { id: string; name: string; mimeType: string; modifiedTime: string; webViewLink: string; }
interface IntegrationToast { msg: string; url?: string; ok: boolean; }

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
    desc: "Suno AI · Midjourney · 릴스 · 앨범 아트 · MUSIC OS 제작",
    sys: `당신은 MUSE, BALMYGARDEN 크리에이티브 에이전트입니다.
음악: Suno AI로 BALMYDADDY 명의 심포닉/클래시컬 메탈·다크 판타지·복음 발라드.
게임 아트: Midjourney 다크 판타지 컨셉 아트. 영상: Remotion·Manus AI 릴스.
BALMYGARDEN 정체성(다크+서정+보호자 테마) 항상 유지.
[MUSIC OS 역할] SAGE(스토리)·LYRA(가사) 완료 후 Suno AI 제작 담당. 파이프라인 순서 준수.
PROJECT GOSARI: 세피아+봄 연두 비주얼 톤, 심포닉 발라드 방향성 우선. 응답 300자 이내.`,
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
  SAGE: {
    code: "A-10", av: "📖", color: "#7C3AED", type: "Creative",
    role: "스토리/세계관 설계",
    desc: "MUSIC OS · 시나리오 · 장면 · World Building",
    sys: `당신은 SAGE, BALMYGARDEN MUSIC OS 스토리·세계관 에이전트입니다.
[MUSIC OS 절대 규칙] 가사는 절대로 먼저 쓰지 않는다. 반드시 이 순서를 따른다:
아이디어 → 스토리 → 시나리오 → 장면(Scene) → (LYRA에게 전달)

PROJECT GOSARI 전문:
- 테마: 시간(Time). 핵심 메시지: "우리는 모두 누군가의 고사리였다."
- 감정 흐름: 무관심→탄생→깨달음→후회→감사→희망
- 핵심 심볼: 고사리·큰 손·작은 손·사진·기차·봄·집·전화·시간
- EP 6트랙: 늦게 알았네 / 고사리 / 큰 손 / 사진 한 장 / 떠난 기차 / 봄은 또 오더라
- 효도송 아님. 죽음 주제 아님. 부모를 이해하게 되는 이야기.
- 감정보다 진심. 설명보다 장면(Scene).
시나리오 출력 시 반드시 배경·인물·핵심 장면·감정 포인트 포함. 응답 400자 이내.`,
  },
  LYRA: {
    code: "A-11", av: "✍️", color: "#BE185D", type: "Creative",
    role: "가사 작성",
    desc: "MUSIC OS · 시나리오 기반 가사 · 리뷰",
    sys: `당신은 LYRA, BALMYGARDEN MUSIC OS 가사 에이전트입니다.
[절대 규칙] SAGE의 시나리오·장면 없이 가사 절대 작성 금지.
반드시 SAGE → LYRA 순서를 확인하고 시작.

가사 작성 원칙:
- 설명하지 말고 장면(Scene)으로 보여줄 것
- 감정보다 진심을 우선
- 전문 용어·과잉 수식어 금지
- 한 절에 하나의 심볼/이미지 집중
- 완성 후 반드시 자체 리뷰: 장면 선명도·감정 진정성·심볼 일관성 3항목 점수 제시
- 리뷰 통과 기준: 각 항목 8/10 이상

PROJECT GOSARI 심볼 우선 활용: 고사리·큰 손·작은 손·사진·기차·봄·집·전화·시간
BALMYDADDY 음악 스타일: 심포닉/클래시컬 메탈, 다크판타지, 복음 발라드. 응답 500자 이내.`,
  },
  STROBE: {
    code: "A-12", av: "🎬", color: "#0369A1", type: "Creative",
    role: "MV/비주얼 디렉션",
    desc: "MUSIC OS · 앨범아트 · MV 스토리보드 · 비주얼 패키지",
    sys: `당신은 STROBE, BALMYGARDEN MUSIC OS 뮤직비디오·비주얼 에이전트입니다.
담당: 앨범아트 방향성 · MV 스토리보드 · 비주얼 컨셉 · Midjourney/DALL-E 프롬프트

PROJECT GOSARI 비주얼 방향:
- 색상: 연한 세피아+봄 연두 (따뜻하고 낡은 필름 느낌)
- 분위기: 1980~90년대 한국 가정집 질감, 손때 묻은 사진첩
- MV 핵심 요소: 큰 손과 작은 손이 교차되는 장면, 기차창 풍경, 고사리 손 클로즈업
- 앨범아트: 심플 + 서정적. 과잉 그래픽 금지.

출력 항목: (1) 비주얼 무드 서술 (2) Midjourney 프롬프트 2안 (3) MV 핵심 신 3개
BALMYGARDEN 정체성 (다크+서정+보호자 테마) 유지. 응답 400자 이내.`,
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
  /* ── CEO 전략 프롬프트 (parky0ngnam 7종) ── */
  {
    id: "biz_system", emoji: "💰", cat: "CEO전략", name: "돈 버는 시스템 설계",
    chain: ["NOVA", "REX", "CONDUCTOR"],
    parallel: [["NOVA", "REX"], ["CONDUCTOR"]],
    desc: "수익모델·고객획득·자동화 → 90일 현금흐름 로드맵",
    quickSkill: "당신은 1인 에이전시를 100억 매출까지 키워본 비즈니스 설계자입니다. BALMYGARDEN 상황: CEO 1인·파라텍 안전보건팀 병행, 3트랙(음악 BALMYDADDY DistroKid 배급 시작 / 앱 영수증 OCR 사전테스팅 / 게임 LOD 프로토타입) 동시 운영. AI 에이전트 12명 배치. 현재 매출 0. 집중 트랙: [트랙 선택: 음악/앱/게임]. 목표: 90일 안에 첫 유료 매출 확보. 수익모델·고객 획득·상품 구조·가격 전략·운영 시스템·자동화까지 포함해 90일 실행 로드맵을 설계해주세요.",
  },
  {
    id: "bottleneck", emoji: "🔍", cat: "CEO전략", name: "숨은 병목 찾기",
    chain: ["CONDUCTOR", "REX", "AEGIS"],
    parallel: [["CONDUCTOR", "REX"], ["AEGIS"]],
    desc: "1인 3트랙 운영 → 성장 병목 3개 → 이번 주 제거 행동",
    quickSkill: "당신은 세계적인 운영 전략가입니다. BALMYGARDEN 구조를 보고 성장을 막는 가장 큰 병목 3가지를 찾아주세요. 구조: CEO 1인(파라텍 병행, 가용 시간 모바일 낮/PC 23시 이후), 3트랙(음악/앱/게임) 동시 운영, AI 에이전트 12명 배치, 현재 매출 0. 각 병목이 왜 위험한지, 어떤 지표로 확인해야 하는지, 이번 주 바로 제거할 수 있는 행동까지 제시해주세요.",
  },
  {
    id: "unfair_edge", emoji: "⚡", cat: "CEO전략", name: "불공정한 우위 만들기",
    chain: ["SCOUT", "NOVA", "CONDUCTOR"],
    parallel: [["SCOUT", "NOVA"], ["CONDUCTOR"]],
    desc: "자원 분석 → 차별화·브랜드 포지션 → 복제 불가 구조 설계",
    quickSkill: "당신은 시장에서 압도적 우위를 만드는 전략가입니다. BALMYGARDEN 자원: CEO 파라텍 안전보건 전문성 + AI 에이전트 12명 + MUSIC OS v4.0 파이프라인 + 3트랙(음악/앱/게임) 동시 운영 구조. 경쟁자: 일반 인디 음악 레이블, 1인 앱 개발자, 인디 게임 스튜디오. 남들이 쉽게 따라 할 수 없는 차별화·콘텐츠 전략·상품 구조·유통 전략·브랜드 포지션을 설계해주세요. 평범한 조언은 제외하고, 불공정한 우위만 찾아주세요.",
  },
  {
    id: "time_compress", emoji: "⏩", cat: "CEO전략", name: "10년을 12개월로 압축",
    chain: ["CONDUCTOR", "NOVA", "REX"],
    desc: "버릴 것 vs 집중할 것 → AI·자동화 활용 고속 성장 계획",
    quickSkill: "당신은 시간 레버리지 전략가입니다. BALMYGARDEN CEO 목표: 1인·직장 병행 조건에서 음악+앱+게임 3트랙 중 1트랙을 12개월 안에 시장 검증까지 완성. 보통 10년 걸릴 일을 12개월 안에 압축하려면 무엇을 버리고 무엇에 집중해야 하는지 알려주세요. AI·자동화·외주·인재·자본·콘텐츠·네트워크를 활용한 고속 성장 계획을 만들어주세요. 집중 트랙: [트랙 선택: 음악/앱/게임]",
  },
  {
    id: "chaos_to_sys", emoji: "⚙️", cat: "CEO전략", name: "혼란을 시스템으로",
    chain: ["CONDUCTOR", "ZERO", "REX"],
    parallel: [["CONDUCTOR", "ZERO"], ["REX"]],
    desc: "반복 업무 → AI 에이전트 위임 프로세스 → 사람 의존 제거",
    quickSkill: "당신은 혼란스러운 1인 에이전시를 AI 기반 시스템으로 설계하는 운영 전문가입니다. BALMYGARDEN의 아래 반복 업무를 보고, AI 에이전트(ARIA·PHANTOM·ZERO·MUSE·AEGIS·NOVA·REX·SCOUT·CONDUCTOR·SAGE·LYRA·STROBE) 위임 프로세스로 재설계해주세요. 업무 순서·담당 에이전트·체크리스트·자동화 가능 영역·품질 기준·보고 방식까지 정리해주세요. [반복 업무 입력]",
  },
  {
    id: "decision_up", emoji: "🎯", cat: "CEO전략", name: "의사결정 업그레이드",
    chain: ["CONDUCTOR", "AEGIS"],
    desc: "장기 리스크·기회비용·레버리지·최악의 경우 → 가장 강한 선택",
    quickSkill: "당신은 투자자·창업가·전략가들의 사고법을 훈련시키는 의사결정 코치입니다. BALMYGARDEN CEO 제약: 1인 운영·파라텍 병행·3트랙(음악/앱/게임) 동시. 내가 고민하는 선택지는 [선택지 입력]입니다. 장기 리스크·기회비용·레버리지·회복 가능성·최악의 경우를 기준으로 분석하고, 가장 강한 선택을 내려주세요.",
  },
  {
    id: "war_ceo", emoji: "⚔️", cat: "CEO전략", name: "전쟁형 CEO 판단 [긴급]",
    chain: ["CONDUCTOR", "AEGIS"],
    desc: "위기 상황 전용 — 감정 제거 → 생존·현금흐름·속도 기준 냉정 결정",
    quickSkill: "당신은 위기 상황에서 회사를 살리는 전쟁형 CEO 코치입니다. BALMYGARDEN이 처한 문제: [문제 입력]. 감정적 판단을 제거하고, 생존·현금흐름·속도·인력·우선순위 기준으로 가장 냉정한 의사결정안을 주세요. 듣기 좋은 말 말고, 해야 하는 말을 해주세요.",
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
  /* ── 자동화 파이프라인 ── */
  {
    id: "reels_auto", emoji: "🎬", cat: "콘텐츠", name: "글→릴스 영상 자동화",
    chain: ["MUSE", "STROBE", "NOVA"],
    desc: "블로그/글 → 컷 분할 → Higgsfield 프롬프트 → SNS 배포",
    quickSkill: "BALMYGARDEN 콘텐츠를 릴스 영상으로 자동 변환해주세요. 입력 글을 5~7개 컷으로 나누고, 컷마다 화면 구성·자막·Higgsfield 영상 생성 프롬프트(영문)를 표로 만들어주세요. 마지막으로 Instagram/TikTok 배포용 캡션과 해시태그를 작성해주세요. 입력 글: [글 붙여넣기]",
  },
  {
    id: "trend_research", emoji: "📊", cat: "리서치", name: "트렌드 리서치 자동화",
    chain: ["SCOUT", "NOVA", "CONDUCTOR"],
    desc: "키워드 수집 → 트렌드 분석 → Notion 저장 → 콘텐츠 적용",
    quickSkill: "BALMYGARDEN 3트랙(음악/앱/게임) 관련 이번 주 트렌드를 리서치해주세요. 각 트랙별 '지금 뜨는 키워드 3개'와 '활용 가능한 콘텐츠 아이디어 2개'를 정리하고, 업계 주간 다이제스트 형식으로 CEO 보고용 요약을 작성해주세요.",
  },
  {
    id: "meeting_notes", emoji: "📋", cat: "행정", name: "회의록 자동 정리",
    chain: ["CONDUCTOR", "ZERO", "REX"],
    desc: "녹취록 → 결정/할일/보류 구조화 → Notion 저장",
    quickSkill: "회의록을 구조화해서 정리해주세요. [결정된 것 / 할 일(담당자-마감일-내용) / 보류·확인 필요] 세 섹션으로 나누고, 담당자별 액션아이템 리스트와 불참자용 3줄 요약을 별도로 만들어주세요. 회의 녹취록: [녹취록 붙여넣기]",
  },
  /* ── MUSIC OS: PROJECT GOSARI ── */
  {
    id: "gosari_world", emoji: "🌿", cat: "음악OS", name: "고사리 EP 세계관 빌딩",
    chain: ["SAGE", "MUSE", "AEGIS"],
    desc: "시간 테마 세계관 → EP 6트랙 구조 설계",
    quickSkill: "PROJECT GOSARI의 세계관을 구축해주세요. 테마 '시간', 핵심 메시지 '우리는 모두 누군가의 고사리였다'를 기반으로 EP 6트랙(늦게 알았네/고사리/큰 손/사진 한 장/떠난 기차/봄은 또 오더라)의 감정 흐름과 각 트랙 컨셉을 설계해주세요.",
  },
  {
    id: "gosari_track", emoji: "✍️", cat: "음악OS", name: "고사리 트랙 파이프라인",
    chain: ["SAGE", "LYRA", "MUSE", "AEGIS"],
    desc: "시나리오 → 장면 → 가사 → 리뷰 → Suno 프롬프트",
    quickSkill: "MUSIC OS 파이프라인으로 고사리 EP 트랙 1개를 완성해주세요. 트랙명과 핵심 심볼을 입력하면 SAGE가 시나리오·장면을 설계하고, LYRA가 가사를 작성·리뷰합니다. 트랙명: [트랙명 입력], 핵심 심볼: [심볼 입력]",
  },
  {
    id: "music_suno_prompt", emoji: "🎵", cat: "음악OS", name: "Suno AI 음악 프롬프트 생성",
    chain: ["LYRA", "MUSE", "CONDUCTOR"],
    desc: "완성 가사 → Suno AI 최적 프롬프트 20~50버전 전략",
    quickSkill: "완성된 가사를 Suno AI에서 최고 품질로 생성하기 위한 프롬프트 전략을 짜주세요. 스타일 태그 5종 · 구조 태그 · 무드 디스크립션을 포함하여 3가지 방향성(심포닉/발라드/실험적) 버전을 각각 작성해주세요. 가사: [가사 입력]",
  },
  {
    id: "gosari_visual", emoji: "🎬", cat: "음악OS", name: "고사리 비주얼 패키지",
    chain: ["STROBE", "MUSE", "AEGIS"],
    desc: "앨범아트 방향 + MV 스토리보드 + Midjourney 프롬프트",
    quickSkill: "PROJECT GOSARI 비주얼 패키지를 제작해주세요. (1) EP 전체 앨범아트 컨셉 (세피아+봄 연두 톤, 손때 묻은 사진첩 무드), (2) '고사리' 타이틀 트랙 MV 핵심 신 5개 스토리보드, (3) Midjourney 프롬프트 앨범아트 2안을 작성해주세요.",
  },
  {
    id: "gosari_release", emoji: "🚀", cat: "음악OS", name: "고사리 EP 발매 마스터플랜",
    chain: ["REX", "NOVA", "SCOUT", "CONDUCTOR"],
    parallel: [["REX", "NOVA"], ["SCOUT"], ["CONDUCTOR"]],
    desc: "DistroKid 배급 · 마케팅 · SNS · D-30 타임라인",
    quickSkill: "PROJECT GOSARI EP 발매 마스터플랜을 D-30부터 D-Day까지 작성해주세요. DistroKid 배급 일정 · SNS 티저 콘텐츠 계획 · 발매일 마케팅 시퀀스 · 발매 후 2주 팔로업 전략을 포함해주세요.",
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
   자동화 프롬프트 60 (누끼토끼 정리 / 업무 자동화)
══════════════════════════════════════════════════════ */
const AUTOMATION_PROMPTS: AutomationPrompt[] = [
  /* ── 메일·커뮤니케이션 ── */
  {
    id: "A-01", num: 1, cat: "메일·커뮤니케이션", catColor: "#06B6D4",
    name: "이메일 자동화", tools: "Zapier + Gmail + Claude", star: true,
    items: [
      { title: "받은 메일 자동 분류 + 답장 초안", desc: "새 메일을 [긴급·계약·클레임=긴급 / 단순 문의=일반 / 광고·뉴스레터=보관]으로 분류. 긴급은 핵심 3줄 요약과 정중한 답장 초안만 만들고, 광고는 '보관' 라벨만. 금액·날기는 단정 말고 '확인 후 안내'로." },
      { title: "발송 전 답장 검수", desc: "내가 쓴 답장 초안을 붙여넣으면 ① 무례하거나 오해 살 표현 ② 오타·비문 ③ 빠진 첨부·날짜·금액을 점검해서, 고친 버전과 '무엇을 왜 고쳤는지'를 함께 보여줘. 내용은 바꾸지 말고 톤만 다듬어." },
      { title: "장문 메일 3줄 요약", desc: "긴 메일을 붙여넣으면 핵심을 3줄로 요약하고, 그 안에서 '내가 결정하거나 회신해야 할 것'만 따로 체크리스트로 뽑아줘. 단순 정보 전달이나 인사말은 빼고 행동할 것 위주로." },
      { title: "반복 문의 FAQ 매칭", desc: "새 문의가 오면 내가 저장해 둔 [FAQ 목록]과 대조해 가장 가까운 답변을 골라 상황에 맞게 다듬은 답장 초안을 만들어. 맞는 FAQ가 없으면 '직접 확인 필요'로 표시하고 넘어가." },
    ],
  },
  {
    id: "A-06", num: 6, cat: "메일·커뮤니케이션", catColor: "#06B6D4",
    name: "정기 리포트 자동 발송", tools: "Gmail + Claude + Sheets", star: false,
    items: [
      { title: "주간 실적 보고 메일", desc: "매주 월요일, 실적 시트의 지난주 매출·방문·문의 수를 집계하고 전주 대비 증감률을 계산해. '가장 큰 변화 한 가지'와 그 이유를 한 문장으로 뽑아 대표 보고용 메일 초안을 만들어 Gmail 임시보관함에 저장해(발송은 내가)." },
      { title: "월간 정산 요약", desc: "이번 달 매출·지출·순익을 항목별로 집계하고 지난달과 비교해 높고 준 것을 짚어줘. 마지막에 '다음 달 줄일 비용'과 '더 키울 항목'을 근거와 함께 한 가지씩 제안해." },
      { title: "광고 성과(ROAS) 리포트", desc: "채널별([메타/구글/...]) 광고비·전환·매출을 모아 ROAS를 계산해. 효율이 낮아 줄일 채널과 더 태울 채널을 한눈에 보이게 표로 정리하고, 다음 주 예산 배분안을 제안해." },
    ],
  },
  {
    id: "A-09", num: 9, cat: "메일·커뮤니케이션", catColor: "#06B6D4",
    name: "팀 메시지 요약", tools: "Slack + Claude", star: false,
    items: [
      { title: "오늘 대화 분류", desc: "지정 채널의 오늘 대화를 [결정 / 요청 / 질문]으로 분류해. 나를 멘션했거나 내가 답해야 할 항목은 맨 위에 '내 차례'로 모으고, 잡담·인사는 빼고 3분이면 읽을 분량으로 하루 끝에 보고해." },
      { title: "안 읽은 메시지 정리", desc: "내가 자리 비운 동안 쌓인 안 읽은 메시지를 채널별로 모아 '중요 / 참고 / 무시해도 됨'으로 나눠 핵심만 알려줘. 중요 항목엔 내가 할 행동을 한 줄로 붙여." },
      { title: "스레드 결론 추출", desc: "이 긴 스레드를 읽고 '최종 결론, 누가 무엇을 하기로 했는지, 아직 안 정해진 것' 세 가지를 3줄로 정리해줘." },
      { title: "주간 팀 활동 요약", desc: "이번 주 팀 채널들의 활동을 모아 '주요 결정 / 완료된 일 / 다음 주 과제'로 정리한 주간 요약 리포트를 만들어줘." },
    ],
  },
  /* ── 일정·문서·파일 ── */
  {
    id: "A-02", num: 2, cat: "일정·문서·파일", catColor: "#10B981",
    name: "회의록 자동 정리", tools: "Claude + Notion", star: true,
    items: [
      { title: "녹취록 → 구조화 정리", desc: "회의 녹취록·메모를 붙여넣으면 [결정된 것 / 할 일 / 보류(확인 필요)] 세 덩어리로 나눠. 할 일은 '담당자 — 마감일 — 내용' 형식으로, 날짜가 없으면 '미정'으로. 끝나면 Notion '회의록' DB에 '[날짜] [안건]' 페이지로 저장해." },
      { title: "회의 전 사전 브리핑", desc: "오늘 [안건]으로 회의하기 전에 Notion '회의록' DB에서 관련 지난 회의록과 미결 안건을 찾아, '지난번 결정 / 아직 안 된 것 / 오늘 정할 것' 세 가지로 정리해줘." },
      { title: "담당자별 액션아이템", desc: "회의록에서 할 일만 전부 뽑아 담당자별로 묶고, 각 항목에 마감일과 우선순위(상/중/하)를 붙여 To-do 리스트로 만들어줘." },
      { title: "불참자용 3줄 브리핑", desc: "이 회의록을 참석 못 한 팀원이 30초에 파악할 수 있게 '무엇을 정했고, 당신이 할 일은 무엇인지' 중심으로 3줄로 요약해줘." },
    ],
  },
  {
    id: "A-03", num: 3, cat: "일정·문서·파일", catColor: "#10B981",
    name: "일정 자동 관리", tools: "Claude + Google Calendar", star: false,
    items: [
      { title: "말로 하는 일정 등록", desc: "'다음 주 화 3시 김대표 미팅'처럼 말하면 Google 캘린더에 등록하고, 앞뒤로 이동·준비 시간 30분을 함께 잡아. 같은 날 일정과 겹치면 등록 전에 먼저 알려줘." },
      { title: "빈 시간 찾아 슬롯 제안", desc: "이번 주(또는 [기간]) 캘린더에서 [1시간]짜리 미팅을 넣을 빈 시간대를 3개 찾아줘. 점심시간과 기존 일정 앞뒤 30분은 빼고 제안해." },
      { title: "매일 아침 일정 브리핑", desc: "매일 오전 8시에 오늘 일정을 시간순으로 정리하고, 각 일정에 필요한 준비물·이동시간·미리 볼 자료를 한 줄씩 붙여서 알려줘." },
      { title: "마감일 역산 배치", desc: "[프로젝트]의 최종 마감이 [날짜]야. 거기서 거꾸로 계산해 필요한 중간 단계와 각 단계 마감일을 캘린더에 배치하고, 무리한 일정은 미리 경고해줘." },
    ],
  },
  {
    id: "A-11", num: 11, cat: "일정·문서·파일", catColor: "#10B981",
    name: "파일 자동 정리", tools: "Claude + Google Drive", star: false,
    items: [
      { title: "미분류 폴더 정리·이동", desc: "드라이브 '미분류' 폴더의 파일을 이름·확장자·날짜로 분류해 '[클라이언트] / [연도] / [중류]' 폴더로 옮겨. 중복은 최신만 남기고, 실제로 옮기기 전에 '무엇을 어디로' 목록을 먼저 보여줘." },
      { title: "파일명 일괄 변경", desc: "[폴더]의 파일명을 '[날짜]_[클라이언트]_[중류]_[버전]' 규칙으로 일괄 변경할 계획을 만들어. 바꾸기 전 'before → after' 목록을 먼저 보여주고 내 확인을 받아." },
      { title: "중복·오래된 파일 정리", desc: "[폴더]에서 내용이 같거나 비슷한 중복 파일과 6개월 이상 안 열린 파일을 찾아 '삭제 후보' 목록으로 정리해줘. 지우진 말고 제안만 해." },
      { title: "폴더 구조 목차화", desc: "[폴더] 구조를 훑어 어떤 폴더에 무엇이 있는지 한눈에 보는 목차 문서를 만들어줘. 비어 있거나 정체불명인 폴더는 따로 표시해." },
    ],
  },
  /* ── 리서치·데이터 ── */
  {
    id: "A-04", num: 4, cat: "리서치·데이터", catColor: "#6366F1",
    name: "웹 리서치 자동화", tools: "Playwright + Claude", star: true,
    items: [
      { title: "사실만 추려 요약 + 적용점", desc: "[주제 또는 URL]을 직접 열어 본문을 읽고, 광고·홍보는 빼고 사실·수치만 추려 출처와 함께 5줄로 요약해. 자료끼리 모순되면 그 부분을 짚고, 마지막에 '내 비즈니스([업종])에 적용할 점' 3가지를 제안해." },
      { title: "경쟁사 사이트 분석", desc: "[경쟁사 URL]을 열어 강점/약점/나와 다른 점을 각각 3가지씩 정리하고, 그들이 강조하는 핵심 메시지와 가격 정책을 표로 만들어줘." },
      { title: "주제별 자료 비교표", desc: "[주제]에 대한 최신 자료 5개를 찾아 각각 핵심 주장·근거·출처를 정리하고, 공통점과 의견이 갈리는 지점을 비교표로 만들어줘." },
      { title: "약관 독소조항 추출", desc: "[약관/계약서]를 읽고 나에게 불리할 수 있는 조항(자동연장·면책조건·위약금만 보고, 법인의 제한조건)만 따로 표로 정리해. 초보도 이해할 수 있게 쉬운 말로." },
    ],
  },
  {
    id: "A-13", num: 13, cat: "리서치·데이터", catColor: "#6366F1",
    name: "데이터 집계·분석", tools: "Claude + Sheets", star: false,
    items: [
      { title: "집계 + 의미 해석", desc: "시트의 원본 데이터로 항목별 합계·평균·증감률을 계산하고, 결과마다 '이게 왜 중요한지' 한 줄씩 붙여. 평소와 크게 다른 이상치 3개는 원인 가설까지, 끝에 '다음에 확인할 것' 액션 하나를 남겨줘." },
      { title: "설문 응답 분석", desc: "[설문 응답]을 분석해 핵심 인사이트 3가지를 뽑고, 자유응답은 주제별로 묶어 빈도순으로 정리해. 어떤 차트로 보여주면 좋을지도 제안해줘." },
      { title: "매출 패턴·이상치", desc: "[매출 데이터]에서 요일·시간·상품별 패턴과 평소와 다른 이상치를 찾아, '잘 팔리는 조합'과 '문제 구간'을 짚어줘." },
      { title: "고객 세그먼트 분류", desc: "[고객 명단/구매이력]을 구매빈도·금액·최근성 기준으로 3~4개 그룹으로 나누고, 각 그룹에 맞는 접근법을 한 줄씩 제안해줘." },
    ],
  },
  {
    id: "A-14", num: 14, cat: "리서치·데이터", catColor: "#6366F1",
    name: "트렌드 리서치 자동화", tools: "Apify + Claude + Notion", star: false,
    items: [
      { title: "최신글 수집·정리", desc: "등록한 키워드로 최신 글·영상을 매주 수집하고 중복은 제거해. 반복 주제를 '지금 뜨는 것 3 / 지는 것 1'로 묶고 근거 한 줄과 출처를 첨부해, Notion '트렌드' DB에 주차별 카드로 쌓아줘." },
      { title: "키워드 인기도 추적", desc: "[해시태그/키워드 목록]의 최근 노출·언급 추이를 추적해, 상승 중인 것과 하락 중인 것을 그래프용 표로 정리해줘." },
      { title: "경쟁 콘텐츠 모니터링", desc: "[경쟁 브랜드 계정]의 최근 게시물을 모아 자주 다루는 주제·형식·반응 좋은 것을 정리하고, 내가 참고할 포인트를 짚어줘." },
      { title: "업계 주간 다이제스트", desc: "[업계] 관련 이번 주 뉴스·이슈를 모아 '꼭 알아야 할 것 5개'로 요약하고, 각각 나에게 주는 시사점을 한 줄씩 붙여줘." },
    ],
  },
  /* ── 콘텐츠·디자인 ── */
  {
    id: "A-07", num: 7, cat: "콘텐츠·디자인", catColor: "#F59E0B",
    name: "영상 → 요약·대본", tools: "YouTube + Claude", star: true,
    items: [
      { title: "영상 요약 + 블로그 초안", desc: "유튜브 링크를 주면 자막 기반으로 흐름을 7줄로 요약하고, 인용할 문장 3개를 타임스탬프와 함께 뽑아. 전문 용어는 쉽게 풀고, 마지막에 이 내용을 누끼토끼 톤의 블로그 도입 한 단락으로 변환해줘." },
      { title: "긴 영상 → 숏폼 3개", desc: "내 [긴 영상 대본]을 독립적으로 봐도 되는 숏폼 3개로 쪼개. 각각 훅(첫 3초)-본문-마무리 구조로 다시 써줘." },
      { title: "경쟁 채널 인사이트", desc: "[경쟁 채널 영상] 5개를 분석해 공통된 주제·구성·훅 패턴을 찾아, 내가 따라 할 기획 포인트 3가지를 제안해줘." },
      { title: "챕터·타임스탬프 생성", desc: "영상 자막을 바탕으로 내용이 바뀌는 지점마다 챕터를 나누고, '타임스탬프 + 챕터 제목' 목록을 영상 설명란에 넣게 정리해줘." },
    ],
  },
  {
    id: "A-12", num: 12, cat: "콘텐츠·디자인", catColor: "#F59E0B",
    name: "글 → 릴스 영상", tools: "Claude + Higgsfield", star: true,
    items: [
      { title: "대본 → 컷 분할·생성", desc: "릴스 대본을 5~7개 컷으로 나누고, 컷마다 '화면에 보일 것 / 자막 / 영상 생성 프롬프트(영문)'를 표로, 세로 9:16으로 고정해. 그 프롬프트를 Higgsfield에 넣어 컷별 영상을 만들고 대본 순서대로 이어 붙여줘." },
      { title: "블로그 → 릴스 대본", desc: "[블로그 글]에서 가장 흥미로운 포인트 하나를 골라 30초 릴스 대본으로 바꿔. 첫 3초 훅, 본문 3컷, 마무리 CTA 구조로 써줘." },
      { title: "제품 설명 → 광고 컷", desc: "[제품 설명]을 보고 '문제 제기 → 제품 등장 → 핵심 혜택 3컷 → 행동 유도' 흐름의 광고 컷 구성과 영상 프롬프트를 만들어줘." },
      { title: "후기 → 숏폼 스토리", desc: "[고객 후기]를 1인칭 스토리 릴스로 바꿔. '이런 고민이 있었다 → 써봤다 → 이렇게 달라졌다' 흐름의 컷과 자막으로 구성해줘." },
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

/* MEMORY 배열은 ./memory.ts 로 분리 — MEMORY.md 와 동기화 */

const SCHEDULES: ScheduleEntry[] = [
  { time: "매일 07:00", agent: "SCOUT",      task: "Higgsfield 크레딧 잔여량 + 무료 AI 도구 업데이트 체크", chatAgent: "SCOUT",    cat: "daily" },
  { time: "매일 08:00", agent: "REX",        task: "일일 업무 우선순위 정리 (앱/게임/음악 3트랙)",           chatAgent: "REX",      cat: "daily" },
  { time: "매주 월 09:00", agent: "CONDUCTOR", task: "주간 에이전트 업무 배분 + QA 스케줄 수립",            wfId: "weekly",        cat: "weekly" },
  { time: "매주 금 17:00", agent: "REX·SCOUT", task: "주간 성과 보고 + 다음 주 계획 초안 CEO 제출",         wfId: "weekly",        cat: "weekly" },
  { time: "매월 1일", agent: "SCOUT",        task: "월간 AI 도구 크레딧 현황 점검 + 신규 무료 도구 보고",   chatAgent: "SCOUT",    cat: "monthly" },
  { time: "분기 말", agent: "AEGIS·REX",     task: "법무/경영 리스크 검토 + ISO 감사 대응 체크",            wfId: "legal",         cat: "quarterly" },
  { time: "발매 D-30", agent: "STROBE·MUSE", task: "[GOSARI] 앨범아트 컨셉 확정 + MV 스토리보드 초안",     wfId: "gosari_visual", cat: "gosari" },
  { time: "발매 D-14", agent: "LYRA·MUSE",   task: "[GOSARI] Suno AI 20~50버전 생성 → 선택 → 마스터링",    wfId: "music_suno_prompt", cat: "gosari" },
  { time: "발매 D-7 (일반)", agent: "NOVA·MUSE", task: "마케팅 콘텐츠 + 릴스 스크립트 완성",               wfId: "music_release", cat: "release" },
  { time: "발매 D-7 (GOSARI)", agent: "NOVA·STROBE", task: "[GOSARI] SNS 티저 콘텐츠 + 릴스 스크립트",    wfId: "gosari_release", cat: "gosari" },
  { time: "발매 D-1", agent: "REX",          task: "DistroKid 배급 확인 + 플랫폼별 메타데이터 검수",        chatAgent: "REX",      cat: "release" },
  { time: "트랙 작업 시작", agent: "SAGE→LYRA", task: "[MUSIC OS] 시나리오·장면 설계 후 가사 착수",         wfId: "gosari_track",  cat: "gosari" },
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
   MUSIC OS — PROJECT PIPELINE
══════════════════════════════════════════════════════ */
interface PipelineStep {
  step: number;
  name: string;
  agent: string;
  wfId: string;
  desc: string;
}

interface DecisionEntry {
  date: string;
  step: number;
  stepName: string;
  decision: string;
  tag: "결정" | "변경" | "보류";
}

interface QGScore {
  감정전달력: number;
  기억성: number;
  독창성: number;
  스토리: number;
  상업성: number;
  가창성: number;
  제작성: number;
  브랜딩: number;
}

interface QGEntry {
  id: string;
  gate: number;
  gateName: string;
  track: string;
  scores: QGScore;
  pass: boolean;
  date: string;
  feedback: string;
}

interface ChangelogEntry {
  version: string;
  date: string;
  type: "신규" | "수정" | "삭제" | "보류";
  desc: string;
  agent: string;
}

interface ReviewEntry {
  id: string;
  version: string;
  track: string;
  good: string;
  bad: string;
  improve: string;
  next: string;
  agent: string;
  date: string;
}

interface ProductionMemory {
  id: string;
  track: string;
  category: string;
  score: number;
  reason: string;
  date: string;
}

interface ConflictEntry {
  id: string;
  topic: string;
  opinions: { agent: string; text: string }[];
  decision: string;
  date: string;
}

const GOSARI_PIPELINE: PipelineStep[] = [
  { step: 1,  name: "Production OS 검증",  agent: "CONDUCTOR + AEGIS",  wfId: "gosari_world",       desc: "Creative Bible + QG 시스템 완성 확인" },
  { step: 2,  name: "Creative Bible 승인",  agent: "SAGE + CEO",          wfId: "gosari_world",       desc: "창작 철학·Style Guide CEO 서명" },
  { step: 3,  name: "컨셉 확정",            agent: "SAGE",                wfId: "gosari_world",       desc: "EP 테마·방향성 CEO 승인" },
  { step: 4,  name: "세계관 빌딩",          agent: "SAGE",                wfId: "gosari_world",       desc: "World Building 문서 완성" },
  { step: 5,  name: "EP 트랙 구조 설계",    agent: "SAGE",                wfId: "gosari_world",       desc: "6트랙 컨셉·감정 흐름 확정" },
  { step: 6,  name: "시나리오·장면",        agent: "SAGE",                wfId: "gosari_track",       desc: "트랙별 Scene 설계" },
  { step: 7,  name: "Producer Blueprint",  agent: "CONDUCTOR",           wfId: "gosari_track",       desc: "Hook·침묵·다이나믹·심볼 타이밍 설계 (P-07)" },
  { step: 8,  name: "가사 작성·리뷰",      agent: "LYRA",                wfId: "gosari_track",       desc: "가사 + 자체 리뷰 (8/10 이상)" },
  { step: 9,  name: "Suno AI 프롬프트",    agent: "MUSE",                wfId: "music_suno_prompt",  desc: "태그·무드 3방향성 설계" },
  { step: 10, name: "음원 생성·선택",       agent: "MUSE + CEO",          wfId: "music_suno_prompt",  desc: "20~50버전 생성 → CEO 최종 선택" },
  { step: 11, name: "앨범 아트",            agent: "STROBE + MUSE",       wfId: "gosari_visual",      desc: "비주얼 컨셉 + Midjourney 프롬프트" },
  { step: 12, name: "MV 스토리보드",        agent: "STROBE",              wfId: "gosari_visual",      desc: "핵심 신 5개 스토리보드" },
  { step: 13, name: "발매 패키지",           agent: "REX",                 wfId: "gosari_release",     desc: "DistroKid 메타데이터 + 배급 신청" },
  { step: 14, name: "마케팅·SNS",           agent: "NOVA + SCOUT",        wfId: "gosari_release",     desc: "티저 콘텐츠 + 발매 시퀀스" },
  { step: 15, name: "발매·아카이브",         agent: "REX + CONDUCTOR",     wfId: "gosari_release",     desc: "D-Day 발매 + 결과 기록" },
];

/* ══════════════════════════════════════════════════════
   QUALITY GATE SYSTEM
══════════════════════════════════════════════════════ */
const GOSARI_GATES = [
  { gate: 1,  name: "컨셉 게이트",          agent: "SAGE + CONDUCTOR",    desc: "EP 테마·방향성 + 세계관 일관성 검증" },
  { gate: 2,  name: "세계관 게이트",         agent: "SAGE + AEGIS",        desc: "World Building 완성도 + 법무 리스크" },
  { gate: 3,  name: "트랙 구조 게이트",      agent: "SAGE + CONDUCTOR",    desc: "6트랙 컨셉·감정 흐름 승인" },
  { gate: 4,  name: "시나리오 게이트",        agent: "SAGE + LYRA",         desc: "Scene 설계 완성 + LYRA 인수인계" },
  { gate: 5,  name: "가사 품질 게이트",      agent: "LYRA + AEGIS",        desc: "가사 자체 리뷰 8/10 이상 (장면·감정·심볼)" },
  { gate: 6,  name: "Suno 프롬프트 게이트",  agent: "MUSE + CONDUCTOR",    desc: "태그·무드 3방향성 완성" },
  { gate: 7,  name: "음원 선택 게이트",      agent: "MUSE + CEO",          desc: "20~50버전 생성 → CEO 최종 선택" },
  { gate: 8,  name: "비주얼 게이트",         agent: "STROBE + MUSE",       desc: "앨범아트 컨셉 + MV 스토리보드" },
  { gate: 9,  name: "MV 스토리보드 게이트",  agent: "STROBE + AEGIS",      desc: "핵심 신 5개 완성 + 비주얼 QA" },
  { gate: 10, name: "발매 패키지 게이트",    agent: "REX + AEGIS",         desc: "DistroKid 메타데이터 검수" },
  { gate: 11, name: "마케팅 게이트",         agent: "NOVA + SCOUT",        desc: "티저 콘텐츠 + 발매 시퀀스 완성" },
  { gate: 12, name: "최종 품질 게이트",      agent: "CONDUCTOR + AEGIS",   desc: "전체 QA 95/100 통과 → CEO 보고" },
];

const QG_CATEGORIES: (keyof QGScore)[] = [
  "감정전달력", "기억성", "독창성", "스토리", "상업성", "가창성", "제작성", "브랜딩",
];

const QG_CATEGORY_AGENT: Record<string, string> = {
  감정전달력: "LYRA",
  기억성: "MUSE",
  독창성: "SAGE",
  스토리: "SAGE",
  상업성: "NOVA",
  가창성: "LYRA",
  제작성: "MUSE",
  브랜딩: "CONDUCTOR",
};

const GOSARI_TRACKS = ["늦게 알았네", "고사리", "큰 손", "사진 한 장", "떠난 기차", "봄은 또 오더라"];

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

  // Google Drive
  const [driveToast, setDriveToast] = useState<IntegrationToast | null>(null);
  const [driveSaving, setDriveSaving] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveCtx, setDriveCtx] = useState(""); // 에이전트에 주입될 Drive 파일 내용
  const [driveCtxName, setDriveCtxName] = useState("");
  const [drivePanel, setDrivePanel] = useState(false);

  // Slack
  const [slackNotify, setSlackNotify] = useState(false); // 워크플로우 완료 시 자동 알림
  const [slackConfigured, setSlackConfigured] = useState<boolean | null>(null);

  // Project OS — GOSARI
  const [gosariStep, setGosariStep] = useState(0); // 현재 완료된 스텝 (0 = 시작 전)
  const [decisionLog, setDecisionLog] = useState<DecisionEntry[]>([]);
  const [newDecision, setNewDecision] = useState("");
  const [newDecisionTag, setNewDecisionTag] = useState<"결정" | "변경" | "보류">("결정");
  const [projectSaving, setProjectSaving] = useState(false);

  // Quality Gate System
  const emptyQGScore = (): QGScore => ({ 감정전달력: 0, 기억성: 0, 독창성: 0, 스토리: 0, 상업성: 0, 가창성: 0, 제작성: 0, 브랜딩: 0 });
  const [activeQG, setActiveQG] = useState(12);
  const [qgTrack, setQgTrack] = useState("늦게 알았네");
  const [qgScores, setQgScores] = useState<QGScore>(emptyQGScore());
  const [qgFeedback, setQgFeedback] = useState("");
  const [qgHistory, setQgHistory] = useState<QGEntry[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([
    { version: "v3.2", date: "2026-06-27", type: "신규", desc: "MUSIC OS v1.0 + GOSARI 프로젝트 탭 + 예약 탭 + 자동 Notion 저장", agent: "ZERO" },
    { version: "v3.1", date: "2026-06-25", type: "수정", desc: "병렬 에이전트 실행 + 팀 모드 + Google Drive 연동", agent: "ZERO" },
    { version: "v3.0", date: "2026-06-24", type: "신규", desc: "9 에이전트 시스템 + MCP Notion 로깅 + 7단계 가이드", agent: "ZERO" },
  ]);
  const [newChangelogDesc, setNewChangelogDesc] = useState("");
  const [newChangelogType, setNewChangelogType] = useState<"신규" | "수정" | "삭제" | "보류">("신규");
  const [newChangelogAgent, setNewChangelogAgent] = useState("ZERO");

  const qgTotal = (s: QGScore) => Math.round(Object.values(s).reduce((a, b) => a + b, 0) / QG_CATEGORIES.length);
  const qgPass = (s: QGScore) => Object.values(s).every((v) => v >= 90);
  const submitQG = () => {
    const gate = GOSARI_GATES.find((g) => g.gate === activeQG)!;
    const entry: QGEntry = {
      id: Date.now().toString(),
      gate: activeQG,
      gateName: gate.name,
      track: qgTrack,
      scores: { ...qgScores },
      pass: qgPass(qgScores),
      date: new Date().toISOString(),
      feedback: qgFeedback,
    };
    setQgHistory((prev) => [entry, ...prev]);
    setQgScores(emptyQGScore());
    setQgFeedback("");
  };

  // STUDIO v4.0 sub-tabs
  const [studioTab, setStudioTab] = useState<"채점" | "리뷰" | "PM" | "토론">("채점");

  // CEO Approval Gate
  const [conductorApproval, setConductorApproval] = useState("");
  const [conductorApprovalLoading, setConductorApprovalLoading] = useState(false);
  const [ceoApproved, setCeoApproved] = useState(false);

  // Review system
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [reviewVersion, setReviewVersion] = useState("v0.1");
  const [reviewTrack, setReviewTrack] = useState("늦게 알았네");
  const [reviewGood, setReviewGood] = useState("");
  const [reviewBad, setReviewBad] = useState("");
  const [reviewImprove, setReviewImprove] = useState("");
  const [reviewNext, setReviewNext] = useState("");
  const [reviewAgent, setReviewAgent] = useState("LYRA");
  const [reviewGenerating, setReviewGenerating] = useState(false);

  // Production Memory
  const [productionMemories, setProductionMemories] = useState<ProductionMemory[]>([]);
  const [pmTrack, setPmTrack] = useState("늦게 알았네");
  const [pmCategory, setPmCategory] = useState("Hook");
  const [pmScore, setPmScore] = useState(95);
  const [pmReason, setPmReason] = useState("");
  const [pmCounter, setPmCounter] = useState(1);

  // Creative Conflict
  const [conflictTopic, setConflictTopic] = useState("");
  const [conflictAgents, setConflictAgents] = useState<string[]>(["LYRA", "NOVA", "SAGE"]);
  const [conflictRunning, setConflictRunning] = useState(false);
  const [conflictOpinions, setConflictOpinions] = useState<{ agent: string; text: string }[]>([]);
  const [conflictDecision, setConflictDecision] = useState("");
  const [conflictDecisionLoading, setConflictDecisionLoading] = useState(false);
  const [conflictHistory, setConflictHistory] = useState<ConflictEntry[]>([]);

  const runConflict = useCallback(async () => {
    if (!conflictTopic.trim() || conflictRunning || conflictAgents.length === 0) return;
    setConflictRunning(true);
    setConflictOpinions([]);
    setConflictDecision("");
    const results = await Promise.all(
      conflictAgents.map(async (key) => {
        try {
          const txt = await callAgent(key, `창작 토론: "${conflictTopic}" — ${AGENTS[key].role} 관점에서 입장 표명. 130자 이내.`);
          return { agent: key, text: txt };
        } catch {
          return { agent: key, text: "응답 실패" };
        }
      })
    );
    setConflictOpinions(results);
    setConflictRunning(false);
  }, [conflictTopic, conflictRunning, conflictAgents]);

  const runConflictDecision = useCallback(async () => {
    if (!conflictOpinions.length || conflictDecisionLoading) return;
    setConflictDecisionLoading(true);
    const summary = conflictOpinions.map((o) => `[${o.agent}] ${o.text}`).join("\n\n");
    try {
      const decision = await callAgent(
        "CONDUCTOR",
        `창작 토론 주제: "${conflictTopic}"\n\n에이전트 의견:\n${summary}\n\n최종 결정 + 이유 + Decision Log 형식으로. 250자 이내.`
      );
      setConflictDecision(decision);
      setConflictHistory((prev) => [
        { id: Date.now().toString(), topic: conflictTopic, opinions: conflictOpinions, decision, date: new Date().toISOString() },
        ...prev,
      ]);
      setDecisionLog((prev) => [{
        date: new Date().toISOString(),
        step: gosariStep,
        stepName: "Creative Conflict",
        decision: `[토론] ${conflictTopic}: ${decision.slice(0, 80)}…`,
        tag: "결정" as const,
      }, ...prev]);
    } catch (e) {
      setConflictDecision(`오류: ${(e as Error).message}`);
    }
    setConflictDecisionLoading(false);
  }, [conflictOpinions, conflictDecisionLoading, conflictTopic, gosariStep]);

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

  /* ── Google Drive: 워크플로우 결과 저장 */
  const saveToDrive = useCallback(async (title: string, content: string) => {
    setDriveSaving(true);
    setDriveToast(null);
    try {
      const res = await fetch("/api/gdrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_doc", payload: { title, content } }),
      });
      const data = await res.json();
      if (data.error) {
        if (data.setup) throw new Error("Google Drive 미설정 — .env.local에 GOOGLE_SERVICE_ACCOUNT_JSON 추가 필요");
        throw new Error(data.error);
      }
      setDriveToast({ msg: "Google Drive에 저장됐습니다!", url: data.url, ok: true });
      setTimeout(() => setDriveToast(null), 5000);
    } catch (e: unknown) {
      setDriveToast({ msg: (e as Error).message, ok: false });
      setTimeout(() => setDriveToast(null), 6000);
    }
    setDriveSaving(false);
  }, []);

  /* ── Google Drive: 파일 목록 로드 */
  const loadDriveFiles = useCallback(async () => {
    setDriveLoading(true);
    try {
      const res = await fetch("/api/gdrive?limit=15");
      const data = await res.json();
      if (data.files) setDriveFiles(data.files);
    } catch { /* silent */ }
    setDriveLoading(false);
  }, []);

  /* ── Google Drive: 파일 읽어서 컨텍스트 주입 */
  const injectDriveFile = useCallback(async (file: DriveFile) => {
    try {
      const res = await fetch("/api/gdrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read_file", payload: { fileId: file.id, mimeType: file.mimeType } }),
      });
      const data = await res.json();
      if (data.text) {
        setDriveCtx(data.text);
        setDriveCtxName(file.name);
      }
    } catch { /* silent */ }
  }, []);

  /* ── Slack: 워크플로우 완료 알림 (fire-and-forget) */
  const notifySlack = useCallback((workflowName: string, input: string, agentCount: number, success: boolean) => {
    fetch("/api/slack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "notify",
        payload: { workflowName, input, agentCount, success },
      }),
    }).catch(() => {});
  }, []);

  /* ── Slack 설정 확인 (마운트 시 1회) */
  useEffect(() => {
    fetch("/api/slack").then((r) => r.json()).then((d) => setSlackConfigured(d.configured ?? false)).catch(() => setSlackConfigured(false));
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
    const driveCtxBlock = driveCtx
      ? `\n\n[Google Drive 참조 문서 — ${driveCtxName}]\n${driveCtx.slice(0, 4000)}`
      : "";
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt: ag.sys + memCtx + driveCtxBlock, userMessage }),
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

    // 자동 노션 저장 — 항상 실행, 결과 있을 때
    if (results.length > 0) {
      const isMusicOS = wf.cat === "음악OS";
      const pipelineStep = isMusicOS ? GOSARI_PIPELINE.find((p) => p.wfId === wf.id) : null;
      const nextPipelineStep = pipelineStep ? GOSARI_PIPELINE.find((p) => p.step === pipelineStep.step + 1) : null;

      let notionAction: string;
      let notionPayload: unknown;

      if (isMusicOS && pipelineStep) {
        // MUSIC OS — 5섹션 구조화 포맷
        const summary = results.map((r) => `• ${r.ag.role}: ${r.txt.slice(0, 120)}`).join("\n");
        notionAction = "save_log";
        notionPayload = {
          source: "GOSARI",
          title: `STEP ${pipelineStep.step} — ${pipelineStep.name}`,
          content: [
            `📌 STEP 상태: STEP ${pipelineStep.step}/12 — ${pipelineStep.name}`,
            `\n📝 요약:\n${summary}`,
            `\n📖 결정 사항:\n${wfInput}`,
            `\n🔄 변경 사항:\n${results.map((r) => `${r.key}(${r.ag.role}) — ${r.done ? "완료" : "오류"}`).join(", ")}`,
            `\n🎯 다음 액션: ${nextPipelineStep ? `STEP ${nextPipelineStep.step} — ${nextPipelineStep.name}` : "발매 완료 🎉"}`,
          ].join(""),
        };
        // gosariStep 자동 진행
        setGosariStep((prev) => Math.max(prev, pipelineStep.step));
      } else {
        // 일반 워크플로우
        notionAction = "save_workflow";
        notionPayload = {
          workflowName: wf.name,
          input: wfInput,
          results: results.map((r) => ({ agent: r.key, role: r.ag.role, text: r.txt, done: r.done })),
        };
      }

      fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: notionAction, payload: notionPayload }),
      })
        .then((r) => r.json())
        .then((d) => {
          setNotionToast({ msg: isMusicOS ? `🌿 GOSARI STEP ${pipelineStep?.step ?? ""} Notion 저장 완료` : `📎 "${wf.name}" Notion 저장 완료`, url: d.url, ok: true });
          setTimeout(() => setNotionToast(null), 5000);
        })
        .catch(() => {
          setNotionToast({ msg: "Notion 자동 저장 실패 (토큰 확인)", ok: false });
          setTimeout(() => setNotionToast(null), 5000);
        });

      // Slack 자동 알림 (토글 ON 시)
      if (slackNotify) {
        notifySlack(wf.name, wfInput, results.length, results.every((r) => r.done));
      }
    }
  }, [wfId, wfInput, ctxEnabled, slackNotify, notifySlack]);

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
    const userEntry: DirectChatMsg = { role: "user", text: msg };
    setChatMsgs((prev) => [...prev, userEntry]);
    setChatLoading(true);
    let reply = "";
    try {
      reply = await callAgent(chatAgent, msg);
      setChatMsgs((prev) => [...prev, { role: "agent", text: reply }]);
    } catch (e: unknown) {
      const err = e as Error;
      reply = `⚠️ 오류: ${err.message}`;
      setChatMsgs((prev) => [...prev, { role: "agent", text: reply }]);
    }
    setChatLoading(false);

    // 대화 자동 노션 저장 (fire-and-forget)
    if (reply && chatAgent) {
      fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_chat",
          payload: {
            agentKey: chatAgent,
            agentRole: AGENTS[chatAgent]?.role ?? chatAgent,
            messages: [
              { role: "user", text: msg },
              { role: "agent", text: reply },
            ],
          },
        }),
      }).catch(() => {});
    }
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
            { id: "projects", label: "🌿 프로젝트" },
            { id: "schedule", label: "⏰ 예약" },
            { id: "workflow", label: "⚡ 워크플로" },
            { id: "agents", label: "🤖 에이전트" },
            { id: "chat", label: "💬 대화" },
            { id: "prompts", label: "📚 프롬프트" },
            { id: "content", label: "📝 콘텐츠" },
            { id: "system", label: "⚙️ 시스템" },
            { id: "ladder", label: "📈 사다리" },
            { id: "qg", label: "🎬 STUDIO" },
            { id: "osv4", label: "🏛️ OS v4.0" },
            { id: "trading", label: "📈 트레이딩" },
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

      {/* ── DRIVE TOAST */}
      {driveToast && (
        <div style={{ position: "fixed", bottom: notionToast ? "80px" : "24px", right: "24px", zIndex: 9998, padding: "12px 18px", borderRadius: "10px", background: driveToast.ok ? "#1a2e1e" : "#2d1e1e", border: `1px solid ${driveToast.ok ? "#1a73e8" : "#EF4444"}`, display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 24px #00000077" }}>
          <span style={{ fontSize: "14px" }}>{driveToast.ok ? "📁" : "❌"}</span>
          <span style={{ fontSize: "13px", color: driveToast.ok ? "#93c5fd" : "#fca5a5" }}>{driveToast.msg}</span>
          {driveToast.url && (
            <a href={driveToast.url} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#60a5fa", textDecoration: "underline" }}>
              Drive에서 열기 →
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
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              {[
                { emoji: "🗂️", name: "영수증 OCR 앱", status: "사전 테스팅", color: "#6366F1", detail: "Next.js 14 · Supabase · Gemini API · Vercel" },
                { emoji: "⚔️", name: "LOD: Lord of Dynasty", status: "프로토타입 완성", color: "#8B5CF6", detail: "React 다크판타지 턴제 RPG · Harness CI/CD" },
                { emoji: "🎵", name: "BALMYDADDY", status: "배급 중", color: "#F59E0B", detail: "DistroKid · 심포닉 메탈 · 다크판타지 · 복음" },
                { emoji: "🌿", name: "PROJECT GOSARI", status: gosariStep === 0 ? "OS 구축 중" : gosariStep >= 15 ? "발매 완료" : `STEP ${gosariStep}/15 진행 중`, color: "#7C3AED", detail: `EP 6트랙 · 테마: 시간 · ${gosariStep === 0 ? "Creative Bible 준비 중" : `현재: ${GOSARI_PIPELINE[gosariStep - 1]?.name ?? ""}`}` },
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

            {/* 도구 연결 현황 */}
            <div style={{ ...S.card(), marginBottom: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "12px" }}>🔌 도구 연결 현황</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: "8px" }}>
                {[
                  { name: "Notion", icon: "📒", status: "연결됨", color: "#10B981", note: "자동 로깅 ON" },
                  { name: "Google Drive", icon: "📁", status: "연결됨", color: "#1a73e8", note: "읽기 가능" },
                  { name: "Slack", icon: "💬", status: process.env.NEXT_PUBLIC_SLACK_ENABLED === "true" ? "연결됨" : "미연결", color: process.env.NEXT_PUBLIC_SLACK_ENABLED === "true" ? "#22C55E" : "#475569", note: process.env.NEXT_PUBLIC_SLACK_ENABLED === "true" ? "알림 ON" : "Bot Token 필요" },
                  { name: "Zapier MCP", icon: "⚡", status: "대기", color: "#F59E0B", note: "9,000+ 앱 허브" },
                  { name: "Higgsfield", icon: "🎬", status: "제한됨", color: "#7C3AED", note: "LOD 전용 (CEO 승인)" },
                ].map((t) => (
                  <div key={t.name} style={{ padding: "10px", background: "#111827", borderRadius: "8px", borderLeft: `3px solid ${t.color}` }}>
                    <div style={{ fontSize: "16px", marginBottom: "4px" }}>{t.icon}</div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: t.color }}>{t.name}</div>
                    <div style={{ fontSize: "10px", color: t.color === "#475569" ? "#475569" : "#64748b", marginTop: "2px" }}>● {t.status}</div>
                    <div style={{ fontSize: "9px", color: "#334155", marginTop: "3px" }}>{t.note}</div>
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
                { lv: 2, name: "컨텍스트", pct: ctxEnabled ? 90 : 50, state: ctxEnabled ? "✅" : "⚠️", note: ctxEnabled ? `MEMORY ${MEMORY.length}개 → 전 에이전트 자동 주입 ON` : "컨텍스트 주입 OFF", color: ctxEnabled ? "#22c55e" : "#eab308" },
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
                  <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>MEMORY {MEMORY.length}개를 모든 에이전트 시스템 프롬프트에 자동 추가</div>
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
                          {(() => {
                            const wf = WORKFLOWS.find((w) => w.id === wfId);
                            const isMusicOS = wf?.cat === "음악OS";
                            const currentPipelineStep = isMusicOS ? GOSARI_PIPELINE.find((p) => p.wfId === wfId) : null;
                            const nextStep = currentPipelineStep ? GOSARI_PIPELINE.find((p) => p.step === currentPipelineStep.step + 1) : null;
                            if (isMusicOS) {
                              return (
                                <button
                                  onClick={() => {
                                    const summary = chainRes.map((r) => `• ${r.ag.role}: ${r.txt.slice(0, 100)}`).join("\n");
                                    const stepLabel = currentPipelineStep ? `STEP ${currentPipelineStep.step} — ${currentPipelineStep.name}` : wf?.name ?? "";
                                    saveToNotion("save_log", {
                                      source: "GOSARI",
                                      title: stepLabel,
                                      content: `📌 STEP 상태: ${stepLabel}\n\n📝 요약:\n${summary}\n\n📖 결정 사항:\n${wfInput}\n\n🔄 변경 사항:\n${chainRes.map((r) => `${r.key} 결과 저장`).join(", ")}\n\n🎯 다음 액션: ${nextStep ? `STEP ${nextStep.step} — ${nextStep.name}` : "발매 완료"}`,
                                    });
                                    if (currentPipelineStep && gosariStep < currentPipelineStep.step) {
                                      setGosariStep(currentPipelineStep.step);
                                    }
                                  }}
                                  disabled={notionSaving}
                                  style={{ padding: "10px 18px", background: "#7C3AED66", color: "#c4b5fd", border: "1px solid #7C3AED", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}
                                >
                                  🌿 GOSARI 로그 저장
                                </button>
                              );
                            }
                            return (
                              <NotionBtn
                                action="save_workflow"
                                payload={{
                                  workflowName: wf?.name ?? "",
                                  input: wfInput,
                                  results: chainRes.map((r) => ({ agent: r.key, role: r.ag.role, text: r.txt, done: r.done })),
                                }}
                                label="📎 노션 저장"
                              />
                            );
                          })()}
                          <button
                            onClick={() => {
                              const wfName = WORKFLOWS.find((w) => w.id === wfId)?.name ?? "워크플로우";
                              const content = chainRes.map((r) => `【${r.key}】${r.ag.role}\n${r.txt}`).join("\n\n---\n\n");
                              saveToDrive(`[BALMYGARDEN] ${wfName} — ${new Date().toLocaleDateString("ko-KR")}`, `업무 요청: ${wfInput}\n\n${content}`);
                            }}
                            disabled={driveSaving}
                            style={{ padding: "10px 18px", background: driveSaving ? "#334155" : "#1a73e866", color: "#fff", border: "1px solid #1a73e8", borderRadius: "8px", cursor: driveSaving ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "12px" }}
                          >
                            {driveSaving ? "저장 중…" : "📁 Drive 저장"}
                          </button>
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

          {/* ══ Google Drive 컨텍스트 패널 ══ */}
          <div style={{ marginTop: "16px", ...S.card("#1a73e833") }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: drivePanel ? "12px" : "0", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>📁</span>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#60a5fa" }}>Google Drive 컨텍스트</div>
                  {driveCtxName
                    ? <div style={{ fontSize: "10px", color: "#22c55e" }}>✓ 주입됨: {driveCtxName.slice(0, 30)}</div>
                    : <div style={{ fontSize: "10px", color: "#475569" }}>Drive 파일을 읽어 에이전트에 자동 주입</div>
                  }
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {driveCtxName && (
                  <button onClick={() => { setDriveCtx(""); setDriveCtxName(""); }} style={{ padding: "4px 10px", background: "#334155", border: "1px solid #475569", borderRadius: "6px", color: "#94a3b8", fontSize: "10px", cursor: "pointer" }}>
                    ✕ 제거
                  </button>
                )}
                <button
                  onClick={() => { setDrivePanel(!drivePanel); if (!drivePanel && driveFiles.length === 0) loadDriveFiles(); }}
                  style={{ padding: "4px 12px", background: drivePanel ? "#1a73e822" : "#334155", border: `1px solid ${drivePanel ? "#1a73e8" : "#475569"}`, borderRadius: "6px", color: drivePanel ? "#60a5fa" : "#94a3b8", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}
                >
                  {drivePanel ? "▲ 닫기" : "▼ 파일 선택"}
                </button>
              </div>
            </div>
            {drivePanel && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <button onClick={loadDriveFiles} disabled={driveLoading} style={{ padding: "4px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: "6px", color: "#e2e8f0", fontSize: "10px", cursor: driveLoading ? "not-allowed" : "pointer" }}>
                    {driveLoading ? "로딩…" : "🔄 새로고침"}
                  </button>
                  <span style={{ fontSize: "10px", color: "#475569" }}>클릭하면 파일 내용을 에이전트 컨텍스트로 주입합니다</span>
                </div>
                {driveFiles.length === 0 && !driveLoading && (
                  <div style={{ fontSize: "11px", color: "#334155", padding: "16px", textAlign: "center" }}>
                    파일 없음 — GOOGLE_SERVICE_ACCOUNT_JSON 설정 확인
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "200px", overflowY: "auto" }}>
                  {driveFiles.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => injectDriveFile(f)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: driveCtxName === f.name ? "#1a73e822" : "#111827", borderRadius: "6px", border: `1px solid ${driveCtxName === f.name ? "#1a73e8" : "#1e293b"}`, cursor: "pointer" }}
                    >
                      <span style={{ fontSize: "14px" }}>
                        {f.mimeType.includes("document") ? "📄" : f.mimeType.includes("spreadsheet") ? "📊" : f.mimeType.includes("presentation") ? "📑" : "📁"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "11px", color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                        <div style={{ fontSize: "9px", color: "#475569" }}>{f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString("ko-KR") : ""}</div>
                      </div>
                      {driveCtxName === f.name && <span style={{ fontSize: "10px", color: "#22c55e" }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══ Slack 알림 토글 ══ */}
          <div style={{ marginTop: "10px", padding: "10px 14px", background: slackConfigured ? "#0f2419" : "#1a1f2e", borderRadius: "10px", border: `1px solid ${slackConfigured ? (slackNotify ? "#22c55e44" : "#334155") : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>💬</span>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: slackConfigured ? "#4ade80" : "#64748b" }}>
                  Slack 알림 {slackConfigured === null ? "확인 중…" : slackConfigured ? (slackNotify ? "ON" : "OFF") : "미설정"}
                </div>
                <div style={{ fontSize: "9px", color: "#475569" }}>
                  {slackConfigured ? "워크플로우 완료 시 채널에 알림 전송" : ".env.local에 SLACK_BOT_TOKEN + SLACK_CHANNEL_ID 추가 필요"}
                </div>
              </div>
            </div>
            {slackConfigured ? (
              <button
                onClick={() => setSlackNotify(!slackNotify)}
                style={{ padding: "4px 14px", background: slackNotify ? "#22c55e22" : "#334155", border: `1px solid ${slackNotify ? "#22c55e" : "#475569"}`, borderRadius: "20px", color: slackNotify ? "#22c55e" : "#94a3b8", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}
              >
                {slackNotify ? "ON" : "OFF"}
              </button>
            ) : (
              <span style={{ fontSize: "9px", color: "#334155", padding: "4px 10px", background: "#0f1629", borderRadius: "6px", border: "1px solid #1e293b" }}>
                api.slack.com/apps
              </span>
            )}
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
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {["자동화", "학습", "마케팅", "훅"].map((t) => (
                <button key={t} style={S.tabBtn(promptTab === t)} onClick={() => setPromptTab(t)}>
                  {t === "자동화" ? "⚡ 자동화60" : t === "학습" ? "🧠 학습 강화" : t === "마케팅" ? "📣 마케팅" : "💡 훅 문구"}
                </button>
              ))}
            </div>

            {promptTab === "자동화" && (() => {
              const cats = AUTOMATION_PROMPTS.map(p => p.cat).filter((v, i, a) => a.indexOf(v) === i);
              const catColors: Record<string, string> = {};
              AUTOMATION_PROMPTS.forEach(p => { catColors[p.cat] = p.catColor; });
              return (
                <div>
                  <div style={{ ...S.card("#06B6D422"), marginBottom: "16px", padding: "14px 18px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "800", color: "#67e8f9", marginBottom: "4px" }}>⚡ 업무 자동화 프롬프트 (누끼토끼 정리)</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>4개 카테고리 · ★ = 대표 프롬프트 · Claude Cowork 최적화</div>
                    <div style={{ marginTop: "8px", padding: "8px 10px", background: "#2d1e0e", border: "1px solid #F59E0B44", borderRadius: "6px", fontSize: "10px", color: "#fbbf24" }}>
                      ⚠️ 안전 규칙: 발송·결제·삭제처럼 되돌릴 수 없는 일은 자동화 금지. 항상 초안까지만 생성 후 CEO 확인.
                    </div>
                  </div>
                  {cats.map((cat) => {
                    const catPrompts = AUTOMATION_PROMPTS.filter(p => p.cat === cat);
                    const color = catColors[cat];
                    return (
                      <div key={cat} style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color, marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ padding: "2px 10px", background: color + "22", border: `1px solid ${color}44`, borderRadius: "10px" }}>{cat}</span>
                          <span style={{ fontSize: "10px", color: "#334155" }}>{catPrompts.length}개 프롬프트</span>
                        </div>
                        {catPrompts.map((p) => (
                          <div key={p.id} style={{ ...S.card(color + "18"), marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                              <span style={S.badge(color)}>{p.id}</span>
                              {p.star && <span style={{ fontSize: "10px", color: "#F59E0B", fontWeight: "700" }}>★ 대표</span>}
                              <span style={{ fontSize: "13px", fontWeight: "700", color }}>{p.name}</span>
                              <span style={{ fontSize: "10px", color: "#475569", marginLeft: "auto" }}>{p.tools}</span>
                            </div>
                            <div style={{ display: "grid", gap: "6px" }}>
                              {p.items.map((item, i) => (
                                <div key={i} style={{ background: "#111827", borderRadius: "8px", padding: "10px 12px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    {i === 0 && p.star && <span style={{ fontSize: "9px", color: "#F59E0B", fontWeight: "700" }}>★</span>}
                                    <span style={{ fontSize: "11px", fontWeight: "700", color, flex: 1 }}>{item.title}</span>
                                    <CopyBtn text={item.desc} id={`${p.id}-${i}`} small />
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.6" }}>{item.desc}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

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
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>🧠 메모리 ({MEMORY.length}건)</div>
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
        {/* ══════ SCHEDULE ══════ */}
        {tab === "schedule" && (() => {
          const catLabel: Record<string, { label: string; color: string; emoji: string }> = {
            daily:     { label: "매일", color: "#06B6D4", emoji: "☀️" },
            weekly:    { label: "매주", color: "#6366F1", emoji: "📅" },
            monthly:   { label: "매월", color: "#10B981", emoji: "🗓️" },
            quarterly: { label: "분기", color: "#F59E0B", emoji: "📊" },
            release:   { label: "발매", color: "#EF4444", emoji: "🎵" },
            gosari:    { label: "GOSARI", color: "#7C3AED", emoji: "🌿" },
          };
          const cats = ["daily", "weekly", "monthly", "quarterly", "gosari", "release"];
          return (
            <div>
              {/* Header */}
              <div style={{ ...S.card("#06B6D422"), marginBottom: "16px", padding: "16px 20px" }}>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "#67e8f9", marginBottom: "4px" }}>⏰ 작업 예약 (Claude Routines)</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  정해진 루틴마다 자동 실행 · Notion 저장 · ALINN 6단계 기준
                </div>
                <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {cats.map((c) => {
                    const ct = catLabel[c];
                    const count = SCHEDULES.filter((s) => s.cat === c).length;
                    return (
                      <span key={c} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: ct.color + "22", border: `1px solid ${ct.color}44`, color: ct.color }}>
                        {ct.emoji} {ct.label} {count}건
                      </span>
                    );
                  })}
                </div>
              </div>

              {cats.map((cat) => {
                const items = SCHEDULES.filter((s) => s.cat === cat);
                if (items.length === 0) return null;
                const ct = catLabel[cat];
                return (
                  <div key={cat} style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: ct.color, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{ct.emoji}</span>
                      <span>{ct.label} 루틴</span>
                      <span style={{ fontSize: "10px", color: "#334155", fontWeight: "400" }}>— {items.length}개 작업</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {items.map((s, i) => (
                        <div key={i} style={{ ...S.card(ct.color + "33"), padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                          {/* Time badge */}
                          <div style={{ background: ct.color + "22", border: `1px solid ${ct.color}44`, borderRadius: "6px", padding: "4px 10px", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: "10px", color: ct.color, fontWeight: "700" }}>{s.time}</div>
                          </div>
                          {/* Agent badge */}
                          <div style={{ fontSize: "10px", color: "#94a3b8", background: "#1e293b", padding: "3px 8px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                            {s.agent}
                          </div>
                          {/* Task */}
                          <div style={{ flex: 1, fontSize: "12px", color: "#e2e8f0", minWidth: "120px" }}>{s.task}</div>
                          {/* Action button */}
                          {s.wfId ? (
                            <button
                              onClick={() => { setWfId(s.wfId!); setTab("workflow"); }}
                              style={{ padding: "6px 14px", background: ct.color, border: "none", borderRadius: "6px", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              ▶ 워크플로우
                            </button>
                          ) : s.chatAgent ? (
                            <button
                              onClick={() => { setChatAgent(s.chatAgent!); setChatMsgs([]); setTab("chat"); }}
                              style={{ padding: "6px 14px", background: "#1e293b", border: `1px solid ${ct.color}`, borderRadius: "6px", color: ct.color, fontSize: "11px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              💬 에이전트 대화
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Claude Routines 안내 */}
              <div style={{ ...S.card("#F59E0B22"), padding: "14px 16px", border: "1px solid #F59E0B33" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#fbbf24", marginBottom: "6px" }}>💡 Claude Routines 자동화 팁 (ALINN 6단계)</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.7" }}>
                  • 위 "▶ 워크플로우" 버튼으로 수동 즉시 실행 가능<br />
                  • 클라우드 자동화: Claude Code 웹 환경 → CronJob으로 예약 실행<br />
                  • Notion에 결과 자동 전달 — 워크플로우 완료 시 자동 저장됨<br />
                  • 매일 08:00 REX 루틴 → "3트랙 우선순위 정리" 직접 대화로 시작
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════ PROJECTS ══════ */}
        {tab === "projects" && (
          <div>
            {/* Header */}
            <div style={{ ...S.card("#7C3AED33"), marginBottom: "16px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#a78bfa", marginBottom: "4px" }}>🌿 PROJECT GOSARI</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>BALMY MUSIC OS v1.0 · 첫 번째 테스트 프로젝트</div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                    {[["테마", "시간(Time)"], ["메시지", "우리는 모두 누군가의 고사리였다"], ["트랙", "EP 6곡"]].map(([k, v]) => (
                      <span key={k} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: "#7C3AED22", border: "1px solid #7C3AED44", color: "#c4b5fd" }}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "#a78bfa" }}>{gosariStep}</div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>/ 12 STEP</div>
                  <div style={{ fontSize: "10px", color: gosariStep >= 12 ? "#22c55e" : "#7C3AED", marginTop: "4px", fontWeight: "700" }}>
                    {gosariStep === 0 ? "시작 전" : gosariStep >= 12 ? "✅ 완료" : "진행 중"}
                  </div>
                </div>
              </div>
            </div>

            {/* 15-Step Pipeline Tracker */}
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>📌 STEP 상태 — 15단계 파이프라인</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: "8px", marginBottom: "20px" }}>
              {GOSARI_PIPELINE.map((p) => {
                const done = gosariStep >= p.step;
                const active = gosariStep + 1 === p.step;
                const color = done ? "#22c55e" : active ? "#a78bfa" : "#334155";
                const bg = done ? "#0d2d1a" : active ? "#1e1040" : "#0d1117";
                return (
                  <div
                    key={p.step}
                    style={{ background: bg, border: `1px solid ${color}44`, borderLeft: `3px solid ${color}`, borderRadius: "8px", padding: "10px 12px", cursor: "pointer", transition: "all 0.15s" }}
                    onClick={() => {
                      if (done) setGosariStep(p.step - 1);
                      else if (active || gosariStep + 1 === p.step) setGosariStep(p.step);
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px" }}>{done ? "✅" : active ? "▶️" : "○"}</span>
                      <span style={{ fontSize: "10px", color, fontWeight: "700" }}>STEP {p.step}</span>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: done ? "#86efac" : active ? "#c4b5fd" : "#475569", marginBottom: "3px" }}>{p.name}</div>
                    <div style={{ fontSize: "10px", color: "#475569" }}>{p.agent}</div>
                    {active && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setWfId(p.wfId); setTab("workflow"); }}
                        style={{ marginTop: "6px", padding: "3px 8px", background: "#7C3AED", border: "none", borderRadius: "4px", color: "#fff", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}
                      >
                        ▶ 워크플로우 시작
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Step Detail */}
            {gosariStep < 12 && (
              <div style={{ ...S.card("#7C3AED22"), marginBottom: "20px", padding: "16px", border: "1px solid #7C3AED44" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#a78bfa", marginBottom: "8px" }}>
                  🎯 다음 액션 — STEP {gosariStep + 1}: {GOSARI_PIPELINE[gosariStep]?.name}
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>{GOSARI_PIPELINE[gosariStep]?.desc}</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setWfId(GOSARI_PIPELINE[gosariStep].wfId); setTab("workflow"); }}
                    style={{ padding: "8px 18px", background: "#7C3AED", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                  >
                    ▶ 워크플로우 실행
                  </button>
                  <button
                    onClick={() => {
                      if (gosariStep < 12) setGosariStep(gosariStep + 1);
                    }}
                    style={{ padding: "8px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#94a3b8", fontSize: "12px", cursor: "pointer" }}
                  >
                    ✓ 완료 처리
                  </button>
                </div>
              </div>
            )}

            {/* Decision Log */}
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>📖 Decision Log</div>
            <div style={{ ...S.card(), marginBottom: "16px", padding: "14px" }}>
              {/* Add decision */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                <select
                  value={newDecisionTag}
                  onChange={(e) => setNewDecisionTag(e.target.value as "결정" | "변경" | "보류")}
                  style={{ padding: "6px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: "6px", color: "#e2e8f0", fontSize: "12px" }}
                >
                  <option value="결정">결정</option>
                  <option value="변경">변경</option>
                  <option value="보류">보류</option>
                </select>
                <input
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newDecision.trim()) {
                      const entry: DecisionEntry = {
                        date: new Date().toISOString(),
                        step: gosariStep,
                        stepName: GOSARI_PIPELINE[gosariStep - 1]?.name ?? "시작 전",
                        decision: newDecision.trim(),
                        tag: newDecisionTag,
                      };
                      setDecisionLog([entry, ...decisionLog]);
                      setNewDecision("");
                    }
                  }}
                  placeholder="결정/변경 사항 입력 후 Enter"
                  style={{ flex: 1, minWidth: "180px", padding: "6px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: "6px", color: "#e2e8f0", fontSize: "12px" }}
                />
                <button
                  onClick={() => {
                    if (!newDecision.trim()) return;
                    const entry: DecisionEntry = {
                      date: new Date().toISOString(),
                      step: gosariStep,
                      stepName: GOSARI_PIPELINE[gosariStep - 1]?.name ?? "시작 전",
                      decision: newDecision.trim(),
                      tag: newDecisionTag,
                    };
                    setDecisionLog([entry, ...decisionLog]);
                    setNewDecision("");
                  }}
                  style={{ padding: "6px 14px", background: "#7C3AED", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                >
                  + 추가
                </button>
                {decisionLog.length > 0 && (
                  <button
                    disabled={projectSaving}
                    onClick={async () => {
                      setProjectSaving(true);
                      const content = decisionLog.map((d) =>
                        `[${d.tag}] STEP ${d.step} ${d.stepName} — ${d.decision} (${new Date(d.date).toLocaleString("ko-KR")})`
                      ).join("\n");
                      await saveToNotion("save_log", {
                        source: "GOSARI",
                        title: `Decision Log — STEP ${gosariStep} ${GOSARI_PIPELINE[gosariStep - 1]?.name ?? ""}`,
                        content: `📌 STEP 상태: STEP ${gosariStep}/15 — ${GOSARI_PIPELINE[gosariStep - 1]?.name ?? "시작 전"}\n\n📖 결정 사항:\n${content}\n\n🎯 다음 액션: STEP ${gosariStep + 1} — ${GOSARI_PIPELINE[gosariStep]?.name ?? "완료"}`,
                      });
                      setProjectSaving(false);
                    }}
                    style={{ padding: "6px 12px", background: projectSaving ? "#334155" : "#0d2d1a", border: "1px solid #22c55e44", borderRadius: "6px", color: "#86efac", fontSize: "11px", cursor: "pointer" }}
                  >
                    {projectSaving ? "저장 중…" : "📎 Notion 저장"}
                  </button>
                )}
              </div>
              {/* Log list */}
              {decisionLog.length === 0 ? (
                <div style={{ textAlign: "center", color: "#334155", fontSize: "12px", padding: "20px" }}>
                  결정/변경 사항을 입력하면 여기에 누적됩니다
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "320px", overflowY: "auto" }}>
                  {decisionLog.map((d, i) => {
                    const tagColor: Record<string, string> = { 결정: "#22c55e", 변경: "#f59e0b", 보류: "#94a3b8" };
                    return (
                      <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 10px", background: "#0d1117", borderRadius: "6px", border: "1px solid #1e293b" }}>
                        <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: (tagColor[d.tag] ?? "#94a3b8") + "22", color: tagColor[d.tag] ?? "#94a3b8", border: `1px solid ${(tagColor[d.tag] ?? "#94a3b8")}44`, whiteSpace: "nowrap", marginTop: "1px" }}>
                          {d.tag}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>STEP {d.step} {d.stepName} · {new Date(d.date).toLocaleString("ko-KR")}</div>
                          <div style={{ fontSize: "13px", color: "#e2e8f0" }}>{d.decision}</div>
                        </div>
                        <button onClick={() => setDecisionLog(decisionLog.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "14px", padding: "0 4px" }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Changelog — 완료된 스텝 목록 */}
            {gosariStep > 0 && (
              <>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>🔄 Changelog</div>
                <div style={{ ...S.card(), padding: "14px" }}>
                  {GOSARI_PIPELINE.filter((p) => gosariStep >= p.step).map((p) => (
                    <div key={p.step} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
                      <span style={{ fontSize: "14px" }}>✅</span>
                      <span style={{ fontSize: "10px", color: "#22c55e", whiteSpace: "nowrap", fontWeight: "700" }}>STEP {p.step}</span>
                      <span style={{ fontSize: "12px", color: "#86efac", fontWeight: "700" }}>{p.name}</span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>{p.desc}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Project Bible Quick Reference */}
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginTop: "20px", marginBottom: "10px" }}>📖 Project Bible — EP 트랙 리스트</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: "8px" }}>
              {[
                { num: "01", title: "늦게 알았네", symbol: "전화, 시간", emotion: "후회·깨달음" },
                { num: "02", title: "고사리",      symbol: "고사리, 큰 손, 작은 손", emotion: "탄생·보호" },
                { num: "03", title: "큰 손",        symbol: "큰 손, 집", emotion: "감사" },
                { num: "04", title: "사진 한 장",   symbol: "사진, 시간", emotion: "그리움·기록" },
                { num: "05", title: "떠난 기차",    symbol: "기차, 봄", emotion: "이별·흘러감" },
                { num: "06", title: "봄은 또 오더라", symbol: "봄, 고사리", emotion: "희망·순환" },
              ].map((t) => (
                <div key={t.num} style={{ ...S.card("#7C3AED11"), padding: "10px 14px", border: "1px solid #7C3AED22" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#7C3AED", fontWeight: "700" }}>#{t.num}</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0" }}>{t.title}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>심볼: {t.symbol}</div>
                  <div style={{ fontSize: "10px", color: "#a78bfa" }}>감정: {t.emotion}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════ STUDIO (v4.0) ══════ */}
        {tab === "qg" && (
          <div>
            {/* 헤더 */}
            <div style={{ ...S.card("#7C3AED44"), marginBottom: "16px", padding: "16px 20px" }}>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#a78bfa", marginBottom: "4px" }}>🎬 BALMY MUSIC OS v4.0 — AI 크리에이티브 스튜디오</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Quality Gate · Producer Review · Production Memory · Creative Conflict — 창작 품질 루프 통합 관제</div>
            </div>

            {/* 서브탭 네비게이션 */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
              {(["채점", "리뷰", "PM", "토론"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setStudioTab(t)}
                  style={{
                    padding: "6px 16px", fontSize: "12px", fontWeight: "700", borderRadius: "6px", cursor: "pointer", border: "none",
                    background: studioTab === t ? "#7C3AED" : "#1e293b",
                    color: studioTab === t ? "#fff" : "#64748b",
                  }}
                >
                  {t === "채점" ? "🎯 채점" : t === "리뷰" ? "📝 리뷰" : t === "PM" ? "🧠 PM" : "⚔️ 토론"}
                </button>
              ))}
            </div>

            {/* ── 채점 서브탭 ── */}
            {studioTab === "채점" && (
            <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              {/* 왼쪽: 채점 패널 */}
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>채점 입력</div>

                {/* 게이트 선택 */}
                <div style={{ ...S.card(), marginBottom: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>게이트 선택 (QG-01~12)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {GOSARI_GATES.map((g) => (
                      <button
                        key={g.gate}
                        onClick={() => setActiveQG(g.gate)}
                        style={{
                          padding: "3px 8px", fontSize: "10px", borderRadius: "4px", cursor: "pointer", border: "none",
                          background: activeQG === g.gate ? "#7C3AED" : "#1e293b",
                          color: activeQG === g.gate ? "#fff" : "#64748b",
                          fontWeight: activeQG === g.gate ? "700" : "400",
                        }}
                      >
                        QG-{String(g.gate).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const g = GOSARI_GATES.find((x) => x.gate === activeQG)!;
                    return (
                      <div style={{ marginTop: "10px", padding: "8px 10px", background: "#111827", borderRadius: "6px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#a78bfa" }}>QG-{String(g.gate).padStart(2, "0")} {g.name}</div>
                        <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>담당: {g.agent}</div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>{g.desc}</div>
                      </div>
                    );
                  })()}
                </div>

                {/* 트랙 선택 */}
                <div style={{ ...S.card(), marginBottom: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>트랙 선택</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {GOSARI_TRACKS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setQgTrack(t)}
                        style={{
                          padding: "3px 8px", fontSize: "10px", borderRadius: "4px", cursor: "pointer", border: "none",
                          background: qgTrack === t ? "#0369A1" : "#1e293b",
                          color: qgTrack === t ? "#fff" : "#64748b",
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8개 항목 채점 */}
                <div style={{ ...S.card(), marginBottom: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "10px" }}>8개 평가 항목 (0~100점, 전항목 90+ = PASS)</div>
                  {QG_CATEGORIES.map((cat) => {
                    const score = qgScores[cat];
                    const ok = score >= 90;
                    const color = score === 0 ? "#334155" : ok ? "#22C55E" : "#EF4444";
                    return (
                      <div key={cat} style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "11px", minWidth: "64px", color: "#94a3b8" }}>{cat}</span>
                          <span style={{ fontSize: "9px", color: "#475569", minWidth: "50px" }}>담당: {QG_CATEGORY_AGENT[cat]}</span>
                          <div style={{ flex: 1, background: "#1e293b", borderRadius: "3px", height: "5px", overflow: "hidden" }}>
                            <div style={{ width: `${score}%`, height: "100%", background: color, transition: "width 0.3s, background 0.3s" }} />
                          </div>
                          <input
                            type="number" min={0} max={100}
                            value={score === 0 ? "" : score}
                            onChange={(e) => {
                              const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                              setQgScores((prev) => ({ ...prev, [cat]: v }));
                            }}
                            placeholder="0"
                            style={{
                              width: "44px", padding: "2px 4px", background: "#111827",
                              border: `1px solid ${color}`, borderRadius: "4px",
                              color: "#e2e8f0", fontSize: "11px", textAlign: "center",
                            }}
                          />
                          <span style={{ fontSize: "10px", color, minWidth: "28px", fontWeight: "700" }}>
                            {score === 0 ? "—" : ok ? "✓" : "✗"}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* 총점 및 PASS/FAIL */}
                  <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "8px", background: qgPass(qgScores) ? "#0d2e14" : Object.values(qgScores).every((v) => v === 0) ? "#111827" : "#2d1010", border: `1px solid ${qgPass(qgScores) ? "#22C55E" : Object.values(qgScores).every((v) => v === 0) ? "#1e293b" : "#EF4444"}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: qgPass(qgScores) ? "#22C55E" : Object.values(qgScores).every((v) => v === 0) ? "#475569" : "#EF4444" }}>
                          {Object.values(qgScores).every((v) => v === 0) ? "미입력" : qgPass(qgScores) ? "PASS" : "FAIL"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          평균 {qgTotal(qgScores)}점 · 미달 항목: {QG_CATEGORIES.filter((c) => qgScores[c] > 0 && qgScores[c] < 90).join(", ") || "없음"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "28px", fontWeight: "900", color: "#a78bfa" }}>{qgTotal(qgScores)}</div>
                        <div style={{ fontSize: "9px", color: "#475569" }}>/ 100</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAIL 시 피드백 */}
                {!qgPass(qgScores) && Object.values(qgScores).some((v) => v > 0) && (
                  <div style={{ ...S.card("#EF444422"), marginBottom: "10px" }}>
                    <div style={{ fontSize: "11px", color: "#fca5a5", marginBottom: "6px" }}>개선 루프 — 피드백 입력</div>
                    <textarea
                      value={qgFeedback}
                      onChange={(e) => setQgFeedback(e.target.value)}
                      placeholder={`미달 항목: ${QG_CATEGORIES.filter((c) => qgScores[c] > 0 && qgScores[c] < 90).join(", ")} — 구체적 개선 방향을 입력하세요`}
                      style={{ width: "100%", padding: "8px", background: "#0d1117", border: "1px solid #EF444444", borderRadius: "6px", color: "#e2e8f0", fontSize: "11px", resize: "vertical", minHeight: "60px", boxSizing: "border-box" }}
                    />
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "4px" }}>
                      담당 에이전트: {QG_CATEGORIES.filter((c) => qgScores[c] > 0 && qgScores[c] < 90).map((c) => QG_CATEGORY_AGENT[c]).filter((v, i, a) => a.indexOf(v) === i).join(", ")} → 수정 후 재평가
                    </div>
                  </div>
                )}

                <button
                  onClick={submitQG}
                  disabled={Object.values(qgScores).every((v) => v === 0)}
                  style={{ width: "100%", padding: "10px", background: Object.values(qgScores).every((v) => v === 0) ? "#1e293b" : "#7C3AED", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: Object.values(qgScores).every((v) => v === 0) ? "not-allowed" : "pointer" }}
                >
                  QG 평가 기록 저장
                </button>
              </div>

              {/* 오른쪽: 평가 히스토리 + CHANGELOG */}
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>평가 기록</div>
                {qgHistory.length === 0 ? (
                  <div style={{ ...S.card(), marginBottom: "10px", textAlign: "center", color: "#334155", padding: "24px", fontSize: "12px" }}>
                    평가 기록 없음 — 왼쪽에서 채점 후 저장
                  </div>
                ) : (
                  <div style={{ marginBottom: "10px" }}>
                    {qgHistory.map((e) => (
                      <div key={e.id} style={{ ...S.card(e.pass ? "#22C55E33" : "#EF444433"), marginBottom: "6px", padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: e.pass ? "#22C55E" : "#EF4444" }}>{e.pass ? "PASS" : "FAIL"}</span>
                          <span style={{ ...S.badge("#7C3AED") }}>QG-{String(e.gate).padStart(2, "0")}</span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{e.gateName}</span>
                          <span style={{ fontSize: "10px", color: "#475569", marginLeft: "auto" }}>{new Date(e.date).toLocaleString("ko-KR")}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>트랙: {e.track} · 평균 {qgTotal(e.scores)}점</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                          {QG_CATEGORIES.map((c) => (
                            <span key={c} style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: e.scores[c] >= 90 ? "#22C55E22" : "#EF444422", color: e.scores[c] >= 90 ? "#86efac" : "#fca5a5", border: `1px solid ${e.scores[c] >= 90 ? "#22C55E44" : "#EF444444"}` }}>
                              {c} {e.scores[c]}
                            </span>
                          ))}
                        </div>
                        {e.feedback && (
                          <div style={{ fontSize: "10px", color: "#fca5a5", marginTop: "4px", padding: "4px 6px", background: "#2d1010", borderRadius: "4px" }}>
                            개선 피드백: {e.feedback}
                          </div>
                        )}
                        <button
                          onClick={() => setQgHistory((prev) => prev.filter((x) => x.id !== e.id))}
                          style={{ marginTop: "4px", background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "10px" }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* CHANGELOG */}
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px", marginTop: "4px" }}>CHANGELOG</div>
                <div style={{ ...S.card(), marginBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <input
                      value={newChangelogDesc}
                      onChange={(e) => setNewChangelogDesc(e.target.value)}
                      placeholder="변경 내용 입력"
                      style={{ flex: 1, minWidth: "120px", padding: "5px 8px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px" }}
                    />
                    <select
                      value={newChangelogType}
                      onChange={(e) => setNewChangelogType(e.target.value as "신규" | "수정" | "삭제" | "보류")}
                      style={{ padding: "5px 6px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px" }}
                    >
                      {(["신규", "수정", "삭제", "보류"] as const).map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={newChangelogAgent}
                      onChange={(e) => setNewChangelogAgent(e.target.value)}
                      style={{ padding: "5px 6px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px" }}
                    >
                      {Object.keys(AGENTS).map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <button
                      onClick={() => {
                        if (!newChangelogDesc.trim()) return;
                        const lastVer = changelog[0]?.version ?? "v3.2";
                        const parts = lastVer.replace("v", "").split(".");
                        const next = `v${parts[0]}.${Number(parts[1]) + 1}`;
                        setChangelog((prev) => [{ version: next, date: new Date().toISOString().slice(0, 10), type: newChangelogType, desc: newChangelogDesc.trim(), agent: newChangelogAgent }, ...prev]);
                        setNewChangelogDesc("");
                      }}
                      style={{ padding: "5px 10px", background: "#6366F1", border: "none", borderRadius: "5px", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                    >
                      추가
                    </button>
                  </div>
                  {changelog.map((c, i) => {
                    const typeColor: Record<string, string> = { 신규: "#22C55E", 수정: "#06B6D4", 삭제: "#EF4444", 보류: "#F59E0B" };
                    return (
                      <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
                        <span style={{ fontSize: "10px", color: "#a78bfa", fontWeight: "700", minWidth: "34px" }}>{c.version}</span>
                        <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: (typeColor[c.type] ?? "#94a3b8") + "22", color: typeColor[c.type] ?? "#94a3b8", border: `1px solid ${(typeColor[c.type] ?? "#94a3b8")}44`, whiteSpace: "nowrap", marginTop: "1px" }}>{c.type}</span>
                        <span style={{ flex: 1, fontSize: "11px", color: "#94a3b8" }}>{c.desc}</span>
                        <span style={{ fontSize: "9px", color: "#475569", whiteSpace: "nowrap" }}>{c.agent}</span>
                        <span style={{ fontSize: "9px", color: "#334155", whiteSpace: "nowrap" }}>{c.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 게이트 전체 현황 */}
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px", marginTop: "4px" }}>QG 전체 현황 — QG-01~12</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "8px" }}>
              {GOSARI_GATES.map((g) => {
                const passed = qgHistory.filter((h) => h.gate === g.gate && h.pass).length;
                const failed = qgHistory.filter((h) => h.gate === g.gate && !h.pass).length;
                const status = passed > 0 ? "pass" : failed > 0 ? "fail" : "pending";
                const color = status === "pass" ? "#22C55E" : status === "fail" ? "#EF4444" : "#334155";
                return (
                  <div
                    key={g.gate}
                    onClick={() => setActiveQG(g.gate)}
                    style={{ ...S.card(color + "44"), cursor: "pointer", borderLeft: `3px solid ${color}` }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color }}>QG-{String(g.gate).padStart(2, "0")}</span>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: "#e2e8f0" }}>{g.name}</span>
                      <span style={{ marginLeft: "auto", fontSize: "11px" }}>
                        {status === "pass" ? "✅" : status === "fail" ? "❌" : "⏳"}
                      </span>
                    </div>
                    <div style={{ fontSize: "9px", color: "#475569" }}>{g.agent}</div>
                    <div style={{ fontSize: "9px", color: "#334155", marginTop: "2px" }}>{g.desc}</div>
                    {(passed > 0 || failed > 0) && (
                      <div style={{ fontSize: "9px", color: "#64748b", marginTop: "4px" }}>
                        PASS {passed}회 / FAIL {failed}회
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </>)} {/* end 채점 서브탭 */}

            {/* ── 리뷰 서브탭 ── */}
            {studioTab === "리뷰" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                {/* 왼쪽: 리뷰 입력 */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>프로듀서 리뷰 작성</div>
                  <div style={{ ...S.card(), marginBottom: "10px" }}>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>버전</div>
                        <input value={reviewVersion} onChange={(e) => setReviewVersion(e.target.value)}
                          style={{ width: "100%", padding: "5px 8px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>트랙</div>
                        <select value={reviewTrack} onChange={(e) => setReviewTrack(e.target.value)}
                          style={{ width: "100%", padding: "5px 8px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px" }}>
                          {GOSARI_TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>담당</div>
                        <select value={reviewAgent} onChange={(e) => setReviewAgent(e.target.value)}
                          style={{ width: "100%", padding: "5px 8px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px" }}>
                          {["LYRA", "MUSE", "SAGE", "STROBE", "NOVA", "CONDUCTOR"].map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    </div>
                    {(["good", "bad", "improve", "next"] as const).map((field) => {
                      const labels = { good: "좋았던 점", bad: "부족한 점", improve: "개선 방향", next: "다음 수정" };
                      const vals = { good: reviewGood, bad: reviewBad, improve: reviewImprove, next: reviewNext };
                      const setters = { good: setReviewGood, bad: setReviewBad, improve: setReviewImprove, next: setReviewNext };
                      return (
                        <div key={field} style={{ marginBottom: "8px" }}>
                          <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>{labels[field]}</div>
                          <textarea value={vals[field]} onChange={(e) => setters[field](e.target.value)}
                            placeholder={`${labels[field]}을 입력하세요`}
                            style={{ width: "100%", padding: "6px 8px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px", resize: "vertical", minHeight: "50px", boxSizing: "border-box" }} />
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                      <button
                        disabled={reviewGenerating}
                        onClick={async () => {
                          setReviewGenerating(true);
                          try {
                            const txt = await callAgent(reviewAgent,
                              `트랙 "${reviewTrack}" ${reviewVersion} 프로듀서 리뷰를 작성해. 좋았던점/부족한점/개선방향/다음수정 4항목으로. 각 50자 이내.`);
                            const lines = txt.split("\n").filter((l) => l.trim());
                            if (lines.length >= 4) {
                              setReviewGood(lines[0].replace(/^[^:：]+[:：]\s*/, ""));
                              setReviewBad(lines[1].replace(/^[^:：]+[:：]\s*/, ""));
                              setReviewImprove(lines[2].replace(/^[^:：]+[:：]\s*/, ""));
                              setReviewNext(lines[3].replace(/^[^:：]+[:：]\s*/, ""));
                            } else {
                              setReviewGood(txt);
                            }
                          } catch (e) {
                            setReviewGood(`오류: ${(e as Error).message}`);
                          }
                          setReviewGenerating(false);
                        }}
                        style={{ flex: 1, padding: "8px", background: reviewGenerating ? "#1e293b" : "#7C3AED", border: "none", borderRadius: "6px", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: reviewGenerating ? "not-allowed" : "pointer" }}
                      >
                        {reviewGenerating ? "AI 생성 중…" : `${reviewAgent} 자동 생성`}
                      </button>
                      <button
                        onClick={() => {
                          if (!reviewGood.trim() && !reviewBad.trim()) return;
                          const entry: ReviewEntry = {
                            id: Date.now().toString(),
                            version: reviewVersion, track: reviewTrack,
                            good: reviewGood, bad: reviewBad, improve: reviewImprove, next: reviewNext,
                            agent: reviewAgent, date: new Date().toISOString(),
                          };
                          setReviews((prev) => [entry, ...prev]);
                          setReviewGood(""); setReviewBad(""); setReviewImprove(""); setReviewNext("");
                        }}
                        style={{ flex: 1, padding: "8px", background: "#0369A1", border: "none", borderRadius: "6px", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 리뷰 히스토리 */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>리뷰 히스토리</div>
                  {reviews.length === 0 ? (
                    <div style={{ ...S.card(), textAlign: "center", color: "#334155", padding: "24px", fontSize: "12px" }}>리뷰 기록 없음</div>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} style={{ ...S.card("#0369A133"), marginBottom: "8px", padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                          <span style={{ ...S.badge("#0369A1"), fontSize: "10px" }}>{r.version}</span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{r.track}</span>
                          <span style={{ fontSize: "10px", color: "#64748b" }}>by {r.agent}</span>
                          <span style={{ fontSize: "9px", color: "#475569", marginLeft: "auto" }}>{new Date(r.date).toLocaleDateString("ko-KR")}</span>
                        </div>
                        {[{ label: "✅ 좋았던 점", val: r.good, color: "#22C55E" },
                          { label: "❌ 부족한 점", val: r.bad, color: "#EF4444" },
                          { label: "🔄 개선 방향", val: r.improve, color: "#F59E0B" },
                          { label: "➡️ 다음 수정", val: r.next, color: "#06B6D4" }].map((item) => item.val && (
                            <div key={item.label} style={{ marginBottom: "4px" }}>
                              <span style={{ fontSize: "9px", color: item.color, fontWeight: "700" }}>{item.label}</span>
                              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{item.val}</div>
                            </div>
                          ))}
                        <button onClick={() => setReviews((prev) => prev.filter((x) => x.id !== r.id))}
                          style={{ marginTop: "4px", background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "10px" }}>삭제</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── PM (Production Memory) 서브탭 ── */}
            {studioTab === "PM" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                {/* 왼쪽: PM 등록 */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>Production Memory 등록</div>
                  <div style={{ ...S.card(), marginBottom: "10px" }}>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>트랙</div>
                        <select value={pmTrack} onChange={(e) => setPmTrack(e.target.value)}
                          style={{ width: "100%", padding: "5px 8px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px" }}>
                          {GOSARI_TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>카테고리</div>
                        <select value={pmCategory} onChange={(e) => setPmCategory(e.target.value)}
                          style={{ width: "100%", padding: "5px 8px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px" }}>
                          {["Hook", "Structure", "Lyric", "Melody", "Mood", "Prompt", "Visual", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>점수</div>
                        <input type="number" min={0} max={100} value={pmScore} onChange={(e) => setPmScore(Number(e.target.value))}
                          style={{ width: "100%", padding: "5px 8px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>성공 이유 / 패턴</div>
                    <textarea value={pmReason} onChange={(e) => setPmReason(e.target.value)}
                      placeholder="어떤 결정·방식이 성공했는지 기록"
                      style={{ width: "100%", padding: "6px 8px", background: "#111827", border: "1px solid #1e293b", borderRadius: "5px", color: "#e2e8f0", fontSize: "11px", resize: "vertical", minHeight: "80px", boxSizing: "border-box", marginBottom: "8px" }} />
                    <button
                      onClick={() => {
                        if (!pmReason.trim()) return;
                        const id = `PM-${String(pmCounter).padStart(3, "0")}`;
                        setProductionMemories((prev) => [{ id, track: pmTrack, category: pmCategory, score: pmScore, reason: pmReason, date: new Date().toISOString() }, ...prev]);
                        setPmCounter((n) => n + 1);
                        setPmReason("");
                      }}
                      style={{ width: "100%", padding: "8px", background: "#0369A1", border: "none", borderRadius: "6px", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                    >
                      PM 기록 저장
                    </button>
                  </div>
                  <div style={{ ...S.card("#F59E0B22"), padding: "10px 14px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#F59E0B", marginBottom: "4px" }}>Production Memory 원칙</div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", lineHeight: "1.6" }}>
                      성공 패턴을 PM-001 형식으로 기록.<br/>
                      다음 트랙에 재사용 가능한 결정·기술만 저장.<br/>
                      점수 90+ 사례 우선 보존.
                    </div>
                  </div>
                </div>

                {/* 오른쪽: PM 목록 */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>
                    성공 패턴 라이브러리 ({productionMemories.length}개)
                  </div>
                  {productionMemories.length === 0 ? (
                    <div style={{ ...S.card(), textAlign: "center", color: "#334155", padding: "24px", fontSize: "12px" }}>PM 기록 없음 — 왼쪽에서 성공 패턴 등록</div>
                  ) : (
                    productionMemories.map((pm) => (
                      <div key={pm.id} style={{ ...S.card("#F59E0B22"), marginBottom: "8px", padding: "10px 14px", borderLeft: "3px solid #F59E0B" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "10px", fontWeight: "700", color: "#F59E0B" }}>{pm.id}</span>
                          <span style={{ ...S.badge("#0369A1"), fontSize: "9px" }}>{pm.category}</span>
                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>{pm.track}</span>
                          <span style={{ fontSize: "10px", fontWeight: "700", color: pm.score >= 90 ? "#22C55E" : "#EF4444", marginLeft: "auto" }}>{pm.score}점</span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{pm.reason}</div>
                        <div style={{ fontSize: "9px", color: "#475569", marginTop: "4px" }}>{new Date(pm.date).toLocaleDateString("ko-KR")}</div>
                        <button onClick={() => setProductionMemories((prev) => prev.filter((x) => x.id !== pm.id))}
                          style={{ marginTop: "4px", background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "10px" }}>삭제</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── 토론 (Creative Conflict) 서브탭 ── */}
            {studioTab === "토론" && (
              <div>
                <div style={{ ...S.card("#EF444422"), marginBottom: "14px", padding: "14px 18px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#fca5a5", marginBottom: "4px" }}>⚔️ Creative Conflict — 에이전트 토론 시스템</div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>에이전트별 창작 의견 병렬 수집 → CONDUCTOR 최종 결정 → Decision Log 자동 기록</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                  {/* 왼쪽: 토론 설정 */}
                  <div>
                    <div style={{ ...S.card(), marginBottom: "10px" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>토론 주제</div>
                      <textarea
                        value={conflictTopic}
                        onChange={(e) => setConflictTopic(e.target.value)}
                        placeholder="예: 1번 트랙의 시작을 피아노로 열어야 하는가, 보컬로 열어야 하는가"
                        style={{ width: "100%", padding: "8px", background: "#111827", border: "1px solid #1e293b", borderRadius: "6px", color: "#e2e8f0", fontSize: "11px", resize: "vertical", minHeight: "70px", boxSizing: "border-box", marginBottom: "8px" }}
                      />
                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>참여 에이전트 선택</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                        {["LYRA", "MUSE", "SAGE", "NOVA", "STROBE", "CONDUCTOR", "ARIA", "PHANTOM"].map((ag) => (
                          <button
                            key={ag}
                            onClick={() => setConflictAgents((prev) =>
                              prev.includes(ag) ? prev.filter((a) => a !== ag) : [...prev, ag]
                            )}
                            style={{
                              padding: "3px 10px", fontSize: "10px", borderRadius: "4px", cursor: "pointer", border: "none",
                              background: conflictAgents.includes(ag) ? (AGENTS[ag]?.color ?? "#334155") : "#1e293b",
                              color: conflictAgents.includes(ag) ? "#fff" : "#64748b",
                              fontWeight: conflictAgents.includes(ag) ? "700" : "400",
                            }}
                          >
                            {ag}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={runConflict}
                        disabled={conflictRunning || !conflictTopic.trim() || conflictAgents.length === 0}
                        style={{ width: "100%", padding: "9px", background: conflictRunning || !conflictTopic.trim() ? "#1e293b" : "#EF4444", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: conflictRunning || !conflictTopic.trim() ? "not-allowed" : "pointer", marginBottom: "8px" }}
                      >
                        {conflictRunning ? "에이전트 토론 중…" : "⚔️ 토론 시작"}
                      </button>
                      {conflictOpinions.length > 0 && (
                        <button
                          onClick={runConflictDecision}
                          disabled={conflictDecisionLoading}
                          style={{ width: "100%", padding: "9px", background: conflictDecisionLoading ? "#1e293b" : "#7C3AED", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: conflictDecisionLoading ? "not-allowed" : "pointer" }}
                        >
                          {conflictDecisionLoading ? "CONDUCTOR 결정 중…" : "CONDUCTOR 최종 결정"}
                        </button>
                      )}
                    </div>

                    {/* 에이전트 의견 */}
                    {conflictOpinions.length > 0 && (
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#a5b4fc", marginBottom: "8px" }}>에이전트 의견</div>
                        {conflictOpinions.map((op) => (
                          <div key={op.agent} style={{ ...S.card((AGENTS[op.agent]?.color ?? "#334155") + "22"), marginBottom: "6px", padding: "8px 12px", borderLeft: `3px solid ${AGENTS[op.agent]?.color ?? "#334155"}` }}>
                            <div style={{ fontSize: "10px", fontWeight: "700", color: AGENTS[op.agent]?.color ?? "#64748b", marginBottom: "3px" }}>{AGENTS[op.agent]?.av} {op.agent}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{op.text}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CONDUCTOR 결정 */}
                    {conflictDecision && (
                      <div style={{ ...S.card("#7C3AED44"), marginTop: "10px", padding: "12px 16px", borderLeft: "3px solid #7C3AED" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#a78bfa", marginBottom: "6px" }}>CONDUCTOR 최종 결정</div>
                        <div style={{ fontSize: "12px", color: "#e2e8f0", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{conflictDecision}</div>
                      </div>
                    )}

                    {/* CEO Approval Gate */}
                    {conflictDecision && (
                      <div style={{ ...S.card("#22C55E22"), marginTop: "10px", padding: "12px 16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#86efac", marginBottom: "6px" }}>CEO Approval Gate</div>
                        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "8px" }}>
                          CONDUCTOR 결정 → CEO 최종 승인 (예술성 + 사업성 이중 확인)
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={async () => {
                              setConductorApprovalLoading(true);
                              try {
                                const txt = await callAgent("CONDUCTOR",
                                  `CEO 보고용 결정 요약:\n\n주제: ${conflictTopic}\n결정: ${conflictDecision}\n\n사업적 관점 + 예술적 관점 각 1줄. CEO 승인 요청 형식으로. 100자 이내.`);
                                setConductorApproval(txt);
                              } catch (e) {
                                setConductorApproval(`오류: ${(e as Error).message}`);
                              }
                              setConductorApprovalLoading(false);
                            }}
                            disabled={conductorApprovalLoading}
                            style={{ flex: 1, padding: "7px", background: conductorApprovalLoading ? "#1e293b" : "#0369A1", border: "none", borderRadius: "6px", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: conductorApprovalLoading ? "not-allowed" : "pointer" }}
                          >
                            {conductorApprovalLoading ? "준비 중…" : "CEO 보고서 생성"}
                          </button>
                          <button
                            onClick={() => setCeoApproved(true)}
                            style={{ flex: 1, padding: "7px", background: ceoApproved ? "#22C55E" : "#1e293b", border: `1px solid ${ceoApproved ? "#22C55E" : "#334155"}`, borderRadius: "6px", color: ceoApproved ? "#fff" : "#64748b", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                          >
                            {ceoApproved ? "CEO 승인 완료" : "CEO 승인"}
                          </button>
                        </div>
                        {conductorApproval && (
                          <div style={{ marginTop: "8px", padding: "8px 10px", background: "#0d1117", borderRadius: "6px", fontSize: "11px", color: "#94a3b8", lineHeight: "1.6" }}>
                            {conductorApproval}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 오른쪽: 토론 히스토리 */}
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#a5b4fc", marginBottom: "10px" }}>토론 히스토리 ({conflictHistory.length}건)</div>
                    {conflictHistory.length === 0 ? (
                      <div style={{ ...S.card(), textAlign: "center", color: "#334155", padding: "24px", fontSize: "12px" }}>토론 기록 없음</div>
                    ) : (
                      conflictHistory.map((c) => (
                        <div key={c.id} style={{ ...S.card("#EF444422"), marginBottom: "8px", padding: "10px 14px" }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#fca5a5", marginBottom: "4px" }}>{c.topic}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginBottom: "6px" }}>
                            {c.opinions.map((op) => (
                              <span key={op.agent} style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "3px", background: (AGENTS[op.agent]?.color ?? "#334155") + "33", color: AGENTS[op.agent]?.color ?? "#64748b" }}>{op.agent}</span>
                            ))}
                          </div>
                          {c.decision && (
                            <div style={{ fontSize: "10px", color: "#a78bfa", padding: "4px 8px", background: "#1e1033", borderRadius: "4px" }}>
                              결정: {c.decision.slice(0, 120)}{c.decision.length > 120 ? "…" : ""}
                            </div>
                          )}
                          <div style={{ fontSize: "9px", color: "#475569", marginTop: "4px" }}>{new Date(c.date).toLocaleString("ko-KR")}</div>
                          <button onClick={() => setConflictHistory((prev) => prev.filter((x) => x.id !== c.id))}
                            style={{ marginTop: "4px", background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "10px" }}>삭제</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ OS v4.0 ══════ */}
        {tab === "osv4" && <OsV4Tab isMobile={isMobile} />}

        {/* ══════ TRADING ══════ */}
        {/* 탭이 열릴 때만 마운트 — 닫혀 있으면 폴링 자체가 돌지 않는다. */}
        {tab === "trading" && <TradingTab isMobile={isMobile} />}

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
                { lv: 2, emoji: "📎", name: "컨텍스트", pct: ctxEnabled ? 90 : 50, state: ctxEnabled ? "✅ 활성" : "⚠️ 비활성", color: ctxEnabled ? "#22c55e" : "#eab308", impl: [`MEMORY ${MEMORY.length}개 항목 (기업/앱/게임/CEO/QA/크레딧/GOSARI 등)`, ctxEnabled ? "전 에이전트 API 호출 시 자동 주입 ON" : "컨텍스트 주입 현재 OFF", "홈 탭에서 ON/OFF 토글 가능"], next: "Notion 기록을 실시간 컨텍스트로 주입 (Phase 2)" },
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
