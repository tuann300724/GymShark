import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RevenueReportQueryDto } from './dto/revenue-report-query.dto';
import { EquipmentService } from '../equipment/equipment.service';
import { BranchesService } from '../branches/branches.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private readonly equipmentService: EquipmentService,
    private readonly branchesService: BranchesService,
  ) {}

  /** Filter hội viên theo chi nhánh (STEP 7) */
  private memberWhere(branchId?: string): Prisma.MemberWhereInput {
    return branchId ? { branchId } : {};
  }

  async getSummary(branchId?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalMembers, activeMemberIds, expiredMembers, pendingMemberships, pendingPayments, totalRevenue, revenueThisMonth, newMembersThisMonth, totalTrainers, totalBranches, todayCheckIns, todayCheckOuts, currentlyInside] =
      await Promise.all([
        this.prisma.member.count({ where: this.memberWhere(branchId) }),
        // Hội viên đang có thẻ còn hiệu lực
        this.prisma.membership.findMany({
          where: {
            status: 'ACTIVE',
            endDate: { gte: now },
            ...(branchId ? { member: { is: { branchId } } } : {}),
          },
          select: { memberId: true },
          distinct: ['memberId'],
        }),
        // Hội viên có thẻ đã hết hạn và hiện không có thẻ hiệu lực
        this.prisma.membership.findMany({
          where: {
            endDate: { lt: now },
            ...(branchId ? { member: { is: { branchId } } } : {}),
          },
          select: { memberId: true, endDate: true },
          distinct: ['memberId'],
        }),
        this.prisma.membership.count({
          where: { status: 'PENDING', ...(branchId ? { member: { is: { branchId } } } : {}) },
        }),
        this.prisma.payment.count({
          where: { status: 'PENDING', ...(branchId ? { member: { is: { branchId } } } : {}) },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'PAID', ...(branchId ? { member: { is: { branchId } } } : {}) },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'PAID',
            createdAt: { gte: startOfMonth },
            ...(branchId ? { member: { is: { branchId } } } : {}),
          },
        }),
        this.prisma.member.count({
          where: { joinedAt: { gte: startOfMonth }, ...this.memberWhere(branchId) },
        }),
        this.prisma.trainer.count({
          where: { status: 'ACTIVE', ...(branchId ? { user: { is: { branchId } } } : {}) },
        }),
        this.prisma.branch.count({ where: { status: 'ACTIVE' } }),
        this.prisma.checkIn.count({
          where: {
            checkInTime: { gte: new Date(now.setHours(0, 0, 0, 0)) },
            ...(branchId ? { branchId } : {}),
          },
        }),
        this.prisma.checkIn.count({
          where: {
            checkOutTime: { gte: new Date(now.setHours(0, 0, 0, 0)) },
            ...(branchId ? { branchId } : {}),
          },
        }),
        this.prisma.checkIn.count({
          where: { status: 'CHECKED_IN', ...(branchId ? { branchId } : {}) },
        }),
      ]);

    const activeIds = new Set(activeMemberIds.map((m) => m.memberId));
    const expiredSet = new Set(
      expiredMembers.filter((m) => !activeIds.has(m.memberId)).map((m) => m.memberId),
    );

    return {
      totalMembers,
      activeMembers: activeIds.size,
      expiredMembers: expiredSet.size,
      pendingMemberships,
      pendingPayments,
      newMembersThisMonth,
      totalRevenue: totalRevenue._sum.amount || 0,
      revenueThisMonth: revenueThisMonth._sum.amount || 0,
      totalTrainers,
      totalBranches,
      todayCheckIns,
      todayCheckOuts,
      currentlyInside,
    };
  }

  async getRevenueTrend() {
    const payments = await this.prisma.payment.findMany({
      where: { status: 'PAID' },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      totalTransactions: payments.length,
      data: payments,
    };
  }

  /**
   * Báo cáo doanh thu đầy đủ (STEP 6):
   * Chỉ tính Payment.status = PAID; REFUNDED hạch toán riêng, không tính vào doanh thu.
   * PENDING / FAILED / CANCELLED không tính.
   */
  async getRevenue(query: RevenueReportQueryDto) {
    const now = new Date();
    const startOfToday = this.startOfDay(now);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((startOfWeek.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Filter chung (áp dụng cho toàn bộ aggregation)
    const baseWhere: Prisma.PaymentWhereInput = { status: 'PAID' };
    if (query.method) baseWhere.method = query.method;
    if (query.packageId) baseWhere.membership = { is: { packageId: query.packageId } };
    if (query.branchId) baseWhere.member = { is: { branchId: query.branchId } };

    // Phạm vi ngày cho biểu đồ theo ngày (mặc định 30 ngày gần nhất)
    const rangeFrom = query.from ? this.startOfDay(new Date(query.from)) : this.daysAgo(29);
    const rangeTo = query.to ? this.endOfDay(new Date(query.to)) : now;

    const [
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueYear,
      refundedAgg,
      totalsAgg,
      paidCount,
      pendingCount,
      failedCount,
      cancelledCount,
      refundedCount,
      dayRows,
      monthRows,
      methodRows,
      packageRows,
      recentPayments,
    ] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { ...baseWhere, paidAt: { gte: startOfToday } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { ...baseWhere, paidAt: { gte: startOfWeek } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { ...baseWhere, paidAt: { gte: startOfMonth } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { ...baseWhere, paidAt: { gte: startOfYear } } }),
      // Hoàn tiền hạch toán riêng (không tính doanh thu thực nhận)
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: 'REFUNDED', paidAt: { gte: startOfMonth } },
      }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: baseWhere }),
      this.prisma.payment.count({ where: baseWhere }),
      this.prisma.payment.count({ where: { status: 'PENDING', ...(query.method ? { method: query.method } : {}) } }),
      this.prisma.payment.count({ where: { status: 'FAILED', ...(query.method ? { method: query.method } : {}) } }),
      this.prisma.payment.count({ where: { status: 'CANCELLED', ...(query.method ? { method: query.method } : {}) } }),
      this.prisma.payment.count({ where: { status: 'REFUNDED', ...(query.method ? { method: query.method } : {}) } }),
      // Dữ liệu theo ngày (trong phạm vi)
      this.prisma.payment.findMany({
        where: { ...baseWhere, paidAt: { gte: rangeFrom, lte: rangeTo } },
        select: { amount: true, paidAt: true },
      }),
      // Dữ liệu 12 tháng gần nhất (theo tháng)
      this.prisma.payment.findMany({
        where: { ...baseWhere, paidAt: { gte: this.monthsAgo(11) } },
        select: { amount: true, paidAt: true },
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: baseWhere,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['membershipId'],
        where: baseWhere,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.findMany({
        where: baseWhere,
        include: {
          member: { select: { id: true, code: true, fullName: true } },
          membership: { include: { package: { select: { id: true, name: true } } } },
        },
        orderBy: { paidAt: 'desc' },
        take: 10,
      }),
    ]);

    // Group theo ngày
    const dayMap = new Map<string, { date: string; revenue: number; count: number }>();
    dayRows.forEach((r) => {
      const key = this.dayKey(r.paidAt!);
      const cur = dayMap.get(key) || { date: key, revenue: 0, count: 0 };
      cur.revenue += Number(r.amount);
      cur.count += 1;
      dayMap.set(key, cur);
    });
    const byDay = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Group theo tháng (12 tháng)
    const monthMap = new Map<string, { month: string; revenue: number; count: number }>();
    monthRows.forEach((r) => {
      const key = this.monthKey(r.paidAt!);
      const cur = monthMap.get(key) || { month: key, revenue: 0, count: 0 };
      cur.revenue += Number(r.amount);
      cur.count += 1;
      monthMap.set(key, cur);
    });
    const byMonth = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // Group theo phương thức
    const byMethod = methodRows.map((r) => ({
      method: r.method,
      revenue: Number(r._sum.amount || 0),
      count: r._count,
    }));

    // Group theo gói tập (lấy tên package)
    const membershipIds = packageRows.map((r) => r.membershipId).filter(Boolean) as string[];
    const memberships = membershipIds.length
      ? await this.prisma.membership.findMany({
          where: { id: { in: membershipIds } },
          select: { id: true, package: { select: { id: true, name: true } } },
        })
      : [];
    const pkgNameById = new Map(memberships.map((m) => [m.id, m.package.name]));
    const byPackage = packageRows
      .filter((r) => r.membershipId)
      .map((r) => ({
        packageId: r.membershipId,
        packageName: pkgNameById.get(r.membershipId!) || 'Không xác định',
        revenue: Number(r._sum.amount || 0),
        count: r._count,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      stats: {
        revenueToday: revenueToday._sum.amount || 0,
        revenueThisWeek: revenueWeek._sum.amount || 0,
        revenueThisMonth: revenueMonth._sum.amount || 0,
        revenueThisYear: revenueYear._sum.amount || 0,
        totalRevenue: totalsAgg._sum.amount || 0,
        totalPaidCount: paidCount,
        pendingCount,
        failedCount,
        cancelledCount,
        refundedThisMonth: refundedAgg._sum.amount || 0,
        refundedThisMonthCount: refundedAgg._count,
        refundedCount,
      },
      byDay,
      byMonth,
      byMethod,
      byPackage,
      recentPayments,
      // Back-compat với trang Reports cũ
      totalTransactions: paidCount,
      data: recentPayments.map((p) => ({ amount: p.amount, createdAt: p.paidAt })),
    };
  }

  /** Dữ liệu tổng hợp cho trang Dashboard admin (+ lọc theo chi nhánh STEP 7) */
  async getDashboard(branchId?: string) {
    const stats = await this.getSummary(branchId);

    const [recentRegistrations, pendingPayments] = await Promise.all([
      this.prisma.membership.findMany({
        where: branchId ? { member: { is: { branchId } } } : {},
        include: {
          member: { select: { id: true, code: true, fullName: true, phone: true } },
          package: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.payment.findMany({
        where: { status: 'PENDING', ...(branchId ? { member: { is: { branchId } } } : {}) },
        include: {
          member: { select: { id: true, code: true, fullName: true, phone: true } },
          membership: { include: { package: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    return { stats, recentRegistrations, pendingPayments };
  }

  // ---------------------------------------------------------------------------
  // STEP 7 — Branch overview + Equipment stats (cho dashboard / báo cáo)
  // ---------------------------------------------------------------------------

  /** GET /reports/branches — tổng quan từng chi nhánh: hội viên, check-in, doanh thu, thiết bị, HLV */
  async getBranchOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const branches = await this.prisma.branch.findMany({
      include: {
        _count: { select: { members: true, equipment: true, rooms: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const rows = await Promise.all(
      branches.map(async (b) => {
        const [activeMemberRows, checkInsThisMonth, revenueThisMonth, trainerCount, upcomingSessions, checkInsToday] =
          await Promise.all([
            this.prisma.membership.findMany({
              where: { status: 'ACTIVE', endDate: { gte: now }, member: { is: { branchId: b.id } } },
              select: { memberId: true },
              distinct: ['memberId'],
            }),
            this.prisma.checkIn.count({
              where: { branchId: b.id, checkInTime: { gte: startOfMonth } },
            }),
            this.prisma.payment.aggregate({
              _sum: { amount: true },
              where: { status: 'PAID', member: { is: { branchId: b.id } }, paidAt: { gte: startOfMonth } },
            }),
            this.prisma.trainer.count({
              where: { status: 'ACTIVE', user: { is: { branchId: b.id } } },
            }),
            this.prisma.trainingSchedule.count({
              where: { branchId: b.id, status: 'SCHEDULED', startTime: { gte: now } },
            }),
            this.prisma.checkIn.count({
              where: {
                branchId: b.id,
                checkInTime: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
              },
            }),
          ]);
        return {
          id: b.id,
          code: b.code,
          name: b.name,
          address: b.address,
          status: b.status,
          openingHours: b.openingHours,
          members: b._count.members,
          activeMembers: activeMemberRows.length,
          equipment: b._count.equipment,
          rooms: b._count.rooms,
          trainers: trainerCount,
          checkInsThisMonth,
          checkInsToday,
          revenueThisMonth: revenueThisMonth._sum.amount || 0,
          upcomingSessions,
        };
      }),
    );

    return { data: rows, total: rows.length };
  }

  /** GET /reports/equipment — tổng quan thiết bị hệ thống (ủy quyền EquipmentService) */
  async getEquipmentStats() {
    return this.equipmentService.getStats();
  }

  /** GET /reports/checkins/daily — số lượt check-in / check-out theo từng ngày */
  async getCheckInsDaily(from?: string, to?: string) {
    const toDate = to ? this.endOfDay(new Date(to)) : new Date();
    const fromDate = from ? this.startOfDay(new Date(from)) : this.daysAgo(30);

    const [checkIns, checkOuts] = await Promise.all([
      this.prisma.checkIn.findMany({
        where: { checkInTime: { gte: fromDate, lte: toDate } },
        select: { checkInTime: true },
      }),
      this.prisma.checkIn.findMany({
        where: { checkOutTime: { gte: fromDate, lte: toDate } },
        select: { checkOutTime: true },
      }),
    ]);

    const map = new Map<string, { checkIns: number; checkOuts: number }>();
    const add = (key: string, field: 'checkIns' | 'checkOuts') => {
      const cur = map.get(key) || { checkIns: 0, checkOuts: 0 };
      cur[field] += 1;
      map.set(key, cur);
    };

    checkIns.forEach((c) => add(this.dayKey(c.checkInTime), 'checkIns'));
    checkOuts.forEach((c) => add(this.dayKey(c.checkOutTime!), 'checkOuts'));

    const data = [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, counts]) => ({ date, ...counts }));

    const currentlyInside = await this.prisma.checkIn.count({
      where: { status: 'CHECKED_IN' },
    });

    return {
      data,
      summary: {
        totalCheckIns: checkIns.length,
        totalCheckOuts: checkOuts.length,
        currentlyInside,
      },
    };
  }

  /** GET /reports/checkins/hourly — lượt check-in theo giờ trong ngày (biểu đồ) */
  async getCheckInsHourly(date?: string) {
    const day = date ? new Date(date) : new Date();
    const start = this.startOfDay(day);
    const end = this.endOfDay(day);

    const rows = await this.prisma.checkIn.findMany({
      where: { checkInTime: { gte: start, lte: end } },
      select: { checkInTime: true },
    });

    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    for (const r of rows) {
      const h = r.checkInTime.getHours();
      if (h >= 0 && h < 24) buckets[h].count += 1;
    }

    let peakHour: number | null = null;
    let peakCount = 0;
    for (const b of buckets) {
      if (b.count > peakCount) {
        peakCount = b.count;
        peakHour = b.hour;
      }
    }

    return { date: this.dayKey(day), data: buckets, peakHour, peakCount };
  }

  /** GET /reports/checkins/members — thống kê chuyên cần theo từng hội viên */
  async getMemberAttendance(from?: string, to?: string, search?: string) {
    const toDate = to ? this.endOfDay(new Date(to)) : new Date();
    const fromDate = from ? this.startOfDay(new Date(from)) : this.daysAgo(30);

    const whereMember: Prisma.MemberWhereInput = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const members = await this.prisma.member.findMany({
      where: whereMember,
      select: {
        id: true,
        code: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        checkIns: {
          where: { checkInTime: { gte: fromDate, lte: toDate } },
          select: { checkInTime: true, checkOutTime: true },
          orderBy: { checkInTime: 'asc' },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return {
      from: this.dayKey(fromDate),
      to: this.dayKey(toDate),
      data: members.map((m) => {
        const visits = m.checkIns.length;
        const done = m.checkIns.filter((c) => c.checkOutTime);
        const totalMinutes = done.reduce(
          (sum, c) =>
            sum +
            Math.max(1, Math.round((c.checkOutTime!.getTime() - c.checkInTime.getTime()) / 60000)),
          0,
        );
        return {
          member: {
            id: m.id,
            code: m.code,
            fullName: m.fullName,
            phone: m.phone,
            avatarUrl: m.avatarUrl,
          },
          totalVisits: visits,
          avgDuration: done.length ? Math.round(totalMinutes / done.length) : 0,
          lastVisit: visits ? m.checkIns[visits - 1].checkInTime : null,
        };
      }),
    };
  }

  // ---------------------------------------------------------------------------
  // STEP 8 — Reports: members / memberships / trainers / attendance / overview
  // ---------------------------------------------------------------------------

  /** GET /reports/members — Hội viên: tổng, trạng thái, tăng trưởng theo tháng, chi nhánh */
  async getMembersReport(
    query: { branchId?: string; from?: string; to?: string; search?: string } = {},
  ) {
    const now = new Date();
    const memberWhere: Prisma.MemberWhereInput = {};
    if (query.branchId) memberWhere.branchId = query.branchId;
    if (query.from || query.to) {
      memberWhere.joinedAt = {
        ...(query.from ? { gte: this.startOfDay(new Date(query.from)) } : {}),
        ...(query.to ? { lte: this.endOfDay(new Date(query.to)) } : {}),
      };
    }
    if (query.search) {
      memberWhere.OR = [
        { fullName: { contains: query.search.trim(), mode: 'insensitive' } },
        { code: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, byStatus, recent, activeMemberRows, pendingCount] = await Promise.all([
      this.prisma.member.count({ where: memberWhere }),
      this.prisma.member.groupBy({ by: ['status'], where: memberWhere, _count: true }),
      this.prisma.member.findMany({
        where: memberWhere,
        include: {
          branch: { select: { id: true, name: true } },
          _count: { select: { payments: true, checkIns: true } },
        },
        orderBy: { joinedAt: 'desc' },
        take: 100,
      }),
      this.prisma.membership.findMany({
        where: {
          status: 'ACTIVE',
          endDate: { gte: now },
          ...(query.branchId ? { member: { is: { branchId: query.branchId } } } : {}),
        },
        select: { memberId: true },
        distinct: ['memberId'],
      }),
      this.prisma.membership.count({
        where: { status: 'PENDING', ...(query.branchId ? { member: { is: { branchId: query.branchId } } } : {}) },
      }),
    ]);

    // Tăng trưởng theo tháng
    const joinedRows = await this.prisma.member.findMany({
      where: memberWhere,
      select: { joinedAt: true },
    });
    const monthMap = new Map<string, number>();
    joinedRows.forEach((r) => {
      const key = this.monthKey(r.joinedAt);
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    });
    const growthByMonth = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    return {
      stats: {
        totalMembers: total,
        activeMembers: activeMemberRows.length,
        expiredMembers: Math.max(0, total - activeMemberRows.length),
        pendingMemberships: pendingCount,
      },
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count })),
      growthByMonth,
      recent,
    };
  }

  /** GET /reports/memberships — Gói tập: phổ biến, trạng thái, đăng ký theo tháng */
  async getMembershipsReport(
    query: { branchId?: string; from?: string; to?: string; packageId?: string } = {},
  ) {
    const where: Prisma.MembershipWhereInput = {
      ...(query.branchId ? { member: { is: { branchId: query.branchId } } } : {}),
      ...(query.packageId ? { packageId: query.packageId } : {}),
    };
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [byStatus, packageRows, monthRows, expiredCount, pendingCount] = await Promise.all([
      this.prisma.membership.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.membership.groupBy({ by: ['packageId'], where, _count: true }),
      this.prisma.membership.findMany({ where, select: { createdAt: true } }),
      this.prisma.membership.count({ where: { ...where, status: 'EXPIRED' } }),
      this.prisma.membership.count({ where: { ...where, status: 'PENDING' } }),
    ]);

    const pkgIds = packageRows.map((r) => r.packageId);
    const pkgs = pkgIds.length
      ? await this.prisma.membershipPackage.findMany({
          where: { id: { in: pkgIds } },
          select: { id: true, name: true, price: true },
        })
      : [];
    const pkgById = new Map(pkgs.map((p) => [p.id, p]));

    const monthMap = new Map<string, number>();
    monthRows.forEach((r) => {
      const key = this.monthKey(r.createdAt);
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    });
    const byMonth = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    return {
      stats: { expiredCount, pendingCount, byMonth },
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count })),
      packagePopularity: packageRows
        .map((r) => ({
          packageId: r.packageId,
          packageName: pkgById.get(r.packageId)?.name || 'Không xác định',
          price: pkgById.get(r.packageId)?.price || 0,
          count: r._count,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /** GET /reports/trainers — HLV: số hội viên phụ trách, số buổi tập, theo chi nhánh */
  async getTrainersReport(query: { branchId?: string } = {}) {
    const trainers = await this.prisma.trainer.findMany({
      where: { ...(query.branchId ? { user: { is: { branchId: query.branchId } } } : {}) },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            branch: { select: { id: true, name: true } },
          },
        },
        _count: { select: { trainerMembers: true, schedules: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const completedRows = await this.prisma.trainingSchedule.groupBy({
      by: ['trainerId'],
      where: { status: 'COMPLETED' },
      _count: true,
    });
    const completedMap = new Map(completedRows.map((r) => [r.trainerId, r._count]));

    return {
      stats: {
        totalTrainers: trainers.length,
        activeTrainers: trainers.filter((t) => t.status === 'ACTIVE').length,
      },
      data: trainers.map((t) => ({
        id: t.id,
        fullName: t.user.fullName,
        email: t.user.email,
        avatarUrl: t.user.avatarUrl,
        branch: t.user.branch,
        status: t.status,
        memberCount: t._count.trainerMembers,
        scheduleCount: t._count.schedules,
        completedSessions: completedMap.get(t.id) || 0,
      })),
    };
  }

  /** GET /reports/attendance — chuyên cần tổng hợp: theo ngày/giờ/thứ/chi nhánh */
  async getAttendanceReport(query: { from?: string; to?: string; branchId?: string } = {}) {
    const toDate = query.to ? this.endOfDay(new Date(query.to)) : new Date();
    const fromDate = query.from ? this.startOfDay(new Date(query.from)) : this.daysAgo(30);
    const branchFilter = query.branchId ? { branchId: query.branchId } : {};

    const [checkIns, checkOuts, byBranchRows] = await Promise.all([
      this.prisma.checkIn.findMany({
        where: { checkInTime: { gte: fromDate, lte: toDate }, ...branchFilter },
        select: { checkInTime: true },
      }),
      this.prisma.checkIn.findMany({
        where: { checkOutTime: { gte: fromDate, lte: toDate }, ...branchFilter },
        select: { checkOutTime: true },
      }),
      this.prisma.checkIn.groupBy({
        by: ['branchId'],
        where: { checkInTime: { gte: fromDate, lte: toDate }, ...branchFilter },
        _count: true,
      }),
    ]);

    const dayMap = new Map<string, { checkIns: number; checkOuts: number }>();
    const weekdayMap = new Map<number, number>();
    const hourBuckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));

    checkIns.forEach((c) => {
      const key = this.dayKey(c.checkInTime);
      const cur = dayMap.get(key) || { checkIns: 0, checkOuts: 0 };
      cur.checkIns += 1;
      dayMap.set(key, cur);
      const wd = c.checkInTime.getDay();
      weekdayMap.set(wd, (weekdayMap.get(wd) || 0) + 1);
      const h = c.checkInTime.getHours();
      if (h >= 0 && h < 24) hourBuckets[h].count += 1;
    });
    checkOuts.forEach((c) => {
      if (!c.checkOutTime) return;
      const key = this.dayKey(c.checkOutTime);
      const cur = dayMap.get(key) || { checkIns: 0, checkOuts: 0 };
      cur.checkOuts += 1;
      dayMap.set(key, cur);
    });

    const WEEKDAY_LABELS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const byWeekday = Array.from(weekdayMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([day, count]) => ({ day, label: WEEKDAY_LABELS[day] || `Thứ ${day + 1}`, count }));

    const branchIds = byBranchRows.map((r) => r.branchId);
    const branches = branchIds.length
      ? await this.prisma.branch.findMany({
          where: { id: { in: branchIds } },
          select: { id: true, name: true, code: true },
        })
      : [];
    const branchNameById = new Map(branches.map((b) => [b.id, b]));
    const byBranch = byBranchRows.map((r) => ({
      branchId: r.branchId,
      branchName: branchNameById.get(r.branchId)?.name || 'Không xác định',
      count: r._count,
    }));

    let peakHour: number | null = null;
    let peakCount = 0;
    hourBuckets.forEach((b) => {
      if (b.count > peakCount) {
        peakCount = b.count;
        peakHour = b.hour;
      }
    });

    return {
      from: this.dayKey(fromDate),
      to: this.dayKey(toDate),
      stats: {
        totalCheckIns: checkIns.length,
        totalCheckOuts: checkOuts.length,
        peakHour,
        peakCount,
        avgPerDay: dayMap.size ? Math.round(checkIns.length / dayMap.size) : 0,
      },
      byDay: Array.from(dayMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, counts]) => ({ date, ...counts })),
      byHour: hourBuckets,
      byWeekday,
      byBranch,
    };
  }

  /** GET /reports/overview — tổng hợp nhanh toàn hệ thống cho dashboard/báo cáo */
  async getOverview(query: { branchId?: string } = {}) {
    const summary = await this.getSummary(query.branchId);
    const revenue = await this.getRevenue({ branchId: query.branchId });
    const attendance = await this.getAttendanceReport({ branchId: query.branchId });
    return {
      summary,
      revenue: {
        today: revenue.stats.revenueToday,
        week: revenue.stats.revenueThisWeek,
        month: revenue.stats.revenueThisMonth,
        year: revenue.stats.revenueThisYear,
        total: revenue.stats.totalRevenue,
      },
      attendance: attendance.stats,
    };
  }

  // ---------------------------------------------------------------------------
  // CSV export (BOM cho Excel)
  // ---------------------------------------------------------------------------

  async exportCsv(
    type: string,
    query: { branchId?: string; from?: string; to?: string; search?: string } = {},
  ): Promise<{ filename: string; csv: string }> {
    if (type === 'revenue') {
      const r = await this.getRevenue(query);
      const headers = ['Ngày', 'Doanh thu (VNĐ)', 'Số giao dịch'];
      const rows = r.byDay.map((d) => [d.date, Number(d.revenue || 0).toFixed(0), d.count]);
      return { filename: 'doanh-thu.csv', csv: this.toCsv(headers, rows) };
    }
    if (type === 'members') {
      const r = await this.getMembersReport(query);
      const headers = ['Mã HV', 'Họ tên', 'Chi nhánh', 'Ngày tham gia'];
      const rows = r.recent.map((m) => [
        m.code,
        m.fullName,
        m.branch?.name || '',
        m.joinedAt.toISOString().slice(0, 10),
      ]);
      return { filename: 'hoi-vien.csv', csv: this.toCsv(headers, rows) };
    }
    if (type === 'attendance') {
      const r = await this.getAttendanceReport(query);
      const headers = ['Ngày', 'Check-in', 'Check-out'];
      const rows = r.byDay.map((d) => [d.date, d.checkIns, d.checkOuts]);
      return { filename: 'chuyen-can.csv', csv: this.toCsv(headers, rows) };
    }
    if (type === 'memberships') {
      const r = await this.getMembershipsReport(query);
      const headers = ['Gói tập', 'Số đăng ký'];
      const rows = r.packagePopularity.map((p) => [p.packageName, p.count]);
      return { filename: 'goi-tap.csv', csv: this.toCsv(headers, rows) };
    }
    throw new BadRequestException(
      'Loại báo cáo CSV không hợp lệ (revenue/members/attendance/memberships)',
    );
  }

  private toCsv(headers: string[], rows: (string | number)[][]) {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    // BOM để Excel mở tiếng Việt đúng encoding
    return (
      '\uFEFF' + [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers báo cáo
  // ---------------------------------------------------------------------------

  private startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private endOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  private daysAgo(n: number): Date {
    return this.startOfDay(new Date(Date.now() - n * 24 * 60 * 60 * 1000));
  }

  private monthsAgo(n: number): Date {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private dayKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private monthKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
}