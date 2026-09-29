'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { TrainingSession } from '@/services/types';

export type CalendarView = 'day' | 'week' | 'month';

const CALENDAR_START_HOUR = 6;
const CALENDAR_END_HOUR = 22;

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'border-neon/50 bg-neon/10 text-neon',
  COMPLETED: 'border-neon/30 bg-surface text-neon/80',
  CANCELLED: 'border-danger/40 bg-danger/10 text-danger',
  NO_SHOW: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
};

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_LABELS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

interface TrainingCalendarProps {
  view: CalendarView;
  date: Date;
  sessions: TrainingSession[];
  onSessionClick: (session: TrainingSession) => void;
  /** Bấm vào ô trống (day/week) để tạo buổi mới — chỉ admin/staff */
  onSlotCreate?: (day: Date, hour?: number) => void;
  className?: string;
}

// ---------- helpers ----------

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** Y (%) của session trong khung giờ 06:00–22:00 */
function timeOffset(dateStr: string) {
  const d = new Date(dateStr);
  const minutes = d.getHours() * 60 + d.getMinutes();
  const total = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
  return Math.min(100, Math.max(0, ((minutes - CALENDAR_START_HOUR * 60) / total) * 100));
}

function durationMinutes(s: TrainingSession) {
  return (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000;
}

function SessionChip({
  session,
  onClick,
  dense = false,
}: {
  session: TrainingSession;
  onClick: () => void;
  dense?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'block w-full rounded-md border px-1.5 py-1 text-left transition-colors hover:brightness-125',
        STATUS_STYLES[session.status] || STATUS_STYLES.SCHEDULED,
        dense ? 'text-[10px] leading-tight' : 'text-[11px] leading-tight',
      )}
    >
      <span className="block truncate font-semibold">{session.title}</span>
      {!dense && (
        <span className="block truncate opacity-75">
          {new Date(session.startTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {' – '}
          {new Date(session.endTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {session.member ? ` · ${session.member.fullName}` : ''}
        </span>
      )}
    </button>
  );
}

// ---------- main ----------

export function TrainingCalendar({
  view,
  date,
  sessions,
  onSessionClick,
  onSlotCreate,
  className,
}: TrainingCalendarProps) {
  const weekDays = useMemo(() => {
    const start = startOfDay(date);
    const monday = addDays(start, 1 - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [date]);

  const monthCells = useMemo(() => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const gridStart = addDays(first, -((first.getDay() + 6) % 7)); // Thứ 2 đầu tuần
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [date]);

  const sessionsByDay = useMemo(() => {
    const map: Record<string, TrainingSession[]> = {};
    for (const s of sessions) {
      const k = dayKey(new Date(s.startTime));
      (map[k] ||= []).push(s);
    }
    return map;
  }, [sessions]);

  const hourSlots = useMemo(() => {
    const arr: number[] = [];
    for (let h = CALENDAR_START_HOUR; h <= CALENDAR_END_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  const renderTimeColumn = (day: Date, isToday: boolean) => {
    const key = dayKey(day);
    const daySessions = (sessionsByDay[key] || []).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    return (
      <div className="relative min-w-0 flex-1">
        {/* grid lines */}
        {hourSlots.map((h) => (
          <div
            key={h}
            className="border-t border-line/60"
            style={{ height: `${100 / (CALENDAR_END_HOUR - CALENDAR_START_HOUR)}%` }}
          >
            {onSlotCreate && (
              <button
                type="button"
                onClick={() => onSlotCreate(day, h)}
                className="block size-full opacity-0 transition-opacity hover:bg-neon/5 hover:opacity-100"
                aria-label={`Tạo buổi tập lúc ${h}:00`}
              />
            )}
          </div>
        ))}
        {/* sessions */}
        {daySessions.map((s) => (
          <div
            key={s.id}
            className="absolute inset-x-1 z-10"
            style={{
              top: `${timeOffset(s.startTime)}%`,
              height: `${Math.max(3, (durationMinutes(s) / ((CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60)) * 100)}%`,
            }}
          >
            <SessionChip session={s} onClick={() => onSessionClick(s)} />
          </div>
        ))}
        {/* today indicator */}
        {isToday && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-neon"
            style={{ top: `${timeOffset(new Date().toISOString())}%` }}
          />
        )}
      </div>
    );
  };

  if (view === 'month') {
    return (
      <div className={cn('rounded-2xl border border-line bg-surface overflow-hidden', className)}>
        {/* header row */}
        <div className="grid grid-cols-7 border-b border-line bg-ink/60">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthCells.map((cell) => {
            const key = dayKey(cell);
            const cellSessions = (sessionsByDay[key] || []).sort(
              (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
            );
            const inMonth = cell.getMonth() === date.getMonth();
            const isToday = isSameDay(cell, new Date());
            return (
              <div
                key={key}
                className={cn(
                  'min-h-[92px] border-b border-r border-line/60 p-1.5 transition-colors',
                  !inMonth && 'bg-ink/40',
                  isToday && 'bg-neon/5',
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full text-[11px] font-bold',
                    isToday ? 'bg-neon text-ink' : inMonth ? 'text-chalk' : 'text-muted/50',
                  )}
                >
                  {cell.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {cellSessions.slice(0, 3).map((s) => (
                    <SessionChip key={s.id} session={s} onClick={() => onSessionClick(s)} dense />
                  ))}
                  {cellSessions.length > 3 && (
                    <p className="px-1 text-[10px] font-semibold text-neon">
                      +{cellSessions.length - 3} buổi nữa
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'week') {
    return (
      <div className={cn('rounded-2xl border border-line bg-surface overflow-hidden', className)}>
        <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-line bg-ink/60">
          <div />
          {weekDays.map((d) => {
            const today = isSameDay(d, new Date());
            return (
              <div key={dayKey(d)} className="py-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  {DAY_LABELS[d.getDay()]}
                </p>
                <p
                  className={cn(
                    'mx-auto mt-0.5 inline-flex size-6 items-center justify-center rounded-full text-xs font-bold',
                    today ? 'bg-neon text-ink' : 'text-chalk',
                  )}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[52px_repeat(7,1fr)]">
          <div className="relative">
            {hourSlots.map((h) => (
              <div
                key={h}
                className="relative text-right pr-2 text-[10px] font-medium text-muted"
                style={{ height: `${100 / (CALENDAR_END_HOUR - CALENDAR_START_HOUR)}%` }}
              >
                <span className="absolute -top-1.5 right-2">{h}:00</span>
              </div>
            ))}
          </div>
          {weekDays.map((d) => (
            <div key={dayKey(d)} className="relative border-l border-line/60">
              {hourSlots.map((h) => (
                <div
                  key={h}
                  className="border-t border-line/40"
                  style={{ height: `${100 / (CALENDAR_END_HOUR - CALENDAR_START_HOUR)}%` }}
                >
                  {onSlotCreate && (
                    <button
                      type="button"
                      onClick={() => onSlotCreate(d, h)}
                      className="block size-full opacity-0 transition-opacity hover:bg-neon/5 hover:opacity-100"
                      aria-label={`Tạo buổi tập ${dayKey(d)} ${h}:00`}
                    />
                  )}
                </div>
              ))}
              {renderTimeColumn(d, isSameDay(d, new Date()))}
              {isSameDay(d, new Date()) && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 h-[2px] bg-neon"
                  style={{ top: `${timeOffset(new Date().toISOString())}%` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // day view
  return (
    <div className={cn('rounded-2xl border border-line bg-surface overflow-hidden', className)}>
      <div className="border-b border-line bg-ink/60 px-4 py-2.5">
        <p className="text-sm font-bold text-chalk">
          {DAY_LABELS[date.getDay()]}, {date.getDate()}{' '}
          {MONTH_LABELS[date.getMonth()].toLowerCase().replace('tháng ', 'tháng ')}{' '}
          {date.getFullYear()}
        </p>
      </div>
      <div className="grid grid-cols-[56px_1fr]">
        <div className="relative">
          {hourSlots.map((h) => (
            <div
              key={h}
              className="relative text-right pr-2 text-[10px] font-medium text-muted"
              style={{ height: `${100 / (CALENDAR_END_HOUR - CALENDAR_START_HOUR)}%` }}
            >
              <span className="absolute -top-1.5 right-2">{h}:00</span>
            </div>
          ))}
        </div>
        {renderTimeColumn(date, isSameDay(date, new Date()))}
      </div>
    </div>
  );
}

// ---------- navigation toolbar ----------

export function CalendarToolbar({
  view,
  onViewChange,
  date,
  onNavigate,
  extra,
}: {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  date: Date;
  onNavigate: (dir: -1 | 1) => void;
  extra?: React.ReactNode;
}) {
  const isTodayView =
    isSameDay(date, new Date()) ||
    (view === 'week' &&
      isSameDay(addDays(date, -(date.getDay() === 0 ? 6 : date.getDay() - 1)), new Date()));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-xl border border-line bg-surface p-0.5">
        {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewChange(v)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors',
              view === v ? 'bg-neon text-ink' : 'text-muted hover:text-chalk',
            )}
          >
            {v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onNavigate(-1)}
          className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-neon/50 hover:text-neon"
          aria-label="Trước"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-[110px] text-center text-sm font-bold text-chalk">
          <CalendarDays className="mr-1.5 inline size-4 text-neon" />
          {dayKey(date).slice(0, 10)}
        </span>
        <button
          type="button"
          onClick={() => onNavigate(1)}
          className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-neon/50 hover:text-neon"
          aria-label="Sau"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onViewChange(view)}
        className={cn(
          'rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors',
          isTodayView
            ? 'border-neon/40 bg-neon/10 text-neon'
            : 'border-line bg-surface text-muted hover:border-neon/50 hover:text-neon',
        )}
        title="Về hôm nay"
      >
        Hôm nay
      </button>

      {extra}
    </div>
  );
}
