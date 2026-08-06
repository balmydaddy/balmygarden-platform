# 네이버 API 키 발급 + 트레이딩 터널 설정

> 대상: CEO 로컬 PC (Windows)
> 작성: 2026-08-03 / ZERO
> 소요: 네이버 5분 / 터널 10분

---

# 1. 네이버 검색 API 키 발급

## 발급처 두 곳 — 어느 쪽이든 된다

`/api/naver-news`는 두 경로를 모두 지원한다. 어느 키가 들어왔는지 스스로 판단해서 맞는 방식으로 호출한다. **하나만 등록하면 된다.**

| | 개발자센터 | NCP API HUB |
|---|---|---|
| 주소 | developers.naver.com | ncloud.com 콘솔 |
| 비용 | 무료 (일 25,000건) | 크레딧 차감 (프로모션 20만원, ~9/30) |
| 준비물 | 네이버 계정 | NCP 계정 + 결제수단 |
| 소요 | 약 5분 | 콘솔 신청 절차 필요 |
| 환경변수 | `NAVER_CLIENT_ID`<br>`NAVER_CLIENT_SECRET` | `NCP_APIGW_API_KEY_ID`<br>`NCP_APIGW_API_KEY` |

**빠르게 돌려보려면 개발자센터, 크레딧을 쓰려면 API HUB.**

### NCP API HUB 경로 (요약)

1. https://www.ncloud.com 콘솔 로그인
2. **Services** → **Application Services** → **NAVER API HUB**
3. 검색 API **이용 신청**
4. 콘솔에서 **API 키 발급** — 계정별로 발급된다

> **미확인 사항:** NCP 문서 사이트(guide.ncloud-docs.com, api.ncloud-docs.com)가 자동 접근을 차단해 **엔드포인트 주소와 헤더 이름 원문을 확인하지 못했다.**
> 코드에는 `https://naverapihub.apigw.ntruss.com/search/v1/news` 로 넣어 뒀으나 이는 참고 영상 화면에서 읽은 값이다.
> 콘솔 신청 화면에 표시되는 **실제 엔드포인트가 이와 다르면** 환경변수 `NCP_SEARCH_ENDPOINT` 에 그 주소를 넣으면 코드 수정 없이 교체된다.

아래 1-1~1-2는 **개발자센터** 기준이다. NCP를 택했다면 1-3(Vercel 등록)으로 바로 간다.

## 1-1. 애플리케이션 등록

1. https://developers.naver.com 접속 → 네이버 계정 로그인
2. 상단 **Application** → **애플리케이션 등록**
3. 입력값

| 항목 | 입력 |
|------|------|
| 애플리케이션 이름 | `BALMYGARDEN SCOUT` |
| 사용 API | **검색** 선택 |
| 비로그인 오픈 API 서비스 환경 | **WEB 설정** 선택 |
| 웹 서비스 URL | `https://balmygarden-platform-git-claude-cad013-xodmf224-1419s-projects.vercel.app` |

4. **등록하기**

## 1-2. 키 확인

등록 직후 **애플리케이션 정보** 화면에 표시된다.

```
Client ID     : 영문+숫자 10자 내외
Client Secret : 영문+숫자 10자 내외
```

Secret은 나중에도 다시 볼 수 있으니 급히 적어두지 않아도 된다.

## 1-3. Vercel 환경변수 등록

1. https://vercel.com/xodmf224-1419s-projects/balmygarden-platform 접속
2. **Settings** → **Environment Variables**
3. 두 개를 추가한다

**개발자센터를 택했다면:**

| Name | Value | Environment |
|------|-------|-------------|
| `NAVER_CLIENT_ID` | 발급받은 Client ID | Production, Preview, Development 전체 체크 |
| `NAVER_CLIENT_SECRET` | 발급받은 Client Secret | 전체 체크 |

**NCP API HUB를 택했다면:**

| Name | Value | Environment |
|------|-------|-------------|
| `NCP_APIGW_API_KEY_ID` | 발급받은 API Key ID | 전체 체크 |
| `NCP_APIGW_API_KEY` | 발급받은 API Key | 전체 체크 |
| `NCP_SEARCH_ENDPOINT` | 콘솔 표시 엔드포인트 (기본값과 다를 때만) | 전체 체크 |

4. **Save**

## ⚠️ 1-3-1. Redeploy 시 반드시 확인 — 배포 대상 착오 주의

**"최신 배포"를 그냥 누르면 십중팔구 틀린 걸 재배포하게 된다.** Deployments 탭에는 여러 배포가 섞여 있고, 맨 위가 항상 우리 작업 브랜치인 건 아니다.

| 배포 | Branch 열 표시 | 이게 뭔가 |
|------|----------------|-----------|
| ❌ **누르면 안 되는 것** | `main` | **옛날 영수증 앱** — 지휘본부·트레이딩·SCOUT 뭐 하나 없음. 여길 재배포해봐야 아무것도 안 바뀐다 |
| ✅ **눌러야 하는 것** | `claude/balmygarden-dashboard-v3-ok5lnw` | 지금 쓰고 있는 대시보드 전체 |

**실제로 벌어진 일:** 지금까지 Redeploy를 누른 게 전부 `main`(옛 영수증 앱)이었다. 6번을 눌러도 우리 대시보드 쪽엔 아무 변화가 없었던 이유가 이거다.

**확인 방법:** Deployments 탭에서 각 행의 **Branch** 열을 본다. `claude/balmygarden-dashboard-v3-ok5lnw`라고 적힌 행을 찾아 그 줄의 `⋯` → **Redeploy**.

**더 쉬운 방법:** 이 단계는 스킵해도 된다. **작업 브랜치에 새 커밋이 올라갈 때마다 Vercel이 자동으로 새로 빌드한다.** 지금 이 절차서를 커밋해서 자동 빌드를 걸어뒀다 — 잠시 후 아래 주소로 확인하면 된다.

> 환경변수는 **그 시점 이후 새로 빌드된 배포**에만 적용된다. 옛날 배포를 아무리 눌러봐야 반영 안 된다.

## 1-4. 동작 확인

재배포 완료 후 브라우저에서 아래 주소를 연다.

```
https://balmygarden-platform-git-claude-cad013-xodmf224-1419s-projects.vercel.app/api/naver-news?preset=safety
```

기사 목록 JSON이 나오면 성공이다. `키 미설정` 오류가 뜨면 환경변수 이름 오타이거나 재배포가 안 된 것이다.

**preset 종류:** `safety`(중대재해법·ISO) / `music` / `app` / `game`
**직접 검색:** `?query=중대재해처벌법`

---

# 2. 트레이딩 서버 터널

## 먼저 읽을 것 — 보안

터널을 열면 **트레이딩 서버가 인터넷에 노출된다.** 현재 `server.py`에 인증이 없다면 주소를 아는 사람은 누구나 포트폴리오·자산 금액을 볼 수 있다.

| 방식 | 노출 위험 | 권고 |
|------|-----------|------|
| A. Quick Tunnel 단독 | 주소를 알면 누구나 열람 | 잠깐 테스트용 |
| **B. Quick Tunnel + 토큰 인증** | 토큰 없으면 차단 | **상시 사용 시 이쪽** |

A로 먼저 되는지 확인하고, 계속 쓸 거면 B까지 한다.

---

## 2-1. cloudflared 설치

PowerShell을 **관리자 권한**으로 열고:

```
winget install --id Cloudflare.cloudflared
```

winget이 없으면 https://github.com/cloudflare/cloudflared/releases 에서 `cloudflared-windows-amd64.exe` 를 받아 `cloudflared.exe` 로 이름을 바꾸고 원하는 폴더에 둔다.

설치 확인:

```
cloudflared --version
```

## 2-2. 터널 실행

**트레이딩 서버(`python server.py`)를 먼저 켜 둔 상태에서** 새 터미널을 열고:

```
cloudflared tunnel --url http://localhost:5000
```

출력 중간에 주소가 나온다.

```
+------------------------------------------------------------+
|  https://random-words-here.trycloudflare.com               |
+------------------------------------------------------------+
```

이 주소를 복사한다. **이 창을 닫으면 터널이 끊긴다.** 켜 둔 채로 둔다.

계정 등록도, 요금도 없다. 대신 실행할 때마다 주소가 바뀐다.

## 2-3. Vercel 환경변수 등록

네이버와 같은 방법으로 하나 더 추가한다.

| Name | Value |
|------|-------|
| `TRADING_SERVER_URL` | `https://random-words-here.trycloudflare.com` |

끝에 슬래시(`/`)는 붙이지 않는다. 저장 후 **위 1-3-1의 배포 대상 착오 주의를 그대로 적용** — `main`이 아니라 작업 브랜치 배포를 재배포하거나, 새 커밋이 올라오길 기다린다.

## 2-4. 확인

대시보드 → 위키 → 트레이딩 탭. 상단이 **LIVE · 자동매매 가동 중**으로 바뀌면 성공이다.

---

## 2-5. 토큰 인증 추가 (상시 사용 시)

주소만 알면 누구나 볼 수 있는 상태를 막는다.

### 서버 쪽 (`server.py`)

`/api/status` 응답 직전에 헤더 검사를 넣는다.

```python
TOKEN = "여기에_아무_긴_문자열"   # 예: bg_7fK2mQ9xPz4vN8wL

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.headers.get("X-BG-Token") != TOKEN:
            self.send_response(401)
            self.end_headers()
            return
        # ... 기존 코드
```

### Vercel 환경변수

| Name | Value |
|------|-------|
| `TRADING_SERVER_TOKEN` | 위에서 정한 문자열과 동일하게 |

### 대시보드 쪽

`TRADING_SERVER_TOKEN`을 등록했다고 알려주면 `/api/trading`에서 헤더를 실어 보내도록 코드를 고쳐 두겠다. **서버와 Vercel 양쪽 값이 같아야 한다.**

---

# 3. 터널 주소가 바뀌는 문제

Quick Tunnel은 실행할 때마다 주소가 달라져 매번 Vercel 환경변수를 고쳐야 한다. 자주 쓰게 되면 아래 중 하나를 택한다.

| 방법 | 조건 | 결과 |
|------|------|------|
| Named Tunnel | Cloudflare 계정 + 도메인 소유 | 고정 주소 |
| 실행 배치 파일 | 없음 | 주소는 바뀌지만 실행이 한 번으로 끝남 |

당장은 **배치 파일**로 충분하다. 바탕화면에 `트레이딩시작.bat` 를 만들고:

```bat
@echo off
start "trading" cmd /k python C:\경로\server.py
timeout /t 3
start "tunnel" cmd /k cloudflared tunnel --url http://localhost:5000
```

더블클릭하면 서버와 터널이 함께 뜬다. 터널 창에 뜬 주소만 Vercel에 갱신하면 된다.

---

# 체크리스트

```
□ 발급처 선택 (개발자센터 or NCP API HUB)
□ 키 2개 확보
□ Vercel 환경변수 등록 (선택한 쪽 변수명으로)
□ Redeploy
□ /api/naver-news?preset=safety 응답 확인

□ cloudflared 설치
□ server.py 실행
□ cloudflared tunnel --url http://localhost:5000 실행
□ 발급된 주소를 TRADING_SERVER_URL 로 등록
□ Redeploy
□ 트레이딩 탭 LIVE 확인

□ (상시 사용 시) 토큰 인증 추가
```

---

_작성: 2026-08-03 / 문제 생기면 어느 단계에서 막혔는지만 알려주면 된다_
