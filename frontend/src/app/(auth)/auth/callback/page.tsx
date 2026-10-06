'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveSession } from '@/services/auth.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, AlertCircle, Loader2 } from 'lucide-react';
import { isAdminRole } from '@/lib/auth';

/**
 * Trang hứng callback sau khi đăng nhập Google xong.
 * Backend redirect về đây kèm `?g=<base64url {accessToken, user}>` —
 * trang lưu session rồi điều hướng theo vai trò (giống login thường).
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const g = params.get('g');
      if (!g) throw new Error('Thiếu dữ liệu đăng nhập từ Google');

      // Giải mã base64url KHÔNG dùng Buffer (không có sẵn trên trình duyệt):
      // đổi về base64 chuẩn → atob → TextDecoder (họ tên tiếng Việt là UTF-8).
      const b64 = g.replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (!data?.accessToken || !data?.user) throw new Error('Dữ liệu đăng nhập không hợp lệ');

      saveSession(data.accessToken, data.user);
      const role = data.user.role as string;
      router.push(role === 'TRAINER' ? '/trainer' : isAdminRole(role) ? '/admin' : '/member');
    } catch {
      setErrorMessage(
        'Đăng nhập bằng Google thất bại. Vui lòng thử lại hoặc đăng nhập bằng email.',
      );
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <Card className="w-full max-w-md border-line bg-surface/95">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl border border-neon/40 bg-surface text-neon">
            <Dumbbell className="size-7" />
          </div>
          <CardTitle className="font-display text-2xl font-bold uppercase tracking-tight text-chalk">
            Đăng nhập bằng Google
          </CardTitle>
          <CardDescription>
            {errorMessage ? 'Có lỗi xảy ra' : 'Đang hoàn tất đăng nhập...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {errorMessage ? (
            <>
              <div className="mb-4 flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 p-3 text-left text-xs text-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <Link href="/login" className="text-sm font-semibold text-neon hover:underline">
                Quay lại đăng nhập
              </Link>
            </>
          ) : (
            <Loader2 className="mx-auto size-8 animate-spin text-neon" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
