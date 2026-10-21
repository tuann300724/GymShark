import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InvoicesRepository } from "./repository/invoices.repository";
import { INVOICES_REPOSITORY } from "./repository/invoices.tokens";

function num(v: string | number | null | undefined) {
  if (v == null) return null;
  return Number(v);
}

function parseJson(v: unknown) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(INVOICES_REPOSITORY) private readonly repo: InvoicesRepository,
  ) {}

  /** Danh sách hóa đơn (admin) — filter + search + phân trang */
  async findAll(query: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const res = await this.repo.list({
      page,
      limit,
      status: query.status,
      from: query.from,
      to: query.to,
      search: query.search,
    });

    return {
      data: res.data.map((r: any) => ({
        id: r.id,
        invoiceNumber: r.invoiceNumber,
        memberId: r.memberId,
        membershipId: r.membershipId,
        paymentId: r.paymentId,
        subtotal: num(r.subtotal),
        discount: num(r.discount),
        total: num(r.total),
        status: r.status,
        issuedAt: r.issuedAt,
        dueDate: r.dueDate,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        member: r.member_id
          ? {
              id: r.member_id,
              code: r.member_code,
              fullName: r.member_fullName,
              email: r.member_email,
              phone: r.member_phone,
            }
          : null,
        membership: r.membership_id
          ? {
              id: r.membership_id,
              package: r.package_id
                ? { id: r.package_id, name: r.package_name }
                : null,
            }
          : null,
        payment: r.payment_id
          ? {
              id: r.payment_id,
              code: r.payment_code,
              method: r.payment_method,
              status: r.payment_status,
              paidAt: r.payment_paidAt,
            }
          : null,
      })),
      total: res.total,
      page,
      limit,
    };
  }

  /** Chi tiết hóa đơn (admin) */
  async findOne(id: string) {
    const r = await this.repo.findOne(id);
    if (!r) throw new NotFoundException("Không tìm thấy hóa đơn");

    const invoice = {
      id: (r as any).id,
      invoiceNumber: (r as any).invoiceNumber,
      memberId: (r as any).memberId,
      membershipId: (r as any).membershipId,
      paymentId: (r as any).paymentId,
      subtotal: num((r as any).subtotal),
      discount: num((r as any).discount),
      total: num((r as any).total),
      status: (r as any).status,
      issuedAt: (r as any).issuedAt,
      dueDate: (r as any).dueDate,
      createdAt: (r as any).createdAt,
      updatedAt: (r as any).updatedAt,
      member: (r as any).member_id
        ? {
            id: (r as any).member_id,
            code: (r as any).member_code,
            fullName: (r as any).member_fullName,
            email: (r as any).member_email,
            phone: (r as any).member_phone,
            address: (r as any).member_address,
            branch: (r as any).branch_id
              ? {
                  id: (r as any).branch_id,
                  name: (r as any).branch_name,
                  code: (r as any).branch_code,
                }
              : null,
          }
        : null,
      membership: (r as any).membership_id
        ? {
            id: (r as any).membership_id,
            startDate: (r as any).membership_startDate,
            endDate: (r as any).membership_endDate,
            status: (r as any).membership_status,
            price: num((r as any).membership_price),
            package: (r as any).package_id
              ? {
                  id: (r as any).package_id,
                  name: (r as any).package_name,
                  durationDays: (r as any).package_durationDays,
                  price: num((r as any).package_price),
                  description: (r as any).package_description,
                  type: (r as any).package_type,
                  features: parseJson((r as any).package_features),
                }
              : null,
          }
        : null,
      payment: (r as any).payment_id
        ? {
            id: (r as any).payment_id,
            code: (r as any).payment_code,
            method: (r as any).payment_method,
            status: (r as any).payment_status,
            amount: num((r as any).payment_amount),
            paidAt: (r as any).payment_paidAt,
            transactionRef: (r as any).payment_transactionRef,
            confirmedBy: (r as any).confirmedBy_id
              ? {
                  id: (r as any).confirmedBy_id,
                  fullName: (r as any).confirmedBy_fullName,
                  role: (r as any).confirmedBy_role,
                }
              : null,
          }
        : null,
    };

    return invoice;
  }

  /** Lịch sử hóa đơn của hội viên */
  async getMemberInvoices(userId: string, query: any = {}) {
    return this.repo.listByMember(userId, {
      page: query.page || 1,
      limit: query.limit || 20,
      status: query.status,
    });
  }

  /** Chi tiết hóa đơn của hội viên */
  async getMemberInvoice(userId: string, id: string) {
    const r = await this.repo.findOneByMember(userId, id);
    if (!r) throw new NotFoundException("Không tìm thấy hóa đơn");

    return {
      id: (r as any).id,
      invoiceNumber: (r as any).invoiceNumber,
      memberId: (r as any).memberId,
      membershipId: (r as any).membershipId,
      paymentId: (r as any).paymentId,
      subtotal: num((r as any).subtotal),
      discount: num((r as any).discount),
      total: num((r as any).total),
      status: (r as any).status,
      issuedAt: (r as any).issuedAt,
      dueDate: (r as any).dueDate,
      createdAt: (r as any).createdAt,
      updatedAt: (r as any).updatedAt,
      member: (r as any).member_id
        ? {
            id: (r as any).member_id,
            code: (r as any).member_code,
            fullName: (r as any).member_fullName,
            email: (r as any).member_email,
            phone: (r as any).member_phone,
            address: (r as any).member_address,
          }
        : null,
      membership: (r as any).membership_id
        ? {
            id: (r as any).membership_id,
            startDate: (r as any).membership_startDate,
            endDate: (r as any).membership_endDate,
            status: (r as any).membership_status,
            package: (r as any).package_id
              ? {
                  id: (r as any).package_id,
                  name: (r as any).package_name,
                  durationDays: (r as any).package_durationDays,
                  price: num((r as any).package_price),
                  description: (r as any).package_description,
                  type: (r as any).package_type,
                }
              : null,
          }
        : null,
      payment: (r as any).payment_id
        ? {
            id: (r as any).payment_id,
            code: (r as any).payment_code,
            method: (r as any).payment_method,
            status: (r as any).payment_status,
            amount: num((r as any).payment_amount),
            paidAt: (r as any).payment_paidAt,
            transactionRef: (r as any).payment_transactionRef,
            confirmedBy: (r as any).confirmedBy_id
              ? {
                  id: (r as any).confirmedBy_id,
                  fullName: (r as any).confirmedBy_fullName,
                  role: (r as any).confirmedBy_role,
                }
              : null,
          }
        : null,
    };
  }

  /** Tìm hóa đơn theo paymentId */
  async findByPaymentId(paymentId: string) {
    return this.repo.findByPaymentId(paymentId);
  }
}
