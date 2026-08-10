import { redirect } from "next/navigation";

/**
 * 저장소 3분리(M-91) 이후 이 프로젝트는 BALMYGARDEN 플랫폼 전용이다.
 * 실제 대시보드는 /agency에 있다 — 루트는 그쪽으로 즉시 넘긴다.
 */
export default function Home() {
  redirect("/agency");
}
