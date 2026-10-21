<# Doc ERRORLOG va loc loi dang nhap (Admin) #>
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','"'+$PSCommandPath+'"'; exit 0 }
$logDir = 'C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Log'
$out = Join-Path $PSScriptRoot 'sql-login-errors.txt'
$all = @()
foreach ($f in @('ERRORLOG','ERRORLOG.1')) {
    $p = Join-Path $logDir $f
    if (Test-Path $p) {
        try {
            $txt = [System.IO.File]::ReadAllText($p)
            $all += ($txt -split "`r?`n")
        } catch { }
    }
}
$sel = $all | Where-Object { $_ -match '18456|Login failed|authentication|Windows-only|mixed mode|Reason:' } | Select-Object -Last 60
$header = @(
  '=== SQL Server login failures ===',
  ('Total lines scanned: ' + $all.Count),
  '---'
)
$body = @()
if ($sel) { $body += $sel } else { $body += '(khong tim thay dong 18456 trong ERRORLOG)' }
# them 40 dong cuoi
$body += ''
$body += '--- 30 dong cuoi ERRORLOG ---'
$body += ($all | Select-Object -Last 30)
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($out, (($header + $body) -join [Environment]::NewLine), $enc)
Write-Host "Saved: $out"
