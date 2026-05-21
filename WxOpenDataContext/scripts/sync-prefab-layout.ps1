$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $ScriptDir "sync-prefab-layout.js")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
