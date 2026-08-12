import { NextResponse } from "next/server";

/**
 * Blogger 연동 1회성 설정 — 이 주소를 브라우저에서 열면 Google 로그인 동의
 * 화면으로 이동한다. 동의 후 /api/blogger-oauth/callback으로 돌아와
 * refresh_token을 화면에 보여준다(그 값을 Vercel 환경변수로 등록하면 끝).
 */
export async function GET() {
  const clientId = process.env.BLOGGER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "BLOGGER_CLIENT_ID 환경변수가 아직 설정되지 않았습니다." },
      { status: 500 }
    );
  }
  // Google Cloud Console에 등록한 리디렉션 URI와 문자 그대로 일치해야 하므로
  // req.nextUrl.origin(배포 고유 URL일 수 있음) 대신 고정 프로덕션 도메인을 쓴다.
  const redirectUri = "https://balmygarden-platform.vercel.app/api/blogger-oauth/callback";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/blogger",
    access_type: "offline",
    prompt: "consent",
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
