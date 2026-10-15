'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { memberApi } from '@/services/member.service';
import { Card, CardContent } from '@/components/ui/card';
import { QrCard } from '@/components/ui/qr-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { MEMBER_STATUS_META } from '@/lib/status';
import { ArrowLeft, Copy, MapPin, Printer, ScanLine, ShieldCheck } from 'lucide-react';

export default function MemberQrPage() {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  // qrcode sinh SVG ngay trên trình duyệt — chỉ chạy phía client
  useEffect(() => setMounted(true), []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['member-qr'],
    queryFn: memberApi.getMyQr,
    retry: 0,
    staleTime: Infinity, // token cố định, không cần gọi lại
  });

  const copyToken = async () => {
    if (!data?.token) return;
    try {
      await navigator.clipboard.writeText(data.token);
      toast.success('Đã sao chép', 'Chuỗi mã QR đã nằm trong bộ nhớ tạm.');
    } catch {
      toast.error(
        'Không sao chép được',
        'Trình duyệt chặn clipboard — hãy chọn tay chuỗi mã bên dưới.',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-line">
          <CardContent className="p-8 text-center">
            <ScanLine className="mx-auto size-10 text-muted" />
            <h2 className="mt-4 font-display text-xl font-bold uppercase tracking-tight text-chalk">
              Chưa có mã QR
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tài khoản này chưa gắn với hồ sơ hội viên nên chưa phát được thẻ QR.
            </p>
            <Link href="/member/profile">
              <Button variant="secondary" className="mt-5">
                <ArrowLeft className="size-4" /> Về hồ sơ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMeta = MEMBER_STATUS_META[data.member.status as keyof typeof MEMBER_STATUS_META];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Thẻ QR hội viên
        </h1>
        <p className="mt-1 text-sm text-muted">
          Đưa mã này cho lễ tân quét hoặc nhập chuỗi mã để check-in — không cần nhập mã thẻ.
        </p>
      </div>

      {/* Thẻ QR */}
      <Card className="overflow-hidden border-neon/30">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* QR — nền trắng cố ý để máy quét đọc được ở cả 2 theme */}
            <div className="shrink-0">
              {mounted ? (
                <QrCard token={data.token} downloadName={`the-qr-${data.member.code}`} />
              ) : (
                <Skeleton className="size-[280px] rounded-xl" />
              )}
            </div>

            {/* Thông tin trên thẻ */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="meta-label">Mã hội viên</p>
              <p className="mt-1 font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-neon">
                {data.member.code}
              </p>

              <p className="mt-4 truncate text-lg font-bold text-chalk">{data.member.fullName}</p>

              {data.member.branch && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted sm:justify-start">
                  <MapPin className="size-3.5 shrink-0" />
                  {data.member.branch.name}
                </p>
              )}

              {statusMeta && (
                <Badge variant={statusMeta.variant} className="mt-3">
                  {statusMeta.label}
                </Badge>
              )}

              <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Button variant="secondary" size="sm" onClick={copyToken}>
                  <Copy className="size-3.5" /> Sao chép chuỗi mã
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="size-3.5" /> In thẻ
                </Button>
              </div>
            </div>
          </div>

          {/* Chuỗi mã — để lễ tân dán vào ô tra cứu khi không quét được bằng camera */}
          <div className="mt-6 border-t border-line pt-4">
            <p className="meta-label">Chuỗi mã QR (dán vào ô tra cứu ở trang Check-in)</p>
            <p className="mt-1.5 break-all rounded-sm border border-line bg-ink px-3 py-2 font-mono text-[11px] leading-relaxed text-muted select-all">
              {data.token}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hướng dẫn */}
      <Card className="border-line">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-neon/25 bg-neon/10 text-neon">
              <ShieldCheck className="size-4" />
            </span>
            <div className="text-sm leading-relaxed text-muted">
              <p className="font-semibold text-chalk">Cách dùng thẻ QR</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                <li>
                  Tại quầy lễ tân, mở trang <strong className="text-chalk">Check-in</strong> → bấm{' '}
                  <strong className="text-chalk">Quét mã QR</strong> rồi nhập/chụp chuỗi mã này.
                </li>
                <li>
                  Mã QR cố định cho tài khoản của bạn — chụp màn hình một lần là dùng mãi, không
                  phải tải lại.
                </li>
                <li>
                  Mã chỉ giúp lễ tân <strong className="text-chalk">nhận diện</strong> bạn; vẫn phải
                  còn thẻ tập hiệu lực mới check-in được.
                </li>
                <li>
                  Nếu làm mất điện thoại, báo lễ tân khóa thẻ ở trang quản trị — mã QR cũ sẽ không
                  check-in được nữa.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
