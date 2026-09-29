'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '@/services/payment.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PAYMENT_METHOD_LABEL } from '@/lib/status';
import {
  BarChart3,
  TrendingUp,
  CalendarDays,
  CalendarRange,
  Wallet,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

const METHOD_OPTIONS = [
  { value: '', label: 'Tất cả phương thức' },
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
  { value: 'MOMO', label: 'Ví MoMo' },
  { value: 'VNPAY', label: 'VNPay' },
];

function compactCurrency(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} tỷ`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

interface BarDatum {
  label: string;
  value: number;
}

/** Biểu đồ cột tùy biến (không dùng recharts) — đồng bộ dark/neon */
function BarChart({ data, height = 180 }: { data: BarDatum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="py-8 text-center text-xs text-muted">Chưa có dữ liệu trong khoảng này.</p>;
  }
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {data.map((d, i) => {
          const h = d.value > 0 ? Math.max(10, Math.round((d.value / max) * 100)) : 3;
          return (
            <div
              key={`${d.label}-${i}`}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end"
              title={`${d.label}: ${formatCurrency(d.value)}`}
            >
              <span className="mb-1 text-[9px] font-mono font-semibold text-chalk opacity-0 transition-opacity group-hover:opacity-100">
                {compactCurrency(d.value)}
              </span>
              <div
                className={`w-full rounded-t-sm transition-all ${
                  d.value > 0 ? 'bg-neon/70 group-hover:bg-neon' : 'bg-line/50'
                }`}
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[3px]">
        {data.map((d, i) => (
          <span
            key={`${d.label}-x-${i}`}
            className="min-w-0 flex-1 truncate text-center text-[9px] text-muted"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function MethodBars({ data }: { data: { method: string; revenue: number; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  if (data.length === 0) {
    return <p className="py-6 text-center text-xs text-muted">Chưa có giao dịch thanh toán.</p>;
  }
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.method}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-chalk">
              {PAYMENT_METHOD_LABEL[d.method] || d.method}
              <span className="ml-2 text-[10px] text-muted">({d.count} giao dịch)</span>
            </span>
            <span className="font-mono font-bold text-neon">{formatCurrency(d.revenue)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-ink">
            <div
              className="h-full rounded-full bg-neon/80 transition-all"
              style={{ width: `${Math.max(2, (d.revenue / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RevenueReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [method, setMethod] = useState('');
  const [applied, setApplied] = useState({ from: '', to: '', method: '' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['revenue-report', applied],
    queryFn: () =>
      paymentApi.getRevenueReport({
        from: applied.from || undefined,
        to: applied.to || undefined,
        method: applied.method || undefined,
      }),
  });

  const applyFilters = () => {
    setApplied({ from, to, method });
  };

  const resetFilters = () => {
    setFrom('');
    setTo('');
    setMethod('');
    setApplied({ from: '', to: '', method: '' });
  };

  const dayData: BarDatum[] = useMemo(
    () =>
      (data?.byDay || []).map((d) => ({
        label: d.date.slice(5).replace('-', '/'),
        value: Number(d.revenue),
      })),
    [data],
  );

  const monthData: BarDatum[] = useMemo(
    () =>
      (data?.byMonth || []).map((d) => ({
        label: d.month,
        value: Number(d.revenue),
      })),
    [data],
  );

  const s = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
          <BarChart3 className="size-6 text-neon" />
          Báo Cáo Doanh Thu (Revenue)
        </h1>
        <p className="text-xs text-muted mt-1">
          Chỉ tính các giao dịch <b className="text-neon">PAID</b>; hóa đơn hoàn tiền (REFUNDED)
          hạch toán riêng và không tính vào doanh thu thực nhận.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          title="Hôm nay"
          value={formatCurrency(s?.revenueToday || 0)}
          subtitle="Doanh thu PAID hôm nay"
          icon={TrendingUp}
          colorScheme="neon"
        />
        <StatCard
          title="Tuần này"
          value={formatCurrency(s?.revenueThisWeek || 0)}
          subtitle="7 ngày gần nhất"
          icon={CalendarDays}
          colorScheme="blue"
        />
        <StatCard
          title="Tháng này"
          value={formatCurrency(s?.revenueThisMonth || 0)}
          subtitle="Thu trong tháng hiện tại"
          icon={CalendarRange}
          colorScheme="amber"
        />
        <StatCard
          title="Năm này"
          value={formatCurrency(s?.revenueThisYear || 0)}
          subtitle="Từ đầu năm"
          icon={Wallet}
          colorScheme="purple"
        />
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(s?.totalRevenue || 0)}
          subtitle={`${s?.totalPaidCount ?? 0} hóa đơn đã thu`}
          icon={CheckCircle2}
          colorScheme="neon"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Hoàn tiền (tháng này)"
          value={formatCurrency(s?.refundedThisMonth || 0)}
          subtitle={`${s?.refundedThisMonthCount ?? 0} giao dịch REFUNDED`}
          icon={RotateCcw}
          colorScheme="rose"
        />
        <StatCard
          title="Đang chờ xác nhận"
          value={s?.pendingCount ?? 0}
          subtitle="Cần lễ tân xử lý"
          icon={RefreshCw}
          colorScheme="amber"
        />
        <StatCard
          title="Thất bại / Hủy"
          value={(s?.failedCount ?? 0) + (s?.cancelledCount ?? 0)}
          subtitle={`Failed ${s?.failedCount ?? 0} · Cancelled ${s?.cancelledCount ?? 0}`}
          icon={RefreshCw}
          colorScheme="rose"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="rev-from-date"
                className="mb-1.5 block text-xs font-semibold text-muted"
              >
                Từ ngày
              </label>
              <Input
                id="rev-from-date"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label
                htmlFor="rev-to-date"
                className="mb-1.5 block text-xs font-semibold text-muted"
              >
                Đến ngày
              </label>
              <Input
                id="rev-to-date"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="w-48">
              <Select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                options={METHOD_OPTIONS}
                label="Phương thức"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={applyFilters}>
                Áp dụng
              </Button>
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Đặt lại
              </Button>
            </div>
            <span className="ml-auto text-[11px] text-muted">
              Biểu đồ theo ngày mặc định hiển thị 30 ngày gần nhất (hoặc theo khoảng ngày đã chọn).
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[180px] w-full" /> : <BarChart data={dayData} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Doanh thu theo tháng (12 tháng gần nhất)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[180px] w-full" /> : <BarChart data={monthData} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Theo phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <MethodBars data={data?.byMethod || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Theo gói tập</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (data?.byPackage || []).length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">Chưa có dữ liệu.</p>
            ) : (
              <div className="space-y-3">
                {data!.byPackage.map((p) => (
                  <div
                    key={p.packageId}
                    className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-chalk">{p.packageName}</p>
                      <p className="text-[10px] text-muted">{p.count} giao dịch</p>
                    </div>
                    <span className="font-mono font-bold text-neon">
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Giao dịch gần đây</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="py-10 text-center">
              <p className="text-xs text-danger">Không tải được báo cáo.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          ) : (data?.recentPayments || []).length === 0 ? (
            <p className="py-12 text-center text-xs text-muted">Chưa có giao dịch nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-line bg-ink text-left text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Mã hóa đơn</th>
                    <th className="px-4 py-3">Hội viên</th>
                    <th className="px-4 py-3">Gói tập</th>
                    <th className="px-4 py-3">Phương thức</th>
                    <th className="px-4 py-3">Ngày thanh toán</th>
                    <th className="px-4 py-3 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(data?.recentPayments || []).map((p) => (
                    <tr key={p.id} className="hover:bg-line/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-neon">{p.code}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-chalk">{p.member.fullName}</p>
                        <p className="text-[10px] text-muted">{p.member.code}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">{p.membership?.package?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {PAYMENT_METHOD_LABEL[p.method] || p.method}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted">
                        {p.paidAt ? formatDate(p.paidAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-neon">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
