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

/** 자격증명 진단용 — 실제로 글을 올리지 않고 블로그 정보만 조회한다. */
export async function getBlogInfo(): Promise<{ id: string; name: string; url: string; postsCount: number }> {
  const accessToken = await getAccessToken();
  const blogUrl = process.env.BLOGGER_BLOG_URL || "https://balmydaddy.blogspot.com";
  const res = await fetch(`${API_BASE}/blogs/byurl?url=${encodeURIComponent(blogUrl)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(`Blogger 블로그 조회 실패: ${JSON.stringify(data)}`);
  }
  return {
    id: data.id,
    name: data.name,
    url: data.url,
    postsCount: data.posts?.totalItems ?? 0,
  };
}

/**
 * 무료 이미지 생성(Pollinations.ai, API 키 불필요) — CEO 방침(수익 발생 전
 * 무료 한도 내 진행, LOD 캐릭터 아트와 동일 파이프라인)에 맞춰 별도 유료
 * 이미지 API 없이 URL만으로 대표 이미지를 만든다. 별도 호출 없이 <img> src로
 * 바로 참조하면 요청 시점에 생성되어 뜬다.
 */
function buildImageUrl(prompt: string): string {
  const cleaned = prompt.trim().slice(0, 300);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleaned)}?width=1024&height=576&nologo=true`;
}

/**
 * "## 소제목" 줄은 <h2>로, 나머지 문단은 <p>로 변환한다(INK의 구조 규칙과 맞춘 렌더링).
 *
 * 기존엔 태그만 붙이고 스타일이 전혀 없어 Blogger 기본 테마의 좁은 글자·좁은 줄간격을
 * 그대로 물려받았다 — INK가 문단을 2~3문장으로 짧게 써도, 렌더링 단계에서 그 여백이
 * 사라져 화면에 글자가 빽빽하게 들어차 보였다(CEO 피드백: "논문 긁어온 느낌", 2026-08-19).
 * Blogger 테마 CSS를 신뢰할 수 없어 요소마다 인라인 스타일을 직접 지정한다:
 * ①본문 폭을 640px로 좁혀 한 줄 길이를 모바일 화면비에 맞춤 ②글자 크기·줄간격을
 * 키워 여백 확보 ③word-break:keep-all로 한글이 단어 중간에서 줄바꿈되는 것을 방지
 * (모바일 가독성에 특히 영향이 큼).
 */
function toHtml(bodyText: string): string {
  const blocks = bodyText
    .split(/\n{2,}/)
    .map((block) => {
      const heading = block.trim().match(/^##\s+(.+)$/);
      if (heading) {
        return `<h2 style="font-size:21px;line-height:1.45;font-weight:800;margin:40px 0 14px;color:#191919;">${heading[1].trim()}</h2>`;
      }
      const html = block.replace(/\n/g, "<br/>");
      return `<p style="font-size:17px;line-height:1.85;margin:0 0 22px;color:#2b2b2b;">${html}</p>`;
    })
    .join("\n");
  return (
    `<div style="max-width:640px;margin:0 auto;word-break:keep-all;overflow-wrap:break-word;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Segoe UI',Roboto,'Noto Sans KR',sans-serif;">\n` +
    `${blocks}\n</div>`
  );
}

/** 텍스트 초안 → Blogger HTML 포스트로 실제 발행. imagePrompt가 있으면 대표 이미지를 생성해 맨 위에 넣는다. 성공 시 게시글 URL 반환. */
export async function publishToBlogger(title: string, bodyText: string, imagePrompt?: string): Promise<string> {
  const accessToken = await getAccessToken();
  const blogId = await getBlogId(accessToken);
  const bodyHtml = toHtml(bodyText);
  const imageHtml = imagePrompt
    ? `<div style="max-width:640px;margin:0 auto 8px;"><img src="${buildImageUrl(imagePrompt)}" alt="${title.replace(/"/g, "&quot;")}" style="display:block;width:100%;height:auto;border-radius:10px;" /></div>\n`
    : "";
  const html = imageHtml + bodyHtml;

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
