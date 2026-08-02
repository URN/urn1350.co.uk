<#
.SYNOPSIS
  Watches GLUE nowplaying.txt on the RCS server and POSTs updates to the URN website.

.DESCRIPTION
  Safe push model: this script only reads a local file and makes outbound HTTPS
  requests. It does not expose C:\GLUE, open port 9005, or accept inbound traffic.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File C:\GLUE\Upload-NowPlaying.ps1
#>

$ErrorActionPreference = 'Stop'

# --- Configure these ---
$ApiUrl = 'https://urn1350.co.uk/api/now-playing'
$ApiSecret = 'REPLACE_WITH_SAME_SECRET_AS_NOW_PLAYING_SECRET'
$NowPlayingFile = 'C:\GLUE\nowplaying.txt'
$PollSeconds = 2
$LogFile = 'C:\GLUE\nowplaying-upload.log'
# Re-POST unchanged data occasionally so website restarts still recover the current track.
$RefreshSeconds = 60

function Write-Log {
  param([string]$Message)
  $line = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -Path $LogFile -Value $line
  Write-Host $line
}

function ConvertFrom-GlueLine {
  param([string]$Line)

  $result = @{}
  if ([string]::IsNullOrWhiteSpace($Line)) {
    return $result
  }

  foreach ($pair in $Line.Trim().Split('&')) {
    if ([string]::IsNullOrWhiteSpace($pair)) { continue }
    $idx = $pair.IndexOf('=')
    if ($idx -lt 1) { continue }

    $key = $pair.Substring(0, $idx).Trim()
    $rawValue = $pair.Substring($idx + 1)
    # GLUE may leave spaces literal or encode them; UnescapeDataString handles %XX.
    $value = [System.Uri]::UnescapeDataString(($rawValue -replace '\+', ' '))
    $result[$key] = $value
  }

  return $result
}

function Send-NowPlaying {
  param([hashtable]$Fields)

  $bodyObject = [ordered]@{
    station      = $(if ($Fields.ContainsKey('station')) { $Fields['station'] } else { '' })
    artist       = $(if ($Fields.ContainsKey('artist')) { $Fields['artist'] } else { '' })
    title        = $(if ($Fields.ContainsKey('title')) { $Fields['title'] } else { '' })
    type         = $(if ($Fields.ContainsKey('type')) { $Fields['type'] } else { '' })
    id           = $(if ($Fields.ContainsKey('id')) { $Fields['id'] } else { '' })
    airdatetime  = $(if ($Fields.ContainsKey('airdatetime')) { $Fields['airdatetime'] } else { '' })
    runtime      = $(if ($Fields.ContainsKey('runtime')) { $Fields['runtime'] } else { '' })
  }

  if ([string]::IsNullOrWhiteSpace($bodyObject.artist) -and [string]::IsNullOrWhiteSpace($bodyObject.title)) {
    Write-Log 'Skipping upload: artist and title are both empty.'
    return
  }

  $json = $bodyObject | ConvertTo-Json -Compress
  $headers = @{
    Authorization = "Bearer $ApiSecret"
    'Content-Type' = 'application/json'
  }

  $response = Invoke-RestMethod -Method Post -Uri $ApiUrl -Headers $headers -Body $json -TimeoutSec 15
  Write-Log ("Uploaded: {0} - {1}" -f $bodyObject.artist, $bodyObject.title)
  return $response
}

if ($ApiSecret -eq 'REPLACE_WITH_SAME_SECRET_AS_NOW_PLAYING_SECRET' -or [string]::IsNullOrWhiteSpace($ApiSecret)) {
  throw 'Set $ApiSecret in Upload-NowPlaying.ps1 to match NOW_PLAYING_SECRET on the website.'
}

if (-not (Test-Path -LiteralPath $NowPlayingFile)) {
  Write-Log "Waiting for file to appear: $NowPlayingFile"
}

Write-Log "Watching $NowPlayingFile -> $ApiUrl"
$lastRaw = $null
$lastSentAt = Get-Date -Date '1970-01-01'

while ($true) {
  try {
    if (Test-Path -LiteralPath $NowPlayingFile) {
      $raw = (Get-Content -LiteralPath $NowPlayingFile -Raw -ErrorAction Stop)
      if ($null -eq $raw) { $raw = '' }
      $raw = $raw.Trim()

      $changed = ($raw -ne $lastRaw)
      $stale = ((Get-Date) - $lastSentAt).TotalSeconds -ge $RefreshSeconds

      if (-not [string]::IsNullOrWhiteSpace($raw) -and ($changed -or $stale)) {
        $fields = ConvertFrom-GlueLine -Line $raw
        Send-NowPlaying -Fields $fields
        $lastRaw = $raw
        $lastSentAt = Get-Date
      }
    }
  }
  catch {
    Write-Log ("Error: {0}" -f $_.Exception.Message)
  }

  Start-Sleep -Seconds $PollSeconds
}
