Stop-Service -Name "MSSQLSERVER" -Force
Start-Service -Name "MSSQLSERVER"
Write-Host "Service restarted"
