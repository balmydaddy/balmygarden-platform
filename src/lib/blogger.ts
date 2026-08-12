/**
 * Google Blogger API v3 연동 — blogTeam(INK/CHECK/CHIEF) 파이프라인에서
 * CHIEF 승인된 초안을 balmydaddy.blogspot.com에 실제로 발행하기 위한 헬퍼.
 *
 * 필요 환경변수:
 *  - BLOGGER_CLIENT_ID / BLOGGER_CLIENT_SECRET : Google Cloud OAuth 클라이언트
 *  - BLOGGER_REFRESH_TOKEN : /api/blogger-oauth/callback에서 1회 발급받은 리프레시 토큰
 *  - BLOGGER_BLOG_URL : 기본값 https://balmydaddy.blogspot.com
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://www.googleapis.com/blogger/v3";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.BLOGGER_CLIENT_ID;
  const clientSecret = process.env.BLOGGER_CLIENT_SECRET;
  const refreshToken = process.env.BLOGGER_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Blogger 환경변수 미설정 — BLOGGER_CLIENT_ID/BLOGGER_CLIENT_SECRET/BLOGGER_REFRESH_TOKEN 필요"
    );
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Blogger 액세스 토큰 갱신 실패: ${JSON.stringify(data)}`);
  }
  return data.access_token as string;
}

let cachedBlogId: string | null = null;

async function getBlogId(accessToken: string): Promise<string> {
  if (cachedBlogId) return cachedBlogId;
  const blogUrl = process.env.BLOGGER_BLOG_URL || "https://balmydaddy.blogspot.com";
  const res = await fetch(`${API_BASE}/blogs/byurl?url=${encodeURIComponent(blogUrl)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(`Blogger 블로그 ID 조회 실패: ${JSON.stringify(data)}`);
  }
  cachedBlogId = data.id as string;
  return cachedBlogId;
}

/** 텍스트 초안 → Blogger HTML 포스트로 실제 발행. 성공 시 게시글 URL 반환. */
export async function publishToBlogger(title: string, bodyText: string): Promise<string> {
  const accessToken = await getAccessToken();
  const blogId = await getBlogId(accessToken);
  const html = bodyText
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  const res = await fetch(`${API_BASE}/blogs/${blogId}/posts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content: html }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(`Blogger 발행 실패: ${JSON.stringify(data)}`);
  }
  return data.url as string;
}
