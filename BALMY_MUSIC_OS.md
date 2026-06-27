# BALMY MUSIC OS
## AI Music Production Operating System

**Version**: v1.0  
**Status**: Building  
**Author**: BALMYDADDY  
**Integrated**: BALMYGARDEN Agency Dashboard v3.2

---

## Vision

BALMY MUSIC OS는 AI를 활용하여 기획부터 발매까지 모든 음악 제작 과정을 관리하는 운영체계이다.

목적: 반복 가능하고 확장 가능한 AI 기반 음악 제작 시스템 구축.

---

## Core Philosophy

> 우리는 노래를 만드는 것이 아니다. 우리는 작품을 만든다.
> 우리는 앨범을 만드는 것이 아니다. 우리는 세계관(World Building)을 만든다.

---

## Production Pipeline (12 Steps)

```
STEP 01  Concept       ← CONDUCTOR가 SAGE에게 배정
STEP 02  World Building ← SAGE
STEP 03  Scenario      ← SAGE
STEP 04  Scene         ← SAGE
STEP 05  Lyrics        ← LYRA (SAGE 완료 후에만 착수)
STEP 06  Lyrics Review ← LYRA 자체 리뷰 (장면·진정성·심볼 각 8/10 이상)
STEP 07  Music Prompt  ← MUSE (Suno AI 태그 설계)
STEP 08  Generate Versions ← MUSE (20~50 버전 생성)
STEP 09  Selection     ← CEO 최종 선택
STEP 10  Album Art     ← STROBE + MUSE
STEP 11  MV Storyboard ← STROBE
STEP 12  Release Package ← REX + NOVA
```

### 절대 규칙

- 가사(LYRA)는 SAGE의 시나리오·장면 없이 절대 착수 금지
- 단계 건너뛰기 금지
- CEO 승인 체크포인트: STEP 09 (버전 선택), STEP 10 (앨범아트), STEP 12 (발매 승인)

---

## Agent Roles

| Agent | Code | Role | Responsibility |
|-------|------|------|---------------|
| SAGE  | A-10 | 스토리/세계관 | World Building · Scenario · Scene 설계 |
| LYRA  | A-11 | 가사 작성 | Scene 기반 가사 · 자체 리뷰 |
| MUSE  | A-04 | 음악 제작 | Suno AI 프롬프트 · 버전 생성 |
| STROBE | A-12 | MV/비주얼 | 앨범아트 방향 · MV 스토리보드 · Midjourney 프롬프트 |
| NOVA  | A-06 | 마케팅 | SNS 전략 · 티저 · 발매 마케팅 |
| REX   | A-07 | 배급/행정 | DistroKid · 메타데이터 · 일정 관리 |
| AEGIS | A-05 | QA/법무 | 저작권 · 95/100 QA 게이트 |

---

## Folder Structure (Convention)

```
BALMY_MUSIC_OS/
├── SYSTEM.md              ← 이 파일
├── PROJECTS/
│   └── GOSARI/            ← 현재 프로젝트
│       ├── 00_Project_Bible/
│       ├── 01_World_Building/
│       ├── 02_Tracks/
│       │   ├── Track_01_늦게알았네/
│       │   ├── Track_02_고사리/
│       │   ├── Track_03_큰손/
│       │   ├── Track_04_사진한장/
│       │   ├── Track_05_떠난기차/
│       │   └── Track_06_봄은또오더라/
│       ├── 03_Suno/
│       ├── 04_AlbumArt/
│       ├── 05_MV/
│       ├── 06_Branding/
│       ├── 07_Release/
│       ├── 08_Marketing/
│       └── 09_Archive/
└── TEMPLATES/
    └── Track_Template/
        ├── Concept.md
        ├── Scenario.md
        ├── Lyrics.md
        ├── Review.md
        ├── Prompt.md
        ├── Artwork.md
        ├── MV.md
        └── Release.md
```

---

## Current Project: GOSARI

### Status: Planning → Building

| 항목 | 내용 |
|------|------|
| 테마 | 시간 (Time) |
| 핵심 메시지 | 우리는 모두 누군가의 고사리였다 |
| EP 구성 | 6트랙 |
| 감정 흐름 | 무관심 → 탄생 → 깨달음 → 후회 → 감사 → 희망 |

### EP Track List

| # | 제목 | 심볼 | 감정 |
|---|------|------|------|
| 01 | 늦게 알았네 | 전화, 시간 | 후회·깨달음 |
| 02 | 고사리 | 고사리, 큰 손, 작은 손 | 탄생·보호 |
| 03 | 큰 손 | 큰 손, 집 | 감사 |
| 04 | 사진 한 장 | 사진, 시간 | 그리움·기록 |
| 05 | 떠난 기차 | 기차, 봄 | 이별·흘러감 |
| 06 | 봄은 또 오더라 | 봄, 고사리 | 희망·순환 |

### Core Symbols

고사리 · 큰 손 · 작은 손 · 사진 · 기차 · 봄 · 집 · 전화 · 시간

### Project Rules

- 효도송이 아니다
- 죽음을 주제로 하지 않는다
- 부모를 잃은 이야기보다 **부모를 이해하게 되는 이야기**
- 감정보다 진심 우선
- 설명보다 장면(Scene) 우선

### Visual Direction (STROBE)

- 색상: 연한 세피아 + 봄 연두 (따뜻하고 낡은 필름 느낌)
- 분위기: 1980~90년대 한국 가정집 질감, 손때 묻은 사진첩
- MV 핵심: 큰 손과 작은 손 교차 · 기차창 풍경 · 고사리 손 클로즈업
- 앨범아트: 심플 + 서정적, 과잉 그래픽 금지

---

## BALMYGARDEN Agency Workflows (Music OS)

Dashboard URL: `/agency` → 워크플로우 탭 → 카테고리: 음악OS

| ID | 이름 | 체인 | 설명 |
|----|------|------|------|
| gosari_world | 고사리 EP 세계관 빌딩 | SAGE → MUSE → AEGIS | 세계관·트랙 구조 설계 |
| gosari_track | 고사리 트랙 파이프라인 | SAGE → LYRA → MUSE → AEGIS | 시나리오→가사→프롬프트 |
| music_suno_prompt | Suno AI 프롬프트 생성 | LYRA → MUSE → CONDUCTOR | 가사→Suno 최적 프롬프트 |
| gosari_visual | 고사리 비주얼 패키지 | STROBE → MUSE → AEGIS | 앨범아트+MV 스토리보드 |
| gosari_release | 고사리 EP 발매 마스터플랜 | REX → NOVA → SCOUT → CONDUCTOR | D-30 타임라인 |

---

## Claude Code Principles

- 재사용 가능한 구조 우선
- 모듈형·확장 가능·유지보수 쉬운 구조
- 하드코딩 최소화
- 프로젝트 간 중복 감소
- 새 프로젝트도 동일 시스템 안에서 운영

---

## Future Expansion (Agent Roadmap)

현재 구현: SAGE · LYRA · STROBE (MUSIC OS 코어)  
향후 확장:
- **SNS Agent** — 플랫폼별 자동 포스팅 최적화
- **Distribution Agent** — DistroKid API 연동 자동화
- **Analytics Agent** — 스트리밍 성과 분석·리포트

---

## Final Goal

BALMY MUSIC OS는 한 개의 노래를 만들기 위한 프로젝트가 아니다.

**평생 사용할 AI Music Production Platform을 구축하는 것이 목표이다.**
