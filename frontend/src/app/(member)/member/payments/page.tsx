'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '@/services/payment.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Lịch sử thanh toán
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
            <p className="py-14 text-center text-sm text-slate-400">Chưa có giao dịch nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Mã giao dịch
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Gói tập
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Số tiền
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Phương thức
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Ngày
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(payments || []).map((p) => {
                    const st = STATUS_LABEL[p.status] || { label: p.status, variant: 'outline' };
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {p.code}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 dark:text-slate-200">
                          {p.membership?.package?.name || '--'}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {METHOD_LABEL[p.method] || p.method}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setDetailId(p.id)}>
                            <Eye className="w-3.5 h-3.5" />
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
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black">GYM MASTER PRO</p>
                <p className="text-[11px] opacity-80">Hóa đơn thanh toán</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã hóa đơn</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{detail.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hội viên</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{detail.member?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã HV</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{detail.member?.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói tập</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {detail.membership?.package?.name || '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {METHOD_LABEL[detail.method] || detail.method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày giao dịch</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDateTime(detail.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái</span>
                <Badge variant={(STATUS_LABEL[detail.status] || { variant: 'outline' }).variant}>
                  {(STATUS_LABEL[detail.status] || { label: detail.status }).label}
                </Badge>
              </div>
              <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Tổng thanh toán</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(detail.amount)}
                </span>
              </div>
              {detail.transactionRef && (
                <p className="text-[11px] text-slate-400">
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
                <Printer className="w-4 h-4" />
                In hóa đơn
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setDetailId(null);
                  window.print();
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <div className="hidden">
        <Receipt className="w-4 h-4" />
      </div>
    </div>
  );
}