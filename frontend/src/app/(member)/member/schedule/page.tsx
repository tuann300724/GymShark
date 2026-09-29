'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trainingApi } from '@/services/training.service';
import { trainerApi } from '@/services/trainer.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionDetailDialog } from '@/components/training/session-detail-dialog';
import { SessionStatusBadge, SessionTypeBadge } from '@/components/training/session-badges';
import { formatDateTime, formatTime } from '@/lib/utils';
import type { TrainingSession } from '@/services/types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  ClipboardList,
  Dumbbell,
  UserRound,
  History,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function MemberSchedulePage() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['member-sessions'],
    queryFn: () => trainingApi.getMy(),
    retry: 0,
  });

  const { data: trainerInfo } = useQuery({
    queryKey: ['member-my-trainer'],
    queryFn: trainerApi.myTrainer,
    retry: 0,
  });

  const sessions = useMemo(() => data?.data || [], [data]);
  const now = new Date();

  const upcoming = sessions.filter((s) => new Date(s.startTime) >= now && s.status === 'SCHEDULED');
  const today = sessions.filter((s) => toKey(new Date(s.startTime)) === toKey(now));
  const completed = sessions.filter((s) => s.status === 'COMPLETED');
  const history = sessions.filter(
    (s) => s.startTime < now.toISOString() || s.status === 'COMPLETED' || s.status === 'CANCELLED',
  );

  // Calendar grid (giữ tương tác như trang cũ)
  const calendar = useMemo(() => {
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(toKey(new Date(viewDate.getFullYear(), viewDate.getMonth(), d)));
    }
    return cells;
  }, [viewDate]);

  const sessionKeys = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => set.add(toKey(new Date(s.startTime))));
    return set;
  }, [sessions]);

  const todayKey = toKey(now);
  const filtered = selectedKey
    ? sessions.filter((s) => toKey(new Date(s.startTime)) === selectedKey)
    : sessions;

  const currentTrainer = trainerInfo?.trainer;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            Lịch tập
          </h1>
          <p className="mt-1 text-sm text-muted">
            Buổi tập cá nhân cùng PT, lớp nhóm và lịch sử tập luyện của bạn.
          </p>
        </div>

        {/* Trainer card */}
        {currentTrainer && (
          <div className="flex items-center gap-3 rounded-2xl border border-neon/30 bg-neon/5 p-3">
            {currentTrainer.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentTrainer.user.avatarUrl}
                alt=""
                className="size-11 rounded-xl object-cover"
              />
            ) : (
              <span className="flex size-11 items-center justify-center rounded-xl bg-neon/15 text-sm font-bold uppercase text-neon">
                {currentTrainer.user.fullName?.charAt(0)}
              </span>
            )}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neon">
                <UserRound className="size-3.5" /> PT của bạn
              </p>
              <p className="text-sm font-bold text-chalk">{currentTrainer.user.fullName}</p>
              <p className="text-xs text-muted">{currentTrainer.specialization}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon={CalendarDays} label="Sắp tới" value={data?.upcoming || 0} accent="neon" />
        <MiniStat icon={Clock} label="Hôm nay" value={today.length} accent="sky" />
        <MiniStat
          icon={ClipboardList}
          label="Đã hoàn thành"
          value={completed.length}
          accent="amber"
        />
        <MiniStat icon={History} label="Tổng số buổi" value={sessions.length} accent="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Calendar */}
        <Card className="h-fit lg:col-span-2">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-base font-bold text-chalk">
                <CalendarDays className="size-4 text-neon" />
                {viewDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
                  }
                  className="rounded-lg p-1.5 transition-colors hover:bg-line/40"
                  aria-label="Tháng trước"
                >
                  <ChevronLeft className="size-4 text-muted" />
                </button>
                <button
                  onClick={() =>
                    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
                  }
                  className="rounded-lg p-1.5 transition-colors hover:bg-line/40"
                  aria-label="Tháng sau"
                >
                  <ChevronRight className="size-4 text-muted" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1.5 text-[10px] font-bold uppercase text-muted">
                  {w}
                </div>
              ))}
              {calendar.map((key, i) =>
                key ? (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(selectedKey === key ? null : key)}
                    className={cn(
                      'relative h-9 rounded-lg text-xs font-medium transition-colors',
                      selectedKey === key
                        ? 'bg-neon font-bold text-ink'
                        : sessionKeys.has(key)
                          ? 'bg-neon/15 text-neon hover:bg-neon/25'
                          : 'text-muted hover:bg-line/40',
                      key === todayKey && selectedKey !== key && 'ring-1 ring-neon/50',
                    )}
                  >
                    {parseInt(key.slice(8), 10)}
                    {sessionKeys.has(key) && (
                      <span
                        className={cn(
                          'absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
                          selectedKey === key ? 'bg-ink' : 'bg-neon',
                        )}
                      />
                    )}
                  </button>
                ) : (
                  <div key={`empty-${i}`} />
                ),
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessions list */}
        <div className="space-y-3 lg:col-span-3">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <CalendarDays className="mx-auto size-10 text-muted" />
                <p className="mt-3 text-sm text-muted">
                  {selectedKey
                    ? 'Không có buổi tập nào vào ngày này.'
                    : 'Bạn chưa có buổi tập nào.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDetailId(s.id)}
                className="block w-full rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-neon/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-chalk">{s.title}</span>
                  <SessionTypeBadge type={s.type} />
                  <SessionStatusBadge status={s.status} />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {new Date(s.startTime).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted sm:grid-cols-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5 text-neon" />
                    {formatTime(s.startTime)} – {formatTime(s.endTime)}
                  </span>
                  {s.trainer?.user && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="size-3.5 text-neon" />
                      {s.trainer.user.fullName}
                    </span>
                  )}
                  {s.description && s.type !== 'PERSONAL_TRAINING' && (
                    <span className="inline-flex items-center gap-1.5">
                      <Dumbbell className="size-3.5 text-neon" />
                      {s.branch?.name || '--'}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Lịch sử buổi tập */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-chalk">
          <History className="size-5 text-neon" />
          Lịch sử tập luyện
        </h2>
        {history.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-xs text-muted">
              Chưa có lịch sử. Khi có buổi tập hoàn thành hoặc bị hủy, chúng sẽ xuất hiện tại đây.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {history.slice(0, 8).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDetailId(s.id)}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-neon/40"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-chalk">{s.title}</span>
                    <SessionStatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(s.startTime)}
                    {s.cancellationNote ? ` · Hủy: ${s.cancellationNote}` : ''}
                  </p>
                </div>
                <PlusCircle className="size-4 shrink-0 rotate-45 text-muted" />
              </button>
            ))}
          </div>
        )}
      </div>

      <SessionDetailDialog sessionId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
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
