const { Client } = require('pg');
(async () => {
  const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgrespassword', database: 'gym_db' });
  await c.connect();
  const u = await c.query('SELECT id, email, "fullName", role, status, left("passwordHash", 12) AS hash, "branchId" FROM users ORDER BY email LIMIT 15');
  console.log('USERS(' + u.rowCount + '):');
  u.rows.forEach(r => console.log(' -', r.email, '|', r.role, '|', r.status, '| hash:', r.hash, '| branch:', r.branchId ? 'yes' : 'NULL'));
  const m = await c.query('SELECT count(*)::int AS n FROM members');
  console.log('MEMBERS:', m.rows[0].n);
  const b = await c.query('SELECT id, name, code FROM branches LIMIT 5');
  console.log('BRANCHES:', b.rows.map(x => x.code + '/' + x.name).join(', ') || 'NONE');
  await c.end();
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
