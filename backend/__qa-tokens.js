// Tạo JWT cho admin + member hiện có để QA API
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

(async () => {
  const users = await prisma.user.findMany({
    where: { email: { in: ['admin@gymshark.com', 'tuantran652003@gmail.com'] } },
    select: { id: true, email: true, role: true },
  });
  const secret = 'gym_management_super_secret_jwt_key_2026_lhu_grad';
  const out = {};
  for (const u of users) {
    out[u.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'] = jwt.sign(
      { sub: u.id, email: u.email, role: u.role },
      secret,
      { expiresIn: '7d' },
    );
  }
  console.log(JSON.stringify(out));
  await prisma.$disconnect();
})();
