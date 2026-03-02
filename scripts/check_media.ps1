$j = Get-Content 'data\buildings.json' -Raw | ConvertFrom-Json
$missing = @()
foreach ($b in $j) {
    if ($b.media) {
        foreach ($m in $b.media) {
            $p = $m.src
            if (-not (Test-Path $p)) { $missing += $p }
        }
    }
}
if ($missing.Count -eq 0) { Write-Output 'ALL_OK' } else { $missing | ForEach-Object { Write-Output "MISSING: $_" } }
