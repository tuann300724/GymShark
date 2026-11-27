import type { Prisma } from "@prisma/client";

/**
 * Móc nối PtSession vào vòng đời Payment (gọi bên trong transaction của PaymentsService),
 * để buổi PT dùng chung luồng thanh toán / xác nhận / CASSO / báo cáo doanh thu với gói tập.
 */

/** Payment PAID → buổi PT được xếp lịch thật (TrainingSchedule) và ghi nhận doanh thu */
export async function onPtSessionPaymentPaid(
  tx: Prisma.TransactionClient,
  paymentId: string,
  paidAt: Date,
) {
  const session = await tx.ptSession.findFirst({
    where: { paymentId, status: "AWAITING_PAYMENT" },
    include: { trainer: { select: { userId: true } } },
  });
  if (!session) return null;

  const schedule = await tx.trainingSchedule.create({
    data: {
      title: session.title,
      trainerId: session.trainerId,
      memberId: session.memberId,
      type: "PERSONAL_TRAINING",
      startTime: session.startTime,
      endTime: session.endTime,
      status: "SCHEDULED",
      description: session.note,
      notes: `[PT_SESSION:${session.id}] Hội viên đặt qua chat, đã thanh toán`,
    },
    select: { id: true },
  });
  await tx.ptSession.update({
    where: { id: session.id },
    data: { status: "PAID", paidAt, scheduleId: schedule.id },
  });
  await tx.notification.create({
    data: {
      userId: session.trainer.userId,
      type: "PAYMENT",
      title: "Hội viên đã thanh toán buổi tập ✅",
      content: `Buổi "${session.title}" lúc ${session.startTime.toLocaleString("vi-VN")} đã được xác nhận thanh toán và thêm vào lịch dạy của bạn.`,
      link: "/trainer/schedule",
      referenceType: "PT_SESSION_PAID",
      referenceId: session.id,
    },
  });
  return session;
}

/** Payment bị từ chối / huỷ khi đang chờ → mở lại đề nghị để hội viên thanh toán lại */
export async function onPtSessionPaymentVoided(tx: Prisma.TransactionClient, paymentId: string) {
  await tx.ptSession.updateMany({
    where: { paymentId, status: "AWAITING_PAYMENT" },
    data: { status: "OFFERED", paymentId: null, respondedAt: null },
  });
}

/** Payment đã thanh toán bị hoàn tiền → huỷ buổi PT và lịch tập tương ứng */
export async function onPtSessionPaymentRefunded(tx: Prisma.TransactionClient, paymentId: string) {
  const session = await tx.ptSession.findFirst({
    where: { paymentId, status: "PAID" },
    select: { id: true, scheduleId: true },
  });
  if (!session) return;
  await tx.ptSession.update({ where: { id: session.id }, data: { status: "CANCELLED" } });
  if (session.scheduleId) {
    await tx.trainingSchedule.updateMany({
      where: { id: session.scheduleId, status: "SCHEDULED" },
      data: { status: "CANCELLED", cancellationNote: "Hoàn tiền buổi PT" },
    });
  }
}
