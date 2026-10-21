/**
 * MembershipsRepository — Port (Clean Architecture) cho hợp đồng/thẻ hội viên.
 * Mọi thao tác data đi qua Stored Procedure; adapter ở `typeorm-memberships.repository.ts`.
 */

/** Dòng membership đã join sẵn member + package (dùng cho list) */
export interface MembershipListRow {
  id: string;
  memberId: string;
  packageId: string;
  startDate: Date;
  endDate: Date;
  price: string | number;
  discountAmount: string | number | null;
  finalAmount: string | number | null;
  remainingSessions: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  member_id: string | null;
  member_code: string | null;
  member_fullName: string | null;
  member_phone: string | null;
  package_id: string | null;
  package_name: string | null;
  package_durationDays: number | null;
  package_price: string | number | null;
}

/** Dòng membership join member + package đầy đủ (dùng cho findOne) */
export interface MembershipDetailRow extends MembershipListRow {
  member_userId: string | null;
  member_email: string | null;
  member_gender: string | null;
  member_dateOfBirth: Date | null;
  member_address: string | null;
  member_avatarUrl: string | null;
  member_status: string | null;
  member_notes: string | null;
  member_emergencyContact: string | null;
  member_joinedAt: Date | null;
  member_branchId: string | null;
  member_createdAt: Date | null;
  member_updatedAt: Date | null;
  package_code: string | null;
  package_description: string | null;
  package_features: string | null;
  package_sessions: number | null;
  package_type: string | null;
  package_status: string | null;
  package_allowedBranches: string | null;
  package_createdAt: Date | null;
  package_updatedAt: Date | null;
}

/** Dòng membership trần (kết quả sau khi update/extend), kèm tên member/package để dựng thông báo */
export interface MembershipRow {
  id: string;
  memberId: string;
  packageId: string;
  startDate: Date;
  endDate: Date;
  price: string | number;
  discountAmount: string | number | null;
  finalAmount: string | number | null;
  remainingSessions: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  member_fullName?: string | null;
  package_name?: string | null;
  package_price?: string | number | null;
}

export interface PaymentRow {
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
}

export interface MembershipsRepository {
  list(): Promise<MembershipListRow[]>;
  findOne(id: string): Promise<MembershipDetailRow | null>;
  findById(id: string): Promise<MembershipRow | null>;
  paymentsByMembership(membershipId: string): Promise<PaymentRow[]>;
  hasPaidPayment(membershipId: string): Promise<boolean>;
  setStatus(
    id: string,
    status: string,
    notification?: { title: string; content: string } | null,
  ): Promise<MembershipRow | null>;
  extend(input: {
    id: string;
    days: number;
    paymentCode: string;
    reason?: string | null;
    notificationContent: string;
  }): Promise<MembershipRow | null>;
  paymentCount(): Promise<number>;
}
