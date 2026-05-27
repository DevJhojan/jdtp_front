$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$source = Resolve-Path "assets/NewsIcons/Justice_Driven_Task_Power-removebg-preview.png"

function Resize-And-Save {
  param(
    [string]$InputPath,
    [string]$OutputPath,
    [int]$Size
  )

  $srcImg = [System.Drawing.Image]::FromFile($InputPath)
  $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)

  $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $gfx.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $gfx.Clear([System.Drawing.Color]::Transparent)
  $gfx.DrawImage($srcImg, 0, 0, $Size, $Size)

  $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $gfx.Dispose()
  $bmp.Dispose()
  $srcImg.Dispose()
}

Resize-And-Save $source "assets/icon.png" 1024
Resize-And-Save $source "assets/android-icon-foreground.png" 432
Resize-And-Save $source "assets/android-icon-background.png" 432
Resize-And-Save $source "assets/android-icon-monochrome.png" 432
Resize-And-Save $source "assets/favicon.png" 256
Resize-And-Save $source "assets/splash-icon.png" 1242

Write-Host "Icon assets prepared for deploy." -ForegroundColor Green
