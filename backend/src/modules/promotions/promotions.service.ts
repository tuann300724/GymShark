import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import {
  CreatePromotionDto,
  PromotionQueryDto,
  PromotionUsagesQueryDto,
  UpdatePromotionDto,
} from './dto/promotion.dto';

const RESERVED_STATUSES = ['PENDING', 'PAID'];

@Injectable()
export class PromotionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Số lượt mã đang được dùng / đã dùng: đếm Payment có promotionId (PENDING + PAID = giữ chỗ) */
  private async usageReserved(promotionId: string): Promise<number> {
    return this.prisma.payment.count({
      where: { promotionId, status: { in: RESERVED_STATUSES as PaymentStatus[] } },
    });
  }

  /** Số lượt đã thanh toán thành công (PAID) — hiển thị cho admin */
  private async usagePaid(promotionId: string): Promise<number> {
    return this.prisma.payment.count({
      where: { promotionId, status: 'PAID' },
    });
  }

  /** Số lượt mỗi hội viên cụ thể đang dùng / đã dùng mã */
  private async memberUsage(promotionId: string, memberId: string): Promise<number> {
    return this.prisma.payment.count({
      where: { promotionId, memberId, status: { in: RESERVED_STATUSES as PaymentStatus[] } },
    });
  }

  /** Tự động đánh dấu EXPIRED các mã ACTIVE đã quá hạn (lazy sync, không reset dữ liệu) */
  private async autoExpire(): Promise<void> {
    await this.prisma.promotion.updateMany({
      where: { status: 'ACTIVE', endDate: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
  }

  /** Validate luật nghiệp vụ khi tạo/cập nhật */
  private assertRules(d: CreatePromotionDto | UpdatePromotionDto, isUpdate = false) {
    const value = d.discountValue as number | undefined;
    if (value !== undefined && value <= 0) {
      throw new BadRequestException('Giá trị giảm phải > 0');
    }
    if (d.discountType === DiscountType.PERCENTAGE && (d.discountValue as number | undefined) !== undefined && d.discountValue! > 100) {
      throw new BadRequestException('Phần trăm giảm không được vượt quá 100%');
    }
    const start = (d as any).startAt;
    const end = (d as any).endAt;
    if (start && end && new Date(start) >= new Date(end)) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }
    void isUpdate;
  }

  private toDetail(p: any, reserved: number, paid: number) {
    const remaining =
      p.usageLimit !== null && p.usageLimit !== undefined ? Math.max(0, p.usageLimit - reserved) : null;
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue,
      maxDiscount: p.maxDiscount,
      minOrderAmount: p.minOrderValue,
      startAt: p.startDate,
      endAt: p.endDate,
      usageLimit: p.usageLimit,
      perMemberLimit: p.perMemberLimit,
      status: p.status,
      usage: reserved,
      usagePaid: paid,
      remaining,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Admin: danh sách + thống kê
  // ---------------------------------------------------------------------------

  async findAll(query: PromotionQueryDto = {}) {
    await this.autoExpire();

    const where: Prisma.PromotionWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.type) where.discountType = query.type;
    if (query.search) {
      where.OR = [
        { code: { contains: query.search.trim(), mode: 'insensitive' } },
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }
    if (query.from || query.to) {
      where.endDate = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const rows = await this.prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Stats cho header (không phụ thuộc filter)
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [activeCount, expiringCount, expiredCount, totalUsed] = await Promise.all([
      this.prisma.promotion.count({ where: { status: 'ACTIVE', endDate: { gte: now } } }),
      this.prisma.promotion.count({
        where: { status: 'ACTIVE', endDate: { gte: now, lte: soon } },
      }),
      this.prisma.promotion.count({ where: { status: 'EXPIRED' } }),
      this.prisma.payment.count({ where: { promotionId: { not: null }, status: 'PAID' } }),
    ]);

    const data = await Promise.all(
      rows.map(async (r) => {
        const reserved = await this.usageReserved(r.id);
        const paid = await this.usagePaid(r.id);
        return this.toDetail(r, reserved, paid);
      }),
    );

    return {
      data,
      total: data.length,
      stats: {
        activeCount,
        expiringSoon: expiringCount,
        expiredCount,
        totalUsage: totalUsed,
      },
    };
  }

  /** Card tổng quan cho Dashboard admin */
  async getStats() {
    await this.autoExpire();
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [activeCount, expiringCount, expiredCount, totalUsage, totalDiscount] =
      await Promise.all([
        this.prisma.promotion.count({ where: { status: 'ACTIVE', endDate: { gte: now } } }),
        this.prisma.promotion.count({
          where: { status: 'ACTIVE', endDate: { gte: now, lte: soon } },
        }),
        this.prisma.promotion.count({ where: { status: 'EXPIRED' } }),
        this.prisma.payment.count({ where: { promotionId: { not: null }, status: 'PAID' } }),
        this.prisma.payment.aggregate({
          _sum: { discountAmount: true },
          where: { promotionId: { not: null }, status: 'PAID' },
        }),
      ]);
    return {
      activeCount,
      expiringSoon: expiringCount,
      expiredCount,
      totalUsage,
      totalDiscount: totalDiscount._sum.discountAmount || 0,
    };
  }

  async findOne(id: string) {
    await this.autoExpire();
    const p = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        payments: {
          select: { id: true, status: true, amount: true, discountAmount: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!p) throw new NotFoundException('Không tìm thấy mã khuyến mãi');

    const reserved = p.payments.filter((x) => RESERVED_STATUSES.includes(x.status)).length;
    const paid = p.payments.filter((x) => x.status === 'PAID').length;
    const uniqueMembers = new Set(
      (
        await this.prisma.payment.findMany({
          where: { promotionId: id, status: { in: RESERVED_STATUSES as PaymentStatus[] } },
          select: { memberId: true },
        })
      ).map((m) => m.memberId),
    ).size;

    const remaining =
      p.usageLimit !== null ? Math.max(0, p.usageLimit - reserved) : null;

    return {
      ...this.toDetail(p, reserved, paid),
      remaining,
      uniqueMembers,
    };
  }

  /** Lịch sử dùng mã: Member + Payment + Discount + thời điểm */
  async getUsages(id: string, query: PromotionUsagesQueryDto = {}) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Không tìm thấy mã khuyến mãi');

    const where: Prisma.PaymentWhereInput = { promotionId: id };
    if (query.status) where.status = query.status as PaymentStatus;
    if (query.method) where.method = query.method;

    const [usages, reserved, paid] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          member: { select: { id: true, code: true, fullName: true, phone: true } },
          membership: { include: { package: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.usageReserved(id),
      this.usagePaid(id),
    ]);

    return {
      promotion: { id: promo.id, code: promo.code, name: promo.name },
      stats: {
        totalUsage: reserved,
        paidUsage: paid,
        remaining: promo.usageLimit !== null ? Math.max(0, promo.usageLimit - reserved) : null,
        discountTotal: usages
          .filter((u) => u.status === 'PAID')
          .reduce((s, u) => s + Number(u.discountAmount || 0), 0),
      },
      data: usages.map((u) => ({
        id: u.id,
        paymentCode: u.code,
        status: u.status,
        amount: u.amount,
        discountAmount: u.discountAmount,
        paidAt: u.paidAt,
        createdAt: u.createdAt,
        method: u.method,
        member: u.member,
        packageName: u.membership?.package?.name ?? null,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(dto: CreatePromotionDto, actorId?: string) {
    this.assertRules(dto);

    const code = dto.code.trim().toUpperCase();
    const exists = await this.prisma.promotion.findUnique({ where: { code } });
    if (exists) throw new ConflictException(`Mã khuyến mãi "${code}" đã tồn tại`);

    const startDate = new Date(dto.startAt);
    const endDate = new Date(dto.endAt);
    if (startDate >= endDate) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }

    const promotion = await this.prisma.promotion.create({
      data: {
        code,
        name: dto.name,
        description: dto.description ?? null,
        discountType: dto.discountType,
        discountValue: new Prisma.Decimal(dto.discountValue),
        maxDiscount: dto.maxDiscount !== undefined ? new Prisma.Decimal(dto.maxDiscount) : null,
        minOrderValue:
          dto.minOrderAmount !== undefined ? new Prisma.Decimal(dto.minOrderAmount) : null,
        startDate,
        endDate,
        usageLimit: dto.usageLimit ?? null,
        perMemberLimit: dto.perMemberLimit ?? null,
        status: dto.status ?? 'ACTIVE',
      },
    });

    // Thông báo "Chương trình mới" cho hội viên (không spam — dedupe theo referenceType/Id)
    await this.notificationsService.broadcast(
      {
        type: 'PROMOTION',
        title: 'Chương trình khuyến mãi mới 🔥',
        content: `Mã ${code} — ${dto.name}. Áp dụng đến ${endDate.toLocaleDateString('vi-VN')}. Đăng ký gói tập ngay để nhận ưu đãi!`,
        link: '/packages',
        referenceType: 'PROMOTION_CREATE',
        referenceId: promotion.id,
      },
      'MEMBERS',
    );

    await this.auditService.log({
      userId: actorId,
      action: 'PROMOTION_CREATE',
      entity: 'Promotion',
      entityId: promotion.id,
      metadata: { code: promotion.code, name: promotion.name, discountType: promotion.discountType },
    });

    return { message: 'Tạo mã khuyến mãi thành công', promotion };
  }

  async update(id: string, dto: UpdatePromotionDto, actorId?: string) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy mã khuyến mãi');

    this.assertRules(dto, true);

    // Không cho sửa code nếu mã đã được sử dụng
    const used = await this.prisma.payment.count({
      where: {
        promotionId: id,
        status: { in: RESERVED_STATUSES as PaymentStatus[] },
      },
    });
    if (dto.code && used > 0 && dto.code.trim().toUpperCase() !== existing.code) {
      throw new BadRequestException(
        'Không thể đổi mã khuyến mãi vì mã này đã được sử dụng trong giao dịch thanh toán.',
      );
    }

    const data: Prisma.PromotionUpdateInput = {};
    if (dto.code) data.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.discountType) data.discountType = dto.discountType;
    if (dto.discountValue !== undefined) data.discountValue = new Prisma.Decimal(dto.discountValue);
    if (dto.maxDiscount !== undefined) data.maxDiscount = new Prisma.Decimal(dto.maxDiscount);
    if (dto.minOrderAmount !== undefined) data.minOrderValue = new Prisma.Decimal(dto.minOrderAmount);
    if (dto.startAt) data.startDate = new Date(dto.startAt);
    if (dto.endAt) data.endDate = new Date(dto.endAt);
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit;
    if (dto.perMemberLimit !== undefined) data.perMemberLimit = dto.perMemberLimit;

    // Kiểm tra startDate < endDate sau khi cập nhật
    const nextStart = dto.startAt ? new Date(dto.startAt) : existing.startDate;
    const nextEnd = dto.endAt ? new Date(dto.endAt) : existing.endDate;
    if (nextStart >= nextEnd) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }

    const promotion = await this.prisma.promotion.update({ where: { id }, data });
    await this.auditService.log({
      userId: actorId,
      action: 'PROMOTION_UPDATE',
      entity: 'Promotion',
      entityId: id,
      metadata: { code: promotion.code, fields: Object.keys(dto) },
    });

    return { message: 'Cập nhật mã khuyến mãi thành công', promotion };
  }

  async activate(id: string, actorId?: string) {
    const p = await this.prisma.promotion.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Không tìm thấy mã khuyến mãi');
    if (p.endDate < new Date()) {
      throw new BadRequestException('Mã khuyến mãi đã hết hạn, không thể kích hoạt lại');
    }
    const promotion = await this.prisma.promotion.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    await this.auditService.log({
      userId: actorId,
      action: 'PROMOTION_ACTIVATE',
      entity: 'Promotion',
      entityId: id,
      metadata: { code: p.code, from: p.status, to: 'ACTIVE' },
    });

    return { message: 'Đã kích hoạt mã khuyến mãi', promotion };
  }

  async deactivate(id: string, actorId?: string) {
    const p = await this.prisma.promotion.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Không tìm thấy mã khuyến mãi');
    const promotion = await this.prisma.promotion.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    await this.auditService.log({
      userId: actorId,
      action: 'PROMOTION_DEACTIVATE',
      entity: 'Promotion',
      entityId: id,
      metadata: { code: p.code, from: p.status, to: 'INACTIVE' },
    });

    return { message: 'Đã ngừng kích hoạt mã khuyến mãi', promotion };
  }

  // ---------------------------------------------------------------------------
  // Member: kiểm tra mã trước khi đăng ký (backend tự tính, không tin frontend)
  // ---------------------------------------------------------------------------

  /**
   * Validate + tính toán chiết khấu cho một gói tập.
   * memberId (tuỳ chọn): kiểm tra giới hạn mỗi hội viên (member tự validate).
   * KHÔNG giữ chỗ — chỉ preview; Payment thật vẫn tự tính lại khi tạo.
   */
  async validateCode(dto: { code: string; packageId: string }, userId?: string, role?: string) {
    const code = dto.code.trim().toUpperCase();
    const promo = await this.prisma.promotion.findUnique({ where: { code } });
    if (!promo || promo.status !== 'ACTIVE') {
      return { valid: false, message: 'Mã khuyến mãi không tồn tại hoặc chưa kích hoạt' };
    }
    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      return { valid: false, message: 'Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực' };
    }

    const pkg = await this.prisma.membershipPackage.findUnique({ where: { id: dto.packageId } });
    if (!pkg || pkg.status !== 'ACTIVE') {
      return { valid: false, message: 'Gói tập không tồn tại hoặc đã ngừng bán' };
    }

    const original = new Prisma.Decimal(pkg.price.toString());

    // Giới hạn tổng lượt dùng (đếm PENDING + PAID)
    const reserved = await this.usageReserved(promo.id);
    if (promo.usageLimit !== null && reserved >= promo.usageLimit) {
      return { valid: false, message: 'Mã khuyến mãi đã hết lượt sử dụng' };
    }

    // Giới hạn mỗi hội viên (chỉ áp dụng khi chính hội viên validate)
    if (userId && role === 'MEMBER' && promo.perMemberLimit !== null && promo.perMemberLimit !== undefined) {
      const member = await this.prisma.member.findUnique({ where: { userId } });
      if (member) {
        const memberUsed = await this.memberUsage(promo.id, member.id);
        if (memberUsed >= promo.perMemberLimit) {
          return { valid: false, message: 'Bạn đã dùng hết lượt của mã này' };
        }
      }
    }

    // Đơn tối thiểu
    if (promo.minOrderValue !== null && original.lt(new Prisma.Decimal(promo.minOrderValue.toString()))) {
      return {
        valid: false,
        message: `Mã chỉ áp dụng cho đơn từ ${Number(promo.minOrderValue).toLocaleString('vi-VN')}đ`,
      };
    }

    // Tính discount
    const dv = new Prisma.Decimal(promo.discountValue.toString());
    let discount = promo.discountType === 'PERCENTAGE' ? original.mul(dv).div(100) : dv;
    if (promo.maxDiscount !== null && discount.gt(new Prisma.Decimal(promo.maxDiscount.toString()))) {
      discount = new Prisma.Decimal(promo.maxDiscount.toString());
    }
    discount = discount.toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
    const total = original.minus(discount);

    return {
      valid: true,
      promotion: {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
      },
      subtotal: original,
      discount,
      total,
    };
  }
}