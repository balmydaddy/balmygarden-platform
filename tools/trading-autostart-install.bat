@echo off
chcp 65001 > nul
REM ============================================================
REM  트레이딩 서버 부팅 자동 실행 등록 (Windows)
REM
REM  사용법: 이 파일을 server.py 와 같은 폴더에 두고 더블클릭.
REM          명령어를 칠 필요 없다. 한 번만 실행하면 된다.
REM
REM  하는 일:
REM    1) 같은 폴더에서 server.py 를 찾는다
REM    2) 파이썬 실행기를 찾는다 (py 런처 우선, 없으면 python)
REM    3) 창 없이 띄우는 실행 스크립트를 만든다
REM    4) "로그인 시 자동 실행" 작업을 작업 스케줄러에 등록한다
REM    5) 지금 바로 한 번 띄워서 실제로 뜨는지 확인한다
REM
REM  왜 "부팅 시"가 아니라 "로그인 시"인가:
REM    트레이딩 서버는 계정에 저장된 API 키·인증 정보가 필요하다.
REM    로그인 전(부팅 직후)에는 그 정보에 접근이 안 돼 조용히 죽는다.
REM    로그인 직후 실행이 실제로 동작하는 유일한 시점이다.
REM ============================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

set TASKNAME=BalmyGarden_TradingServer
set SERVER=%~dp0server.py
set LAUNCHER=%~dp0trading-server-run.vbs
set LOGFILE=%~dp0trading-server.log

echo ============================================================
echo  트레이딩 서버 자동 실행 등록
echo ============================================================
echo.

REM ── 1) server.py 확인 ────────────────────────────────────────
if not exist "%SERVER%" (
  echo [실패] 이 폴더에 server.py 가 없습니다.
  echo        현재 폴더: %~dp0
  echo.
  echo        이 파일을 server.py 가 있는 폴더로 옮긴 뒤 다시 실행하세요.
  echo.
  pause
  exit /b 1
)
echo [1/5] server.py 확인          %SERVER%

REM ── 2) 파이썬 찾기 ───────────────────────────────────────────
set PYEXE=
where pyw >nul 2>&1 && set PYEXE=pyw
if "!PYEXE!"=="" ( where pythonw >nul 2>&1 && set PYEXE=pythonw )
if "!PYEXE!"=="" ( where py >nul 2>&1 && set PYEXE=py )
if "!PYEXE!"=="" ( where python >nul 2>&1 && set PYEXE=python )

if "!PYEXE!"=="" (
  echo [실패] 파이썬을 찾지 못했습니다.
  echo        python.org 에서 설치할 때 "Add python.exe to PATH" 를 체크하세요.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%P in ('where !PYEXE! 2^>nul') do set PYPATH=%%P& goto :gotpy
:gotpy
echo [2/5] 파이썬 확인             !PYEXE!  ^(!PYPATH!^)

REM ── 3) 창 없이 띄우는 실행 스크립트 생성 ─────────────────────
REM     .bat 로 등록하면 검은 콘솔 창이 계속 떠 있어 거슬리고,
REM     실수로 닫으면 서버가 같이 죽는다. VBS 로 숨겨서 띄운다.
>  "%LAUNCHER%" echo ' BalmyGarden 트레이딩 서버 런처 - trading-autostart-install.bat 이 자동 생성함
>> "%LAUNCHER%" echo ' 직접 수정하지 마세요. 다시 만들려면 설치 배치를 다시 실행하면 됩니다.
>> "%LAUNCHER%" echo Set sh = CreateObject("WScript.Shell")
>> "%LAUNCHER%" echo sh.CurrentDirectory = "%~dp0"
>> "%LAUNCHER%" echo sh.Run "cmd /c """"!PYPATH!"" ""%SERVER%"" ^>^> ""%LOGFILE%"" 2^>^&1""", 0, False
echo [3/5] 실행 스크립트 생성      %LAUNCHER%

REM ── 4) 작업 스케줄러 등록 ────────────────────────────────────
REM     기존 등록이 있으면 지우고 다시 만든다(경로가 바뀌었을 수 있다).
schtasks /query /tn "%TASKNAME%" >nul 2>&1 && schtasks /delete /tn "%TASKNAME%" /f >nul 2>&1

schtasks /create /tn "%TASKNAME%" /tr "wscript.exe \"%LAUNCHER%\"" /sc onlogon /rl highest /f >nul 2>&1
if errorlevel 1 (
  echo.
  echo [실패] 작업 스케줄러 등록에 실패했습니다.
  echo        이 파일을 마우스 오른쪽 클릭 - "관리자 권한으로 실행" 으로 다시 실행해보세요.
  echo.
  pause
  exit /b 1
)
echo [4/5] 자동 실행 등록 완료     작업 이름: %TASKNAME% ^(로그인 시^)

REM ── 5) 지금 한 번 띄워서 실제로 되는지 확인 ──────────────────
echo [5/5] 지금 한 번 실행해서 확인합니다...
tasklist /fi "imagename eq python.exe" 2>nul | find /i "python.exe" >nul && (
  echo       이미 실행 중인 파이썬이 있습니다 - 중복 실행을 피해 건너뜁니다.
  goto :done
)

wscript.exe "%LAUNCHER%"
powershell -NoProfile -Command ^
  "$ok=$false; 1..12 ^| ForEach-Object { Start-Sleep -Milliseconds 500; if (-not $ok) { try { $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/status' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { $ok=$true } } catch {} } }; if ($ok) { Write-Host '      [확인] localhost:5000 응답 정상' } else { Write-Host '      [주의] 6초 안에 응답이 없습니다. 아래 로그를 확인하세요:'; Write-Host '             %LOGFILE%' }"

:done
echo.
echo ============================================================
echo  등록 완료
echo.
echo  - 다음 부팅부터 로그인하면 자동으로 뜹니다.
echo  - 서버 로그:  %LOGFILE%
echo  - 해제하려면: trading-autostart-uninstall.bat 실행
echo.
echo  참고: 자동 실행은 PC를 켜두면 트레이딩 서버가 계속 떠 있다는 뜻입니다.
echo        실계좌에 연결돼 있으므로, 자리를 비울 때 돌려도 되는 상태인지는
echo        대표님이 판단하셔야 합니다.
echo ============================================================
echo.
pause
endlocal
