import { NextRequest, NextResponse } from "next/server";
import {
  UNLOCK_COOKIE,
  UNLOCK_MAX_AGE,
  issueToken,
  isUnlocked as isUnlockedReq,
} from "@/lib/unlockAuth";

/* 검증 로직은 `src/lib/unlockAuth.ts`에 있다 — 다른 라우트가 route.ts를
   가로질러 import하지 않도록 분리했다(route 파일은 Next가 허용하는 export만
   내보낼 수 있어 공용 헬퍼를 두기에도 맞지 않는 자리다). */

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

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
  /* 양쪽 다 trim해서 비교한다. Vercel 환경변수에 값을 붙여넣을 때 끝에 줄바꿈·
     공백이 딸려 들어가는 일이 흔한데, 그러면 "분명 같은 비밀번호인데 계속
     틀리다고 나오는" 상태가 된다. 앞뒤 공백이 의미를 갖는 비밀번호는 없다. */
  if (typeof password !== "string" || password.trim() !== secret.trim()) {
    return NextResponse.json({ ok: false, reason: "mismatch" }, { status: 401 });
  }

  /* 잠금해제 상태를 httpOnly 쿠키로도 남긴다. 잠금이 클라이언트 localStorage
     뿐이면 API는 누구나 부를 수 있어 화면만 가리고 데이터는 열려 있는 셈이다.
     쿠키에는 비밀번호 원문이 아니라 만료 시각 + HMAC 서명만 넣는다. */
  const res = NextResponse.json({ ok: true });
  res.cookies.set(UNLOCK_COOKIE, issueToken(secret), {
    ...COOKIE_OPTS,
    maxAge: UNLOCK_MAX_AGE,
  });
  return res;
}

/**
 * 진단용 — 서버에 비밀번호가 설정돼 있는지, 지금 요청이 잠금해제 상태인지만
 * 알려준다. 비밀번호 값 자체는 절대 내보내지 않는다.
 *
 * 환경변수가 없으면 POST가 500을 돌려주는데 화면이 그걸 "비밀번호 틀림"으로
 * 표시하고 있었다 — 원인을 못 찾고 같은 비밀번호를 계속 다시 넣게 된다.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.DASHBOARD_UNLOCK_PASSWORD;
  return NextResponse.json({
    configured: typeof secret === "string" && secret.trim().length > 0,
    unlocked: isUnlockedReq(req),
  });
}

/** 잠그기 — 쿠키를 즉시 만료시킨다. 공용 PC에서 화면을 넘겨줄 때 필요하다. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(UNLOCK_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
