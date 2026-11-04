// Liệt kê user + tạo JWT cho admin để QA API
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

(async () => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, status: true },
    orderBy: { createdAt: 'asc' },
  });
  const secret = 'gym_management_super_secret_jwt_key_2026_lhu_grad';
  for (const u of users) {
    console.log(`${u.role} | ${u.status} | ${u.email} | ${u.id}`);
    if (['ADMIN', 'MANAGER', 'STAFF'].includes(u.role)) {
      const token = jwt.sign({ sub: u.id, email: u.email, role: u.role }, secret, { expiresIn: '7d' });
      console.log(`TOKEN ${u.email} ${token}`);
    }
  }
  await prisma.$disconnect();
})();
