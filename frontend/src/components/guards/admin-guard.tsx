'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser } from '@/services/auth.service';
import { Skeleton } from '@/components/ui/skeleton';
import { canAccessAdminPath, isAdminRole, isPartnerRole } from '@/lib/auth';

type GuardState = 'loading' | 'allowed' | 'guest' | 'member' | 'partner' | 'restricted';

const PARTNER_HOME = '/admin/dashboard';

/**
 * Bảo vệ khu vực /admin/*
 * - Chưa đăng nhập → /login
 * - MEMBER/TRAINER → /member hoặc /trainer
 * - PARTNER → dùng chung /admin, rơi về trang vận hành cơ sở của mình.
 * - ADMIN/MANAGER/STAFF → toàn quyền admin
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>('loading');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      setState('guest');
      return;
    }
    if (isPartnerRole(user.role)) {
      // /admin là trang điều hướng về dashboard riêng của cơ sở.
      setState(
        pathname === '/admin' || !canAccessAdminPath(user.role, pathname) ? 'partner' : 'allowed',
      );
      return;
    }
    if (canAccessAdminPath(user.role, pathname)) {
      setState('allowed');
    } else {
      setState(isAdminRole(user.role) ? 'restricted' : 'member');
    }
  }, [pathname]);

  useEffect(() => {
    if (state === 'guest') router.replace('/login');
    if (state === 'member') router.replace('/member');
    if (state === 'partner') router.replace(PARTNER_HOME);
    if (state === 'restricted') router.replace('/admin/dashboard');
  }, [state, router]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
    );
  }

  if (state !== 'allowed') return null;
  return <>{children}</>;
}
