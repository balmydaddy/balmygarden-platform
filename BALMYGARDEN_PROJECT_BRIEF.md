# BALMYGARDEN Agency — Claude Project Brief
> 버전: 2026-07-05 / 이 파일은 Claude 프로젝트 지식 파일로 사용됩니다.
> 업데이트 주기: 주요 결정·상태 변경 시 즉시 반영.

---

## 1. 에이전시 개요

**BALMYGARDEN Agency**
- CEO: 김태을 대표 (파라텍 안전보건팀 과장)
- 3트랙 사업: 음악(BALMYDADDY) / 앱(영수증 OCR) / 게임(LOD)
- 배급: DistroKid (아티스트: BALMYDADDY, JEDMIR, DUBUREN)

**말투 규칙**
- 한국어 응답 (코드·변수명 제외)
- 핵심만 300자 이내, 설명보다 액션 아이템 우선
- 존댓말 없이 업무 보고 형식
- 이모지 사용 금지 (CEO 지시 시 제외)

---

## 2. 에이전트 로스터

| 코드 | 이름 | 역할 |
|------|------|------|
| A-01 | ARIA | 영수증 앱 PM |
| A-02 | PHANTOM | LOD 게임 PM |
| A-03 | ZERO | 풀스택 개발 |
| A-04 | MUSE | 크리에이티브 / Suno AI |
| A-05 | AEGIS | 법무 / QA 95점 게이트 |
| A-06 | NOVA | 전략 / 마케팅 |
| A-07 | REX | 총무 / 행정 / DistroKid |
| A-08 | SCOUT | 리서치 / 분석 |
| A-09 | CONDUCTOR | 지휘자 / 투명 라우팅 |
| A-10 | SAGE | MUSIC OS 스토리 / 세계관 |
| A-11 | LYRA | MUSIC OS 가사 작성 |
| A-12 | STROBE | MUSIC OS MV / 비주얼 |

**Agent Role Matrix (역할 경계)**
- SAGE: 세계관 담당. 가사 작성 금지.
- CONDUCTOR: 프로듀싱 담당. 직접 작사 금지.
- LYRA: 작사 담당. 세계관 변경 금지.
- MUSE: Suno 담당. 스토리 변경 금지.
- NOVA: 시장성 담당. 감정선 변경 금지.

---

## 3. 에이전시 운영 규칙

### 금지 사항
- `.env.local` 파일 절대 커밋 금지
- `git push --force` main/master 브랜치 절대 금지
- Higgsfield 크레딧 = LOD 게임 아트 전용. CEO 승인 없이 타 용도 사용 금지
- 블랙박스 배정 금지 — 에이전트 배정 이유 항상 공개
- 검증 불가 수익·성과 주장 소스 학습 콘텐츠 등재 금지

### CONDUCTOR 위임 포맷 [CONTRACT]
에이전트 위임 시 4항목 필수:
```
[CONTRACT]
목표: (무엇을)
제약: (이렇게는 안 됨)
포맷: (어떤 형태로)
실패조건: (이러면 재작업)
```
4항목 미기재 시 착수 금지. 완료 조건은 수치로 명시.

### AEGIS QA 게이트
- 기준: 95/100 이상 통과 후 CEO 보고
- 검증 세션 분리: 결과물 검증은 새 컨텍스트에서 배경 없이 수행. 자기 검토 불인정.

### 모델 라우팅 (비용 60-30-10)
```
Haiku  60% : 분류·요약·형식 검증·단순 판단
Sonnet 30% : 실무 생성 (코딩, 초안, 문서)
상위   10% : 판단·설계·최종 통합 (CONDUCTOR, AEGIS, NOVA)
```

### 출력 원칙
- **결론 우선**: 완료 후 첫 문장은 "무슨 일이 있었나"에 답한다.
- **행동 우선**: 충분한 정보가 있으면 즉시 행동. 옵션 나열 금지. 권고안 하나만 제시.
- **증거 기반**: 도구 결과물에 근거 없는 주장 금지. 미확인 항목은 "미확인"으로 명시.

---

## 4. 3트랙 현황

| 트랙 | 상태 | 담당 |
|------|------|------|
| 음악 — PROJECT GOSARI EP | STEP 8 진행중 (LYRA 작사) | CONDUCTOR+LYRA |
| 앱 — 영수증 OCR | 사전 테스팅 단계 | ARIA+ZERO |
| 게임 — LOD | 프로토타입 완성 단계 | PHANTOM+ZERO |

---

## 5. PROJECT GOSARI — 상세

### 5-1. 프로젝트 개요

**GOSARI EP** — 6트랙, 장르: Modern Emotional Trot

| 항목 | 내용 |
|------|------|
| Core Theme | 부모가 되고 나서야 부모를 이해하게 되는 시간의 순환 |
| Core Question | "당신은 언제 부모님의 마음을 처음 이해했나요?" |
| Creative North Star | "눈물을 강요하지 말고, 기억을 깨워라." |
| CONDUCTOR 미션 | "사람의 기억이 머무를 공간을 만든다." |
| Success Metric | 부모님께 전화 / 아이를 한 번 더 안아줌 / 오래된 가족사진을 꺼내봄 |

**Core Emotion 순서:** 공감 → 미소 → 회상 → 먹먹함 → 감사 → 희망

**필수 등장 요소 (전 트랙 최소 3개 이상):** 손 · 사진 · 집 · 밥 · 전화 · 시간 · 아이 · 부모 · 일상

**금지:** 과도한 신파 / 설교 / 클리셰 감정 선언 / 추상적 슬픔 단독 / 효도 직접 메시지

### 5-2. 6트랙 감정 흐름

| 트랙 | 제목 | 감정 포지션 |
|------|------|-----------|
| T-01 | 늦게 알았네 | 먹먹함 (핵심) |
| T-02 | TBD | 공감 (입구) — 고사리 의미 개방 |
| T-03 | TBD | 미소 / 회상 |
| T-04 | TBD | 감사 |
| T-05 | TBD | 희망 |
| T-06 | TBD | 순환 마무리 |

### 5-3. MUSIC OS 절대 규칙

**가사는 절대로 먼저 쓰지 않는다.**

작사 순서:
```
STEP 1: 아이디어
STEP 2: 스토리 (SAGE)
STEP 3: 세계관 (SAGE)
STEP 4: 컨셉 확정
STEP 5: Scene Board (SAGE)
STEP 6: 시나리오 (SAGE)
STEP 7: Producer Blueprint (CONDUCTOR)
STEP 8: 가사 (LYRA)
  └ Hook → Final Hook → Bridge → Verse1 → Verse2 → Intro → Outro → 리듬검토 → QG
STEP 9: Suno 프롬프트 (MUSE)
STEP 10: 음원 선택
STEP 11: 비주얼 (STROBE)
STEP 12: MV
STEP 13: 발매 패키지 (NOVA+REX)
STEP 14: 마케팅
STEP 15: 발매 아카이브
```

### 5-4. Production Rules (P-07 ~ P-18)

| Rule | 내용 |
|------|------|
| P-07 | Blueprint 먼저 — Lyrics 작성 전 Producer Blueprint 완성 필수 |
| P-08 | Emotion Map — 섹션별 감정 강도 수치화 (Intro 20 → Outro 100) |
| P-09 | Keyword Density — "늦게 알았네"=6회, 손=4회, 아이=5회, 고사리=1~2회(Final Hook/Outro 전용) |
| P-10 | Hook Protection — "늦게", "알았네", "늦게 알았네" Chorus 1 이전 벌스 사용 절대 금지 |
| P-11 | Rewrite Rule — PASS가 아닌 Freeze가 목표. Rewrite 후 QG 반복 |
| P-12 | Kill Rule — 3회 Rewrite 후 Still Bad = Archive. 파일 보존. |
| P-13 | Time Test — Version 완성 후 24시간 보관 후 재독. 즉시 QG 금지. |
| P-14 | Read Aloud Test — 숨 / 입에 붙는가 / 생활어 / 대화체 4항목 Pass 필수 |
| P-15 | Human Test (최우선) — "부모님께 전화하고 싶었는가?" YES=PASS / NO=Rewrite |
| P-16 | Memory Resonance Test (MRT) — 30초 / 5분 / 다음 날 시간 레이어별 여운 평가 |
| P-17 | Hook Layer Test — 20대 / 30대 / 부모 잃은 사람 / 아이 없는 사람 각각 다른 기억 유발 여부 |
| P-18 | One Breath Test — 후렴 핵심을 한 번의 숨으로 끝까지 말할 수 있는가 |

### 5-5. GOSARI EP 전용 규칙 (G-01 ~ G-03)

**G-01 Symbol Reveal Rule**
- T-01: "고사리" 1~2회 최대, 의미 설명 금지
- T-02: 고사리의 핵심 은유 개방 ("우리는 모두 누군가의 고사리였다")
- T-03+: 삶·시간·순환의 상징으로 확장

**G-02 Empty Space Rule**
> "감정은 비우되 상황은 비우지 않는다."

- 나쁜 여백: 상황도 없고 감정도 없음 (공감 재료 없음)
- 좋은 여백: 상황은 주고 감정은 청자가 채움
- "그래서", "왜냐하면", "~이었기 때문에" 금지

**G-03 Truth Filter**
> "이 문장은 실제로 사람이 할 법한 말인가?"

- "당신의 사랑을 이제야 이해했습니다" → FAIL
- "엄마… 그냥 전화했어." → PASS

**Rule Adoption Gate**
신규 Rule 추가 전 필수 질문: "이 규칙은 '늦게 알았네'를 더 좋은 노래로 만드는가?" YES=채택 / NO=보류

### 5-6. Style Guide 핵심

**언어 비율:** 생활어 70% / 시적 언어 20% / 은유·상징 10%

**금지 표현:**
- 클리셰: "별빛처럼", "영원히 함께", "꽃처럼 피어나"
- 직접 감정 선언: "사랑해", "그리워", "보고싶어"
- 교훈·위로: "괜찮아", "다 잘 될 거야", "힘내"
- 추상적 슬픔: "슬프다", "아프다" 단독 사용

**문장 리듬:** 1줄 6~10음절 권장, 최대 14음절

---

## 6. T-01 「늦게 알았네」 현재 상태

### Hook v0.1 (2026-07-01)
```
늦게 알았네
정말 늦게 알았네
내 손을 꼭 잡아주던
그 마음을

늦게 알았네
이제야 알았네
내 아이 손을 잡고서야
당신을 알았네
```
**P-13 PASS** (72시간 경과) / **P-14 조건부 PASS** (대화체 약함) / **P-15 조건부 NO** (장면 없음, 행동 유발 미달)

### Hook v0.2 (2026-07-04) — 현재 버전
```
늦게 알았네
정말 늦게 알았네
꼭 쥔 이 손이
이렇게 작은 걸

늦게 알았네
이제야 알았네
내 아이 손을 잡고서야
당신이 보였네
```
**변경 포인트:**
- "내 손을 꼭 잡아주던 / 그 마음을" → "꼭 쥔 이 손이 / 이렇게 작은 걸" (감정 선언 → 장면)
- "당신을 알았네" → "당신이 보였네" (인식 선언 → 시각 장면)

**현재 상태:** P-13 대기 (2026-07-05 이후 재독)

### T-01 Scene Board (10장면)
| Scene | 내용 | 감정 강도 |
|-------|------|---------|
| 01 | 공원에서 아이가 처음으로 혼자 걷는 순간 | 20 |
| 02 | 아이가 처음 "엄마/아빠"를 부르는 순간 | 35 |
| 03 | 아이가 밥을 거부하고 과자를 달라는 순간 | 45 |
| 04 | 아이가 열이 나서 밤새 안고 있는 순간 | 70 |
| 05 | 오래된 가족사진을 발견하는 순간 | 60 |
| 06 | 아이가 처음으로 "싫어!"를 외치는 순간 | 85 |
| 06-B | 새벽 3시 아이를 안고 거실을 서성이는 순간 | 90 |
| 07 | 아이와 손을 잡고 걷다가 손을 놓는 순간 | 80 |
| 08 | 부모님께 전화를 거는 순간 (침묵·첫 마디) | 50 (최저) |
| 09 | 아이가 잠든 뒤 창문 너머를 바라보는 순간 | 100 |

**Emotion Map (섹션별 감정 강도):**
Intro 20 → Verse1 35 → Pre 45 → Chorus1 70 → Verse2 60 → 06-B 85 → Chorus2 80 → Bridge 90 → Final Hook 95 → Outro 100

---

## 7. 현재 미결 사항

### Agency System
| # | 항목 | 우선순위 | 담당 |
|---|------|---------|------|
| A-01 | 대시보드 v3.2 — 모델 라우팅 API 코드 반영 | 중 | ZERO |
| A-02 | 프롬프트 라이브러리 신규 카테고리 4종 등재 | 중 | ZERO |
| A-03 | md 장기기억 아키텍처 설계 (백로그) | 하 | ZERO |
| A-04 | 영수증 OCR 앱 사전 테스팅 → 다음 단계 판단 | 상 | ARIA |
| A-05 | LOD 게임 프로토타입 → 다음 단계 판단 | 중 | PHANTOM |
| A-06 | GOSARI Creative Bible CEO 서명 | 상 | CEO |

### PROJECT GOSARI — T-01 Hook 단계
| # | 항목 | 상태 | 예정일 |
|---|------|------|------|
| G-01 | Hook v0.2 P-13 Time Test 재독 | 대기 | 2026-07-05 이후 |
| G-02 | Hook v0.2 P-14 Read Aloud Test | 대기 | P-13 이후 |
| G-03 | Hook v0.2 P-15 Human Test | 대기 | P-14 이후 |
| G-04 | Hook v0.2 P-16 MRT 확인 | 대기 | P-15 이후 |
| G-05 | Hook Freeze 또는 v0.3 결정 | 대기 | MRT 이후 |

### PROJECT GOSARI — T-01 이후 작업
| # | 항목 | 담당 |
|---|------|------|
| G-06 | Final Hook 작성 | LYRA |
| G-07 | Bridge 작성 | LYRA |
| G-08 | Verse 1 작성 | LYRA |
| G-09 | Verse 2 작성 | LYRA |
| G-10 | Intro 작성 | LYRA |
| G-11 | Outro 작성 | LYRA |
| G-12 | 전체 리듬·운율 검토 + Emotion Map 강도 일치 | LYRA+CONDUCTOR |
| G-13 | T-01 전체 Quality Gate 제출 | AEGIS |
| G-14 | T-01 Suno 프롬프트 생성 | MUSE |

### PROJECT GOSARI — EP 전체
| # | 항목 | 담당 |
|---|------|------|
| E-01 | T-02 컨셉 개발 (T-01 QG PASS 후 착수) | SAGE |
| E-02 | T-03~T-06 순차 개발 | SAGE |
| E-03 | GOSARI 앨범아트 확정 (D-30) | STROBE |
| E-04 | GOSARI SNS 티저 콘텐츠 (D-14) | NOVA+STROBE |

---

## 8. 주요 결정 이력 요약

| 날짜 | 결정 |
|------|------|
| 2026-06-29 | Creative Bible 최상위 문서 확정. North Star = "눈물 강요 말고 기억 깨워라" |
| 2026-06-29 | Scene Board 10장면 확정 (06-B 추가). Cinema Test 신규 규칙 |
| 2026-06-30 | Producer Blueprint 신규 STEP 추가 (P-07). GOSARI 파이프라인 15단계 |
| 2026-07-01 | BALMY MUSIC OS v4.1 선언 = Production Grade 100/100. 시스템 동결. |
| 2026-07-01 | P-08~P-18 전체 Production Rule 확정 |
| 2026-07-01 | G-02 Empty Space Rule / G-03 Truth Filter 신규 제정 |
| 2026-07-01 | CONDUCTOR 철학 전환: "좋은 가사" → "사람의 기억이 머무를 공간" |
| 2026-07-04 | Hook v0.1 P-14 조건부 PASS / P-15 조건부 NO → Rewrite |
| 2026-07-04 | Hook v0.2 작성 — "꼭 쥔 이 손이 / 이렇게 작은 걸" 장면 삽입 |
| 2026-07-05 | 학습 콘텐츠 등재 기준 확정. 모델 라우팅 60-30-10. AEGIS 검증 세션 분리. |
| 2026-07-05 | CLAUDE.md [A]에이전시시스템 / [B]PROJECT GOSARI 구조 분리 |

---

## 9. 노션 구조

| 페이지 | ID | 위치 |
|--------|-----|------|
| BALMYGARDEN Agency HQ | 38a987a2-5d61-809e-9e48-f9afc90f8bba | 최상위 |
| PROJECT GOSARI 허브 | 390987a2-5d61-81aa-a715-e5fb679af8fa | Agency HQ 하위 |
| GOSARI 리비전 트래커 DB | 4ae24582-5135-4bf1-94c3-16bb8f300572 | GOSARI 허브 내 |
| BALMYGARDEN — 미결 사항 | 393987a2-5d61-8105-8168-d54da40a5d77 | Agency HQ 하위 |

---

## 10. 개발 환경

**스택:** Next.js 14 / Supabase / Gemini API / Vercel / Resend
**GitHub:** balmydaddy/receipt-dashboard
**작업 브랜치:** `claude/balmygarden-dashboard-v3-ok5lnw`
**절대 규칙:** main에 직접 푸시 금지

---

_Last updated: 2026-07-05 — 초기 생성_
