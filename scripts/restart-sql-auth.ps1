<# Stop-Set-Start SQL Server (Admin) #>
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','"'+$PSCommandPath+'"' ; exit 0
}
Write-Host '[Admin] Dung dich vu (stop) MSSQLSERVER...'
Stop-Service -Name MSSQLSERVER -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 5
Write-Host '[Admin] Ghi LoginMode=1...'
Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQLServer' -Name 'LoginMode' -Value 1 -Type DWord
Write-Host '[Admin] Bat MSSQLSERVER...'
Start-Service -Name MSSQLSERVER; Start-Sleep -Seconds 12
Write-Host '[Admin] Kiem tra...'
Add-Type -AssemblyName System.Data
$c = New-Object System.Data.SqlClient.SqlConnection("Server=localhost,50862;Database=master;Integrated Security=True;Connect Timeout=10;TrustServerCertificate=True;")
$c.Open()
$cmd = $c.CreateCommand()
$cmd.CommandText = "SELECT SERVERPROPERTY('IsIntegratedSecurityOnly') AS winOnly"
$r = $cmd.ExecuteReader(); $winOnly = $r.GetValue(0); $r.Close()
Write-Host ("IsIntegratedSecurityOnly = " + $winOnly)
# Test SQL auth
try {
    $cn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost,50862;Database=master;User ID=gym_app;Password=GymApp@2026;Connect Timeout=8;TrustServerCertificate=True;")
    $cn.Open()
    Write-Host '[OK] gym_app SQL auth works!'
    $cn.Close()
} catch { Write-Host ('[FAIL] SQL auth: ' + $_.Exception.Message) }
$c.Close()
