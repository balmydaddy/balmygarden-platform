/**
 * Instagram 그래프 API 게시 헬퍼 — 4컷 안전 웹툰(TOON-01)을 우리 계정 하나에
 * 올리기 위한 최소 구현.
 *
 * 왜 앱 심사가 없나:
 *   Advanced Access(= 앱 심사 + Business Verification)는 "내가 소유하지 않은
 *   계정에 서비스할 때" 필요하다. 우리는 우리 계정 한 개에만 올리므로
 *   Standard Access로 충분하고, 계정을 앱의 Instagram Tester로 등록해 초대를
 *   수락하면 개발 모드 그대로 발행된다. 그래서 사업자등록·비즈니스 인증이
 *   이 경로의 선행조건이 아니다.
 *
 * 필요 환경변수:
 *  - IG_USER_ID       : Instagram 프로페셔널 계정의 IG User ID (숫자)
 *  - IG_ACCESS_TOKEN  : 장기 액세스 토큰
 *  - IG_API_VERSION   : 선택. 기본 v23.0 — 그래프 API 버전은 주기적으로 바뀌므로
 *                       env로 덮을 수 있게 둔다(기본값은 미검증).
 *
 * 한계: 이 저장소의 클라우드 세션은 egress 프록시가 graph.facebook.com을 막고
 * 있어 여기서 실호출 검증을 못 했다. 실제 호출은 Vercel에서 돈다.
 */

const GRAPH_BASE = "https://graph.facebook.com";

/** 컨테이너가 처리될 때까지 기다리는 상한 — 초과하면 발행하지 않고 실패시킨다. */
const CONTAINER_TIMEOUT_MS = 60_000;
const CONTAINER_POLL_MS = 3_000;

function apiVersion(): string {
  return process.env.IG_API_VERSION || "v23.0";
}

function credentials(): { igUserId: string; accessToken: string } {
  const igUserId = process.env.IG_USER_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    throw new Error("Instagram 환경변수 미설정 — IG_USER_ID/IG_ACCESS_TOKEN 필요");
  }
  return { igUserId, accessToken };
}

async function graph(
  path: string,
  params: Record<string, string>,
  method: "GET" | "POST" = "GET"
): Promise<Record<string, unknown>> {
  const url = new URL(`${GRAPH_BASE}/${apiVersion()}/${path}`);
  let body: URLSearchParams | undefined;
  if (method === "GET") {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  } else {
    body = new URLSearchParams(params);
  }
  const res = await fetch(url.toString(), {
    method,
    body,
    headers: method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    // 토큰이 본문에 섞여 나가지 않도록 응답만 담는다.
    throw new Error(`Instagram API 실패 (${path}): ${JSON.stringify(data)}`);
  }
  return data;
}

/**
 * 컨테이너는 만들자마자 발행할 수 없다. Meta가 이미지를 가져와 처리하는 동안
 * IN_PROGRESS 상태이고, 그때 발행하면 실패한다. FINISHED가 될 때까지 기다린다.
 */
async function waitForContainer(containerId: string, accessToken: string): Promise<void> {
  const deadline = Date.now() + CONTAINER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const data = await graph(containerId, {
      fields: "status_code,status",
      access_token: accessToken,
    });
    const status = data.status_code as string | undefined;
    if (status === "FINISHED") return;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Instagram 컨테이너 처리 실패 (${status}): ${JSON.stringify(data.status ?? {})}`);
    }
    await new Promise((r) => setTimeout(r, CONTAINER_POLL_MS));
  }
  throw new Error(`Instagram 컨테이너가 ${CONTAINER_TIMEOUT_MS / 1000}초 안에 준비되지 않았다 (${containerId})`);
}

/** 자격증명 진단용 — 아무것도 올리지 않고 계정 정보만 조회한다. */
export async function getAccountInfo(): Promise<{
  id: string;
  username: string;
  accountType?: string;
  mediaCount?: number;
}> {
  const { igUserId, accessToken } = credentials();
  const data = await graph(igUserId, {
    fields: "id,username,account_type,media_count",
    access_token: accessToken,
  });
  return {
    id: String(data.id),
    username: String(data.username),
    accountType: data.account_type as string | undefined,
    mediaCount: data.media_count as number | undefined,
  };
}

/**
 * 24시간 이동 기준 게시 한도 사용량. 상한은 100건이고 캐러셀 1편은 1건으로
 * 계산된다 — 매일 1편이면 한도가 문제될 일은 없지만, 재시도 루프가 잘못
 * 돌았을 때 이 값이 먼저 알려준다.
 */
export async function getPublishingLimit(): Promise<{ used: number; cap: number }> {
  const { igUserId, accessToken } = credentials();
  const data = await graph(`${igUserId}/content_publishing_limit`, {
    fields: "config,quota_usage",
    access_token: accessToken,
  });
  const row = (data.data as Array<Record<string, unknown>> | undefined)?.[0] ?? {};
  const config = (row.config as Record<string, unknown> | undefined) ?? {};
  return {
    used: Number(row.quota_usage ?? 0),
    cap: Number(config.quota_total ?? 100),
  };
}

/**
 * 이미지 1장 게시. imageUrl은 Meta 서버가 직접 가져가므로 공개 URL이어야 하고
 * JPEG여야 한다 — 그래서 Pollinations 원본을 그대로 넘기지 않고 /api/toon-image
 * 프록시를 거친다(포맷 보장 + 우리 도메인 고정).
 */
export async function publishSingle(imageUrl: string, caption: string): Promise<string> {
  const { igUserId, accessToken } = credentials();
  const container = await graph(
    `${igUserId}/media`,
    { image_url: imageUrl, caption, access_token: accessToken },
    "POST"
  );
  const containerId = String(container.id);
  await waitForContainer(containerId, accessToken);
  const published = await graph(
    `${igUserId}/media_publish`,
    { creation_id: containerId, access_token: accessToken },
    "POST"
  );
  return String(published.id);
}

/**
 * 캐러셀 게시 — 4컷 웹툰의 기본 형태다.
 *
 * 주의: 캐러셀은 모든 장이 첫 장의 비율에 맞춰 잘린다. 그래서 컷을 만들 때
 * 전부 같은 비율(TOON-01은 1:1)로 뽑아야 하고, 여기서도 섞여 들어오는지는
 * 검사하지 않는다 — 생성 단계에서 고정하는 것이 맞다.
 */
export async function publishCarousel(imageUrls: string[], caption: string): Promise<string> {
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error(`캐러셀은 2~10장이어야 한다 (받은 값: ${imageUrls.length}장)`);
  }
  const { igUserId, accessToken } = credentials();

  const childIds: string[] = [];
  for (const imageUrl of imageUrls) {
    const child = await graph(
      `${igUserId}/media`,
      { image_url: imageUrl, is_carousel_item: "true", access_token: accessToken },
      "POST"
    );
    const childId = String(child.id);
    await waitForContainer(childId, accessToken);
    childIds.push(childId);
  }

  const parent = await graph(
    `${igUserId}/media`,
    {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption,
      access_token: accessToken,
    },
    "POST"
  );
  const parentId = String(parent.id);
  await waitForContainer(parentId, accessToken);

  const published = await graph(
    `${igUserId}/media_publish`,
    { creation_id: parentId, access_token: accessToken },
    "POST"
  );
  return String(published.id);
}
