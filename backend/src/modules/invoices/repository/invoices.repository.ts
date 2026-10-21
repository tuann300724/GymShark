export interface InvoiceListRow {
  id: string;
  invoiceNumber: string;
  memberId: string;
  membershipId: string | null;
  paymentId: string | null;
  subtotal: string | number;
  discount: string | number;
  total: string | number;
  status: string;
  issuedAt: Date | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  member_id: string | null;
  member_code: string | null;
  member_fullName: string | null;
  member_email: string | null;
  member_phone: string | null;
  package_id: string | null;
  package_name: string | null;
  payment_code: string | null;
  payment_method: string | null;
  payment_status: string | null;
  payment_paidAt: Date | null;
}

export interface InvoicesRepository {
  list(query: {
    page: number;
    limit: number;
    status?: string;
    from?: string;
    to?: string;
    search?: string;
  }): Promise<{ data: InvoiceListRow[]; total: number }>;
  findOne(id: string): Promise<Record<string, unknown> | null>;
  listByMember(
    userId: string,
    query: { page: number; limit: number; status?: string },
  ): Promise<{
    data: InvoiceListRow[];
    total: number;
    page: number;
    limit: number;
  }>;
  findOneByMember(
    userId: string,
    id: string,
  ): Promise<Record<string, unknown> | null>;
  findByPaymentId(paymentId: string): Promise<Record<string, unknown> | null>;
}
