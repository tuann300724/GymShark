import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { MemberStatus, PaymentMethod, Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { MemberService } from '../member/member.service';
import { PaymentsService } from '../payments/payments.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { RegisterCardDto } from './dto/register-card.dto';

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

/** Người thực hiện (lễ tân / quản trị) — lấy từ request.user do JwtStrategy.validate() gắn vào */
export interface StaffActor {
  id: string;
  role: string;
  branchId?: string | null;
}

/** Phương thức lễ tân có thể xác nhận thủ công tại quầy */
const MANUAL_PAYMENT_METHODS: PaymentMethod[] = [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER];

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private memberService: MemberService,
    private paymentsService: PaymentsService,
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

  // ---------------------------------------------------------------------------
  // Đăng ký hội viên mới tại quầy (lễ tân / quản trị)
  // ---------------------------------------------------------------------------

  /**
   * Tạo hội viên mới tại quầy: tạo tài khoản (User) để hội viên đăng nhập + hồ sơ (Member).
   * Không truyền mật khẩu → hệ thống sinh mật khẩu tạm, trả về 1 lần cho lễ tân đưa hội viên.
   */
  async create(dto: CreateMemberDto, actor: StaffActor) {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const phone = dto.phone.trim();

    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const branchId = await this.resolveBranchId(dto.branchId, actor.branchId);

    const typedPassword = dto.password?.trim() || '';
    const isTempPassword = !typedPassword;
    const rawPassword = isTempPassword ? this.genTempPassword() : typedPassword;
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const memberCode = await this.genMemberCode();

    const { user, member } = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          phone,
          role: UserRole.MEMBER,
          branchId,
        },
        select: { id: true, email: true, fullName: true, status: true },
      });

      const createdMember = await tx.member.create({
        data: {
          userId: createdUser.id,
          code: memberCode,
          fullName,
          email,
          phone,
          gender: dto.gender,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          address: dto.address?.trim() || null,
          emergencyContact: dto.emergencyContact?.trim() || null,
          branchId,
        },
        select: {
          id: true,
          code: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          branchId: true,
        },
      });

      return { user: createdUser, member: createdMember };
    });

    await this.prisma.notification.create({
      data: {
        memberId: member.id,
        title: 'Chào mừng đến với GymShark 🎉',
        content:
          'Tài khoản hội viên của bạn đã được tạo tại quầy. Hãy đăng nhập để xem thẻ tập, lịch tập và đăng ký khuôn mặt nhận diện nhanh tại quầy.',
        type: 'SYSTEM',
        link: '/member',
      },
    });

    await this.auditService.log({
      userId: actor.id,
      action: 'MEMBER_CREATE',
      entity: 'Member',
      entityId: member.id,
      metadata: {
        memberCode: member.code,
        fullName,
        email,
        phone,
        branchId,
        via: 'staff',
        tempPassword: isTempPassword,
      },
    });

    return {
      message: 'Đã tạo hội viên mới',
      member,
      user,
      // Chỉ trả về 1 lần duy nhất — lễ tân cần đưa cho hội viên đăng nhập lần đầu
      ...(isTempPassword ? { tempPassword: rawPassword } : {}),
    };
  }

  /**
   * Lễ tân tạo thẻ tập cho hội viên tại quầy.
   * - payNow = false → Membership PENDING + Payment PENDING + hoá đơn ISSUED (xác nhận sau ở /admin/payments)
   * - payNow = true  → thu tiền ngay: xác nhận thanh toán + kích hoạt thẻ (ACTIVE / PAID) qua
   *                    đúng luồng confirm chuẩn (hoá đơn PAID, notification, promotion usage, audit)
   */
  async registerCard(memberId: string, dto: RegisterCardDto, actor: StaffActor) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, code: true, fullName: true },
    });
    if (!member) throw new NotFoundException('Không tìm thấy hội viên');

    const method = dto.paymentMethod ?? PaymentMethod.CASH;

    // Nhân viên chỉ thu tiền tại quầy được với tiền mặt / chuyển khoản (khớp luồng PaymentConfirm)
    if (dto.payNow && !MANUAL_PAYMENT_METHODS.includes(method)) {
      throw new BadRequestException(
        'Thu tiền tại quầy chỉ áp dụng cho Tiền mặt hoặc Chuyển khoản. Với ví điện tử, hãy chọn "Chờ xác nhận thanh toán".',
      );
    }

    const created = await this.memberService.registerMembershipForMember(
      memberId,
      {
        packageId: dto.packageId,
        paymentMethod: method,
        promotionCode: dto.promotionCode,
        notes: dto.notes,
      },
      actor.id,
    );

    if (!dto.payNow) {
      return {
        message: 'Đã tạo thẻ — chờ xác nhận thanh toán',
        activated: false,
        member,
        membership: created.membership,
        payment: created.payment,
      };
    }

    const confirmed = await this.paymentsService.confirm(
      created.payment.id,
      { id: actor.id, role: actor.role },
      { transactionRef: dto.transactionRef },
    );

    return {
      message: 'Đã thu tiền và kích hoạt thẻ',
      activated: true,
      member,
      membership: confirmed.membership ?? created.membership,
      payment: confirmed.payment,
    };
  }

  /** Sinh mã hội viên dạng MEM-0001, bỏ qua mã đã tồn tại */
  private async genMemberCode(): Promise<string> {
    const count = await this.prisma.member.count();
    for (let i = 1; i <= 500; i++) {
      const code = `MEM-${String(count + i).padStart(4, '0')}`;
      const exists = await this.prisma.member.findUnique({ where: { code }, select: { id: true } });
      if (!exists) return code;
    }
    return `MEM-${Date.now().toString().slice(-8)}`;
  }

  /** Mật khẩu tạm 8 ký tự dễ đọc cho hội viên tự đổi sau lần đăng nhập đầu */
  private genTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  /** Ưu tiên: chi nhánh lễ tân chọn → chi nhánh của nhân viên đang đăng nhập → chi nhánh ACTIVE đầu tiên */
  private async resolveBranchId(requested?: string, actorBranchId?: string | null): Promise<string> {
    const candidate = requested || actorBranchId || null;
    if (candidate) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: candidate },
        select: { id: true, status: true },
      });
      if (!branch) throw new BadRequestException('Chi nhánh không tồn tại');
      if (branch.status !== 'ACTIVE') throw new BadRequestException('Chi nhánh đã ngừng hoạt động');
      return branch.id;
    }
    const fallback = await this.prisma.branch.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!fallback) throw new BadRequestException('Hệ thống chưa có chi nhánh hoạt động');
    return fallback.id;
  }
}