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

# 轻量开放域：仅保留 laya.opendata.js，移除 UI2 完整引擎产物
$OpenDataLib = Join-Path $PSScriptRoot "libs\laya.opendata.js"
if (-not (Test-Path $OpenDataLib)) {
    Write-Error "Missing lightweight engine: $OpenDataLib"
}

$libsDir = Join-Path $TargetDir "libs"
if (-not (Test-Path $libsDir)) {
    New-Item -ItemType Directory -Path $libsDir -Force | Out-Null
}

$heavyLibs = @(
    "laya.core.js",
    "laya.webgl_2D.js",
    "laya.ui2.js",
    "laya.adapter-weixin.js"
)
foreach ($lib in $heavyLibs) {
    $path = Join-Path $libsDir $lib
    if (Test-Path $path) {
        Remove-Item -Path $path -Force
    }
}
Copy-Item -Path $OpenDataLib -Destination (Join-Path $libsDir "laya.opendata.js") -Force

$removePaths = @(
    "internal",
    "prefab",
    "image",
    "Scene.ls",
    "fileconfig.json",
    "game.js",
    (Join-Path "js" "index.js")
)
foreach ($relPath in $removePaths) {
    $path = Join-Path $TargetDir $relPath
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
    }
}

Write-Host "Deployed lightweight open data context to: $TargetDir"
