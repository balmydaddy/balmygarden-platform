import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/** 잠금해제 쿠키 이름 — 이 값을 읽는 쪽(api/notion·api/trading)과 공유한다. */
export const UNLOCK_COOKIE = "bg_unlocked";

/** 쿠키 유효기간(초). 토큰 자체에 만료를 넣어 쿠키를 지워도 서버가 판정한다. */
export const UNLOCK_MAX_AGE = 60 * 60 * 24 * 30;

/* 쿠키에 비밀번호 원문을 그대로 넣던 것을 서명 토큰으로 바꾼다. 원문 방식은
   Vercel 요청 로그·프록시·브라우저 확장 어디에 남아도 그 값 자체가 비밀번호라
   한 번 새면 끝이었다. 토큰은 만료 시각에 HMAC 서명만 붙인 형태라 새어도
   기한이 지나면 못 쓰고, 비밀번호를 바꾸면 기존 토큰이 전부 무효가 된다. */
const VERSION = "v1";

function sign(secret: string, exp: number): string {
  return createHmac("sha256", secret).update(`${VERSION}:${exp}`).digest("hex");
}

/** 만료 시각과 서명을 붙인 쿠키 값을 만든다. `nowMs`는 테스트용 주입점. */
export function issueToken(secret: string, nowMs: number = Date.now()): string {
  const exp = Math.floor(nowMs / 1000) + UNLOCK_MAX_AGE;
  return `${VERSION}.${exp}.${sign(secret, exp)}`;
}

/** 서명·만료를 서버에서만 검증한다. 형식이 조금이라도 어긋나면 실패. */
export function verifyToken(
  token: string | undefined,
  secret: string,
  nowMs: number = Date.now()
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) return false;

  /* Number()는 " 123"·"0x1f"·"1e20"까지 받아들여서 같은 exp에 여러 토큰
     문자열이 대응한다. 서명이 있어 악용은 못 하지만 형식은 하나로 고정한다. */
  if (!/^\d+$/.test(parts[1])) return false;
  const exp = Number(parts[1]);
  if (!Number.isSafeInteger(exp) || exp * 1000 <= nowMs) return false;

  /* timingSafeEqual은 버퍼 "바이트" 길이가 다르면 예외를 던진다. 문자 길이만
     비교하면 비ASCII 64자 서명이 검사를 통과해 예외로 500이 난다(쿠키는
     퍼센트 인코딩으로 들어올 수 있어 실제로 도달 가능하다) — 16진수 형식을
     먼저 확정해 버퍼 길이가 어긋날 여지 자체를 없앤다. */
  const expected = sign(secret, exp);
  if (!/^[0-9a-f]+$/.test(parts[2]) || parts[2].length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(parts[2], "hex"), Buffer.from(expected, "hex"));
}

/** 요청이 CEO 잠금해제 상태인지. 비밀번호 환경변수가 없으면 항상 false. */
export function isUnlocked(req: NextRequest): boolean {
  const secret = process.env.DASHBOARD_UNLOCK_PASSWORD;
  if (!secret) return false;
  /* 인증 판정이 예외를 던지면 그건 401이 아니라 500이 된다 — 잘못된 쿠키
     하나로 API가 통째로 죽는 셈이라, 어떤 이유든 실패는 "잠김"으로 수렴시킨다. */
  try {
    return verifyToken(req.cookies.get(UNLOCK_COOKIE)?.value, secret);
  } catch {
    return false;
  }
}
