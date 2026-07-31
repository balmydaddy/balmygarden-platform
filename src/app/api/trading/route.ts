import { NextResponse } from "next/server";

/**
 * 트레이딩 서버(python server.py) 상태 프록시.
 *
 * 브라우저가 배포본(HTTPS)에서 http://localhost:5000 을 직접 부르면
 * mixed content로 차단된다. 서버 사이드에서 대신 호출해 그 벽을 우회한다.
 *
 * TRADING_SERVER_URL 미설정 시 로컬 기본값을 쓴다 — 이 경우 Vercel 런타임에서는
 * 자기 자신의 localhost를 보게 되므로 실패가 정상이다. 외부에서 쓰려면
 * 트레이딩 서버를 터널(ngrok·cloudflared 등)로 노출하고 그 주소를 넣어야 한다.
 */
const SERVER_URL = process.env.TRADING_SERVER_URL ?? "http://localhost:5000";

export const dynamic = "force-dynamic";

export async function GET() {
  const target = `${SERVER_URL.replace(/\/$/, "")}/api/status`;

  try {
    const res = await fetch(target, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { online: false, reason: `트레이딩 서버 응답 ${res.status}`, target },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ online: true, data });
  } catch (e: unknown) {
    const err = e as Error;
    const reason =
      err.name === "TimeoutError"
        ? "트레이딩 서버 응답 없음 (4초 초과)"
        : `트레이딩 서버 연결 실패 — ${err.message}`;
    return NextResponse.json({ online: false, reason, target }, { status: 503 });
  }
}
