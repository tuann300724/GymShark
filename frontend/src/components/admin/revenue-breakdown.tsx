'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Building2, HandCoins, PiggyBank, Scale, Wallet } from 'lucide-react';
import { paymentApi } from '@/services/payment.service';
import type { PayoutBank, RevenueBreakdown as Breakdown } from '@/services/types';
import { Button } from '@/components/ui/button';
import { PayoutDialog, type PayoutTarget } from '@/components/admin/payout-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { GYM_TIERS } from '@/lib/package-options';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const pct = (v: number) => `${(v * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;

const SOURCE_LABEL: Record<keyof Breakdown['sources'], string> = {
  membership: 'Bán gói tập',
  ptSession: 'Buổi tập PT',
  other: 'Khoản thu khác',
};

function rangeLabel(from?: string, to?: string) {
  if (!from && !to) return 'Toàn thời gian';
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  return from ? `Từ ${formatDate(from)}` : `Đến ${formatDate(to!)}`;
}

/** Thanh tỷ trọng: tổng thu về chia thành chi đối tác / chi PT / lãi giữ lại */
function SplitBar({ totals }: { totals: Breakdown['totals'] }) {
  const gross = Math.max(totals.grossRevenue, 1);
  const parts = [
    { key: 'partner', label: 'Chi đối tác', value: totals.partnerCommission, cls: 'bg-amber-400' },
    { key: 'pt', label: 'Chi PT', value: totals.trainerPayout, cls: 'bg-sky-400' },
    { key: 'profit', label: 'Lãi giữ lại', value: Math.max(totals.netProfit, 0), cls: 'bg-neon' },
  ];
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-ink">
        {parts.map((p) =>
          p.value > 0 ? (
            <div
              key={p.key}
              className={cn('h-full', p.cls)}
              style={{ width: `${(p.value / gross) * 100}%` }}
              title={`${p.label}: ${formatCurrency(p.value)}`}
            />
          ) : null,
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        {parts.map((p) => (
          <span key={p.key} className="inline-flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', p.cls)} />
            {p.label} · <b className="font-mono text-chalk">{pct(p.value / gross)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function tierLabel(tier: string | null) {
  return GYM_TIERS.find((t) => t.value === tier)?.shortLabel ?? 'Chưa xếp hạng';
}

/** Nút mở dialog chuyển tiền; chấm cảnh báo khi người nhận chưa khai STK/QR */
function PayButton({ bank, onClick }: { bank: PayoutBank | null; onClick: () => void }) {
  const ready = Boolean(bank?.bankAccountNumber || bank?.bankQrImage);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      title={ready ? 'Xem STK / QR để chuyển khoản' : 'Chưa cập nhật tài khoản nhận tiền'}
    >
      <Banknote className="size-3.5" />
      Thanh toán
      {!ready && <span className="size-1.5 rounded-full bg-amber-400" aria-hidden />}
    </Button>
  );
}

export function RevenueBreakdown({ from, to }: { from?: string; to?: string }) {
  const [payee, setPayee] = useState<PayoutTarget | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['revenue-breakdown', from ?? '', to ?? ''],
    queryFn: () => paymentApi.getRevenueBreakdown({ from, to }),
  });

  if (isError) {
    return (
      <ErrorState
        title="Không tải được phân bổ doanh thu"
        description="Không lấy được số liệu thu/chi từ Backend. Vui lòng thử lại."
        onRetry={() => refetch()}
      />
    );
  }

  const t = data?.totals;

  return (
    <section className="space-y-4" aria-labelledby="revenue-breakdown-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="revenue-breakdown-title"
            className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-tight text-chalk"
          >
            <Scale className="size-5 text-neon" />
            Phân bổ doanh thu &amp; lợi nhuận
          </h2>
          <p className="mt-1 text-xs text-muted">
            Tiền thu về từ hội viên Gym Master, phần chia cho đối tác Gym Cộng đồng và PT, phần còn
            lại là lãi.
          </p>
        </div>
        <Badge variant="outline">{rangeLabel(from, to)}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Tổng thu về"
          value={isLoading ? '…' : formatCurrency(t?.grossRevenue ?? 0)}
          subtitle="Gói tập + buổi PT (đã trừ hoàn tiền)"
          icon={Wallet}
          colorScheme="blue"
        />
        <StatCard
          title="Chi đối tác"
          value={isLoading ? '…' : formatCurrency(t?.partnerCommission ?? 0)}
          subtitle={`Còn nợ đối tác ${formatCurrency(t?.partnerUnpaid ?? 0)}`}
          icon={Building2}
          colorScheme="amber"
        />
        <StatCard
          title="Chi trả PT"
          value={isLoading ? '…' : formatCurrency(t?.trainerPayout ?? 0)}
          subtitle={`Còn nợ PT ${formatCurrency(t?.trainerUnpaid ?? 0)}`}
          icon={HandCoins}
          colorScheme="purple"
        />
        <StatCard
          title="Lãi ròng"
          value={isLoading ? '…' : formatCurrency(t?.netProfit ?? 0)}
          subtitle={`Tỷ suất lãi ${pct(t?.margin ?? 0)}`}
          icon={PiggyBank}
          colorScheme={(t?.netProfit ?? 0) < 0 ? 'rose' : 'neon'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dòng tiền: thu về → chia → lãi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading || !t ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <SplitBar totals={t} />
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Tổng thu về</dt>
                    <dd className="font-mono font-semibold text-chalk">
                      {formatCurrency(t.grossRevenue)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">− Hoa hồng đối tác Gym Cộng đồng</dt>
                    <dd className="font-mono text-chalk">{formatCurrency(t.partnerCommission)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">− Phần PT được nhận</dt>
                    <dd className="font-mono text-chalk">{formatCurrency(t.trainerPayout)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2">
                    <dt className="font-semibold text-chalk">= Lãi ròng Gym Master</dt>
                    <dd
                      className={cn(
                        'font-mono font-bold',
                        t.netProfit < 0 ? 'text-danger' : 'text-neon',
                      )}
                    >
                      {formatCurrency(t.netProfit)}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Thu về theo nguồn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading || !data ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              (Object.keys(SOURCE_LABEL) as (keyof Breakdown['sources'])[]).map((key) => {
                const s = data.sources[key];
                const share =
                  data.totals.grossRevenue > 0 ? s.revenue / data.totals.grossRevenue : 0;
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-chalk">
                        {SOURCE_LABEL[key]}
                        <span className="ml-2 text-[10px] text-muted">({s.count} giao dịch)</span>
                      </span>
                      <span className="font-mono font-bold text-chalk">
                        {formatCurrency(s.revenue)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink">
                      <div
                        className="h-full rounded-full bg-neon/70"
                        style={{ width: `${share * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Đối tác Gym Cộng đồng */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Theo đối tác Gym Cộng đồng</CardTitle>
          <p className="text-[11px] text-muted">
            Mỗi lượt hội viên Gym Master tập tại phòng đối tác được quy ra giá trị 1 lượt của gói;
            đối tác nhận phần hoa hồng, Gym Master giữ phần còn lại.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="m-4 h-24" />
          ) : !data?.partners.length ? (
            <EmptyState
              className="m-3"
              icon={Building2}
              title="Chưa có lượt tập tại đối tác"
              description="Khoảng thời gian này chưa có hội viên nào tập tại phòng Gym Cộng đồng."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-line bg-ink text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Phòng gym</th>
                    <th className="px-4 py-3 text-right font-semibold">Lượt tập</th>
                    <th className="px-4 py-3 text-right font-semibold">Giá trị lượt</th>
                    <th className="px-4 py-3 text-right font-semibold">Hoa hồng</th>
                    <th className="px-4 py-3 text-right font-semibold">Chi đối tác</th>
                    <th className="px-4 py-3 text-right font-semibold">Chưa chi</th>
                    <th className="px-4 py-3 text-right font-semibold">Gym Master giữ</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.partners.map((p) => (
                    <tr key={p.partnerId} className="transition-colors hover:bg-line/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-chalk">{p.businessName}</p>
                        <p className="text-[10px] text-muted">{tierLabel(p.gymTier)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-chalk">{p.visits}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted">
                        {formatCurrency(p.visitValue)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted">
                        {pct(p.commissionRate)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-400">
                        {formatCurrency(p.commission)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right font-mono',
                          p.unpaid > 0 ? 'text-amber-400' : 'text-muted',
                        )}
                      >
                        {formatCurrency(p.unpaid)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-neon">
                        {formatCurrency(p.retained)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <PayButton
                          bank={p.bank}
                          onClick={() =>
                            setPayee({
                              kind: 'partner',
                              id: p.partnerId,
                              name: p.businessName,
                              amount: p.unpaid,
                              bank: p.bank,
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Theo huấn luyện viên (PT)</CardTitle>
          <p className="text-[11px] text-muted">
            Hội viên trả tiền buổi PT cho Gym Master; Gym Master giữ phần chiết khấu, phần còn lại
            chi trả cho PT.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="m-4 h-24" />
          ) : !data?.trainers.length ? (
            <EmptyState
              className="m-3"
              icon={HandCoins}
              title="Chưa có buổi PT đã thanh toán"
              description="Khoảng thời gian này chưa có buổi PT nào được thanh toán."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead className="border-b border-line bg-ink text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Huấn luyện viên</th>
                    <th className="px-4 py-3 text-right font-semibold">Buổi</th>
                    <th className="px-4 py-3 text-right font-semibold">Doanh thu</th>
                    <th className="px-4 py-3 text-right font-semibold">Chiết khấu</th>
                    <th className="px-4 py-3 text-right font-semibold">PT nhận</th>
                    <th className="px-4 py-3 text-right font-semibold">Chưa chi</th>
                    <th className="px-4 py-3 text-right font-semibold">Gym Master giữ</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.trainers.map((r) => (
                    <tr key={r.trainerId} className="transition-colors hover:bg-line/30">
                      <td className="px-4 py-3 font-semibold text-chalk">{r.fullName}</td>
                      <td className="px-4 py-3 text-right font-mono text-chalk">{r.sessions}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted">
                        {formatCurrency(r.gross)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted">
                        {pct(r.commissionRate / 100)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sky-400">
                        {formatCurrency(r.trainerEarning)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right font-mono',
                          r.unpaid > 0 ? 'text-amber-400' : 'text-muted',
                        )}
                      >
                        {formatCurrency(r.unpaid)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-neon">
                        {formatCurrency(r.platformFee)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <PayButton
                          bank={r.bank}
                          onClick={() =>
                            setPayee({
                              kind: 'trainer',
                              id: r.trainerId,
                              name: r.fullName,
                              amount: r.unpaid,
                              bank: r.bank,
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <PayoutDialog target={payee} from={from} to={to} onClose={() => setPayee(null)} />
    </section>
  );
}
