const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  }

  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: 'a0e8b1d2-3c4f-4a5b-9c6d-7e8f9a0b1c2d',
        email,
        passwordHash: hash,
        fullName: 'Tổng Quản Trị Hệ Thống',
        role: 'ADMIN',
        phone: '0901234567',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Admin created / updated');
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error('❌', e); process.exit(1); });
