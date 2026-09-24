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

  const filtered = selectedKey ? sessions.filter((s) => toKey(new Date(s.startTime)) === selectedKey) : sessions;

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    setSelectedKey(null);
  };
  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    setSelectedKey(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Lịch tập</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Lịch tập cá nhân và các buổi PT của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 h-fit">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {viewDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Tháng trước">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Tháng sau">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-[10px] font-bold uppercase text-slate-400 py-1.5">
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
                        ? 'bg-emerald-600 text-white'
                        : sessionKeys.has(key)
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                      key === todayKey && selectedKey !== key && 'ring-1 ring-emerald-500/50',
                    )}
                  >
                    {parseInt(key.slice(8), 10)}
                    {sessionKeys.has(key) && (
                      <span
                        className={cn(
                          'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                          selectedKey === key ? 'bg-white' : 'bg-emerald-500',
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
        <div className="lg:col-span-3 space-y-4">
          {selectedKey && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
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
                <CalendarDays className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm text-slate-500">
                  {selectedKey ? 'Không có buổi tập nào vào ngày này.' : 'Bạn chưa có buổi tập nào sắp tới.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{s.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(s.startTime).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge variant={s.status === 'SCHEDULED' ? 'info' : 'success'}>{s.status}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      {new Date(s.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(s.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {s.trainer?.user && (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        PT: {s.trainer.user.fullName}
                      </span>
                    )}
                    {s.room && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
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