const { Client } = require('pg');
(async () => {
  const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgrespassword', database: 'gym_db' });
  await c.connect();
  const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('TABLES:', r.rows.length, '|', r.rows.map(x => x.table_name).join(', '));
  await c.end();
})();
