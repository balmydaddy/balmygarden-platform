import { NextRequest, NextResponse } from "next/server";

/**
 * /api/blogger-oauth/start에서 돌아오는 Google OAuth 콜백. 1회성 설정용 —
 * authorization code를 refresh_token으로 교환해 화면에 보여준다. CEO가 그 값을
 * BLOGGER_REFRESH_TOKEN Vercel 환경변수로 등록하면 이후 자동 발행에 쓰인다.
 * (이 화면에 뜬 토큰은 저장하지 않는다 — Vercel 환경변수 등록이 유일한 보관처)
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const errorParam = req.nextUrl.searchParams.get("error");
  if (errorParam) {
    return htmlResponse(`<h2>동의가 취소되었습니다: ${escapeHtml(errorParam)}</h2>`);
  }
  if (!code) {
    return htmlResponse(`<h2>code 파라미터가 없습니다. /api/blogger-oauth/start부터 다시 시작해주세요.</h2>`);
  }

  const clientId = process.env.BLOGGER_CLIENT_ID;
  const clientSecret = process.env.BLOGGER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return htmlResponse(`<h2>BLOGGER_CLIENT_ID / BLOGGER_CLIENT_SECRET 환경변수가 아직 설정되지 않았습니다.</h2>`);
  }

  const redirectUri = "https://balmygarden-platform.vercel.app/api/blogger-oauth/callback";
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();

  if (!res.ok || !data.refresh_token) {
    return htmlResponse(
      `<h2>토큰 교환 실패</h2><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>` +
        `<p>refresh_token이 없다면, 이미 한 번 동의한 적이 있어서일 수 있습니다. ` +
        `Google 계정 설정 → 보안 → 타사 앱 액세스에서 이 앱 연결을 해제한 뒤 ` +
        `/api/blogger-oauth/start를 다시 열어주세요(연결 해제하면 다음 동의 때 반드시 재발급됩니다).</p>`
    );
  }

  return htmlResponse(
    `<h2>✅ 연동 성공</h2>` +
      `<p>아래 값을 Vercel 환경변수 <b>BLOGGER_REFRESH_TOKEN</b>으로 등록해주세요:</p>` +
      `<pre style="background:#f1f5f9;padding:12px;border-radius:8px;word-break:break-all">${escapeHtml(data.refresh_token)}</pre>` +
      `<p>등록 후 재배포되면 블로그팀(INK→CHECK→CHIEF) 승인 글이 자동으로 balmydaddy.blogspot.com에 발행됩니다.</p>`
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function htmlResponse(bodyHtml: string): NextResponse {
  return new NextResponse(
    `<!doctype html><html><body style="font-family:system-ui;max-width:640px;margin:40px auto;padding:0 16px">${bodyHtml}</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
