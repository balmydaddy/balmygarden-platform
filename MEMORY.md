# BALMYGARDEN Agency — MEMORY

> 실수 기억 파일. Claude Code가 반복 오류를 피하고 기준을 유지하기 위한 영구 메모리.
> 수정 시 `page.tsx`의 `MEMORY` 배열과 동기화 필요.

---

## 핵심 메모리 (20개 항목)

| ID | 태그 | 내용 |
|----|------|------|
| M-01 | 기업 | BALMYGARDEN = BALMYDADDY 전속 음반사. 심포닉/클래시컬 메탈, 다크판타지, 복음 발라드. |
| M-02 | 앱 | 영수증 OCR: Next.js 14 / Supabase / Gemini API / Vercel / Resend. 사전 테스팅 단계. |
| M-03 | 게임 | LOD (Lord of Dynasty): React 다크판타지 턴제 RPG 리마스터. 프로토타입 완성. |
| M-04 | CEO | 김태을 대표. 파라텍 안전보건팀 과장. 모바일 낮 / PC 23시 이후. |
| M-05 | QA | 전 결과물 QA 95/100 통과 후 CEO 보고. AEGIS → CONDUCTOR 최종 확인. |
| M-06 | 크레딧 | Higgsfield 월 크레딧 = LOD 게임 아트 전용. CEO 승인 전 타 용도 절대 금지. |
| M-07 | Fugu | 에이전트 배정 시 이유 공개 필수. 블랙박스 금지 (CONDUCTOR 핵심). |
| M-08 | 배급 | DistroKid 음원 배급. 아티스트: BALMYDADDY, JEDMIR, DUBUREN. |
| M-09 | 스택 | GitHub: balmydaddy/lord-of-dark. CI/CD: Harness.io → Vercel. Obsidian: D:\obsidian\obsidian. |
| M-10 | 소스 | 모니터링: @parky0ngnam, @_business.story, @shoppduddn_, @platformtree_, trenddalkak_ai, keanu_visuals. |
| M-11 | 학습 | v3.0 탑재: 파인만·오류시뮬·번역기·경로설계·빈틈탐지·곡선파괴 6종. |
| M-12 | 마케팅 | v3.0 탑재: 고객조사·이메일·광고카피·포지셔닝·상세페이지·크리에이터·영상스크립트 7종. |
| M-13 | 콘텐츠 | 훅 20개 + How-To·팁·스토리텔링 각 10개 탑재. MUSE/NOVA 우선 활용. |
| M-14 | 안전 | ISO 45001/14001, 중대재해처벌법, 산업안전기사 준비 중. 파라텍 20개 현장. |
| M-15 | 버전 | Dashboard v3.2 (2026.06.27). 신규: MUSIC OS v1.0 + GOSARI 프로젝트 탭 + 예약 탭 + 자동 Notion 저장. |
| M-16 | 12단계 | @platformtree_ 사업 성장 사다리. BG 현황: 음악=2단계(기술판매), 앱/게임=3단계(제품판매). |
| M-17 | MUSIC OS | BALMY MUSIC OS v1.0 파이프라인 12단계. 담당: SAGE→LYRA→MUSE→STROBE→NOVA→REX. |
| M-18 | GOSARI | PROJECT GOSARI EP 6트랙. 테마: 시간. 효도송 아님. 장면 우선, 진심 우선. |
| M-19 | 제작규칙 | MUSIC OS 절대 규칙: 가사 먼저 쓰지 않는다. SAGE 없이 LYRA 단독 작성 금지. |
| M-20 | QG | Quality Gate 12단계 × 8항목(감정전달력·기억성·독창성·스토리·상업성·가창성·제작성·브랜딩). 전항목 90+ = PASS. FAIL 시 담당 에이전트 개선 루프. |
| M-21 | v4.0 | MUSIC OS v4.0 = "AI 크리에이티브 스튜디오". QG탭→STUDIO탭(채점/리뷰/PM/토론 4서브탭). GOSARI 파이프라인 12→14단계. |
| M-22 | Creative | Creative Bible + Style Guide 확정 필수. SAGE+CEO 서명 전 LYRA 작성 불가. MUSIC OS 절대 순서: OS검증→Bible승인→컨셉→세계관→트랙→시나리오→가사→Suno→음원선택→비주얼→MV→발매패키지→마케팅→발매아카이브. |
| M-23 | Review | Production Memory = PM-001 형식. 성공 패턴 90점+ 사례만 저장. 다음 트랙 재사용 기준. |
| M-24 | Conflict | Creative Conflict: 에이전트 병렬 토론 → CONDUCTOR 결정 → DecisionLog 자동 기록 → CEO Approval Gate (이중 승인). |
| M-25 | GOSARI | GOSARI Creative Bible: 장르=Modern Emotional Trot. North Star="눈물을 강요하지 말고, 기억을 깨워라." QG 97.25 PASS. |
| M-26 | GOSARI | Core Emotion 순서: 공감→미소→회상→먹먹함→감사→희망. 먹먹함=결과, 감사=목적. 필수요소: 손·사진·집·밥·전화·시간·아이·부모·일상. |
| M-27 | GOSARI | 현재 진행 상태: 컨셉PASS·세계관90%·감정흐름PASS·Creative Bible Draft v0.1. 다음 = STEP 5 Track 1 Scene Board (SAGE 담당). |

---

## 반복 실수 기록 (Mistake Log)

| 날짜 | 실수 | 원인 | 방지책 |
|------|------|------|--------|
| 2026.06 | JSX Fragment 미닫힘 오류 | `<>...</>` 여는 태그 쓰고 닫는 태그 누락 | 탭 전환 UI 작성 시 Fragment 쌍 확인 필수 |
| 2026.06 | `databases.query` 타입 오류 | @notionhq/client v5.22.0 MCP 버전 타입 불일치 | `(notion.databases as any).query()` 사용 |
| 2026.06 | git stash pop 충돌 | 브랜치 구조 불일치 (monorepo vs old-structure) | 브랜치 전환 전 항상 `git status` 확인 |

---

## 예약 루틴 (Schedule Routines)

| 시간 | 에이전트 | 업무 | 워크플로우 |
|------|---------|------|----------|
| 매일 07:00 | SCOUT | Higgsfield 크레딧 체크 | 직접 대화 |
| 매일 08:00 | REX | 3트랙 우선순위 정리 | 직접 대화 |
| 매주 월 09:00 | CONDUCTOR | 주간 에이전트 배분 | weekly |
| 매주 금 17:00 | REX·SCOUT | 주간 성과 보고 | weekly |
| 발매 D-30 | STROBE·MUSE | GOSARI 앨범아트 확정 | gosari_visual |
| 발매 D-14 | LYRA·MUSE | Suno 버전 생성·선택 | music_suno_prompt |
| 발매 D-7 | NOVA·STROBE | SNS 티저 콘텐츠 | gosari_release |
| 매월 1일 | SCOUT | AI 크레딧 현황 점검 | 직접 대화 |
| 분기 말 | AEGIS·REX | 법무 리스크 검토 | legal |

---

_Last updated: 2026.06.29 — Dashboard v4.0_
