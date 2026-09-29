'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '@/services/payment.service';
import { statsApi } from '@/services/notification.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, Wallet, Clock, CheckCircle2, CreditCard, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { PAYMENT_STATUS_META, PAYMENT_METHOD_LABEL } from '@/lib/status';

export default function MemberPaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['member-payments'],
    queryFn: paymentApi.getMyPayments,
    retry: 0,
  });

  const { data: stats } = useQuery({
    queryKey: ['member-stats'],
    queryFn: statsApi.getMemberStats,
    retry: 0,
  });

  const ps = stats?.paymentSummary;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Lịch sử thanh toán
        </h1>
        <p className="mt-1 text-sm text-muted">
          Các hóa đơn và giao dịch của bạn tại GymMaster — nhấn vào hóa đơn để xem & in.
        </p>
      </div>

      {/* Tóm tắt chi tiêu */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-neon/25 bg-neon/10 text-neon">
              <Wallet className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Tổng đã thanh toán
              </p>
              <p className="font-display text-xl font-extrabold text-neon">
                {formatCurrency(ps?.totalSpent || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Đang chờ xác nhận
              </p>
              <p className="font-display text-xl font-extrabold text-chalk">
                {ps?.pendingCount ?? 0} hóa đơn
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Đã thanh toán
              </p>
              <p className="font-display text-xl font-extrabold text-chalk">
                {ps?.paidCount ?? 0} hóa đơn
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {ps?.pendingCount ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-chalk">
          <b className="text-amber-400">⏳ Bạn có {ps.pendingCount} hóa đơn đang chờ xác nhận.</b>{' '}
          Nếu thanh toán bằng chuyển khoản, vui lòng ghi đúng nội dung chuyển khoản trong hóa đơn để
          lễ tân xác nhận nhanh nhất.
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0 sm:p-2">
          {isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (payments || []).length === 0 ? (
            <div className="py-14 text-center">
              <Receipt className="mx-auto size-10 text-line" />
              <p className="mt-3 text-sm text-muted">Chưa có giao dịch nào.</p>
              <Link href="/member/membership">
                <Button variant="secondary" size="sm" className="mt-4">
                  Đăng ký gói tập <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Mã hóa đơn
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
                    const meta = PAYMENT_STATUS_META[p.status] || {
                      label: p.status,
                      variant: 'outline',
                    };
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-line/30">
                        <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-semibold text-neon">
                          {p.code}
                          {p.invoice && (
                            <span className="ml-2 text-[10px] font-normal text-muted">
                              HD {p.invoice.invoiceNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-chalk">
                          {p.membership?.package?.name || '--'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-bold text-chalk">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                          {PAYMENT_METHOD_LABEL[p.method] || p.method}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Badge variant={meta.variant as any}>{meta.label}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link href={`/member/payments/${p.id}`}>
                            <Button variant="outline" size="sm">
                              <CreditCard className="size-3.5" /> Hóa đơn
                            </Button>
                          </Link>
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
    </div>
  );
}
