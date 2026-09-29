'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { trainingApi } from '@/services/training.service';
import { trainerApi } from '@/services/trainer.service';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionDetailDialog } from '@/components/training/session-detail-dialog';
import { SessionStatusBadge, SessionTypeBadge } from '@/components/training/session-badges';
import { formatTime, formatDateTime } from '@/lib/utils';
import type { TrainingSession } from '@/services/types';
import {
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  Users,
  ArrowRight,
  Clock,
  Dumbbell,
  CalendarCheck,
  UserRound,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TrainerDashboardPage() {
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-me-sessions'],
    queryFn: () => trainingApi.getTrainerMe(),
    retry: 0,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['trainer-me-members'],
    queryFn: trainerApi.myMembers,
    retry: 0,
  });

  const sessions = useMemo(() => data?.data || [], [data]);
  const stats = data?.stats || { today: 0, upcoming: 0, completed: 0 };
  const activeMembers = (membersData || []).filter((a) => a.status === 'ACTIVE');

  const now = useMemo(() => new Date(), []);
  const todayKey = toKey(now);

  const todaySessions = useMemo(
    () =>
      sessions
        .filter((s) => toKey(new Date(s.startTime)) === todayKey && s.status === 'SCHEDULED')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [sessions, todayKey],
  );

  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => new Date(s.startTime) >= now && s.status === 'SCHEDULED')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [sessions, now],
  );

  const recentCompleted = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'COMPLETED')
        .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()),
    [sessions],
  );

  const statItems = [
    { label: 'Lịch hôm nay', value: stats.today, icon: CalendarCheck, accent: 'neon' as const },
    { label: 'Sắp tới', value: stats.upcoming, icon: TrendingUp, accent: 'sky' as const },
    {
      label: 'Đã hoàn thành',
      value: stats.completed,
      icon: CheckCircle2,
      accent: 'amber' as const,
    },
    {
      label: 'Hội viên phụ trách',
      value: activeMembers.length,
      icon: Users,
      accent: 'purple' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            Lịch dạy của bạn
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tổng quan buổi tập hôm nay, hội viên phụ trách và hoạt động gần đây.
          </p>
        </div>
        <Link
          href="/trainer/schedule"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neon transition-colors hover:underline"
        >
          Mở lịch dạy <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statItems.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      {/* Today */}
      <Section
        title="Lịch dạy hôm nay"
        icon={CalendarDays}
        subtitle={todaySessions.length > 0 ? `${todaySessions.length} buổi` : undefined}
      >
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : todaySessions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <CalendarDays className="mx-auto size-8 text-muted/50" />
              <p className="mt-3 text-sm text-muted">
                Hôm nay bạn không có buổi dạy nào. Nghỉ ngơi thật tốt nhé!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((s) => (
              <SessionRow key={s.id} session={s} onClick={() => setDetailId(s.id)} />
            ))}
          </div>
        )}
      </Section>

      {/* Upcoming + Members */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section
          title="Buổi sắp tới"
          icon={TrendingUp}
          subtitle={upcomingSessions.length > 0 ? `${upcomingSessions.length} buổi` : undefined}
        >
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          ) : upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted">
                Chưa có buổi tập nào sắp tới.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.slice(0, 5).map((s) => (
                <SessionRow key={s.id} session={s} onClick={() => setDetailId(s.id)} compact />
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Hội viên phụ trách"
          icon={Users}
          subtitle={activeMembers.length > 0 ? `${activeMembers.length} hội viên` : undefined}
          action={
            <Link
              href="/trainer/members"
              className="text-xs font-semibold text-neon transition-colors hover:underline"
            >
              Tất cả <ChevronRight className="inline size-3.5" />
            </Link>
          }
        >
          {membersLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          ) : activeMembers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted">
                Bạn chưa được gán cho hội viên nào. Liên hệ admin để cập nhật.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeMembers.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neon/15 text-sm font-bold uppercase text-neon">
                    {a.member?.fullName?.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-chalk">
                      {a.member?.fullName}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {a.member?.code} · {a.member?.phone || '--'}
                    </p>
                  </div>
                  {a.member?.memberships?.some((m) => m.status === 'ACTIVE') ? (
                    <span className="shrink-0 text-[10px] font-bold text-neon">
                      {a.member.memberships.find((m) => m.status === 'ACTIVE')?.package?.name}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-bold text-amber-400">HẾT HẠN</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Recent completed */}
      {recentCompleted.length > 0 && (
        <Section
          title="Buổi đã hoàn thành gần đây"
          icon={CheckCircle2}
          subtitle={`${recentCompleted.length} buổi`}
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {recentCompleted.slice(0, 6).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDetailId(s.id)}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-neon/40"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-chalk">{s.title}</span>
                    <SessionTypeBadge type={s.type} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(s.endTime)}
                    {s.member ? ` · ${s.member.fullName}` : ''}
                  </p>
                </div>
                <SessionStatusBadge status={s.status} />
              </button>
            ))}
          </div>
        </Section>
      )}

      <SessionDetailDialog
        sessionId={detailId}
        onClose={() => setDetailId(null)}
        canComplete
        canProgress
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'neon' | 'sky' | 'amber' | 'purple';
}) {
  const accentMap = {
    neon: 'bg-neon/10 text-neon border-neon/25',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-xl border',
            accentMap[accent],
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-bold text-chalk font-display">{value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  icon: Icon,
  subtitle,
  action,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-chalk">
          <Icon className="size-5 text-neon" />
          {title}
          {subtitle && (
            <span className="font-sans text-xs font-semibold text-muted">({subtitle})</span>
          )}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function SessionRow({
  session,
  onClick,
  compact = false,
}: {
  session: TrainingSession;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border border-line bg-surface text-left transition-colors hover:border-neon/40',
        compact ? 'p-3' : 'p-4',
      )}
    >
      <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border border-neon/25 bg-neon/10">
        <Clock className="size-4 text-neon" />
        <span className="mt-0.5 text-[9px] font-bold text-neon">
          {formatTime(session.startTime)}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-bold text-chalk">{session.title}</span>
          <SessionTypeBadge type={session.type} />
          <SessionStatusBadge status={session.status} />
        </div>
        <p className="mt-1 truncate text-xs text-muted">
          {formatDateTime(session.startTime)}
          {session.member ? ` · ${session.member.fullName} (${session.member.code})` : ''}
          {session.room ? ` · Phòng ${session.room.name}` : ''}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted" />
    </button>
  );
}
