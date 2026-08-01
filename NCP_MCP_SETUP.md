# NCP MCP 서버 로컬 설치 절차서

> 대상: CEO 로컬 PC (Windows)
> 작성: 2026-08-01 / ZERO
> 원본: https://github.com/NaverCloudPlatform/NCP-Claude-Project

---

## 0. 착수 전 판단

**이 서버는 NCP 인프라 관리용이다.** 서버 생성·VPC 구성·Object Storage 조작을 Claude가 직접 수행하게 된다.

| 구분 | 내용 |
|------|------|
| 제공 기능 | VPC·서브넷·ACG 관리 / 서버 인스턴스 생성·조회 / Object Storage 버킷·객체 조작 (총 28개 tool) |
| 통신 방식 | stdio (표준 입출력) |
| 필요 키 | `NCP_ACCESS_KEY` / `NCP_SECRET_KEY` |

**설치하지 않아도 되는 경우:** SCOUT 뉴스 브리핑(`/api/naver-news`)만 쓸 목적이라면 이 서버는 불필요하다. 그쪽은 **검색 API 키**(`NCP_APIGW_API_KEY_ID` / `NCP_APIGW_API_KEY`)를 쓰며, 이 서버가 쓰는 인프라 키와 **다른 키다.**

**설치가 필요한 경우:** LOD 게임 서버나 앱 백엔드를 NCP에 올릴 때. 서버 프로비저닝을 대화로 처리할 수 있다.

---

## 1. 사전 준비

### 1-1. Python 확인

```
python --version
```

3.10 이상이어야 한다. 없으면 https://www.python.org/downloads/ 에서 설치하고, 설치 화면에서 **Add Python to PATH**를 반드시 체크한다.

### 1-2. NCP 인증키 발급

1. https://www.ncloud.com 로그인
2. 우측 상단 계정명 → **마이페이지** → **계정 관리** → **인증키 관리**
3. **신규 API 인증키 생성**
4. `Access Key ID`와 `Secret Key`를 복사해 둔다 — Secret Key는 생성 직후에만 전체가 보인다

---

## 2. 설치

### 2-1. 저장소 클론

```
cd %USERPROFILE%
git clone https://github.com/NaverCloudPlatform/NCP-Claude-Project.git
cd NCP-Claude-Project\ncp-mcp
```

### 2-2. 가상환경 구성

전역 Python을 오염시키지 않기 위해 가상환경을 쓴다.

```
python -m venv .venv
.venv\Scripts\activate
```

프롬프트 앞에 `(.venv)`가 붙으면 정상이다.

### 2-3. 의존성 설치

```
pip install -r requirements.txt
```

설치 항목: `mcp>=1.0.0`, `requests>=2.31.0`, `boto3>=1.34.0`

### 2-4. 환경변수 파일

```
copy .env.example .env
notepad .env
```

발급받은 키를 채운다.

```
NCP_ACCESS_KEY=발급받은_액세스_키
NCP_SECRET_KEY=발급받은_시크릿_키
```

**저장 후 확인:** `.gitignore`에 `.env`가 포함되어 있는지 확인한다. 이 파일은 절대 커밋하지 않는다 (에이전시 금지 행동 규칙).

---

## 3. Claude Code에 등록

가상환경의 Python 경로를 절대경로로 지정해야 한다. 아래는 `%USERPROFILE%`이 `C:\Users\사용자명`인 경우다.

```
claude mcp add ncp ^
  --env NCP_ACCESS_KEY=발급받은_액세스_키 ^
  --env NCP_SECRET_KEY=발급받은_시크릿_키 ^
  -- C:\Users\사용자명\NCP-Claude-Project\ncp-mcp\.venv\Scripts\python.exe C:\Users\사용자명\NCP-Claude-Project\ncp-mcp\ncp_server.py
```

`^`는 Windows 명령 프롬프트의 줄바꿈 기호다. PowerShell을 쓰면 `` ` ``(백틱)으로 바꾸거나 한 줄로 입력한다.

**경로에 한글이나 공백이 있으면** 경로 전체를 큰따옴표로 감싼다.

---

## 4. 검증

Claude Code를 재시작한 뒤:

```
/mcp
```

목록에 `ncp`가 **connected**로 표시되면 성공이다.

동작 확인은 **읽기 전용 tool로만** 한다.

```
NCP 버킷 목록 보여줘
```

`list_buckets`가 호출되어 목록이 나오면 연동 완료다.

---

## 5. 안전 수칙 (필독)

이 서버에는 **되돌릴 수 없는 조작**과 **과금이 발생하는 조작**이 포함되어 있다.

| 분류 | tool | 위험 |
|------|------|------|
| 과금 | `create_server`, `provision_server`, `assign_public_ip` | 서버 인스턴스는 생성 즉시 시간당 과금 |
| 삭제 | `delete_vpc`, `delete_subnet`, `delete_bucket`, `delete_object`, `delete_network_acl` | 복구 불가 |
| 노출 | `get_object_url` | 프리사인드 URL은 발급 후 만료 전까지 누구나 접근 가능 |

**적용 규칙:**

1. 위 tool은 CEO가 명시적으로 지시한 경우에만 실행한다 — 에이전시 중단·에스컬레이션 규칙의 "되돌릴 수 없는 조작" 조항에 해당한다
2. `create_server` 실행 전 **요금제와 예상 월 비용을 먼저 확인**한다
3. 작업 종료 후 사용하지 않는 서버는 반드시 반납한다 — 켜둔 채로 두면 계속 과금된다
4. Claude Code 권한 모드를 `plan` 또는 `default`로 두고, `bypassPermissions`로 두지 않는다

---

## 6. 문제 해결

| 증상 | 원인 | 조치 |
|------|------|------|
| `/mcp`에 ncp가 안 보임 | 등록 명령의 경로 오타 | `claude mcp list`로 등록 상태 확인 후 재등록 |
| `failed to connect` | 가상환경 Python 경로 오류 | `.venv\Scripts\python.exe`가 실제 존재하는지 확인 |
| 인증 오류 (401/403) | 키 오입력 또는 권한 부족 | NCP 콘솔에서 키 재확인, 서브계정이면 권한 정책 확인 |
| `ModuleNotFoundError: mcp` | 가상환경 미활성 상태로 설치됨 | `.venv\Scripts\activate` 후 `pip install -r requirements.txt` 재실행 |
| 리전 오류 | 기본 리전 불일치 | 지원 리전: KR / SGN / JPN / USWN |

---

## 7. 제거

```
claude mcp remove ncp
```

디렉터리도 지우려면 `NCP-Claude-Project` 폴더를 삭제한다. **삭제 전 `.env`에 담긴 키를 NCP 콘솔에서 폐기**하는 것이 안전하다.

---

## 부록 — 미확인 사항

- 본 절차서의 `claude mcp add` 문법은 stdio 서버 표준 등록 방식을 따랐다. Claude Code 버전에 따라 플래그가 다를 수 있으므로, 실패 시 `claude mcp add --help`로 현재 버전의 문법을 확인할 것.
- 원본 저장소의 `ncp-mcp/README.md`는 확인되지 않았다. 저장소에 README가 있다면 그쪽 지침이 우선한다.
