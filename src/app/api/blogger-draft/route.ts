import { NextRequest, NextResponse } from "next/server";
import { isInternalCall } from "@/lib/internalAuth";
import { isUnlocked } from "@/lib/unlockAuth";
import { syncBloggerDrafts } from "@/lib/bloggerDrafts";

/**
 * Notion "Blogger 초안 대기열" → Blogger 초안을 지금 바로 한 번 돌린다.
 * 매일 cron이 같은 일을 하므로, 이 라우트는 다음 날까지 기다리기 싫을 때 CEO가
 * 잠금 해제된 브라우저에서 주소를 여는 용도다. 발행은 하지 않는다.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isInternalCall(req) && !isUnlocked(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const results = await syncBloggerDrafts();
    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
