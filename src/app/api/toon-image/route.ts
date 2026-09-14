import { NextRequest, NextResponse } from "next/server";

/**
 * 4컷 웹툰(TOON-01) 컷 이미지 프록시.
 *
 * 왜 원본 URL을 그대로 인스타에 넘기지 않나:
 *  1) 인스타 게시 API는 **JPEG만** 받는다. Pollinations가 무엇을 돌려주는지는
 *     확인이 안 됐다 — 이 저장소의 클라우드 세션은 egress 프록시가
 *     image.pollinations.ai를 막아(403) 여기서 직접 재 볼 수가 없었다.
 *     그래서 포맷 판정을 런타임으로 미루고, 아니면 조용히 넘기지 않고 막는다.
 *  2) Meta가 이미지를 가져가는 주소가 우리 도메인이어야 나중에 캐시·교체·차단을
 *     우리가 통제할 수 있다.
 *
 * 포맷 판정은 Content-Type 헤더가 아니라 매직바이트로 한다. 헤더는 중간
 * 경로에서 잘못 붙는 경우가 있고, Meta가 보는 건 바이트다.
 *
 * 진단: `?probe=1`을 붙이면 이미지 대신 판정 결과를 JSON으로 돌려준다.
 * 이 세션에서 Pollinations에 닿을 수 없으므로, 배포 후 이 주소를 한 번 열어
 * 보는 것이 미확인 항목을 닫는 유일한 방법이다.
 */

export const runtime = "nodejs";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

/** TOON-01은 캐러셀 전 컷을 1:1로 고정한다 — 캐러셀은 첫 장 비율로 나머지를 자른다. */
const DEFAULT_SIZE = 1024;
const MAX_SIZE = 2048;
const MAX_PROMPT = 300;
const FETCH_TIMEOUT_MS = 60_000;

type Detected = "jpeg" | "png" | "webp" | "gif" | "unknown";

/** 주어진 위치부터 바이트열이 일치하는지. tsconfig target이 ES5라 스프레드를 못 써서 직접 돈다. */
function matches(bytes: Uint8Array, offset: number, signature: number[]): boolean {
  if (bytes.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false;
  }
  return true;
}

/** 앞 12바이트만 보면 갈린다. Meta가 받는 것과 같은 기준으로 판정한다. */
function detectFormat(bytes: Uint8Array): Detected {
  if (matches(bytes, 0, [0xff, 0xd8, 0xff])) return "jpeg";
  if (matches(bytes, 0, [0x89, 0x50, 0x4e, 0x47])) return "png";
  // RIFF....WEBP
  if (matches(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && matches(bytes, 8, [0x57, 0x45, 0x42, 0x50]))
    return "webp";
  if (matches(bytes, 0, [0x47, 0x49, 0x46])) return "gif";
  return "unknown";
}

function clampSize(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_SIZE;
  return Math.min(Math.round(n), MAX_SIZE);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const prompt = (sp.get("prompt") ?? "").trim().slice(0, MAX_PROMPT);
  if (!prompt) {
    return NextResponse.json({ error: "prompt 파라미터가 필요하다" }, { status: 400 });
  }

  const width = clampSize(sp.get("w"));
  const height = clampSize(sp.get("h"));
  // seed를 받아 두는 이유: 같은 편 안에서 컷별 스타일이 튀지 않게 고정하려면
  // 편 단위로 같은 seed를 쓰는 편이 낫다. 값이 없으면 Pollinations가 알아서 고른다.
  const seed = sp.get("seed");

  // 목적지 호스트는 코드에 박혀 있고 prompt는 경로 세그먼트로만 들어간다.
  // 외부 입력이 호스트를 바꿀 수 없는 형태다.
  const upstream = new URL(`${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}`);
  upstream.searchParams.set("width", String(width));
  upstream.searchParams.set("height", String(height));
  upstream.searchParams.set("nologo", "true");
  if (seed) upstream.searchParams.set("seed", seed);

  let res: Response;
  try {
    res = await fetch(upstream.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "이미지 생성 요청 실패", detail: String(e) },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "이미지 생성 응답 오류", status: res.status },
      { status: 502 }
    );
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  const detected = detectFormat(buf);
  const upstreamContentType = res.headers.get("content-type");

  if (sp.get("probe") === "1") {
    return NextResponse.json({
      upstreamContentType,
      detectedByMagicBytes: detected,
      bytes: buf.length,
      instagramReady: detected === "jpeg",
      note:
        detected === "jpeg"
          ? "인스타 게시 API가 요구하는 JPEG다. 별도 변환 없이 이 라우트를 그대로 쓰면 된다."
          : `JPEG가 아니라 ${detected}다. 변환 단계를 넣기 전에는 인스타 게시가 실패한다.`,
    });
  }

  if (detected !== "jpeg") {
    // 여기서 통과시키면 인스타 쪽에서 원인이 불분명한 실패로 돌아온다.
    // 어디서 왜 막혔는지 남기고 끊는 편이 낫다.
    return NextResponse.json(
      {
        error: "인스타 게시 API는 JPEG만 받는다",
        detectedByMagicBytes: detected,
        upstreamContentType,
        hint: "?probe=1 로 판정만 다시 확인한 뒤 변환 단계를 넣어라",
      },
      { status: 415 }
    );
  }

  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "image/jpeg",
      // Meta가 컨테이너를 만들 때 한 번, 실패해 재시도할 때 또 가져간다.
      // 그때 그림이 바뀌면 안 되므로 캐시를 길게 잡는다.
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
