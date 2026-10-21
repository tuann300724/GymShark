<#
  setup-sqlserver.ps1
  --------------------------------------------------------------
  Chuan hoa SQL Server 2022 cho du an GymShark:
    1. Bat TCP/IP (+ Named Pipes fallback) cho instance dang chay
    2. Ep port cua instance = port no SQL Server dang listen that
    3. Bat Mixed Mode (SQL Auth + Windows Auth)
    4. Restart service
    5. Kiem tra ket noi + tao database `gym_db` + login `gym_app` neu thieu
  Chay: click phai -> Run with PowerShell (hoac double-click, script tu elevate)
#>

$ErrorActionPreference = 'Continue'
$LogPath = Join-Path $PSScriptRoot 'sqlserver-setup-result.txt'
$lines = New-Object System.Collections.Generic.List[string]

function Write-Log([string]$m) {
    $lines.Add($m)
    Write-Host $m
}
function Save-Log {
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($LogPath, ($lines -join [Environment]::NewLine), $enc)
}

# ---------------------------------------------------------------- elevate
$isAdmin = ([Security.Principal.WindowsPrincipal] `
        [Security.Principal.WindowsIdentity]::GetCurrent()
    ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Log '[!] Can quyen Administrator -> dang yeu cau UAC...'
    try {
        Start-Process -FilePath 'powershell.exe' `
            -Verb RunAs `
            -ArgumentList @(
            '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $PSCommandPath + '"')
        ) -Wait
    } catch {
        Write-Log ("[X] UAC bi tu choi / that bai: " + $_.Exception.Message)
    }
    Save-Log
    exit 0
}

Write-Log '[OK] Dang chay voi quyen Administrator'
Write-Log ('User: ' + (whoami))

# ------------------------------------------------- tim instance SQL Server
$instanceMap = @{}
$mapKey = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL'
if (Test-Path $mapKey) {
    $p = Get-ItemProperty $mapKey
    foreach ($prop in $p.PSObject.Properties) {
        if ($prop.Name -notlike 'PS*') { $instanceMap[$prop.Name] = $prop.Value }
    }
}
Write-Log ('Instances: ' + (($instanceMap.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ', '))

$sqlSvcs = Get-WmiObject Win32_Service -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -eq 'MSSQLSERVER' -or $_.Name -like 'MSSQL$*' }
$running = $sqlSvcs | Where-Object { $_.State -eq 'Running' }

if (-not $running) {
    Write-Log '[X] Khong tim thay SQL Server service nao dang chay.'
    Save-Log
    exit 1
}

# ------------------------------------------- xac dinh port SQL Server listen
$listenPorts = @()
foreach ($proc in (Get-Process -Name sqlservr -ErrorAction SilentlyContinue)) {
    $conns = Get-NetTCPConnection -State Listen -OwningProcess $proc.Id -ErrorAction SilentlyContinue
    foreach ($c in $conns) { $listenPorts += $c.LocalPort }
}
$listenPorts = $listenPorts | Sort-Object -Unique
Write-Log ('Ports SQL Server dang listen: ' + ($(if ($listenPorts) { $listenPorts -join ',' } else { 'none' })))

# ------------------------------------------------------------- ap dung config
$targets = @()
foreach ($svc in $running) {
    $instName = $null
    if ($svc.PathName -match '-s([A-Za-z0-9_]+)') { $instName = $Matches[1] }
    if (-not $instName) { $instName = 'MSSQLSERVER' }
    $instId = if ($instanceMap.ContainsKey($instName)) { $instanceMap[$instName] } else { $instId = $instName }

    $root = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\$instId"
    if (-not (Test-Path $root)) {
        Write-Log ("[!] Bo qua $instName (khong tim thay registry $root)")
        continue
    }
    $port = if ($listenPorts.Count -gt 0) { $listenPorts[0] } else { 1433 }
    $targets += [pscustomobject]@{
        Service    = $svc.Name
        Instance   = $instName
        Root       = $root
        Port       = $port
        SuperSocket = Join-Path $root 'MSSQLServer\SuperSocketNetLib'
    }
    Write-Log ("Instance: $instName (service $($svc.Name)) -> registry $root, port $port")
}

foreach ($t in $targets) {
    Write-Log ''
    Write-Log "--- Cau hinh $($t.Instance) ---"

    # 1) TCP/IP
    $ipAll = Join-Path $t.SuperSocket 'Tcp\IPAll'
    $tcp = Join-Path $t.SuperSocket 'Tcp'
    $np = Join-Path $t.SuperSocket 'Np'
    $svcRoot = Join-Path $t.Root 'MSSQLServer'

    try {
        if (-not (Test-Path $ipAll)) { New-Item -Path $ipAll -Force | Out-Null }
        Set-ItemProperty -Path $ipAll -Name 'Enabled' -Value 1 -Type DWord -ErrorAction Stop
        Set-ItemProperty -Path $ipAll -Name 'TcpPort' -Value ([string]$t.Port) -Type String -ErrorAction Stop
        Set-ItemProperty -Path $ipAll -Name 'IpAllBound' -Value '' -Type String -ErrorAction SilentlyContinue
        Write-Log "  [OK] TCP/IP: Enabled=1, TcpPort=$($t.Port)"
    } catch { Write-Log ("  [X] TCP/IP that bai: " + $_.Exception.Message) }

    try {
        if (Test-Path $tcp) { Set-ItemProperty -Path $tcp -Name 'Enabled' -Value 1 -Type DWord -ErrorAction Stop }
        Write-Log '  [OK] SuperSocketNetLib\Tcp Enabled=1'
    } catch { Write-Log ("  [X] Tcp Enabled that bai: " + $_.Exception.Message) }

    # 2) Named Pipes (fallback khi TLS/TCP bi chan)
    try {
        if (-not (Test-Path $np)) { New-Item -Path $np -Force | Out-Null }
        Set-ItemProperty -Path $np -Name 'Enabled' -Value 1 -Type DWord -ErrorAction Stop
        Write-Log '  [OK] Named Pipes Enabled=1 (fallback)'
    } catch { Write-Log ("  [X] Named Pipes that bai: " + $_.Exception.Message) }

    # 3) tat Force Encryption neu co (hay lam client khong ket noi duoc)
    try {
        $fe = Get-ItemProperty -Path $tcp -Name 'ForceEncryption' -ErrorAction SilentlyContinue
        if ($null -ne $fe) {
            Set-ItemProperty -Path $tcp -Name 'ForceEncryption' -Value 0 -Type DWord -ErrorAction SilentlyContinue
            Write-Log '  [OK] ForceEncryption=0'
        }
    } catch { }

    # 4) Mixed Mode: SQL Auth + Windows Auth
    try {
        Set-ItemProperty -Path $svcRoot -Name 'LoginMode' -Value 1 -Type DWord -ErrorAction Stop
        Write-Log '  [OK] LoginMode=1 (Mixed Mode)'
    } catch { Write-Log ("  [X] LoginMode that bai: " + $_.Exception.Message) }
}

# -------------------------------------------------------------- restart
Write-Log ''
Write-Log '--- Restart service ---'
foreach ($t in $targets) {
    try {
        Restart-Service -Name $t.Service -Force -ErrorAction Stop
        Write-Log "  [OK] Restarted $($t.Service)"
    } catch {
        Write-Log ("  [X] Restart $($t.Service) that bai: " + $_.Exception.Message)
    }
}
Start-Sleep -Seconds 12

foreach ($t in $targets) {
    $st = (Get-Service -Name $t.Service).Status
    Write-Log ("  Service $($t.Service) = $st")
    $c = Get-NetTCPConnection -State Listen -LocalPort $t.Port -ErrorAction SilentlyContinue
    if ($c) { Write-Log "  [OK] Port $($t.Port) LISTENING (pid $($c[0].OwningProcess))" }
    else { Write-Log "  [!] Port $($t.Port) chua listen" }
}

# ------------------------------------------------- test connection + tao DB
Add-Type -AssemblyName System.Data -ErrorAction SilentlyContinue

function Test-SqlConnection {
    param([string]$DataSource, [string]$User, [string]$Pass, [bool]$Integrated)
    try {
        $csb = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
        $csb.DataSource = $DataSource
        $csb.InitialCatalog = 'master'
        $csb.ConnectTimeout = 10
        $csb.TrustServerCertificate = $true
        if ($Integrated) { $csb.IntegratedSecurity = $true }
        else { $csb.UserID = $User; $csb.Password = $Pass }
        $c = New-Object System.Data.SqlClient.SqlConnection ($csb.ConnectionString)
        $c.Open()
        $c.Close()
        return $true
    } catch { return $false }
}

$port = if ($targets.Count -gt 0) { $targets[0].Port } else { 50862 }
$candidates = @(
    @{ label = 'gym_app / GymApp@2026'; user = 'gym_app'; pass = 'GymApp@2026'; integrated = $false },
    @{ label = 'sa / SQLpassword'; user = 'sa'; pass = 'SQLpassword'; integrated = $false },
    @{ label = 'sa / YourStrong!Passw0rd'; user = 'sa'; pass = 'YourStrong!Passw0rd'; integrated = $false },
    @{ label = 'sa / Password123'; user = 'sa'; pass = 'Password123'; integrated = $false },
    @{ label = 'sa / 123456'; user = 'sa'; pass = '123456'; integrated = $false },
    @{ label = 'Windows Integrated Security'; user = ''; pass = ''; integrated = $true }
)

Write-Log ''
Write-Log "--- Test ket noi (localhost,$port) ---"
$working = $null
foreach ($cand in $candidates) {
    $ds = "localhost,$port"
    if (Test-SqlConnection -DataSource $ds -User $cand.user -Pass $cand.pass -Integrated $cand.integrated) {
        Write-Log "  [OK] CONNECT: $($cand.label)"
        $working = $cand
        break
    } else {
        Write-Log "  [--] fail: $($cand.label)"
    }
}

if ($null -eq $working) {
    Write-Log '[X] KHONG ket noi duoc voi SQL Server bang phan mem .NET.'
    Write-Log '    Hay thu: SQL Server Configuration Manager > Protocolss for MSSQLSERVER > Enable TCP/IP > restart,'
    Write-Log '    hoac kiem tra Firewall/Antivirus chan loopback.'
    Save-Log
    exit 2
}

# ------------------------------------- tao database + login gym_app (can admin)
if ($working.integrated) {
    Write-Log '[i] Dung Windows Auth de tao database/login'
    $csb = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
    $csb.DataSource = "localhost,$port"
    $csb.InitialCatalog = 'master'
    $csb.IntegratedSecurity = $true
    $csb.TrustServerCertificate = $true
    $conn = New-Object System.Data.SqlClient.SqlConnection ($csb.ConnectionString)
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
IF DB_ID('gym_db') IS NULL CREATE DATABASE gym_db;
"@
    try { $cmd.ExecuteNonQuery() | Out-Null; Write-Log '  [OK] Database gym_db da ton tai / da tao' }
    catch { Write-Log ("  [X] Tao database that bai: " + $_.Exception.Message) }
    $conn.Close()
}
else {
    $csb = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
    $csb.DataSource = "localhost,$port"
    $csb.InitialCatalog = 'master'
    $csb.UserID = $working.user
    $csb.Password = $working.pass
    $csb.TrustServerCertificate = $true
    $conn = New-Object System.Data.SqlClient.SqlConnection ($csb.ConnectionString)
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
IF DB_ID('gym_db') IS NULL CREATE DATABASE gym_db;
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name='gym_app')
    CREATE LOGIN gym_app WITH PASSWORD='GymApp@2026', CHECK_POLICY=OFF, DEFAULT_DATABASE=[gym_db];
"@
    try { $cmd.ExecuteNonQuery() | Out-Null; Write-Log '  [OK] Database gym_db + login gym_app' }
    catch { Write-Log ("  [!] Tao DB/login that bai (co the da ton tai): " + $_.Exception.Message) }
    $conn.Close()
}

# cap quyen cho gym_app tren gym_db
try {
    $csb = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
    $csb.DataSource = "localhost,$port"
    $csb.InitialCatalog = 'gym_db'
    $csb.UserID = $working.user
    $csb.Password = $working.pass
    $csb.TrustServerCertificate = $true
    $conn = New-Object System.Data.SqlClient.SqlConnection ($csb.ConnectionString)
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='gym_app')
    CREATE USER gym_app FOR LOGIN gym_app;
IF IS_ROLEMEMBER('db_owner','gym_app') <> 1
    ALTER ROLE db_owner ADD MEMBER gym_app;
"@
    try { $cmd.ExecuteNonQuery() | Out-Null; Write-Log '  [OK] gym_app da co quyen tren gym_db' }
    catch { Write-Log ("  [!] Gan quyen that bai: " + $_.Exception.Message) }
    $conn.Close()
} catch { Write-Log ("  [!] Buoc cap quyen that bai: " + $_.Exception.Message) }

Write-Log ''
Write-Log '=== HOAN TAT ==='
Save-Log
Write-Log "Log: $LogPath"
