<#
  collect-sql-diag.ps1  (can chay voi quyen Administrator)
  Thu ERRORLOG cua SQL Server + kiem tra firewall + thu cac cong ket noi
  va ghi ket qua ra scripts/sql-diag.txt
#>
$ErrorActionPreference = 'Continue'
$out = Join-Path $PSScriptRoot 'sql-diag.txt'
$lines = New-Object System.Collections.Generic.List[string]
function L([string]$m) { $lines.Add($m); Write-Host $m }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    L '[!] Can Administrator -> UAC...'
    try {
        Start-Process powershell -Verb RunAs -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $PSCommandPath + '"')) -Wait
    } catch { L ('[X] UAC: ' + $_.Exception.Message) }
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($out, ($lines -join [Environment]::NewLine), $enc)
    exit 0
}

L ('User: ' + (whoami))
L '======================================================'
L ' 1. SQL SERVER LOG DIRECTORY'
L '======================================================'
$logDirs = @(
    'C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Log',
    'C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Log\'
)
foreach ($d in $logDirs) {
    if (Test-Path $d) {
        L ("FOUND: " + $d)
        Get-ChildItem $d -ErrorAction SilentlyContinue | Select-Object -First 10 | ForEach-Object { L ("   " + $_.Name + "  " + $_.Length + " bytes") }
    }
}

L ''
L '======================================================'
L ' 2. ERRORLOG (60 dong cuoi)'
L '======================================================'
$errFile = $null
foreach ($d in $logDirs) {
    $f = Join-Path $d 'ERRORLOG'
    if (Test-Path $f) { $errFile = $f; break }
}
if (-not $errFile) {
    $cand = Get-ChildItem 'C:\Program Files\Microsoft SQL Server' -Recurse -Filter 'ERRORLOG' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cand) { $errFile = $cand.FullName }
}
if ($errFile) {
    L ("Reading: " + $errFile)
    try {
        Get-Content $errFile -Tail 60 -ErrorAction Stop | ForEach-Object { L $_ }
    } catch {
        L ('[X] Read errorlog failed: ' + $_.Exception.Message)
        try {
            $bytes = [System.IO.File]::ReadAllBytes($errFile)
            $txt = [System.Text.Encoding]::Default.GetString($bytes)
            ($txt -split "`r?`n") | Select-Object -Last 60 | ForEach-Object { L $_ }
        } catch { L ('[X] ReadAllBytes failed: ' + $_.Exception.Message) }
    }
} else { L 'ERRORLOG khong tim thay' }

L ''
L '======================================================'
L ' 3. REGISTRY NETWORK + LOGIN MODE'
L '======================================================'
$base = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQLServer'
foreach ($sub in @('SuperSocketNetLib\Tcp', 'SuperSocketNetLib\Tcp\IPAll', 'SuperSocketNetLib\Np')) {
    $p = Join-Path $base $sub
    L "-- $sub"
    if (Test-Path $p) {
        $it = Get-Item $p
        $it.GetValueNames() | ForEach-Object { L ("   $_ = " + $it.GetValue($_)) }
    } else { L '   (khong co)' }
}
L "-- LoginMode"
$it2 = Get-Item $base
$it2.GetValueNames() | ForEach-Object { L ("   $_ = " + $it2.GetValue($_)) }

L ''
L '======================================================'
L ' 4. WINDOWS FIREWALL (rule SQL)'
L '======================================================'
try {
    Get-NetFirewallRule -DisplayName '*SQL*' -ErrorAction SilentlyContinue |
        Select-Object DisplayName, Enabled, Direction, Action | ForEach-Object { L ("   " + $_.DisplayName + " | " + $_.Enabled + " | " + $_.Direction + " | " + $_.Action) }
} catch { L ('   ' + $_.Exception.Message) }

L ''
L '======================================================'
L ' 5. TCP RAW TEST'
L '======================================================'
try {
    $tnc = Test-NetConnection -ComputerName 'localhost' -Port 50862 -WarningAction SilentlyContinue
    L ("   TcpTestSucceeded = " + $tnc.TcpTestSucceeded)
} catch { L ('   ' + $_.Exception.Message) }

L ''
L '======================================================'
L ' 6. SQL LOGINS / DATABASES (neu ket noi duoc)'
L '======================================================'
Add-Type -AssemblyName System.Data -ErrorAction SilentlyContinue
$cands = @(
    @{ l = 'sa/SQLpassword'; u = 'sa'; p = 'SQLpassword'; i = $false },
    @{ l = 'sa/YourStrong!Passw0rd'; u = 'sa'; p = 'YourStrong!Passw0rd'; i = $false },
    @{ l = 'sa/Password123'; u = 'sa'; p = 'Password123'; i = $false },
    @{ l = 'sa/123456'; u = 'sa'; p = '123456'; i = $false },
    @{ l = 'gym_app/GymApp@2026'; u = 'gym_app'; p = 'GymApp@2026'; i = $false },
    @{ l = 'gym_app/gym_app'; u = 'gym_app'; p = 'gym_app'; i = $false },
    @{ l = 'WindowsAuth'; u = ''; p = ''; i = $true }
)
foreach ($c in $cands) {
    try {
        $csb = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
        $csb.DataSource = 'localhost,50862'
        $csb.InitialCatalog = 'master'
        $csb.ConnectTimeout = 8
        $csb.TrustServerCertificate = $true
        if ($c.i) { $csb.IntegratedSecurity = $true } else { $csb.UserID = $c.u; $csb.Password = $c.p }
        $conn = New-Object System.Data.SqlClient.SqlConnection ($csb.ConnectionString)
        $conn.Open()
        L ('   [OK] ' + $c.l)
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT name FROM sys.databases ORDER BY name"
        $r = $cmd.ExecuteReader()
        $dbs = @()
        while ($r.Read()) { $dbs += $r.GetString(0) }
        $r.Close()
        L ('      DBs: ' + ($dbs -join ', '))
        $cmd.CommandText = "SELECT name, is_disabled FROM sys.sql_logins"
        $r2 = $cmd.ExecuteReader()
        while ($r2.Read()) { L ('      login: ' + $r2.GetString(0) + ' disabled=' + $r2.GetValue(1)) }
        $r2.Close()
        $conn.Close()
        break
    } catch {
        L ('   [fail] ' + $c.l + ' -> ' + $_.Exception.Message)
        if ($_.Exception.InnerException) { L ('           inner: ' + $_.Exception.InnerException.Message) }
    }
}

L ''
L '=== DONE ==='
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($out, ($lines -join [Environment]::NewLine), $enc)
L ("Saved: " + $out)
