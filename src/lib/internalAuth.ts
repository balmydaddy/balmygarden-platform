import { createHash, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/**
 * 서버 내부 호출(cron → naver-news → notion) 식별용 헤더.
 *
 * 쓰기 라우트를 잠금 쿠키로만 막으면 자동화가 통째로 죽는다 — cron은
 * 브라우저가 아니라 서버에서 자기 자신을 부르는 구조라 쿠키가 없다.
 * 그렇다고 열어두면 누구나 CEO 워크스페이스에 쓸 수 있다. 그래서
 * "사람(쿠키) 또는 내부 호출(이 헤더)" 두 경로만 통과시킨다.
 *
 * 토큰은 CRON_SECRET을 재사용한다. 새 환경변수를 만들면 등록 전까지
 * 자동화가 조용히 죽는데, CRON_SECRET은 `/api/cron`이 이미 하드 요구
 * (미설정 시 401)라 프로덕션에 반드시 설정돼 있는 값이다.
 */
export const INTERNAL_HEADER = "x-bg-internal";

/** 내부 호출 시 붙일 헤더. 토큰이 없으면 빈 객체(=붙이지 않음)를 준다. */
export function internalHeaders(): Record<string, string> {
  const token = process.env.CRON_SECRET;
  return token ? { [INTERNAL_HEADER]: token } : {};
}

/** 이 요청이 서버 내부 호출인지. CRON_SECRET 미설정이면 항상 false. */
export function isInternalCall(req: NextRequest): boolean {
  const token = process.env.CRON_SECRET;
  if (!token) return false;
  const got = req.headers.get(INTERNAL_HEADER);
  if (!got) return false;
  /* 길이가 다르면 timingSafeEqual이 예외를 던진다. 해시를 비교하면 길이가
     항상 같아져서 길이 자체가 정보로 새지도 않는다. */
  return timingSafeEqual(
    createHash("sha256").update(got).digest(),
    createHash("sha256").update(token).digest()
  );
}
