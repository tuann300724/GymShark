'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser } from '@/services/auth.service';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CHANGE_PASSWORD_PATH,
  canAccessAdminPath,
  canAccessPartnerPath,
  isAdminRole,
  isPartnerRole,
} from '@/lib/auth';

type GuardState = 'loading' | 'allowed' | 'redirect';

function GuardSkeleton() {
  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}

/**
 * Bảo vệ khu vực /admin/* (ADMIN / MANAGER / STAFF)
 * - Chưa đăng nhập → /login
 * - MEMBER/TRAINER → /member
 * - PARTNER → chuyển sang khu riêng /partner (giữ đúng trang nếu có)
 * - Trang không đủ quyền → /admin/dashboard
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>('loading');

  useEffect(() => {
    const user = getStoredUser();
    let target: string | null = null;
    if (!user) target = '/login';
    else if (isPartnerRole(user.role)) {
      const mapped = pathname.replace(/^\/admin/, '/partner');
      target = canAccessPartnerPath(user.role, mapped) ? mapped : '/partner/dashboard';
    } else if (!isAdminRole(user.role)) target = '/member';
    else if (pathname !== '/admin' && !canAccessAdminPath(user.role, pathname))
      target = '/admin/dashboard';

    if (target) {
      setState('redirect');
      router.replace(target);
    } else setState('allowed');
  }, [pathname, router]);

  if (state !== 'allowed') return <GuardSkeleton />;
  return <>{children}</>;
}

/**
 * Bảo vệ khu vực /partner/* — chỉ tài khoản PARTNER (chủ hoặc nhân viên phòng gym đối tác).
 * Tài khoản hệ thống bị đẩy về /admin, hội viên về /member.
 */
export function PartnerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>('loading');

  useEffect(() => {
    const user = getStoredUser();
    let target: string | null = null;
    if (!user) target = '/login';
    else if (user.mustChangePassword) target = CHANGE_PASSWORD_PATH;
    else if (!isPartnerRole(user.role)) target = isAdminRole(user.role) ? '/admin' : '/member';
    else if (!canAccessPartnerPath(user.role, pathname)) target = '/partner/dashboard';

    if (target) {
      setState('redirect');
      router.replace(target);
    } else setState('allowed');
  }, [pathname, router]);

  if (state !== 'allowed') return <GuardSkeleton />;
  return <>{children}</>;
}
