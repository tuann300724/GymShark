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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Xin chào, {meLoading ? (
              <Skeleton className="inline-block h-7 w-40 align-middle" />
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">{firstName}</span>
            )} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {me?.member?.code ? `Mã hội viên: ${me.member.code}` : ''} — Hãy bắt đầu ngày mới với một buổi tập thật
            chất lượng nhé!
          </p>
        </div>
        <Link
          href="/member/schedule"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Xem lịch tập
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Membership card */}
      <Card className="overflow-hidden border-0">
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-14 -left-8 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 opacity-80" />
                <p className="text-xs uppercase tracking-widest opacity-80 font-bold">Thẻ thành viên</p>
              </div>
              {statsLoading || !membership ? (
                <div className="space-y-2 mt-3">
                  <Skeleton className="h-6 w-48 bg-white/20" />
                  <Skeleton className="h-4 w-64 bg-white/10" />
                </div>
              ) : (
                <>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">{membership.packageName}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-emerald-50/90">
                    <span>
                      Bắt đầu: <b>{formatDate(membership.startDate)}</b>
                    </span>
                    <span>
                      Hết hạn: <b>{formatDate(membership.endDate)}</b>
                    </span>
                    <span>
                      Giá: <b>{formatCurrency(membership.price)}</b>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge className="bg-white/20 text-white border-0">Active</Badge>
                    <span className="text-xs text-emerald-50/80">
                      Còn {membership.remainingDays} ngày sử dụng
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="sm:w-64 shrink-0">
              <p className="text-[11px] uppercase tracking-widest opacity-80 font-semibold mb-2">
                Thời gian còn lại
              </p>
              <Progress value={membership?.progress || 0} className="bg-white/25" barClassName="bg-white" />
              <p className="mt-2 text-2xl font-black">
                {membership?.remainingDays ?? 0}
                <span className="text-sm font-semibold opacity-80 ml-1">ngày</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((s) => (
          <Link key={s.label} href={s.to}>
            <Card className="hover:border-emerald-500/40 transition-colors h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent check-ins */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Check-in gần nhất
              </CardTitle>
              <Link
                href="/member/checkins"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
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
                <p className="py-6 text-center text-sm text-slate-400">
                  Chưa có lượt check-in nào. Ghé phòng tập để bắt đầu nhé!
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {checkins.data.slice(0, 4).map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(c.checkInTime).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-slate-500">
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
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Buổi tập sắp tới
              </CardTitle>
              <Link
                href="/member/schedule"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
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
                <p className="py-6 text-center text-sm text-slate-400">
                  Không có buổi tập nào sắp tới. Liên hệ lễ tân để đặt lịch PT nhé!
                </p>
              ) : (
                <div className="space-y-3">
                  {nextSessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{s.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(s.startTime).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}{' '}
                          • {new Date(s.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {s.trainer?.user ? ` • ${s.trainer.user.fullName}` : ''}
                        </p>
                      </div>
                      {s.room && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400 shrink-0">
                          <MapPin className="w-3.5 h-3.5" />
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
            <CardTitle className="text-base flex items-center gap-2">
              <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Thông báo
            </CardTitle>
            <Link
              href="/member/notifications"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
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
              <p className="py-6 text-center text-sm text-slate-400">Không có thông báo mới.</p>
            ) : (
              <div className="space-y-3">
                {notifs.data.slice(0, 4).map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || '/member/notifications'}
                    className={`block p-3 rounded-xl border transition-colors ${
                      n.isRead
                        ? 'border-slate-200 dark:border-slate-800 opacity-70'
                        : 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.content}</p>
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