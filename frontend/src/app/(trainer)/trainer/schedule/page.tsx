'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { trainingApi } from '@/services/training.service';
import {
  TrainingCalendar,
  CalendarToolbar,
  type CalendarView,
} from '@/components/training/training-calendar';
import { SessionDetailDialog } from '@/components/training/session-detail-dialog';
import { SessionStatusBadge, SessionTypeBadge } from '@/components/training/session-badges';
import { formatDateTime } from '@/lib/utils';
import type { TrainingSession } from '@/services/types';
import { CalendarDays } from 'lucide-react';

export default function TrainerSchedulePage() {
  const [view, setView] = useState<CalendarView>('month');
  const [date, setDate] = useState(() => new Date());
  const [detailId, setDetailId] = useState<string | null>(null);

  const range = useMemo(() => {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (view === 'day') return { from: start, to: new Date(start.getTime() + 86400000) };
    if (view === 'week') {
      const monday = new Date(start);
      monday.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      return { from: monday, to: new Date(monday.getTime() + 7 * 86400000) };
    }
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    return { from: first, to: new Date(date.getFullYear(), date.getMonth() + 1, 1) };
  }, [date, view]);

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-calendar', view, range.from.toISOString(), range.to.toISOString()],
    queryFn: () =>
      trainingApi.getTrainerMe({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        limit: 500,
      }),
    retry: 0,
  });

  const sessions = data?.data || [];

  const navigate = (dir: -1 | 1) => {
    setDate((d) => {
      const n = new Date(d);
      if (view === 'day') n.setDate(n.getDate() + dir);
      else if (view === 'week') n.setDate(n.getDate() + 7 * dir);
      else n.setMonth(n.getMonth() + dir);
      return n;
    });
  };

  const stats = data?.stats || { today: 0, upcoming: 0, completed: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Lịch dạy
        </h1>
        <p className="mt-1 text-sm text-muted">
          Xem và quản lý các buổi tập của bạn theo ngày / tuần / tháng.
        </p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Hôm nay" value={stats.today} />
        <MiniStat label="Sắp tới" value={stats.upcoming} />
        <MiniStat label="Đã hoàn thành" value={stats.completed} />
      </div>

      <div className="flex flex-col gap-3">
        <CalendarToolbar view={view} onViewChange={setView} date={date} onNavigate={navigate} />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      ) : (
        <TrainingCalendar
          view={view}
          date={date}
          sessions={sessions}
          onSessionClick={(s) => setDetailId(s.id)}
        />
      )}

      {/* Mobile agenda */}
      <div className="space-y-2 lg:hidden">
        {!isLoading &&
          sessions
            .slice()
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .map((s: TrainingSession) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDetailId(s.id)}
                className="block w-full rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-neon/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-chalk">{s.title}</span>
                  <SessionTypeBadge type={s.type} />
                  <SessionStatusBadge status={s.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {formatDateTime(s.startTime)}
                  {s.member ? ` · ${s.member.fullName}` : ''}
                </p>
              </button>
            ))}
      </div>

      <SessionDetailDialog
        sessionId={detailId}
        onClose={() => setDetailId(null)}
        canComplete
        canProgress
        onChanged={() => {}}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-2 p-4">
        <div>
          <p className="font-display text-2xl font-bold text-chalk">{value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        </div>
        <CalendarDays className="size-5 text-neon/70" />
      </CardContent>
    </Card>
  );
}
