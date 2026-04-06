@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
set "PYTHON=%PROJECT_ROOT%.venv\Scripts\python.exe"

if not exist "%PYTHON%" set "PYTHON=python"

cd /d "%PROJECT_ROOT%"
"%PYTHON%" "%PROJECT_ROOT%camera_api.py"
