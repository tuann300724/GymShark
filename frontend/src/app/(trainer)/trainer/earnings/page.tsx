'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, MessageSquare, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { PT_SESSION_STATUS_META, ptSessionApi } from '@/services/pt-session.service';
import { PayoutHistoryCard } from '@/components/payout/payout-history';

/** PT: buổi tập hội viên đặt qua chat + thu nhập sau chiết khấu GymMaster */
export default function TrainerEarningsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pt-sessions', 'trainer-me'],
    queryFn: ptSessionApi.trainerMine,
  });

  const stats = data
    ? [
        { label: 'Buổi đã thanh toán', value: String(data.summary.paidSessions) },
        { label: 'Hội viên đã trả', value: formatCurrency(data.summary.grossRevenue) },
        { label: 'Thu nhập của bạn', value: formatCurrency(data.summary.totalEarning), neon: true },
        { label: 'Chờ GymMaster chi trả', value: formatCurrency(data.summary.pendingPayout) },
        { label: 'Đã nhận', value: formatCurrency(data.summary.paidOut) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          <Wallet className="size-6 text-neon" /> Thu nhập
        </h1>
        <p className="mt-1 text-sm text-muted">
          Hội viên thanh toán buổi tập cho GymMaster; bạn nhận phần còn lại sau chiết khấu
          {data ? ` ${data.commissionRate}%` : ''}. GymMaster chi trả cho các buổi đã diễn ra.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted">{s.label}</p>
                  <p
                    className={`mt-1 font-display text-xl font-bold ${s.neon ? 'text-neon' : 'text-chalk'}`}
                  >
                    {s.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <PayoutHistoryCard
            rows={(data?.payouts ?? []).map((p) => ({
              id: p.id,
              amount: p.amount,
              countLabel: `${p.sessionCount} buổi`,
              note: p.note,
              createdAt: p.createdAt,
              hasProof: p.hasProof,
            }))}
            loadProof={ptSessionApi.getMyPayoutProof}
            description="Mỗi lần GymMaster chuyển thu nhập buổi PT vào tài khoản nhận tiền của bạn, kèm ảnh chứng từ."
            emptyDescription="Khi GymMaster chi trả, khoản tiền sẽ hiện ở đây và bạn nhận thông báo."
          />

          {(data?.data ?? []).length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Chưa có buổi tập nào"
              description="Mở Tin nhắn với hội viên và bấm “Buổi tập” để gửi đề nghị."
              action={
                <Link
                  href="/trainer/messages"
                  className="inline-flex h-10 items-center gap-2 rounded-sm bg-neon px-4 text-sm font-bold text-ink"
                >
                  <MessageSquare className="size-4" /> Mở tin nhắn
                </Link>
              }
            />
          ) : (
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Buổi tập</th>
                      <th className="px-4 py-3 font-semibold">Hội viên</th>
                      <th className="px-4 py-3 text-right font-semibold">Giá</th>
                      <th className="px-4 py-3 text-right font-semibold">Bạn nhận</th>
                      <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {(data?.data ?? []).map((s) => {
                      const meta = PT_SESSION_STATUS_META[s.status];
                      return (
                        <tr key={s.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-chalk">{s.title}</p>
                            <p className="text-xs text-muted">{formatDateTime(s.startTime)}</p>
                          </td>
                          <td className="px-4 py-3 text-chalk">{s.member?.fullName}</td>
                          <td className="px-4 py-3 text-right text-chalk">
                            {formatCurrency(Number(s.price))}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-neon">
                            {formatCurrency(Number(s.trainerEarning))}
                          </td>
                          <td className="space-y-1 px-4 py-3">
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                            {s.status === 'PAID' && (
                              <p className="text-[11px] text-muted">
                                {s.payoutStatus === 'PAID_OUT' ? 'Đã chi trả' : 'Chờ chi trả'}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
