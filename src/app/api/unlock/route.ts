import { NextRequest, NextResponse } from "next/server";

/** 잠금해제 쿠키 이름 — 이 값을 읽는 쪽(api/notion 등)과 공유한다. */
export const UNLOCK_COOKIE = "bg_unlocked";

/** 서버에서만 검증한다 — 쿠키 값이 실제 비밀번호와 일치해야 통과. */
export function isUnlocked(req: NextRequest): boolean {
  const secret = process.env.DASHBOARD_UNLOCK_PASSWORD;
  if (!secret) return false;
  return req.cookies.get(UNLOCK_COOKIE)?.value === secret;
}

/**
 * 공개 링크 공유 시 방문자는 업무화면만 보고, 실제 지시·업무로그·트레이딩·
 * 노션 등은 못 보게 하기 위한 CEO 전용 잠금해제. 비밀번호는 서버 환경변수로만
 * 비교하고 클라이언트 번들에는 절대 노출하지 않는다.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.DASHBOARD_UNLOCK_PASSWORD;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "DASHBOARD_UNLOCK_PASSWORD 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }
  const { password } = await req.json();
  if (typeof password !== "string" || password !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  /* 잠금해제 상태를 httpOnly 쿠키로도 남긴다. 지금까지 잠금은 클라이언트
     localStorage뿐이라 API는 누구나 부를 수 있었다 — 화면만 가리고 데이터는
     열려 있던 셈이다. 미결 사항 제목·담당자처럼 내부 내용을 반환하는
     엔드포인트는 이 쿠키로 서버에서 직접 확인한다(클라이언트 값이 아니라). */
  const res = NextResponse.json({ ok: true });
  res.cookies.set(UNLOCK_COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
