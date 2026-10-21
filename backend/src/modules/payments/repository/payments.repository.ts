/**
 * PaymentsRepository — Port (Clean Architecture) cho thanh toán.
 * Mọi thao tác data đi qua Stored Procedure.
 */

export interface PaymentListQuery {
  page: number;
  limit: number;
  status?: string;
  method?: string;
  memberId?: string;
  packageId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface PaymentListRow {
  id: string;
  code: string;
  memberId: string;
  membershipId: string | null;
  promotionId: string | null;
  amount: string | number;
  discountAmount: string | number | null;
  currency: string;
  method: string;
  status: string;
  transactionRef: string | null;
  notes: string | null;
  confirmedById: string | null;
  confirmedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // joined
  member_id: string | null;
  member_code: string | null;
  member_fullName: string | null;
  member_email: string | null;
  member_phone: string | null;
  membership_id: string | null;
  package_id: string | null;
  package_name: string | null;
  promotion_id: string | null;
  promotion_code: string | null;
  promotion_name: string | null;
  invoice_id: string | null;
  invoiceNumber: string | null;
  invoice_status: string | null;
  confirmedBy_id: string | null;
  confirmedBy_fullName: string | null;
}

export interface PaymentDetailRow extends PaymentListRow {
  member_address: string | null;
  member_gender: string | null;
  member_joinedAt: Date | null;
  branch_id: string | null;
  branch_name: string | null;
  branch_code: string | null;
  membership_startDate: Date | null;
  membership_endDate: Date | null;
  membership_status: string | null;
  membership_price: string | number | null;
  package_durationDays: number | null;
  package_price: string | number | null;
  package_description: string | null;
  package_type: string | null;
  promotion_discountType: string | null;
  promotion_discountValue: string | number | null;
  confirmedBy_role: string | null;
  invoice_memberId: string | null;
  invoice_membershipId: string | null;
  invoice_paymentId: string | null;
  invoice_subtotal: string | number | null;
  invoice_discount: string | number | null;
  invoice_total: string | number | null;
  invoice_status: string | null;
  invoice_issuedAt: Date | null;
  invoice_dueDate: Date | null;
  invoice_createdAt: Date | null;
}

export interface PaymentStats {
  totalRevenue: string | number;
  revenueToday: string | number;
  pendingCount: number;
  paidCount: number;
  failedCount: number;
  cancelledCount: number;
  refundedCount: number;
  refundedTotal: string | number;
}

export interface PaymentsRepository {
  list(
    query: PaymentListQuery,
  ): Promise<{ data: PaymentListRow[]; total: number }>;
  stats(): Promise<PaymentStats>;
  findOne(id: string): Promise<PaymentDetailRow | null>;
  findByTransactionRef(
    transactionRef: string,
    excludeId?: string,
  ): Promise<{ id: string; code: string } | null>;
  findByIdWithMembership(id: string): Promise<Record<string, unknown> | null>;
  confirm(input: {
    id: string;
    actorId: string;
    transactionRef?: string | null;
    note?: string | null;
  }): Promise<{
    payment: Record<string, unknown>;
    membership: Record<string, unknown> | null;
  }>;
  reject(input: {
    id: string;
    actorId: string;
    reason: string;
  }): Promise<{
    payment: Record<string, unknown>;
    membership: Record<string, unknown> | null;
  }>;
  refund(input: {
    id: string;
    actorId: string;
    reason: string | null;
    deactivateMembership: boolean;
  }): Promise<{
    payment: Record<string, unknown>;
    membership: Record<string, unknown> | null;
  }>;
}
