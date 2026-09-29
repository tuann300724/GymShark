'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '@/services/payment.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { PAYMENT_STATUS_META, PAYMENT_METHOD_LABEL } from '@/lib/status';
import { getStoredUser } from '@/lib/auth';
import {
  ArrowLeft,
  Receipt,
  CheckCircle2,
  XCircle,
  RotateCcw,
  User,
  CreditCard,
  Hash,
  CalendarDays,
  UserCheck,
  Banknote,
  Landmark,
  Copy,
  Building2,
} from 'lucide-react';

export default function PaymentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const user = getStoredUser();
  const canReject = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canRefund = user?.role === 'ADMIN';

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [txRef, setTxRef] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [deactivateMembership, setDeactivateMembership] = useState(false);

  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    data: payment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-payment-detail', id],
    queryFn: () => paymentApi.getPayment(id),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-payment-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
    queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
  };

  const actionMutation = useMutation({
    mutationFn: async ({
      type,
      payload,
    }: {
      type: 'confirm' | 'reject' | 'refund';
      payload: any;
    }) => {
      if (type === 'confirm') return paymentApi.confirm(id, payload);
      if (type === 'reject') return paymentApi.reject(id, payload);
      return paymentApi.refund(id, payload);
    },
    onSuccess: (res: any, vars) => {
      toast.success(
        vars.type === 'confirm'
          ? 'Xác nhận thanh toán thành công'
          : vars.type === 'reject'
            ? 'Đã từ chối/hủy hóa đơn'
            : 'Đã hoàn tiền',
        res.message,
      );
      setConfirmOpen(false);
      setRejectOpen(false);
      setRefundOpen(false);
      setTxRef('');
      setNote('');
      setReason('');
      setRefundReason('');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Thao tác thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success('Đã sao chép'));
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-danger">Không tìm thấy giao dịch thanh toán.</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const meta = PAYMENT_STATUS_META[payment.status] || {
    label: payment.status,
    variant: 'outline' as const,
  };
  const invoice = payment.invoice;
  const amountNum = Number(payment.amount || 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/payments">
            <Button variant="ghost" size="icon" aria-label="Quay lại danh sách">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-mono text-xl font-extrabold text-chalk flex items-center gap-2">
              <Receipt className="size-6 text-neon" />
              {payment.code}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              {payment.member?.fullName} — {payment.membership?.package?.name || 'Dịch vụ'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={meta.variant as any}>{meta.label}</Badge>
          {payment.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                isLoading={actionMutation.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                <CheckCircle2 className="size-4" /> Xác nhận
              </Button>
              {canReject && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger"
                  onClick={() => setRejectOpen(true)}
                >
                  <XCircle className="size-4" /> Từ chối
                </Button>
              )}
            </>
          )}
          {payment.status === 'PAID' && canRefund && (
            <Button
              variant="outline"
              size="sm"
              className="text-danger"
              onClick={() => setRefundOpen(true)}
            >
              <RotateCcw className="size-4" /> Hoàn tiền
            </Button>
          )}
        </div>
      </div>

      {/* Amount summary + actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 border-neon/25">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">
              Số tiền thanh toán
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold text-neon">
              {formatCurrency(amountNum)}
            </p>
            <div className="mt-3 space-y-1 text-xs text-muted">
              <p className="flex justify-between">
                <span>Tiền gói</span>
                <span className="font-semibold text-chalk">
                  {formatCurrency(Number(invoice?.subtotal ?? amountNum))}
                </span>
              </p>
              {Number(invoice?.discount) > 0 && (
                <p className="flex justify-between text-neon">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(Number(invoice?.discount || 0))}</span>
                </p>
              )}
              <p className="flex justify-between border-t border-line pt-1">
                <span className="text-chalk font-semibold">Phải trả</span>
                <span className="font-bold text-chalk">
                  {formatCurrency(invoice?.total ?? amountNum)}
                </span>
              </p>
            </div>
            {payment.promotion && (
              <p className="mt-3 rounded-lg bg-neon/5 border border-neon/20 px-3 py-2 text-[11px] text-neon">
                🎁 Mã giảm giá: <b>{payment.promotion.code}</b> ({payment.promotion.name})
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Thông tin giao dịch</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-muted" />
              <span className="text-muted">Mã hóa đơn (Invoice):</span>
              <span className="font-mono font-bold text-chalk ml-auto">
                {invoice?.invoiceNumber || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted" />
              <span className="text-muted">Phương thức:</span>
              <span className="ml-auto text-chalk">
                {PAYMENT_METHOD_LABEL[payment.method] || payment.method}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-muted" />
              <span className="text-muted">Mã giao dịch ngoài:</span>
              {payment.transactionRef ? (
                <button
                  onClick={() => copy(payment.transactionRef!)}
                  className="ml-auto flex items-center gap-1 font-mono font-bold text-neon hover:underline"
                >
                  {payment.transactionRef} <Copy className="size-3" />
                </button>
              ) : (
                <span className="ml-auto text-muted">—</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted" />
              <span className="text-muted">Ngày tạo:</span>
              <span className="font-mono ml-auto text-chalk">
                {formatDateTime(payment.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted" />
              <span className="text-muted">Ngày thanh toán:</span>
              <span className="font-mono ml-auto text-chalk">
                {payment.paidAt ? formatDateTime(payment.paidAt) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-muted" />
              <span className="text-muted">Xác nhận bởi:</span>
              <span className="ml-auto text-chalk">
                {payment.confirmedBy?.fullName || '—'}
                {payment.confirmedAt ? ` (${formatDateTime(payment.confirmedAt)})` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Building2 className="size-4 text-muted" />
              <span className="text-muted">Gói tập:</span>
              <span className="ml-auto text-chalk">
                {payment.membership?.package?.name || '—'}
                {payment.membership?.endDate
                  ? ` · đến ${formatDate(payment.membership.endDate)}`
                  : ''}
              </span>
            </div>
            {payment.notes && (
              <p className="sm:col-span-2 rounded-lg bg-ink border border-line px-3 py-2 text-muted">
                📝 {payment.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Thông tin chuyển khoản */}
      {payment.method === 'BANK_TRANSFER' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Landmark className="size-4 text-neon" /> Thông tin chuyển khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-xl border border-neon/25 bg-neon/5 p-4 sm:col-span-2">
              <p className="text-muted">
                Ngân hàng: <b className="text-chalk">{payment.bankInfo?.bankName || '—'}</b>
              </p>
              <p className="mt-1 text-muted">
                Số tài khoản:{' '}
                <button
                  onClick={() => copy(payment.bankInfo?.accountNumber || '')}
                  className="font-mono font-bold text-neon hover:underline"
                >
                  {payment.bankInfo?.accountNumber || '—'} <Copy className="inline size-3" />
                </button>{' '}
                · <span>{payment.bankInfo?.accountName}</span>
              </p>
              {payment.status === 'PENDING' && payment.bankInfo?.transferContent && (
                <div className="mt-3 rounded-lg bg-ink border border-line px-3 py-2">
                  <p className="text-muted mb-1">Nội dung chuyển khoản (ghi đúng):</p>
                  <button
                    onClick={() => copy(payment.bankInfo!.transferContent)}
                    className="font-mono font-extrabold text-neon hover:underline"
                  >
                    {payment.bankInfo.transferContent} <Copy className="inline size-3" />
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hội viên */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="size-4 text-neon" /> Hội viên
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs">
          <div>
            <p className="text-muted">Họ tên</p>
            <p className="font-semibold text-chalk">{payment.member?.fullName}</p>
          </div>
          <div>
            <p className="text-muted">Mã hội viên</p>
            <p className="font-mono font-bold text-neon">{payment.member?.code}</p>
          </div>
          <div>
            <p className="text-muted">Số điện thoại</p>
            <p className="text-chalk">{payment.member?.phone}</p>
          </div>
          <div>
            <p className="text-muted">Email</p>
            <p className="text-chalk">{payment.member?.email || '—'}</p>
          </div>
          <div>
            <p className="text-muted">Chi nhánh</p>
            <p className="text-chalk">{payment.member?.branch?.name || '—'}</p>
          </div>
          {payment.member && (
            <Link href={`/admin/members/${payment.member.id}`}>
              <Button variant="outline" size="sm">
                Xem hồ sơ →
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lịch sử trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 text-xs">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="size-2.5 rounded-full bg-neon" />
              <span className="w-px flex-1 bg-line" />
            </div>
            <div className="pb-4">
              <p className="font-semibold text-chalk">Tạo yêu cầu thanh toán</p>
              <p className="font-mono text-muted">{formatDateTime(payment.createdAt)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`size-2.5 rounded-full ${payment.paidAt ? 'bg-neon' : 'bg-line'}`} />
              <span className="w-px flex-1 bg-line" />
            </div>
            <div className="pb-4">
              <p className="font-semibold text-chalk">
                Thanh toán{' '}
                {payment.status === 'REFUNDED'
                  ? 'đã hoàn tiền'
                  : payment.status === 'CANCELLED'
                    ? 'đã hủy'
                    : payment.paidAt
                      ? 'đã xác nhận'
                      : 'chờ xác nhận'}
              </p>
              <p className="font-mono text-muted">
                {payment.paidAt || payment.confirmedAt
                  ? formatDateTime(payment.paidAt || payment.confirmedAt)
                  : '—'}
              </p>
              {payment.confirmedBy?.fullName && (
                <p className="text-muted mt-0.5">
                  Người xử lý: {payment.confirmedBy.fullName} ({payment.confirmedBy.role || ''})
                </p>
              )}
            </div>
          </div>
          {payment.status === 'PAID' && (
            <div className="flex gap-3">
              <span className="size-2.5 rounded-full bg-neon" />
              <p className="font-semibold text-chalk">
                Hoàn tất — gói tập{' '}
                {payment.membership?.status === 'ACTIVE' ? 'đã kích hoạt' : 'cập nhật'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Xác nhận thanh toán ${payment?.code}`}
      >
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-neon/30 bg-neon/5 p-4">
            <p className="text-xs text-muted">
              Hội viên <b className="text-chalk">{payment.member?.fullName}</b> (
              {payment.member?.code}) — {payment.membership?.package?.name}
            </p>
            <p className="mt-1 font-display text-xl font-extrabold text-neon">
              {formatCurrency(amountNum)}
            </p>
          </div>
          <div>
            <label
              htmlFor="detail-tx-ref-input"
              className="mb-1.5 block text-xs font-semibold text-muted"
            >
              Mã giao dịch (sao kê) — tùy chọn
            </label>
            <Input
              id="detail-tx-ref-input"
              placeholder="Ví dụ: VCB-29102026-001"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="detail-note-input"
              className="mb-1.5 block text-xs font-semibold text-muted"
            >
              Ghi chú xác nhận
            </label>
            <Input
              id="detail-note-input"
              placeholder="Đã đối soát sao kê ngân hàng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button
              isLoading={actionMutation.isPending}
              onClick={() =>
                actionMutation.mutate({
                  type: 'confirm',
                  payload: {
                    transactionRef: txRef.trim() || undefined,
                    note: note.trim() || undefined,
                  },
                })
              }
            >
              <CheckCircle2 className="size-4" /> Xác nhận đã thanh toán
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Reject dialog */}
      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Từ chối hóa đơn ${payment?.code}`}
      >
        <div className="space-y-4 text-sm">
          <div>
            <label
              htmlFor="detail-reject-reason-input"
              className="mb-1.5 block text-xs font-semibold text-muted"
            >
              Lý do từ chối
            </label>
            <Input
              id="detail-reject-reason-input"
              placeholder="Ví dụ: Sai thông tin thanh toán, member nhờ hủy..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              isLoading={actionMutation.isPending}
              onClick={() =>
                actionMutation.mutate({
                  type: 'reject',
                  payload: { reason: reason.trim() || undefined },
                })
              }
            >
              <XCircle className="size-4" /> Từ chối hóa đơn
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Refund dialog */}
      <Dialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title={`Hoàn tiền ${payment?.code}`}
      >
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
            <p className="text-xs text-muted">
              Hoàn trả <b className="text-chalk">{formatCurrency(amountNum)}</b> cho{' '}
              <b className="text-chalk">{payment.member?.fullName}</b> — giao dịch chuyển REFUNDED,
              không tính doanh thu.
            </p>
          </div>
          <div>
            <label
              htmlFor="detail-refund-reason-input"
              className="mb-1.5 block text-xs font-semibold text-muted"
            >
              Lý do hoàn tiền
            </label>
            <Input
              id="detail-refund-reason-input"
              placeholder="Ví dụ: Hủy gói theo yêu cầu hội viên..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-ink p-3">
            <input
              type="checkbox"
              checked={deactivateMembership}
              onChange={(e) => setDeactivateMembership(e.target.checked)}
              className="mt-0.5 size-4 accent-ring"
            />
            <span className="text-xs text-muted">
              Đồng thời <b className="text-chalk">hủy gói tập</b> đang hoạt động (Membership →
              CANCELLED)
            </span>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setRefundOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              isLoading={actionMutation.isPending}
              onClick={() =>
                actionMutation.mutate({
                  type: 'refund',
                  payload: { reason: refundReason.trim() || undefined, deactivateMembership },
                })
              }
            >
              <RotateCcw className="size-4" /> Xác nhận hoàn tiền
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
