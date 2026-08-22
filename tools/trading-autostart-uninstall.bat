@echo off
REM Thin launcher - all logic lives in trading-autostart.ps1
REM This file is intentionally ASCII-only: cmd reads .bat in the system
REM codepage (CP949 here), and Korean bytes break the parser.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0trading-autostart.ps1" -Action uninstall
pause
