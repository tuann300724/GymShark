'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { beverageApi } from '@/services/beverage.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  CupSoda,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

const QUICK_LINKS = [
  { href: '/admin/beverages/products', label: 'Sản phẩm', icon: Package },
  { href: '/admin/beverages/imports', label: 'Phiếu nhập', icon: ClipboardList },
  { href: '/admin/beverages/pos', label: 'Bán tại quầy', icon: ShoppingCart },
  { href: '/admin/beverages/stock', label: 'Tồn kho', icon: Boxes },
  { href: '/admin/reports/beverages', label: 'Báo cáo', icon: BarChart3 },
];

export default function BeveragesDashboardPage() {
  const [branchId, setBranchId] = useState('');
  const { data: options } = useQuery({
    queryKey: ['beverage-options'],
    queryFn: beverageApi.options,
    retry: 0,
  });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['beverage-dashboard', branchId],
    queryFn: () => beverageApi.dashboard({ branchId: branchId || undefined }),
    retry: 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }
  if (isError) return <ErrorState title="Không tải được dashboard nước uống" onRetry={refetch} />;

  const stats = [
    { title: 'Sản phẩm kinh doanh', value: data?.products.productCount ?? 0, icon: CupSoda },
    { title: 'Tồn kho hiện tại', value: data?.products.stockQuantity ?? 0, icon: Boxes },
    { title: 'Sắp hết hàng', value: data?.products.lowStockCount ?? 0, icon: TrendingDown },
    { title: 'Đã hết hàng', value: data?.products.outOfStockCount ?? 0, icon: Package },
    { title: 'Đã bán', value: data?.soldQuantity ?? 0, icon: ShoppingCart },
    {
      title: 'Doanh thu hôm nay',
      value: formatCurrency(data?.revenue.today ?? 0),
      icon: TrendingUp,
    },
    {
      title: 'Doanh thu tuần này',
      value: formatCurrency(data?.revenue.week ?? 0),
      icon: TrendingUp,
    },
    {
      title: 'Doanh thu tháng này',
      value: formatCurrency(data?.revenue.month ?? 0),
      icon: BarChart3,
    },
  ];
  const chart = data?.dailyRevenue ?? [];
  const maxValue = Math.max(1, ...chart.map((item: { value: number }) => item.value));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta-label">Kinh doanh tại quầy</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-chalk sm:text-4xl">
            Nước uống
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button variant="outline" size="sm">
                <Icon className="size-4" />
                {label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-xs">
        <Select
          aria-label="Lọc chi nhánh dashboard"
          value={branchId}
          onChange={(event) => setBranchId(event.target.value)}
          options={[
            { value: '', label: 'Tất cả chi nhánh' },
            ...(options?.branches ?? []).map((branch) => ({
              value: branch.id,
              label: branch.name,
            })),
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, icon: Icon }, index) => (
          <Card key={title}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${index === 2 || index === 3 ? 'border-danger/25 bg-danger/10 text-danger' : 'border-neon/25 bg-neon/10 text-neon'}`}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted">{title}</p>
                <p className="mt-1 truncate font-display text-xl font-bold text-chalk">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu 30 ngày gần nhất</CardTitle>
          </CardHeader>
          <CardContent>
            {chart.length ? (
              <div className="overflow-x-auto">
                <div
                  className="flex min-w-[560px] items-end gap-2 border-b border-line pb-2"
                  style={{ height: 240 }}
                >
                  {chart.map((item: { label: string; value: number }) => (
                    <div
                      key={item.label}
                      className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                      title={`${item.label}: ${formatCurrency(item.value)}`}
                    >
                      <div
                        className="w-full rounded-t bg-neon/70 transition-colors group-hover:bg-neon"
                        style={{
                          height: `${item.value > 0 ? Math.max(3, (item.value / maxValue) * 90) : 1}%`,
                        }}
                      />
                      <span className="w-full truncate text-center text-[9px] text-muted">
                        {item.label.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Chưa có doanh thu"
                description="Doanh thu đã thanh toán sẽ hiển thị tại đây."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lợi nhuận gộp ước tính tháng này</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-extrabold text-neon">
              {formatCurrency(data?.grossProfit ?? 0)}
            </p>
            <p className="mt-2 text-sm text-muted">
              Doanh thu đã thanh toán trừ giá vốn và giảm giá.
            </p>
            <div className="mt-6 border-t border-line pt-4">
              <h3 className="mb-3 text-sm font-bold text-chalk">Sản phẩm bán chạy</h3>
              {data?.topProducts?.length ? (
                <div className="space-y-3">
                  {data.topProducts.map(
                    (
                      item: {
                        productId: string;
                        productName: string;
                        soldQuantity: number;
                        salesRevenue: number;
                      },
                      index: number,
                    ) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="font-display text-lg font-bold text-neon">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="truncate text-chalk">{item.productName}</span>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-chalk">{item.soldQuantity} sp</p>
                          <p className="text-xs text-muted">{formatCurrency(item.salesRevenue)}</p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">Chưa có sản phẩm bán ra.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
