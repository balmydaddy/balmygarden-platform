param(
    [ValidateSet('install','uninstall','run')][string]$Action = 'install',
    # ngrok 예약 고정 도메인(예: balmygarden-trading.ngrok-free.app).
    # 한 번 주면 옆 파일에 저장해두고 다음부터는 안 물어본다.
    [string]$Domain = ''
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Here     = Split-Path -Parent $MyInvocation.MyCommand.Path
$Server   = Join-Path $Here 'server.py'
$OutLog   = Join-Path $Here 'trading-server.log'
$ErrLog   = Join-Path $Here 'trading-server.error.log'
$TaskName = 'BalmyGarden_TradingServer'
$Self     = $MyInvocation.MyCommand.Path

# 터널 관련
$DomainFile  = Join-Path $Here 'trading-tunnel-domain.txt'
$TunnelOut   = Join-Path $Here 'trading-tunnel.log'
$TunnelErr   = Join-Path $Here 'trading-tunnel.error.log'
$NgrokApiPort = 4040   # ngrok 에이전트의 로컬 관리 API

function Find-Python {
    # pythonw / pyw 는 콘솔 창이 없다. 없으면 python / py 로 떨어진다.
    foreach ($n in @('pythonw','pyw','python','py')) {
        $c = Get-Command $n -ErrorAction SilentlyContinue
        if ($c) { return $c.Source }
    }
    return $null
}

function Test-ServerUp {
    # HTTP 200 대신 "포트가 열렸는가"로 본다. 응답 본문이나 상태코드는
    # 서버 구현에 따라 달라지지만, 포트가 열렸으면 서버는 뜬 것이다.
    # (시스템 프록시 설정 때문에 Invoke-WebRequest 가 localhost 를 프록시로
    #  보내버리는 경우도 있어 HTTP 판정은 신뢰도가 떨어진다.)
    param([int]$Port = 5000)
    try {
        $c   = New-Object System.Net.Sockets.TcpClient
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
        $up  = $iar.AsyncWaitHandle.WaitOne(700)
        if ($up) { try { $c.EndConnect($iar) } catch { $up = $false } }
        $c.Close()
        return $up
    } catch { return $false }
}

function Start-Server {
    $py = Find-Python
    if (-not $py) { throw '파이썬을 찾지 못했습니다.' }
    # 출력과 오류를 각각 다른 파일로 보낸다. 같은 파일로 보내면 PowerShell이 거부한다.
    Start-Process -FilePath $py `
                  -ArgumentList "`"$Server`"" `
                  -WorkingDirectory $Here `
                  -RedirectStandardOutput $OutLog `
                  -RedirectStandardError  $ErrLog `
                  -WindowStyle Hidden | Out-Null
}

# ────────────────────────────────────────────────────────────────────
#  터널
#
#  server.py 만 띄우면 이 PC 안에서만 보인다. 배포본(Vercel)이 보는 주소는
#  ngrok 고정 도메인이라, 터널이 안 떠 있으면 그 도메인은 살아있는 채로
#  ngrok 엣지가 404를 돌려준다 — 화면에는 "트레이딩 서버 응답 404"로 뜨지만
#  실제로 죽은 건 서버가 아니라 터널이다. 그래서 둘을 같이 띄운다.
# ────────────────────────────────────────────────────────────────────

function Get-Domain {
    # 우선순위: 이번에 넘긴 -Domain > 예전에 저장해둔 값
    if ($Domain) { return $Domain.Trim() }
    if (Test-Path $DomainFile) {
        $d = (Get-Content $DomainFile -Raw -ErrorAction SilentlyContinue)
        if ($d) { return $d.Trim() }
    }
    return ''
}

function Save-Domain {
    param([string]$Value)
    # BOM 없는 ASCII로 저장한다 — 도메인에 한글이 들어갈 일이 없고, 나중에
    # 다른 도구가 읽을 때 BOM이 값에 섞여 들어가는 사고를 막는다.
    [System.IO.File]::WriteAllText($DomainFile, $Value.Trim(), (New-Object System.Text.ASCIIEncoding))
}

function Get-TunnelPublicUrl {
    # ngrok 에이전트는 127.0.0.1:4040 에 관리 API를 연다. 여기서 실제로
    # 열린 공개 주소를 읽는 게 가장 확실한 확인이다 — "프로세스가 살아있다"는
    # 것과 "터널이 실제로 붙었다"는 것은 다르다.
    #
    # WebClient 를 쓰고 프록시를 명시적으로 비운다. 시스템 프록시가 잡혀 있으면
    # Invoke-WebRequest 가 localhost 요청까지 프록시로 보내 엉뚱하게 실패한다.
    if (-not (Test-ServerUp -Port $NgrokApiPort)) { return '' }
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Proxy = $null
        $json = $wc.DownloadString("http://127.0.0.1:$NgrokApiPort/api/tunnels")
        $wc.Dispose()
        # ConvertFrom-Json 은 Windows PowerShell 5.1 에도 있다.
        $obj = $json | ConvertFrom-Json
        foreach ($t in $obj.tunnels) {
            if ($t.public_url -like 'https://*') { return [string]$t.public_url }
        }
        if ($obj.tunnels -and $obj.tunnels.Count -gt 0) { return [string]$obj.tunnels[0].public_url }
        return ''
    } catch { return '' }
}

function Start-Tunnel {
    param([string]$TunnelDomain)
    $ng = Get-Command 'ngrok' -ErrorAction SilentlyContinue
    if (-not $ng) { return 'ngrok-없음' }
    if (-not $TunnelDomain) { return '도메인-없음' }

    Start-Process -FilePath $ng.Source `
                  -ArgumentList @('http', '5000', "--domain=$TunnelDomain", '--log=stdout') `
                  -WorkingDirectory $Here `
                  -RedirectStandardOutput $TunnelOut `
                  -RedirectStandardError  $TunnelErr `
                  -WindowStyle Hidden | Out-Null
    return '시작됨'
}

# ── run: 작업 스케줄러가 부르는 실행 모드 ────────────────────────────
if ($Action -eq 'run') {
    # 이미 떠 있으면 두 번 띄우지 않는다. 두 번째 프로세스는 포트 충돌로
    # 죽지만, 그 과정에서 로그 파일을 덮어써 원래 서버의 기록이 날아간다.
    if (-not (Test-ServerUp)) { Start-Server }

    # 터널은 서버와 별개로 판정한다. 서버가 이미 떠 있다고 해서 터널까지
    # 떠 있는 건 아니다 — 예전 판에서 서버만 보고 빠져나간 게 404의 원인이었다.
    $d = Get-Domain
    if ($d -and -not (Get-TunnelPublicUrl)) {
        # ngrok 은 로컬 5000 이 열려 있어야 붙는다. 서버가 늦게 뜨는 경우가
        # 있으니 최대 40초 기다린 뒤 터널을 올린다.
        foreach ($i in 1..40) {
            if (Test-ServerUp) { break }
            Start-Sleep -Seconds 1
        }
        Start-Tunnel -TunnelDomain $d | Out-Null
    }
    exit 0
}

# ── uninstall ────────────────────────────────────────────────────────
if ($Action -eq 'uninstall') {
    Write-Host '자동 실행 등록을 해제합니다...'
    $t = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $t) {
        Write-Host '  등록된 작업이 없습니다. 이미 해제된 상태입니다.'
    } else {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host '  해제 완료 — 다음 부팅부터 자동으로 뜨지 않습니다.'
    }
    Write-Host ''
    Write-Host '지금 떠 있는 서버와 터널은 그대로 돌아갑니다.'
    Write-Host '지금 끄려면 작업 관리자에서 python / ngrok 프로세스를 종료하세요.'
    exit 0
}

# ── install ──────────────────────────────────────────────────────────
Write-Host '============================================================'
Write-Host ' 트레이딩 서버 자동 실행 등록'
Write-Host '============================================================'
Write-Host ''

# 1) server.py
if (-not (Test-Path $Server)) {
    Write-Host '[실패] 이 폴더에 server.py 가 없습니다.'
    Write-Host ("       현재 폴더: {0}" -f $Here)
    Write-Host ''
    Write-Host '       이 파일들을 server.py 가 있는 폴더로 옮긴 뒤 다시 실행하세요.'
    exit 1
}
Write-Host ("[1/6] server.py 확인        {0}" -f $Server)

# 2) 파이썬
$py = Find-Python
if (-not $py) {
    Write-Host '[실패] 파이썬을 찾지 못했습니다.'
    Write-Host '       python.org 에서 설치할 때 "Add python.exe to PATH" 를 체크하세요.'
    exit 1
}
Write-Host ("[2/6] 파이썬 확인           {0}" -f $py)

# 3) 기존 등록 정리 — 경로가 바뀌었을 수 있으므로 지우고 다시 만든다
$old = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($old) { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false }
Write-Host '[3/6] 기존 등록 정리        완료'

# 4) 터널 확인 — 서버만 자동으로 띄우면 배포본에서는 여전히 안 보인다
$ngrok  = Get-Command 'ngrok' -ErrorAction SilentlyContinue
$domain = Get-Domain

if (-not $ngrok) {
    Write-Host '[4/6] 터널                  ngrok 이 설치돼 있지 않습니다 - 터널은 건너뜁니다.'
    Write-Host '      로컬(localhost:5000)에서는 그대로 됩니다. 배포본에서 보려면'
    Write-Host '      SETUP_TRADING_TUNNEL.md 대로 ngrok 을 설치한 뒤 이 파일을 다시 실행하세요.'
} else {
    if (-not $domain) {
        Write-Host '[4/6] 터널                  고정 도메인이 아직 저장돼 있지 않습니다.'
        Write-Host '      https://dashboard.ngrok.com/domains 에 예약해둔 주소를 넣으세요.'
        Write-Host '      (예: balmygarden-trading.ngrok-free.app / 그냥 Enter 치면 건너뜁니다)'
        $domain = (Read-Host '      도메인').Trim()
        # 붙여넣기하면 https:// 나 끝 슬래시가 같이 붙어 온다. ngrok --domain 은
        # 호스트 이름만 받으므로 여기서 벗겨낸다.
        $domain = $domain -replace '^https?://', '' -replace '/+$', ''
    }
    if ($domain) {
        Save-Domain $domain
        Write-Host ("[4/6] 터널                  {0} (저장됨)" -f $domain)
    } else {
        Write-Host '[4/6] 터널                  건너뜀 - 배포본에서는 오프라인으로 보입니다.'
    }
}

# 5) 로그인 시 자동 실행 등록
#    "부팅 시"가 아니라 "로그인 시"인 이유: 트레이딩 서버는 계정에 저장된
#    API 키·인증 정보가 필요한데, 로그인 전에는 그 정보에 접근이 안 돼
#    조용히 죽는다. 로그인 직후가 실제로 동작하는 시점이다.
# 변수 이름에 주의: 파라미터가 $Action 이고 PowerShell 변수는 대소문자를
# 구분하지 않는다. 여기서 $action 을 쓰면 파라미터에 붙은 [ValidateSet]·[string]
# 제약이 그대로 적용돼 "MSFT_TaskExecAction 값은 올바른 값이 아니므로" 오류가 난다.
# 그래서 $taskAction / $taskTrigger / $taskSettings 로 따로 둔다.
$taskAction   = New-ScheduledTaskAction -Execute 'powershell.exe' `
                  -Argument ("-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"{0}`" -Action run" -f $Self)
$taskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries `
                  -DontStopIfGoingOnBatteries -StartWhenAvailable `
                  -ExecutionTimeLimit ([TimeSpan]::Zero) `
                  -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

# 계정 이름이 한글이면 -User 지정이 거부되는 경우가 있어, 실패하면 사용자 지정
# 없이 다시 시도한다(1인 PC에서는 동작이 같다).
try {
    $taskTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    Register-ScheduledTask -TaskName $TaskName -Action $taskAction -Trigger $taskTrigger `
        -Settings $taskSettings -Description 'BalmyGarden 트레이딩 서버 자동 실행' | Out-Null
} catch {
    Write-Host ("      [알림] 사용자 지정 등록 실패 — 사용자 지정 없이 재시도합니다. ({0})" -f $_.Exception.Message)
    $taskTrigger = New-ScheduledTaskTrigger -AtLogOn
    Register-ScheduledTask -TaskName $TaskName -Action $taskAction -Trigger $taskTrigger `
        -Settings $taskSettings -Description 'BalmyGarden 트레이딩 서버 자동 실행' | Out-Null
}
Write-Host ("[5/6] 자동 실행 등록        작업 이름: {0} (로그인 시)" -f $TaskName)

# 5) 지금 한 번 띄워서 실제로 되는지 확인
Write-Host '[6/6] 지금 한 번 실행해서 확인합니다...'

if (Test-ServerUp) {
    Write-Host '      이미 실행 중입니다 - 중복 실행하지 않습니다.'
    $ok = $true
} else {
    try { Start-Server } catch { Write-Host ("      [주의] 실행 시도 실패: {0}" -f $_.Exception.Message) }

    # 거래 라이브러리(pandas 등)를 불러오는 서버는 첫 기동이 10초를 넘길 수
    # 있다. 6초만 기다리다 "응답 없음"으로 단정하면 멀쩡히 뜬 서버를 실패로
    # 오인한다. 40초까지 기다리되, 뜨는 즉시 빠져나간다.
    $ok = $false
    Write-Host -NoNewline '      기다리는 중'
    foreach ($i in 1..40) {
        if (Test-ServerUp) { $ok = $true; break }
        Start-Sleep -Seconds 1
        if ($i % 5 -eq 0) { Write-Host -NoNewline '.' }
    }
    Write-Host ''
}

if ($ok) {
    Write-Host '      [확인] localhost:5000 응답 정상'
} else {
    Write-Host '      [주의] 40초 안에 포트가 열리지 않았습니다. 아래 기록을 확인하세요:'
    Write-Host ("             {0}" -f $OutLog)
    Write-Host ("             {0}" -f $ErrLog)
    if (Test-Path $ErrLog) {
        # 라벨 주의: 파이썬 서버는 정상 시작 메시지도 stderr 로 보낸다.
        # ("Running on http://127.0.0.1:5000" 같은 줄) 그래서 "오류 로그"가
        # 아니라 "서버 출력"이라고 적는다 - 정상 로그를 오류로 오인하게 만들면
        # 멀쩡한 상태를 고장으로 착각한다.
        $tail = Get-Content $ErrLog -Tail 15 -ErrorAction SilentlyContinue
        if ($tail) {
            Write-Host ''
            Write-Host '      --- 서버 출력 마지막 15줄 (정상 시작 메시지도 여기 찍힙니다) ---'
            $tail | ForEach-Object { Write-Host ("      {0}" -f $_) }
        }
    }
}

# 6-2) 터널도 지금 올려서 실제로 붙는지 본다
if ($ngrok -and $domain) {
    Write-Host ''
    Write-Host '      터널을 확인합니다...'
    $pub = Get-TunnelPublicUrl
    if ($pub) {
        Write-Host ("      이미 떠 있습니다 - {0}" -f $pub)
    } elseif (-not $ok) {
        # 서버가 안 떴는데 터널만 올리면 터널은 붙어도 502만 돌려준다.
        # 원인을 서버 쪽에 남겨두는 게 낫다.
        Write-Host '      [건너뜀] 서버가 아직 안 떠서 터널을 올리지 않았습니다.'
    } else {
        $r = Start-Tunnel -TunnelDomain $domain
        if ($r -ne '시작됨') {
            Write-Host ("      [주의] 터널을 시작하지 못했습니다 ({0})" -f $r)
        } else {
            Write-Host -NoNewline '      기다리는 중'
            foreach ($i in 1..30) {
                $pub = Get-TunnelPublicUrl
                if ($pub) { break }
                Start-Sleep -Seconds 1
                if ($i % 5 -eq 0) { Write-Host -NoNewline '.' }
            }
            Write-Host ''
            if ($pub) {
                Write-Host ("      [확인] 터널 연결됨 - {0}" -f $pub)
            } else {
                Write-Host '      [주의] 30초 안에 터널이 붙지 않았습니다. 아래 기록을 확인하세요:'
                Write-Host ("             {0}" -f $TunnelOut)
                $ttail = Get-Content $TunnelOut -Tail 10 -ErrorAction SilentlyContinue
                if ($ttail) { $ttail | ForEach-Object { Write-Host ("      {0}" -f $_) } }
            }
        }
    }

    # 여기까지 왔으면 실제 공개 주소를 알고 있다. Vercel 에 등록된 값과 다르면
    # 화면은 계속 404 로 보인다 - 그래서 값을 그대로 찍어준다.
    if ($pub) {
        Write-Host ''
        Write-Host ("      Vercel 환경변수 TRADING_SERVER_URL 값이 이것과 같아야 합니다: {0}" -f $pub)
    }
}

Write-Host ''
Write-Host '============================================================'
Write-Host ' 등록 완료'
Write-Host ''
Write-Host ' - 다음 부팅부터 로그인하면 서버와 터널이 같이 자동으로 뜹니다.'
Write-Host ("  - 서버 로그: {0}" -f $OutLog)
Write-Host ("  - 터널 로그: {0}" -f $TunnelOut)
Write-Host ' - 해제하려면: trading-autostart-uninstall.bat 실행'
Write-Host ''
Write-Host ' 참고: 자동 실행은 PC를 켜두면 트레이딩 서버가 계속 떠 있다는 뜻입니다.'
Write-Host '       실계좌에 연결돼 있으므로, 자리를 비울 때 돌려도 되는 상태인지는'
Write-Host '       대표님이 판단하셔야 합니다.'
Write-Host '============================================================'
