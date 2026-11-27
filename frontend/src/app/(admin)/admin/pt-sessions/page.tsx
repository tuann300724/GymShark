'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HandCoins, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  PT_SESSION_STATUS_META,
  ptSessionApi,
  type PtSessionStatus,
} from '@/services/pt-session.service';

type Tab = 'payout' | 'sessions';
const STATUS_FILTERS: { value: PtSessionStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'AWAITING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'OFFERED', label: 'Chờ hội viên' },
  { value: 'DECLINED', label: 'Từ chối' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
];

/**
 * Admin: buổi PT hội viên đặt qua chat. Doanh thu về GymMaster; tab Chi trả tổng hợp theo PT
 * (phần GymMaster giữ theo % chiết khấu, phần PT nhận) và ghi nhận đã chi cho buổi đã diễn ra.
 */
export default function AdminPtSessionsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { confirm } = useConfirm();
  const [tab, setTab] = useState<Tab>('payout');
  const [status, setStatus] = useState<PtSessionStatus | 'ALL'>('ALL');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pt-sessions', 'admin', status],
    queryFn: () => ptSessionApi.adminList(status === 'ALL' ? undefined : { status }),
  });

  const payout = useMutation({
    mutationFn: (trainerId: string) => ptSessionApi.payout(trainerId),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ['pt-sessions'] });
    },
    onError: (e: any) => {
      const m = e?.response?.data?.message;
      toast.error('Không ghi nhận được chi trả', Array.isArray(m) ? m.join(', ') : m);
    },
  });

  const askPayout = async (trainerId: string, name: string, amount: number, sessions: number) => {
    const ok = await confirm({
      title: 'Ghi nhận đã chi trả cho PT',
      description: `Xác nhận GymMaster đã chuyển ${formatCurrency(amount)} cho ${name} (${sessions} buổi đã diễn ra). Thao tác này đánh dấu các buổi là đã chi trả.`,
    });
    if (ok) payout.mutate(trainerId);
  };

  const totals = data?.totals;
  const kpis = totals
    ? [
        { label: 'Doanh thu buổi PT', value: totals.gross },
        { label: 'GymMaster giữ lại (chiết khấu)', value: totals.platformFee, neon: true },
        { label: 'Phần của PT', value: totals.trainerEarning },
        { label: 'Đến hạn chi trả', value: totals.payable },
        { label: 'Đã chi trả', value: totals.paidOut },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
          <HandCoins className="size-6 text-neon" /> Buổi PT & chi trả
        </h1>
        <p className="mt-1 text-xs text-muted">
          Hội viên tự liên hệ PT qua chat; PT gửi đề nghị, hội viên chấp nhận và thanh toán cho
          GymMaster (xác nhận ở mục Thanh toán). % chiết khấu của từng PT chỉnh ở Huấn luyện viên.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {kpis.map((k) => (
              <Card key={k.label}>
                <CardContent className="p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted">{k.label}</p>
                  <p
                    className={`mt-1 font-display text-xl font-bold ${k.neon ? 'text-neon' : 'text-chalk'}`}
                  >
                    {formatCurrency(k.value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            tabs={[
              { value: 'payout', label: 'Chi trả theo PT', count: data?.trainers.length ?? 0 },
              { value: 'sessions', label: 'Danh sách buổi', count: data?.data.length ?? 0 },
            ]}
          />

          {tab === 'payout' ? (
            (data?.trainers ?? []).length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Chưa có buổi PT nào được thanh toán"
                description="Khi hội viên thanh toán buổi tập đặt qua chat, tổng hợp chi trả sẽ hiện ở đây."
              />
            ) : (
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full min-w-[880px] text-left text-sm">
                    <thead className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Huấn luyện viên</th>
                        <th className="px-4 py-3 text-right font-semibold">Buổi</th>
                        <th className="px-4 py-3 text-right font-semibold">Doanh thu</th>
                        <th className="px-4 py-3 text-right font-semibold">GymMaster giữ</th>
                        <th className="px-4 py-3 text-right font-semibold">Đến hạn chi</th>
                        <th className="px-4 py-3 text-right font-semibold">Chưa diễn ra</th>
                        <th className="px-4 py-3 text-right font-semibold">Đã chi</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data?.trainers.map((t) => (
                        <tr key={t.trainerId}>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/trainers/${t.trainerId}`}
                              className="font-semibold text-chalk hover:text-neon"
                            >
                              {t.fullName}
                            </Link>
                            <p className="text-xs text-muted">Chiết khấu {t.commissionRate}%</p>
                          </td>
                          <td className="px-4 py-3 text-right text-chalk">{t.sessions}</td>
                          <td className="px-4 py-3 text-right text-chalk">
                            {formatCurrency(t.gross)}
                          </td>
                          <td className="px-4 py-3 text-right text-chalk">
                            {formatCurrency(t.platformFee)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-neon">
                            {formatCurrency(t.payable)}
                          </td>
                          <td className="px-4 py-3 text-right text-muted">
                            {formatCurrency(t.upcomingEarning)}
                          </td>
                          <td className="px-4 py-3 text-right text-muted">
                            {formatCurrency(t.paidOut)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              disabled={t.payable <= 0 || payout.isPending}
                              isLoading={payout.isPending && payout.variables === t.trainerId}
                              onClick={() =>
                                askPayout(t.trainerId, t.fullName, t.payable, t.payableSessions)
                              }
                            >
                              Đã chi trả
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setStatus(f.value)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${status === f.value ? 'border-neon bg-neon/10 text-neon' : 'border-line text-muted hover:text-chalk'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {(data?.data ?? []).length === 0 ? (
                <EmptyState
                  icon={HandCoins}
                  title="Không có buổi nào"
                  description="Đổi bộ lọc để xem các buổi khác."
                />
              ) : (
                <Card>
                  <CardContent className="overflow-x-auto p-0">
                    <table className="w-full min-w-[900px] text-left text-sm">
                      <thead className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Buổi tập</th>
                          <th className="px-4 py-3 font-semibold">PT</th>
                          <th className="px-4 py-3 font-semibold">Hội viên</th>
                          <th className="px-4 py-3 text-right font-semibold">Giá</th>
                          <th className="px-4 py-3 text-right font-semibold">Chiết khấu</th>
                          <th className="px-4 py-3 text-right font-semibold">PT nhận</th>
                          <th className="px-4 py-3 font-semibold">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {data?.data.map((s) => {
                          const meta = PT_SESSION_STATUS_META[s.status];
                          return (
                            <tr key={s.id}>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-chalk">{s.title}</p>
                                <p className="text-xs text-muted">{formatDateTime(s.startTime)}</p>
                              </td>
                              <td className="px-4 py-3 text-chalk">{s.trainer?.user.fullName}</td>
                              <td className="px-4 py-3">
                                <p className="text-chalk">{s.member?.fullName}</p>
                                <p className="font-mono text-xs text-muted">{s.member?.code}</p>
                              </td>
                              <td className="px-4 py-3 text-right text-chalk">
                                {formatCurrency(Number(s.price))}
                              </td>
                              <td className="px-4 py-3 text-right text-muted">
                                {formatCurrency(Number(s.platformFee))} ({Number(s.commissionRate)}
                                %)
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-neon">
                                {formatCurrency(Number(s.trainerEarning))}
                              </td>
                              <td className="space-y-1 px-4 py-3">
                                <Badge variant={meta.variant}>{meta.label}</Badge>
                                {s.status === 'PAID' && (
                                  <p className="text-[11px] text-muted">
                                    {s.payoutStatus === 'PAID_OUT'
                                      ? 'Đã chi trả PT'
                                      : 'Chưa chi trả PT'}
                                  </p>
                                )}
                                {s.paymentId && (
                                  <Link
                                    href={`/admin/payments/${s.paymentId}`}
                                    className="block text-[11px] font-semibold text-neon hover:underline"
                                  >
                                    Xem hoá đơn →
                                  </Link>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
