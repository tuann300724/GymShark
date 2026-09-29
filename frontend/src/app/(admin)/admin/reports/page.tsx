'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/services/report.service';
import { branchApi } from '@/services/branch.service';
import type { BranchOverviewReport, EquipmentStatsReport } from '@/services/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { BarChart, MethodBars } from '@/components/charts/bar-chart';
import { useToast } from '@/components/ui/toast';
import {
  BRANCH_STATUS_META,
  EQUIPMENT_CONDITION_META,
  EQUIPMENT_STATUS_META,
  MEMBERSHIP_STATUS_META,
  PAYMENT_METHOD_LABEL,
} from '@/lib/status';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  Activity,
  BarChart3,
  Building2,
  CalendarCheck2,
  Download,
  Dumbbell,
  Gauge,
  Layers,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';

const TABS = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'revenue', label: 'Doanh thu' },
  { value: 'attendance', label: 'Chuyên cần' },
  { value: 'members', label: 'Hội viên' },
  { value: 'memberships', label: 'Gói tập' },
  { value: 'trainers', label: 'HLV' },
  { value: 'equipment', label: 'Thiết bị' },
  { value: 'branches', label: 'Chi nhánh' },
];

const CSV_TYPES: Record<string, 'revenue' | 'members' | 'attendance' | 'memberships'> = {
  revenue: 'revenue',
  members: 'members',
  attendance: 'attendance',
  memberships: 'memberships',
};

/** Nhãn hình thức check-in (báo cáo / thống kê) */
const CHECKIN_METHOD_LABEL: Record<string, string> = {
  MANUAL: 'Tự check-in',
  STAFF: 'Lễ tân',
  QR_CODE: 'Quét QR',
  FACE_ID: 'Khuôn mặt',
};

function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

/* ------------------------------ Tổng quan ------------------------------ */
function OverviewTab({ branchId }: { branchId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-overview', branchId],
    queryFn: () => reportApi.overview(branchId || undefined),
    retry: 1,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data)
    return (
      <Card>
        <CardContent className="py-14 text-center text-xs text-danger">
          Không tải được báo cáo tổng quan.
        </CardContent>
      </Card>
    );

  const s = data.summary;
  const rev = data.revenue;
  const att = data.attendance;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Hội viên"
          value={s.totalMembers}
          subtitle={`${s.activeMembers} đang tập luyện`}
          icon={Users}
          colorScheme="neon"
        />
        <StatCard
          title="Doanh thu tháng"
          value={formatCurrency(rev.month)}
          subtitle={`Năm: ${formatCurrency(rev.year)}`}
          icon={TrendingUp}
          colorScheme="blue"
        />
        <StatCard
          title="Check-in hôm nay"
          value={s.todayCheckIns}
          subtitle={`${s.todayCheckOuts} check-out · ${s.currentlyInside} đang có mặt`}
          icon={Activity}
          colorScheme="amber"
        />
        <StatCard
          title="HLV / Chi nhánh"
          value={`${s.totalTrainers} / ${s.totalBranches}`}
          subtitle={`${s.pendingMemberships} gói chờ duyệt`}
          icon={UserCheck}
          colorScheme="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Doanh thu (PAID)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {[
              ['Hôm nay', rev.today],
              ['7 ngày qua', rev.week],
              ['Tháng này', rev.month],
              ['Cả năm', rev.year],
              ['Lũy kế', rev.total],
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between border-b border-line/50 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-xs text-muted">{label}</span>
                <span className="font-mono font-bold text-neon">
                  {formatCurrency(Number(val) || 0)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Chuyên cần (30 ngày)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {[
              ['Tổng check-in', att.totalCheckIns],
              ['Tổng check-out', att.totalCheckOuts],
              ['Trung bình / ngày', att.avgPerDay],
              [
                'Giờ cao điểm',
                att.peakHour != null
                  ? `${att.peakHour}:00 – ${att.peakHour + 1}:00 (${att.peakCount} lượt)`
                  : 'Chưa có',
              ],
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between border-b border-line/50 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-xs text-muted">{label}</span>
                <span className="text-xs font-bold text-chalk">{String(val)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cần xử lý</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {[
              ['Gói hết hạn', s.expiredMembers],
              ['Gói chờ duyệt (PENDING)', s.pendingMemberships],
              ['Thanh toán chờ xác nhận', s.pendingPayments],
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between border-b border-line/50 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-xs text-muted">{label}</span>
                <span
                  className={cn(
                    'text-xs font-bold',
                    Number(val) > 0 ? 'text-danger' : 'text-chalk',
                  )}
                >
                  {String(val)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ Doanh thu ------------------------------ */
function RevenueTab({ branchId }: { branchId: string }) {
  const toast = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [applied, setApplied] = useState({ from: '', to: '' });
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-revenue', branchId, applied],
    queryFn: () =>
      reportApi.revenue({
        branchId: branchId || undefined,
        from: applied.from || undefined,
        to: applied.to || undefined,
      }),
    retry: 1,
  });

  const dayData = useMemo(
    () =>
      (data?.byDay || []).map((d) => ({
        label: d.date.slice(5).replace('-', '/'),
        value: Number(d.revenue),
      })),
    [data],
  );
  const monthData = useMemo(
    () => (data?.byMonth || []).map((d) => ({ label: d.month, value: Number(d.revenue) })),
    [data],
  );
  // Backend trả byPackage theo từng membership (nhiều người cùng gói => trùng tên gói).
  // Gộp theo tên gói để biểu đồ không bị trùng key/lặp cột.
  const byPackageAgg = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of data?.byPackage || []) {
      map.set(p.packageName, (map.get(p.packageName) || 0) + Number(p.revenue));
    }
    return Array.from(map.entries()).map(([name, revenue]) => ({ label: name, value: revenue }));
  }, [data]);

  const s = data?.stats;
  const exportCsv = async () => {
    setExporting(true);
    try {
      const filename = await reportApi.downloadCsv('revenue', {
        branchId: branchId || undefined,
        from: applied.from || undefined,
        to: applied.to || undefined,
      });
      toast.success('Đã xuất CSV', filename);
    } catch {
      toast.error('Xuất CSV thất bại', 'Có lỗi khi tạo file.');
    } finally {
      setExporting(false);
    }
  };

  if (isError)
    return (
      <Card>
        <CardContent className="py-14 text-center text-xs text-danger">
          Không tải được báo cáo doanh thu.
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          title="Hôm nay"
          value={formatCurrency(s?.revenueToday || 0)}
          icon={TrendingUp}
          colorScheme="neon"
        />
        <StatCard
          title="Tuần này"
          value={formatCurrency(s?.revenueThisWeek || 0)}
          icon={Activity}
          colorScheme="blue"
        />
        <StatCard
          title="Tháng này"
          value={formatCurrency(s?.revenueThisMonth || 0)}
          icon={CalendarCheck2}
          colorScheme="amber"
        />
        <StatCard
          title="Năm này"
          value={formatCurrency(s?.revenueThisYear || 0)}
          icon={Layers}
          colorScheme="purple"
        />
        <StatCard
          title="Lũy kế"
          value={formatCurrency(s?.totalRevenue || 0)}
          subtitle={`${s?.totalPaidCount ?? 0} hóa đơn`}
          icon={Gauge}
          colorScheme="neon"
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div>
            <label htmlFor="rep-from" className="mb-1.5 block text-xs font-semibold text-muted">
              Từ ngày
            </label>
            <Input
              id="rep-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <label htmlFor="rep-to" className="mb-1.5 block text-xs font-semibold text-muted">
              Đến ngày
            </label>
            <Input
              id="rep-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setApplied({ from, to })}>
              Áp dụng
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFrom('');
                setTo('');
                setApplied({ from: '', to: '' });
              }}
            >
              Đặt lại
            </Button>
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
              <Download className="mr-1.5 size-4" /> {exporting ? 'Đang xuất...' : 'Xuất CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : <BarChart data={dayData} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Doanh thu theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : <BarChart data={monthData} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Theo phương thức</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <MethodBars
                data={(data?.byMethod || []).map((m) => ({
                  label: PAYMENT_METHOD_LABEL[m.method] || m.method,
                  value: Number(m.revenue),
                }))}
              />
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
            ) : byPackageAgg.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted">Chưa có dữ liệu.</p>
            ) : (
              <MethodBars data={byPackageAgg} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ Chuyên cần ------------------------------ */
function AttendanceTab({ branchId }: { branchId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-attendance', branchId],
    queryFn: () => reportApi.attendance({ branchId: branchId || undefined }),
    retry: 1,
  });

  if (isError)
    return (
      <Card>
        <CardContent className="py-14 text-center text-xs text-danger">
          Không tải được báo cáo chuyên cần.
        </CardContent>
      </Card>
    );

  const dayData = (data?.byDay || []).map((d) => ({
    label: d.date.slice(5).replace('-', '/'),
    value: d.checkIns,
  }));
  const hourData = (data?.byHour || []).map((h) => ({ label: String(h.hour), value: h.count }));
  const weekdayData = (data?.byWeekday || []).map((d) => ({
    label: d.label.slice(0, 4),
    value: d.count,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Check-in"
          value={data?.stats.totalCheckIns ?? 0}
          subtitle={`${data?.from} → ${data?.to}`}
          icon={Activity}
          colorScheme="neon"
        />
        <StatCard
          title="Check-out"
          value={data?.stats.totalCheckOuts ?? 0}
          icon={CalendarCheck2}
          colorScheme="blue"
        />
        <StatCard
          title="Trung bình / ngày"
          value={data?.stats.avgPerDay ?? 0}
          icon={TrendingUp}
          colorScheme="amber"
        />
        <StatCard
          title="Giờ cao điểm"
          value={data?.stats.peakHour != null ? `${data.stats.peakHour}:00` : '—'}
          subtitle={data?.stats.peakCount != null ? `${data.stats.peakCount} lượt` : undefined}
          icon={Gauge}
          colorScheme="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Check-in theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : <BarChart data={dayData} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Theo giờ trong ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : <BarChart data={hourData} />}
          </CardContent>
        </Card>
      </div>

      {!isLoading && data && data.byWeekday.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Theo thứ trong tuần</CardTitle>
            </CardHeader>
            <CardContent>
              {data.byWeekday.map((d) => (
                <div key={d.day} className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted">{d.label}</span>
                  <span className="font-semibold text-chalk">
                    {d.count.toLocaleString('vi-VN')} lượt
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Theo chi nhánh</CardTitle>
            </CardHeader>
            <CardContent>
              {data.byBranch.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted">Chưa có dữ liệu.</p>
              ) : (
                <MethodBars
                  data={data.byBranch.map((b) => ({ label: b.branchName, value: b.count }))}
                  unit=" lượt"
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Theo hình thức check-in</CardTitle>
            </CardHeader>
            <CardContent>
              {!data.byMethod || data.byMethod.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted">Chưa có dữ liệu.</p>
              ) : (
                <MethodBars
                  data={data.byMethod.map((m) => ({
                    label: CHECKIN_METHOD_LABEL[m.method] || m.method,
                    value: m.count,
                  }))}
                  unit=" lượt"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Hội viên ------------------------------ */
function MembersTab({ branchId }: { branchId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-members', branchId],
    queryFn: () => reportApi.members({ branchId: branchId || undefined }),
    retry: 1,
  });

  if (isError)
    return (
      <Card>
        <CardContent className="py-14 text-center text-xs text-danger">
          Không tải được báo cáo hội viên.
        </CardContent>
      </Card>
    );

  const growth = (data?.growthByMonth || []).map((m) => ({ label: m.month, value: m.count }));
  const statusTotal = (data?.byStatus || []).reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Tổng hội viên"
          value={data?.stats.totalMembers ?? 0}
          icon={Users}
          colorScheme="neon"
        />
        <StatCard
          title="Đang tập luyện"
          value={data?.stats.activeMembers ?? 0}
          icon={UserCheck}
          colorScheme="neon"
        />
        <StatCard
          title="Hết hạn"
          value={data?.stats.expiredMembers ?? 0}
          icon={Activity}
          colorScheme="amber"
        />
        <StatCard
          title="Gói chờ duyệt"
          value={data?.stats.pendingMemberships ?? 0}
          icon={Layers}
          colorScheme="purple"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Hội viên mới theo tháng</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-40 w-full" /> : <BarChart data={growth} />}
        </CardContent>
      </Card>

      {(data?.recent || []).length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Hội viên mới gần đây</CardTitle>
            <span className="text-[11px] text-muted">{statusTotal} theo trạng thái</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="border-b border-line bg-ink text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Mã HV</th>
                    <th className="px-4 py-3">Họ tên</th>
                    <th className="px-4 py-3">Chi nhánh</th>
                    <th className="px-4 py-3">Ngày tham gia</th>
                    <th className="px-4 py-3 text-right">Thanh toán</th>
                    <th className="px-4 py-3 text-right">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(data?.recent || []).map((m) => (
                    <tr key={m.id} className="transition-colors hover:bg-line/20">
                      <td className="px-4 py-3 font-mono font-bold text-neon">{m.code}</td>
                      <td className="px-4 py-3 font-semibold text-chalk">{m.fullName}</td>
                      <td className="px-4 py-3 text-muted">{m.branch?.name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-muted">{formatDate(m.joinedAt)}</td>
                      <td className="px-4 py-3 text-right text-muted">{m._count.payments}</td>
                      <td className="px-4 py-3 text-right text-muted">{m._count.checkIns}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------ Gói tập ------------------------------ */
function MembershipsTab({ branchId }: { branchId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-memberships', branchId],
    queryFn: () => reportApi.memberships({ branchId: branchId || undefined }),
    retry: 1,
  });

  if (isError)
    return (
      <Card>
        <CardContent className="py-14 text-center text-xs text-danger">
          Không tải được báo cáo gói tập.
        </CardContent>
      </Card>
    );

  const byMonth = (data?.stats.byMonth || []).map((m) => ({ label: m.month, value: m.count }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          title="Chờ duyệt"
          value={data?.stats.pendingCount ?? 0}
          icon={Layers}
          colorScheme="amber"
        />
        <StatCard
          title="Đã hết hạn"
          value={data?.stats.expiredCount ?? 0}
          icon={Activity}
          colorScheme="rose"
        />
        <StatCard
          title="Trạng thái"
          value={(data?.byStatus || []).length}
          subtitle="Nhóm trạng thái"
          icon={Gauge}
          colorScheme="purple"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lượt đăng ký gói theo tháng</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-40 w-full" /> : <BarChart data={byMonth} />}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gói phổ biến</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (data?.packagePopularity || []).length === 0 ? (
              <p className="py-8 text-center text-xs text-muted">Chưa có dữ liệu.</p>
            ) : (
              <MethodBars
                data={(data?.packagePopularity || []).map((p) => ({
                  label: p.packageName,
                  value: p.count,
                }))}
                unit=" lượt"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Phân bố trạng thái gói</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (data?.byStatus || []).length === 0 ? (
              <p className="py-8 text-center text-xs text-muted">Chưa có dữ liệu.</p>
            ) : (
              <MethodBars
                data={(data?.byStatus || []).map((r) => ({
                  label: MEMBERSHIP_STATUS_META[r.status]?.label || r.status,
                  value: r.count,
                }))}
                unit=" gói"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ HLV ------------------------------ */
function TrainersTab({ branchId }: { branchId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-trainers', branchId],
    queryFn: () => reportApi.trainers({ branchId: branchId || undefined }),
    retry: 1,
  });

  if (isError)
    return (
      <Card>
        <CardContent className="py-14 text-center text-xs text-danger">
          Không tải được báo cáo HLV.
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          title="Tổng HLV"
          value={data?.stats.totalTrainers ?? 0}
          icon={UserCheck}
          colorScheme="neon"
        />
        <StatCard
          title="Đang hoạt động"
          value={data?.stats.activeTrainers ?? 0}
          icon={Activity}
          colorScheme="neon"
        />
        <StatCard
          title="Hiệu suất"
          value={`${data?.data.length ? Math.round((data.data.reduce((a, t) => a + t.completedSessions, 0) / data.data.length) * 10) / 10 : 0} buổi`}
          subtitle="Trung bình buổi đã hoàn thành"
          icon={Gauge}
          colorScheme="amber"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState rows={4} />
          ) : (data?.data || []).length === 0 ? (
            <p className="py-12 text-center text-xs text-muted">Chưa có HLV nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="border-b border-line bg-ink text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">HLV</th>
                    <th className="px-4 py-3">Chi nhánh</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Hội viên phụ trách</th>
                    <th className="px-4 py-3 text-right">Lịch dạy</th>
                    <th className="px-4 py-3 text-right">Buổi đã hoàn thành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(data?.data || []).map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-line/20">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-chalk">{t.fullName}</p>
                        <p className="text-[10px] font-mono text-muted">{t.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">{t.branch?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={t.status === 'ACTIVE' ? 'success' : 'outline'}>
                          {t.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted">{t.memberCount}</td>
                      <td className="px-4 py-3 text-right text-muted">{t.scheduleCount}</td>
                      <td className="px-4 py-3 text-right font-bold text-neon">
                        {t.completedSessions}
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

/* ------------------------------ Thiết bị ------------------------------ */
function EquipmentTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-equipment'],
    queryFn: () => reportApi.equipment(),
    retry: 1,
  });

  const statusData = useMemo(() => {
    const d = data as EquipmentStatsReport | undefined;
    if (!d) return [];
    return Object.entries(d.byStatus).map(([k, v]) => ({
      label: EQUIPMENT_STATUS_META[k]?.label || k,
      value: v,
    }));
  }, [data]);

  const conditionData = useMemo(() => {
    const d = data as EquipmentStatsReport | undefined;
    if (!d) return [];
    return Object.entries(d.byCondition).map(([k, v]) => ({
      label: EQUIPMENT_CONDITION_META[k]?.label || k,
      value: v,
    }));
  }, [data]);

  if (isError)
    return (
      <Card>
        <CardContent className="py-14 text-center text-xs text-danger">
          Không tải được báo cáo thiết bị.
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Tổng thiết bị"
          value={data?.total ?? 0}
          subtitle={`${data?.maintenanceThisMonth ?? 0} lượt bảo trì tháng này`}
          icon={Dumbbell}
          colorScheme="neon"
        />
        <StatCard
          title="Sẵn sàng"
          value={data?.available ?? 0}
          icon={UserCheck}
          colorScheme="neon"
        />
        <StatCard
          title="Đang dùng / Bảo trì"
          value={`${data?.inUse ?? 0} / ${data?.maintenance ?? 0}`}
          icon={Wrench}
          colorScheme="amber"
        />
        <StatCard
          title="Hỏng / Thanh lý"
          value={`${data?.broken ?? 0} / ${data?.retired ?? 0}`}
          icon={Activity}
          colorScheme="rose"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cảnh báo bảo trì & bảo hành</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Quá hạn bảo trì', data?.alerts.overdue ?? 0, 'text-danger'],
                ['Sắp tới (14 ngày)', data?.alerts.upcoming ?? 0, 'text-amber-400'],
                ['Đang hỏng', data?.alerts.broken ?? 0, 'text-danger'],
                ['Hết bảo hành (30 ngày)', data?.alerts.warrantyExpiring ?? 0, 'text-amber-400'],
              ].map(([label, val, cls]) => (
                <div
                  key={String(label)}
                  className="rounded-lg border border-line bg-ink px-3 py-2.5"
                >
                  <p className="text-[11px] text-muted">{label}</p>
                  <p className={cn('font-display text-xl font-black', String(cls))}>
                    {String(val)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <MethodBars data={statusData} unit=" máy" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Theo tình trạng</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <MethodBars data={conditionData} unit=" máy" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ Chi nhánh ------------------------------ */
function BranchesTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-branches'],
    queryFn: () => reportApi.branches(),
    retry: 1,
  });

  if (isError)
    return (
      <Card>
        <CardContent className="py-14 text-center text-xs text-danger">
          Không tải được báo cáo chi nhánh.
        </CardContent>
      </Card>
    );

  const rows = (data as BranchOverviewReport | undefined)?.data || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-52 w-full" />)
          : rows.map((b) => {
              const meta = BRANCH_STATUS_META[b.status] || {
                label: b.status,
                variant: 'outline' as const,
              };
              return (
                <Card key={b.id} className="border-l-2 border-l-neon">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="flex items-center gap-2 font-display text-base font-bold text-chalk">
                          <Building2 className="size-4 text-neon" /> {b.name}
                        </h4>
                        <p className="mt-0.5 truncate text-[11px] text-muted">{b.address}</p>
                        {b.openingHours && (
                          <p className="text-[11px] text-muted">Giờ mở: {b.openingHours}</p>
                        )}
                      </div>
                      <Badge variant={meta.variant as any}>{meta.label}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                      {[
                        ['Hội viên', `${b.activeMembers}/${b.members}`, 'đang tập'],
                        [
                          'Check-in tháng',
                          String(b.checkInsThisMonth),
                          `${b.checkInsToday} hôm nay`,
                        ],
                        ['Doanh thu tháng', formatCurrency(b.revenueThisMonth), 'PAID'],
                        ['Thiết bị', String(b.equipment), `${b.rooms} phòng`],
                        ['HLV', String(b.trainers), 'đang hoạt động'],
                        ['Lịch sắp tới', String(b.upcomingSessions), 'buổi SCHEDULED'],
                      ].map(([label, val, note]) => (
                        <div key={String(label)} className="rounded-lg bg-ink p-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
                          <p className="font-display text-base font-black text-neon">
                            {String(val)}
                          </p>
                          <p className="text-[9px] text-muted">{note}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}

/* ------------------------------ Trang chính ------------------------------ */
export default function ReportsPage() {
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [branchId, setBranchId] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: branches } = useQuery({
    queryKey: ['branches-list'],
    queryFn: branchApi.list,
    retry: 1,
  });

  const exportCsv = async () => {
    const type = CSV_TYPES[tab];
    if (!type) return;
    setExporting(true);
    try {
      const filename = await reportApi.downloadCsv(type, { branchId: branchId || undefined });
      toast.success('Đã xuất CSV', filename);
    } catch {
      toast.error('Xuất CSV thất bại', 'Có lỗi khi tạo file.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
            <BarChart3 className="size-6 text-neon" /> Báo cáo &amp; phân tích
          </h1>
          <p className="mt-1 text-xs text-muted">
            Tổng hợp hoạt động phòng tập theo chi nhánh — doanh thu chỉ tính giao dịch PAID, hoàn
            tiền hạch toán riêng.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <Select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              options={[
                { value: '', label: 'Tất cả chi nhánh' },
                ...(branches || []).map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
              ]}
            />
          </div>
          {CSV_TYPES[tab] && (
            <Button variant="outline" size="md" onClick={exportCsv} disabled={exporting}>
              <Download className="mr-1.5 size-4" /> {exporting ? 'Đang xuất...' : 'Xuất CSV'}
            </Button>
          )}
        </div>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'overview' && <OverviewTab branchId={branchId} />}
      {tab === 'revenue' && <RevenueTab branchId={branchId} />}
      {tab === 'attendance' && <AttendanceTab branchId={branchId} />}
      {tab === 'members' && <MembersTab branchId={branchId} />}
      {tab === 'memberships' && <MembershipsTab branchId={branchId} />}
      {tab === 'trainers' && <TrainersTab branchId={branchId} />}
      {tab === 'equipment' && <EquipmentTab />}
      {tab === 'branches' && <BranchesTab />}
    </div>
  );
}
