'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '@/services/payment.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, Eye, Flame, CheckCircle2, Printer } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'Ví MoMo',
  VNPAY: 'VNPay',
  CREDIT_CARD: 'Thẻ tín dụng',
};

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  COMPLETED: { label: 'Thành công', variant: 'success' },
  PENDING: { label: 'Chờ xử lý', variant: 'warning' },
  FAILED: { label: 'Thất bại', variant: 'destructive' },
  CANCELLED: { label: 'Hủy', variant: 'outline' },
  REFUNDED: { label: 'Hoàn tiền', variant: 'info' },
};

export default function MemberPaymentsPage() {
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['member-payments'],
    queryFn: paymentApi.getMyPayments,
    retry: 0,
  });

  const { data: detail, isFetching: detailLoading } = useQuery({
    queryKey: ['member-payment-detail', detailId],
    queryFn: () => paymentApi.getPaymentDetail(detailId!),
    enabled: !!detailId,
    retry: 0,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Lịch sử thanh toán
        </h1>
        <p className="mt-1 text-sm text-muted">
          Các hóa đơn và giao dịch của bạn tại GymMaster.
        </p>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-2">
          {isLoading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (payments || []).length === 0 ? (
            <p className="py-14 text-center text-sm text-muted">Chưa có giao dịch nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Mã giao dịch
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Gói tập
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Số tiền
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Phương thức
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Ngày
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(payments || []).map((p) => {
                    const st = STATUS_LABEL[p.status] || { label: p.status, variant: 'outline' };
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-line/30">
                        <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-semibold text-neon">
                          {p.code}
                        </td>
                        <td className="px-4 py-3.5 text-chalk">
                          {p.membership?.package?.name || '--'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-bold text-chalk">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                          {METHOD_LABEL[p.method] || p.method}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setDetailId(p.id)}>
                            <Eye className="h-3.5 w-3.5" />
                            Hóa đơn
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice dialog */}
      <Dialog
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title="Chi tiết hóa đơn"
        className="max-w-md"
      >
        {detailLoading || !detail ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 rounded-xl border border-neon/30 bg-ink p-4 text-chalk">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon/25 bg-neon/10 text-neon">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-bold uppercase leading-tight">
                  GYM<span className="text-neon">MASTER</span> PRO
                </p>
                <p className="text-[11px] text-muted">Hóa đơn thanh toán</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Mã hóa đơn</span>
                <span className="font-mono font-semibold text-neon">{detail.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Hội viên</span>
                <span className="font-semibold text-chalk">{detail.member?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Mã HV</span>
                <span className="font-semibold text-chalk">{detail.member?.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Gói tập</span>
                <span className="font-semibold text-chalk">
                  {detail.membership?.package?.name || '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phương thức</span>
                <span className="font-semibold text-chalk">
                  {METHOD_LABEL[detail.method] || detail.method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Ngày giao dịch</span>
                <span className="font-semibold text-chalk">{formatDateTime(detail.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Trạng thái</span>
                <Badge variant={(STATUS_LABEL[detail.status] || { variant: 'outline' }).variant}>
                  {(STATUS_LABEL[detail.status] || { label: detail.status }).label}
                </Badge>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-line pt-3">
                <span className="font-semibold text-muted">Tổng thanh toán</span>
                <span className="font-display text-xl font-bold text-neon">
                  {formatCurrency(detail.amount)}
                </span>
              </div>
              {detail.transactionRef && (
                <p className="text-[11px] text-muted">
                  Mã giao dịch: {detail.transactionRef}
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                In hóa đơn
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setDetailId(null);
                  window.print();
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <div className="hidden">
        <Receipt className="h-4 w-4" />
      </div>
    </div>
  );
}
