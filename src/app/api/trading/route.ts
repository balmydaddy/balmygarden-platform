import { NextRequest, NextResponse } from "next/server";
import { isUnlocked } from "@/lib/unlockAuth";

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

/**
 * 실패 원인을 상태코드 하나로 뭉뚱그리지 않는다.
 *
 * 터널을 거치면 응답 주체가 두 곳이다 — 터널 엣지(ngrok·Cloudflare)와 그 뒤의
 * server.py. 로컬 서버가 죽으면 연결 자체가 안 되지만(=여기까지 오지 않는다),
 * **터널만 안 떠 있으면 엣지가 대신 404를 돌려준다.** 이 둘을 같은 문구로
 * 보여주면 멀쩡히 돌아가는 server.py를 두고 서버 쪽을 뒤지게 된다.
 *
 * ngrok은 자기가 만든 오류 응답에 `ngrok-error-code` 헤더를 붙인다(터널에 에이전트가
 * 붙어 있지 않을 때 ERR_NGROK_3200). 그 헤더가 있으면 응답 주체가 엣지라는 뜻이라
 * 추측 없이 단정할 수 있다. 헤더가 없으면 단정하지 않고 두 가능성을 같이 적는다.
 */
function explainFailure(res: Response, target: string): { reason: string; hint: string } {
  const ngrokErr = res.headers.get("ngrok-error-code");

  if (ngrokErr) {
    return {
      reason: `터널은 살아있지만 트레이딩 서버가 안 붙어 있음 (${ngrokErr})`,
      hint:
        "PC에서 ngrok 터널이 꺼져 있다. server.py만 켜는 걸로는 부족하다 — " +
        "trading-autostart-install.bat을 다시 실행하면 서버와 터널을 같이 띄우고 " +
        "다음 로그인부터 둘 다 자동으로 뜬다.",
    };
  }

  if (res.status === 404) {
    return {
      reason: `트레이딩 서버 응답 404 — 주소는 살아있는데 /api/status가 없음`,
      hint:
        `${target} 을 응답한 쪽이 트레이딩 서버가 아닐 가능성이 크다. ` +
        "① PC에서 터널이 꺼져 있어 터널 제공자가 대신 404를 준 경우(가장 흔하다) " +
        "② TRADING_SERVER_URL이 다른 서비스를 가리키는 경우. 터널부터 확인한다.",
    };
  }

  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return {
      reason: `터널이 트레이딩 서버에 닿지 못함 (${res.status})`,
      hint: "터널은 떠 있는데 localhost:5000이 응답하지 않는다. server.py를 확인한다.",
    };
  }

  return {
    reason: `트레이딩 서버 응답 ${res.status}`,
    hint: "",
  };
}

export async function GET(req: NextRequest) {
  /* 응답에 실계좌 평가금액·보유종목이 그대로 들어간다. 트레이딩 화면은
     잠금해제 상태에서만 보이는데 이 프록시는 무인증이라, 공개 링크를 받은
     사람이 주소만 알면 금액을 볼 수 있었다. 화면과 같은 기준으로 막는다. */
  if (!isUnlocked(req)) {
    return NextResponse.json(
      { online: false, reason: "잠금 상태 — CEO 잠금해제 후 조회 가능", locked: true },
      { status: 401 }
    );
  }

  const target = `${SERVER_URL.replace(/\/$/, "")}/api/status`;

  try {
    const res = await fetch(target, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
      /* ngrok 무료 도메인은 브라우저처럼 보이는 요청에 경고 인터스티셜(HTML)을
         200으로 끼워 넣는다. 그러면 아래 res.json()이 터져 "연결 실패"로 잘못
         보고된다. 이 헤더가 그 인터스티셜을 건너뛴다. 다른 터널에서는 무시된다. */
      headers: { "ngrok-skip-browser-warning": "true" },
    });

    if (!res.ok) {
      const { reason, hint } = explainFailure(res, target);
      return NextResponse.json({ online: false, reason, hint, target }, { status: 502 });
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
