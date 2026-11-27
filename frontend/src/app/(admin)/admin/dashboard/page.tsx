'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Dumbbell,
  PackagePlus,
  ReceiptText,
  RotateCw,
  ScanFace,
  Users,
  type LucideIcon,
} from 'lucide-react';
import apiClient from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AnimatedNumber, RevealFx, StaggerGroup, StaggerItem } from '@/components/ui/motion';
import { faceApi } from '@/services/face.service';
import { MEMBERSHIP_STATUS_META } from '@/lib/status';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

/**
 * Dashboard khu quản trị hệ thống (ADMIN / MANAGER / STAFF).
 * Không còn nghiệp vụ check-in tại quầy (chỉ STAFF dùng ở menu Lượt Check-in) và
 * không còn phần của đối tác — đối tác có dashboard riêng ở /partner/dashboard.
 */
export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [today, setToday] = useState('');

  // Ngày hiển thị tính phía client để tránh lệch hydration
  useEffect(() => {
    const d = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    setToday(`${days[d.getDay()]}, ${formatDate(d)}`);
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: async () => (await apiClient.get('/reports/dashboard')).data,
  });
  const faceQuery = useQuery({
    queryKey: ['face-reviews'],
    queryFn: faceApi.listPendingReviews,
    retry: 0,
  });

  const loading = dashboardQuery.isLoading;
  const summary = dashboardQuery.data?.stats;
  const pendingPayments: any[] = dashboardQuery.data?.pendingPayments ?? [];
  const registrations: any[] = dashboardQuery.data?.recentRegistrations ?? [];
  const pendingTasks = (summary?.pendingPayments ?? 0) + (summary?.pendingMemberships ?? 0);
  const pendingFaces = faceQuery.data?.total ?? 0;
  const refreshing = dashboardQuery.isFetching || faceQuery.isFetching;

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['face-reviews'] }),
    ]);

  return (
    <div className="space-y-6 pb-10">
      {/* Tiêu đề */}
      <RevealFx delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="meta-label">Quản trị hệ thống{today && ` • ${today}`}</p>
            <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-chalk sm:text-4xl">
              Trung tâm quản trị
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Hội viên, doanh thu, đối tác và các yêu cầu đang chờ bạn xử lý.
            </p>
          </div>
          <Button variant="outline" onClick={refresh} disabled={refreshing} className="shrink-0">
            <RotateCw className={cn('size-4', refreshing && 'animate-spin text-neon')} />
            Làm mới
          </Button>
        </div>
      </RevealFx>

      {/* KPI */}
      <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <KpiCard
            href="/admin/members"
            label="Hội viên hoạt động"
            icon={Users}
            value={loading ? null : (summary?.activeMembers ?? 0)}
            unit="thẻ còn hạn"
            footer={
              <>
                <span className="text-chalk">{summary?.totalMembers ?? 0} tổng đăng ký</span>
                <span>•</span>
                <span>{summary?.expiredMembers ?? 0} hết hạn</span>
              </>
            }
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            href="/admin/reports/revenue"
            label="Doanh thu tháng này"
            icon={DollarSign}
            display={loading ? '--' : formatCurrency(summary?.revenueThisMonth ?? 0)}
            accent
            footer={
              <>
                <span>Tổng: {formatCurrency(summary?.totalRevenue ?? 0)}</span>
                <span>•</span>
                <span className="text-chalk">+{summary?.newMembersThisMonth ?? 0} HV mới</span>
              </>
            }
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            href="/admin/payments"
            label="Tác vụ cần xử lý"
            icon={pendingTasks > 0 ? AlertTriangle : CheckCircle2}
            value={loading ? null : pendingTasks}
            unit="yêu cầu chờ"
            warn={pendingTasks > 0}
            footer={
              <>
                <span>{summary?.pendingPayments ?? 0} hoá đơn</span>
                <span>•</span>
                <span>{summary?.pendingMemberships ?? 0} thẻ chờ duyệt</span>
              </>
            }
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            href="/admin/face-reviews"
            label="Ảnh khuôn mặt chờ duyệt"
            icon={ScanFace}
            value={faceQuery.isLoading ? null : pendingFaces}
            unit="hội viên"
            warn={pendingFaces > 0}
            footer={<span>Duyệt để hội viên check-in bằng Face ID</span>}
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Hàng chờ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QueueCard
          icon={ReceiptText}
          title="Hóa đơn chờ duyệt"
          description="Thanh toán hội viên cần xác nhận"
          href="/admin/payments"
        >
          {pendingPayments.length === 0 ? (
            <EmptyState
              className="m-5 py-8"
              icon={CheckCircle2}
              title="Không có hóa đơn chờ"
              description="Toàn bộ hóa đơn đã được xử lý."
            />
          ) : (
            pendingPayments.slice(0, 5).map((p) => (
              <Row
                key={p.id}
                title={p.member?.fullName}
                subtitle={
                  <>
                    <span className="font-mono text-chalk">{p.code}</span> •{' '}
                    {p.membership?.package?.name || 'Dịch vụ Gym'}
                  </>
                }
              >
                <span className="font-mono text-sm font-bold text-neon">
                  {formatCurrency(p.amount)}
                </span>
                <Link href={`/admin/payments/${p.id}`}>
                  <Button variant="outline" size="sm">
                    Duyệt
                  </Button>
                </Link>
              </Row>
            ))
          )}
        </QueueCard>

        <QueueCard
          icon={PackagePlus}
          title="Đăng ký gói mới"
          description="Đăng ký và gia hạn thẻ tập gần đây"
          href="/admin/memberships"
        >
          {registrations.length === 0 ? (
            <EmptyState
              className="m-5 py-8"
              icon={PackagePlus}
              title="Chưa có đăng ký mới"
              description="Yêu cầu đăng ký hoặc gia hạn thẻ tập sẽ hiện ở đây."
            />
          ) : (
            registrations.slice(0, 5).map((r) => {
              const meta = MEMBERSHIP_STATUS_META[r.status] || {
                label: r.status,
                variant: 'outline',
              };
              return (
                <Row
                  key={r.id}
                  title={
                    <>
                      {r.member?.fullName}
                      <span className="ml-1.5 font-mono text-[11px] text-neon">
                        {r.member?.code}
                      </span>
                    </>
                  }
                  subtitle={`${r.package?.name ?? ''} • ${formatDate(r.startDate)} → ${formatDate(r.endDate)}`}
                >
                  <Badge variant={meta.variant as any} className="text-[10px]">
                    {meta.label}
                  </Badge>
                </Row>
              );
            })
          )}
        </QueueCard>
      </div>

      {/* Truy cập nhanh */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Truy cập nhanh
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Shortcut
            title="Hội viên"
            description="Hồ sơ & gia hạn"
            icon={Users}
            href="/admin/members"
          />
          <Shortcut
            title="Gói tập Gym"
            description="Bảng giá & quyền lợi"
            icon={Dumbbell}
            href="/admin/membership-packages"
          />
          <Shortcut
            title="Thu ngân"
            description="Hóa đơn & thu phí"
            icon={DollarSign}
            href="/admin/payments"
          />
          <Shortcut
            title="Đối tác"
            description="Phòng gym hợp tác"
            icon={Building2}
            href="/admin/partners"
          />
          <Shortcut
            title="Yêu cầu hợp tác"
            description="Tư vấn & ký hợp đồng"
            icon={ClipboardList}
            href="/admin/partner-leads"
          />
          <Shortcut
            title="Báo cáo"
            description="Doanh thu & xuất CSV"
            icon={BarChart3}
            href="/admin/reports"
          />
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// Thành phần con
// =============================================================================

function KpiCard({
  href,
  label,
  icon: Icon,
  value,
  display,
  unit,
  footer,
  accent,
  warn,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Số nguyên có hiệu ứng đếm; null = đang tải */
  value?: number | null;
  /** Chuỗi hiển thị sẵn (vd tiền tệ) thay cho value */
  display?: string;
  unit?: string;
  footer: React.ReactNode;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full transition-colors group-hover:border-neon/40">
        <CardContent className="flex h-full flex-col justify-between p-5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
              <span
                className={cn(
                  'rounded-xl border p-2',
                  warn
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : 'border-neon/30 bg-neon/10 text-neon',
                )}
              >
                <Icon className="size-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={cn(
                  'font-display text-3xl font-black tracking-tight',
                  warn ? 'text-amber-400' : accent ? 'text-neon' : 'text-chalk',
                )}
              >
                {display ?? (value == null ? '--' : <AnimatedNumber value={value} />)}
              </span>
              {unit && <span className="text-xs text-muted">{unit}</span>}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3 text-xs text-muted">
            {footer}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QueueCard({
  icon: Icon,
  title,
  description,
  href,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b border-line pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Icon className="size-4 text-neon" />
              {title}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <Link
            href={href}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-neon hover:underline"
          >
            Mở quản lý <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 divide-y divide-line p-0">{children}</CardContent>
    </Card>
  );
}

function Row({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-line/25">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-chalk">{title}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  );
}

function Shortcut({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-neon/40"
    >
      <div className="flex items-start justify-between">
        <span className="rounded-xl border border-line bg-ink p-2.5 text-muted transition-colors group-hover:border-neon/30 group-hover:text-neon">
          <Icon className="size-4" />
        </span>
        <ArrowUpRight className="size-3.5 text-muted/50 transition-colors group-hover:text-neon" />
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-bold text-chalk transition-colors group-hover:text-neon">
          {title}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-muted">{description}</p>
      </div>
    </Link>
  );
}
