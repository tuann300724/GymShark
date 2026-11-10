'use client';

import Link from 'next/link';
import { useState } from 'react';
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
import { formatDate, formatCurrency } from '@/lib/utils';
import { getStoredUser } from '@/lib/auth';
import { MEMBERSHIP_STATUS_META, PAYMENT_METHOD_LABEL } from '@/lib/status';
import { CreditCard, CheckCircle2, XCircle, Lock, Unlock, Eye, Clock, Ban } from 'lucide-react';

/** Đề xuất số tiền hoàn = tiền gói × tỷ lệ ngày còn lại, làm tròn xuống 1.000đ */
function suggestRefundAmount(m: any): number {
  const base = Number(m?.finalAmount ?? m?.price ?? 0);
  const start = new Date(m?.startDate).getTime();
  const end = new Date(m?.endDate).getTime();
  const total = Math.max(1, end - start);
  const remain = Math.max(0, end - Date.now());
  return Math.floor((base * remain) / total / 1000) * 1000;
}

export default function MembershipsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const user = getStoredUser();
  /** Hoàn tiền > 0 chỉ ADMIN (backend chặn MANAGER/STAFF) */
  const isAdmin = user?.role === 'ADMIN';

  /** Dialog duyệt yêu cầu hủy gói */
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('BANK_TRANSFER');
  const [approveReason, setApproveReason] = useState('');

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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-memberships'] });
    queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
    queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
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

  const handleApprove = (m: any) => {
    if (window.confirm('Xác nhận thanh toán cho hợp đồng này? Gói tập sẽ được kích hoạt.')) {
      const pendingPayment = m.payments?.find((p: any) => p.status === 'PENDING');
      if (pendingPayment) approveMutation.mutate(pendingPayment.id);
      else {
        // Không có hóa đơn PENDING → kích hoạt trực tiếp qua status
        statusMutation.mutate({ id: m.id, status: 'ACTIVE' });
      }
    }
  };

  const handleCancel = (m: any) => {
    if (window.confirm(`Hủy hợp đồng gói ${m.package?.name} của ${m.member?.fullName}?`)) {
      statusMutation.mutate({ id: m.id, status: 'CANCELLED', reason: 'Hủy bởi quản trị viên' });
    }
  };

  const handleSuspend = (m: any) => {
    if (window.confirm('Tạm khóa thẻ này? Hội viên sẽ không thể check-in.')) {
      statusMutation.mutate({ id: m.id, status: 'SUSPENDED' });
    }
  };

  const handleReactivate = (m: any) => {
    statusMutation.mutate({ id: m.id, status: 'ACTIVE' });
  };

  // ---------------- Yêu cầu hủy gói (hội viên gửi → admin duyệt) ----------------

  const openApprove = (m: any) => {
    setApproveTarget(m);
    setRefundAmount(String(suggestRefundAmount(m)));
    setRefundMethod('BANK_TRANSFER');
    setApproveReason(m.cancelRequestReason || '');
  };

  const closeApprove = () => {
    setApproveTarget(null);
    setRefundAmount('');
    setApproveReason('');
  };

  const approveCancelMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiClient.post(`/memberships/${id}/cancel-request/approve`, payload);
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success('Đã duyệt yêu cầu hủy gói', res.message);
      closeApprove();
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['member-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['member-notif-badge'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Duyệt thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const rejectCancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/memberships/${id}/cancel-request/reject`, {});
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success('Đã từ chối yêu cầu hủy gói', res.message);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['member-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['member-notif-badge'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Thao tác thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleRejectCancel = (m: any) => {
    if (
      window.confirm(
        `Từ chối yêu cầu hủy gói của ${m.member?.fullName}? Gói tập sẽ tiếp tục hoạt động bình thường.`,
      )
    ) {
      rejectCancelMutation.mutate(m.id);
    }
  };

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

      <Card>
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
          ) : memberships && memberships.length > 0 ? (
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
                  {memberships.map((item: any) => {
                    const msMeta = MEMBERSHIP_STATUS_META[item.status] || {
                      label: item.status,
                      variant: 'outline',
                    };
                    const pendingPayment = item.payments?.find((p: any) => p.status === 'PENDING');
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
                            {item.cancelRequestedAt && item.status === 'ACTIVE' && (
                              <Badge
                                variant="warning"
                                className="text-[10px]"
                                title={`Yêu cầu hủy${item.cancelRequestReason ? `: ${item.cancelRequestReason}` : ''}`}
                              >
                                <Clock className="mr-1 size-3" />
                                Yêu cầu hủy
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
                                  onClick={() => handleCancel(item)}
                                >
                                  <XCircle className="size-3.5 mr-1" /> Hủy
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
                            {item.status === 'SUSPENDED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-neon"
                                onClick={() => handleReactivate(item)}
                              >
                                <Unlock className="size-3.5 mr-1" /> Kích hoạt lại
                              </Button>
                            )}
                            {item.status === 'ACTIVE' && item.cancelRequestedAt && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs text-danger"
                                  onClick={() => openApprove(item)}
                                >
                                  <CheckCircle2 className="size-3.5 mr-1" /> Duyệt hủy
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleRejectCancel(item)}
                                >
                                  <XCircle className="size-3.5 mr-1" /> Từ chối
                                </Button>
                              </>
                            )}
                            {item.status !== 'PENDING' &&
                              item.status !== 'CANCELLED' &&
                              !item.cancelRequestedAt && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs text-danger"
                                  onClick={() => handleCancel(item)}
                                >
                                  <Ban className="size-3.5 mr-1" /> Hủy hợp đồng
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

      {/* Dialog duyệt yêu cầu hủy gói (+ hoàn tiền nếu admin chọn) */}
      <Dialog
        open={!!approveTarget}
        onClose={closeApprove}
        title="Duyệt yêu cầu hủy gói"
        description="Hội viên không tập nữa — xét duyệt hủy gói và hoàn tiền."
        className="max-w-lg"
      >
        {approveTarget && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-line bg-ink p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">Hội viên</p>
                  <p className="font-semibold text-chalk">{approveTarget.member?.fullName}</p>
                  <p className="font-mono text-[11px] text-neon">{approveTarget.member?.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Gói</p>
                  <p className="font-semibold text-chalk">{approveTarget.package?.name}</p>
                  <p className="text-[11px] text-neon">
                    {formatCurrency(approveTarget.finalAmount ?? approveTarget.price)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {formatDate(approveTarget.startDate)} → {formatDate(approveTarget.endDate)} · Còn{' '}
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(approveTarget.endDate).getTime() - Date.now()) /
                      (24 * 60 * 60 * 1000),
                  ),
                )}{' '}
                ngày
              </p>
              {approveTarget.cancelRequestedAt && (
                <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-[11px] text-amber-300">
                  Yêu cầu lúc {formatDate(approveTarget.cancelRequestedAt)}
                  {approveTarget.cancelRequestReason
                    ? ` — Lý do: ${approveTarget.cancelRequestReason}`
                    : ''}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="approve-reason"
                className="mb-1.5 block text-xs font-semibold text-muted"
              >
                Lý do ghi vào thông báo cho hội viên
              </label>
              <Textarea
                id="approve-reason"
                rows={2}
                maxLength={500}
                placeholder="Ví dụ: Đồng ý hủy theo yêu cầu hội viên..."
                value={approveReason}
                onChange={(e) => setApproveReason(e.target.value)}
              />
            </div>

            {isAdmin ? (
              <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 space-y-3">
                <div>
                  <label
                    htmlFor="refund-amount-input"
                    className="mb-1.5 block text-xs font-semibold text-muted"
                  >
                    Số tiền hoàn (VND) — 0đ = không hoàn tiền
                  </label>
                  <Input
                    id="refund-amount-input"
                    type="number"
                    min={0}
                    step={1000}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    Đề xuất theo số ngày còn lại:{' '}
                    <b className="text-neon">
                      {formatCurrency(suggestRefundAmount(approveTarget))}
                    </b>{' '}
                    (làm tròn xuống 1.000đ) — quản trị viên có thể sửa.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-muted">
                    Phương thức trả lại tiền
                  </p>
                  <Select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    options={[
                      { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng' },
                      { value: 'CASH', label: 'Tiền mặt tại quầy' },
                    ]}
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    Phòng tập tự chuyển tiền lại cho hội viên; app ghi sổ vào giao dịch.
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-line bg-ink p-3 text-[11px] text-muted">
                Bạn đang duyệt với tư cách <b className="text-chalk">không hoàn tiền</b> — chỉ quản
                trị viên mới được duyệt hoàn tiền.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={closeApprove}>
                Đóng
              </Button>
              <Button
                variant="danger"
                isLoading={approveCancelMutation.isPending}
                onClick={() => {
                  const amount = Number(refundAmount) || 0;
                  approveCancelMutation.mutate({
                    id: approveTarget.id,
                    payload: {
                      refundAmount: isAdmin && amount > 0 ? amount : 0,
                      refundMethod: isAdmin && amount > 0 ? refundMethod : undefined,
                      reason: approveReason.trim() || undefined,
                    },
                  });
                }}
              >
                <CheckCircle2 className="size-4" />
                {isAdmin && Number(refundAmount) > 0 ? 'Duyệt hủy & hoàn tiền' : 'Duyệt hủy gói'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
