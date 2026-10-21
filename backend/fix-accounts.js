const { Client } = require('pg');
const bcrypt = require('bcrypt');
(async () => {
  const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgrespassword', database: 'gym_db' });
  await c.connect();

  // 1) Đặt lại mật khẩu đúng chuẩn
  const accounts = [
    ['trainer@gym.com', 'Trainer@123456'],
    ['member@gym.com', 'Member@123456'],
  ];
  for (const [email, pw] of accounts) {
    const hash = await bcrypt.hash(pw, 10);
    await c.query('UPDATE users SET "passwordHash" = $1 WHERE email = $2', [hash, email]);
    console.log('password set:', email);
  }

  // 2) Tạo member cho member@gym.com (tự động lấy đúng tên cột)
  const cols = await c.query(
    "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='members' ORDER BY ordinal_position",
  );
  console.log(
    'MEMBERS COLS:',
    cols.rows.map((r) => r.column_name).join(', '),
  );
  const names = cols.rows.map((r) => r.column_name);
  const pick = (...cands) => cands.find((x) => names.includes(x));
  const cId = pick('id');
  const cCode = pick('code', 'memberCode');
  const cName = pick('fullName', 'name');
  const cEmail = pick('email');
  const cUser = pick('userId', 'user_id', 'userid');
  const cStatus = pick('status');
  const cPhone = pick('phone');
  console.log('mapping:', { cId, cCode, cName, cEmail, cUser, cStatus, cPhone });

  const u = await c.query("SELECT id, email FROM users WHERE email='member@gym.com'");
  if (u.rowCount) {
    const vals = [];
    const sets = [];
    let i = 1;
    if (cId) { sets.push(`"${cId}"`); vals.push(`'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31'`); }
    if (cCode) { sets.push(`"${cCode}"`); vals.push(`'M-1001'`); }
    if (cName) { sets.push(`"${cName}"`); vals.push(`'Trần Thị B'`); }
    if (cEmail) { sets.push(`"${cEmail}"`); vals.push(`'member@gym.com'`); }
    if (cUser) { sets.push(`"${cUser}"`); vals.push(`'${u.rows[0].id}'`); }
    if (cStatus) { sets.push(`"${cStatus}"`); vals.push(`'ACTIVE'`); }
    if (cPhone) { sets.push(`"${cPhone}"`); vals.push(`'0912345678'`); }
    if (cId && cCode) {
      await c.query(
        `INSERT INTO members (${sets.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT ("${cId}") DO NOTHING`,
      );
      console.log('member inserted');
    }
  }
  const m = await c.query('SELECT count(*)::int AS n FROM members');
  console.log('MEMBERS:', m.rows[0].n);
  await c.end();
})().catch((e) => {
  console.log('ERR', e.message);
  process.exit(1);
});
