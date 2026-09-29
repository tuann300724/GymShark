// Đọc thông tin user đang đăng nhập từ localStorage (ghi bởi login flow)
export interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TRAINER' | 'MEMBER';
  status?: string;
  branchId?: string | null;
  avatarUrl?: string | null;
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

const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'STAFF'] as const;

export function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}
