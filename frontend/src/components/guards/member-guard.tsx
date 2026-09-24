'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/services/auth.service';
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'STAFF'];

/**
 * Bảo vệ khu vực /member/*
 * - Chưa đăng nhập  → /login
 * - ADMIN/MANAGER/STAFF → /admin
 * - MEMBER/TRAINER → ở lại member portal
 * (Backend vẫn tự kiểm tra authorization ở mọi API - guard này chỉ là UX)
 */
export function MemberGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'allowed' | 'guest' | 'admin'>('loading');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      setState('guest');
      return;
    }
    if (ADMIN_ROLES.includes(user.role)) {
      setState('admin');
      return;
    }
    setState('allowed');
  }, []);

  useEffect(() => {
    if (state === 'guest') router.replace('/login');
    if (state === 'admin') router.replace('/admin');
  }, [state, router]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-4 w-72" />
      </div>
    );
  }

  if (state !== 'allowed') return null;
  return <>{children}</>;
}