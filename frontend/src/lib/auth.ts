// Đọc thông tin user đang đăng nhập từ localStorage (ghi bởi login flow)
export interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TRAINER' | 'MEMBER' | 'PARTNER';
  status?: string;
  avatarUrl?: string | null;
  /** Nhân viên của phòng gym đối tác (role PARTNER nhưng không phải chủ) */
  partnerStaff?: boolean;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('gym_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.role ? (parsed as StoredUser) : null;
  } catch {
    return null;
  }
}

// PARTNER dùng chung giao diện vận hành /admin, nhưng bị giới hạn ở trang quản
// lý cơ sở của chính họ: check-in (kèm quét mặt), bán nước uống, phân ca và
// tài chính cơ sở — không có danh bạ hội viên, báo cáo/doanh thu hệ thống.
const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'PARTNER'] as const;

export function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

export function isPartnerRole(role?: string): boolean {
  return role === 'PARTNER';
}

/**
 * Các prefix /admin/* được phép cho đối tác.
 * /admin/checkins + /admin/finance gói dữ liệu theo partnerId ngay ở backend;
 * đối tác không vào được danh bạ hội viên, báo cáo/doanh thu hệ thống.
 */
const PARTNER_ADMIN_PREFIXES = [
  '/admin/dashboard',
  '/admin/facility-members',
  '/admin/branches',
  '/admin/checkins',
  '/admin/beverages',
  '/admin/finance',
  '/admin/partnership',
  // Phòng gym tự quản lý (đợt 1) — backend gói dữ liệu theo ownerPartnerId
  '/admin/members',
  '/admin/memberships',
  '/admin/membership-packages',
  '/admin/payments',
  '/admin/reports/revenue',
  // Đợt 2 — PT, lịch tập & lớp học, nhân viên của phòng (backend gói theo đối tác)
  '/admin/trainers',
  '/admin/schedules',
  '/admin/staff',
] as const;

/** Các trang gắn với cơ sở riêng, chỉ tài khoản PARTNER mới có phạm vi dữ liệu phù hợp. */
const PARTNER_ONLY_ADMIN_PREFIXES = [
  '/admin/facility-members',
  '/admin/branches',
  '/admin/partnership',
] as const;
const STAFF_RESTRICTED_ADMIN_PREFIXES = ['/admin/partner-leads'] as const;

function isPartnerAllowedAdminPath(pathname: string): boolean {
  return PARTNER_ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Dùng chung cho AdminGuard, sidebar, mobile-nav và ô tìm nhanh. */
export function canAccessAdminPath(role: string | undefined, pathname: string): boolean {
  if (!role) return false;
  if (isPartnerRole(role)) return isPartnerAllowedAdminPath(pathname);
  if (!isAdminRole(role)) return false;
  if (
    role === 'STAFF' &&
    STAFF_RESTRICTED_ADMIN_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  )
    return false;
  return !PARTNER_ONLY_ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
