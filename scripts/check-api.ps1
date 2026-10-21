$body = @{ email = 'trainer@gym.com'; password = 'Trainer@123456' } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 12
    Write-Host ("LOGIN OK: role=" + $r.user.role + " name=" + $r.user.fullName)
    $h = @{ Authorization = ('Bearer ' + $r.accessToken) }
    try {
        $u = Invoke-RestMethod -Uri 'http://localhost:3001/api/users' -Headers $h -TimeoutSec 10
        Write-Host ("USERS OK: count=" + $u.Length)
    } catch { Write-Host ('USERS FAIL: ' + $_.Exception.Message) }
} catch {
    Write-Host ('LOGIN FAIL: ' + $_.Exception.Message)
}
