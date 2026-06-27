import { NextRequest, NextResponse } from "next/server";

const SLACK_API = "https://slack.com/api";

function getToken() {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN 환경변수가 설정되지 않았습니다.");
  return token;
}

/* GET /api/slack — 설정 상태 확인 */
export async function GET() {
  const configured = !!process.env.SLACK_BOT_TOKEN;
  if (!configured) {
    return NextResponse.json({
      configured: false,
      guide: [
        "1. https://api.slack.com/apps 에서 앱 생성",
        "2. OAuth & Permissions → Bot Token Scopes: chat:write, channels:read",
        "3. 앱을 워크스페이스에 설치 → Bot User OAuth Token 복사",
        "4. .env.local 에 SLACK_BOT_TOKEN=xoxb-... 추가",
        "5. SLACK_CHANNEL_ID=C... 추가 (채널 ID)",
      ],
    });
  }

  // 연결 확인
  try {
    const res = await fetch(`${SLACK_API}/auth.test`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json() as { ok: boolean; team?: string; user?: string };
    return NextResponse.json({ configured: true, team: data.team, bot: data.user });
  } catch (e: unknown) {
    return NextResponse.json({ configured: true, error: (e as Error).message });
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.SLACK_BOT_TOKEN) {
    return NextResponse.json({ error: "SLACK_BOT_TOKEN 미설정", setup: true }, { status: 500 });
  }
  try {
    const { action, payload } = await req.json();
    const token = getToken();
    const defaultChannel = process.env.SLACK_CHANNEL_ID ?? "";

    /* ── notify: 워크플로우 완료 알림 ── */
    if (action === "notify") {
      const { workflowName, input, agentCount, success, channel } = payload as {
        workflowName: string;
        input: string;
        agentCount: number;
        success: boolean;
        channel?: string;
      };

      const ch = channel ?? defaultChannel;
      if (!ch) return NextResponse.json({ error: "채널 ID 미설정 (SLACK_CHANNEL_ID)" }, { status: 400 });

      const text = [
        `${success ? "✅" : "❌"} *[BALMYGARDEN Agency]* 워크플로우 완료`,
        `> *워크플로우:* ${workflowName}`,
        `> *에이전트:* ${agentCount}개 완료`,
        `> *요청:* ${input.slice(0, 100)}${input.length > 100 ? "..." : ""}`,
      ].join("\n");

      const res = await fetch(`${SLACK_API}/chat.postMessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: ch, text, mrkdwn: true }),
      });
      const data = await res.json() as { ok: boolean; ts?: string; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Slack 전송 실패");
      return NextResponse.json({ ts: data.ts });
    }

    /* ── send: 직접 메시지 전송 ── */
    if (action === "send") {
      const { text, channel, blocks } = payload as {
        text: string;
        channel?: string;
        blocks?: unknown[];
      };
      const ch = channel ?? defaultChannel;
      if (!ch) return NextResponse.json({ error: "채널 ID 미설정" }, { status: 400 });

      const res = await fetch(`${SLACK_API}/chat.postMessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: ch, text, blocks, mrkdwn: true }),
      });
      const data = await res.json() as { ok: boolean; ts?: string; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Slack 전송 실패");
      return NextResponse.json({ ts: data.ts });
    }

    /* ── list_channels: 채널 목록 ── */
    if (action === "list_channels") {
      const res = await fetch(`${SLACK_API}/conversations.list?limit=20&exclude_archived=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { ok: boolean; channels?: { id: string; name: string }[] };
      return NextResponse.json({ channels: data.channels ?? [] });
    }

    return NextResponse.json({ error: "알 수 없는 action" }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
