/* 2D 오피스 배치 데이터.
 * 좌표는 0~100 백분율. 방들은 벽을 맞대고 격자로 붙어 있다. */

export type ZoneId =
  | "meeting"
  | "conductor"
  | "music"
  | "app"
  | "game"
  | "strategy"
  | "ops";

export type Desk = { x: number; y: number; /* 의자가 붙는 방향 */ face: "up" | "down" };

export type Zone = {
  id: ZoneId;
  name: string;
  label: string;
  color: string;
  floor: string;
  x: number;
  y: number;
  w: number;
  h: number;
  desks: Desk[];
};

/* 방 배치 — 2행 3열 + 상단 2칸. 벽이 맞닿게 좌표를 이어 붙였다. */
export const ZONES: Zone[] = [
  {
    id: "meeting",
    name: "회의실",
    label: "MEETING ROOM",
    color: "#f59e0b",
    floor: "#3d3222",
    x: 0, y: 0, w: 50, h: 32,
    desks: [
      { x: 20, y: 17, face: "down" },
      { x: 30, y: 17, face: "down" },
      { x: 20, y: 24, face: "up" },
      { x: 30, y: 24, face: "up" },
    ],
  },
  {
    id: "conductor",
    name: "지휘석",
    label: "DIRECTOR ROOM",
    color: "#a5b4fc",
    floor: "#2b2f45",
    x: 50, y: 0, w: 50, h: 32,
    desks: [{ x: 72, y: 18, face: "down" }],
  },
  {
    id: "music",
    name: "음악팀",
    label: "MUSIC STUDIO",
    color: "#f472b6",
    floor: "#3a2733",
    x: 0, y: 32, w: 34, h: 36,
    desks: [
      { x: 9, y: 46, face: "down" },
      { x: 24, y: 46, face: "down" },
      { x: 9, y: 60, face: "down" },
      { x: 24, y: 60, face: "down" },
    ],
  },
  {
    id: "app",
    name: "앱팀",
    label: "APP DESK",
    color: "#818cf8",
    floor: "#272b45",
    x: 34, y: 32, w: 33, h: 36,
    desks: [
      { x: 43, y: 46, face: "down" },
      { x: 58, y: 46, face: "down" },
    ],
  },
  {
    id: "game",
    name: "게임팀",
    label: "GAME LAB",
    color: "#c084fc",
    floor: "#332745",
    x: 67, y: 32, w: 33, h: 36,
    desks: [
      { x: 76, y: 46, face: "down" },
      { x: 91, y: 46, face: "down" },
    ],
  },
  {
    id: "strategy",
    name: "전략팀",
    label: "RESEARCH LAB",
    color: "#22d3ee",
    floor: "#1f353d",
    x: 0, y: 68, w: 50, h: 32,
    desks: [
      { x: 9, y: 78, face: "down" },
      { x: 25, y: 78, face: "down" },
      { x: 41, y: 78, face: "down" },
      { x: 9, y: 90, face: "down" },
      { x: 25, y: 90, face: "down" },
    ],
  },
  {
    id: "ops",
    name: "관리팀",
    label: "OPS OFFICE",
    color: "#f87171",
    floor: "#3d2626",
    x: 50, y: 68, w: 50, h: 32,
    desks: [
      { x: 63, y: 82, face: "down" },
      { x: 83, y: 82, face: "down" },
    ],
  },
];

export type Staff = {
  key: string;
  name: string;
  emoji: string;
  color: string;
  /* 옷 색 */
  wear: string;
  role: string;
  home: ZoneId;
  /* 직급 — 블로그팀처럼 조사-정리-검토 위계가 있는 팀에만 표시. 없으면 미표시. */
  level?: string;
};

export const STAFF: Staff[] = [
  { key: "CONDUCTOR", name: "CONDUCTOR", emoji: "🎯", color: "#a5b4fc", wear: "#4f46e5", role: "지휘·최종결정", home: "conductor" },
  { key: "SAGE", name: "SAGE", emoji: "📖", color: "#c4b5fd", wear: "#7C3AED", role: "세계관", home: "music" },
  { key: "LYRA", name: "LYRA", emoji: "✍️", color: "#f9a8d4", wear: "#BE185D", role: "작사", home: "music" },
  { key: "MUSE", name: "MUSE", emoji: "🎨", color: "#fcd34d", wear: "#D97706", role: "Suno·크리에이티브", home: "music" },
  { key: "STROBE", name: "STROBE", emoji: "🎬", color: "#7dd3fc", wear: "#0369A1", role: "MV·비주얼", home: "music" },
  { key: "ARIA", name: "ARIA", emoji: "🗂️", color: "#a5b4fc", wear: "#4338CA", role: "영수증앱 PM", home: "app" },
  { key: "ZERO", name: "ZERO", emoji: "💻", color: "#6ee7b7", wear: "#059669", role: "풀스택 개발", home: "app" },
  { key: "PHANTOM", name: "PHANTOM", emoji: "⚔️", color: "#d8b4fe", wear: "#7E22CE", role: "LOD 게임 PM", home: "game" },
  { key: "NOVA", name: "NOVA", emoji: "🔭", color: "#67e8f9", wear: "#0891B2", role: "전략·마케팅", home: "strategy" },
  { key: "SCOUT", name: "SCOUT", emoji: "🔍", color: "#fdba74", wear: "#EA580C", role: "리서치·트렌드 조사", home: "strategy", level: "사원" },
  { key: "AEGIS", name: "AEGIS", emoji: "⚖️", color: "#fca5a5", wear: "#DC2626", role: "법무·QA", home: "ops" },
  { key: "REX", name: "REX", emoji: "📋", color: "#cbd5e1", wear: "#475569", role: "총무·배급", home: "ops" },
  /* 블로그팀 — SCOUT 조사 결과를 초안화·검토. 조사(SCOUT)-정리(INK)-검토(CHECK→CHIEF).
     최소 인원으로 시작, 업무량 많으면 CEO 승인 후 증원(정리 인력 추가). */
  { key: "INK", name: "INK", emoji: "📝", color: "#a7f3d0", wear: "#0d9488", role: "블로그 초안 정리", home: "strategy", level: "주임" },
  { key: "CHECK", name: "CHECK", emoji: "🧐", color: "#fde68a", wear: "#b45309", role: "블로그 1차 검토", home: "strategy", level: "과장" },
  { key: "CHIEF", name: "CHIEF", emoji: "🏅", color: "#fecaca", wear: "#9f1239", role: "블로그 최종 검토·승인", home: "strategy", level: "팀장" },
];

export type Errand = { staff: string; to: ZoneId; task: string; say: string };

export const ERRANDS: Errand[] = [
  { staff: "SCOUT", to: "music", task: "음원 트렌드 브리핑 전달", say: "트렌드 정리했어요" },
  { staff: "SCOUT", to: "conductor", task: "일일 뉴스 브리핑 보고", say: "오늘 브리핑입니다" },
  { staff: "AEGIS", to: "music", task: "가사 QA 게이트 점검", say: "QA 보러 왔습니다" },
  { staff: "AEGIS", to: "app", task: "개인정보 처리 검토", say: "약관 확인할게요" },
  { staff: "LYRA", to: "conductor", task: "Bridge 판정 요청", say: "판정 부탁드려요" },
  { staff: "ZERO", to: "conductor", task: "배포 결과 보고", say: "배포 끝났습니다" },
  { staff: "NOVA", to: "game", task: "LOD 시장성 검토", say: "시장성 볼게요" },
  { staff: "MUSE", to: "app", task: "앱 스토어 소재 협의", say: "소재 상의해요" },
  { staff: "REX", to: "conductor", task: "배급 일정 보고", say: "배급 일정입니다" },
  { staff: "PHANTOM", to: "strategy", task: "게임 로드맵 협의", say: "로드맵 논의하죠" },
  { staff: "ARIA", to: "ops", task: "테스팅 피드백 정리", say: "피드백 전달드려요" },
  { staff: "STROBE", to: "game", task: "게임 아트 레퍼런스 공유", say: "레퍼런스 가져왔어요" },
  { staff: "SAGE", to: "conductor", task: "T-02 세계관 초안 보고", say: "세계관 초안이에요" },
  { staff: "ZERO", to: "game", task: "빌드 파이프라인 점검", say: "빌드 확인할게요" },
  { staff: "INK", to: "conductor", task: "블로그 초안 보고", say: "초안 가져왔어요" },
  { staff: "CHECK", to: "strategy", task: "블로그 초안 검토", say: "검토할게요" },
];

export const MEETINGS: { title: string; members: string[] }[] = [
  { title: "스탠드업", members: ["CONDUCTOR", "ARIA", "PHANTOM", "ZERO"] },
  { title: "음악 결정 (PRP)", members: ["SAGE", "LYRA", "NOVA", "SCOUT"] },
  { title: "전략 결정 (PRP)", members: ["NOVA", "AEGIS", "SCOUT"] },
  { title: "개발 결정 (PRP)", members: ["ZERO", "ARIA", "PHANTOM", "AEGIS"] },
  { title: "게임 시스템 논의 (PRP, 3일 주기)", members: ["ZERO", "PHANTOM", "MUSE", "NOVA", "SCOUT", "SAGE"] },
  { title: "CDG 찬반 토론", members: ["CONDUCTOR", "AEGIS", "NOVA"] },
];

/* 책상에 앉히거나, 자리가 모자라면 방 안에 세워 둔다. */
export function seatIn(zone: Zone, index: number, total: number) {
  const d = zone.desks[index];
  if (d) return { x: d.x, y: d.y + (d.face === "down" ? 5.5 : -5.5) };
  const extra = index - zone.desks.length;
  const perRow = 4;
  return {
    x: zone.x + zone.w * 0.2 + (extra % perRow) * (zone.w * 0.18),
    y: zone.y + zone.h * 0.78 + Math.floor(extra / perRow) * 6,
  };
}
