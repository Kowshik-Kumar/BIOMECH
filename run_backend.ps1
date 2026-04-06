$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $projectRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $python)) {
    $python = 'python'
}

Set-Location $projectRoot
& $python (Join-Path $projectRoot 'camera_api.py')