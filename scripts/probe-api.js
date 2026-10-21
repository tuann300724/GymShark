const base = 'http://localhost:3001/api';
(async () => {
  const lr = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gym.com', password: 'Admin@123456' }),
  });
  const login = await lr.json();
  if (!lr.ok) { console.log('LOGIN FAIL', lr.status, JSON.stringify(login)); return; }
  console.log('LOGIN OK role=' + login.user.role);
  const token = login.accessToken;
  const h = { Authorization: 'Bearer ' + token };

  const gets = ['/users', '/members', '/branches', '/checkins', '/trainers', '/membership-packages', '/payments', '/invoices', '/notifications', '/audit-logs', '/equipment', '/foods', '/schedules', '/promotions', '/reports/overview'];
  for (const p of gets) {
    try {
      const r = await fetch(base + p, { headers: h });
      const t = await r.text();
      console.log((r.ok ? 'OK  ' : 'FAIL') + ' GET ' + p + ' -> ' + r.status + ' | ' + t.slice(0, 110).replace(/\n/g, ' '));
    } catch (e) {
      console.log('FAIL GET ' + p + ' -> ' + e.message);
    }
  }
})();
