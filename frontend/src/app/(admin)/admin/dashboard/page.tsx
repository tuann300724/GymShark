'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { AnimatedNumber, StaggerGroup, StaggerItem, RevealFx } from '@/components/ui/motion';
import { formatCurrency, formatDateTime, formatDate, formatTime, cn } from '@/lib/utils';
import { MEMBERSHIP_STATUS_META, PAYMENT_STATUS_META } from '@/lib/status';
import {
  Users,
  UserCheck,
  QrCode,
  DollarSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  ReceiptText,
  PackagePlus,
  Dumbbell,
  LogOut,
  BarChart3,
  AlertTriangle,
  RotateCw,
  ScanFace,
  Calendar,
  Award,
  ArrowUpRight,
  CreditCard,
  X,
  Activity,
  ChevronRight,
  Flame,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [memberCodeInput, setMemberCodeInput] = useState('');
  const [activeActionTab, setActiveActionTab] = useState<'pending' | 'registrations'>('pending');
  const [todayFormatted, setTodayFormatted] = useState('');
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [checkInMsg, setCheckInMsg] = useState<{
    type: 'success' | 'error';
    text: string;
    member?: any;
    packageName?: string;
  } | null>(null);

  // Cập nhật ngày & giờ client-side để tránh lệch hydration
  useEffect(() => {
    const d = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    setTodayFormatted(`${days[d.getDay()]}, ${formatDate(d)}`);
    setCurrentHour(d.getHours());

    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch dashboard summary + recent registrations + pending payments
  const {
    data: dashboardData,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
  } = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/dashboard');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const summary = dashboardData?.stats;
  const recentRegistrations = dashboardData?.recentRegistrations || [];
  const pendingPaymentsDash = dashboardData?.pendingPayments || [];

  // 1b. Check-in theo giờ (hôm nay)
  const {
    data: hourlyData,
    isLoading: isHourlyLoading,
    isFetching: isHourlyFetching,
  } = useQuery({
    queryKey: ['checkins-hourly-dash'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/checkins/hourly');
      return res.data;
    },
    refetchInterval: 30000,
    retry: 0,
  });

  // 2. Fetch live check-in feed
  const {
    data: checkIns,
    isLoading: isCheckInsLoading,
    isFetching: isCheckInsFetching,
  } = useQuery({
    queryKey: ['recent-checkins'],
    queryFn: async () => {
      const res = await apiClient.get('/checkins', { params: { page: 1, limit: 6 } });
      return res.data.data || [];
    },
    refetchInterval: 15000,
  });

  const isAnyRefetching = isSummaryFetching || isHourlyFetching || isCheckInsFetching;

  // Xử lý làm mới toàn bộ dữ liệu
  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['checkins-hourly-dash'] }),
      queryClient.invalidateQueries({ queryKey: ['recent-checkins'] }),
    ]);
  };

  // 3. Quick CheckIn Mutation (lễ tân nhập mã thẻ/hội viên)
  const checkInMutation = useMutation({
    mutationFn: async (code: string) => {
      const found = await apiClient.get('/members', { params: { search: code, limit: 1 } });
      const member = found.data?.data?.[0];
      if (!member) {
        throw new Error('Không tìm thấy hội viên với mã thẻ hoặc số điện thoại này.');
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
        text: `Check-in thành công cho ${info.member?.fullName || 'hội viên'}!`,
        member: info.member,
        packageName: info.membership?.packageName,
      });
      setMemberCodeInput('');
      queryClient.invalidateQueries({ queryKey: ['recent-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['checkins-hourly-dash'] });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Check-in không thành công. Vui lòng kiểm tra lại mã thẻ.';
      setCheckInMsg({ type: 'error', text: msg });
    },
  });

  const handleQuickCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberCodeInput.trim()) return;
    checkInMutation.mutate(memberCodeInput.trim());
  };

  // Chuẩn hóa dữ liệu 24 giờ cho biểu đồ
  const fullHoursData = useMemo(() => {
    const map = new Map<number, number>();
    (hourlyData?.data || []).forEach((d: { hour: number; count: number }) => {
      map.set(d.hour, d.count);
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: map.get(i) || 0,
    }));
  }, [hourlyData]);

  const peakHour = useMemo(() => {
    return fullHoursData.reduce((max, curr) => (curr.count > max.count ? curr : max), {
      hour: 0,
      count: 0,
    });
  }, [fullHoursData]);

  // Tổng số việc đang chờ xử lý
  const pendingTasksTotal = (summary?.pendingPayments ?? 0) + (summary?.pendingMemberships ?? 0);

  return (
    <div className="container mx-auto px-4 space-y-6 overflow-x-hidden pb-10">
      {/* ========================================================================= */}
      {/* 1. HERO COMMAND BANNER (Thanh điều hành thông minh) */}
      {/* ========================================================================= */}
      <RevealFx delay={0}>
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-all hover:border-line">
          {/* Subtle background glow effect (chỉ 1 đốm mờ, không tràn lan) */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-neon/5 blur-3xl"
            aria-hidden
          />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              {/* Eyebrow status */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-neon/10 px-3 py-0.5 text-xs font-semibold text-neon">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-neon opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-neon" />
                  </span>
                  <span>Hệ thống trực tuyến</span>
                </div>
                {todayFormatted && (
                  <span className="text-xs font-medium text-muted">• {todayFormatted}</span>
                )}
              </div>

              {/* Title & subtitle */}
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-chalk sm:text-3xl lg:text-4xl">
                Trung tâm Điều hành & Quản trị
              </h1>
              <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-muted">
                Giám sát lưu lượng vào ra theo thời gian thực, quản lý hội viên, xử lý hóa đơn thu
                ngân và theo dõi hiệu suất vận hành toàn hệ thống.
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={handleRefresh}
                disabled={isAnyRefetching}
                className="h-10 border-line bg-ink text-xs font-semibold text-chalk hover:border-neon/40 hover:text-neon transition-all"
                title="Làm mới toàn bộ dữ liệu"
              >
                <RotateCw
                  className={cn(
                    'mr-1.5 size-3.5 transition-transform',
                    isAnyRefetching && 'animate-spin text-neon',
                  )}
                />
                <span>Làm mới</span>
              </Button>

              <Link href="/admin/checkins/face-scan">
                <Button
                  variant="outline"
                  size="md"
                  className="h-10 border-line bg-ink text-xs font-semibold text-chalk hover:border-neon/40 hover:text-neon transition-all"
                >
                  <ScanFace className="mr-1.5 size-4 text-neon" />
                  Quét Face ID
                </Button>
              </Link>

              <Link href="/admin/checkins">
                <Button
                  variant="primary"
                  size="md"
                  className="h-10 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                >
                  <QrCode className="mr-1.5 size-4" />
                  Máy Quét Check-in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </RevealFx>

      {/* ========================================================================= */}
      {/* 2. 4 EXECUTIVE KPI CARDS (Cân đối 4 cột chuẩn - có AnimatedNumber & Sub-metrics) */}
      {/* ========================================================================= */}
      <RevealFx delay={0}>
        <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1: Check-in hôm nay */}
          <StaggerItem>
            <Link href="/admin/checkins" className="group block h-full">
              <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:border-neon/40 group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.35)]">
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        Lượt Check-in Hôm Nay
                      </p>
                      <div className="rounded-xl border border-neon/30 bg-neon/10 p-2 text-neon transition-colors group-hover:bg-neon/20">
                        <QrCode className="size-4" />
                      </div>
                    </div>

                    <div className="mt-2 flex items-baseline gap-2">
                      <h3 className="font-display text-3xl font-black tracking-tight text-chalk">
                        {isSummaryLoading ? (
                          '--'
                        ) : (
                          <AnimatedNumber value={summary?.todayCheckIns ?? 0} />
                        )}
                      </h3>
                      <span className="text-xs text-muted">lượt vào</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-neon">
                      <span className="size-1.5 rounded-full bg-neon animate-pulse" />
                      {isSummaryLoading ? '--' : (summary?.currentlyInside ?? 0)} đang tập
                    </span>
                    <span className="text-muted">•</span>
                    <span className="text-muted">
                      {isSummaryLoading ? '--' : (summary?.todayCheckOuts ?? 0)} đã check-out
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>

          {/* KPI 2: Quy mô hội viên */}
          <StaggerItem>
            <Link href="/admin/members" className="group block h-full">
              <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:border-neon/40 group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.35)]">
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        Hội Viên Hoạt Động
                      </p>
                      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-2 text-sky-400 transition-colors group-hover:bg-sky-500/20">
                        <Users className="size-4" />
                      </div>
                    </div>

                    <div className="mt-2 flex items-baseline gap-2">
                      <h3 className="font-display text-3xl font-black tracking-tight text-chalk">
                        {isSummaryLoading ? (
                          '--'
                        ) : (
                          <AnimatedNumber value={summary?.activeMembers ?? 0} />
                        )}
                      </h3>
                      <span className="text-xs text-muted">thẻ còn hạn</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3 text-xs">
                    <span className="font-medium text-chalk">
                      {isSummaryLoading ? '--' : (summary?.totalMembers ?? 0)} tổng đăng ký
                    </span>
                    <span className="text-muted">•</span>
                    <span className="font-semibold text-amber-400">
                      {isSummaryLoading ? '--' : (summary?.expiredMembers ?? 0)} hết hạn
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>

          {/* KPI 3: Doanh thu tháng */}
          <StaggerItem>
            <Link href="/admin/reports/revenue" className="group block h-full">
              <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:border-neon/40 group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.35)]">
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        Doanh Thu Tháng Này
                      </p>
                      <div className="rounded-xl border border-neon/30 bg-neon/10 p-2 text-neon transition-colors group-hover:bg-neon/20">
                        <DollarSign className="size-4" />
                      </div>
                    </div>

                    <div className="mt-2 flex items-baseline gap-1.5">
                      <h3 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-neon">
                        {isSummaryLoading ? '--' : formatCurrency(summary?.revenueThisMonth ?? 0)}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3 text-xs">
                    <span className="text-muted">
                      Tổng: {isSummaryLoading ? '--' : formatCurrency(summary?.totalRevenue ?? 0)}
                    </span>
                    <span className="text-muted">•</span>
                    <span className="font-semibold text-chalk">
                      +{isSummaryLoading ? '--' : (summary?.newMembersThisMonth ?? 0)} HV mới
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>

          {/* KPI 4: Tác vụ cần xử lý */}
          <StaggerItem>
            <Link href="/admin/payments" className="group block h-full">
              <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:border-neon/40 group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.35)]">
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        Tác Vụ Cần Xử Lý
                      </p>
                      <div
                        className={cn(
                          'rounded-xl border p-2 transition-colors',
                          pendingTasksTotal > 0
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20'
                            : 'border-neon/30 bg-neon/10 text-neon group-hover:bg-neon/20',
                        )}
                      >
                        {pendingTasksTotal > 0 ? (
                          <AlertTriangle className="size-4" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-baseline gap-2">
                      <h3
                        className={cn(
                          'font-display text-3xl font-black tracking-tight',
                          pendingTasksTotal > 0 ? 'text-amber-400' : 'text-neon',
                        )}
                      >
                        {isSummaryLoading ? '--' : <AnimatedNumber value={pendingTasksTotal} />}
                      </h3>
                      <span className="text-xs text-muted">yêu cầu chờ</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3 text-xs">
                    <span className="font-semibold text-amber-400">
                      {isSummaryLoading ? '--' : (summary?.pendingPayments ?? 0)} hoá đơn
                    </span>
                    <span className="text-muted">•</span>
                    <span className="text-muted">
                      {isSummaryLoading ? '--' : (summary?.pendingMemberships ?? 0)} thẻ chờ duyệt
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>
        </StaggerGroup>
      </RevealFx>

      {/* ========================================================================= */}
      {/* 3. VẬN HÀNH CHECK-IN & BIỂU ĐỒ MẬT ĐỘ THEO GIỜ (Bố cục 12 cột cân xứng) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CỘT TRÁI: Quầy Check-in Siêu Tốc (5/12 cột) */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="flex-1 flex flex-col justify-between">
            <div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-neon/30 bg-neon/10 p-1.5 text-neon">
                      <QrCode className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Quét Thẻ Check-in Nhanh</CardTitle>
                      <CardDescription className="text-xs">
                        Nhập mã thẻ hội viên hoặc số điện thoại
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] text-muted">
                    QUẦY LỄ TÂN
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <form onSubmit={handleQuickCheckIn} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="VD: MEM-0001 HOẶC SĐT"
                      value={memberCodeInput}
                      onChange={(e) => setMemberCodeInput(e.target.value.toUpperCase())}
                      className="h-12 w-full rounded-xl border border-line bg-ink px-4 text-center font-mono text-base font-bold tracking-widest text-chalk placeholder:text-muted/50 focus:border-neon/60 focus:outline-none focus:ring-2 focus:ring-neon/30 uppercase transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="h-11 w-full font-bold text-xs sm:text-sm tracking-wide shadow-sm active:scale-[0.98]"
                    isLoading={checkInMutation.isPending}
                  >
                    Xác nhận Check-in Ngay
                  </Button>
                </form>

                {/* Kết quả Check-in */}
                {checkInMsg && (
                  <div
                    className={cn(
                      'relative overflow-hidden rounded-xl border p-3.5 text-xs transition-all animate-fadeIn',
                      checkInMsg.type === 'success'
                        ? 'border-neon/40 bg-neon/10 text-chalk'
                        : 'border-danger/40 bg-danger/10 text-danger',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setCheckInMsg(null)}
                      className="absolute right-2 top-2 p-1 text-muted hover:text-chalk"
                      title="Đóng thông báo"
                    >
                      <X className="size-3.5" />
                    </button>

                    <div className="flex items-start gap-2.5">
                      {checkInMsg.type === 'success' ? (
                        <CheckCircle2 className="size-4 shrink-0 text-neon mt-0.5" />
                      ) : (
                        <AlertTriangle className="size-4 shrink-0 text-danger mt-0.5" />
                      )}
                      <div className="space-y-0.5 min-w-0 pr-4">
                        <p className="font-bold">{checkInMsg.text}</p>
                        {checkInMsg.member && (
                          <p className="text-[11px] text-muted font-mono truncate">
                            Mã: <span className="text-neon">{checkInMsg.member.code}</span> • SĐT:{' '}
                            {checkInMsg.member.phone || '--'}
                            {checkInMsg.packageName ? ` • Gói: ${checkInMsg.packageName}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gợi ý mã mẫu test */}
                <div className="rounded-xl border border-line/60 bg-ink/50 p-3 text-xs space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Mã thẻ mẫu kiểm tra nhanh:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['MEM-0001', 'MEM-0002', 'MEM-0003'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setMemberCodeInput(code)}
                        className="rounded-lg border border-line bg-surface px-2.5 py-1 font-mono text-[11px] font-semibold text-muted hover:border-neon/40 hover:text-neon transition-colors"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </div>

            {/* Chân thẻ: Lối tắt công cụ check-in */}
            <div className="border-t border-line p-4 sm:p-5 flex items-center justify-between text-xs">
              <Link
                href="/admin/checkins/face-scan"
                className="inline-flex items-center gap-1.5 font-semibold text-chalk hover:text-neon transition-colors"
              >
                <ScanFace className="size-4 text-neon" />
                Mở camera Face ID
              </Link>
              <Link
                href="/admin/checkins"
                className="inline-flex items-center gap-1 font-semibold text-neon hover:underline"
              >
                Xem chi tiết lịch sử <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* CỘT PHẢI: Biểu đồ mật độ Check-in theo giờ (7/12 cột) */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="flex-1 flex flex-col justify-between overflow-hidden">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b border-line">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="size-4 text-neon" />
                  Mật Độ Ra Vào Theo Giờ (Hôm Nay)
                </CardTitle>
                <CardDescription className="text-xs">
                  Phân bổ lượt check-in theo từng khung giờ và công suất phòng tập
                </CardDescription>
              </div>

              {peakHour.count > 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-[11px] font-semibold text-neon">
                  <Flame className="size-3 text-neon" />
                  <span>
                    Cao điểm: {String(peakHour.hour).padStart(2, '0')}:00 ({peakHour.count} lượt)
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink px-3 py-1 text-[11px] font-medium text-muted">
                  <Clock className="size-3 text-neon" />
                  <span>Giờ mở cửa: 05:30 - 22:30</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-4 pb-2 space-y-4">
              {/* Thước đo công suất phòng tập thời gian thực */}
              <div className="rounded-xl border border-line bg-ink/60 p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-neon opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-neon" />
                    </span>
                    <span className="font-bold text-chalk">Công suất phòng tập:</span>
                    <span className="font-mono font-bold text-neon">
                      {summary?.currentlyInside ?? 0}
                    </span>
                    <span className="text-muted">/ 100 sức chứa thiết kế</span>
                  </div>

                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                      (summary?.currentlyInside ?? 0) < 35
                        ? 'border-neon/30 bg-neon/10 text-neon'
                        : (summary?.currentlyInside ?? 0) < 75
                          ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                    )}
                  >
                    {(summary?.currentlyInside ?? 0) < 35
                      ? 'Phòng thông thoáng'
                      : (summary?.currentlyInside ?? 0) < 75
                        ? 'Lưu lượng ổn định'
                        : 'Đông đúc / Cao điểm'}
                  </span>
                </div>

                {/* Progress bar neon */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-line/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon/70 to-neon transition-all duration-700 shadow-[0_0_8px_rgba(183,255,0,0.5)]"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(3, ((summary?.currentlyInside ?? 0) / 100) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Biểu đồ phân bổ 24h có đường kẻ grid, track cột và highlight giờ hiện tại */}
              {isHourlyLoading ? (
                <div className="flex h-44 items-center justify-center gap-2 text-xs text-muted">
                  <Spinner /> Đang tải dữ liệu biểu đồ...
                </div>
              ) : (
                <EnhancedHourlyChart
                  data={fullHoursData}
                  currentHour={currentHour}
                  totalToday={summary?.todayCheckIns ?? 0}
                />
              )}
            </CardContent>

            {/* Chân biểu đồ: 3 thẻ telemetry viền bo tròn sang trọng */}
            <div className="border-t border-line/60 bg-ink/40 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Thẻ 1: Đang trong phòng */}
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/90 p-3 transition-colors hover:border-neon/30">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-neon/30 bg-neon/10 text-neon">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    Đang trong phòng
                  </p>
                  <p className="font-display text-xl font-black text-neon">
                    <AnimatedNumber value={summary?.currentlyInside ?? 0} />
                    <span className="ml-1 text-[11px] font-normal text-muted">người</span>
                  </p>
                </div>
              </div>

              {/* Thẻ 2: Tổng check-in */}
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/90 p-3 transition-colors hover:border-sky-500/30">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400">
                  <QrCode className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    Tổng check-in
                  </p>
                  <p className="font-display text-xl font-black text-chalk">
                    <AnimatedNumber value={summary?.todayCheckIns ?? 0} />
                    <span className="ml-1 text-[11px] font-normal text-muted">lượt</span>
                  </p>
                </div>
              </div>

              {/* Thẻ 3: Đã check-out */}
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/90 p-3 transition-colors hover:border-amber-500/30">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <LogOut className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    Đã check-out
                  </p>
                  <p className="font-display text-xl font-black text-muted">
                    <AnimatedNumber value={summary?.todayCheckOuts ?? 0} />
                    <span className="ml-1 text-[11px] font-normal text-muted">phiên</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DÒNG SỰ KIỆN THỜI GIAN THỰC & HÀNG CHỜ DUYỆT (2 Cột cân bằng 50-50) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* BÊN TRÁI: Lượt check-in vừa qua (Live Feed) */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-line">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="size-4 text-neon" />
                Lượt Check-in Mới Nhất
              </CardTitle>
              <CardDescription className="text-xs">
                Thời gian thực hội viên quét thẻ hoặc nhận diện khuôn mặt
              </CardDescription>
            </div>
            <Link
              href="/admin/checkins"
              className="text-xs font-semibold text-neon hover:underline flex items-center gap-1"
            >
              Toàn bộ <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {isCheckInsLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted">
                <Spinner /> Đang tải lịch sử check-in...
              </div>
            ) : checkIns && checkIns.length > 0 ? (
              <div className="divide-y divide-line">
                {checkIns.slice(0, 5).map((ci: any) => {
                  const methodInfo = getMethodBadge(ci.method);
                  const MethodIcon = methodInfo.icon;
                  return (
                    <div
                      key={ci.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-line/25"
                    >
                      {/* Avatar initials & member info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-ink font-display text-xs font-bold text-neon">
                          {getInitials(ci.member?.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs sm:text-sm font-bold text-chalk">
                            {ci.member?.fullName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted">
                            <span className="font-mono text-[11px] text-neon">
                              {ci.member?.code}
                            </span>
                            <span>•</span>
                            <span>{formatTime(ci.checkInTime)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Method badge & relative time */}
                      <div className="flex items-center gap-2.5 shrink-0 text-right">
                        <span
                          className={cn(
                            'hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                            methodInfo.className,
                          )}
                        >
                          <MethodIcon className="size-3" />
                          {methodInfo.label}
                        </span>
                        <Badge variant="success" className="text-[10px]">
                          VÀO CỔNG
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                className="py-10"
                icon={QrCode}
                title="Chưa có lượt check-in hôm nay"
                description="Hôm nay chưa ghi nhận lượt vào nào. Nhập mã thẻ ở quầy bên trên để ghi nhận lượt tập."
              />
            )}
          </CardContent>
        </Card>

        {/* BÊN PHẢI: Hàng chờ duyệt & Đăng ký gói mới (Có Tabs chuyển đổi tiện lợi) */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b border-line space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ReceiptText className="size-4 text-neon" />
                  Nghiệp Vụ Cần Xử Lý
                </CardTitle>
                <CardDescription className="text-xs">
                  Hóa đơn thu ngân chờ duyệt và đăng ký gói tập gần đây
                </CardDescription>
              </div>

              <Link
                href={activeActionTab === 'pending' ? '/admin/payments' : '/admin/memberships'}
                className="text-xs font-semibold text-neon hover:underline flex items-center gap-1"
              >
                Mở quản lý <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {/* Tabs chọn danh sách */}
            <Tabs
              tabs={[
                {
                  value: 'pending',
                  label: 'Hóa đơn chờ duyệt',
                  count: pendingPaymentsDash.length,
                },
                {
                  value: 'registrations',
                  label: 'Đăng ký mới',
                  count: recentRegistrations.length,
                },
              ]}
              value={activeActionTab}
              onChange={(v) => setActiveActionTab(v as any)}
              fill
            />
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {activeActionTab === 'pending' ? (
              // Tab 1: Hóa đơn chờ xác nhận
              pendingPaymentsDash.length === 0 ? (
                <EmptyState
                  className="py-10"
                  icon={CheckCircle2}
                  title="Không có hóa đơn chờ"
                  description="Toàn bộ hóa đơn thanh toán đã được xử lý xong."
                />
              ) : (
                <div className="divide-y divide-line">
                  {pendingPaymentsDash.slice(0, 5).map((p: any) => {
                    const meta = PAYMENT_STATUS_META[p.status] || {
                      label: p.status,
                      variant: 'outline',
                    };
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-line/25"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs sm:text-sm font-bold text-chalk">
                            {p.member?.fullName}
                          </p>
                          <p className="truncate text-xs text-muted">
                            <span className="font-mono text-chalk">{p.code}</span> •{' '}
                            {p.membership?.package?.name || 'Dịch vụ Gym'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-xs sm:text-sm font-bold text-neon">
                            {formatCurrency(p.amount)}
                          </span>
                          <Link href={`/admin/payments/${p.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-line px-2.5 text-[11px] font-semibold text-chalk hover:border-neon/40 hover:text-neon"
                            >
                              Duyệt
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : // Tab 2: Đăng ký gói tập gần đây
            recentRegistrations.length === 0 ? (
              <EmptyState
                className="py-10"
                icon={PackagePlus}
                title="Chưa có đăng ký mới"
                description="Các yêu cầu đăng ký hoặc gia hạn thẻ tập sẽ xuất hiện tại đây."
              />
            ) : (
              <div className="divide-y divide-line">
                {recentRegistrations.slice(0, 5).map((r: any) => {
                  const meta = MEMBERSHIP_STATUS_META[r.status] || {
                    label: r.status,
                    variant: 'outline',
                  };
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-line/25"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs sm:text-sm font-bold text-chalk">
                          {r.member?.fullName}
                          <span className="ml-1.5 font-mono text-[11px] text-neon">
                            {r.member?.code}
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted">
                          {r.package?.name} • {formatDate(r.startDate)} → {formatDate(r.endDate)}
                        </p>
                      </div>
                      <Badge variant={meta.variant as any} className="text-[10px]">
                        {meta.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 5. TRUNG TÂM PHÍM TẮT ĐIỀU HÀNH (6 Phân hệ - Hover effect mượt mà) */}
      {/* ========================================================================= */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Truy Cập Nhanh Các Phân Hệ Quản Lý
          </h3>
          <span className="text-xs text-muted">6 phân hệ cốt lõi</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickActionCard
            title="Hội Viên"
            description="Hồ sơ & gia hạn"
            icon={Users}
            href="/admin/members"
          />
          <QuickActionCard
            title="Gói Tập Gym"
            description="Bảng giá & quyền lợi"
            icon={Dumbbell}
            href="/admin/membership-packages"
          />
          <QuickActionCard
            title="Thu Ngân"
            description="Hóa đơn & thu phí"
            icon={DollarSign}
            href="/admin/payments"
          />
          <QuickActionCard
            title="Lịch Tập PT"
            description="Phân ca & buổi tập"
            icon={Calendar}
            href="/admin/schedules"
          />
          <QuickActionCard
            title="Huấn Luyện Viên"
            description="Đội ngũ PT chuyên môn"
            icon={Award}
            href="/admin/trainers"
          />
          <QuickActionCard
            title="Báo Cáo"
            description="Doanh thu & xuất CSV"
            icon={BarChart3}
            href="/admin/reports"
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS & HELPERS
// =============================================================================

/** Thẻ phím tắt điều hướng nhanh có hover lift & glow */
function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-neon/40 hover:shadow-[0_8px_25px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-start justify-between">
        <div className="rounded-xl border border-line bg-ink p-2.5 text-muted transition-colors group-hover:border-neon/30 group-hover:text-neon">
          <Icon className="size-4" />
        </div>
        <ArrowUpRight className="size-3.5 text-muted/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neon" />
      </div>

      <div className="mt-4">
        <h4 className="text-xs sm:text-sm font-bold text-chalk transition-colors group-hover:text-neon">
          {title}
        </h4>
        <p className="mt-0.5 text-[11px] text-muted truncate">{description}</p>
      </div>
    </Link>
  );
}

/** Biểu đồ mật độ check-in theo giờ (00:00 - 23:00) với thước đo đường lưới, telemetry track & highlight giờ hiện tại */
function EnhancedHourlyChart({
  data,
  currentHour,
  totalToday,
}: {
  data: { hour: number; count: number }[];
  currentHour: number;
  totalToday: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const yLabels = max > 1 ? [max, Math.round(max / 2), 0] : [5, 2, 0];

  return (
    <div className="space-y-3">
      {/* Khung biểu đồ chính có đường lưới phụ trợ */}
      <div className="relative pt-6 pb-1">
        {/* Đường lưới ngang hỗ trợ đo lường (Horizontal Guide Lines) */}
        <div className="pointer-events-none absolute inset-x-0 inset-y-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-dashed border-line/40">
            <span className="font-mono text-[9px] text-muted/60">{yLabels[0]}</span>
          </div>
          <div className="flex items-center gap-2 border-b border-dashed border-line/30">
            <span className="font-mono text-[9px] text-muted/60">{yLabels[1]}</span>
          </div>
          <div className="flex items-center gap-2 border-b border-line/50">
            <span className="font-mono text-[9px] text-muted/60">{yLabels[2]}</span>
          </div>
        </div>

        {/* 24 Cột biểu đồ dạng equalizer telemetry */}
        <div className="relative z-10 flex h-40 items-end gap-[3px] sm:gap-1.5 pl-6">
          {data.map((d) => {
            const h = d.hour;
            const isCurrent = h === currentHour;
            const heightPercent = d.count > 0 ? Math.max(16, Math.round((d.count / max) * 100)) : 0;

            return (
              <div
                key={h}
                className={cn(
                  'group/col relative flex h-full flex-1 flex-col items-center justify-end rounded-t-md transition-colors',
                  isCurrent && 'bg-neon/[0.08] border-x border-t border-neon/30',
                )}
              >
                {/* Tooltip khi hover */}
                <div className="pointer-events-none absolute -top-10 z-30 hidden whitespace-nowrap rounded-lg border border-line bg-ink px-2.5 py-1 text-xs text-chalk shadow-xl group-hover/col:block animate-fade-in">
                  <span className="font-mono font-bold text-neon">{d.count}</span> lượt •{' '}
                  <span className="font-medium">
                    {String(h).padStart(2, '0')}:00 - {String(h + 1).padStart(2, '0')}:00
                  </span>
                  {isCurrent && <span className="ml-1 text-neon font-bold">(Hiện tại)</span>}
                </div>

                {/* Track thanh cột full-height */}
                <div className="relative flex size-full max-w-[12px] flex-col justify-end items-center rounded-t-full bg-line/25 p-px">
                  {d.count > 0 ? (
                    <div
                      className="w-full rounded-t-full bg-gradient-to-t from-neon/50 via-neon/80 to-neon transition-all duration-500 shadow-[0_0_10px_rgba(183,255,0,0.4)] group-hover/col:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-full rounded-full transition-colors',
                        isCurrent ? 'h-1.5 bg-neon/80' : 'h-1 bg-line/60',
                      )}
                    />
                  )}
                </div>

                {/* Chấm tròn nhỏ cho giờ hiện tại nằm ngay dưới chân cột */}
                {isCurrent && <span className="mt-1 size-1.5 rounded-full bg-neon animate-pulse" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trục mốc thời gian bên dưới */}
      <div className="flex justify-between pl-6 text-[10px] font-mono text-muted border-t border-line/60 pt-2">
        {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:00'].map((time) => {
          const hourVal = parseInt(time.split(':')[0], 10);
          const isNearCurrent = Math.abs(currentHour - hourVal) <= 1;
          return (
            <span
              key={time}
              className={cn(
                'transition-colors',
                isNearCurrent ? 'text-neon font-bold' : 'text-muted',
              )}
            >
              {time}
            </span>
          );
        })}
      </div>

      {/* Phân vùng ca tập trong ngày */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink/40 px-3 py-1.5 text-[10px] text-muted border border-line/40">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-sky-400" />
          <span>Ca Sáng: 05:30 - 11:30</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400" />
          <span>Ca Chiều: 11:30 - 17:00</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-neon" />
          <span>Giờ Vàng (Cao Điểm): 17:00 - 21:30</span>
        </div>
      </div>

      {/* Thông báo sẵn sàng nếu hôm nay chưa có lượt check-in */}
      {totalToday === 0 && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-line/50 bg-ink/30 py-2 text-center text-xs text-muted">
          <Clock className="size-3.5 text-neon" />
          <span>Hệ thống điểm danh đã sẵn sàng đón lượt check-in đầu tiên trong ngày.</span>
        </div>
      )}
    </div>
  );
}

/** Lấy chữ cái đầu đại diện avatar */
function getInitials(name?: string) {
  if (!name) return 'HV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Lấy cấu hình nhãn + icon cho phương thức check-in */
function getMethodBadge(method: string) {
  switch (method) {
    case 'FACE_ID':
      return {
        label: 'Face ID',
        icon: ScanFace,
        className: 'border-neon/30 bg-neon/10 text-neon',
      };
    case 'QR':
      return {
        label: 'Mã QR',
        icon: QrCode,
        className: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
      };
    case 'CARD':
      return {
        label: 'Thẻ từ',
        icon: CreditCard,
        className: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
      };
    case 'STAFF':
      return {
        label: 'Lễ tân',
        icon: UserCheck,
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      };
    default:
      return {
        label: method || 'Thủ công',
        icon: Users,
        className: 'border-line bg-line/40 text-muted',
      };
  }
}
