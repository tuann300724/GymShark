const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const codes = ['MEM-0009','MEM-0010','MEM-0011'];
  for (const code of codes) {
    const m = await p.member.findUnique({ where: { code }, select: { id: true, userId: true } });
    if (!m) { console.log('SKIP:', code, 'not found'); continue; }
    // Xóa theo thứ tự phụ thuộc
    await p.checkIn.deleteMany({ where: { memberId: m.id } });
    await p.notification.deleteMany({ where: { memberId: m.id } });
    await p.faceEmbedding.deleteMany({ where: { memberId: m.id } });
    await p.auditLog.deleteMany({ where: { entityId: m.id, action: 'MEMBER_CREATE' } });
    await p.membership.deleteMany({ where: { memberId: m.id } });
    await p.payment.deleteMany({ where: { memberId: m.id } });
    await p.invoice.deleteMany({ where: { memberId: m.id } });
    await p.trainingSchedule.deleteMany({ where: { memberId: m.id } });
    await p.trainerMember.deleteMany({ where: { memberId: m.id } });
    await p.trainingProgress.deleteMany({ where: { memberId: m.id } });
    await p.member.delete({ where: { id: m.id } });
    if (m.userId) await p.user.delete({ where: { id: m.userId } });
    console.log('CLEANED:', code);
  }
  const count = await p.member.count();
  console.log('Còn lại:', count, 'hội viên');
  await p.$disconnect();
})();
