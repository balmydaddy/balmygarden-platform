/* SCOUT 감시 대상 AI 생성 도구 레지스트리.
 * Higgsfield 크레딧 소진(2026-08-01 실측 0.2 / free 플랜)에 따른 대체 체계.
 * 한도는 각 서비스 정책이라 수시로 바뀐다 — SCOUT 일일 체크 시 실제 값을 확인하고 갱신한다. */

export type ToolStatus = "primary" | "backup" | "blocked" | "watch";

export type AiTool = {
  id: string;
  name: string;
  status: ToolStatus;
  freeLimit: string;
  use: string;
  note: string;
  url: string;
};

export const AI_TOOLS: AiTool[] = [
  {
    id: "higgsfield",
    name: "Higgsfield",
    status: "blocked",
    freeLimit: "크레딧 0.2 / free 플랜",
    use: "LOD 게임 아트 (기존 지정)",
    note: "실측 2026-08-01. 사실상 사용 불가 — 충전은 CEO 승인 사항(과금)",
    url: "https://higgsfield.ai",
  },
  {
    id: "leonardo",
    name: "Leonardo AI",
    status: "primary",
    freeLimit: "일 150 토큰 (약 20~30장)",
    use: "LOD 캐릭터·몬스터·배경 아트",
    note: "게임 아트 특화 모델 보유. 다크판타지 톤에 적합",
    url: "https://leonardo.ai",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    status: "primary",
    freeLimit: "일 약 20장",
    use: "M-72 레퍼런스 보드 생성",
    note: "레퍼런스 보드 가이드가 ChatGPT/Gemini 기준으로 작성됨",
    url: "https://gemini.google.com",
  },
  {
    id: "playground",
    name: "Playground AI",
    status: "backup",
    freeLimit: "일 100장",
    use: "대량 시안 탐색",
    note: "무료 한도가 가장 큼. 품질보다 물량이 필요할 때",
    url: "https://playground.com",
  },
  {
    id: "nightcafe",
    name: "NightCafe",
    status: "backup",
    freeLimit: "일 5 크레딧 (누적 가능)",
    use: "보조 시안",
    note: "누적되므로 간헐 사용에 유리",
    url: "https://nightcafe.studio",
  },
  {
    id: "flux",
    name: "Flux (로컬)",
    status: "watch",
    freeLimit: "무제한 (자체 GPU)",
    use: "장기 대안",
    note: "오픈소스. VRAM 12GB 이상 필요 — CEO PC 사양 확인 후 판단",
    url: "https://blackforestlabs.ai",
  },
];

/* Meta AI Imagine은 무제한 무료지만 US 한정이라 제외했다. */

export const STATUS_META: Record<ToolStatus, { label: string; color: string }> = {
  primary: { label: "주력", color: "#22c55e" },
  backup: { label: "예비", color: "#38bdf8" },
  blocked: { label: "사용불가", color: "#ef4444" },
  watch: { label: "검토", color: "#f59e0b" },
};

/* SCOUT 일일 체크 항목 — 스케줄(매일 07:00)이 참조한다. */
export const DAILY_CHECK = [
  "주력 2종(Leonardo·Gemini) 일일 한도 소진 여부",
  "무료 한도 정책 변경 공지",
  "신규 무료 생성 도구 출시",
  "Higgsfield 프로모션·무료 크레딧 지급 여부",
];
