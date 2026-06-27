import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다.");
  const creds = JSON.parse(json);
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
    ],
  });
}

/* GET /api/gdrive?limit=10&folderId=xxx — 최근 파일 목록 */
export async function GET(req: NextRequest) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_JSON 미설정", setup: true }, { status: 500 });
  }
  try {
    const drive = google.drive({ version: "v3", auth: getAuth() });
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "15"), 50);
    const folderId = req.nextUrl.searchParams.get("folderId");

    const q = folderId
      ? `'${folderId}' in parents and trashed=false`
      : "trashed=false";

    const res = await drive.files.list({
      q,
      pageSize: limit,
      orderBy: "modifiedTime desc",
      fields: "files(id,name,mimeType,modifiedTime,webViewLink,size)",
    });
    return NextResponse.json({ files: res.data.files ?? [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_JSON 미설정", setup: true }, { status: 500 });
  }
  try {
    const { action, payload } = await req.json();
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    /* ── save_doc: 워크플로우 결과 → Google Drive 텍스트 파일 ── */
    if (action === "save_doc") {
      const { title, content, folderId } = payload as {
        title: string;
        content: string;
        folderId?: string;
      };

      const metadata: Record<string, unknown> = {
        name: title,
        mimeType: "application/vnd.google-apps.document",
      };
      if (folderId) metadata.parents = [folderId];

      const bodyStream = Readable.from([Buffer.from(content, "utf-8")]);

      const file = await drive.files.create({
        requestBody: metadata,
        media: {
          mimeType: "text/plain",
          body: bodyStream,
        },
        fields: "id,webViewLink,name",
      });

      return NextResponse.json({
        id: file.data.id,
        url: file.data.webViewLink ?? `https://docs.google.com/document/d/${file.data.id}`,
        name: file.data.name,
      });
    }

    /* ── read_file: Drive 파일 → 텍스트 추출 (에이전트 컨텍스트용) ── */
    if (action === "read_file") {
      const { fileId, mimeType } = payload as { fileId: string; mimeType?: string };

      let text = "";

      if (!mimeType || mimeType === "application/vnd.google-apps.document") {
        // Google Docs → plain text export
        const res = await drive.files.export(
          { fileId, mimeType: "text/plain" },
          { responseType: "text" }
        );
        text = typeof res.data === "string" ? res.data : String(res.data);
      } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
        const res = await drive.files.export(
          { fileId, mimeType: "text/csv" },
          { responseType: "text" }
        );
        text = typeof res.data === "string" ? res.data : String(res.data);
      } else {
        // Binary / plain text files
        const res = await drive.files.get(
          { fileId, alt: "media" },
          { responseType: "text" }
        );
        text = typeof res.data === "string" ? res.data : String(res.data);
      }

      return NextResponse.json({ text: text.slice(0, 8000) }); // 8000자 제한
    }

    /* ── list_folder: 특정 폴더 파일 목록 ── */
    if (action === "list_folder") {
      const { folderId } = payload as { folderId: string };
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: 20,
        orderBy: "modifiedTime desc",
        fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
      });
      return NextResponse.json({ files: res.data.files ?? [] });
    }

    return NextResponse.json({ error: "알 수 없는 action" }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
