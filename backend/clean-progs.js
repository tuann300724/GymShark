const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function clean() {
  const r = await p.program.deleteMany({ where: {} });
  console.log('Deleted programs:', r.count);
  await p.$disconnect();
}
clean();
