# BALMYGARDEN Platform

AI 에이전시 대시보드 — 음악(BALMYDADDY) · 앱(영수증 OCR) · 게임(LOD) 3트랙 운영 본부.

이 저장소는 **에이전시 플랫폼 자체**(오피스 뷰·업무 자동화·워크플로·트레이딩 탭 등)만 담는다. 3트랙 각 제품은 아래처럼 독립 저장소로 분리되어 있다.

## 트랙별 저장소

| 트랙 | 저장소 | 배포 |
|---|---|---|
| 🏢 플랫폼 (이 저장소) | [balmygarden-platform](https://github.com/balmydaddy/balmygarden-platform) | balmygarden-platform.vercel.app |
| 📄 앱 — 영수증 OCR | [balmydaddy-receipt](https://github.com/balmydaddy/balmydaddy-receipt) | receipt-app.vercel.app |
| 🎮 게임 — Lord of Dark | [lord-of-dark](https://github.com/balmydaddy/lord-of-dark) (private) | — (Unity, 미배포) |
| 🎵 음악 — BALMYDADDY (GOSARI) | 이 저장소 내 `GOSARI_*.md` 문서로 관리 | — |

세 저장소는 코드·배포가 서로 완전히 독립적이다. 한쪽 작업이 다른 쪽 프로덕션 배포에 영향을 주지 않는다 — 과거 한 저장소 안에서 브랜치로만 나눠져 있던 시절 반복됐던 배포 대상 착오(엉뚱한 브랜치 재배포) 문제를 구조적으로 없애기 위한 분리다.

## 이 저장소 구성

```
src/app/
  agency/page.tsx     ← 메인 에이전시 대시보드
  api/agent/          ← Claude API 프록시
  api/notion/         ← Notion 자동 로깅
  api/naver-news/     ← SCOUT 뉴스 수집
  api/trading/        ← 트레이딩 서버 프록시
  api/cron/           ← 일일 자동화 배치 (SCOUT 수집 + 캐릭터 로테이션 업무)
```

운영 규칙·에이전트 역할·프로토콜 전체는 `CLAUDE.md` 참조. 진행 이력은 `MEMORY.md`, 개선 로드맵은 `AGENCY_ROADMAP.md`.
