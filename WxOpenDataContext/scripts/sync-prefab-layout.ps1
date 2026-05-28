# 根据 .lh prefab 同步 inviteFriend/render 下的 style.js、assets.js、tplfn.js
#
# 用法（在 WxOpenDataContext 项目根目录）：
#   .\scripts\sync-prefab-layout.ps1
#   node scripts\sync-prefab-layout.js
# 详见项目根目录 EXPORT.md
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $ScriptDir "sync-prefab-layout.js") @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
