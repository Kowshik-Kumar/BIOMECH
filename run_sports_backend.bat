@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
set "PYTHON=%PROJECT_ROOT%.venv\Scripts\python.exe"

if not exist "%PYTHON%" set "PYTHON=python"

cd /d "%PROJECT_ROOT%"
"%PYTHON%" -m uvicorn sports_api:app --host 0.0.0.0 --port 8001 --reload
