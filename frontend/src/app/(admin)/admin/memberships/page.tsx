'use client';

import Link from '@/components/ui/area-link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { formatDate, formatCurrency } from '@/lib/utils';
import { getStoredUser } from '@/lib/auth';
import { MEMBERSHIP_STATUS_META, PAYMENT_METHOD_LABEL } from '@/lib/status';
import { paymentApi } from '@/services/payment.service';
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Filter,
  Lock,
  Search,
  Unlock,
  X,
  XCircle,
} from 'lucide-react';

export default function MembershipsPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const user = getStoredUser();
  /** Hoàn tiền > 0 chỉ ADMIN (backend chặn MANAGER/STAFF) */
  const isAdmin = user?.role === 'ADMIN';
  const canReviewChanges = isAdmin || user?.role === 'MANAGER';

  const [changeTarget, setChangeTarget] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('BANK_TRANSFER');
  const [refundReference, setRefundReference] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [ptIncludedSessions, setPtIncludedSessions] = useState('');
  const [ptUsedSessions, setPtUsedSessions] = useState('');
  const [ptSessionValue, setPtSessionValue] = useState('');
  const [ptReconciliationNote, setPtReconciliationNote] = useState('');

  const {
    data: memberships,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-memberships'],
    queryFn: async () => {
      const res = await apiClient.get('/memberships');
      return res.data;
    },
  });

  const filteredMemberships = useMemo(() => {
    const list = Array.isArray(memberships) ? memberships : [];
    const q = search.trim().toLowerCase();
    return list.filter((item: any) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        item.member?.fullName,
        item.member?.code,
        item.member?.phone,
        item.package?.name,
        ...(item.payments || []).map((p: any) => p.code),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [memberships, search, statusFilter]);

  const {
    data: changeRequests = [],
    isLoading: changesLoading,
    isError: changesError,
  } = useQuery({
    queryKey: ['admin-membership-changes'],
    queryFn: async () => {
      const res = await apiClient.get('/membership-changes');
      return res.data;
    },
    enabled: canReviewChanges,
  });
  const ptReconciliationQuery = useQuery({
    queryKey: ['membership-change-pt-reconciliation', changeTarget?.id],
    queryFn: async () => {
      if (!changeTarget?.id) throw new Error('Thiếu mã yêu cầu đối soát PT');
      const res = await apiClient.get(`/membership-changes/${changeTarget.id}/pt-reconciliation`);
      return res.data;
    },
    enabled: changeTarget?.type === 'CANCEL_REFUND' && changeTarget?.status === 'REQUESTED',
    retry: 0,
  });
  const ptReconciliation = ptReconciliationQuery.data;
  const linkedPtSessions = ptReconciliation?.linkedCompletedCount ?? 0;
  const effectivePtUsedSessions =
    ptUsedSessions || String(Math.max(ptReconciliation?.usedSessions ?? 0, linkedPtSessions));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-memberships'] });
    queryClient.invalidateQueries({ queryKey: ['admin-membership-changes'] });
    queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
    queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
    queryClient.invalidateQueries({
      queryKey: ['membership-change-pt-reconciliation', changeTarget?.id],
    });
  };

  const approveMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await apiClient.patch(`/payments/${paymentId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Xác nhận thanh toán thành công', 'Gói tập đã được kích hoạt.');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Xác nhận thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const res = await apiClient.patch(`/memberships/${id}/status`, { status, reason });
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success('Cập nhật trạng thái thành công', res.message);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Cập nhật thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: (paymentId: string) =>
      paymentApi.reject(paymentId, { reason: 'Từ chối bởi quản trị viên' }),
    onSuccess: (res: any) => {
      toast.success('Đã từ chối khoản thanh toán', res.message);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Từ chối khoản thanh toán thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleApprove = async (m: any) => {
    const ok = await confirm({
      title: 'Xác nhận thanh toán',
      description: 'Xác nhận thanh toán cho hợp đồng này? Gói tập sẽ được kích hoạt.',
      type: 'info',
    });
    if (ok) {
      const pendingPayment = m.payments?.find((p: any) => p.status === 'PENDING');
      if (pendingPayment) approveMutation.mutate(pendingPayment.id);
      else {
        // Không có hóa đơn PENDING → kích hoạt trực tiếp qua status
        statusMutation.mutate({ id: m.id, status: 'ACTIVE' });
      }
    }
  };

  const handleCancel = async (m: any) => {
    const pendingPayment = m.payments?.find((p: any) => p.status === 'PENDING');
    if (pendingPayment) {
      const ok = await confirm({
        title: 'Từ chối thanh toán',
        description: `Từ chối khoản thanh toán của ${m.member?.fullName} cho gói ${m.package?.name}?`,
        type: 'danger',
      });
      if (ok) rejectPaymentMutation.mutate(pendingPayment.id);
    } else if (m.status === 'PENDING') {
      const ok = await confirm({
        title: 'Hủy đăng ký',
        description: `Hủy yêu cầu đăng ký gói ${m.package?.name} của ${m.member?.fullName}?`,
        type: 'danger',
      });
      if (ok) {
        statusMutation.mutate({
          id: m.id,
          status: 'CANCELLED',
          reason: 'Hủy yêu cầu đăng ký chưa thanh toán',
        });
      }
    }
  };

  const handleSuspend = async (m: any) => {
    const ok = await confirm({
      title: 'Tạm khóa thẻ',
      description: 'Tạm khóa thẻ này? Hội viên sẽ không thể check-in.',
      type: 'danger',
    });
    if (ok) statusMutation.mutate({ id: m.id, status: 'SUSPENDED' });
  };

  const handleReactivate = (m: any) => {
    statusMutation.mutate({ id: m.id, status: 'ACTIVE' });
  };

  const openChange = (request: any) => {
    setChangeTarget(request);
    setRefundAmount('');
    setRefundReference('');
    setReviewNote('');
    setRefundMethod('BANK_TRANSFER');
    setPtIncludedSessions(
      String(request.membership?.ptSessionsIncluded ?? request.membership?.package?.sessions ?? ''),
    );
    setPtUsedSessions(
      request.membership?.ptSessionsIncluded == null
        ? ''
        : String(request.membership?.ptSessionsUsed ?? 0),
    );
    setPtSessionValue(
      String(
        request.membership?.ptSessionValue ?? request.membership?.package?.ptSessionValue ?? '',
      ),
    );
    setPtReconciliationNote('');
  };

  const closeChange = () => {
    setChangeTarget(null);
    setRefundAmount('');
    setRefundReference('');
    setReviewNote('');
    setPtReconciliationNote('');
  };

  const reconcilePtMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/membership-changes/${changeTarget.id}/reconcile-pt`, {
        includedSessions: Number(ptIncludedSessions),
        usedSessions: Number(effectivePtUsedSessions),
        sessionValue: Number(ptSessionValue),
        note: ptReconciliationNote.trim(),
      });
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success('Đã đối soát quota PT', res.message);
      setPtReconciliationNote('');
      queryClient.invalidateQueries({
        queryKey: ['membership-change-pt-reconciliation', changeTarget?.id],
      });
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể lưu kết quả đối soát PT';
      toast.error('Đối soát thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const proposeRefundMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/membership-changes/${changeTarget.id}/propose-refund`, {
        ...(refundAmount.trim() ? { refundAmount: Number(refundAmount) } : {}),
        reason: reviewNote.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success('Đã gửi đề xuất hoàn tiền', res.message);
      closeChange();
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể gửi đề xuất';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const approveChangeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/membership-changes/${changeTarget.id}/approve`, {
        note: reviewNote.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success('Đã phê duyệt yêu cầu', res.message);
      closeChange();
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể phê duyệt';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const rejectChangeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/membership-changes/${changeTarget.id}/reject`, {
        reason: reviewNote.trim(),
      });
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success('Đã từ chối yêu cầu', res.message);
      closeChange();
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể từ chối yêu cầu';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/membership-changes/${changeTarget.id}/payout`, {
        refundMethod,
        refundReference: refundReference.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success('Đã ghi nhận khoản chi hoàn', res.message);
      closeChange();
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể ghi nhận khoản chi hoàn';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const changeTypeLabel: Record<string, string> = {
    CANCEL_REFUND: 'Chấm dứt / hoàn tiền',
    FREEZE: 'Bảo lưu',
  };
  const changeStatusLabel: Record<string, string> = {
    REQUESTED: 'Chờ đề xuất mức hoàn',
    AWAITING_MEMBER_CONFIRMATION: 'Chờ hội viên xác nhận mức hoàn',
    PENDING_MANAGER_APPROVAL: 'Chờ phê duyệt',
    PENDING_PAYOUT: 'Chờ ghi nhận chi hoàn',
  };
  const requiresPtReconciliation = Boolean(
    changeTarget?.membership?.package?.sessions ||
    ptReconciliation?.packageSessions ||
    changeTarget?.membership?.ptSessionsIncluded,
  );
  const ptSnapshotReady =
    ptReconciliation?.includedSessions != null && ptReconciliation?.sessionValue != null;
  const remainingPtSessions = Number(ptIncludedSessions) - Number(effectivePtUsedSessions);
  const isValidPtReconciliation =
    Number.isInteger(Number(ptIncludedSessions)) &&
    Number(ptIncludedSessions) > 0 &&
    Number.isInteger(Number(effectivePtUsedSessions)) &&
    Number(effectivePtUsedSessions) >= linkedPtSessions &&
    Number(effectivePtUsedSessions) <= Number(ptIncludedSessions) &&
    Number.isFinite(Number(ptSessionValue)) &&
    Number(ptSessionValue) >= 0 &&
    ptReconciliationNote.trim().length > 0;
  const canProposeRefund =
    !requiresPtReconciliation ||
    (ptSnapshotReady && !ptReconciliationQuery.isError && !ptReconciliationQuery.isPending);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk flex items-center gap-2">
            <CreditCard className="size-6 text-neon" />
            Hợp Đồng & Thẻ Hội Viên
          </h1>
          <p className="text-xs text-muted mt-1">
            Xác nhận thanh toán, kích hoạt, tạm khóa và hủy hợp đồng thẻ tập
          </p>
        </div>
        <Link href="/admin/payments">
          <Button variant="primary" size="md" className="font-semibold text-xs">
            <Clock className="size-4 mr-1.5" />
            Hóa đơn chờ xác nhận
          </Button>
        </Link>
      </div>

      {canReviewChanges && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="size-4 text-neon" />
              Yêu cầu thay đổi hợp đồng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {changesLoading ? (
              <div className="flex items-center gap-2 py-5 text-xs text-muted">
                <Spinner /> Đang tải yêu cầu...
              </div>
            ) : changesError ? (
              <ErrorState
                title="Không tải được yêu cầu"
                description="Vui lòng thử lại sau."
                onRetry={() =>
                  queryClient.invalidateQueries({ queryKey: ['admin-membership-changes'] })
                }
              />
            ) : changeRequests.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted">
                Không có yêu cầu đang chờ xử lý.
              </p>
            ) : (
              changeRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-ink p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-chalk">
                      {changeTypeLabel[request.type]} · {request.membership?.package?.name}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {request.member?.fullName} ({request.member?.code})
                      {request.transferMember
                        ? ` → ${request.transferMember.fullName} (${request.transferMember.code})`
                        : ''}
                      {request.freezeDays ? ` · ${request.freezeDays} ngày` : ''}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {changeStatusLabel[request.status] || request.status}
                      {request.proposedRefundAmount != null
                        ? ` · ${formatCurrency(request.proposedRefundAmount)}`
                        : ''}
                    </p>
                    {request.reason && (
                      <p className="mt-1 truncate text-xs text-muted">{request.reason}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {request.status === 'REQUESTED' && (
                      <Button size="sm" onClick={() => openChange(request)}>
                        Đề xuất hoàn
                      </Button>
                    )}
                    {request.status === 'PENDING_MANAGER_APPROVAL' && (
                      <Button size="sm" onClick={() => openChange(request)}>
                        Phê duyệt
                      </Button>
                    )}
                    {request.status === 'PENDING_PAYOUT' && isAdmin && (
                      <Button size="sm" onClick={() => openChange(request)}>
                        Ghi nhận chi hoàn
                      </Button>
                    )}
                    {request.status !== 'PENDING_PAYOUT' && (
                      <Button variant="outline" size="sm" onClick={() => openChange(request)}>
                        Từ chối / xem
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        {/* Thanh tìm kiếm + lọc theo tình trạng hợp đồng */}
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã hội viên, gói tập, mã hóa đơn..."
              aria-label="Tìm kiếm hợp đồng"
              className="h-10 w-full min-w-0 rounded-sm border border-line bg-ink px-9 text-xs text-chalk placeholder:text-muted/70 focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-chalk"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:w-64">
            <Filter className="size-4 shrink-0 text-muted" />
            <Select
              className="text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo tình trạng hợp đồng"
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'ACTIVE', label: 'Đang hoạt động' },
                { value: 'PENDING', label: 'Đang chờ xác nhận' },
                { value: 'SUSPENDED', label: 'Tạm khóa' },
                { value: 'EXPIRED', label: 'Hết hạn' },
                { value: 'CANCELLED', label: 'Đã hủy' },
              ]}
            />
          </div>
          {(search.trim() !== '' || statusFilter !== 'ALL') && (
            <div className="flex shrink-0 items-center gap-3">
              <p className="whitespace-nowrap text-[11px] text-muted">
                {filteredMemberships.length}/{Array.isArray(memberships) ? memberships.length : 0}{' '}
                hợp đồng
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                }}
                className="whitespace-nowrap text-[11px] font-semibold text-neon transition-colors hover:text-neon/80"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-xs text-muted">
              <Spinner /> Đang tải danh sách thẻ hội viên...
            </div>
          ) : isError ? (
            <ErrorState
              className="m-3"
              title="Không tải được thẻ hội viên"
              description="Lỗi tải dữ liệu thẻ hội viên từ Backend. Vui lòng thử lại."
              onRetry={() => refetch()}
            />
          ) : memberships && memberships.length > 0 && filteredMemberships.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Hội viên</th>
                    <th className="py-3 px-4 font-semibold">Gói dịch vụ</th>
                    <th className="py-3 px-4 font-semibold">Hiệu lực</th>
                    <th className="py-3 px-4 font-semibold">Thành tiền</th>
                    <th className="py-3 px-4 font-semibold">Thanh toán</th>
                    <th className="py-3 px-4 font-semibold">Trạng thái</th>
                    <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {filteredMemberships.map((item: any) => {
                    const msMeta = MEMBERSHIP_STATUS_META[item.status] || {
                      label: item.status,
                      variant: 'outline',
                    };
                    const pendingPayment = item.payments?.find((p: any) => p.status === 'PENDING');
                    const awaitingPayout = item.changeRequests?.some(
                      (request: any) => request.status === 'PENDING_PAYOUT',
                    );
                    return (
                      <tr key={item.id} className="hover:bg-line/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-chalk">{item.member?.fullName}</p>
                          <p className="font-mono text-neon text-[11px]">{item.member?.code}</p>
                        </td>
                        <td className="py-3 px-4 text-muted">
                          <p className="font-semibold text-chalk">{item.package?.name}</p>
                          <p className="text-[11px]">{item.package?.durationDays} ngày</p>
                        </td>
                        <td className="py-3 px-4 text-muted">
                          {formatDate(item.startDate)} → {formatDate(item.endDate)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-neon">
                            {formatCurrency(item.finalAmount ?? item.price)}
                          </p>
                          {Number(item.discountAmount) > 0 && (
                            <p className="text-[11px] text-muted line-through">
                              {formatCurrency(item.price)}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.payments?.length ? (
                            <div className="space-y-1">
                              {item.payments.slice(0, 1).map((p: any) => (
                                <div key={p.id}>
                                  <Badge
                                    variant={
                                      p.status === 'PAID'
                                        ? 'success'
                                        : p.status === 'PENDING'
                                          ? 'warning'
                                          : p.status === 'CANCELLED'
                                            ? 'destructive'
                                            : 'outline'
                                    }
                                    className="font-mono text-[10px]"
                                  >
                                    {p.code}
                                  </Badge>
                                  <p className="mt-0.5 text-[10px] text-muted">
                                    {PAYMENT_METHOD_LABEL[p.method] || p.method}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <Badge variant={msMeta.variant}>{msMeta.label}</Badge>
                            {awaitingPayout && (
                              <Badge variant="warning" className="text-[10px]">
                                <Clock className="mr-1 size-3" />
                                Chờ chi hoàn
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs text-neon"
                                  isLoading={approveMutation.isPending}
                                  onClick={() => handleApprove(item)}
                                >
                                  <CheckCircle2 className="size-3.5 mr-1" />
                                  {pendingPayment ? 'Xác nhận' : 'Kích hoạt'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs text-danger"
                                  isLoading={
                                    rejectPaymentMutation.isPending || statusMutation.isPending
                                  }
                                  onClick={() => handleCancel(item)}
                                >
                                  <XCircle className="size-3.5 mr-1" />{' '}
                                  {pendingPayment ? 'Từ chối' : 'Hủy'}
                                </Button>
                              </>
                            )}
                            {item.status === 'ACTIVE' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleSuspend(item)}
                              >
                                <Lock className="size-3.5 mr-1" /> Tạm khóa
                              </Button>
                            )}
                            {item.status === 'SUSPENDED' && !awaitingPayout && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-neon"
                                onClick={() => handleReactivate(item)}
                              >
                                <Unlock className="size-3.5 mr-1" /> Kích hoạt lại
                              </Button>
                            )}
                            <Link href={`/admin/members/${item.member?.id}`}>
                              <Button variant="outline" size="sm" className="text-xs">
                                <Eye className="size-3.5" />
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
          ) : memberships && memberships.length > 0 ? (
            <EmptyState
              className="m-3"
              icon={Search}
              title="Không tìm thấy hợp đồng"
              description="Không có hợp đồng nào phù hợp với từ khóa hoặc bộ lọc hiện tại. Thử từ khóa khác hoặc xóa bộ lọc."
            />
          ) : (
            <EmptyState
              className="m-3"
              icon={CreditCard}
              title="Chưa có hợp đồng"
              description="Chưa có hợp đồng gói tập nào được tạo. Vào trang Thanh toán hoặc đăng ký gói cho hội viên để bắt đầu."
            />
          )}
        </CardContent>
      </Card>

      {/* Xét duyệt từng bước theo loại yêu cầu */}
      <Dialog
        open={!!changeTarget}
        onClose={closeChange}
        title={changeTarget ? changeTypeLabel[changeTarget.type] : 'Yêu cầu thay đổi'}
        description="Ghi nhận riêng bước đề xuất, xác nhận, phê duyệt và chi tiền."
        className="max-w-lg"
      >
        {changeTarget && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-line bg-ink p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">Hội viên</p>
                  <p className="font-semibold text-chalk">
                    {changeTarget.member?.fullName} ({changeTarget.member?.code})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Gói</p>
                  <p className="font-semibold text-chalk">
                    {changeTarget.membership?.package?.name}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {formatDate(changeTarget.membership?.startDate)} →{' '}
                {formatDate(changeTarget.membership?.endDate)} · Còn{' '}
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(changeTarget.membership?.endDate).getTime() - Date.now()) /
                      (24 * 60 * 60 * 1000),
                  ),
                )}{' '}
                ngày
              </p>
              {changeTarget.transferMember && (
                <p className="mt-2 text-xs text-muted">
                  Người nhận: {changeTarget.transferMember.fullName} (
                  {changeTarget.transferMember.code})
                </p>
              )}
              {changeTarget.reason && (
                <p className="mt-2 text-xs text-muted">Lý do: {changeTarget.reason}</p>
              )}
              {changeTarget.proposedRefundAmount != null && (
                <p className="mt-2 text-sm font-semibold text-neon">
                  Đề xuất hoàn: {formatCurrency(changeTarget.proposedRefundAmount)}
                </p>
              )}
            </div>

            {changeTarget.status === 'REQUESTED' && changeTarget.type === 'CANCEL_REFUND' && (
              <>
                {requiresPtReconciliation && (
                  <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
                    <div>
                      <p className="font-semibold text-chalk">Đối soát quota PT</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        Đối chiếu hợp đồng/phiếu thu và lịch PT trước khi đề xuất. Lịch đã liên kết
                        với hợp đồng được tính tối thiểu; lịch chưa liên kết chỉ là dữ liệu tham
                        khảo, cần kiểm tra rồi mới tính vào số đã dùng.
                      </p>
                    </div>

                    {ptReconciliationQuery.isPending ? (
                      <Spinner />
                    ) : ptReconciliationQuery.isError ? (
                      <p className="text-xs text-danger">
                        Không tải được dữ liệu đối soát. Đóng hộp thoại rồi thử mở lại.
                      </p>
                    ) : (
                      <>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Input
                            label="Quota PT theo hợp đồng"
                            type="number"
                            min={1}
                            max={5000}
                            step={1}
                            value={ptIncludedSessions}
                            onChange={(e) => setPtIncludedSessions(e.target.value)}
                          />
                          <Input
                            label="Buổi đã sử dụng"
                            type="number"
                            min={linkedPtSessions}
                            max={ptIncludedSessions || 5000}
                            step={1}
                            value={effectivePtUsedSessions}
                            onChange={(e) => setPtUsedSessions(e.target.value)}
                          />
                          <Input
                            label="Giá trị mỗi buổi (VND)"
                            type="number"
                            min={0}
                            step="0.01"
                            value={ptSessionValue}
                            onChange={(e) => setPtSessionValue(e.target.value)}
                          />
                        </div>

                        <p className="text-xs text-muted">
                          Gói hiện lưu {ptReconciliation.packageSessions ?? 'chưa có'} buổi · Hợp
                          đồng đã lưu {ptReconciliation.includedSessions ?? 'chưa có quota'} · Có{' '}
                          {linkedPtSessions} buổi hoàn thành liên kết trực tiếp · Còn lại:{' '}
                          {Number.isInteger(remainingPtSessions) && remainingPtSessions >= 0
                            ? remainingPtSessions
                            : '—'}{' '}
                          buổi
                        </p>

                        {ptReconciliation.unlinkedCompletedSessions?.length > 0 && (
                          <div className="rounded-lg border border-line bg-ink p-3">
                            <p className="mb-2 text-xs font-semibold text-chalk">
                              Buổi PT hoàn thành cùng thời hạn nhưng chưa gắn hợp đồng (
                              {ptReconciliation.unlinkedCompletedSessions.length})
                            </p>
                            <ul className="max-h-28 space-y-1 overflow-y-auto text-xs text-muted">
                              {ptReconciliation.unlinkedCompletedSessions.map((session: any) => (
                                <li key={session.id}>
                                  {formatDate(session.startTime)} · {session.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Textarea
                          label="Căn cứ đối soát (bắt buộc)"
                          rows={2}
                          maxLength={1000}
                          value={ptReconciliationNote}
                          onChange={(e) => setPtReconciliationNote(e.target.value)}
                          placeholder="VD: Đối chiếu hợp đồng giấy và lịch PT; 3 buổi đã hoàn thành, còn 47 buổi."
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-muted">
                            {ptSnapshotReady
                              ? 'Quota đã được lưu. Có thể cập nhật lại sau khi đối chiếu hồ sơ.'
                              : 'Cần lưu đối soát để ghi quota PT vào hợp đồng trước khi đề xuất.'}
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={reconcilePtMutation.isPending}
                            disabled={!isValidPtReconciliation}
                            onClick={() => reconcilePtMutation.mutate()}
                          >
                            Lưu đối soát PT
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <Input
                  label="Số tiền đề xuất (VND)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={refundAmount}
                  placeholder="Để trống để hệ thống tự tính theo chính sách"
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="text-xs text-muted">
                  Hệ thống tính phần thời gian chưa sử dụng và quota PT còn lại; không vượt quá
                  khoản thanh toán còn lại. Hội viên cần xác nhận trước khi phê duyệt.
                </p>
              </>
            )}

            {changeTarget.status === 'PENDING_PAYOUT' && isAdmin && (
              <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-muted">Phương thức chi hoàn</p>
                  <Select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    options={[
                      { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng' },
                      { value: 'CASH', label: 'Tiền mặt tại quầy' },
                    ]}
                  />
                </div>
                <Input
                  label="Mã giao dịch / phiếu chi"
                  value={refundReference}
                  onChange={(e) => setRefundReference(e.target.value)}
                  placeholder="Bắt buộc nếu chuyển khoản"
                />
              </div>
            )}

            {(changeTarget.status === 'PENDING_MANAGER_APPROVAL' ||
              changeTarget.status === 'REQUESTED' ||
              changeTarget.status === 'AWAITING_MEMBER_CONFIRMATION') && (
              <div>
                <label
                  htmlFor="membership-review-note"
                  className="mb-1.5 block text-xs font-semibold text-muted"
                >
                  Ghi chú xử lý
                </label>
                <Textarea
                  id="membership-review-note"
                  rows={2}
                  maxLength={1000}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={closeChange}>
                Đóng
              </Button>
              {changeTarget.status === 'REQUESTED' && changeTarget.type === 'CANCEL_REFUND' && (
                <Button
                  isLoading={proposeRefundMutation.isPending}
                  disabled={!canProposeRefund}
                  onClick={() => proposeRefundMutation.mutate()}
                >
                  Gửi đề xuất
                </Button>
              )}
              {changeTarget.status === 'PENDING_MANAGER_APPROVAL' && (
                <Button
                  isLoading={approveChangeMutation.isPending}
                  onClick={() => approveChangeMutation.mutate()}
                >
                  <CheckCircle2 className="size-4" />
                  Phê duyệt
                </Button>
              )}
              {changeTarget.status === 'PENDING_PAYOUT' && isAdmin && (
                <Button
                  isLoading={payoutMutation.isPending}
                  disabled={refundMethod === 'BANK_TRANSFER' && !refundReference.trim()}
                  onClick={() => payoutMutation.mutate()}
                >
                  Ghi nhận đã chi
                </Button>
              )}
              {changeTarget.status !== 'PENDING_PAYOUT' && (
                <Button
                  variant="danger"
                  isLoading={rejectChangeMutation.isPending}
                  disabled={!reviewNote.trim()}
                  onClick={() => rejectChangeMutation.mutate()}
                >
                  Từ chối yêu cầu
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
