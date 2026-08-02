/* 2D 오피스 배치 데이터.
 * 좌표는 0~100 백분율 — 컨테이너 크기와 무관하게 배치가 유지된다. */

export type ZoneId =
  | "meeting"
  | "music"
  | "app"
  | "game"
  | "strategy"
  | "ops"
  | "conductor";

export type Zone = {
  id: ZoneId;
  name: string;
  emoji: string;
  color: string;
  /* 구역 사각형 (%) */
  x: number;
  y: number;
  w: number;
  h: number;
};

export const ZONES: Zone[] = [
  { id: "meeting", name: "회의실", emoji: "🪑", color: "#f59e0b", x: 4, y: 4, w: 34, h: 26 },
  { id: "conductor", name: "지휘석", emoji: "🎯", color: "#94a3b8", x: 68, y: 4, w: 28, h: 26 },
  { id: "music", name: "음악팀", emoji: "🎵", color: "#BE185D", x: 4, y: 36, w: 28, h: 26 },
  { id: "app", name: "앱팀", emoji: "🗂️", color: "#6366F1", x: 36, y: 36, w: 28, h: 26 },
  { id: "game", name: "게임팀", emoji: "⚔️", color: "#8B5CF6", x: 68, y: 36, w: 28, h: 26 },
  { id: "strategy", name: "전략팀", emoji: "🔭", color: "#06B6D4", x: 20, y: 68, w: 28, h: 26 },
  { id: "ops", name: "관리팀", emoji: "⚖️", color: "#EF4444", x: 52, y: 68, w: 28, h: 26 },
];

export type Staff = {
  key: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  /* 평소 자리 */
  home: ZoneId;
};

export const STAFF: Staff[] = [
  { key: "CONDUCTOR", name: "CONDUCTOR", emoji: "🎯", color: "#94A3B8", role: "지휘·최종결정", home: "conductor" },
  { key: "SAGE", name: "SAGE", emoji: "📖", color: "#7C3AED", role: "세계관", home: "music" },
  { key: "LYRA", name: "LYRA", emoji: "✍️", color: "#BE185D", role: "작사", home: "music" },
  { key: "MUSE", name: "MUSE", emoji: "🎨", color: "#F59E0B", role: "Suno·크리에이티브", home: "music" },
  { key: "STROBE", name: "STROBE", emoji: "🎬", color: "#0369A1", role: "MV·비주얼", home: "music" },
  { key: "ARIA", name: "ARIA", emoji: "🗂️", color: "#6366F1", role: "영수증앱 PM", home: "app" },
  { key: "ZERO", name: "ZERO", emoji: "💻", color: "#10B981", role: "풀스택 개발", home: "app" },
  { key: "PHANTOM", name: "PHANTOM", emoji: "⚔️", color: "#8B5CF6", role: "LOD 게임 PM", home: "game" },
  { key: "NOVA", name: "NOVA", emoji: "🔭", color: "#06B6D4", role: "전략·마케팅", home: "strategy" },
  { key: "SCOUT", name: "SCOUT", emoji: "🔍", color: "#F97316", role: "리서치", home: "strategy" },
  { key: "AEGIS", name: "AEGIS", emoji: "⚖️", color: "#EF4444", role: "법무·QA", home: "ops" },
  { key: "REX", name: "REX", emoji: "📋", color: "#64748B", role: "총무·배급", home: "ops" },
];

/* 자동 업무 시나리오 — 캐릭터가 이 목록에서 골라 움직인다. */
export type Errand = { staff: string; to: ZoneId; task: string };

export const ERRANDS: Errand[] = [
  { staff: "SCOUT", to: "music", task: "음원 트렌드 브리핑 전달" },
  { staff: "SCOUT", to: "conductor", task: "일일 뉴스 브리핑 보고" },
  { staff: "AEGIS", to: "music", task: "가사 QA 게이트 점검" },
  { staff: "AEGIS", to: "app", task: "개인정보 처리 검토" },
  { staff: "LYRA", to: "conductor", task: "Bridge 판정 요청" },
  { staff: "ZERO", to: "conductor", task: "배포 결과 보고" },
  { staff: "NOVA", to: "game", task: "LOD 시장성 검토" },
  { staff: "MUSE", to: "music", task: "Suno 프롬프트 작업" },
  { staff: "REX", to: "ops", task: "DistroKid 배급 확인" },
  { staff: "PHANTOM", to: "strategy", task: "게임 로드맵 협의" },
  { staff: "ARIA", to: "app", task: "테스팅 피드백 정리" },
  { staff: "STROBE", to: "music", task: "MV 스토리보드 검토" },
  { staff: "SAGE", to: "music", task: "T-02 세계관 설계" },
];

/* 회의 소집 조합 — PRP 병렬 분석 구성과 연동 */
export const MEETINGS: { title: string; members: string[] }[] = [
  { title: "스탠드업", members: ["CONDUCTOR", "ARIA", "PHANTOM", "ZERO"] },
  { title: "음악 결정 (PRP)", members: ["SAGE", "LYRA", "NOVA", "SCOUT"] },
  { title: "전략 결정 (PRP)", members: ["NOVA", "AEGIS", "SCOUT"] },
  { title: "개발 결정 (PRP)", members: ["ZERO", "ARIA", "PHANTOM", "AEGIS"] },
  { title: "CDG 찬반 토론", members: ["CONDUCTOR", "AEGIS", "NOVA"] },
];

/* 구역 안에서 겹치지 않게 자리를 잡는다. */
export function seatIn(zone: Zone, index: number, total: number) {
  const cols = Math.min(total, 3);
  const rows = Math.ceil(total / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const padX = zone.w * 0.18;
  const padY = zone.h * 0.3;
  const cw = (zone.w - padX * 2) / Math.max(cols - 1, 1);
  const ch = (zone.h - padY * 2) / Math.max(rows - 1, 1);
  return {
    x: zone.x + padX + (cols === 1 ? (zone.w - padX * 2) / 2 : col * cw),
    y: zone.y + padY + (rows === 1 ? (zone.h - padY * 2) / 2 : row * ch),
  };
}
