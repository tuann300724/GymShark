'use client';

import React, { useEffect, useState } from 'react';
import { Dumbbell, Flame, Scale, TrendingUp } from 'lucide-react';
import { Reveal } from './reveal';

const WEEKLY_COMPLETION = 78; // mock — % buổi tập hoàn thành trong tuần
const TOTAL_WORKOUTS = 128;
const STREAK_DAYS = 14;
const WEIGHT_CHANGE = '+4.2 kg';
const STRENGTH_CHANGE = '+18%';

const RADIUS = 84;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STATS = [
  {
    icon: Dumbbell,
    value: `${TOTAL_WORKOUTS}`,
    label: 'Tổng số buổi tập',
    accent: false,
  },
  {
    icon: Flame,
    value: `${STREAK_DAYS} ngày`,
    label: 'Chuỗi tập liên tiếp',
    accent: true,
  },
  {
    icon: Scale,
    value: WEIGHT_CHANGE,
    label: 'Tiến bộ cân nặng · 3 tháng',
    accent: false,
  },
  {
    icon: TrendingUp,
    value: STRENGTH_CHANGE,
    label: 'Sức mạnh Squat 1RM',
    accent: true,
  },
];

export function ProgressDashboard() {
  const [offset, setOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = CIRCUMFERENCE * (1 - WEEKLY_COMPLETION / 100);
    if (reduce) {
      setOffset(target);
      return;
    }
    const t = setTimeout(() => setOffset(target), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="scroll-mt-24 py-20 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="section-title">Personal Progress</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Toàn bộ tiến độ tập luyện trong một cái nhìn: buổi tập, chuỗi ngày và tiến bộ sức mạnh
              theo thời gian.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="grid items-center gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
              {/* Circular progress */}
              <div className="flex flex-col items-center">
                <div className="relative size-[200px]">
                  <svg viewBox="0 0 200 200" className="size-full -rotate-90">
                    <circle
                      cx="100"
                      cy="100"
                      r={RADIUS}
                      fill="none"
                      stroke="#272C31"
                      strokeWidth="10"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r={RADIUS}
                      fill="none"
                      stroke="#B7FF00"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={offset}
                      style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-5xl font-extrabold leading-none text-chalk">
                      {WEEKLY_COMPLETION}%
                    </span>
                    <span className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">
                      Hoàn thành tuần
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-muted">
                  7/9 buổi tập đã hoàn thành trong kế hoạch tuần này
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {STATS.map((s, i) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-4 rounded-xl border border-line bg-ink p-4 transition-colors hover:border-neon/30"
                  >
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-sm border ${
                        s.accent
                          ? 'border-neon/25 bg-neon/10 text-neon'
                          : 'border-line bg-surface text-muted'
                      }`}
                    >
                      <s.icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block font-display text-2xl font-bold leading-none ${
                          s.accent ? 'text-neon' : 'text-chalk'
                        }`}
                      >
                        {s.value}
                      </span>
                      <span className="mt-1.5 block text-xs leading-tight text-muted">
                        {s.label}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
