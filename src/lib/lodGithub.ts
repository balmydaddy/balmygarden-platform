/**
 * PHANTOM(A-02, LOD 게임 PM)의 일일 진행 확인용 — balmydaddy/lord-of-dark 저장소의
 * 최근 커밋 활동을 GitHub REST API로 조회한다. 저장소가 비공개라 401/404가 나면
 * 그 사실 자체를 결과에 담아 리턴한다(예외를 던져 파이프라인을 막지 않는다).
 *
 * 필요 시 GITHUB_TOKEN 환경변수(레포 read 권한)를 추가하면 비공개 레포도 조회 가능.
 */

const LOD_REPO = "balmydaddy/lord-of-dark";
const API_BASE = "https://api.github.com";

export type LodCommit = { sha: string; message: string; author: string; date: string };

export type LodActivity =
  | { ok: true; sinceDays: number; commits: LodCommit[]; lastCommitAt: string | null }
  | { ok: false; error: string };

/** 최근 N일간 커밋 목록을 최신순으로 반환. */
export async function getLodRecentActivity(sinceDays = 3): Promise<LodActivity> {
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `${API_BASE}/repos/${LOD_REPO}/commits?since=${encodeURIComponent(since)}&per_page=30`,
      { headers, cache: "no-store" }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        error: `GitHub API ${res.status} — ${body.slice(0, 200)}${
          res.status === 401 || res.status === 404
            ? " (비공개 레포일 수 있음 — GITHUB_TOKEN 환경변수 설정 필요)"
            : ""
        }`,
      };
    }
    type RawCommit = {
      sha: string;
      commit: { message: string; author: { name?: string; date?: string } };
    };
    const data = (await res.json()) as RawCommit[];
    const commits: LodCommit[] = data.map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split("\n")[0],
      author: c.commit.author?.name ?? "?",
      date: c.commit.author?.date ?? "",
    }));
    return { ok: true, sinceDays, commits, lastCommitAt: commits[0]?.date ?? null };
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message };
  }
}

/** PHANTOM 프롬프트에 바로 넣을 수 있는 요약 텍스트. */
export function summarizeLodActivity(activity: LodActivity): string {
  if (!activity.ok) return `[LOD 저장소 조회 실패] ${activity.error}`;
  if (activity.commits.length === 0) {
    return `최근 ${activity.sinceDays}일간 lord-of-dark 저장소에 커밋 없음.`;
  }
  const lines = activity.commits
    .slice(0, 10)
    .map((c) => `- ${c.date.slice(0, 16).replace("T", " ")} ${c.author}: ${c.message}`);
  return (
    `최근 ${activity.sinceDays}일간 커밋 ${activity.commits.length}건 (최신순, 최대 10건 표시):\n` +
    lines.join("\n")
  );
}
