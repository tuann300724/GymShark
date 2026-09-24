'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { memberApi } from '@/services/member.service';
import { statsApi } from '@/services/notification.service';
import { checkinApi } from '@/services/checkin.service';
import { scheduleApi } from '@/services/schedule.service';
import { notificationApi } from '@/services/notification.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function MemberDashboardPage() {
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

  const { data: schedules } = useQuery({
    queryKey: ['member-schedules'],
    queryFn: scheduleApi.getMySchedules,
    retry: 0,
  });

  const { data: notifs } = useQuery({
    queryKey: ['member-notifs-dash'],
    queryFn: notificationApi.getMyNotifications,
    retry: 0,
  });

  const firstName = me?.fullName?.split(' ').slice(-1)[0] || 'bạn';
  const membership = stats?.currentMembership;

  const statItems = [
    { label: 'Tổng check-in', value: stats?.totalCheckIns ?? 0, icon: QrCode, to: '/member/checkins' },
    { label: 'Check-in tháng này', value: stats?.monthCheckIns ?? 0, icon: CalendarCheck, to: '/member/checkins' },
    { label: 'Ngày còn lại', value: stats?.remainingDays ?? 0, icon: Hourglass, to: '/member/membership' },
    { label: 'Số buổi PT sắp tới', value: stats?.ptSessions ?? 0, icon: Dumbbell, to: '/member/schedule' },
  ];

  const nextSessions = schedules?.data?.slice(0, 3) || [];

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
            {me?.member?.code ? `Mã hội viên: ${me.member.code}` : ''} — Hãy bắt đầu ngày mới với một buổi tập thật
            chất lượng nhé!
          </p>
        </div>
        <Link
          href="/member/schedule"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neon transition-colors hover:underline"
        >
          Xem lịch tập
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Membership card */}
      <Card className="overflow-hidden border-neon/30">
        <div className="relative p-6 text-chalk sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-neon" />
                <p className="meta-label">Thẻ thành viên</p>
              </div>
              {statsLoading || !membership ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ) : (
                <>
                  <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">
                    {membership.packageName}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                    <span>
                      Bắt đầu: <b className="font-semibold text-chalk">{formatDate(membership.startDate)}</b>
                    </span>
                    <span>
                      Hết hạn: <b className="font-semibold text-chalk">{formatDate(membership.endDate)}</b>
                    </span>
                    <span>
                      Giá: <b className="font-semibold text-chalk">{formatCurrency(membership.price)}</b>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="success">Active</Badge>
                    <span className="text-xs text-muted">
                      Còn {membership.remainingDays} ngày sử dụng
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="shrink-0 sm:w-64">
              <p className="meta-label mb-2">Thời gian còn lại</p>
              <Progress value={membership?.progress || 0} />
              <p className="mt-2 font-display text-2xl font-bold text-neon">
                {membership?.remainingDays ?? 0}
                <span className="ml-1 font-sans text-sm font-semibold text-muted">ngày</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((s) => (
          <Link key={s.label} href={s.to}>
            <Card className="h-full transition-colors hover:border-neon/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neon/25 bg-neon/10">
                    <s.icon className="h-5 w-5 text-neon" />
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
                <QrCode className="h-4 w-4 text-neon" />
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
                          {new Date(c.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
                <CalendarDays className="h-4 w-4 text-neon" />
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
              {!schedules ? (
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
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neon/25 bg-neon/10">
                        <Clock className="h-5 w-5 text-neon" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-chalk">{s.title}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {new Date(s.startTime).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}{' '}
                          • {new Date(s.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {s.trainer?.user ? ` • ${s.trainer.user.fullName}` : ''}
                        </p>
                      </div>
                      {s.room && (
                        <span className="hidden shrink-0 items-center gap-1 text-xs text-muted sm:flex">
                          <MapPin className="h-3.5 w-3.5" />
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
              <BellRing className="h-4 w-4 text-neon" />
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
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neon" />}
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
