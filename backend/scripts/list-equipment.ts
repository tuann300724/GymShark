import { PrismaClient } from '@prisma/client';

process.loadEnvFile('.env');

const prisma = new PrismaClient();

async function main() {
  const list = await prisma.equipment.findMany({ orderBy: { code: 'asc' } });
  console.log(`Hien co ${list.length} thiet bi:`);
  list.forEach((e) =>
    console.log(`  ${e.code} | ${e.type} | ${e.status} | ${e.name}`),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
