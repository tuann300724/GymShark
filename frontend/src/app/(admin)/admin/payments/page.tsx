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
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
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
  ChevronLeft,
  ChevronRight,
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
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('BANK_TRANSFER');
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
        vars.type === 'confirm'
          ? res.invoiceEmailSent === true
            ? `${res.message} — hóa đơn đã gửi qua email.`
            : res.invoiceEmailSent === false
              ? `${res.message} — chưa gửi được hóa đơn qua email (kiểm tra cấu hình SMTP / email hội viên).`
              : res.message
          : res.message,
      );
      setConfirmTarget(null);
      setRejectTarget(null);
      setRefundTarget(null);
      setTxRef('');
      setNote('');
      setReason('');
      setRefundReason('');
      setRefundAmount('');
      setRefundMethod('BANK_TRANSFER');
      setDeactivateMembership(false);
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
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk flex items-center gap-2">
          <Receipt className="size-6 text-neon" />
          Hóa Đơn & Thanh Toán (Payments)
        </h1>
        <p className="text-xs text-muted mt-1">
          Quản lý yêu cầu thanh toán gói tập — xác nhận, từ chối, hoàn tiền và theo dõi doanh thu
        </p>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats?.totalRevenue || 0)}
          subtitle="Đã thu thực tế"
          icon={DollarSign}
          colorScheme="neon"
        />
        <StatCard
          title="Doanh thu ngày"
          value={formatCurrency(stats?.revenueToday || 0)}
          subtitle="Giao dịch hôm nay"
          icon={TrendingUp}
          colorScheme="blue"
        />
        <StatCard
          title="Chờ xác nhận"
          value={stats?.pendingCount ?? 0}
          subtitle="Cần thu ngân xử lý"
          icon={Hourglass}
          colorScheme="amber"
        />
        <StatCard
          title="Đã thanh toán"
          value={stats?.paidCount ?? 0}
          subtitle="Đơn thành công"
          icon={CheckCircle2}
          colorScheme="neon"
        />
        <StatCard
          title="Đã hoàn tiền"
          value={stats?.refundedCount ?? 0}
          subtitle={`Đã hoàn: ${formatCurrency(stats?.refundedTotal || 0)}`}
          icon={RotateCcw}
          colorScheme="rose"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            <div className="sm:col-span-2 xl:col-span-2">
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
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="min-w-0 flex-1 text-xs"
                title="Từ ngày"
              />
              <span className="text-xs text-muted">-</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="min-w-0 flex-1 text-xs"
                title="Đến ngày"
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
            <ErrorState
              className="m-3"
              title="Không tải được thanh toán"
              description="Không tải được danh sách thanh toán. Vui lòng kiểm tra kết nối API và thử lại."
              onRetry={() => refetch()}
            />
          ) : data?.data.length === 0 ? (
            <EmptyState
              className="m-3"
              icon={Receipt}
              title="Chưa có giao dịch"
              description="Không có giao dịch thanh toán nào phù hợp với bộ lọc hiện tại."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink/70 border-b border-line">
                  <tr>
                    <th className="py-3 px-3 font-semibold">Mã HĐ</th>
                    <th className="py-3 px-3 font-semibold">Hội viên</th>
                    <th className="py-3 px-3 font-semibold">Gói tập</th>
                    <th className="py-3 px-3 font-semibold">Số tiền / PTTT</th>
                    <th className="py-3 px-3 font-semibold">Thời gian</th>
                    <th className="py-3 px-3 font-semibold text-center">Trạng thái</th>
                    <th className="py-3 px-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-normal">
                  {data?.data.map((p: any) => {
                    const meta = PAYMENT_STATUS_META[p.status] || {
                      label: p.status,
                      variant: 'outline',
                    };
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-line hover:bg-line/25 transition-colors"
                      >
                        {/* 1. Mã HĐ */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <p className="font-mono font-bold text-chalk text-xs">{p.code}</p>
                          {p.transactionRef && (
                            <p
                              className="text-[10px] text-muted font-mono truncate max-w-[120px]"
                              title={p.transactionRef}
                            >
                              GD: {p.transactionRef}
                            </p>
                          )}
                        </td>

                        {/* 2. Hội viên */}
                        <td className="py-3 px-3">
                          <p className="font-semibold text-chalk text-xs truncate max-w-[150px]">
                            {p.member?.fullName || 'Khách vãng lai'}
                          </p>
                          <p className="text-[10px] text-muted font-mono">
                            {p.member?.phone || p.member?.code}
                          </p>
                        </td>

                        {/* 3. Gói tập */}
                        <td className="py-3 px-3">
                          <p className="font-medium text-chalk text-xs truncate max-w-[150px]">
                            {p.membership?.package?.name || 'Dịch vụ lẻ'}
                          </p>
                          {p.membership?.package?.durationDays && (
                            <p className="text-[10px] text-muted">
                              {p.membership.package.durationDays} ngày tập
                            </p>
                          )}
                        </td>

                        {/* 4. Số tiền & PTTT */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <p className="font-bold text-neon font-mono text-xs tracking-tight">
                            {formatCurrency(p.amount)}
                          </p>
                          <p className="text-[10px] text-muted">
                            {PAYMENT_METHOD_LABEL[p.method] || p.method}
                          </p>
                        </td>

                        {/* 5. Thời gian */}
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-muted">
                          <p className="text-chalk font-medium">
                            {p.paidAt ? formatDateTime(p.paidAt) : formatDateTime(p.createdAt)}
                          </p>
                          <p className="text-[10px] text-muted">
                            {p.paidAt ? 'Đã thanh toán' : 'Ngày tạo đơn'}
                          </p>
                        </td>

                        {/* 6. Trạng thái */}
                        <td className="py-3 px-3 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            {p.status === 'PAID' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neon/10 text-neon border border-neon/30 whitespace-nowrap">
                                <span className="size-1.5 rounded-full bg-neon shadow-[0_0_6px_rgba(183,255,0,0.8)]" />
                                Đã thanh toán
                              </span>
                            ) : p.status === 'REFUNDED' ? (
                              <>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 whitespace-nowrap">
                                  <span className="size-1.5 rounded-full bg-sky-400" />
                                  Hoàn tiền
                                </span>
                                {p.refundAmount && (
                                  <span className="text-[10px] text-sky-400/80 font-mono">
                                    -{formatCurrency(Number(p.refundAmount))}
                                  </span>
                                )}
                              </>
                            ) : p.status === 'PENDING' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Chờ xác nhận
                              </span>
                            ) : p.status === 'CANCELLED' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-line/60 text-muted border border-line whitespace-nowrap">
                                <span className="size-1.5 rounded-full bg-muted" />
                                Đã hủy
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/30 whitespace-nowrap">
                                <span className="size-1.5 rounded-full bg-danger" />
                                {meta.label}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 7. Thao tác */}
                        <td className="py-3 px-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Contextual Action (Left Slot) */}
                            {p.status === 'PENDING' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] text-neon border-neon/30 hover:bg-neon/10"
                                  isLoading={actionMutation.isPending}
                                  onClick={() => setConfirmTarget(p)}
                                >
                                  <CheckCircle2 className="size-3 mr-1" /> Duyệt
                                </Button>
                                {canReject && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-1.5 text-[11px] text-danger hover:bg-danger/10"
                                    isLoading={actionMutation.isPending}
                                    onClick={() => setRejectTarget(p)}
                                    title="Từ chối hóa đơn"
                                  >
                                    <XCircle className="size-3" />
                                  </Button>
                                )}
                              </>
                            ) : p.status === 'PAID' && canRefund ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] border-line text-muted hover:text-danger hover:border-danger/40 hover:bg-danger/5 transition-colors"
                                isLoading={actionMutation.isPending}
                                onClick={() => {
                                  setRefundTarget(p);
                                  setRefundAmount(String(Number(p.amount)));
                                  setRefundMethod('BANK_TRANSFER');
                                  setRefundReason('');
                                  setDeactivateMembership(false);
                                }}
                                title="Hoàn tiền cho hóa đơn này"
                              >
                                <RotateCcw className="size-3 mr-1 text-danger/80" />
                                Hoàn tiền
                              </Button>
                            ) : p.status === 'REFUNDED' ? (
                              <span className="inline-flex items-center gap-1 h-7 px-2 text-[11px] text-sky-400/80 bg-sky-500/5 border border-sky-500/20 rounded-sm">
                                <RotateCcw className="size-2.5 text-sky-400" />
                                Đã hoàn
                              </span>
                            ) : null}

                            {/* Primary Navigation Action (Right Slot - Fixed Position in Every Row) */}
                            <Link href={`/admin/payments/${p.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] border-line bg-surface hover:bg-line/40 hover:border-neon/40 hover:text-neon transition-colors"
                              >
                                <ExternalLink className="size-3 mr-1 text-muted" /> Chi tiết
                              </Button>
                            </Link>
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
                  <ChevronLeft className="size-4" /> Trước
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau <ChevronRight className="size-4" />
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
                Hoàn tối đa <b className="text-chalk">{formatCurrency(refundTarget.amount)}</b> cho{' '}
                <b className="text-chalk">{refundTarget.member?.fullName}</b>. Giao dịch chuyển
                REFUNDED, không tính vào doanh thu — tiền được trả lại bằng chuyển khoản hoặc tiền
                mặt.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="refund-amount-input"
                  className="mb-1.5 block text-xs font-semibold text-muted"
                >
                  Số tiền hoàn (VND)
                </label>
                <Input
                  id="refund-amount-input"
                  type="number"
                  min={1}
                  step={1000}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="mt-1 text-[10px] text-muted">Để bằng số tiền gốc = hoàn đủ</p>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted">Phương thức hoàn</p>
                <Select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  options={[
                    { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng' },
                    { value: 'CASH', label: 'Tiền mặt tại quầy' },
                  ]}
                />
              </div>
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
                    payload: {
                      reason: refundReason.trim() || undefined,
                      deactivateMembership,
                      refundAmount: Number(refundAmount) > 0 ? Number(refundAmount) : undefined,
                      refundMethod,
                    },
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
