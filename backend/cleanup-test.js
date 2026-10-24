const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const m = await p.member.findFirst({ where: { fullName: 'Nguyễn Văn Test' }, select: { id: true, code: true, userId: true } });
  console.log('TEST:', m ? m.code : 'NONE');
  if (m) {
    await p.checkIn.deleteMany({ where: { memberId: m.id } });
    await p.notification.deleteMany({ where: { memberId: m.id } });
    await p.faceEmbedding.deleteMany({ where: { memberId: m.id } });
    await p.auditLog.deleteMany({ where: { action: 'MEMBER_CREATE', entityId: m.id } });
    await p.member.delete({ where: { id: m.id } });
    if (m.userId) await p.user.delete({ where: { id: m.userId } });
    console.log('CLEANED:', m.code);
  }
  await p.$disconnect();
})();
