'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { beverageApi } from '@/services/beverage.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { AnimatedNumber, RevealFx, StaggerGroup, StaggerItem } from '@/components/ui/motion';
import { formatCurrency, cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CupSoda,
  Package,
  PackageX,
  Percent,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

/** Số ngày của biểu đồ doanh thu — khớp backend (30 ngày gần nhất). */
const CHART_DAYS = 30;
const CHART_HEIGHT = 220;

const QUICK_LINKS: { href: string; label: string; description: string; icon: typeof Package }[] = [
  {
    href: '/admin/beverages/products',
    label: 'Sản phẩm',
    description: 'Thêm sản phẩm, sửa giá & ngưỡng tồn',
    icon: Package,
  },
  {
    href: '/admin/beverages/imports',
    label: 'Phiếu nhập',
    description: 'Nhập kho từ nhà cung cấp',
    icon: ClipboardList,
  },
  {
    href: '/admin/beverages/pos',
    label: 'Bán tại quầy',
    description: 'Tạo đơn bán nhanh cho hội viên',
    icon: ShoppingCart,
  },
  {
    href: '/admin/beverages/stock',
    label: 'Tồn kho',
    description: 'Kiểm kê & điều chỉnh tồn',
    icon: Boxes,
  },
  {
    href: '/admin/reports/beverages',
    label: 'Báo cáo',
    description: 'Doanh thu, lãi gộp theo kỳ',
    icon: BarChart3,
  },
];

/** Rút gọn trục biểu đồ: 1500000 → "1,5 tr", 50000 → "50k". */
function compactVnd(value: number): string {
  if (value >= 1_000_000) {
    const tr = value / 1_000_000;
    return `${tr % 1 === 0 ? tr : tr.toFixed(1)} tr`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

type KpiTone = 'neon' | 'amber' | 'danger';

const TONE_ICON: Record<KpiTone, string> = {
  neon: 'border-neon/30 bg-neon/10 text-neon group-hover:bg-neon/20',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20',
  danger: 'border-danger/30 bg-danger/10 text-danger group-hover:bg-danger/20',
};

const TONE_VALUE: Record<KpiTone, string> = {
  neon: 'text-neon',
  amber: 'text-amber-400',
  danger: 'text-danger',
};

/**
 * Card KPI dạng hành chính — đồng bộ với dashboard admin chính:
 * label uppercase góc trái, icon tone phải, số lớn, footer chỉ số phụ.
 * `href` có thì cả card là link (hover lift + viền neon).
 */
function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'neon',
  valueTone = 'chalk',
  footer,
  href,
}: {
  label: string;
  value: React.ReactNode;
  icon: typeof Package;
  tone?: KpiTone;
  valueTone?: KpiTone | 'chalk';
  footer?: React.ReactNode;
  href?: string;
}) {
  const card = (
    <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:border-neon/40 group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.35)]">
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
            <div
              className={cn('shrink-0 rounded-xl border p-2 transition-colors', TONE_ICON[tone])}
            >
              <Icon className="size-4" />
            </div>
          </div>
          <h3
            className={cn(
              'mt-2 font-display text-2xl font-black tracking-tight sm:text-3xl',
              valueTone === 'chalk' ? 'text-chalk' : TONE_VALUE[valueTone],
            )}
          >
            {value}
          </h3>
        </div>
        {footer && (
          <div className="mt-4 border-t border-line/60 pt-3 text-xs text-muted">{footer}</div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {card}
      </Link>
    );
  }
  return <div className="group h-full">{card}</div>;
}

export default function BeveragesDashboardPage() {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['beverage-dashboard'],
    queryFn: () => beverageApi.dashboard(),
    retry: 0,
  });

  // Tạo đủ 30 ngày (backend chỉ trả ngày CÓ doanh thu → thiếu ngày sẽ làm
  // cột bị giãn khổng lồ như bản cũ). Ngày 0 đồng vẫn vẽ cột mờ.
  const series = useMemo(() => {
    const map = new Map<string, number>();
    (data?.dailyRevenue ?? []).forEach((d: { label: string; value: number }) =>
      map.set(d.label, d.value),
    );
    const out: { label: string; value: number }[] = [];
    const today = new Date();
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      out.push({ label: key, value: map.get(key) ?? 0 });
    }
    return out;
  }, [data?.dailyRevenue]);

  const chartStats = useMemo(() => {
    const total = series.reduce((sum, d) => sum + d.value, 0);
    const best = series.reduce((max, d) => (d.value > max.value ? d : max), series[0]);
    return { total, avg: total / CHART_DAYS, best };
  }, [series]);

  const maxValue = Math.max(1, ...series.map((d) => d.value));

  const revenue = data?.revenue ?? { today: 0, week: 0, month: 0 };
  const products = data?.products ?? {
    productCount: 0,
    stockQuantity: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };
  const grossProfit = data?.grossProfit ?? 0;
  const soldQuantity = data?.soldQuantity ?? 0;
  const topProducts: {
    productId: string;
    productCode: string;
    productName: string;
    soldQuantity: number;
    salesRevenue: number;
  }[] = data?.topProducts ?? [];

  const pctOfMonth = (value: number) =>
    revenue.month > 0 ? Math.min(100, Math.round((value / revenue.month) * 100)) : null;
  const marginPct =
    revenue.month > 0 ? Math.max(0, Math.round((grossProfit / revenue.month) * 100)) : null;
  const hasStockAlert = products.lowStockCount > 0 || products.outOfStockCount > 0;
  const topMaxRevenue = Math.max(1, ...topProducts.map((t) => t.salesRevenue));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }
  if (isError) return <ErrorState title="Không tải được dashboard nước uống" onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* =================1. BANNER ĐIỀU HÀNH ================= */}
      <RevealFx delay={0}>
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.35)] sm:p-7">
          <div
            className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-neon/5 blur-3xl"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-neon/10 px-3 py-0.5 text-xs font-semibold text-neon">
                  <CupSoda className="size-3.5" />
                  Kinh doanh tại quầy
                </span>
                <span className="text-xs font-medium text-muted">
                  {products.productCount} sản phẩm · {products.stockQuantity} đơn vị tồn
                </span>
              </div>
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-chalk sm:text-3xl lg:text-4xl">
                Dashboard Nước Uống
              </h1>
              <p className="max-w-2xl text-xs leading-relaxed text-muted sm:text-sm">
                Theo dõi doanh thu, lãi gộp và tồn kho theo thời gian thực — thao tác nhanh các
                nghiệp vụ quầy nước.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-10 border-line bg-ink text-xs font-semibold text-chalk hover:border-neon/40 hover:text-neon"
                title="Làm mới dữ liệu"
              >
                <RefreshCw
                  className={cn('mr-1.5 size-3.5', isFetching && 'animate-spin text-neon')}
                />
                Làm mới
              </Button>
              <Link href="/admin/beverages/pos">
                <Button
                  variant="primary"
                  size="md"
                  className="h-10 text-xs font-bold shadow-sm active:scale-[0.98]"
                >
                  <ShoppingCart className="mr-1.5 size-4" />
                  Bán tại quầy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </RevealFx>

      {/* ================= 2. KPI TÀI CHÍNH ================= */}
      <RevealFx delay={0}>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <KpiCard
              label="Doanh thu hôm nay"
              value={formatCurrency(revenue.today)}
              icon={Banknote}
              href="/admin/reports/beverages"
              footer={
                revenue.today > 0
                  ? `${pctOfMonth(revenue.today) ?? 0}% doanh thu tháng`
                  : 'Chưa có doanh thu hôm nay'
              }
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              label="Doanh thu tuần này"
              value={formatCurrency(revenue.week)}
              icon={CalendarDays}
              href="/admin/reports/beverages"
              footer={
                revenue.week > 0
                  ? `${pctOfMonth(revenue.week) ?? 0}% doanh thu tháng`
                  : 'Chưa có doanh thu tuần này'
              }
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              label="Doanh thu tháng này"
              value={formatCurrency(revenue.month)}
              icon={TrendingUp}
              href="/admin/reports/beverages"
              footer={
                <>
                  <AnimatedNumber value={soldQuantity} /> sản phẩm đã bán (tổng)
                </>
              }
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              label="Lợi nhuận gộp tháng"
              value={formatCurrency(grossProfit)}
              icon={Percent}
              href="/admin/reports/beverages"
              footer={
                marginPct !== null ? `Biên lợi nhuận gộp ${marginPct}%` : 'Trừ giá vốn & giảm giá'
              }
            />
          </StaggerItem>
        </StaggerGroup>
      </RevealFx>

      {/* ================= 3. BIỂU ĐỒ + SỨC KHỎE KHO ================= */}
      <RevealFx delay={0}>
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          {/* Biểu đồ 30 ngày */}
          <Card className="min-w-0">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="font-display text-lg font-bold uppercase tracking-tight">
                  Doanh thu 30 ngày gần nhất
                </CardTitle>
                <p className="mt-1 text-xs text-muted">Đơn đã thanh toán, tính theo ngày</p>
              </div>
              <Link
                href="/admin/reports/beverages"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-neon hover:underline"
              >
                Chi tiết <ArrowRight className="size-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {/* Tóm tắt nhanh dưới dạng 3 chỉ số */}
              <div className="mb-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-line bg-ink/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Tổng 30 ngày
                  </p>
                  <p className="mt-1 truncate font-display text-base font-bold text-neon">
                    {formatCurrency(chartStats.total)}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-ink/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Trung bình/ngày
                  </p>
                  <p className="mt-1 truncate font-display text-base font-bold text-chalk">
                    {formatCurrency(chartStats.avg)}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-ink/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Cao nhất
                  </p>
                  <p className="mt-1 truncate font-display text-base font-bold text-chalk">
                    {formatCurrency(chartStats.best?.value ?? 0)}
                  </p>
                  <p className="text-[10px] text-muted">ngày {chartStats.best?.label.slice(5)}</p>
                </div>
              </div>

              <div className="overflow-x-auto pt-7">
                <div className="flex min-w-[520px] gap-2">
                  {/* Trục Y */}
                  <div
                    className="flex w-12 shrink-0 flex-col justify-between text-right text-[10px] text-muted"
                    style={{ height: CHART_HEIGHT }}
                  >
                    <span>{compactVnd(maxValue)}</span>
                    <span>{compactVnd(maxValue / 2)}</span>
                    <span>0</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* Lưới + cột */}
                    <div className="relative" style={{ height: CHART_HEIGHT }}>
                      {[0, 50, 100].map((pct) => (
                        <div
                          key={pct}
                          className="absolute inset-x-0 border-t border-line/70"
                          style={{ bottom: `${pct}%` }}
                          aria-hidden
                        />
                      ))}
                      <div className="absolute inset-0 flex items-end gap-[3px]">
                        {series.map((d, i) => (
                          <div
                            key={d.label}
                            className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                            title={`${d.label}: ${formatCurrency(d.value)}`}
                          >
                            <div
                              className={cn(
                                'w-full rounded-t-sm transition-colors',
                                d.value > 0 ? 'bg-neon/70 group-hover:bg-neon' : 'bg-line/60',
                              )}
                              style={{
                                height: `${
                                  d.value > 0 ? Math.max(4, (d.value / maxValue) * 100) : 2
                                }%`,
                              }}
                            />
                            <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-neon shadow-[0_1px_2px_rgba(0,0,0,0.35)] group-hover:block">
                              {formatCurrency(d.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Trục X — cùng layout cột với biểu đồ phía trên.
                        Nhãn 10 ngày/lần + whitespace-nowrap (bỏ truncate): chữ
                        tràn nhẹ sang ô trống bên cạnh, không bị cắt. */}
                    <div className="mt-1.5 flex gap-[3px]">
                      {series.map((d, i) => (
                        <span
                          key={d.label}
                          className="min-w-0 flex-1 whitespace-nowrap text-center text-[9px] text-muted"
                        >
                          {i % 10 === 0 ? d.label.slice(5) : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sức khoẻ kho */}
          <Card className="min-w-0">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="font-display text-lg font-bold uppercase tracking-tight">
                  Tình trạng kho
                </CardTitle>
                <p className="mt-1 text-xs text-muted">Cảnh báo tồn theo ngưỡng sản phẩm</p>
              </div>
              <Link
                href="/admin/beverages/stock"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-neon hover:underline"
              >
                Tồn kho <ArrowRight className="size-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <StockRow
                icon={Package}
                label="Sản phẩm kinh doanh"
                value={`${products.productCount} mặt hàng`}
              />
              <StockRow
                icon={Boxes}
                label="Tồn kho hiện tại"
                value={`${products.stockQuantity} đơn vị`}
              />
              <StockRow
                icon={AlertTriangle}
                label="Sắp hết hàng"
                value={`${products.lowStockCount} sản phẩm`}
                tone={products.lowStockCount > 0 ? 'amber' : 'neon'}
              />
              <StockRow
                icon={PackageX}
                label="Đã hết hàng"
                value={`${products.outOfStockCount} sản phẩm`}
                tone={products.outOfStockCount > 0 ? 'danger' : 'neon'}
              />
              <StockRow
                icon={ShoppingCart}
                label="Đã bán (tổng)"
                value={`${soldQuantity} sản phẩm`}
              />

              <div
                className={cn(
                  'mt-4 rounded-xl border p-3',
                  hasStockAlert
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-neon/30 bg-neon/10',
                )}
              >
                <p
                  className={cn(
                    'text-xs font-bold',
                    hasStockAlert ? 'text-amber-400' : 'text-neon',
                  )}
                >
                  {hasStockAlert ? 'Cần nhập thêm hàng' : 'Kho hàng ổn định'}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {hasStockAlert
                    ? `${products.lowStockCount} sản phẩm sắp hết, ${products.outOfStockCount} sản phẩm đã hết.`
                    : 'Chưa có sản phẩm nào chạm ngưỡng tồn tối thiểu.'}
                </p>
                {hasStockAlert && (
                  <Link href="/admin/beverages/imports">
                    <Button variant="outline" size="sm" className="mt-2 h-8 text-xs">
                      <ClipboardList className="mr-1.5 size-3.5" />
                      Nhập kho
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </RevealFx>

      {/* ================= 4. BÁN CHẠY + TRUY CẬP NHANH ================= */}
      <RevealFx delay={0}>
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          {/* Top sản phẩm */}
          <Card className="min-w-0">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="font-display text-lg font-bold uppercase tracking-tight">
                  Sản phẩm bán chạy
                </CardTitle>
                <p className="mt-1 text-xs text-muted">Top 5 theo số lượng đã bán</p>
              </div>
              <Link
                href="/admin/reports/beverages"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-neon hover:underline"
              >
                Báo cáo <ArrowRight className="size-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {topProducts.length ? (
                <div className="space-y-4">
                  {topProducts.map((item, index) => (
                    <div key={item.productId} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="font-display text-lg font-bold text-neon">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-chalk">{item.productName}</p>
                            <p className="text-[11px] text-muted">{item.productCode}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-chalk">{item.soldQuantity} sp</p>
                          <p className="text-xs text-muted">{formatCurrency(item.salesRevenue)}</p>
                        </div>
                      </div>
                      {/* Thanh tỉ trọng so với sản phẩm dẫn đầu */}
                      <div className="h-1.5 overflow-hidden rounded-full bg-line/60">
                        <div
                          className="h-full rounded-full bg-neon transition-all"
                          style={{
                            width: `${Math.max(4, (item.salesRevenue / topMaxRevenue) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title="Chưa có sản phẩm bán ra"
                  description="Doanh thu đã thanh toán sẽ hiển thị tại đây."
                />
              )}
            </CardContent>
          </Card>

          {/* Truy cập nhanh */}
          <Card className="min-w-0">
            <CardHeader className="space-y-0">
              <CardTitle className="font-display text-lg font-bold uppercase tracking-tight">
                Truy cập nhanh
              </CardTitle>
              <p className="mt-1 text-xs text-muted">Các nghiệp vụ quầy nước</p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {QUICK_LINKS.map(({ href, label, description, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-ink/40 p-3 transition-colors hover:border-neon/40"
                >
                  <div className="shrink-0 rounded-lg border border-neon/25 bg-neon/10 p-2 text-neon transition-colors group-hover:bg-neon/20">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-chalk">{label}</p>
                    <p className="truncate text-xs text-muted">{description}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted transition-colors group-hover:text-neon" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </RevealFx>
    </div>
  );
}

/** Một dòng chỉ số trong card "Tình trạng kho". */
function StockRow({
  icon: Icon,
  label,
  value,
  tone = 'chalk',
}: {
  icon: typeof Package;
  label: string;
  value: string;
  tone?: 'chalk' | 'amber' | 'danger' | 'neon';
}) {
  const valueClass = {
    chalk: 'text-chalk',
    amber: 'text-amber-400',
    danger: 'text-danger',
    neon: 'text-neon',
  }[tone];
  const iconClass = {
    chalk: 'border-line bg-ink/60 text-muted',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    danger: 'border-danger/30 bg-danger/10 text-danger',
    neon: 'border-neon/25 bg-neon/10 text-neon',
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-ink/30 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={cn('shrink-0 rounded-lg border p-1.5', iconClass)}>
          <Icon className="size-3.5" />
        </div>
        <span className="truncate text-xs text-muted">{label}</span>
      </div>
      <span className={cn('shrink-0 text-sm font-bold', valueClass)}>{value}</span>
    </div>
  );
}
