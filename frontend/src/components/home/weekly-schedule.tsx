'use client';

import React from 'react';
import { Reveal } from './reveal';

const SCHEDULE = [
  { key: 'MON', full: 'Thứ Hai', focus: 'Chest + Triceps', vi: 'Ngực & Tay sau', min: 60 },
  { key: 'TUE', full: 'Thứ Ba', focus: 'Back + Biceps', vi: 'Lưng & Tay trước', min: 65 },
  { key: 'WED', full: 'Thứ Tư', focus: 'Shoulders', vi: 'Vai', min: 50 },
  { key: 'THU', full: 'Thứ Năm', focus: 'Legs + Abs', vi: 'Chân & Bụng', min: 70 },
  { key: 'FRI', full: 'Thứ Sáu', focus: 'Chest + Shoulders', vi: 'Ngực & Vai', min: 55 },
  { key: 'SAT', full: 'Thứ Bảy', focus: 'Back + Arms', vi: 'Lưng & Tay', min: 60 },
  {
    key: 'SUN',
    full: 'Chủ Nhật',
    focus: 'Rest / Light Cardio',
    vi: 'Nghỉ ngơi hoặc cardio nhẹ',
    min: null,
  },
];

const DAY_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function WeeklySchedule() {
  const todayKey = DAY_KEYS[new Date().getDay()];
  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <section className="scroll-mt-24 py-20 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="section-title">Weekly Schedule</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Bảy ngày được sắp xếp để mỗi nhóm cơ có thời gian phục hồi đúng nhịp. Ngày tập hôm nay
              được đánh dấu tự động.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-surface">
            {/* Card header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-chalk">
                  Lịch tập tuần này
                </h3>
                <p className="mt-0.5 text-xs capitalize text-muted">{todayLabel}</p>
              </div>
              <span className="rounded-md border border-line bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Week Plan
              </span>
            </div>

            {/* Rows */}
            <ul>
              {SCHEDULE.map((row) => {
                const isToday = row.key === todayKey;
                const isRest = row.min === null;
                return (
                  <li
                    key={row.key}
                    className={`relative grid grid-cols-[52px_1fr_auto] items-center gap-3 border-t border-line px-5 py-4 transition-colors sm:grid-cols-[64px_1fr_auto_auto] sm:gap-4 sm:px-6 ${
                      isToday ? 'bg-neon/[0.05]' : ''
                    }`}
                  >
                    {isToday && (
                      <span className="absolute inset-y-0 left-0 w-[3px] bg-neon" aria-hidden />
                    )}

                    <span
                      className={`font-display text-base font-bold tracking-wide ${
                        isToday ? 'text-neon' : isRest ? 'text-muted/70' : 'text-chalk'
                      }`}
                    >
                      {row.key}
                    </span>

                    <span className="min-w-0">
                      <span
                        className={`block truncate text-sm font-semibold ${
                          isRest && !isToday ? 'text-muted' : 'text-chalk'
                        }`}
                      >
                        {row.focus}
                      </span>
                      <span className="block truncate text-xs text-muted">{row.vi}</span>
                    </span>

                    <span className="hidden text-xs text-muted sm:block">
                      {isRest ? '—' : `${row.min} phút`}
                    </span>

                    {isToday ? (
                      <span className="justify-self-end rounded-full bg-neon px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                        Hôm nay
                      </span>
                    ) : (
                      <span className="text-xs text-muted sm:hidden">
                        {isRest ? '—' : `${row.min} phút`}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
