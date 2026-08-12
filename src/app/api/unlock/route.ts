import { NextRequest, NextResponse } from "next/server";

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
  return NextResponse.json({ ok: true });
}
