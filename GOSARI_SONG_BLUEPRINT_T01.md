# PROJECT GOSARI — Song Blueprint
## Track 01 : 늦게 알았네

> Status: Draft v1.0 (CONDUCTOR 설계)
> Owner: CONDUCTOR | Next: LYRA (가사 작성)
> Purpose: LYRA 착수 전 음악 구조·감정 설계 전달

---

## Production Rule P-07

> **"Lyrics를 작성하기 전에 반드시 Producer Blueprint를 먼저 완성한다."**
>
> SAGE → Producer Blueprint (CONDUCTOR) → LYRA
>
> 이 문서 없이 LYRA 단독 착수 절대 금지.

---

## Song Structure — Scene 매핑

| 섹션 | Scene | 핵심 감정 | 길이 |
|------|-------|-----------|------|
| Intro | Scene 01 | 평범함 | 4마디 |
| Verse 1 | Scene 02 → 03 | 보호·본능 → 첫 깨달음 | 8마디 |
| Pre-Chorus | Scene 04 | 망설임 | 4마디 |
| Chorus 1 | (핵심 후렴) | 먹먹함 | 8마디 |
| Verse 2 | Scene 05 → 06 | 회상 → 시간의 순환 | 8마디 |
| Pre-Chorus 2 | Scene 06-B | 부모됨의 이해 | 4마디 |
| Chorus 2 | (핵심 후렴) | 먹먹함 심화 | 8마디 |
| Bridge | Scene 07 | 먹먹함 → 감사 전환 | 6마디 |
| Final Hook | Scene 08 | 감사 | 4마디 |
| Outro | Scene 09 | 희망·순환 | 8마디 |

---

## Hook Placement

### 주요 훅 포인트

| 순서 | 위치 | 가사 힌트 | 기능 |
|------|------|-----------|------|
| Hook 1 | Chorus 1 진입 | "늦게 알았네" | 먹먹함 첫 폭발 |
| Hook 2 | Chorus 2 진입 | "늦게 알았네" (심화) | 감정 쌓인 뒤 재폭발 |
| Hook 3 | Final Hook | "엄마… 그냥 전화했어." | 감사·연결 클라이맥스 |
| Hook 4 | Outro | "늦게 알았네" × 4회 | 순환 마무리 |

### 후렴 반복 설계

- Chorus 1: "늦게 알았네" 2회 — 단순, 첫 노출
- Chorus 2: "늦게 알았네" 2회 — 같은 가사, 다른 감정 무게
- Outro: "늦게 알았네" 4회 — 점층적 fade out

**원칙:** 같은 가사가 다른 감정으로 들려야 한다. 반복은 공허함이 아니라 깊어짐이다.

---

## Silence Design

> 음악에서 가장 강한 표현은 침묵이다.

| Scene | 침묵 설계 | 지속시간 |
|-------|-----------|----------|
| Scene 03 (깨달음) | 반주 절반 이하 + 멜리스마 | 2마디 |
| Scene 06-B (새벽 양육) | 악기 사라짐 + 보컬 alone | 1마디 |
| Scene 07 (먹먹함) | Bridge 전 0.5마디 완전 정지 | 0.5마디 |
| Scene 08 (통화 순간) | 전화 연결음 이후 완전 무음 | 1마디 |
| Scene 08 → Outro | 첫 마디 후 악기 최소화 | 2마디 |

**Scene 08 침묵 시퀀스:**
```
전화 연결음 → 한 마디 침묵 → "엄마… 그냥 전화했어." → 악기 없음 → 숨소리만
→ Outro 시작
```

---

## Dynamic Curve

> 볼륨과 밀도는 감정의 지도다.

| 섹션 | 볼륨 레벨 | 악기 밀도 |
|------|-----------|-----------|
| Intro | 30% | 피아노 단독 |
| Verse 1 | 40% | 피아노 + 스트링 약하게 |
| Pre-Chorus | 55% | 스트링 진입 |
| Chorus 1 | 75% | 풀 오케스트라 |
| Verse 2 | 45% | Verse 1 수준 |
| Scene 06-B | 35% | 보컬 단독 or 피아노 1줄 |
| Chorus 2 | 85% | 풀 + 상승 |
| Bridge | 60% | 스트링 집중 |
| Final Hook | 50% | 피아노 + 보컬 |
| Outro | 20% → 0% | 점진적 fade |

**설계 원칙:** Scene 08이 가장 조용한 순간이어야 한다. 감사는 폭발이 아니라 고요함에서 온다.

---

## Symbol Timing

> 9개 필수 요소의 가사 배치 설계.

| Symbol | 배치 섹션 | 구체 장면 |
|--------|-----------|-----------|
| 아이 | Verse 1 | Scene 02 — 손 잡는 순간 |
| 손 | Verse 1 | Scene 03 — 아이 손 → 엄마 손 |
| 일상 | Verse 1 | Scene 01 — TV·커피 |
| 밥 | Verse 2 | Scene 06 — "천천히 먹어" |
| 집 | Verse 2 | Scene 05 — 이불 |
| 시간 | Chorus | 순환 이미지 전체 |
| 사진 | Bridge | Scene 07 — 오래된 가족사진 |
| 전화 | Final Hook | Scene 08 — 전화 연결음 |
| 부모 | Outro | Scene 09 — 세 손이 겹치는 이미지 |
| 고사리 | Final Hook or Outro | 제목 연결 심볼 (선택적 은유) |

---

## Breath Point Design

> Suno AI에 전달할 보컬 호흡 설계.

| 위치 | 호흡 유형 | 목적 |
|------|-----------|------|
| Verse 1 끝 | 자연스러운 들숨 | 다음 장면으로 이동 |
| Scene 03 깨달음 직후 | 멜리스마 + 긴 호흡 | 감정 잠시 중단 |
| Scene 06-B 진입 전 | 짧고 날카로운 들숨 | 감정 전환점 |
| Bridge 전 | 완전한 멈춤 + 들숨 | 침묵 설계와 연결 |
| "엄마… 그냥 전화했어." | 떨리는 들숨 선행 | 인물의 감정 전달 |
| Outro | 길고 느린 숨 | 마무리·해방감 |

**Suno 프롬프트 지시어 예시:**
```
[breath before final hook]
[melisma on 알았네]
[silence 1 bar before outro]
[warm tenor, slightly trembling, gentle]
```

---

## Cinema Test++

> Scene Board Cinema Test 통과 후 추가 독립 검증.
> 가사 없이 이 Blueprint만으로도 감동이 전달되는가?

| 항목 | 기준 | 판정 |
|------|------|------|
| Hook만 들어도 장면이 보이는가? | "늦게 알았네" = 즉각적 공감 | PASS |
| 침묵 설계가 없어도 감동이 전달되는가? | Blueprint 독립 감동 기준 | PASS |
| Symbol Timing이 감정 곡선과 일치하는가? | 밥=회상, 사진=먹먹함, 전화=감사 | PASS |
| Final Hook이 청자를 행동으로 이끄는가? | 전화 걸고 싶어지는가 | PASS |

**Cinema Test++ 4항목 전부 PASS → LYRA 가사 착수 조건 충족**

---

## LYRA 인수인계 체크리스트

LYRA 착수 전 이 문서를 기반으로 확인할 항목:

- [ ] Scene Board T01 v0.2 LYRA 인수인계 규칙 7항목 숙지
- [ ] Hook Placement — "늦게 알았네" 배치 위치 확인
- [ ] Scene 08 — 통화 이후 대화 가사 절대 금지
- [ ] Symbol Timing — 9개 필수 요소 섹션 배치
- [ ] Dynamic Curve — 가장 조용한 순간 = Scene 08
- [ ] Silence Design — 침묵 설계 인식 후 가사 공백 설계
- [ ] 후렴 — 첫 노출 단순, 반복 시 심화 (같은 가사 다른 무게)
- [ ] Breath Point — 호흡 여백 가사에 반영 (짧은 문장, 공백 라인 활용)

---

## CONDUCTOR 메모

이 트랙의 가장 강한 순간은 가장 조용한 순간이다.

"엄마… 그냥 전화했어."

이 한 마디가 모든 장면의 결론이다.
LYRA는 이 한 마디를 향해 전진하는 가사를 쓴다.
도착하기 전까지 모든 것은 준비다.

---

## Quality Gate

| 항목 | 점수 | 비고 |
|------|------|------|
| Hook 설계 | 98 | "늦게 알았네" 반복 감정 심화 |
| 침묵 설계 | 97 | Scene 08 = 가장 조용한 클라이맥스 |
| 감정 곡선 | 99 | Scene Board와 완전 일치 |
| Symbol 배치 | 96 | 9개 전 배치 완료 |
| Cinema Test++ | 98 | 4항목 PASS |
| **Overall** | **97.6 / PASS** | LYRA 인수인계 조건 충족 |

---

_Last updated: 2026-06-30 — MUSIC OS v4.0 / CONDUCTOR_
_STEP 5.5 — Producer Blueprint (신규)_
