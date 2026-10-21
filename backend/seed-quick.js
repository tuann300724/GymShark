const { Client } = require('pg');
(async () => {
  const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgrespassword', database: 'gym_db' });
  await c.connect();
  // Basic seed: branch + users
  await c.query(`INSERT INTO branches (id, name, code, address, phone, email) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','Chi nhánh Trung tâm','BR01','123 Đường A','0281234','br01@gym.com'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12','Chi nhánh Quận 1','BR02','456 Đường B','0285678','br02@gym.com')
  ON CONFLICT (id) DO NOTHING`);
  // Seed users (trainer + member)
  const users = [
    { id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', email: 'trainer@gym.com', pw: '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqhmM6JGKpS4G3R1gN2/JwVUOV9.C', name: 'Nguyễn Văn A', role: 'TRAINER', status: 'ACTIVE', branchId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', phone: '0901234567' },
    { id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', email: 'member@gym.com', pw: '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqhmM6JGKpS4G3R1gN2/JwVUOV9.C', name: 'Trần Thị B', role: 'MEMBER', status: 'ACTIVE', branchId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', phone: '0912345678' },
  ];
  for (const u of users) {
    await c.query(`INSERT INTO users (id, email, "passwordHash", "fullName", role, status, "branchId", phone, provider, "providerId") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'LOCAL',NULL) ON CONFLICT (id) DO NOTHING`, [u.id, u.email, u.pw, u.name, u.role, u.status, u.branchId, u.phone]);
  }
  // Member skip (column name differs)
  await c.query(`SELECT 1`);
  const r = await c.query(`SELECT count(*)::int AS n FROM users`);
  console.log('SEEDED users:', r.rows[0].n);
  await c.end();
})();
