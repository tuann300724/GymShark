'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';
import { faceApi, type FacePendingReview } from '@/services/face.service';
import { formatDateTime } from '@/lib/utils';
import { Check, Mail, ScanFace, X } from 'lucide-react';

/** Lý do từ chối hay gặp — bấm để điền nhanh */
const QUICK_REASONS = [
  'Ảnh mờ hoặc thiếu sáng',
  'Khuôn mặt bị che (kính, khẩu trang, mũ)',
  'Không phải ảnh khuôn mặt chính chủ',
  'Khuôn mặt không nằm chính giữa khung hình',
];

export default function FaceReviewsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [rejecting, setRejecting] = useState<FacePendingReview | null>(null);
  const [reason, setReason] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['face-reviews'],
    queryFn: faceApi.listPendingReviews,
    retry: 0,
  });

  const errMsg = (err: any, fallback: string) => {
    const m = err?.response?.data?.message;
    return Array.isArray(m) ? m.join(', ') : m || fallback;
  };

  const reviewMutation = useMutation({
    mutationFn: (v: { memberId: string; approved: boolean; reason?: string }) =>
      faceApi.review(v.memberId, v.approved, v.reason),
    onSuccess: (res) => {
      toast.success(
        res.message,
        res.emailSent ? 'Đã gửi email kết quả cho hội viên.' : 'Hội viên chưa có email để gửi.',
      );
      setRejecting(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['face-reviews'] });
    },
    onError: (err: any) => toast.error('Thao tác thất bại', errMsg(err, 'Vui lòng thử lại.')),
  });

  const items = data?.data ?? [];
  const busyId = reviewMutation.isPending ? reviewMutation.variables?.memberId : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
          <ScanFace className="size-6 text-neon" /> Duyệt ảnh khuôn mặt
        </h1>
        <p className="mt-1 text-xs text-muted">
          Hội viên tự gửi ảnh Face ID từ tài khoản của mình. Duyệt thì hội viên check-in được bằng
          khuôn mặt; từ chối thì dữ liệu khuôn mặt bị xoá. Kết quả được gửi email cho hội viên.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ScanFace}
          title="Không có ảnh nào chờ duyệt"
          description="Khi hội viên gửi ảnh khuôn mặt, yêu cầu sẽ hiện ở đây."
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            <b className="font-display text-lg text-neon">{items.length}</b> ảnh đang chờ duyệt
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Card key={item.memberId} className="overflow-hidden">
                <CardContent className="flex h-full flex-col p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageData}
                    alt={`Ảnh khuôn mặt hội viên ${item.member.fullName}`}
                    className="mx-auto h-56 w-44 rounded-xl border border-line object-cover"
                  />
                  <div className="mt-4 min-w-0 flex-1">
                    <Link
                      href={`/admin/members/${item.memberId}`}
                      className="block truncate font-semibold text-chalk hover:text-neon"
                    >
                      {item.member.fullName}
                    </Link>
                    <p className="font-mono text-xs text-muted">{item.member.code}</p>
                    {item.member.email && (
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted">
                        <Mail className="size-3.5 shrink-0" /> {item.member.email}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      Gửi lúc {formatDateTime(item.submittedAt)}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      isLoading={busyId === item.memberId && reviewMutation.variables?.approved}
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({ memberId: item.memberId, approved: true })
                      }
                    >
                      <Check className="size-3.5" /> Duyệt
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      variant="danger"
                      disabled={reviewMutation.isPending}
                      onClick={() => {
                        setReason('');
                        setRejecting(item);
                      }}
                    >
                      <X className="size-3.5" /> Từ chối
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Từ chối ảnh khuôn mặt"
        description={
          rejecting
            ? `Lý do sẽ được gửi qua email cho ${rejecting.member.fullName} để chụp lại.`
            : undefined
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-neon/40 hover:text-chalk"
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea
            id="face-reject-reason"
            label="Lý do từ chối"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Ảnh bị mờ, vui lòng chụp ở nơi đủ sáng."
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Huỷ
            </Button>
            <Button
              variant="danger"
              disabled={!reason.trim()}
              isLoading={reviewMutation.isPending}
              onClick={() =>
                rejecting &&
                reviewMutation.mutate({
                  memberId: rejecting.memberId,
                  approved: false,
                  reason: reason.trim(),
                })
              }
            >
              <X className="size-4" /> Từ chối và gửi email
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
