# Bật TCP/IP cho SQL Server (không cần MMC) — chạy bằng PowerShell Admin
$instances = @()
# Tìm các instance trong registry
$regPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQLSERVER",
    "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL"
)

# Cách đơn giản: bật TCP/IP qua WMI / PowerShell cho service MSSQLSERVER
Write-Host "Đang cấu hình TCP/IP cho MSSQLSERVER qua PowerShell..."

# Đường dẫn registry cho TCP settings
$tcpRegPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQLSERVER\MSSQLServer\SuperSocketNetLib\Tcp\IPAll"

if (Test-Path $tcpRegPath) {
    # Bật TCP/IP và set port
    Set-ItemProperty -Path $tcpRegPath -Name "TcpPort" -Value "1433"
    Set-ItemProperty -Path $tcpRegPath -Name "TcpDynamicPorts" -Value ""
    Write-Host "TCP/IP đã cấu hình: Port = 1433"
} else {
    # Nếu không tìm thấy đường dẫn đó, thử tìm tất cả key SuperSocketNetLib
    $allTcpPaths = Get-ChildItem -Path "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*SuperSocketNetLib*Tcp*" }
    Write-Host "Đường dẫn TCP/IP tìm thấy: $($allTcpPaths -join ', ')"
    # Cố gắng set port cho bất kỳ đường dẫn nào tìm thấy
    foreach ($p in $allTcpPaths) {
        $tcpPath = Split-Path $p.PSPath -Parent
        try {
            Set-ItemProperty -Path $tcpPath -Name "TcpPort" -Value "1433"
            Write-Host "Đã set TCP Port 1433 cho: $tcpPath"
        } catch {
            Write-Host "Lỗi khi set port: $_"
        }
    }
}

# Restart SQL Server service
Write-Host "Restart MSSQLSERVER..."
Restart-Service -Name "MSSQLSERVER" -Force -ErrorAction SilentlyContinue
Write-Host "ĐÃ XONG. Kiểm tra lại port 1433 bằng: Get-NetTCPConnection -LocalPort 1433"
