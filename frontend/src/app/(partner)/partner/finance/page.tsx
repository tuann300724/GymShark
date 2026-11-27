'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { BarChart, MethodBars } from '@/components/charts/bar-chart';
import { partnerApi } from '@/services/partner.service';
import { beverageApi } from '@/services/beverage.service';
import { getStoredUser, isPartnerRole } from '@/lib/auth';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Wallet,
  Users,
  Percent,
  TrendingUp,
  Droplets,
  CalendarDays,
  Package,
  Boxes,
  ListChecks,
} from 'lucide-react';

/** Trả về từ GET /beverages/dashboard (dashboard doanh thu nước uống). */
interface BeverageDashboard {
  products: {
    productCount: number;
    stockQuantity: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  soldQuantity: number;
  revenue: { today: number; week: number; month: number };
  grossProfit: number;
  dailyRevenue: { label: string; value: number }[];
  topProducts: {
    productId: string;
    productCode: string;
    productName: string;
    soldQuantity: number;
    salesRevenue: number;
    estimatedGrossProfit: number;
  }[];
}

function monthLabel(month: string): string {
  // "2026-11" → "11/26"
  return `${month.slice(5)}/${month.slice(2, 4)}`;
}

/**
 * Trang quản lý tài chính TẠI CƠ SỞ của đối tác:
 * - Hoa hồng lượt tập (gói theo partnerId qua /partners/me/commission)
 * - Doanh thu / lợi nhuận bán nước của quầy
 * KHÔNG hiển thị hóa đơn, gói tập hay báo cáo doanh thu hệ thống.
 */
export default function AdminFacilityFinancePage() {
  const router = useRouter();
  // Mục này chỉ dành cho đối tác — admin/staff có trang báo cáo riêng.
  const [isPartner, setIsPartner] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = isPartnerRole(getStoredUser()?.role);
    setIsPartner(ok);
    if (!ok) router.replace('/admin');
  }, [router]);

  const commissionQuery = useQuery({
    queryKey: ['partner-my-commission'],
    queryFn: () => partnerApi.getMyCommission(),
    retry: 0,
    enabled: isPartner === true,
  });

  const beverageQuery = useQuery({
    queryKey: ['partner-facility-beverage-dashboard'],
    queryFn: () => beverageApi.dashboard() as Promise<BeverageDashboard>,
    retry: 0,
    enabled: isPartner === true,
  });

  const commission = commissionQuery.data;
  const beverage = beverageQuery.data;
  const loading = commissionQuery.isPending || beverageQuery.isPending;
  const errored = commissionQuery.isError || beverageQuery.isError;

  const avgUnitPrice =
    commission && commission.visitCount > 0
      ? Number(commission.totalRevenue) / commission.visitCount
      : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (errored) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            Tài chính cơ sở
          </h1>
          <p className="mt-1 text-sm text-muted">
            Hoa hồng lượt tập và doanh thu bán nước của cơ sở.
          </p>
        </div>
        <ErrorState
          title="Không tải được dữ liệu tài chính"
          description="Vui lòng thử lại. Nếu lỗi kéo dài, liên hệ quản trị viên hệ thống."
          onRetry={() => {
            commissionQuery.refetch();
            beverageQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Tài chính cơ sở
        </h1>
        <p className="mt-1 text-sm text-muted">
          Hoa hồng từ lượt hội viên vào tập tại cơ sở và doanh thu bán nước uống.
        </p>
      </div>

      {/* ------------------ Hoa hồng lượt tập ------------------ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-neon" />
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-chalk">
            Hoa hồng lượt tập (12 tháng gần nhất)
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            title="Hoa hồng cộng dồn"
            value={formatCurrency(commission?.totalCommission || 0)}
            subtitle="Tính từ lượt check-in tại cơ sở"
            icon={Wallet}
            colorScheme="neon"
          />
          <StatCard
            title="Lượt tập"
            value={commission?.visitCount ?? 0}
            subtitle="Hội viên đã check-in vào cơ sở"
            icon={Users}
            colorScheme="blue"
          />
          <StatCard
            title="Tỷ lệ hoa hồng"
            value={`${((commission?.commissionRate ?? 0) * 100).toFixed(1)}%`}
            subtitle="Áp dụng cho mỗi lượt tập"
            icon={Percent}
            colorScheme="purple"
          />
          <StatCard
            title="Giá 1 lượt (ước tính)"
            value={formatCurrency(avgUnitPrice)}
            subtitle="Trung bình mỗi lượt vào tập"
            icon={TrendingUp}
            colorScheme="amber"
          />
        </div>

        {/* Cách tính */}
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          Mỗi lượt hội viên cộng đồng check-in tại cơ sở:{' '}
          <strong className="text-chalk">
            hoa hồng = (tiền gói của hội viên ÷ tổng số lượt của gói) × tỷ lệ
          </strong>
          . Gói theo tháng tính tổng lượt = giới hạn lượt/tháng × số tháng. Giá và tỷ lệ được chốt
          tại thời điểm check-in, nên thay đổi sau này không ảnh hưởng các lượt cũ.
        </p>

        {/* Theo hội viên */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg uppercase text-chalk">
              <Users className="size-4 text-neon" /> Hoa hồng theo hội viên
            </CardTitle>
            <CardDescription>
              Hội viên nào đã tập tại cơ sở, bao nhiêu lượt và mang lại bao nhiêu hoa hồng.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!commission?.byMember?.length ? (
              <EmptyState
                className="m-4"
                icon={Users}
                title="Chưa có lượt tập"
                description="Khi hội viên check-in tại cơ sở, hoa hồng sẽ hiện ở đây."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-line bg-ink text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Hội viên</th>
                      <th className="px-4 py-2.5 font-semibold">Loại</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Số lượt</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Giá trị lượt</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Hoa hồng</th>
                      <th className="px-4 py-2.5 font-semibold">Lần gần nhất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {commission.byMember.map((m) => (
                      <tr key={m.memberId} className="transition-colors hover:bg-line/30">
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-chalk">{m.fullName}</p>
                          <p className="font-mono text-[10px] text-muted">{m.code}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={m.community ? 'info' : 'outline'}>
                            {m.community ? 'Cộng đồng' : 'Hội viên phòng'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-chalk">
                          {m.visitCount}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-muted">
                          {formatCurrency(m.revenue)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-neon">
                          {formatCurrency(m.commission)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                          {formatDate(m.lastVisitAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Từng lượt */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg uppercase text-chalk">
              <ListChecks className="size-4 text-neon" /> Chi tiết từng lượt
            </CardTitle>
            <CardDescription>100 lượt check-in gần nhất và hoa hồng của từng lượt.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!commission?.recentVisits?.length ? (
              <p className="py-6 text-center text-sm text-muted">Chưa có lượt tập nào.</p>
            ) : (
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="sticky top-0 border-b border-line bg-ink text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Thời gian</th>
                      <th className="px-4 py-2.5 font-semibold">Hội viên</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Giá 1 lượt</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Tỷ lệ</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Hoa hồng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {commission.recentVisits.map((v) => (
                      <tr key={v.id} className="transition-colors hover:bg-line/30">
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                          {formatDateTime(v.checkInTime)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-chalk">{v.memberName}</span>{' '}
                          <span className="font-mono text-[10px] text-muted">{v.memberCode}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-muted">
                          {formatCurrency(v.unitPrice)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-muted">
                          {v.commissionRate != null
                            ? `${(v.commissionRate * 100).toFixed(1)}%`
                            : '--'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-neon">
                          {formatCurrency(v.commissionAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg uppercase text-chalk">
              Hoa hồng theo tháng
            </CardTitle>
            <CardDescription>Lượt tập tại cơ sở nhân với tỷ lệ hoa hồng.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={(commission?.monthly ?? []).map((m) => ({
                label: monthLabel(m.month),
                value: Number(m.amount),
              }))}
              height={200}
            />
          </CardContent>
        </Card>
      </section>

      {/* ------------------ Bán nước tại quầy ------------------ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Droplets className="size-4 text-neon" />
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-chalk">
            Bán nước uống tại quầy
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            title="Doanh thu hôm nay"
            value={formatCurrency(beverage?.revenue?.today || 0)}
            subtitle="Đã bán trong ngày"
            icon={CalendarDays}
            colorScheme="neon"
          />
          <StatCard
            title="Doanh thu tháng"
            value={formatCurrency(beverage?.revenue?.month || 0)}
            subtitle="Từ đầu tháng đến nay"
            icon={TrendingUp}
            colorScheme="blue"
          />
          <StatCard
            title="Lợi nhuận gộp"
            value={formatCurrency(beverage?.grossProfit || 0)}
            subtitle="Doanh thu trừ giá vốn (tháng này)"
            icon={Wallet}
            colorScheme="purple"
          />
          <StatCard
            title="Sản phẩm bán"
            value={beverage?.soldQuantity ?? 0}
            subtitle={`${beverage?.products?.productCount ?? 0} mặt hàng • tồn ${beverage?.products?.stockQuantity ?? 0}`}
            icon={Package}
            colorScheme="amber"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg uppercase text-chalk">
                Doanh thu 30 ngày qua
              </CardTitle>
              <CardDescription>Doanh thu bán nước uống mỗi ngày tại quầy.</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={(beverage?.dailyRevenue ?? []).map((d) => ({
                  label: d.label.slice(5), // "2026-11-24" → "11-24"
                  value: Number(d.value),
                }))}
                height={200}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg uppercase text-chalk">
                <Boxes className="size-4 text-neon" /> Sản phẩm bán chạy
              </CardTitle>
              <CardDescription>Top 5 theo doanh thu tại quầy.</CardDescription>
            </CardHeader>
            <CardContent>
              {beverage?.topProducts?.length ? (
                <MethodBars
                  data={beverage.topProducts.map((p) => ({
                    label: p.productName,
                    value: Number(p.salesRevenue),
                  }))}
                />
              ) : (
                <p className="py-6 text-center text-sm text-muted">Chưa có lượt bán nào.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
