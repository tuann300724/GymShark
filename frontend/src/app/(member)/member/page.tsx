'use client';

import React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '@/services/member.service';
import { statsApi } from '@/services/notification.service';
import { checkinApi } from '@/services/checkin.service';
import { trainingApi } from '@/services/training.service';
import { trainerApi } from '@/services/trainer.service';
import { notificationApi } from '@/services/notification.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  QrCode,
  CalendarCheck,
  Hourglass,
  Dumbbell,
  CreditCard,
  BellRing,
  ChevronRight,
  CalendarDays,
  MapPin,
  Clock,
  ArrowRight,
  LogIn,
  LogOut,
  CheckCircle2,
  Wallet,
  Receipt,
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

export default function MemberDashboardPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['member-me'],
    queryFn: memberApi.getMe,
    retry: 0,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['member-stats'],
    queryFn: statsApi.getMemberStats,
    retry: 0,
  });

  const { data: checkins } = useQuery({
    queryKey: ['member-checkins', 1, 5],
    queryFn: () => checkinApi.getMyCheckins(1, 5),
    retry: 0,
  });

  const { data: attCurrent } = useQuery({
    queryKey: ['checkin-current-dash'],
    queryFn: checkinApi.getMyCurrent,
    retry: 0,
    refetchInterval: 30000,
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkinApi.checkOut(),
    onSuccess: () => {
      toast.success('Check-out thành công', 'Hẹn gặp lại bạn lần sau!');
      queryClient.invalidateQueries({ queryKey: ['checkin-current-dash'] });
      queryClient.invalidateQueries({ queryKey: ['member-checkins'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể check-out lúc này.';
      toast.error('Check-out thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const { data: upcomingSessions } = useQuery({
    queryKey: ['member-upcoming-dash'],
    queryFn: trainingApi.getMyUpcoming,
    retry: 0,
  });

  const { data: trainerInfo } = useQuery({
    queryKey: ['member-trainer-dash'],
    queryFn: trainerApi.myTrainer,
    retry: 0,
  });

  const { data: notifs } = useQuery({
    queryKey: ['member-notifs-dash'],
    queryFn: () => notificationApi.getMine({ limit: 4 }),
    retry: 0,
  });

  const firstName = me?.fullName?.split(' ').slice(-1)[0] || 'bạn';
  const membership = stats?.currentMembership;

  const statItems = [
    {
      label: 'Tổng check-in',
      value: stats?.totalCheckIns ?? 0,
      icon: QrCode,
      to: '/member/checkins',
    },
    {
      label: 'Check-in tháng này',
      value: stats?.monthCheckIns ?? 0,
      icon: CalendarCheck,
      to: '/member/checkins',
    },
    {
      label: 'Ngày còn lại',
      value: stats?.remainingDays ?? 0,
      icon: Hourglass,
      to: '/member/membership',
    },
    {
      label: 'Buổi tập sắp tới',
      value: stats?.upcomingSessions ?? stats?.ptSessions ?? 0,
      icon: Dumbbell,
      to: '/member/schedule',
    },
  ];

  const nextSessions = upcomingSessions?.data?.slice(0, 3) || [];
  const currentTrainer = trainerInfo?.trainer;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            Xin chào,{' '}
            {meLoading ? (
              <Skeleton className="inline-block h-7 w-40 align-middle" />
            ) : (
              <span className="text-neon">{firstName}</span>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {me?.member?.code ? `Mã hội viên: ${me.member.code}` : ''} — Hãy bắt đầu ngày mới với
            một buổi tập thật chất lượng nhé!
          </p>
        </div>
        <Link
          href="/member/schedule"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neon transition-colors hover:underline"
        >
          Xem lịch tập
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* PT card */}
      {trainerInfo?.trainer && (
        <Card className="overflow-hidden border-neon/25">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {trainerInfo.trainer.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={trainerInfo.trainer.user.avatarUrl}
                    alt=""
                    className="size-12 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-xl bg-neon/15 text-base font-bold uppercase text-neon">
                    {trainerInfo.trainer.user.fullName?.charAt(0)}
                  </span>
                )}
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neon">
                    <Dumbbell className="size-3.5" /> Huấn luyện viên của bạn
                  </p>
                  <p className="text-sm font-bold text-chalk">
                    {trainerInfo.trainer.user.fullName}
                  </p>
                  <p className="text-xs text-muted">
                    {trainerInfo.trainer.specialization}
                    {trainerInfo.trainer.hourlyRate
                      ? ` · ${Number(trainerInfo.trainer.hourlyRate).toLocaleString('vi-VN')}₫/buổi`
                      : ''}
                  </p>
                </div>
              </div>
              <Link href="/member/schedule">
                <Button variant="secondary" size="sm">
                  Xem lịch tập với PT <ChevronRight className="size-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membership card */}
      {/* Pending membership banner */}
      {!statsLoading && !membership && stats?.pendingMembership && (
        <Card className="overflow-hidden border-neon/40 bg-neon/5">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-6 shrink-0 text-neon" />
                <div>
                  <p className="text-sm font-semibold text-chalk">
                    Gói {stats.pendingMembership.packageName} đang chờ xác nhận thanh toán
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Yêu cầu đăng ký đã được gửi. Vui lòng đến quầy lễ tân để hoàn tất thanh toán,
                    gói tập sẽ tự động kích hoạt sau khi được xác nhận.
                  </p>
                </div>
              </div>
              <Link href="/member/membership">
                <Button variant="secondary" size="sm">
                  Xem chi tiết <ChevronRight className="size-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membership card OR empty state */}
      {statsLoading ? (
        <Card className="overflow-hidden border-neon/30">
          <CardContent className="p-6 sm:p-8">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="mt-3 h-20 w-full" />
          </CardContent>
        </Card>
      ) : !membership ? (
        <Card className="overflow-hidden border-line">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col items-center gap-5 py-6 text-center sm:flex-row sm:text-left">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-neon/25 bg-neon/10">
                <CreditCard className="size-8 text-neon" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight text-chalk">
                  Bạn chưa có gói tập nào
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Đăng ký một gói tập ngay hôm nay để bắt đầu hành trình fitness của bạn!
                </p>
              </div>
              <Link href="/packages">
                <Button>
                  Chọn gói tập <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-neon/30">
          <div className="relative p-6 text-chalk sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-5 text-neon" />
                  <p className="meta-label">Thẻ thành viên</p>
                </div>
                <div className="mt-3 space-y-2">
                  <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">
                    {membership.packageName}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                    <span>
                      Bắt đầu:{' '}
                      <b className="font-semibold text-chalk">{formatDate(membership.startDate)}</b>
                    </span>
                    <span>
                      Hết hạn:{' '}
                      <b className="font-semibold text-chalk">{formatDate(membership.endDate)}</b>
                    </span>
                    <span>
                      Giá:{' '}
                      <b className="font-semibold text-chalk">{formatCurrency(membership.price)}</b>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="success">Active</Badge>
                    <span className="text-xs text-muted">
                      Còn {membership.remainingDays} ngày sử dụng
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 sm:w-64">
                <p className="meta-label mb-2">Thời gian còn lại</p>
                <Progress value={membership.progress || 0} />
                <p className="mt-2 font-display text-2xl font-bold text-neon">
                  {membership.remainingDays ?? 0}
                  <span className="ml-1 font-sans text-sm font-semibold text-muted">ngày</span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Payment summary */}
      {!statsLoading && stats?.paymentSummary && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-neon/25 bg-neon/10">
                  <Wallet className="size-5 text-neon" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                    Thanh toán của bạn
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-0.5 text-sm">
                    <span className="text-chalk">
                      Tổng đã chi:{' '}
                      <b className="font-display text-lg font-extrabold text-neon">
                        {formatCurrency(stats.paymentSummary.totalSpent)}
                      </b>
                    </span>
                    <span className="text-xs text-muted">
                      {stats.paymentSummary.paidCount} hóa đơn đã thanh toán
                    </span>
                    {stats.paymentSummary.pendingCount > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                        <Clock className="size-3.5" /> {stats.paymentSummary.pendingCount} chờ xác
                        nhận
                      </span>
                    )}
                    {stats.paymentSummary.lastPayment && (
                      <span className="text-xs text-muted">
                        Gần nhất:{' '}
                        <b className="text-chalk">{stats.paymentSummary.lastPayment.code}</b> ·{' '}
                        {formatDate(stats.paymentSummary.lastPayment.paidAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href="/member/payments">
                  <Button variant="secondary" size="sm">
                    <Receipt className="size-3.5" /> Lịch sử thanh toán
                  </Button>
                </Link>
                <Link href="/packages">
                  <Button size="sm">
                    Gia hạn gói <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Attendance */}
      <Card
        className={`border-2 transition-colors duration-500 ${
          attCurrent?.checkedIn ? 'border-neon/50' : 'border-line'
        }`}
      >
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${
                  attCurrent?.checkedIn ? 'border-neon/40 bg-neon/10' : 'border-line bg-surface'
                }`}
              >
                {attCurrent?.checkedIn ? (
                  <CheckCircle2 className="size-5 text-neon" />
                ) : (
                  <QrCode className="size-5 text-muted" />
                )}
              </div>
              <div>
                {attCurrent === undefined ? (
                  <>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="mt-1.5 h-4 w-64" />
                  </>
                ) : attCurrent.checkedIn ? (
                  <>
                    <p className="text-sm font-semibold text-neon">Đang tập</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Check-in: {formatTime(attCurrent.checkInAt)}
                      {attCurrent.branch ? ` • ${attCurrent.branch.name}` : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-chalk">Bạn chưa check-in hôm nay</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Chấm công để bắt đầu buổi tập của bạn
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {attCurrent?.checkedIn ? (
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={checkOutMutation.isPending}
                  onClick={() => checkOutMutation.mutate()}
                >
                  <LogOut className="size-4 mr-1.5" /> Check-out
                </Button>
              ) : (
                <Link href="/member/checkin">
                  <Button variant="primary" size="sm">
                    <LogIn className="size-4 mr-1.5" /> Check-in ngay
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((s) => (
          <Link key={s.label} href={s.to}>
            <Card className="h-full transition-colors hover:border-neon/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-neon/25 bg-neon/10">
                    <s.icon className="size-5 text-neon" />
                  </div>
                </div>
                <p className="mt-3 font-display text-2xl font-bold text-chalk">{s.value}</p>
                <p className="mt-0.5 text-xs text-muted">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent check-ins */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="size-4 text-neon" />
                Check-in gần nhất
              </CardTitle>
              <Link
                href="/member/checkins"
                className="text-xs font-semibold text-neon transition-colors hover:underline"
              >
                Xem tất cả
              </Link>
            </CardHeader>
            <CardContent>
              {!checkins ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : checkins.data.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  Chưa có lượt check-in nào. Ghé phòng tập để bắt đầu nhé!
                </p>
              ) : (
                <div className="divide-y divide-line">
                  {checkins.data.slice(0, 4).map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold text-chalk">
                          {new Date(c.checkInTime).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(c.checkInTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {c.branch ? ` • ${c.branch.name}` : ''}
                        </p>
                      </div>
                      <Badge variant={c.status === 'CHECKED_OUT' ? 'success' : 'info'}>
                        {c.status === 'CHECKED_OUT' ? 'Hoàn tất' : 'Đang tập'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming training */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="size-4 text-neon" />
                Buổi tập sắp tới
              </CardTitle>
              <Link
                href="/member/schedule"
                className="text-xs font-semibold text-neon transition-colors hover:underline"
              >
                Lịch đầy đủ
              </Link>
            </CardHeader>
            <CardContent>
              {!upcomingSessions ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : nextSessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  Không có buổi tập nào sắp tới. Liên hệ lễ tân để đặt lịch PT nhé!
                </p>
              ) : (
                <div className="space-y-3">
                  {nextSessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-4 rounded-xl border border-line p-3.5"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-neon/25 bg-neon/10">
                        <Clock className="size-5 text-neon" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-chalk">{s.title}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {new Date(s.startTime).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                          })}{' '}
                          •{' '}
                          {new Date(s.startTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {s.trainer?.user ? ` • ${s.trainer.user.fullName}` : ''}
                        </p>
                      </div>
                      {s.room && (
                        <span className="hidden shrink-0 items-center gap-1 text-xs text-muted sm:flex">
                          <MapPin className="size-3.5" />
                          {s.room.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="size-4 text-neon" />
              Thông báo
            </CardTitle>
            <Link
              href="/member/notifications"
              className="text-xs font-semibold text-neon transition-colors hover:underline"
            >
              Tất cả
            </Link>
          </CardHeader>
          <CardContent>
            {!notifs ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : notifs.data.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">Không có thông báo mới.</p>
            ) : (
              <div className="space-y-3">
                {notifs.data.slice(0, 4).map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || '/member/notifications'}
                    className={`block rounded-xl border p-3 transition-colors ${
                      n.isRead
                        ? 'border-line opacity-70'
                        : 'border-neon/40 bg-neon/10 hover:border-neon/60'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-neon" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-chalk line-clamp-1">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.content}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
