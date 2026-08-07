import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "BALMYGARDEN",
  description: "BALMYGARDEN AI 에이전시 대시보드 — 음악·앱·게임 3트랙 운영",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8f9fa" }}>
        {children}
      </body>
    </html>
  );
}
