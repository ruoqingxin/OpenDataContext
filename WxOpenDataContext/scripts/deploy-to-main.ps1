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
    Write-Error "未找到构建输出目录。请先在 Laya IDE 中构建微信小游戏（开放数据域），或指定 -SourceDir 参数。"
}

Write-Host "源目录: $SourceDir"
Write-Host "目标目录: $TargetDir"

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

# 保留 wx 适配文件
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

Copy-Item -Path (Join-Path $SourceDir "*") -Destination $TargetDir -Recurse -Force

# 若构建产物使用 game.js 作为入口，补充标准 index.js
$indexPath = Join-Path $TargetDir "index.js"
$gameJsPath = Join-Path $TargetDir "game.js"
if (-not (Test-Path $indexPath) -and (Test-Path $gameJsPath)) {
    @"
require("./game.js");
"@ | Set-Content -Path $indexPath -Encoding UTF8
}

Write-Host "开放域已部署到: $TargetDir"
Write-Host "请在微信开发者工具中重新编译主工程进行验证。"
