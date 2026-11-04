'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import { MEMBERSHIP_STATUS_META, PAYMENT_METHOD_LABEL } from '@/lib/status';
import { CreditCard, CheckCircle2, XCircle, Lock, Unlock, Eye, Clock, Ban } from 'lucide-react';

export default function MembershipsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

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
                          <Badge variant={msMeta.variant}>{msMeta.label}</Badge>
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
                            {item.status !== 'PENDING' && item.status !== 'CANCELLED' && (
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
    </div>
  );
}
