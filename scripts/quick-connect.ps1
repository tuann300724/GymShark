<# quick-connect.ps1 #>
$ErrFile = 'E:\FILE HỌC TẬP ĐH LẠC HỒNG\Đồ Án Tốt Nghiệp\Web gym\scripts\sql-diag.txt'
function Log($m){ Write-Host $m; Add-Content -Path $ErrFile -Value $m -Encoding UTF8 }
Add-Type -AssemblyName System.Data
# Thử correct syntax (Server=...)
$tests = @(
    @{label='gym_app'; s='localhost,50862'; u='gym_app'; p='GymApp@2026'; i=$false},
    @{label='sa/SQLpassword'; s='localhost,50862'; u='sa'; p='SQLpassword'; i=$false},
    @{label='Windows'; s='localhost,50862'; u=''; p=''; i=$true}
)
foreach($t in $tests){
    try{
        $cs = "Server=$($t.s);Database=master;Connect Timeout=8;TrustServerCertificate=True;"
        if($t.i){ $cs += "Integrated Security=True;" } else { $cs += "User ID=$($t.u);Password=$($t.p);" }
        $conn = New-Object System.Data.SqlClient.SqlConnection($cs)
        $conn.Open()
        Log ("[OK SQL CONNECT] $($t.label) -> master")
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT DB_NAME() as db; SELECT name FROM sys.databases WHERE name='gym_db'; SELECT loginname FROM sys.sql_logins WHERE name='gym_app';"
        $r = $cmd.ExecuteReader()
        $found = $false
        while($r.Read()) { $found=$true; Log ("      result: " + $r.GetValue(0)) }
        $r.Close()
        $cmd.CommandText = "IF DB_ID('gym_db') IS NULL CREATE DATABASE gym_db; IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name='gym_app') CREATE LOGIN gym_app WITH PASSWORD='GymApp@2026', CHECK_POLICY=OFF;"
        $cmd.ExecuteNonQuery()
        Log ("[OK] DB gym_db + login gym_app ensured")
        $conn.ChangeDatabase('gym_db')
        $cmd2 = $conn.CreateCommand()
        $cmd2.CommandText = "IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='gym_app') CREATE USER gym_app FOR LOGIN gym_app; ALTER ROLE db_owner ADD MEMBER gym_app;"
        $cmd2.ExecuteNonQuery()
        Log ("[OK] gym_app quyen tren gym_db")
        $conn.Close()
        # Fix .env
        $envPath = 'E:\FILE HỌC TẬP ĐH LẠC HỒNG\Đồ Án Tốt Nghiệp\Web gym\backend\.env'
        $c = Get-Content $envPath -Raw
        $c = ($c -replace 'DB_USERNAME=".*?"', 'DB_USERNAME="gym_app"')
        $c = ($c -replace 'DB_PASSWORD=".*?"', 'DB_PASSWORD="GymApp@2026"')
        $c = ($c -replace 'DB_PORT=".*?"', 'DB_PORT="50862"')
        $c = ($c -replace 'DATABASE_URL=".*?"', 'DATABASE_URL="sqlserver://gym_app:GymApp@2026@localhost:50862;database=gym_db;encrypt=false;trustServerCertificate=true"')
        Set-Content -Path $envPath -Value $c -Encoding UTF8 -Force
        Log '[OK] .env da cap nhat gym_app/50862'
        break
    }catch{
        Log ("[FAIL $($t.label)] " + $_.Exception.Message)
    }
}
