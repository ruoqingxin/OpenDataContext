param(
    [string]$ReleaseDir = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EntryTemplate = Join-Path $PSScriptRoot "openDataContext-index.js"

if (-not $ReleaseDir) {
    $candidates = @(
        (Join-Path $ProjectRoot "release\wxgame"),
        (Join-Path $ProjectRoot "release\weixinminigame"),
        (Join-Path $ProjectRoot "release\wxminigame")
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            $ReleaseDir = $candidate
            break
        }
    }
}

if (-not $ReleaseDir -or -not (Test-Path $ReleaseDir)) {
    Write-Error "Build output not found. Build wxgame in Laya IDE first."
}

$bundlePath = Join-Path $ReleaseDir "js\bundle.js"
if (-not (Test-Path $bundlePath)) {
    Write-Error "js/bundle.js not found. Build the project first."
}

$indexPath = Join-Path $ReleaseDir "index.js"
Copy-Item -Path $EntryTemplate -Destination $indexPath -Force

Write-Host "Generated open data entry: $indexPath"
