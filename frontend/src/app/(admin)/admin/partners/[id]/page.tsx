'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  LockKeyhole,
  Receipt,
  Trash2,
  Percent,
  UserCheck,
} from 'lucide-react';
import { partnerApi } from '@/services/partner.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';
import { PARTNER_STATUS_META, PAYMENT_STATUS_META } from '@/lib/status';
import { formatCurrency, formatDateTime } from '@/lib/utils';

type Action = 'approve' | 'reject' | 'suspend';

const ACTION_META: Record<
  Action,
  {
    title: string;
    description: string;
    icon: typeof CheckCircle2;
    button: string;
    variant: 'primary' | 'danger' | 'secondary';
  }
> = {
  approve: {
    title: 'Duyệt hồ sơ đối tác',
    description: 'Sau khi duyệt, đối tác có thể quản lý chi nhánh và xem doanh thu riêng.',
    icon: CheckCircle2,
    button: 'Xác nhận duyệt',
    variant: 'primary',
  },
  reject: {
    title: 'Từ chối hồ sơ đối tác',
    description: 'Đối tác sẽ không thể chỉnh sửa dữ liệu cho đến khi bạn đổi quyết định.',
    icon: XCircle,
    button: 'Xác nhận từ chối',
    variant: 'danger',
  },
  suspend: {
    title: 'Tạm khóa đối tác',
    description: 'Tạm ngưng quyền chỉnh sửa của đối tác. Dữ liệu vẫn được giữ nguyên.',
    icon: LockKeyhole,
    button: 'Xác nhận tạm khóa',
    variant: 'secondary',
  },
};

export default function AdminPartnerDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState('');
  const [paymentCode, setPaymentCode] = useState('');
  const [rateInput, setRateInput] = useState('30');

  const detailQuery = useQuery({
    queryKey: ['admin-partner', params.id],
    queryFn: () => partnerApi.adminDetail(params.id),
    retry: 1,
  });

  const commissionQuery = useQuery({
    queryKey: ['admin-partner-commission', params.id],
    queryFn: () => partnerApi.adminCommission(params.id),
    retry: 1,
  });

  useEffect(() => {
    if (detailQuery.data?.commissionRate != null) {
      setRateInput(String(Math.round(Number(detailQuery.data.commissionRate) * 1000) / 10));
    }
  }, [detailQuery.data?.commissionRate]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-partner', params.id] });
    queryClient.invalidateQueries({ queryKey: ['admin-partner-commission', params.id] });
    queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
  };

  const commissionMutation = useMutation({
    mutationFn: () => partnerApi.adminUpdateCommission(params.id, Number(rateInput)),
    onSuccess: () => {
      success('Cập nhật tỷ lệ hoa hồng thành công');
      invalidate();
    },
    onError: (err: any) => toastError('Không thể cập nhật hoa hồng', err?.response?.data?.message),
  });

  const decision = useMutation({
    mutationFn: () => partnerApi.adminDecision(params.id, action!, note),
    onSuccess: () => {
      success('Cập nhật trạng thái đối tác thành công');
      setAction(null);
      setNote('');
      invalidate();
    },
    onError: (err: any) => toastError('Thao tác thất bại', err?.response?.data?.message),
  });

  const assign = useMutation({
    mutationFn: (code: string) => partnerApi.adminAssignPayment(params.id, code),
    onSuccess: () => {
      success('Đã gán giao dịch cho đối tác');
      setPaymentCode('');
      invalidate();
    },
    onError: (err: any) => toastError('Không thể gán giao dịch', err?.response?.data?.message),
  });

  const unassign = useMutation({
    mutationFn: (paymentId: string) => partnerApi.adminUnassignPayment(params.id, paymentId),
    onSuccess: () => {
      success('Đã bỏ gán giao dịch');
      invalidate();
    },
    onError: (err: any) => toastError('Không thể bỏ gán', err?.response?.data?.message),
  });

  if (detailQuery.isLoading) return <Skeleton className="h-96 w-full" />;
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ErrorState
        description="Không tải được chi tiết đối tác. Hồ sơ có thể đã bị xóa."
        onRetry={() => detailQuery.refetch()}
      />
    );
  }

  const p = detailQuery.data;
  const meta = PARTNER_STATUS_META[p.status] || { label: p.status, variant: 'outline' as const };
  const ActiveIcon = action ? ACTION_META[action].icon : CheckCircle2;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/partners"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-neon"
          >
            <ArrowLeft className="size-3.5" /> Danh sách đối tác
          </Link>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
            <Building2 className="size-6 text-neon" /> {p.businessName}
          </h1>
          <p className="mt-1 text-xs text-muted">
            Đăng ký lúc {formatDateTime(p.createdAt)} · Cập nhật {formatDateTime(p.updatedAt)}
          </p>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAction('approve')} disabled={p.status === 'APPROVED'}>
          <CheckCircle2 className="size-4" /> Duyệt
        </Button>
        <Button
          variant="danger"
          onClick={() => setAction('reject')}
          disabled={p.status === 'REJECTED'}
        >
          <XCircle className="size-4" /> Từ chối
        </Button>
        <Button
          variant="secondary"
          onClick={() => setAction('suspend')}
          disabled={p.status === 'SUSPENDED'}
        >
          <LockKeyhole className="size-4" /> Tạm khóa
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg uppercase text-chalk">
              Thông tin doanh nghiệp
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-xs sm:grid-cols-2">
            <Info label="Tên doanh nghiệp" value={p.businessName} />
            <Info label="Mã số thuế" value={p.taxCode || '—'} />
            <Info label="Số điện thoại" value={p.phone || '—'} />
            <Info label="Email liên hệ" value={p.email || '—'} />
            <Info label="Địa chỉ" value={p.address || '—'} full />
            <Info label="Chủ sở hữu" value={p.user?.fullName || '—'} />
            <Info label="Tài khoản" value={p.user?.email || '—'} />
            <Info label="Ghi chú duyệt" value={p.notes || '—'} full />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg uppercase text-chalk">
              Thống kê riêng
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-ink/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Chi nhánh</p>
              <p className="mt-1 font-display text-2xl font-bold text-chalk">{p.branches.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-ink/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Lượt tập tại gym
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-chalk">
                {commissionQuery.data?.visitCount ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-ink/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Hoa hồng cộng dồn
              </p>
              <p
                className="mt-1 truncate font-display text-lg font-bold text-neon"
                title={formatCurrency(commissionQuery.data?.totalCommission || 0)}
              >
                {formatCurrency(commissionQuery.data?.totalCommission || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-ink/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Đã thu</p>
              <p
                className="mt-1 truncate font-display text-lg font-bold text-neon"
                title={formatCurrency(p.stats?.paidAmount || 0)}
              >
                {formatCurrency(p.stats?.paidAmount || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-ink/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Chờ xác nhận
              </p>
              <p
                className="mt-1 truncate font-display text-lg font-bold text-chalk"
                title={formatCurrency(p.stats?.pendingAmount || 0)}
              >
                {formatCurrency(p.stats?.pendingAmount || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg uppercase text-chalk">
              <Percent className="size-5 text-neon" /> Tỷ lệ hoa hồng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted">
              Áp dụng cho mỗi lượt hội viên vào tập tại phòng gym của đối tác (tính trên giá buổi
              trong gói tập).
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-32">
                <Input
                  label="Hoa hồng (%)"
                  name="commissionRate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  const value = Number(rateInput);
                  if (Number.isFinite(value) && value >= 0 && value <= 100) {
                    commissionMutation.mutate();
                  } else {
                    toastError('Tỷ lệ hoa hồng phải nằm trong khoảng 0–100%');
                  }
                }}
                isLoading={commissionMutation.isPending}
              >
                Lưu tỷ lệ
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg uppercase text-chalk">
              <UserCheck className="size-5 text-neon" /> Lượt tập ghi nhận
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {commissionQuery.data?.visits?.length ? (
              commissionQuery.data.visits.slice(0, 8).map((visit) => (
                <div
                  key={visit.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-ink/60 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-chalk">
                      {visit.member?.fullName || visit.member?.code || 'Hội viên'}
                    </p>
                    <p className="text-xs text-muted">
                      {visit.member?.code} · {formatDateTime(visit.checkInTime)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-neon">
                      {formatCurrency(visit.commissionAmount || 0)}
                    </p>
                    <p className="text-[11px] text-muted">
                      {Math.round(Number(visit.commissionRate || 0) * 100)}% ·{' '}
                      {formatCurrency(visit.unitPrice || 0)}/lượt
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-muted">
                Chưa có lượt tập nào được ghi nhận qua check-in khuôn mặt của đối tác.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase text-chalk">
            Chi nhánh ({p.branches.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {p.branches.length ? (
            p.branches.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-ink/60 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-chalk">{b.name}</p>
                  <p className="text-xs text-muted">{b.address || 'Chưa có địa chỉ'}</p>
                </div>
                <div className="text-right text-xs text-muted">
                  <p>{b.phone || '—'}</p>
                  <p>
                    {b.latitude != null && b.longitude != null
                      ? `${b.latitude}, ${b.longitude}`
                      : 'Không có tọa độ'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-muted">
              Đối tác chưa đăng ký chi nhánh nào.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase text-chalk">
            Gán doanh thu riêng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted">
            Nhập mã giao dịch (payment code) để gán doanh thu cho đối tác này. Giao dịch đã gán cho
            đối tác khác sẽ bị từ chối.
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="min-w-[240px] flex-1">
              <Input
                label="Mã giao dịch"
                name="paymentCode"
                value={paymentCode}
                onChange={(e) => setPaymentCode(e.target.value)}
                placeholder="VD: PAY-2026-000123"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  if (paymentCode.trim()) assign.mutate(paymentCode.trim());
                }}
                isLoading={assign.isPending}
              >
                <Receipt className="size-4" /> Gán giao dịch
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {p.payments?.length ? (
              p.payments.map((pay) => {
                const payMeta = PAYMENT_STATUS_META[pay.status] || {
                  label: pay.status,
                  variant: 'outline' as const,
                };
                return (
                  <div
                    key={pay.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-ink/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-chalk">{pay.code}</p>
                      <p className="text-xs text-muted">
                        {pay.member?.fullName || '—'} ·{' '}
                        {formatDateTime(pay.paidAt || pay.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-neon">{formatCurrency(pay.amount)}</p>
                      <Badge variant={payMeta.variant}>{payMeta.label}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Bỏ gán giao dịch"
                        onClick={() => unassign.mutate(pay.id)}
                        disabled={unassign.isPending}
                      >
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-xs text-muted">Chưa có giao dịch nào được gán.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!action}
        onClose={() => {
          setAction(null);
          setNote('');
        }}
        title={action ? ACTION_META[action].title : ''}
        description={action ? ACTION_META[action].description : ''}
      >
        {action && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-ink/60 p-3">
              <ActiveIcon className="size-5 text-neon" />
              <div>
                <p className="text-sm font-semibold text-chalk">{p.businessName}</p>
                <p className="text-xs text-muted">{p.user?.email}</p>
              </div>
            </div>
            <Input
              label="Ghi chú (tùy chọn)"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Hồ sơ hợp lệ / Thiếu giấy phép…"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAction(null)}>
                Hủy
              </Button>
              <Button
                variant={ACTION_META[action].variant}
                isLoading={decision.isPending}
                onClick={() => decision.mutate()}
              >
                {ACTION_META[action].button}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Info({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 break-words font-medium text-chalk">{value}</p>
    </div>
  );
}
