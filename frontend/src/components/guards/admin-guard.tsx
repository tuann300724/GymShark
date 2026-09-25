'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/services/auth.service';
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'STAFF'];

/**
 * Bảo vệ khu vực /admin/*
 * - Chưa đăng nhập → /login
 * - MEMBER/TRAINER → /member
 * - ADMIN/MANAGER/STAFF → ở lại admin
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'allowed' | 'guest' | 'member'>('loading');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      setState('guest');
      return;
    }
    if (ADMIN_ROLES.includes(user.role)) {
      setState('allowed');
      return;
    }
    setState('member');
  }, []);

  useEffect(() => {
    if (state === 'guest') router.replace('/login');
    if (state === 'member') router.replace('/member');
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
