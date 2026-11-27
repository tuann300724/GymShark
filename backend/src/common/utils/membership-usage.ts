import { PrismaService } from "../../prisma/prisma.service";
import { PackageType } from "../constants/db-enums";

/**
 * Số lượt đã dùng của gói lượt (CREDIT_BASED) — cùng quy tắc với kiểm tra check-in:
 * đếm mọi lượt check-in của hội viên từ ngày bắt đầu gói.
 */
export function countCreditVisits(
  prisma: PrismaService,
  memberId: string,
  startDate: Date,
): Promise<number> {
  return prisma.checkIn.count({
    where: { memberId, checkInTime: { gte: startDate } },
  });
}

/**
 * Gói lượt đã dùng hết số lượt thì coi như kết thúc: ACTIVE → EXPIRED.
 * Nhờ vậy hội viên đăng ký / gia hạn / đổi gói mới bắt đầu ngay, không phải chờ hết ngày.
 */
export async function expireUsedUpCreditMemberships(
  prisma: PrismaService,
  memberId: string,
): Promise<void> {
  const actives = await prisma.membership.findMany({
    where: {
      memberId,
      status: "ACTIVE",
      package: { type: PackageType.CREDIT_BASED },
    },
    select: {
      id: true,
      startDate: true,
      package: { select: { visitLimit: true } },
    },
  });
  for (const m of actives) {
    const limit = m.package.visitLimit;
    if (limit == null || limit < 1) continue;
    if ((await countCreditVisits(prisma, memberId, m.startDate)) >= limit) {
      await prisma.membership.update({
        where: { id: m.id },
        data: { status: "EXPIRED" },
      });
    }
  }
}
