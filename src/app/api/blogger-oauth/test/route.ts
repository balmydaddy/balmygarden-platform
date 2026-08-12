import { NextResponse } from "next/server";
import { getBlogInfo } from "@/lib/blogger";

/**
 * Blogger 연동 진단용 — 실제로 글을 올리지 않고 자격증명(Client ID/Secret/
 * Refresh Token)이 살아있는지, 대상 블로그를 정상 조회할 수 있는지만 확인한다.
 */
export async function GET() {
  try {
    const info = await getBlogInfo();
    return NextResponse.json({ ok: true, blog: info });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
