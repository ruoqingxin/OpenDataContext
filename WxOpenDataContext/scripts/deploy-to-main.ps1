param(
    [string]$SourceDir = "",
    [string]$TargetDir = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$MainRoot = Split-Path -Parent $ProjectRoot

if (-not $SourceDir) {
    foreach ($name in @("release\wxgame", "release\weixinminigame", "release\wxminigame")) {
        $candidate = Join-Path $ProjectRoot $name
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

$bundlePath = Join-Path $SourceDir "js\bundle.js"
if (-not (Test-Path $bundlePath)) {
    Write-Error "js/bundle.js not found in build output."
}

$prefabPath = Join-Path $ProjectRoot "assets\prefab\UISocialInviteView.lh"
$viewTsPath = Join-Path $ProjectRoot "src\opendata\UISocialInviteView.ts"
$assetsTsPath = Join-Path $ProjectRoot "src\opendata\OpenDataAssets.ts"
$bundleTime = (Get-Item $bundlePath).LastWriteTimeUtc
$staleSources = @($prefabPath, $viewTsPath, $assetsTsPath) | Where-Object {
    Test-Path $_ -and (Get-Item $_).LastWriteTimeUtc -gt $bundleTime
}
if ($staleSources.Count -gt 0) {
    Write-Error @(
        "bundle.js is stale. If you changed the prefab, run sync-prefab-layout.ps1 first, rebuild in Laya IDE, then deploy.",
        "Newer than bundle: $($staleSources -join ', ')"
    )
}

Write-Host "Source: $SourceDir"
Write-Host "Target: $TargetDir"

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

foreach ($item in Get-ChildItem -Path $TargetDir -Force -ErrorAction SilentlyContinue) {
    if ($item.Name -eq "weapp-adapter.js") { continue }
    if ($item.PSIsContainer) {
        Remove-Item -Path $item.FullName -Recurse -Force
    } else {
        Remove-Item -Path $item.FullName -Force
    }
}

Copy-Item -Path (Join-Path $SourceDir "*") -Destination $TargetDir -Recurse -Force
Copy-Item -Path (Join-Path $PSScriptRoot "openDataContext-index.js") -Destination (Join-Path $TargetDir "index.js") -Force

$OpenDataLib = Join-Path $PSScriptRoot "libs\laya.opendata.js"
if (-not (Test-Path $OpenDataLib)) {
    Write-Error "Missing lightweight engine: $OpenDataLib"
}

$libsDir = Join-Path $TargetDir "libs"
if (-not (Test-Path $libsDir)) {
    New-Item -ItemType Directory -Path $libsDir -Force | Out-Null
}

foreach ($lib in @("laya.core.js", "laya.webgl_2D.js", "laya.ui2.js", "laya.adapter-weixin.js")) {
    $path = Join-Path $libsDir $lib
    if (Test-Path $path) { Remove-Item -Path $path -Force }
}
Copy-Item -Path $OpenDataLib -Destination (Join-Path $libsDir "laya.opendata.js") -Force

foreach ($relPath in @("internal", "prefab", "Scene.ls", "fileconfig.json", "game.js", "js\index.js")) {
    $path = Join-Path $TargetDir $relPath
    if (Test-Path $path) { Remove-Item -Path $path -Recurse -Force }
}

Write-Host "Deployed lightweight open data context to: $TargetDir"
