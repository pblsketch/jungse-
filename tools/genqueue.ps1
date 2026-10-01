<#
.SYNOPSIS
  Run a TSV manifest of image jobs sequentially through tools/gen.ps1.

.DESCRIPTION
  Manifest columns (tab separated, header line optional, '#' lines ignored):
    name   size   refs   prompt
  - name   : output base name -> <OutDir>\<name>.png
  - size   : 1024x1024 | 1536x1024 | 1024x1536
  - refs   : ';'-separated reference images. Each is a repo-relative/absolute path, or the
             name of an earlier job in this manifest (its <OutDir>\<name>.png is used).
  - prompt : ASCII prompt file (repo-relative, or relative to the manifest folder)
  Jobs whose output already exists are skipped. Failed jobs (and jobs waiting for a reference
  that is not generated yet) are retried in later passes (-Passes).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tools/genqueue.ps1 -Manifest tools/prompts/sample_manifest.tsv -DryRun
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Manifest,
  [string]$OutDir = '',
  [ValidateSet('low', 'medium', 'high')][string]$Quality = 'high',
  [int]$Retries = 3,
  [int]$WaitOnLimitSec = 600,
  [int]$Passes = 2,
  [string[]]$Only = @(),
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$gen = Join-Path $PSScriptRoot 'gen.ps1'
if (-not $OutDir) { $OutDir = Join-Path $RepoRoot 'assets\raw\gen' }
elseif (-not [System.IO.Path]::IsPathRooted($OutDir)) { $OutDir = Join-Path $RepoRoot $OutDir }
$mf = if ([System.IO.Path]::IsPathRooted($Manifest)) { $Manifest } else { Join-Path $RepoRoot $Manifest }
if (-not (Test-Path -LiteralPath $mf)) { [Console]::Error.WriteLine("manifest not found: $mf"); exit 2 }
$mfDir = Split-Path -Parent $mf

$jobs = @()
$lineNo = 0
foreach ($line in [System.IO.File]::ReadAllLines($mf)) {
  $lineNo++
  if (-not $line.Trim() -or $line.TrimStart().StartsWith('#')) { continue }
  $c = $line.Split("`t")
  if ($c[0].Trim() -eq 'name') { continue }
  if ($c.Count -lt 4) { [Console]::Error.WriteLine("line ${lineNo}: need 4 tab-separated columns"); exit 2 }
  $jobs += [pscustomobject]@{ Name = $c[0].Trim(); Size = $c[1].Trim(); Refs = $c[2].Trim(); Prompt = $c[3].Trim() }
}
if ($Only.Count) { $jobs = @($jobs | Where-Object { $Only -contains $_.Name }) }
$names = @($jobs | ForEach-Object { $_.Name })

function Resolve-In([string]$p, [string[]]$bases) {
  if ([System.IO.Path]::IsPathRooted($p)) { if (Test-Path -LiteralPath $p) { return $p } else { return $null } }
  foreach ($b in $bases) { $q = Join-Path $b $p; if (Test-Path -LiteralPath $q) { return $q } }
  return $null
}

$done = @{}; $failed = @{}
for ($pass = 1; $pass -le $Passes; $pass++) {
  $pending = @($jobs | Where-Object { -not $done.ContainsKey($_.Name) })
  if (-not $pending.Count) { break }
  Write-Host "=== pass $pass : $($pending.Count) job(s) ==="
  foreach ($j in $pending) {
    $out = Join-Path $OutDir ($j.Name + '.png')
    if (Test-Path -LiteralPath $out) { Write-Host "SKIP $($j.Name) (exists)"; $done[$j.Name] = 'exists'; continue }
    $pf = Resolve-In $j.Prompt @($RepoRoot, $mfDir)
    if (-not $pf) { Write-Host "FAIL $($j.Name): prompt file not found ($($j.Prompt))"; $failed[$j.Name] = 'no prompt'; continue }
    $refs = @(); $missing = @()
    foreach ($r in ($j.Refs -split ';')) {
      $r = $r.Trim(); if (-not $r) { continue }
      $rp = Resolve-In $r @($RepoRoot, $mfDir)
      if (-not $rp -and $names -contains $r) {
        $cand = Join-Path $OutDir ($r + '.png')
        if (Test-Path -LiteralPath $cand) { $rp = $cand }
      }
      if ($rp) { $refs += $rp } else { $missing += $r }
    }
    if ($missing.Count -and -not $DryRun) {
      Write-Host "WAIT $($j.Name): reference(s) not available yet: $($missing -join ', ')"
      $failed[$j.Name] = 'missing ref'; continue
    }
    $gargs = @{ PromptFile = $pf; Out = $out; Size = $j.Size; Quality = $Quality; Retries = $Retries; WaitOnLimitSec = $WaitOnLimitSec }
    if ($refs.Count) { $gargs.Ref = $refs }
    if ($DryRun) { $gargs.DryRun = $true }
    & $gen @gargs | Out-Host
    $code = $LASTEXITCODE
    if ($code -eq 0) {
      if ($DryRun) { Write-Host "DRY  $($j.Name) refs=[$($refs -join '; ')] missing=[$($missing -join ', ')]" }
      else { Write-Host "OK   $($j.Name)" }
      $done[$j.Name] = 'ok'; $failed.Remove($j.Name)
    }
    else { Write-Host "FAIL $($j.Name) (exit $code)"; $failed[$j.Name] = "exit $code" }
  }
}

Write-Host "`n=== summary: $($done.Count) done, $($failed.Count) failed ==="
foreach ($k in $failed.Keys) { Write-Host "  failed: $k ($($failed[$k]))" }
if ($failed.Count) { exit 1 } else { exit 0 }
