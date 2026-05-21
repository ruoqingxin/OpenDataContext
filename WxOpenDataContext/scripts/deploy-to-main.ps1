param(
    [string]$TargetDir = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$MainRoot = Split-Path -Parent $ProjectRoot
$SourceDir = Join-Path $PSScriptRoot "openDataContext"

if (-not $TargetDir) {
    $TargetDir = Join-Path $MainRoot "openDataContext"
}

if (-not (Test-Path $SourceDir)) {
    Write-Error "Open data source not found: $SourceDir"
}

$engineSource = Join-Path $PSScriptRoot "libs\engine.js"
if (-not (Test-Path $engineSource)) {
    $npmEngine = Join-Path $PSScriptRoot "node_modules\minigame-canvas-engine\dist\index.js"
    if (Test-Path $npmEngine) {
        Copy-Item -Path $npmEngine -Destination $engineSource -Force
    } else {
        Write-Error "Missing Layout engine. Run: npm install minigame-canvas-engine --prefix `"$PSScriptRoot`""
    }
}

$prefabPath = Join-Path $ProjectRoot "assets\prefab\UISocialInviteView.lh"
$stylePath = Join-Path $SourceDir "render\style.js"
$tplfnPath = Join-Path $SourceDir "render\tplfn.js"
if ((Test-Path $prefabPath) -and (Test-Path $stylePath)) {
    if ((Get-Item $prefabPath).LastWriteTimeUtc -gt (Get-Item $stylePath).LastWriteTimeUtc) {
        Write-Error @(
            "render/style.js is stale. If you changed the prefab, run sync-prefab-layout.ps1 first, then deploy."
        )
    }
}
if ((Test-Path $prefabPath) -and (Test-Path $tplfnPath)) {
    if ((Get-Item $prefabPath).LastWriteTimeUtc -gt (Get-Item $tplfnPath).LastWriteTimeUtc) {
        Write-Error @(
            "render/tplfn.js is stale. If you changed the prefab, run sync-prefab-layout.ps1 first, then deploy."
        )
    }
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
Copy-Item -Path $engineSource -Destination (Join-Path $TargetDir "engine.js") -Force

$imageSource = Join-Path $ProjectRoot "assets\image"
$imageTarget = Join-Path $TargetDir "image"
if (-not (Test-Path $imageTarget)) {
    New-Item -ItemType Directory -Path $imageTarget -Force | Out-Null
}
Get-ChildItem -Path $imageSource -Filter "*.png" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $imageTarget -Force
}

$adapterSource = Join-Path $MainRoot "openDataContext\weapp-adapter.js"
if (-not (Test-Path $adapterSource)) {
    $adapterSource = Join-Path $TargetDir "weapp-adapter.js"
}
if (-not (Test-Path (Join-Path $TargetDir "weapp-adapter.js")) -and (Test-Path $adapterSource)) {
    Copy-Item -Path $adapterSource -Destination (Join-Path $TargetDir "weapp-adapter.js") -Force
}

Write-Host "Deployed Layout open data context to: $TargetDir"
