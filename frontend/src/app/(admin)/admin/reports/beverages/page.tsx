'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { beverageApi } from '@/services/beverage.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, Download, Package, TrendingUp } from 'lucide-react';

type GroupBy = 'day' | 'week' | 'month' | 'year';

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export default function BeverageReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [applied, setApplied] = useState<{
    from: string;
    to: string;
    groupBy: GroupBy;
  }>({ from: '', to: '', groupBy: 'day' });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['beverage-report', applied],
    queryFn: () =>
      beverageApi.report({
        from: applied.from || undefined,
        to: applied.to || undefined,
        groupBy: applied.groupBy,
      }),
    retry: 0,
  });
  const apply = () => {
    if (from && to && from > to) return;
    setApplied({ from, to, groupBy });
  };
  const exportExcel = () => {
    if (!data) return;
    const rows: unknown[][] = [
      ['BÁO CÁO KINH DOANH NƯỚC UỐNG'],
      ['Từ ngày', applied.from || 'Tất cả', 'Đến ngày', applied.to || 'Hiện tại'],
      [
        'Doanh thu',
        data.summary.salesRevenue,
        'Tiền nhập',
        data.summary.importCost,
        'Lợi nhuận gộp ước tính',
        data.summary.grossProfit,
      ],
      ['Số lượng bán', data.summary.soldQuantity, 'Số lượng nhập', data.summary.importedQuantity],
      [],
      ['DOANH THU THEO THỜI GIAN'],
      ['Thời gian', 'Doanh thu'],
      ...data.revenue.map((item: { label: string; revenue: number }) => [item.label, item.revenue]),
      [],
      ['SẢN PHẨM BÁN CHẠY'],
      ['Mã', 'Sản phẩm', 'Số lượng', 'Doanh thu', 'Lợi nhuận gộp'],
      ...data.topProducts.map((item: any) => [
        item.productCode,
        item.productName,
        item.soldQuantity,
        item.salesRevenue,
        item.grossProfit,
      ]),
      [],
      ['DOANH THU THEO NHÂN VIÊN'],
      ['Nhân viên', 'Số hóa đơn', 'Doanh thu'],
      ...data.byStaff.map((item: any) => [item.label, item.saleCount, item.revenue]),
      [],
      ['DOANH THU THEO CA'],
      ['Ca làm', 'Số hóa đơn', 'Doanh thu'],
      ...data.byShift.map((item: any) => [item.label, item.saleCount, item.revenue]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bao-cao-nuoc-uong-${applied.from || 'tat-ca'}-${applied.to || 'hien-tai'}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (isLoading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-28" key={i} />
          ))}
        </div>
      </div>
    );
  if (isError) return <ErrorState title="Không tải được báo cáo nước uống" onRetry={refetch} />;

  const summary = data?.summary;
  const max = Math.max(
    1,
    ...(data?.revenue ?? []).map((item: { revenue: number }) => item.revenue),
  );
  const table = (
    title: string,
    rows: any[],
    columns: { key: string; label: string; currency?: boolean }[],
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!rows?.length ? (
          <EmptyState
            icon={Package}
            title="Chưa có dữ liệu"
            description="Không có giao dịch phù hợp bộ lọc."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-y border-line text-xs uppercase text-muted">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-3">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row, i) => (
                  <tr key={row.id || row.productId || row.label || i}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-chalk">
                        {column.currency
                          ? formatCurrency(row[column.key])
                          : (row[column.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta-label">Phân tích kinh doanh</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-chalk">
            Báo cáo nước uống
          </h1>
        </div>
        <Button variant="outline" onClick={exportExcel} disabled={!data}>
          <Download className="size-4" />
          Xuất Excel (CSV)
        </Button>
      </div>
      <Card>
        <CardContent className="grid items-end gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Từ ngày"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input label="Đến ngày" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select
            label="Gom doanh thu"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
            options={[
              { value: 'day', label: 'Theo ngày' },
              { value: 'week', label: 'Theo tuần' },
              { value: 'month', label: 'Theo tháng' },
              { value: 'year', label: 'Theo năm' },
            ]}
          />
          <Button onClick={apply}>Áp dụng bộ lọc</Button>
        </CardContent>
      </Card>
      {from && to && from > to && (
        <p className="text-sm text-danger">Ngày bắt đầu không thể sau ngày kết thúc.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Tổng tiền bán',
            value: formatCurrency(summary?.salesRevenue ?? 0),
            icon: TrendingUp,
          },
          {
            title: 'Tổng tiền nhập',
            value: formatCurrency(summary?.importCost ?? 0),
            icon: Package,
          },
          {
            title: 'Lợi nhuận gộp ước tính',
            value: formatCurrency(summary?.grossProfit ?? 0),
            icon: BarChart3,
          },
          {
            title: 'Nhập / bán',
            value: `${summary?.importedQuantity ?? 0} / ${summary?.soldQuantity ?? 0}`,
            icon: Package,
          },
        ].map(({ title, value, icon: Icon }) => (
          <Card key={title}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl border border-neon/25 bg-neon/10 text-neon">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted">{title}</p>
                <p className="mt-1 font-display text-xl font-bold text-chalk">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Doanh thu theo{' '}
            {groupBy === 'day'
              ? 'ngày'
              : groupBy === 'week'
                ? 'tuần'
                : groupBy === 'month'
                  ? 'tháng'
                  : 'năm'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.revenue?.length ? (
            <div className="overflow-x-auto">
              <div
                className="flex min-w-[560px] items-end gap-3 border-b border-line pb-2"
                style={{ height: 240 }}
              >
                {data.revenue.map((item: { label: string; revenue: number }) => (
                  <div
                    key={item.label}
                    className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    title={`${item.label}: ${formatCurrency(item.revenue)}`}
                  >
                    <div
                      className="w-full rounded-t bg-neon/70 group-hover:bg-neon"
                      style={{
                        height: `${item.revenue > 0 ? Math.max(3, (item.revenue / max) * 90) : 1}%`,
                      }}
                    />
                    <span className="w-full truncate text-center text-[10px] text-muted">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Chưa có doanh thu"
              description="Chưa có hóa đơn đã thanh toán trong khoảng đã chọn."
            />
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {table('Sản phẩm bán chạy', data?.topProducts ?? [], [
          { key: 'productCode', label: 'Mã' },
          { key: 'productName', label: 'Sản phẩm' },
          { key: 'soldQuantity', label: 'Đã bán' },
          { key: 'salesRevenue', label: 'Doanh thu', currency: true },
        ])}
        {table('Sản phẩm bán chậm', data?.slowProducts ?? [], [
          { key: 'productCode', label: 'Mã' },
          { key: 'productName', label: 'Sản phẩm' },
          { key: 'soldQuantity', label: 'Đã bán' },
          { key: 'salesRevenue', label: 'Doanh thu', currency: true },
        ])}
        {table('Doanh thu theo nhân viên', data?.byStaff ?? [], [
          { key: 'label', label: 'Nhân viên' },
          { key: 'saleCount', label: 'Hóa đơn' },
          { key: 'revenue', label: 'Doanh thu', currency: true },
        ])}
        {table('Doanh thu theo ca làm', data?.byShift ?? [], [
          { key: 'label', label: 'Ca làm' },
          { key: 'saleCount', label: 'Hóa đơn' },
          { key: 'revenue', label: 'Doanh thu', currency: true },
        ])}
      </div>
    </div>
  );
}
