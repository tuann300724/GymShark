'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, BarChart3, Droplets, Package, Receipt, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { beverageApi } from '@/services/beverage.service';

export function BeverageStatisticsTab() {
  const reportQuery = useQuery({
    queryKey: ['beverage-report', 'statistics-tab'],
    queryFn: () => beverageApi.report({ groupBy: 'month' }),
    retry: 1,
  });
  const salesQuery = useQuery({
    queryKey: ['beverage-sales', 'statistics-tab'],
    queryFn: () => beverageApi.sales({ limit: 20 }),
    retry: 1,
  });

  if (reportQuery.isLoading || salesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (reportQuery.isError || salesQuery.isError || !reportQuery.data || !salesQuery.data) {
    return (
      <ErrorState
        title="Không tải được thống kê nước uống"
        description="Hãy thử tải lại số liệu và hóa đơn bán nước."
        onRetry={() => {
          void reportQuery.refetch();
          void salesQuery.refetch();
        }}
      />
    );
  }

  const { summary, topProducts, byStaff } = reportQuery.data;
  const sales = salesQuery.data;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Doanh thu nước"
          value={formatCurrency(summary.salesRevenue)}
          subtitle={`${summary.saleCount} hóa đơn đã thanh toán`}
          icon={TrendingUp}
          colorScheme="neon"
        />
        <StatCard
          title="Tiền nhập hàng"
          value={formatCurrency(summary.importCost)}
          subtitle={`${summary.importCount} phiếu đã nhận`}
          icon={Package}
          colorScheme="blue"
        />
        <StatCard
          title="Lợi nhuận gộp ước tính"
          value={formatCurrency(summary.grossProfit)}
          icon={BarChart3}
          colorScheme="amber"
        />
        <StatCard
          title="Số lượng đã bán"
          value={summary.soldQuantity}
          subtitle={`${summary.importedQuantity} sản phẩm đã nhập`}
          icon={Droplets}
          colorScheme="purple"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-y border-line text-xs uppercase text-muted">
                    <tr>
                      {['Sản phẩm', 'Số lượng', 'Doanh thu'].map((heading) => (
                        <th key={heading} className="px-4 py-3">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {topProducts.slice(0, 5).map((product) => (
                      <tr key={product.productId}>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-chalk">{product.productName}</span>
                          <span className="ml-2 text-xs text-muted">{product.productCode}</span>
                        </td>
                        <td className="px-4 py-3 text-muted">{product.soldQuantity}</td>
                        <td className="px-4 py-3 font-semibold text-neon">
                          {formatCurrency(product.salesRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="Chưa có sản phẩm"
                description="Sản phẩm bán ra sẽ được thống kê tại đây."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo nhân viên</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {byStaff.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-left text-sm">
                  <thead className="border-y border-line text-xs uppercase text-muted">
                    <tr>
                      {['Nhân viên', 'Hóa đơn', 'Doanh thu'].map((heading) => (
                        <th key={heading} className="px-4 py-3">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {byStaff.map((staff) => (
                      <tr key={staff.id}>
                        <td className="px-4 py-3 font-semibold text-chalk">{staff.label}</td>
                        <td className="px-4 py-3 text-muted">{staff.saleCount}</td>
                        <td className="px-4 py-3 font-semibold text-neon">
                          {formatCurrency(staff.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Chưa có doanh thu"
                description="Doanh thu sẽ được tổng hợp theo nhân viên bán."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Hóa đơn nước gần đây</CardTitle>
          <Link
            href="/admin/beverages/pos"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-neon hover:underline"
          >
            Xem quầy bán <ArrowUpRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {sales.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-y border-line text-xs uppercase text-muted">
                  <tr>
                    {[
                      'Mã hóa đơn',
                      'Hội viên',
                      'Nhân viên bán',
                      'Chi nhánh',
                      'Thời gian',
                      'Thanh toán',
                      'Thành tiền',
                    ].map((heading) => (
                      <th key={heading} className="px-4 py-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sales.map((sale) => (
                    <tr key={sale.saleId}>
                      <td className="px-4 py-3 font-semibold text-chalk">{sale.saleCode}</td>
                      <td className="px-4 py-3 text-chalk">{sale.memberName}</td>
                      <td className="px-4 py-3 font-medium text-chalk">
                        {sale.staffName || 'Không rõ nhân viên'}
                      </td>
                      <td className="px-4 py-3 text-muted">{sale.branchName}</td>
                      <td className="px-4 py-3 text-muted">{formatDateTime(sale.saleDate)}</td>
                      <td className="px-4 py-3 text-muted">
                        {sale.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-neon">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title="Chưa có hóa đơn nước"
              description="Hóa đơn bán hàng sẽ hiển thị tên nhân viên thực hiện."
            />
          )}
        </CardContent>
      </Card>

      <div>
        <Link
          href="/admin/reports/beverages"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-chalk transition-colors hover:border-neon/60 hover:text-neon"
        >
          Xem báo cáo nước uống chi tiết <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
