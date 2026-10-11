# 트레이딩 연동 — 중단 (기록 보관)

> 2026-10-11 CEO 지시: "기록은 남기고 구동되지 않게."
> 이 폴더의 파일은 중단 시점 원본 그대로다. 플랫폼은 이 폴더를 읽지 않는다.

## 구동되지 않는 이유

| 경로 | 막힌 방식 |
|---|---|
| 트레이딩 탭 | `page.tsx`에서 import·렌더 제거. 위키 탭 목록에도 없다 |
| 홈 화면 트레이딩 카드 | `HomeTab.tsx`에서 카드와 `/api/trading` 호출 제거 |
| `/api/trading` | 라우트 파일이 `src/app` 밖으로 나와 Next.js가 라우트로 만들지 않는다 |
| 빌드·타입체크 | `tsconfig.json` `exclude`에 `archive` 추가 |
| PC 자동실행 | 스크립트는 여기 보관만 한다. 이미 PC에 등록된 작업(`BalmyGarden_TradingServer`)은 저장소와 무관하게 남으므로 작업 스케줄러에서 "사용 안 함"으로 꺼야 한다 |

## 원래 위치

| 보관 위치 | 원래 위치 |
|---|---|
| `src/app/agency/TradingTab.tsx` | `src/app/agency/TradingTab.tsx` |
| `src/app/api/trading/route.ts` | `src/app/api/trading/route.ts` |
| `tools/trading-autostart*.{ps1,bat}` | `tools/` |
| `SETUP_TRADING_TUNNEL.md` | 저장소 루트 |

터널 설정 절차 일부는 루트 `SETUP_NAVER_TUNNEL.md` 2·3절에 "중단 — 기록용"으로 남아 있다.
이력은 `MEMORY.md` M-74·M-85·M-87~M-89·M-101, 현재 상태는 M-104.

## 이 중단이 건드리지 않는 것

- CEO PC의 매매 엔진(`main.py`·`server.py`) — 플랫폼 밖에서 돈다. 멈추려면 PC에서 직접 끈다.
- Vercel 환경변수 `TRADING_SERVER_URL` — 읽는 코드가 없어 효과가 없다. 지우는 것은 CEO 판단.
