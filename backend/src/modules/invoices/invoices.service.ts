import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceListQueryDto } from './dto/invoice-list-query.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  /** Danh sách hóa đơn (admin) — filter + search + phân trang */
  async findAll(query: InvoiceListQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.InvoiceWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.issuedAt = {};
      if (query.from) where.issuedAt.gte = new Date(query.from);
      if (query.to) {
        const to = new Date(query.to);
        to.setHours(23, 59, 59, 999);
        where.issuedAt.lte = to;
      }
    }
    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { member: { fullName: { contains: q, mode: 'insensitive' } } },
        { member: { email: { contains: q, mode: 'insensitive' } } },
        { member: { code: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          member: { select: { id: true, code: true, fullName: true, email: true, phone: true } },
          membership: { include: { package: { select: { id: true, name: true } } } },
          payment: { select: { id: true, code: true, method: true, status: true, paidAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /** Chi tiết hóa đơn (admin) */
  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        member: { include: { branch: { select: { id: true, name: true, code: true } } } },
        membership: { include: { package: true } },
        payment: { include: { confirmedBy: { select: { id: true, fullName: true, role: true } } } },
      },
    });
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');
    return invoice;
  }

  /** Lịch sử hóa đơn của hội viên (userId từ JWT → resolve member) */
  async getMemberInvoices(userId: string, query: InvoiceListQueryDto = {}) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!member) return { data: [], total: 0, page: query.page || 1, limit: query.limit || 20 };

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = { memberId: member.id };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          membership: { include: { package: { select: { id: true, name: true, durationDays: true } } } },
          payment: { select: { id: true, code: true, method: true, status: true, paidAt: true, transactionRef: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /** Chi tiết hóa đơn của hội viên (chỉ xem được của chính mình) */
  async getMemberInvoice(userId: string, id: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Không tìm thấy hóa đơn');

    const invoice = await this.prisma.invoice.findFirst({
      where: { id, memberId: member.id },
      include: {
        member: { select: { id: true, code: true, fullName: true, email: true, phone: true, address: true } },
        membership: { include: { package: true } },
        payment: {
          include: { confirmedBy: { select: { id: true, fullName: true, role: true } } },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');
    return invoice;
  }

  /** Tìm hóa đơn theo paymentId (hỗ trợ nhúng vào payment detail nếu cần) */
  findByPaymentId(paymentId: string) {
    return this.prisma.invoice.findUnique({ where: { paymentId } });
  }
}