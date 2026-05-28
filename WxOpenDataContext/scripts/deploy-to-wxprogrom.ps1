# 将开放域脚本与资源部署到微信小游戏 openDataContext 目录
#
# 用法（在 WxOpenDataContext 项目根目录）：
#   .\scripts\deploy-to-wxprogrom.ps1
#   .\scripts\deploy-to-wxprogrom.ps1 -TargetDir "E:\yourGame\openDataContext"
#   .\scripts\deploy-to-wxprogrom.ps1 -PoolClientAssets "F:\PoolBallNew\client2\assets"
#
# 部署前若 prefab 比 style.js 新会报错，请先： node scripts\sync-prefab-layout.js
# 详见项目根目录 EXPORT.md
param(
    [string]$TargetDir = "E:\BallOpenDataContext\WxProgrom\openDataContext",
    [string]$PoolClientAssets = "F:\PoolBallNew\client2\assets"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$srcOd = Join-Path $root "scripts\openDataContext"
$srcEngine = Join-Path $root "scripts\libs\engine.js"
$srcImg = Join-Path $root "assets\image"
$prefabPath = Join-Path $root "assets\prefab\UISocialInviteView.lh"
$stylePath = Join-Path $srcOd "views\inviteFriend\render\style.js"

if (-not (Test-Path $srcOd)) { throw "Missing source: $srcOd" }
if (-not (Test-Path $srcEngine)) { throw "Missing engine: $srcEngine" }

if ((Test-Path $prefabPath) -and (Test-Path $stylePath)) {
    if ((Get-Item $prefabPath).LastWriteTime -gt (Get-Item $stylePath).LastWriteTime) {
        throw "prefab 比 style.js 新，请先运行: node scripts\sync-prefab-layout.js"
    }
}

function Get-ViewImageNames {
    param([string]$OpenDataRoot)

    $names = New-Object System.Collections.Generic.HashSet[string]
    $viewsRoot = Join-Path $OpenDataRoot "views"
    if (-not (Test-Path $viewsRoot)) {
        return @()
    }

    Get-ChildItem $viewsRoot -Recurse -Filter "assets.js" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        foreach ($m in [regex]::Matches($content, 'image/([^"]+\.png)')) {
            [void]$names.Add($m.Groups[1].Value)
        }
    }

    return @($names)
}

if (Test-Path $TargetDir) { Remove-Item $TargetDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path (Join-Path $TargetDir "image") | Out-Null

Get-ChildItem $srcOd -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($srcOd.Length + 1)
    $dest = Join-Path $TargetDir $rel
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    Copy-Item $_.FullName $dest -Force
}
Copy-Item $srcEngine (Join-Path $TargetDir "engine.js") -Force

$imageNames = Get-ViewImageNames $srcOd
if ($imageNames.Count -eq 0) {
    $imageNames = @("icon_800000.png", "ui_btn_ty_g2.png", "ui_frame_qswj_d.png")
}

foreach ($name in $imageNames) {
    $p = Join-Path $srcImg $name
    if (Test-Path $p) { Copy-Item $p (Join-Path $TargetDir "image\$name") -Force }
}

$poolOverrides = @{
    "ui_btn_ty_g2.png"      = Join-Path $PoolClientAssets "ui\atlas\common\button\newbutton\ui_btn_ty_g2.png"
    "ui_frame_qswj_d.png"   = Join-Path $PoolClientAssets "ui\atlas\module\poolGameRoom\roomCreateNew\ui_frame_qswj_d.png"
    "icon_800000.png"       = Join-Path $PoolClientAssets "ui\image\headIcon\icon_800000.png"
}
foreach ($kv in $poolOverrides.GetEnumerator()) {
    if ($imageNames -contains $kv.Key -and (Test-Path $kv.Value)) {
        Copy-Item $kv.Value (Join-Path $TargetDir "image\$($kv.Key)") -Force
    }
}

Write-Host "Deployed openDataContext -> $TargetDir"
Get-ChildItem $TargetDir -Recurse | ForEach-Object { Write-Host "  $($_.FullName)" }
