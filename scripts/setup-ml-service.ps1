param([switch]$Recreate)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$mlServicePath = Join-Path $projectRoot "apps\ml-service"
$venvPath = Join-Path $mlServicePath ".venv"
$python = Join-Path $venvPath "Scripts\python.exe"
$requirements = Join-Path $mlServicePath "requirements.txt"

if (-not (Test-Path $requirements)) {
    throw "requirements.txt was not found at $requirements"
}

if ($Recreate -and (Test-Path $venvPath)) {
    Write-Host "Removing existing virtual environment..."
    Remove-Item -Recurse -Force $venvPath
}

if (-not (Test-Path $python)) {
    Write-Host "Creating Python virtual environment..."

    Push-Location $mlServicePath
    try {
        py -3 -m venv .venv

        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create virtual environment."
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host "Installing Python dependencies..."

& $python -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
    throw "Failed to upgrade pip."
}

& $python -m pip install -r $requirements
if ($LASTEXITCODE -ne 0) {
    throw "Failed to install Python dependencies."
}

Write-Host ""
Write-Host "ML service environment is ready!" -ForegroundColor Green
