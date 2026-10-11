# 트레이딩 서버 고정 주소 설정 — ngrok 무료 고정 도메인

> 작성: 2026-08-10 (CEO 질문 "cloudflare 주소 계속 새로 만들어야 하나" 대응)
> 대상: `python server.py`(로컬 PC, 포트 5000)를 배포본(`balmygarden-platform.vercel.app`)에서
> 계속 볼 수 있게 하는 터널 설정

---

## 왜 주소가 매번 바뀌었나

지금까지 쓰던 `cloudflared tunnel --url http://localhost:5000` 방식은 **Quick Tunnel**이다.
실행할 때마다 `https://무작위글자.trycloudflare.com` 같은 임시 주소를 새로 발급한다 —
서버를 재시작하거나 PC를 껐다 켜면 주소가 바뀌고, 그때마다 Vercel의
`TRADING_SERVER_URL`을 다시 등록해야 했다.

Cloudflare로 고정 주소를 받으려면(Named Tunnel) **본인 소유 도메인**이 있어야 한다.
도메인이 없다면 **ngrok 무료 고정 도메인**이 가장 빠르다 — 계정당 1개, 영구 무료.

---

## 1. ngrok 설치 + 계정 생성

1. https://ngrok.com 에서 무료 계정 가입 (구글 계정으로 가능)
2. https://dashboard.ngrok.com/get-started/setup 에서 OS(Windows)에 맞는 설치 파일 다운로드 후 설치
3. 대시보드에 표시되는 인증 토큰(authtoken)을 복사해 PC에 등록:
   ```
   ngrok config add-authtoken <대시보드에 표시된 토큰>
   ```
   (한 번만 하면 됨 — PC에 저장된다)

## 2. 고정 도메인 예약

1. https://dashboard.ngrok.com/domains 접속
2. "New Domain" 클릭 → 무료로 `아무이름.ngrok-free.app` 형태 주소 1개 발급됨
   (예: `balmygarden-trading.ngrok-free.app`)
3. 이 주소를 그대로 적어둔다 — **다시는 바뀌지 않는다**

## 3. 트레이딩 서버 + 터널 실행

1. 트레이딩 서버 실행 (기존과 동일):
   ```
   python server.py
   ```
2. 새 터미널 창을 열어 터널 실행 — 이번엔 예약한 고정 도메인을 지정:
   ```
   ngrok http 5000 --domain=balmygarden-trading.ngrok-free.app
   ```
   (`balmygarden-trading.ngrok-free.app`는 2단계에서 예약한 실제 주소로 교체)
3. 터미널에 `https://balmygarden-trading.ngrok-free.app`가 "online"으로 뜨면 성공

## 4. Vercel에 한 번만 등록

Vercel → `balmygarden-platform` 프로젝트 → Settings → Environment Variables

| Key | Value |
|---|---|
| `TRADING_SERVER_URL` | `https://balmygarden-trading.ngrok-free.app` |

이미 값이 있다면 **Edit**으로 교체(재등록이 아니라 최초 1회만 하면 그다음부터는 안 건드려도 됨).
저장 후 재배포 1회 필요(환경변수는 재배포해야 반영됨).

## 5. 자동 실행 등록 (2026-08-22 추가 — 이제 이게 기본이다)

`tools/trading-autostart-install.bat`을 `server.py`가 있는 폴더에 두고 한 번 실행하면
**서버와 터널을 같이** 띄우고, 다음 로그인부터 자동으로 뜬다.

- 설치 중에 ngrok 고정 도메인을 한 번 물어본다. 2단계에서 예약한 주소를 그대로
  넣으면 옆에 `trading-tunnel-domain.txt`로 저장되고 다음부터는 안 묻는다.
- 끝에 실제로 연결된 공개 주소를 찍어준다. **그 값이 Vercel의
  `TRADING_SERVER_URL`과 같아야 한다** — 다르면 화면은 계속 오프라인으로 보인다.
- 해제: `tools/trading-autostart-uninstall.bat`

수동으로 하려면 예전 방식대로 `python server.py` + `ngrok http 5000 --domain=...`
두 개를 각각 켜면 된다. 주소가 고정이라 Vercel 쪽은 다시 안 만져도 된다.

---

## 화면이 "응답 404"로 뜰 때

**서버 문제가 아니다.** 404를 돌려준 쪽은 server.py가 아니라 ngrok 엣지다.
예약한 도메인은 살아있는데 그 뒤에 붙을 에이전트(`ngrok http 5000 --domain=...`)가
안 떠 있으면 ngrok이 대신 404(ERR_NGROK_3200)를 돌려준다.

server.py가 멀쩡히 돌고 있어도 이렇게 보인다 — 실제로 2026-08-22에 그랬다.
자동 실행 등록이 서버만 띄우고 터널은 안 띄웠던 게 원인이었다.

조치: `trading-autostart-install.bat` 재실행. 그러면 터널까지 같이 올리고
다음 로그인부터 둘 다 자동으로 뜬다.

---

## 참고 — 나중에 도메인을 사게 되면

BALMYGARDEN 전용 도메인(예: `balmygarden.co.kr` 등)을 구매하게 되면, Cloudflare에
그 도메인을 등록하고 **Named Tunnel**로 전환하는 게 더 낫다. ngrok 무료 고정 도메인은
1개까지만 무료이고, Cloudflare Named Tunnel은 같은 도메인 아래 원하는 만큼 서브도메인을
붙일 수 있어(예: `trading.balmygarden.co.kr`) 나중에 서비스가 늘어나면 유리하다.
지금 단계에서는 ngrok으로 충분하다.
