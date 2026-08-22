@echo off
chcp 65001 > nul
REM ============================================================
REM  트레이딩 서버 자동 실행 해제
REM  사용법: 더블클릭. 등록된 자동 실행만 지운다.
REM          server.py 나 로그 파일은 건드리지 않는다.
REM ============================================================

set TASKNAME=BalmyGarden_TradingServer

echo 자동 실행 등록을 해제합니다...
schtasks /query /tn "%TASKNAME%" >nul 2>&1
if errorlevel 1 (
  echo   등록된 작업이 없습니다. 이미 해제된 상태입니다.
) else (
  schtasks /delete /tn "%TASKNAME%" /f >nul 2>&1
  if errorlevel 1 (
    echo   [실패] 삭제하지 못했습니다. 관리자 권한으로 다시 실행해보세요.
  ) else (
    echo   해제 완료 - 다음 부팅부터 자동으로 뜨지 않습니다.
  )
)

echo.
echo 지금 떠 있는 서버는 그대로 돌아갑니다.
echo 지금 바로 끄려면 작업 관리자에서 python 프로세스를 종료하세요.
echo.
pause
