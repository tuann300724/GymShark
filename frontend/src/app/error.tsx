'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** Error boundary toàn cục — hiển thị lỗi thân thiện thay vì màn hình trắng */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Chỉ log phía client — không hiển thị stack trace cho người dùng
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10">
        <AlertTriangle className="size-8 text-danger" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold uppercase tracking-wide text-chalk">
        Đã có lỗi xảy ra
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Hệ thống gặp sự cố không mong muốn. Bạn có thể thử lại ngay bây giờ, hoặc quay về trang chủ
        và thực hiện lại thao tác.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" size="lg" onClick={() => reset()}>
          <RefreshCcw className="size-4" /> Thử lại
        </Button>
        <Link href="/" passHref>
          <Button variant="outline" size="lg">
            <Home className="size-4" /> Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
