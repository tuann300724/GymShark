import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';
import { ExtendMembershipDto } from './dto/extend-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.membership.findMany({
      include: {
        member: { select: { id: true, code: true, fullName: true, phone: true } },
        package: { select: { id: true, name: true, durationDays: true, price: true } },
        payments: {
          select: { id: true, code: true, amount: true, method: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        member: true,
        package: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!membership) throw new NotFoundException('Không tìm thấy hợp đồng/thẻ hội viên');
    return membership;
  }

  /**
   * Cập nhật trạng thái membership:
   * - SUSPENDED: tạm khóa thẻ (chỉ từ ACTIVE)
   * - ACTIVE: kích hoạt lại (chỉ từ SUSPENDED hoặc PENDING khi đã thanh toán)
   * - CANCELLED: hủy hợp đồng (hủy kèm payment PENDING nếu có)
   * - EXPIRED: đánh dấu hết hạn
   */
  async updateStatus(id: string, dto: UpdateMembershipStatusDto, actorId?: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, fullName: true } },
        package: { select: { id: true, name: true } },
      },
    });
    if (!membership) throw new NotFoundException('Không tìm thấy hợp đồng/thẻ hội viên');

    const next = dto.status;
    const cur = membership.status;

    if (next === 'SUSPENDED' && cur !== 'ACTIVE') {
      throw new ConflictException('Chỉ có thể tạm khóa thẻ đang hoạt động (ACTIVE)');
    }
    if (next === 'ACTIVE' && cur === 'PENDING') {
      // Kích hoạt gói đang chờ thanh toán → chỉ khi có payment đã PAID
      const paidPayment = await this.prisma.payment.findFirst({
        where: { membershipId: id, status: 'PAID' },
      });
      if (!paidPayment) {
        throw new ConflictException('Chưa có khoản thanh toán được xác nhận cho gói này');
      }
    }
    if (next === 'CANCELLED' && (cur === 'CANCELLED' || cur === 'EXPIRED')) {
      throw new ConflictException('Hợp đồng đã ở trạng thái này');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.membership.update({ where: { id }, data: { status: next } });

      // Hủy đăng ký → hủy luôn hóa đơn đang PENDING
      if (next === 'CANCELLED') {
        await tx.payment.updateMany({
          where: { membershipId: id, status: 'PENDING' },
          data: { status: 'CANCELLED', notes: 'Hủy theo yêu cầu quản trị viên' },
        });
      }

      const notificationContentMap: Record<string, string> = {
        SUSPENDED: `Thẻ tập gói ${membership.package.name} của bạn đã bị tạm khóa${dto.reason ? ` (Lý do: ${dto.reason})` : ''}. Liên hệ lễ tân để biết thêm chi tiết.`,
        ACTIVE: `Gói tập ${membership.package.name} của bạn đã được kích hoạt lại.`,
        CANCELLED: `Hợp đồng gói ${membership.package.name} của bạn đã bị hủy${dto.reason ? ` (Lý do: ${dto.reason})` : ''}.`,
        EXPIRED: `Gói tập ${membership.package.name} của bạn đã hết hạn. Gia hạn ngay để tiếp tục tập luyện!`,
        PENDING: '',
      };

      const titleMap: Record<string, string> = {
        SUSPENDED: 'Thẻ tập bị tạm khóa ⛔',
        ACTIVE: 'Gói tập đã được kích hoạt ✅',
        CANCELLED: 'Hợp đồng đã bị hủy 🗑️',
        EXPIRED: 'Gói tập đã hết hạn ⚠️',
        PENDING: '',
      };

      if (notificationContentMap[next]) {
        await tx.notification.create({
          data: {
            memberId: membership.member.id,
            title: titleMap[next],
            content: notificationContentMap[next],
            type: 'MEMBERSHIP',
            link: '/member/membership',
          },
        });
      }

      return updated;
    });

    await this.auditService.log({
      userId: actorId,
      action: 'MEMBERSHIP_STATUS_CHANGE',
      entity: 'Membership',
      entityId: id,
      metadata: { from: cur, to: next, reason: dto.reason ?? null, memberName: membership.member.fullName },
    });

    return { message: `Đã cập nhật trạng thái thành ${next}`, membership: result };
  }

  /** Admin gia hạn thêm N ngày + tạo Payment PENDING (chờ thu tiền) */
  async extend(id: string, dto: ExtendMembershipDto, actorId?: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        member: { select: { id: true } },
        package: { select: { id: true, name: true, price: true } },
      },
    });
    if (!membership) throw new NotFoundException('Không tìm thấy hợp đồng/thẻ hội viên');

    if (membership.status === 'EXPIRED' || membership.status === 'CANCELLED') {
      throw new ConflictException('Không thể gia hạn hợp đồng đã kết thúc');
    }

    const newEndDate = new Date(membership.endDate.getTime() + dto.days * 24 * 60 * 60 * 1000);

    const code = await this.genPaymentCode();

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.membership.update({
        where: { id },
        data: {
          endDate: newEndDate,
          // Kéo status ACTIVE trở lại nếu đang ở PENDING/không có hiệu lực
          status: membership.status === 'PENDING' ? 'ACTIVE' : membership.status,
        },
      });

      const createdPayment = await tx.payment.create({
        data: {
          code,
          memberId: membership.member.id,
          membershipId: id,
          amount: membership.package.price,
          method: 'CASH',
          status: PaymentStatus.PENDING,
          notes: `Gia hạn bởi quản trị viên (+${dto.days} ngày)${dto.reason ? ` - ${dto.reason}` : ''}`,
        },
      });

      // Hóa đơn đi kèm (1-1 với payment)
      await tx.invoice.create({
        data: {
          invoiceNumber: code,
          memberId: membership.member.id,
          membershipId: id,
          paymentId: createdPayment.id,
          subtotal: membership.package.price,
          discount: 0,
          total: membership.package.price,
          status: InvoiceStatus.ISSUED,
          issuedAt: new Date(),
          dueDate: new Date(newEndDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.notification.create({
        data: {
          memberId: membership.member.id,
          title: 'Gói tập được gia hạn bởi lễ tân 🔄',
          content: `Lễ tân đã gia hạn thêm ${dto.days} ngày cho gói ${membership.package.name}. Hạn sử dụng mới: ${newEndDate.toLocaleDateString('vi-VN')}. Vui lòng đến quầy thu ngân để thanh toán.`,
          type: 'MEMBERSHIP',
          link: '/member/membership',
        },
      });

      return updated;
    });

    await this.auditService.log({
      userId: actorId,
      action: 'MEMBERSHIP_EXTEND',
      entity: 'Membership',
      entityId: id,
      metadata: { days: dto.days, newEndDate: newEndDate.toISOString(), paymentCode: code, reason: dto.reason ?? null },
    });

    return {
      message: `Đã gia hạn thêm ${dto.days} ngày (hạn mới: ${newEndDate.toLocaleDateString('vi-VN')})`,
      membership: result,
    };
  }

  private async genPaymentCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.payment.count();
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}