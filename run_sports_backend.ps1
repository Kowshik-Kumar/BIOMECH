$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $projectRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $python)) {
    $python = 'python'
}

Set-Location $projectRoot
& $python -m uvicorn sports_api:app --host 0.0.0.0 --port 8001 --reload
