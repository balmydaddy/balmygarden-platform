import { NextRequest, NextResponse } from "next/server";
import { internalHeaders, isInternalCall } from "@/lib/internalAuth";
import { isUnlocked } from "@/lib/unlockAuth";

/**
 * SCOUT(A-08) 뉴스 수집 라우트.
 * 네이버 검색 API로 키워드 기사를 모아 정규화해서 돌려준다.
 *
 * 인증 경로 2가지 중 설정된 쪽을 자동 선택:
 *  1) 네이버 개발자센터  — NAVER_CLIENT_ID / NAVER_CLIENT_SECRET
 *  2) NAVER Cloud API HUB — NCP_APIGW_API_KEY_ID / NCP_APIGW_API_KEY (+ NCP_SEARCH_ENDPOINT)
 */

const DEV_ENDPOINT = "https://openapi.naver.com/v1/search/news.json";
const NCP_ENDPOINT =
  process.env.NCP_SEARCH_ENDPOINT ?? "https://naverapihub.apigw.ntruss.com/search/v1/news";

/** SCOUT 상시 모니터링 키워드 — 3트랙 + CEO 본업(안전보건) + 전체 트렌드 */
export const SCOUT_PRESETS: Record<string, string[]> = {
  music: ["트로트 신곡", "음원 차트", "인디 음악 유통"],
  app: ["영수증 OCR", "경비처리 앱"],
  game: ["인디게임 출시", "턴제 RPG"],
  safety: ["중대재해처벌법", "ISO 45001", "산업안전보건"],
  trend: ["오늘 이슈", "화제의 뉴스", "AI 트렌드"],
};

/** preset → Notion Track 값. Track select 옵션명과 정확히 일치해야 한다. */
const PRESET_TRACK: Record<string, string> = {
  music: "음악",
  app: "영수증앱",
  game: "게임",
  safety: "안전관리",
  trend: "전체",
};

type NaverItem = {
  title?: string;
  originallink?: string;
  link?: string;
  description?: string;
  pubDate?: string;
};

export type NewsEntry = {
  title: string;
  link: string;
  summary: string;
  pubDate: string;
};

function resolveAuth():
  | { kind: "dev" | "ncp"; endpoint: string; headers: Record<string, string> }
  | null {
  const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, NCP_APIGW_API_KEY_ID, NCP_APIGW_API_KEY } =
    process.env;

  if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
    return {
      kind: "dev",
      endpoint: DEV_ENDPOINT,
      headers: {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      },
    };
  }
  if (NCP_APIGW_API_KEY_ID && NCP_APIGW_API_KEY) {
    return {
      kind: "ncp",
      endpoint: NCP_ENDPOINT,
      headers: {
        "X-NCP-APIGW-API-KEY-ID": NCP_APIGW_API_KEY_ID,
        "X-NCP-APIGW-API-KEY": NCP_APIGW_API_KEY,
      },
    };
  }
  return null;
}

/** 네이버 응답은 <b> 태그와 HTML 엔티티를 포함한다. 저장 전 반드시 정리. */
function clean(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

async function fetchNews(
  query: string,
  display: number,
  sort: "date" | "sim"
): Promise<NewsEntry[]> {
  const auth = resolveAuth();
  if (!auth) {
    throw new Error(
      "네이버 검색 API 키 미설정 — NAVER_CLIENT_ID/SECRET 또는 NCP_APIGW_API_KEY_ID/KEY 필요"
    );
  }

  const url = `${auth.endpoint}?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;
  const res = await fetch(url, { headers: auth.headers, cache: "no-store" });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`네이버 API ${res.status} (${auth.kind}) — ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { items?: NaverItem[] };
  return (data.items ?? []).map((it) => ({
    title: clean(it.title),
    link: it.originallink || it.link || "",
    summary: clean(it.description),
    pubDate: it.pubDate ?? "",
  }));
}

/** 같은 사건을 다룬 기사가 중복으로 쌓이는 걸 막는다 — 제목 앞부분 기준. */
function dedupe(entries: NewsEntry[]): NewsEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = e.title.replace(/\s/g, "").slice(0, 18);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* GET /api/naver-news?query=미드저니&display=10&sort=date
   GET /api/naver-news?preset=safety — SCOUT 프리셋 일괄 수집 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const preset = sp.get("preset");
  const query = sp.get("query");
  const display = Math.min(Math.max(Number(sp.get("display") ?? "10"), 1), 100);
  const sort = sp.get("sort") === "sim" ? "sim" : "date";

  const queries = preset ? SCOUT_PRESETS[preset] : query ? [query] : null;
  if (!queries) {
    return NextResponse.json(
      { error: `query 또는 preset 필요. preset 목록: ${Object.keys(SCOUT_PRESETS).join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const groups = await Promise.all(
      queries.map(async (q) => ({ query: q, entries: dedupe(await fetchNews(q, display, sort)) }))
    );
    return NextResponse.json({
      preset: preset ?? null,
      total: groups.reduce((n, g) => n + g.entries.length, 0),
      groups,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* POST /api/naver-news — 수집 후 Notion 브리핑 저장
   body: { preset?: string, query?: string, display?: number } */
export async function POST(req: NextRequest) {
  /* 이 POST는 수집 결과를 Notion에 자동 저장한다 — `/api/notion`을 직접
     막아도 여기가 열려 있으면 우회 쓰기 경로가 된다. 같은 기준으로 막는다.
     (GET은 저장 없이 조회만 하므로 그대로 둔다.) */
  if (!isInternalCall(req) && !isUnlocked(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { preset, query, display = 10 } = (await req.json()) as {
      preset?: string;
      query?: string;
      display?: number;
    };

    const queries = preset ? SCOUT_PRESETS[preset] : query ? [query] : null;
    if (!queries) {
      return NextResponse.json({ error: "query 또는 preset 필요" }, { status: 400 });
    }

    const groups = await Promise.all(
      queries.map(async (q) => ({
        query: q,
        entries: dedupe(await fetchNews(q, Math.min(Math.max(display, 1), 100), "date")),
      }))
    );

    const today = new Date().toISOString().slice(0, 10);
    const body = groups
      .map(
        (g) =>
          `[${g.query}]\n` +
          (g.entries.length
            ? g.entries.map((e) => `- ${e.title}\n  ${e.link}\n  ${e.summary}`).join("\n")
            : "- 신규 기사 없음")
      )
      .join("\n\n");

    const origin = req.nextUrl.origin;
    const saved = await fetch(`${origin}/api/notion`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...internalHeaders() },
      body: JSON.stringify({
        action: "save_log",
        payload: {
          source: "SCOUT",
          title: `뉴스 브리핑 ${today} — ${preset ?? query}`,
          content: body,
          businessTrack: preset ? PRESET_TRACK[preset] : "전체",
        },
      }),
    });

    const result = (await saved.json()) as { url?: string; error?: string };
    if (!saved.ok) {
      return NextResponse.json(
        { error: `Notion 저장 실패: ${result.error ?? saved.status}`, groups },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: result.url,
      total: groups.reduce((n, g) => n + g.entries.length, 0),
      groups,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
