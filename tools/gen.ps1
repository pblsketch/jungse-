<#
.SYNOPSIS
  Generate ONE image with the Codex CLI built-in image_gen tool (gpt-image-2).

.DESCRIPTION
  Proven recipe:
   1. isolated CODEX_HOME (%TEMP%\nm-codex-home) with a minimal config.toml and a copy of
      %USERPROFILE%\.codex\auth.json  (the user's global ~/.codex is only READ, never written)
   2. the Codex sandbox blocks shell/file reads, so the whole ASCII prompt goes INSIDE the
      instruction text
   3. the PNG appears under <CODEX_HOME>\generated_images\**\*.png; the newest file strictly
      newer than the run start is copied to -Out
   4. "at capacity" -> exponential backoff retry; usage/rate limit -> wait -WaitOnLimitSec, retry
  Every run is appended to assets/prompts.md.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tools/gen.ps1 -PromptFile tools/prompts/map_market_street.txt -Out assets/raw/gen/map_market_street.png -Size 1536x1024
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tools/gen.ps1 -Prompt "a red apple on a table" -Out assets/raw/smoke/apple.png -Size 1024x1024 -Ref design/art/x.png
#>
[CmdletBinding()]
param(
  [string]$Prompt,
  [string]$PromptFile,
  [Parameter(Mandatory = $true)][string]$Out,
  [ValidateSet('1024x1024', '1536x1024', '1024x1536')][string]$Size = '1024x1024',
  [ValidateSet('low', 'medium', 'high')][string]$Quality = 'high',
  [string[]]$Ref = @(),
  [int]$Retries = 3,
  [int]$WaitOnLimitSec = 600,
  [int]$LimitRetries = 3,
  [string]$Codex = '',
  [string]$CodexHome = (Join-Path $env:TEMP 'nm-codex-home'),
  [string]$Model = 'gpt-6-astra',
  [string]$Effort = 'medium',
  [string]$LogFile = '',
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not $LogFile) { $LogFile = Join-Path $RepoRoot 'assets\prompts.md' }

function Fail([string]$msg, [int]$code) {
  [Console]::Error.WriteLine("[gen] ERROR: $msg")
  exit $code
}

function Rel([string]$p) {
  if ($p.StartsWith($RepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    return ($p.Substring($RepoRoot.Length).TrimStart('\', '/') -replace '\\', '/')
  }
  return $p
}

function Resolve-RepoPath([string]$p) {
  if ([System.IO.Path]::IsPathRooted($p)) { return $p }
  return (Join-Path $RepoRoot $p)
}

function Write-Log([string]$result, [string]$text, [string[]]$refs) {
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  if (-not (Test-Path -LiteralPath $LogFile)) {
    $dir = Split-Path -Parent $LogFile
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
    [System.IO.File]::WriteAllText($LogFile, "# Image generation log`n`nAppended by tools/gen.ps1.`n", $utf8)
  }
  $refText = if ($refs.Count) { ($refs | ForEach-Object { Rel $_ }) -join '; ' } else { '-' }
  $outRel = Rel ([System.IO.Path]::GetFullPath($Out))
  $entry = "`n## $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $outRel`n`n" +
           "- size: $Size, quality: $Quality`n- refs: $refText`n- result: $result`n`n" +
           '```text' + "`n$text`n" + '```' + "`n"
  [System.IO.File]::AppendAllText($LogFile, $entry, $utf8)
}

# ---------------------------------------------------------------- prompt
if ($PromptFile) {
  $pf = Resolve-RepoPath $PromptFile
  if (-not (Test-Path -LiteralPath $pf)) { Fail "PromptFile not found: $pf" 2 }
  $bytes = [System.IO.File]::ReadAllBytes($pf)
  foreach ($b in $bytes) { if ($b -gt 126 -or ($b -lt 32 -and $b -ne 10 -and $b -ne 13 -and $b -ne 9)) { Fail "PromptFile contains non-ASCII bytes (byte $b): $pf" 2 } }
  $Prompt = [System.Text.Encoding]::ASCII.GetString($bytes)
}
if (-not $Prompt) { Fail 'Give -Prompt or -PromptFile' 2 }
$Prompt = ($Prompt -replace '[\r\n\t]+', ' ' -replace '\s{2,}', ' ').Trim()
if ($Prompt -match '[^\x20-\x7E]') { Fail 'Prompt must be ASCII-only (English). Non-ASCII characters found.' 2 }
if ($Prompt.Contains('"')) {
  Write-Warning 'Double quotes in prompt replaced by single quotes (they break the codex argument).'
  $Prompt = $Prompt.Replace('"', "'")
}
if ($Prompt -notmatch 'TEXT RULE') { Write-Warning 'Prompt has no TEXT RULE (no-text clause). Use tools/make_prompts.py.' }

# ---------------------------------------------------------------- refs / out
$refPaths = @()
foreach ($r in $Ref) {
  if (-not $r) { continue }
  $rp = Resolve-RepoPath $r
  if (-not (Test-Path -LiteralPath $rp)) { Fail "Reference image not found: $rp" 2 }
  $refPaths += (Resolve-Path -LiteralPath $rp).Path
}
$Out = Resolve-RepoPath $Out
$outDir = Split-Path -Parent $Out
if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Force $outDir | Out-Null }

$instr = "Call the built-in image_gen tool once with exactly this prompt (verbatim): <<< $Prompt >>> Size $Size, quality $Quality. Do not run any shell commands. After the image is generated, print only the word DONE."

if ($DryRun) {
  Write-Output "DRYRUN out=$Out size=$Size refs=$($refPaths -join ';')"
  Write-Output $instr
  exit 0
}

# ---------------------------------------------------------------- codex binary
if (-not $Codex) {
  $cand = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\bin\*\codex.exe') -ErrorAction SilentlyContinue |
          Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($cand) { $Codex = $cand.FullName }
  else {
    $cmd = Get-Command codex -ErrorAction SilentlyContinue
    if ($cmd) { $Codex = $cmd.Source } else { Fail 'codex.exe not found (pass -Codex)' 2 }
  }
}

# ---------------------------------------------------------------- isolated CODEX_HOME
$globalHome = Join-Path $env:USERPROFILE '.codex'
if ([System.IO.Path]::GetFullPath($CodexHome).TrimEnd('\') -ieq [System.IO.Path]::GetFullPath($globalHome).TrimEnd('\')) {
  Fail 'Refusing to use the global ~/.codex as CODEX_HOME.' 2
}
New-Item -ItemType Directory -Force $CodexHome | Out-Null
$cfg = "model = `"$Model`"`napproval_policy = `"never`"`nsandbox_mode = `"workspace-write`"`n"
[System.IO.File]::WriteAllText((Join-Path $CodexHome 'config.toml'), $cfg, (New-Object System.Text.UTF8Encoding($false)))
$srcAuth = Join-Path $globalHome 'auth.json'
$dstAuth = Join-Path $CodexHome 'auth.json'
if (-not (Test-Path -LiteralPath $srcAuth) -and -not (Test-Path -LiteralPath $dstAuth)) {
  Fail "No Codex login found ($srcAuth). Run 'codex login' first." 2
}
if ((Test-Path -LiteralPath $srcAuth) -and (-not (Test-Path -LiteralPath $dstAuth) -or
    (Get-Item -LiteralPath $srcAuth).LastWriteTime -gt (Get-Item -LiteralPath $dstAuth).LastWriteTime)) {
  Copy-Item -LiteralPath $srcAuth -Destination $dstAuth -Force
}

$cargs = @('exec', $instr, '-C', $CodexHome, '-s', 'workspace-write', '--skip-git-repo-check', '-c', "model_reasoning_effort=`"$Effort`"")
foreach ($r in $refPaths) { $cargs += @('-i', $r) }

$oldHome = $env:CODEX_HOME
$env:CODEX_HOME = $CodexHome
$attempt = 0; $limitWaits = 0; $saved = $false; $lastMsg = ''
try {
  while ($true) {
    $attempt++
    $before = Get-Date
    Write-Host "[gen] attempt $attempt -> $Out"
    $ErrorActionPreference = 'Continue'
    $output = (& $Codex @cargs 2>&1 | ForEach-Object { "$_" }) -join "`n"
    $ErrorActionPreference = 'Stop'
    $gi = Join-Path $CodexHome 'generated_images'
    $latest = Get-ChildItem -Path $gi -Recurse -Filter *.png -ErrorAction SilentlyContinue |
              Where-Object { $_.LastWriteTime -gt $before } |
              Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latest) {
      Copy-Item -LiteralPath $latest.FullName -Destination $Out -Force
      $saved = $true
      Write-Host "[gen] SAVED $Out"
      break
    }
    $tail = ($output -split "`n" | Select-Object -Last 6) -join ' | '
    $lastMsg = $tail
    if ($output -match '(?i)usage limit|rate limit|quota|limit reached|try again (at|in)') {
      if ($limitWaits -ge $LimitRetries) { break }
      $limitWaits++
      Write-Host "[gen] usage limit: waiting $WaitOnLimitSec s ($limitWaits/$LimitRetries). $tail"
      Start-Sleep -Seconds $WaitOnLimitSec
      $attempt--  # limit waits do not consume normal retries
      continue
    }
    if ($attempt -gt $Retries) { break }
    if ($output -match '(?i)capacity') { $wait = [Math]::Min(300, 30 * [Math]::Pow(2, $attempt - 1)) }
    else { $wait = 20 }
    Write-Host "[gen] no image (attempt $attempt). retry in $wait s. $tail"
    Start-Sleep -Seconds ([int]$wait)
  }
}
finally {
  $env:CODEX_HOME = $oldHome
}

if ($saved) {
  # image_gen does not always honour the requested size: record the real one
  $result = 'OK'
  try {
    $fs = [System.IO.File]::OpenRead($Out); $hdr = New-Object byte[] 24; [void]$fs.Read($hdr, 0, 24); $fs.Close()
    $w = ($hdr[16] -shl 24) -bor ($hdr[17] -shl 16) -bor ($hdr[18] -shl 8) -bor $hdr[19]
    $h = ($hdr[20] -shl 24) -bor ($hdr[21] -shl 16) -bor ($hdr[22] -shl 8) -bor $hdr[23]
    $result = "OK (actual ${w}x${h})"
    if ("${w}x${h}" -ne $Size) { Write-Warning "[gen] requested $Size but got ${w}x${h}" }
  } catch { }
  Write-Log $result $Prompt $refPaths
  exit 0
}
Write-Log ("FAILED after $attempt attempt(s): " + ($lastMsg -replace '[^\x20-\x7E]', '?')) $Prompt $refPaths
Fail "FAILED $Out : $lastMsg" 1
