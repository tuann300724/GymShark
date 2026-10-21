const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const crypto = require('crypto');
const ACCOUNTS = [
  ['admin@gym.com', 'Admin@123456', 'ADMIN', 'Nguyễn Quản Trị', '0901000001'],
  ['manager@gym.com', 'Manager@123456', 'MANAGER', 'Trần Quản Lý', '0901000002'],
  ['staff@gym.com', 'Staff@123456', 'STAFF', 'Lê Lễ Tân', '0901000003'],
  ['trainer@gym.com', 'Trainer@123456', 'TRAINER', 'Phạm HLV Một', '0901000004'],
  ['trainer2@gym.com', 'Trainer@123456', 'TRAINER', 'Võ HLV Hai', '0901000005'],
  ['trainer3@gym.com', 'Trainer@123456', 'TRAINER', 'Đặng HLV Ba', '0901000006'],
  ['member@gym.com', 'Member@123456', 'MEMBER', 'Trần Thị B', '0911000001'],
  ['member2@gym.com', 'Member@123456', 'MEMBER', 'Lê Thị C', '0911000002'],
  ['member3@gym.com', 'Member@123456', 'MEMBER', 'Nguyễn Văn D', '0911000003'],
  ['member4@gym.com', 'Member@123456', 'MEMBER', 'Phạm Thị E', '0911000004'],
  ['member5@gym.com', 'Member@123456', 'MEMBER', 'Hoàng Văn F', '0911000005'],
  ['member6@gym.com', 'Member@123456', 'MEMBER', 'Đỗ Thị G', '0911000006'],
  ['member7@gym.com', 'Member@123456', 'MEMBER', 'Vũ Văn H', '0911000007'],
  ['member8@gym.com', 'Member@123456', 'MEMBER', 'Bùi Thị I', '0911000008'],
  ['member9@gym.com', 'Member@123456', 'MEMBER', 'Đinh Văn J', '0911000009'],
  ['member10@gym.com', 'Member@123456', 'MEMBER', 'Trương Thị K', '0911000010'],
  ['member11@gym.com', 'Member@123456', 'MEMBER', 'Lý Văn L', '0911000011'],
];

const BRANCH_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

(async () => {
  const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgrespassword', database: 'gym_db' });
  await c.connect();

  // Đảm bảo branch tồn tại
  await c.query(
    `INSERT INTO branches (id, name, code, address, phone, email) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
    [BRANCH_ID, 'Chi nhánh Trung tâm', 'BR01', '123 Đường A', '0281234', 'br01@gym.com'],
  );

  // Lấy đúng tên cột của bảng users / members
  const colsOf = async (t) =>
    (await c.query("SELECT column_name FROM information_schema.columns WHERE table_name=$1", [t])).rows.map((r) => r.column_name);
  const userCols = await colsOf('users');
  const memberCols = await colsOf('members');
  const pick = (list, ...cands) => cands.find((x) => list.includes(x));
  console.log('USERS cols:', userCols.join(', '));
  console.log('MEMBERS cols:', memberCols.join(', '));

  const uId = pick(userCols, 'id');
  const uEmail = pick(userCols, 'email');
  const uHash = pick(userCols, 'passwordHash');
  const uName = pick(userCols, 'fullName');
  const uRole = pick(userCols, 'role');
  const uStatus = pick(userCols, 'status');
  const uPhone = pick(userCols, 'phone');
  const uBranch = pick(userCols, 'branchId');
  const uAvatar = pick(userCols, 'avatarUrl');
  const uProvider = pick(userCols, 'provider');
  const uProviderId = pick(userCols, 'providerId');

  const mId = pick(memberCols, 'id');
  const mCode = pick(memberCols, 'code', 'memberCode');
  const mName = pick(memberCols, 'fullName', 'name');
  const mEmail = pick(memberCols, 'email');
  const mUser = pick(memberCols, 'userId', 'user_id', 'userid');
  const mStatus = pick(memberCols, 'status');
  const mPhone = pick(memberCols, 'phone');
  const mBranch = pick(memberCols, 'branchId');
  const mDob = pick(memberCols, 'dateOfBirth');
  const mGender = pick(memberCols, 'gender');
  const mJoin = pick(memberCols, 'joinDate', 'joinedAt', 'startDate');

  let n = 0;
  for (let i = 0; i < ACCOUNTS.length; i++) {
    const [email, pw, role, fullName, phone] = ACCOUNTS[i];
    const hash = bcrypt.hashSync(pw, 10);
    const uid = crypto.randomUUID();

    const sets = [`"${uId}"`, `"${uEmail}"`, `"${uHash}"`, `"${uName}"`, `"${uRole}"`, `"${uStatus}"`];
    const vals = [`'${uid}'`, `'${email}'`, `'${hash}'`, `'${fullName}'`, `'${role}'`, `'ACTIVE'`];
    if (uPhone) { sets.push(`"${uPhone}"`); vals.push(`'${phone}'`); }
    if (uBranch) { sets.push(`"${uBranch}"`); vals.push(`'${BRANCH_ID}'`); }
    if (uAvatar) { sets.push(`"${uAvatar}"`); vals.push('NULL'); }
    if (uProvider) { sets.push(`"${uProvider}"`); vals.push(`'LOCAL'`); }
    if (uProviderId) { sets.push(`"${uProviderId}"`); vals.push('NULL'); }

    await c.query(
      `INSERT INTO users (${sets.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT ("${uEmail}") DO UPDATE SET "${uHash}" = EXCLUDED."${uHash}", "${uName}" = EXCLUDED."${uName}", "${uRole}" = EXCLUDED."${uRole}", "${uStatus}" = 'ACTIVE', "${uPhone}" = EXCLUDED."${uPhone}"`,
      [],
    );
    // Lấy id thật của user (có thể đã tồn tại từ lần seed trước)
    const uRow = await c.query(`SELECT id FROM users WHERE email = $1`, [email]);
    const realUid = uRow.rows[0]?.id || uid;
    n++;

    // Member cho role MEMBER / TRAINER
    if (role === 'MEMBER' || role === 'TRAINER') {
      const ms = [];
      const mv = [];
      if (mId) { ms.push(`"${mId}"`); mv.push(`'${crypto.randomUUID()}'`); }
      if (mCode) { ms.push(`"${mCode}"`); mv.push(`'M-${1000 + i}'`); }
      if (mName) { ms.push(`"${mName}"`); mv.push(`'${fullName}'`); }
      if (mEmail) { ms.push(`"${mEmail}"`); mv.push(`'${email}'`); }
      if (mUser) { ms.push(`"${mUser}"`); mv.push(`'${realUid}'`); }
      if (mStatus) { ms.push(`"${mStatus}"`); mv.push(`'ACTIVE'`); }
      if (mPhone) { ms.push(`"${mPhone}"`); mv.push(`'${phone}'`); }
      if (mBranch) { ms.push(`"${mBranch}"`); mv.push(`'${BRANCH_ID}'`); }
      if (mDob) { ms.push(`"${mDob}"`); mv.push(`'1995-0${(i % 9) + 1}-1${i % 9}'`); }
      if (mGender) { ms.push(`"${mGender}"`); mv.push(`'${i % 2 === 0 ? 'MALE' : 'FEMALE'}'`); }
      if (mJoin) { ms.push(`"${mJoin}"`); mv.push(`'2026-0${(i % 9) + 1}-01'`); }
      if (mId && mCode) {
        if (mUser) await c.query(`DELETE FROM members WHERE "${mUser}" = $1`, [realUid]);
        await c.query(
          `INSERT INTO members (${ms.join(', ')}) VALUES (${mv.join(', ')}) ON CONFLICT DO NOTHING`,
          [],
        );
      }
    }
  }
  console.log('USERS seeded:', n);
  const cnt = await c.query('SELECT count(*)::int AS n FROM users');
  const mc = await c.query('SELECT count(*)::int AS n FROM members');
  console.log('DB users =', cnt.rows[0].n, '| members =', mc.rows[0].n);
  await c.end();
})().catch((e) => {
  console.log('ERR', e.message);
  process.exit(1);
});
