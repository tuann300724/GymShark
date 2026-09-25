'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/home/reveal';
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
    <div className="overflow-x-hidden">
      {/* ===== Page hero ===== */}
      <section className="border-b border-line">
        <div className="container-x py-14 lg:py-16">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
              Class Schedule
            </p>
            <h1 className="section-title mt-4">Lịch tập &amp; lớp học</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              Tham gia các lớp học nhóm miễn phí cho hội viên: Yoga, HIIT, CrossFit, Pilates và
              nhiều hơn nữa.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== Day-grouped class list ===== */}
      <section className="py-14 lg:py-16">
        <div className="container-x">
          <div className="mx-auto max-w-4xl">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : grouped.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface py-16 text-center">
                <CalendarDays className="mx-auto mb-3 size-10 text-muted opacity-50" />
                <p className="font-semibold text-chalk">
                  Chưa có lớp học nào được lên lịch ở thời điểm hiện tại.
                </p>
                <p className="mt-1.5 text-sm text-muted">
                  Vui lòng quay lại sau hoặc liên hệ lễ tân để biết thêm.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {grouped.map((group, gi) => (
                  <Reveal key={group.day} delay={Math.min(gi, 3) * 80}>
                    <div>
                      {/* Day header */}
                      <div className="mb-4 flex items-center gap-3">
                        <span className="size-2 shrink-0 bg-neon" aria-hidden />
                        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-chalk">
                          {formatDay(group.day)}
                        </h2>
                        <span className="h-px flex-1 bg-line" aria-hidden />
                        <span className="shrink-0 text-xs text-muted">
                          {group.sessions.length} buổi
                        </span>
                      </div>

                      <div className="space-y-3">
                        {group.sessions.map((s) => (
                          <div
                            key={s.id}
                            className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors duration-300 hover:border-neon/40 sm:flex-row sm:items-center"
                          >
                            <div className="flex shrink-0 items-center gap-3 sm:w-36">
                              <div className="flex size-10 items-center justify-center rounded-sm border border-neon/25 bg-neon/10 text-neon">
                                <Clock className="size-5" />
                              </div>
                              <div>
                                <p className="font-display text-base font-bold leading-none text-chalk">
                                  {formatTime(s.startTime)}
                                </p>
                                <p className="mt-1 text-[11px] text-muted">
                                  {formatTime(s.endTime)} · kết thúc
                                </p>
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-chalk">{s.title}</p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                                {s.trainer?.user && (
                                  <span className="inline-flex items-center gap-1">
                                    <User className="size-3.5 text-neon" />
                                    {s.trainer.user.fullName}
                                  </span>
                                )}
                                {s.room && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="size-3.5 text-neon" />
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
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
