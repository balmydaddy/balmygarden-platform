param([ValidateSet('install','uninstall','run')][string]$Action = 'install')

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Here     = Split-Path -Parent $MyInvocation.MyCommand.Path
$Server   = Join-Path $Here 'server.py'
$OutLog   = Join-Path $Here 'trading-server.log'
$ErrLog   = Join-Path $Here 'trading-server.error.log'
$TaskName = 'BalmyGarden_TradingServer'
$Self     = $MyInvocation.MyCommand.Path

function Find-Python {
    # pythonw / pyw 는 콘솔 창이 없다. 없으면 python / py 로 떨어진다.
    foreach ($n in @('pythonw','pyw','python','py')) {
        $c = Get-Command $n -ErrorAction SilentlyContinue
        if ($c) { return $c.Source }
    }
    return $null
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

# ── run: 작업 스케줄러가 부르는 실행 모드 ────────────────────────────
if ($Action -eq 'run') {
    Start-Server
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
    Write-Host '지금 떠 있는 서버는 그대로 돌아갑니다.'
    Write-Host '지금 끄려면 작업 관리자에서 python 프로세스를 종료하세요.'
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
Write-Host ("[1/5] server.py 확인        {0}" -f $Server)

# 2) 파이썬
$py = Find-Python
if (-not $py) {
    Write-Host '[실패] 파이썬을 찾지 못했습니다.'
    Write-Host '       python.org 에서 설치할 때 "Add python.exe to PATH" 를 체크하세요.'
    exit 1
}
Write-Host ("[2/5] 파이썬 확인           {0}" -f $py)

# 3) 기존 등록 정리 — 경로가 바뀌었을 수 있으므로 지우고 다시 만든다
$old = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($old) { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false }
Write-Host '[3/5] 기존 등록 정리        완료'

# 4) 로그인 시 자동 실행 등록
#    "부팅 시"가 아니라 "로그인 시"인 이유: 트레이딩 서버는 계정에 저장된
#    API 키·인증 정보가 필요한데, 로그인 전에는 그 정보에 접근이 안 돼
#    조용히 죽는다. 로그인 직후가 실제로 동작하는 시점이다.
$action  = New-ScheduledTaskAction -Execute 'powershell.exe' `
             -Argument ("-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"{0}`" -Action run" -f $Self)
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$set     = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries `
             -DontStopIfGoingOnBatteries -StartWhenAvailable `
             -ExecutionTimeLimit ([TimeSpan]::Zero) `
             -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Settings $set -Description 'BalmyGarden 트레이딩 서버 자동 실행' | Out-Null
Write-Host ("[4/5] 자동 실행 등록        작업 이름: {0} (로그인 시)" -f $TaskName)

# 5) 지금 한 번 띄워서 실제로 되는지 확인
Write-Host '[5/5] 지금 한 번 실행해서 확인합니다...'
try { Start-Server } catch { Write-Host ("      [주의] 실행 시도 실패: {0}" -f $_.Exception.Message) }

$ok = $false
foreach ($i in 1..12) {
    Start-Sleep -Milliseconds 500
    if ($ok) { continue }
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/status' -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ok = $true }
    } catch { }
}
if ($ok) {
    Write-Host '      [확인] localhost:5000 응답 정상'
} else {
    Write-Host '      [주의] 6초 안에 응답이 없습니다. 아래 로그를 확인하세요:'
    Write-Host ("             {0}" -f $OutLog)
    Write-Host ("             {0}" -f $ErrLog)
    if (Test-Path $ErrLog) {
        $tail = Get-Content $ErrLog -Tail 15 -ErrorAction SilentlyContinue
        if ($tail) { Write-Host ''; Write-Host '      --- 오류 로그 마지막 15줄 ---'; $tail | ForEach-Object { Write-Host ("      {0}" -f $_) } }
    }
}

Write-Host ''
Write-Host '============================================================'
Write-Host ' 등록 완료'
Write-Host ''
Write-Host ' - 다음 부팅부터 로그인하면 자동으로 뜹니다.'
Write-Host ("  - 서버 로그: {0}" -f $OutLog)
Write-Host ' - 해제하려면: trading-autostart-uninstall.bat 실행'
Write-Host ''
Write-Host ' 참고: 자동 실행은 PC를 켜두면 트레이딩 서버가 계속 떠 있다는 뜻입니다.'
Write-Host '       실계좌에 연결돼 있으므로, 자리를 비울 때 돌려도 되는 상태인지는'
Write-Host '       대표님이 판단하셔야 합니다.'
Write-Host '============================================================'
