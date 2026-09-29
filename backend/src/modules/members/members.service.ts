import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MemberStatus, Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { UpdateMemberDto } from './dto/update-member.dto';

export interface MemberListQuery {
  search?: string;
  status?: string;
  membershipStatus?: string;
  packageId?: string;
  branchId?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Danh sách hội viên với tìm kiếm, lọc, sắp xếp và phân trang.
   * Trả về { data, total, page, limit } để frontend render bảng quản trị.
   */
  async findAll(query: MemberListQuery = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = {};

    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status as MemberStatus;
    }

    // STEP 7 — lọc hội viên theo chi nhánh
    if (query.branchId && query.branchId !== 'ALL') {
      where.branchId = query.branchId;
    }

    const msWhere: Prisma.MembershipWhereInput = {};
    if (query.membershipStatus && query.membershipStatus !== 'ALL') {
      msWhere.status = query.membershipStatus as any;
    }
    if (query.packageId && query.packageId !== 'ALL') {
      msWhere.packageId = query.packageId;
    }
    if (Object.keys(msWhere).length > 0) {
      where.memberships = { some: msWhere };
    }

    let orderBy: Prisma.MemberOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort) {
      const dir = query.sort.startsWith('-') ? 'desc' : 'asc';
      const field = query.sort.replace(/^-/, '');
      const sortMap: Record<string, Prisma.MemberOrderByWithRelationInput> = {
        name: { fullName: dir },
        code: { code: dir },
        joinedAt: { joinedAt: dir },
        createdAt: { createdAt: dir },
      };
      if (sortMap[field]) orderBy = sortMap[field];
    }

    const [data, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, email: true, status: true } },
          memberships: {
            include: { package: { select: { id: true, name: true, durationDays: true } } },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.member.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        branch: true,
        user: { select: { id: true, email: true, role: true, status: true, avatarUrl: true } },
        memberships: {
          include: { package: true, payments: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        checkIns: {
          orderBy: { checkInTime: 'desc' },
          take: 30,
        },
        schedules: {
          include: { trainer: { include: { user: true } }, room: true },
          orderBy: { startTime: 'desc' },
          take: 20,
        },
      },
    });
    if (!member) throw new NotFoundException('Không tìm thấy hội viên');

    // Thống kê chuyên cần cho tab Attendance
    const [totalVisits, lastVisitRow, doneRows] = await Promise.all([
      this.prisma.checkIn.count({ where: { memberId: id } }),
      this.prisma.checkIn.findFirst({
        where: { memberId: id },
        orderBy: { checkInTime: 'desc' },
        select: { checkInTime: true },
      }),
      this.prisma.checkIn.findMany({
        where: { memberId: id, checkOutTime: { not: null } },
        select: { checkInTime: true, checkOutTime: true },
      }),
    ]);

    let avgDuration = 0;
    if (doneRows.length > 0) {
      const totalMinutes = doneRows.reduce(
        (sum, r) =>
          sum +
          Math.max(1, Math.round((r.checkOutTime!.getTime() - r.checkInTime.getTime()) / 60000)),
        0,
      );
      avgDuration = Math.round(totalMinutes / doneRows.length);
    }

    return {
      ...member,
      attendanceStats: {
        totalVisits,
        lastVisit: lastVisitRow?.checkInTime ?? null,
        avgDuration,
      },
    };
  }

  /** Admin cập nhật hồ sơ / trạng thái hội viên */
  async update(id: string, dto: UpdateMemberDto, actorId?: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundException('Không tìm thấy hội viên');

    const data: Prisma.MemberUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.emergencyContact !== undefined) data.emergencyContact = dto.emergencyContact;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) data.status = dto.status;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu nào để cập nhật');
    }

    // Đồng bộ trạng thái tài khoản đăng nhập (nếu có) — khóa member = khóa luôn login
    if (dto.status && member.userId) {
      const userStatusMap: Record<MemberStatus, UserStatus | undefined> = {
        ACTIVE: UserStatus.ACTIVE,
        INACTIVE: UserStatus.INACTIVE,
        SUSPENDED: UserStatus.SUSPENDED,
        EXPIRED: undefined,
      };
      const userStatus = userStatusMap[dto.status];
      if (userStatus) {
        await this.prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: member.userId! },
            data: { status: userStatus },
          });
          await tx.member.update({ where: { id }, data });
        });
        await this.notifyStatus(member.id, member.fullName, dto.status);
        const updated = await this.prisma.member.findUnique({ where: { id } });
        await this.auditService.log({
          userId: actorId,
          action: 'MEMBER_UPDATE',
          entity: 'Member',
          entityId: id,
          metadata: { fields: Object.keys(data), status: dto.status, statusChanged: true },
        });
        return { message: 'Cập nhật hội viên thành công', member: updated };
      }
    }

    const updated = await this.prisma.member.update({ where: { id }, data });

    if (dto.status) {
      await this.notifyStatus(member.id, member.fullName, dto.status);
    }

    await this.auditService.log({
      userId: actorId,
      action: 'MEMBER_UPDATE',
      entity: 'Member',
      entityId: id,
      metadata: { fields: Object.keys(data), status: dto.status ?? null, statusChanged: !!dto.status },
    });

    return { message: 'Cập nhật hội viên thành công', member: updated };
  }

  private async notifyStatus(memberId: string, fullName: string, status: MemberStatus) {
    const title =
      status === 'SUSPENDED'
        ? 'Tài khoản của bạn đã bị tạm khóa ⛔'
        : status === 'INACTIVE'
          ? 'Tài khoản của bạn đã bị vô hiệu hóa ⛔'
          : 'Tài khoản của bạn đã được kích hoạt ✅';

    const content =
      status === 'SUSPENDED'
        ? `Hội viên ${fullName}: thẻ tập đã bị tạm khóa bởi quản trị viên. Liên hệ lễ tân để biết thêm chi tiết.`
        : status === 'INACTIVE'
          ? `Hội viên ${fullName}: tài khoản đã bị vô hiệu hóa. Liên hệ lễ tân để biết thêm chi tiết.`
          : `Chào mừng trở lại ${fullName}! Tài khoản của bạn đã được kích hoạt lại.`;

    await this.prisma.notification.create({
      data: { memberId, title, content, type: 'SYSTEM', link: '/member' },
    });
  }

  /** Lịch sử HLV phụ trách của hội viên (cho tab Trainer trên hồ sơ member) */
  async getTrainers(memberId: string) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Không tìm thấy hội viên');

    return this.prisma.trainerMember.findMany({
      where: { memberId },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}