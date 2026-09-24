'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';

function formatDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function PublicSchedulePage() {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['public-schedule'],
    queryFn: publicApi.getClassSchedule,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Group by day key (YYYY-MM-DD)
  const grouped: { day: string; sessions: NonNullable<typeof schedules> }[] = [];
  (schedules || []).forEach((s) => {
    const key = new Date(s.startTime).toLocaleDateString('en-CA');
    const group = grouped.find((g) => g.day === key);
    if (group) group.sessions.push(s);
    else grouped.push({ day: key, sessions: [s] });
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <section className="bg-slate-950 py-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2">Class Schedule</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Lịch tập & lớp học</h1>
          <p className="mt-3 text-slate-400 max-w-2xl">
            Tham gia các lớp học nhóm miễn phí cho hội viên: Yoga, HIIT, CrossFit, Pilates và nhiều hơn nữa.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">Chưa có lớp học nào được lên lịch ở thời điểm hiện tại.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <div key={group.day}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                  {formatDay(group.day)}
                </h2>
                <div className="space-y-3">
                  {group.sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40 transition-all"
                    >
                      <div className="flex items-center gap-3 sm:w-36 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{formatTime(s.startTime)}</p>
                          <p className="text-[11px] text-slate-400">{formatTime(s.endTime)} · kết thúc</p>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">{s.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          {s.trainer?.user && (
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-emerald-500" />
                              {s.trainer.user.fullName}
                            </span>
                          )}
                          {s.room && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                              {s.room.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge variant="success" className="shrink-0 self-start sm:self-center">
                        Còn chỗ
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}