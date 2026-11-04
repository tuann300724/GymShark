const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function check() {
  const progs = await p.program.findMany({ include: { programExercises: true, trainer: { select: { userId: true } } } });
  console.log('=== PROGRAMS ===');
  for (const pg of progs) {
    console.log('ID:', pg.id, '| Name:', pg.name, '| Group:', pg.group, '| Status:', pg.status, '| Trainer:', pg.trainerId, '| Exercises:', pg.programExercises.length);
  }
  await p.$disconnect();
}
check();
