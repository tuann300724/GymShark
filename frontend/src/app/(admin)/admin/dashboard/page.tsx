'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { MEMBERSHIP_STATUS_META, PAYMENT_STATUS_META, BRANCH_STATUS_META } from '@/lib/status';
import { Select } from '@/components/ui/select';
import { branchApi } from '@/services/branch.service';
import { equipmentApi } from '@/services/equipment.service';
import {
  Users,
  UserCheck,
  QrCode,
  DollarSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Clock3,
  TrendingUp,
  UserPlus,
  ReceiptText,
  PackagePlus,
  ChevronRight,
  Dumbbell,
  ShieldCheck,
  LogOut,
  BarChart3,
  Boxes,
  Wrench,
  AlertTriangle,
  Building2,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [memberCodeInput, setMemberCodeInput] = useState('');
  const [checkInMsg, setCheckInMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [branchFilter, setBranchFilter] = useState('ALL');

  // 1. Fetch dashboard summary + recent registrations + pending payments
  const { data: dashboardData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['reports-dashboard', branchFilter],
    queryFn: async () => {
      const res = await apiClient.get('/reports/dashboard', {
        params: branchFilter !== 'ALL' ? { branchId: branchFilter } : {},
      });
      return res.data;
    },
  });
  const summary = dashboardData?.stats;
  const recentRegistrations = dashboardData?.recentRegistrations || [];
  const pendingPaymentsDash = dashboardData?.pendingPayments || [];

  // 1b. Check-in theo giờ (biểu đồ hôm nay)
  const { data: hourlyData } = useQuery({
    queryKey: ['checkins-hourly-dash'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/checkins/hourly');
      return res.data;
    },
    refetchInterval: 30000,
    retry: 0,
  });

  // 1b. Cơ sở vật chất: branches (bộ lọc + overview) + equipment stats
  const { data: branches } = useQuery({ queryKey: ['branches-list'], queryFn: branchApi.list });
  const { data: equipmentStats } = useQuery({
    queryKey: ['equipment-stats'],
    queryFn: equipmentApi.stats,
  });
  const { data: branchOverview } = useQuery({
    queryKey: ['reports-branches'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/branches');
      return res.data?.data || [];
    },
  });

  // 2. Fetch live checkins
  const { data: checkIns, isLoading: isCheckInsLoading } = useQuery({
    queryKey: ['recent-checkins'],
    queryFn: async () => {
      const res = await apiClient.get('/checkins', { params: { page: 1, limit: 5 } });
      return res.data.data || [];
    },
    refetchInterval: 20000,
  });

  // 3. Quick CheckIn Mutation (lễ tân nhập mã thẻ → resolve member → staff check-in)
  const checkInMutation = useMutation({
    mutationFn: async (code: string) => {
      const found = await apiClient.get('/members', { params: { search: code, limit: 1 } });
      const member = found.data?.data?.[0];
      if (!member) {
        throw new Error('Không tìm thấy hội viên với mã này.');
      }
      const res = await apiClient.post('/checkins/staff', {
        memberId: member.id,
        method: 'STAFF',
      });
      return res.data;
    },
    onSuccess: (data) => {
      const info = data?.data || {};
      setCheckInMsg({
        type: 'success',
        text: `Hội viên ${info.member?.fullName || ''} (${info.member?.code || ''}) check-in thành công! ${
          info.membership?.packageName ? `Gói: ${info.membership.packageName}` : ''
        }`,
      });
      setMemberCodeInput('');
      queryClient.invalidateQueries({ queryKey: ['recent-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['checkins-inside'] });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message || err.message || 'Check-in thất bại. Kiểm tra mã thẻ.';
      setCheckInMsg({ type: 'error', text: msg });
    },
  });

  const handleQuickCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberCodeInput.trim()) return;
    checkInMutation.mutate(memberCodeInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-neon/30 p-6 md:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon/10 text-xs font-semibold mb-3 border border-neon/30 text-neon">
              <Sparkles className="size-3.5" />
              <span>Hệ thống Quản lý Vận hành GymMaster v1.0</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-chalk">
              Chào mừng trở lại trung tâm quản trị!
            </h1>
            <p className="text-muted text-sm mt-1 max-w-xl leading-relaxed">
              Theo dõi tình hình hội viên, lượt quét thẻ ra vào trong ngày và tình trạng vận hành
              thiết bị theo thời gian thực.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/checkins">
              <Button variant="secondary" size="md" className="text-xs">
                <QrCode className="size-4 mr-1.5" />
                Mở Máy Quét Check-in
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Branch filter bar */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted shrink-0">
              <Filter className="size-3.5 text-neon" />
              Bộ lọc chi nhánh
            </div>
            <Select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
              }}
              className="sm:max-w-xs h-9"
              options={[
                { value: 'ALL', label: 'Toàn hệ thống' },
                ...(branches || []).map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Hội Viên"
          value={isSummaryLoading ? '...' : (summary?.totalMembers ?? 0)}
          subtitle="Đã đăng ký tài khoản"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Hội Viên Đang Hoạt Động"
          value={isSummaryLoading ? '...' : (summary?.activeMembers ?? 0)}
          subtitle="Có thẻ tập còn hiệu lực"
          icon={UserCheck}
          colorScheme="neon"
        />
        <StatCard
          title="Hội Viên Hết Hạn"
          value={isSummaryLoading ? '...' : (summary?.expiredMembers ?? 0)}
          subtitle="Cần liên hệ gia hạn"
          icon={Clock}
          colorScheme="amber"
        />
        <StatCard
          title="Lượt Check-in Hôm Nay"
          value={isSummaryLoading ? '...' : (summary?.todayCheckIns ?? 0)}
          subtitle="Tính từ 00:00 sáng nay"
          icon={QrCode}
          colorScheme="purple"
        />
      </div>

      {/* Attendance snapshot + hourly chart */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard
          title="Đang Trong Phòng"
          value={isSummaryLoading ? '...' : (summary?.currentlyInside ?? 0)}
          subtitle="Hội viên đang tập, chưa check-out"
          icon={Users}
          colorScheme="neon"
        />
        <StatCard
          title="Check-out Hôm Nay"
          value={isSummaryLoading ? '...' : (summary?.todayCheckOuts ?? 0)}
          subtitle="Phiên tập đã kết thúc hôm nay"
          icon={LogOut}
          colorScheme="amber"
        />
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-neon" />
              Check-in theo giờ (hôm nay)
            </CardTitle>
            <Link
              href="/admin/checkins"
              className="text-xs font-semibold text-neon hover:underline flex items-center gap-1"
            >
              Chi tiết <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {!hourlyData ? (
              <div className="flex h-32 items-center justify-center text-xs text-muted">
                Đang tải dữ liệu...
              </div>
            ) : (
              <HourlyBars data={hourlyData.data || []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second row: doanh thu & pending */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Doanh Thu Tháng Này"
          value={isSummaryLoading ? '...' : formatCurrency(summary?.revenueThisMonth ?? 0)}
          subtitle="Hóa đơn đã xác nhận trong tháng"
          icon={DollarSign}
          colorScheme="neon"
        />
        <StatCard
          title="Tổng Doanh Thu"
          value={isSummaryLoading ? '...' : formatCurrency(summary?.totalRevenue ?? 0)}
          subtitle="Giao dịch xác nhận tích lũy"
          icon={TrendingUp}
          colorScheme="purple"
        />
        <Link href="/admin/payments">
          <StatCard
            title="Hóa Đơn Chờ Xác Nhận"
            value={isSummaryLoading ? '...' : (summary?.pendingPayments ?? 0)}
            subtitle="Cần thu ngân xử lý"
            icon={Clock3}
            colorScheme="amber"
          />
        </Link>
        <StatCard
          title="Hội Viên Mới (Tháng)"
          value={isSummaryLoading ? '...' : (summary?.newMembersThisMonth ?? 0)}
          subtitle={`Đăng ký trong tháng • ${summary?.pendingMemberships ?? 0} thẻ chờ xác nhận`}
          icon={UserPlus}
          colorScheme="blue"
        />
      </div>

      {/* Two Column Layout: Quick Check-in & Live Checkin Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Check-in Terminal Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2 text-neon">
              <QrCode className="size-5" />
              <CardTitle className="text-base font-bold">Quét Thẻ Check-in Nhanh</CardTitle>
            </div>
            <CardDescription>
              Nhập mã thẻ hội viên (hoặc quét barcode) để ghi nhận lượt tập ngay
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleQuickCheckIn} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Ví dụ: MEM-0001"
                  value={memberCodeInput}
                  onChange={(e) => setMemberCodeInput(e.target.value.toUpperCase())}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold h-12 rounded-sm border border-line bg-ink text-chalk placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70 uppercase transition-all"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 font-bold"
                isLoading={checkInMutation.isPending}
              >
                Xác nhận Check-in
              </Button>
            </form>

            {checkInMsg && (
              <div
                className={`p-3 rounded-sm text-xs flex items-start gap-2 ${
                  checkInMsg.type === 'success'
                    ? 'bg-neon/10 border border-neon/40 text-neon'
                    : 'bg-danger/10 border border-danger/40 text-danger'
                }`}
              >
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{checkInMsg.text}</span>
              </div>
            )}

            <div className="pt-3 border-t border-line text-xs text-muted space-y-1.5">
              <p className="font-semibold text-chalk">Gợi ý mã mẫu test:</p>
              <button
                type="button"
                onClick={() => setMemberCodeInput('MEM-0001')}
                className="px-2 py-1 rounded bg-line/70 font-mono text-[11px] text-muted hover:text-neon transition-colors"
              >
                MEM-0001 (Trần Minh Quân)
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Live Check-in Feed Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="size-4 text-neon" />
                Lượt Check-in Gần Đây
              </CardTitle>
              <CardDescription>Thời gian thực hội viên ra vào phòng tập</CardDescription>
            </div>
            <Link
              href="/admin/checkins"
              className="text-xs text-neon font-semibold hover:underline flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {isCheckInsLoading ? (
              <div className="py-8 text-center text-xs text-muted">
                Đang tải lịch sử check-in...
              </div>
            ) : checkIns && checkIns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                    <tr>
                      <th className="py-2.5 px-3">Hội viên</th>
                      <th className="py-2.5 px-3">Mã thẻ</th>
                      <th className="py-2.5 px-3">Chi nhánh</th>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-medium">
                    {checkIns.slice(0, 5).map((ci: any) => (
                      <tr key={ci.id} className="hover:bg-line/20 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-chalk">
                          {ci.member.fullName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neon">{ci.member.code}</td>
                        <td className="py-2.5 px-3 text-muted">{ci.branch.name}</td>
                        <td className="py-2.5 px-3 text-muted">{formatDateTime(ci.checkInTime)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge variant="success">ĐÃ VÀO CỔNG</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted border border-dashed rounded-xl border-line">
                Chưa có lượt check-in nào trong ngày hôm nay. Hãy quét mã thẻ bên cạnh để ghi nhận!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Registrations & Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PackagePlus className="size-4 text-neon" />
                Đăng Ký Gói Tập Gần Đây
              </CardTitle>
              <CardDescription>Các yêu cầu đăng ký / gia hạn mới nhất</CardDescription>
            </div>
            <Link
              href="/admin/memberships"
              className="text-xs text-neon font-semibold hover:underline flex items-center gap-1"
            >
              Quản lý <ChevronRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentRegistrations.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted">Chưa có đăng ký gói nào.</p>
            ) : (
              <div className="divide-y divide-line">
                {recentRegistrations.map((r: any) => {
                  const meta = MEMBERSHIP_STATUS_META[r.status] || {
                    label: r.status,
                    variant: 'outline',
                  };
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-line/20 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-chalk">
                          {r.member?.fullName}
                          <span className="ml-1.5 font-mono text-[11px] text-neon">
                            {r.member?.code}
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted">
                          {r.package?.name} • {formatDate(r.startDate)} → {formatDate(r.endDate)}
                        </p>
                      </div>
                      <Badge variant={meta.variant as any}>{meta.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ReceiptText className="size-4 text-neon" />
                Hóa Đơn Chờ Xác Nhận
              </CardTitle>
              <CardDescription>Thu ngân cần xác nhận để kích hoạt gói</CardDescription>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs text-neon font-semibold hover:underline flex items-center gap-1"
            >
              Thu ngân <ChevronRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingPaymentsDash.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted">
                🎉 Không còn hóa đơn nào chờ xác nhận.
              </p>
            ) : (
              <div className="divide-y divide-line">
                {pendingPaymentsDash.map((p: any) => {
                  const meta = PAYMENT_STATUS_META[p.status] || {
                    label: p.status,
                    variant: 'outline',
                  };
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-line/20 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-chalk">
                          {p.member?.fullName}
                        </p>
                        <p className="truncate text-xs text-muted">
                          <span className="font-mono text-chalk">{p.code}</span> •{' '}
                          {p.membership?.package?.name || 'Dịch vụ'}
                        </p>
                      </div>
                      <span className="font-bold text-neon">{formatCurrency(p.amount)}</span>
                      <Badge variant={meta.variant as any}>{meta.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cơ sở vật chất: thiết bị + tổng quan chi nhánh */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Boxes className="size-4 text-neon" />
                Tình Trạng Thiết Bị
              </CardTitle>
              <CardDescription>Trạng thái vận hành toàn hệ thống</CardDescription>
            </div>
            <Link
              href="/admin/equipment"
              className="text-xs text-neon font-semibold hover:underline flex items-center gap-1"
            >
              Quản lý <ChevronRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {!equipmentStats ? (
              <div className="py-8 text-center text-xs text-muted">
                Đang tải dữ liệu thiết bị...
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2">
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <Dumbbell className="size-3.5 text-neon" /> Tổng thiết bị
                  </span>
                  <span className="font-display font-bold text-chalk">{equipmentStats.total}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2">
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <CheckCircle2 className="size-3.5 text-neon" /> Sẵn sàng
                  </span>
                  <span className="font-display font-bold text-chalk">
                    {equipmentStats.available}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2">
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <Wrench className="size-3.5 text-amber-400" /> Đang bảo trì
                  </span>
                  <span className="font-display font-bold text-chalk">
                    {equipmentStats.maintenance}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2">
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <AlertTriangle className="size-3.5 text-danger" /> Hỏng
                  </span>
                  <span className="font-display font-bold text-chalk">{equipmentStats.broken}</span>
                </div>
                {(equipmentStats.alerts.overdue > 0 || equipmentStats.alerts.upcoming > 0) && (
                  <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400 space-y-0.5">
                    {equipmentStats.alerts.overdue > 0 && (
                      <p>⚠ {equipmentStats.alerts.overdue} thiết bị quá hạn bảo trì</p>
                    )}
                    {equipmentStats.alerts.upcoming > 0 && (
                      <p>🔧 {equipmentStats.alerts.upcoming} phiếu bảo trì trong 14 ngày tới</p>
                    )}
                    {equipmentStats.alerts.warrantyExpiring > 0 && (
                      <p>🗓 {equipmentStats.alerts.warrantyExpiring} thiết bị sắp hết bảo hành</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="size-4 text-neon" />
                Tổng Quan Chi Nhánh
              </CardTitle>
              <CardDescription>Vận hành theo từng cơ sở trong mạng lưới</CardDescription>
            </div>
            <Link
              href="/admin/branches"
              className="text-xs text-neon font-semibold hover:underline flex items-center gap-1"
            >
              Chi tiết <ChevronRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {!branchOverview || branchOverview.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">Chưa có dữ liệu chi nhánh.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                    <tr>
                      <th className="py-2.5 px-4">Chi nhánh</th>
                      <th className="py-2.5 px-4 text-center">Hội viên</th>
                      <th className="py-2.5 px-4 text-center">Thẻ hiệu lực</th>
                      <th className="py-2.5 px-4 text-center">Phòng</th>
                      <th className="py-2.5 px-4 text-center">Thiết bị</th>
                      <th className="py-2.5 px-4 text-center">Check-in HN</th>
                      <th className="py-2.5 px-4 text-right">Doanh thu T.Này</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {branchOverview.map((b: any) => {
                      const meta = BRANCH_STATUS_META[b.status] || {
                        label: b.status,
                        variant: 'outline',
                      };
                      return (
                        <tr key={b.id} className="hover:bg-line/20 transition-colors">
                          <td className="py-2.5 px-4">
                            <Link href={`/admin/branches/${b.id}`} className="hover:opacity-90">
                              <div className="font-semibold text-chalk flex items-center gap-2">
                                {b.name}
                                <Badge variant={meta.variant as any}>{meta.label}</Badge>
                              </div>
                              <p className="font-mono text-[10px] text-neon">{b.code}</p>
                            </Link>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-chalk">
                            {b.members}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-chalk">
                            {b.activeMembers}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-muted">
                            {b.rooms}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-muted">
                            {b.equipment}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-neon">
                            {b.checkInsToday}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-chalk">
                            {formatCurrency(b.revenueThisMonth)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/members"
          className="p-4 rounded-xl border border-line bg-surface hover:border-neon/40 transition-colors group"
        >
          <Users className="size-5 text-muted group-hover:text-neon mb-2 transition-colors" />
          <h4 className="font-bold text-sm text-chalk">Quản lý Hội viên</h4>
          <p className="text-xs text-muted mt-0.5">Danh sách, tạo mới, gia hạn thẻ</p>
        </Link>
        <Link
          href="/admin/membership-packages"
          className="p-4 rounded-xl border border-line bg-surface hover:border-neon/40 transition-colors group"
        >
          <Dumbbell className="size-5 text-muted group-hover:text-neon mb-2 transition-colors" />
          <h4 className="font-bold text-sm text-chalk">Gói tập Gym</h4>
          <p className="text-xs text-muted mt-0.5">Cấu hình thời hạn & giá gói</p>
        </Link>
        <Link
          href="/admin/payments"
          className="p-4 rounded-xl border border-line bg-surface hover:border-neon/40 transition-colors group"
        >
          <DollarSign className="size-5 text-muted group-hover:text-neon mb-2 transition-colors" />
          <h4 className="font-bold text-sm text-chalk">Thu ngân & Hoá đơn</h4>
          <p className="text-xs text-muted mt-0.5">Theo dõi lịch sử thanh toán</p>
        </Link>
        <Link
          href="/admin/reports"
          className="p-4 rounded-xl border border-line bg-surface hover:border-neon/40 transition-colors group"
        >
          <ShieldCheck className="size-5 text-muted group-hover:text-neon mb-2 transition-colors" />
          <h4 className="font-bold text-sm text-chalk">Báo cáo & Phân tích</h4>
          <p className="text-xs text-muted mt-0.5">Biểu đồ doanh thu và vận hành</p>
        </Link>
      </div>
    </div>
  );
}

interface HourlyBarsProps {
  data: { hour: number; count: number }[];
}

/** Biểu đồ cột đơn giản: lượt check-in theo giờ (0-23) */
function HourlyBars({ data }: HourlyBarsProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-28 items-end gap-[3px]">
      {data.map((d) => {
        const h = d.hour;
        const height = d.count > 0 ? Math.max(12, Math.round((d.count / max) * 100)) : 3;
        return (
          <div
            key={h}
            className="group/flex flex-1 flex flex-col items-center justify-end"
            title={`${String(h).padStart(2, '0')}:00 — ${d.count} lượt`}
          >
            <span className="mb-1 text-[9px] font-mono font-semibold text-chalk opacity-0 transition-opacity group-hover/flex:opacity-100">
              {d.count}
            </span>
            <div
              className={`w-full rounded-t-sm transition-all ${
                d.count > 0 ? 'bg-neon/80 hover:bg-neon' : 'bg-line/50'
              }`}
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
