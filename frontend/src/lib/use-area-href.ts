'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { toAreaHref } from '@/lib/auth';

/**
 * Trang dùng chung giữa /admin và /partner viết link dạng `/admin/...`;
 * hook này đổi sang `/partner/...` khi đang ở khu đối tác.
 */
export function useAreaHref() {
  const pathname = usePathname();
  return useCallback((href: string) => toAreaHref(href, pathname), [pathname]);
}
