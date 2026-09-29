'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { paymentApi } from '@/services/payment.service';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { PAYMENT_STATUS_META, PAYMENT_METHOD_LABEL } from '@/lib/status';
import { getStoredUser } from '@/lib/auth';
import {
  Receipt,
  DollarSign,
  TrendingUp,
  Hourglass,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  ExternalLink,
  Wallet,
  FilterX,
} from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'REFUNDED', label: 'Hoàn tiền' },
];

const METHOD_OPTIONS = [
  { value: '', label: 'Tất cả phương thức' },
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
  { value: 'MOMO', label: 'Ví MoMo' },
  { value: 'VNPAY', label: 'VNPay' },
  { value: 'CREDIT_CARD', label: 'Thẻ ngân hàng' },
];

export default function PaymentsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const canReject = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canRefund = user?.role === 'ADMIN';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [packageId, setPackageId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [applied, setApplied] = useState({
    search: '',
    status: '',
    method: '',
    packageId: '',
    from: '',
    to: '',
    reset: false,
  });

  const [confirmTarget, setConfirmTarget] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [refundTarget, setRefundTarget] = useState<any>(null);
  const [txRef, setTxRef] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [deactivateMembership, setDeactivateMembership] = useState(false);

  // Packages cho filter
  const { data: packages } = useQuery({
    queryKey: ['admin-packages-light'],
    queryFn: async () => {
      const res = await apiClient.get('/membership-packages');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-payments', page, applied],
    queryFn: () =>
      paymentApi.getPayments({
        page,
        limit: 12,
        search: applied.search || undefined,
        status: applied.status || undefined,
        method: applied.method || undefined,
        packageId: applied.packageId || undefined,
        from: applied.from || undefined,
        to: applied.to || undefined,
      }),
  });

  // Reset về trang 1 khi đổi bộ lọc đã áp dụng
  useEffect(() => {
    setPage(1);
  }, [applied]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    queryClient.invalidateQueries({ queryKey: ['admin-memberships'] });
    queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
    queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
  };

  const actionMutation = useMutation({
    mutationFn: async ({
      type,
      id,
      payload,
    }: {
      type: 'confirm' | 'reject' | 'refund';
      id: string;
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
      setConfirmTarget(null);
      setRejectTarget(null);
      setRefundTarget(null);
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

  const applyFilters = () => {
    setApplied({
      search: search.trim(),
      status,
      method,
      packageId,
      from,
      to,
      reset: false,
    });
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setMethod('');
    setPackageId('');
    setFrom('');
    setTo('');
    setApplied({
      search: '',
      status: '',
      method: '',
      packageId: '',
      from: '',
      to: '',
      reset: true,
    });
  };

  const stats = data?.stats;
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / 12));

  const pkgOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả gói tập' },
      ...(packages || []).map((p: any) => ({ value: p.id, label: p.name })),
    ],
    [packages],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
          <Receipt className="size-6 text-neon" />
          Hóa Đơn & Thanh Toán (Payments)
        </h1>
        <p className="text-xs text-muted mt-1">
          Quản lý yêu cầu thanh toán gói tập — xác nhận, từ chối, hoàn tiền và theo dõi doanh thu
        </p>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats?.totalRevenue || 0)}
          subtitle="Đã thu (không gồm hoàn tiền)"
          icon={DollarSign}
          colorScheme="neon"
        />
        <StatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(stats?.revenueToday || 0)}
          subtitle="Thanh toán PAID hôm nay"
          icon={TrendingUp}
          colorScheme="blue"
        />
        <StatCard
          title="Đang chờ xác nhận"
          value={stats?.pendingCount ?? 0}
          subtitle="Cần lễ tân xử lý"
          icon={Hourglass}
          colorScheme="amber"
        />
        <StatCard
          title="Đã thanh toán"
          value={stats?.paidCount ?? 0}
          subtitle={`Hoàn tiền: ${formatCurrency(stats?.refundedTotal || 0)}`}
          icon={CheckCircle2}
          colorScheme="purple"
        />
        <StatCard
          title="Thất bại / Hủy"
          value={(stats?.failedCount ?? 0) + (stats?.cancelledCount ?? 0)}
          subtitle={`Thất bại ${stats?.failedCount ?? 0} · Hủy ${stats?.cancelledCount ?? 0}`}
          icon={XCircle}
          colorScheme="rose"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
            <div className="md:col-span-2">
              <Input
                placeholder="Tìm tên / email / SĐT / mã hóa đơn, mã giao dịch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={METHOD_OPTIONS}
            />
            <Select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              options={pkgOptions}
            />
            <div className="flex items-end gap-2">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="md:w-36"
              />
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="md:w-36"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={applyFilters}>
              <Search className="size-3.5" /> Áp dụng bộ lọc
            </Button>
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              <FilterX className="size-3.5" /> Đặt lại
            </Button>
            <span className="ml-auto self-center text-xs text-muted">
              Tổng cộng <b className="text-neon">{data?.total ?? 0}</b> giao dịch
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-16 text-center">
              <p className="text-sm text-danger">Không tải được danh sách thanh toán.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted">
              Chưa có giao dịch thanh toán nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Mã hóa đơn</th>
                    <th className="py-3 px-4">Hội viên</th>
                    <th className="py-3 px-4">Gói tập</th>
                    <th className="py-3 px-4">Số tiền</th>
                    <th className="py-3 px-4">Phương thức</th>
                    <th className="py-3 px-4">Ngày tạo</th>
                    <th className="py-3 px-4">Ngày thanh toán</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {data?.data.map((p: any) => {
                    const meta = PAYMENT_STATUS_META[p.status] || {
                      label: p.status,
                      variant: 'outline',
                    };
                    return (
                      <tr key={p.id} className="hover:bg-line/20 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-chalk">{p.code}</p>
                          {p.invoice?.invoiceNumber && (
                            <p className="text-[10px] text-muted">HD: {p.invoice.invoiceNumber}</p>
                          )}
                          {p.transactionRef && (
                            <p className="text-[10px] text-muted">GD: {p.transactionRef}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-chalk">{p.member?.fullName}</p>
                          <p className="text-[10px] text-muted">
                            {p.member?.code} · {p.member?.phone}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-muted">
                          {p.membership?.package?.name || 'Dịch vụ phụ trợ'}
                        </td>
                        <td className="py-3 px-4 font-bold text-neon whitespace-nowrap">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {PAYMENT_METHOD_LABEL[p.method] || p.method}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-muted whitespace-nowrap">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="py-3 px-4 font-mono text-muted whitespace-nowrap">
                          {p.paidAt ? formatDateTime(p.paidAt) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={meta.variant as any}>{meta.label}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/payments/${p.id}`}>
                              <Button variant="outline" size="sm" className="text-xs">
                                <ExternalLink className="size-3.5 mr-1" /> Chi tiết
                              </Button>
                            </Link>
                            {p.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs text-neon"
                                  isLoading={actionMutation.isPending}
                                  onClick={() => setConfirmTarget(p)}
                                >
                                  <CheckCircle2 className="size-3.5 mr-1" /> Xác nhận
                                </Button>
                                {canReject && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs text-danger"
                                    isLoading={actionMutation.isPending}
                                    onClick={() => setRejectTarget(p)}
                                  >
                                    <XCircle className="size-3.5 mr-1" /> Từ chối
                                  </Button>
                                )}
                              </>
                            )}
                            {p.status === 'PAID' && canRefund && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                isLoading={actionMutation.isPending}
                                onClick={() => setRefundTarget(p)}
                              >
                                <RotateCcw className="size-3.5 mr-1" /> Hoàn tiền
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !isError && (data?.total || 0) > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
              <p className="text-[11px] text-muted">
                Trang {page}/{totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Trước
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <Dialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title={`Xác nhận thanh toán ${confirmTarget?.code || ''}`}
      >
        {confirmTarget && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-neon/30 bg-neon/5 p-4">
              <p className="text-xs text-muted">
                Hội viên <b className="text-chalk">{confirmTarget.member?.fullName}</b> (
                {confirmTarget.member?.code}) — gói{' '}
                <b className="text-chalk">{confirmTarget.membership?.package?.name}</b>
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-neon">
                {formatCurrency(confirmTarget.amount)}
              </p>
            </div>
            <div>
              <label
                htmlFor="tx-ref-input"
                className="mb-1.5 block text-xs font-semibold text-muted"
              >
                Mã giao dịch (sao kê ngân hàng) — tùy chọn
              </label>
              <Input
                id="tx-ref-input"
                placeholder="Ví dụ: VCB-29102026-001"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted">
                Bắt buộc nên nhập khi chuyển khoản để tránh trùng mã giao dịch.
              </p>
            </div>
            <div>
              <label
                htmlFor="confirm-note-input"
                className="mb-1.5 block text-xs font-semibold text-muted"
              >
                Ghi chú xác nhận
              </label>
              <Input
                id="confirm-note-input"
                placeholder="Đã đối soát sao kê ngân hàng..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted">
              Xác nhận sẽ: đánh dấu thanh toán PAID, kích hoạt gói tập (Membership → ACTIVE) và đóng
              hóa đơn — tất cả trong một transaction.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setConfirmTarget(null)}>
                Hủy
              </Button>
              <Button
                isLoading={actionMutation.isPending}
                onClick={() =>
                  actionMutation.mutate({
                    type: 'confirm',
                    id: confirmTarget.id,
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
        )}
      </Dialog>

      {/* Reject dialog */}
      <Dialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title={`Từ chối hóa đơn ${rejectTarget?.code || ''}`}
      >
        {rejectTarget && (
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted">
              Hóa đơn {rejectTarget.code} ({formatCurrency(rejectTarget.amount)}) sẽ bị CANCELLED —
              membership đi kèm cũng bị hủy nếu còn PENDING.
            </p>
            <div>
              <label
                htmlFor="reject-reason-input"
                className="mb-1.5 block text-xs font-semibold text-muted"
              >
                Lý do từ chối
              </label>
              <Input
                id="reject-reason-input"
                placeholder="Ví dụ: Sai thông tin thanh toán, member nhờ hủy..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setRejectTarget(null)}>
                Hủy
              </Button>
              <Button
                variant="danger"
                isLoading={actionMutation.isPending}
                onClick={() =>
                  actionMutation.mutate({
                    type: 'reject',
                    id: rejectTarget.id,
                    payload: { reason: reason.trim() || undefined },
                  })
                }
              >
                <XCircle className="size-4" /> Từ chối hóa đơn
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Refund dialog */}
      <Dialog
        open={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        title={`Hoàn tiền ${refundTarget?.code || ''}`}
      >
        {refundTarget && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
              <p className="text-xs text-muted">
                Hoàn trả <b className="text-chalk">{formatCurrency(refundTarget.amount)}</b> cho{' '}
                <b className="text-chalk">{refundTarget.member?.fullName}</b>. Giao dịch sẽ chuyển
                sang REFUNDED và không tính vào doanh thu.
              </p>
            </div>
            <div>
              <label
                htmlFor="refund-reason-input"
                className="mb-1.5 block text-xs font-semibold text-muted"
              >
                Lý do hoàn tiền
              </label>
              <Input
                id="refund-reason-input"
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
                Đồng thời <b className="text-chalk">hủy gói tập</b> đang hoạt động liên quan đến hóa
                đơn này (Membership → CANCELLED)
              </span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setRefundTarget(null)}>
                Hủy
              </Button>
              <Button
                variant="danger"
                isLoading={actionMutation.isPending}
                onClick={() =>
                  actionMutation.mutate({
                    type: 'refund',
                    id: refundTarget.id,
                    payload: { reason: refundReason.trim() || undefined, deactivateMembership },
                  })
                }
              >
                <RotateCcw className="size-4" /> Xác nhận hoàn tiền
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
