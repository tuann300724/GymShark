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
  /** Tài khoản cấp mật khẩu tạm (PT, đối tác) — phải đổi mật khẩu trước khi dùng */
  mustChangePassword?: boolean;
}

/** Trang bắt đổi mật khẩu ở lần đăng nhập đầu */
export const CHANGE_PASSWORD_PATH = '/change-password';

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

// Tài khoản vận hành: ADMIN/MANAGER/STAFF dùng khu /admin; PARTNER (phòng gym đối tác)
// có khu riêng /partner với giao diện, menu và dashboard riêng.
const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'PARTNER'] as const;

export function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

export function isPartnerRole(role?: string): boolean {
  return role === 'PARTNER';
}

/** Trang chủ sau đăng nhập theo role */
export function getPortalHome(role?: string): string {
  if (isPartnerRole(role)) return '/partner/dashboard';
  if (isAdminRole(role)) return '/admin';
  if (role === 'TRAINER') return '/trainer';
  return '/member';
}

const matchPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * Các trang trong khu /partner. Trang dùng chung (hội viên, gói, thanh toán...) tái dùng
 * component của /admin — backend tự gói dữ liệu theo ownerPartnerId / partnerId.
 */
export const PARTNER_PATH_PREFIXES = [
  '/partner/dashboard',
  '/partner/partnership',
  '/partner/checkins',
  '/partner/facility-members',
  '/partner/branches',
  '/partner/members',
  '/partner/memberships',
  '/partner/membership-packages',
  '/partner/trainers',
  '/partner/schedules',
  '/partner/staff',
  '/partner/beverages',
  '/partner/finance',
  '/partner/payments',
  '/partner/reports/revenue',
] as const;

/** Trang trong /admin mà STAFF không vào được */
const STAFF_RESTRICTED_ADMIN_PREFIXES = [
  '/admin/partner-leads',
  // Duyệt hồ sơ PT tự do — chỉ ADMIN/MANAGER
  '/admin/trainer-applications',
  // Đối soát / chi trả buổi PT — chỉ ADMIN/MANAGER
  '/admin/pt-sessions',
] as const;
/** Check-in tại quầy chỉ còn dành cho lễ tân (STAFF); ADMIN/MANAGER không dùng */
const STAFF_ONLY_ADMIN_PREFIXES = ['/admin/checkins'] as const;
/** Không còn trong khu /admin — các trang này chỉ đối tác dùng ở /partner */
const REMOVED_ADMIN_PREFIXES = [
  '/admin/staff',
  // Bán nước và lịch tập/lớp học là nghiệp vụ tại cơ sở — chỉ còn ở khu /partner
  '/admin/beverages',
  '/admin/reports/beverages',
  '/admin/schedules',
] as const;

/** Dùng chung cho AdminGuard, sidebar, mobile-nav và ô tìm nhanh của khu /admin. */
export function canAccessAdminPath(role: string | undefined, pathname: string): boolean {
  if (!role || isPartnerRole(role) || !isAdminRole(role)) return false;
  if (REMOVED_ADMIN_PREFIXES.some((p) => matchPrefix(pathname, p))) return false;
  if (role === 'STAFF') {
    return !STAFF_RESTRICTED_ADMIN_PREFIXES.some((p) => matchPrefix(pathname, p));
  }
  return !STAFF_ONLY_ADMIN_PREFIXES.some((p) => matchPrefix(pathname, p));
}

/** Dùng cho PartnerGuard */
export function canAccessPartnerPath(role: string | undefined, pathname: string): boolean {
  if (!isPartnerRole(role)) return false;
  return PARTNER_PATH_PREFIXES.some((p) => matchPrefix(pathname, p));
}

/**
 * Đổi link /admin/... sang /partner/... khi trang dùng chung đang hiển thị trong khu đối tác.
 * Link tới trang không có ở khu đối tác thì giữ nguyên.
 */
export function toAreaHref(href: string, pathname: string | null): string {
  if (!pathname?.startsWith('/partner') || !href.startsWith('/admin')) return href;
  const mapped = href.replace(/^\/admin/, '/partner');
  const path = mapped.split(/[?#]/)[0];
  return PARTNER_PATH_PREFIXES.some((p) => matchPrefix(path, p)) ? mapped : href;
}
