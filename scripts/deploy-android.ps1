param(
  [ValidateSet("apk", "aab", "both")]
  [string]$Target = "both"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "Preparing icons..." -ForegroundColor Cyan
pwsh -ExecutionPolicy Bypass -File ".\scripts\prepare-icons.ps1"

if ($Target -eq "apk" -or $Target -eq "both") {
  Write-Host "Starting APK build (EAS profile: preview)..." -ForegroundColor Cyan
  npx eas-cli build --platform android --profile preview --non-interactive --no-wait

  if ($LASTEXITCODE -ne 0) {
    throw "APK build command failed."
  }
}

if ($Target -eq "aab" -or $Target -eq "both") {
  Write-Host "Starting AAB build (EAS profile: production)..." -ForegroundColor Cyan
  npx eas-cli build --platform android --profile production --non-interactive --no-wait

  if ($LASTEXITCODE -ne 0) {
    throw "AAB build command failed."
  }
}

Write-Host "Deploy commands finished." -ForegroundColor Green
