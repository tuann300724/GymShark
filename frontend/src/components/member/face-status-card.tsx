'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Clock, ScanFace, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { faceApi } from '@/services/face.service';
import { cn } from '@/lib/utils';

/**
 * Nhắc hội viên cập nhật ảnh khuôn mặt (Face ID) ở dashboard.
 * Ẩn khi ảnh đã được duyệt; hiện trạng thái chờ duyệt / bị từ chối kèm lý do.
 */
export default function FaceStatusCard() {
  const { data: status } = useQuery({
    queryKey: ['face-status'],
    queryFn: faceApi.getMyStatus,
    retry: 0,
  });

  if (!status || status.reviewStatus === 'APPROVED') return null;

  const view = {
    NONE: {
      icon: ScanFace,
      label: 'Cập nhật khuôn mặt',
      title: 'Thêm ảnh khuôn mặt để check-in nhanh',
      desc: 'Chụp ảnh khuôn mặt và gửi quản trị viên duyệt. Kết quả sẽ được gửi qua email.',
      cta: 'Cập nhật ngay',
    },
    PENDING: {
      icon: Clock,
      label: 'Face ID',
      title: 'Ảnh khuôn mặt đang chờ duyệt',
      desc: 'Quản trị viên đang kiểm tra ảnh của bạn — kết quả sẽ được gửi qua email.',
      cta: 'Xem trạng thái',
    },
    REJECTED: {
      icon: XCircle,
      label: 'Face ID',
      title: 'Ảnh khuôn mặt chưa được duyệt',
      desc: status.rejectReason
        ? `Lý do: ${status.rejectReason}`
        : 'Vui lòng chụp lại ảnh khuôn mặt rõ nét hơn.',
      cta: 'Chụp lại',
    },
  }[status.reviewStatus];
  const Icon = view.icon;
  const rejected = status.reviewStatus === 'REJECTED';

  return (
    <Card className={cn(rejected && 'border-danger/40')}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl border',
                rejected ? 'border-danger/40 bg-danger/10' : 'border-neon/25 bg-neon/10',
              )}
            >
              <Icon className={cn('size-5', rejected ? 'text-danger' : 'text-neon')} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                {view.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-chalk">{view.title}</p>
              <p className="mt-0.5 break-words text-xs text-muted">{view.desc}</p>
            </div>
          </div>
          <Link href="/member/face-registration" className="shrink-0">
            <Button size="sm" variant={status.reviewStatus === 'PENDING' ? 'secondary' : 'primary'}>
              <ScanFace className="size-3.5" /> {view.cta}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
