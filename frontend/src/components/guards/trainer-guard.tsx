'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/services/auth.service';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Bảo vệ khu vực /trainer/*
 * - Chưa đăng nhập → /login
 * - Không phải TRAINER → /member hoặc /admin
 * (Backend vẫn tự kiểm tra authorization ở mọi API - guard này chỉ là UX)
 */
export function TrainerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'allowed' | 'guest' | 'other'>('loading');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      setState('guest');
      return;
    }
    if (user.role === 'TRAINER') {
      setState('allowed');
      return;
    }
    setState('other');
  }, []);

  useEffect(() => {
    if (state === 'guest') router.replace('/login');
    if (state === 'other') {
      const user = getStoredUser();
      router.replace(
        user && ['ADMIN', 'MANAGER', 'STAFF'].includes(user.role) ? '/admin' : '/member',
      );
    }
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
