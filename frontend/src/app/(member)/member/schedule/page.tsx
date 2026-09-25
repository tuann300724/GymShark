'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleApi } from '@/services/schedule.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Clock, MapPin, User, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function formatFullDay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function MemberSchedulePage() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['member-schedules'],
    queryFn: scheduleApi.getMySchedules,
    retry: 0,
  });

  const sessions = data?.data || [];

  // Build calendar grid
  const calendar = useMemo(() => {
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday start
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(toKey(new Date(viewDate.getFullYear(), viewDate.getMonth(), d)));
    }
    return cells;
  }, [viewDate]);

  // Map session keys
  const sessionKeys = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => set.add(toKey(new Date(s.startTime))));
    return set;
  }, [sessions]);

  const todayKey = toKey(new Date());

  const filtered = selectedKey
    ? sessions.filter((s) => toKey(new Date(s.startTime)) === selectedKey)
    : sessions;

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    setSelectedKey(null);
  };
  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    setSelectedKey(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Lịch tập
        </h1>
        <p className="mt-1 text-sm text-muted">Lịch tập cá nhân và các buổi PT của bạn.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Calendar */}
        <Card className="h-fit lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-neon" />
              {viewDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-1">
              <button
                onClick={prevMonth}
                className="rounded-lg p-1.5 transition-colors hover:bg-line/40"
                aria-label="Tháng trước"
              >
                <ChevronLeft className="size-4 text-muted" />
              </button>
              <button
                onClick={nextMonth}
                className="rounded-lg p-1.5 transition-colors hover:bg-line/40"
                aria-label="Tháng sau"
              >
                <ChevronRight className="size-4 text-muted" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
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
        <div className="space-y-4 lg:col-span-3">
          {selectedKey && (
            <p className="text-xs font-semibold text-neon">
              Buổi tập ngày {formatFullDay(selectedKey)}
            </p>
          )}

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
                    : 'Bạn chưa có buổi tập nào sắp tới.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-chalk">{s.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {new Date(s.startTime).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge variant={s.status === 'SCHEDULED' ? 'info' : 'success'}>
                      {s.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted sm:grid-cols-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 text-neon" />
                      {new Date(s.startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(s.endTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {s.trainer?.user && (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="size-3.5 text-neon" />
                        PT: {s.trainer.user.fullName}
                      </span>
                    )}
                    {s.room && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-neon" />
                        {s.room.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
