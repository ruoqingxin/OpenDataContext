param(
    [string]$SourceDir = "",
    [string]$TargetDir = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$MainRoot = Split-Path -Parent $ProjectRoot

if (-not $SourceDir) {
    $candidates = @(
        (Join-Path $ProjectRoot "release\wxgame"),
        (Join-Path $ProjectRoot "release\weixinminigame"),
        (Join-Path $ProjectRoot "release\wxminigame"),
        (Join-Path $ProjectRoot "release\web")
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            $SourceDir = $candidate
            break
        }
    }
}

if (-not $TargetDir) {
    $TargetDir = Join-Path $MainRoot "openDataContext"
}

if (-not (Test-Path $SourceDir)) {
    Write-Error "Build output not found. Build wxgame in Laya IDE first, or pass -SourceDir."
}

Write-Host "Source: $SourceDir"
Write-Host "Target: $TargetDir"

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$keepFiles = @("weapp-adapter.js")
$existing = Get-ChildItem -Path $TargetDir -Force -ErrorAction SilentlyContinue
foreach ($item in $existing) {
    if ($item.Name -in $keepFiles) {
        continue
    }
    if ($item.PSIsContainer) {
        Remove-Item -Path $item.FullName -Recurse -Force
    } else {
        Remove-Item -Path $item.FullName -Force
    }
}

& (Join-Path $PSScriptRoot "patch-release-entry.ps1") -ReleaseDir $SourceDir

Copy-Item -Path (Join-Path $SourceDir "*") -Destination $TargetDir -Recurse -Force

$EntryTemplate = Join-Path $PSScriptRoot "openDataContext-index.js"
Copy-Item -Path $EntryTemplate -Destination (Join-Path $TargetDir "index.js") -Force

Write-Host "Deployed to: $TargetDir"
