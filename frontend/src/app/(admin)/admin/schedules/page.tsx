'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { trainingApi } from '@/services/training.service';
import { trainerApi } from '@/services/trainer.service';
import {
  TrainingCalendar,
  CalendarToolbar,
  type CalendarView,
} from '@/components/training/training-calendar';
import { SessionDetailDialog } from '@/components/training/session-detail-dialog';
import { SessionFormDialog } from '@/components/training/session-form-dialog';
import { SessionStatusBadge, SessionTypeBadge } from '@/components/training/session-badges';
import { formatDateTime } from '@/lib/utils';
import type { TrainingSession } from '@/services/types';
import { CalendarDays, Plus, CalendarPlus } from 'lucide-react';

export default function SchedulesPage() {
  const queryClient = useQueryClient();

  const [view, setView] = useState<CalendarView>('month');
  const [date, setDate] = useState(() => new Date());
  const [trainerId, setTrainerId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingSession | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);

  // Dải thời gian hiển thị theo view
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

  const { data: sessionData, isLoading } = useQuery({
    queryKey: [
      'training-sessions',
      { view, from: range.from.toISOString(), to: range.to.toISOString(), trainerId, status, type },
    ],
    queryFn: () =>
      trainingApi.list({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        trainerId: trainerId === 'ALL' ? undefined : trainerId,
        status: status === 'ALL' ? undefined : status,
        type: type === 'ALL' ? undefined : type,
        limit: 500,
      }),
  });

  const { data: trainersData } = useQuery({
    queryKey: ['trainers-schedule-filter'],
    queryFn: () => trainerApi.list({ limit: 100 }),
  });

  const sessions = sessionData?.data || [];

  const navigate = (dir: -1 | 1) => {
    setDate((d) => {
      const n = new Date(d);
      if (view === 'day') n.setDate(n.getDate() + dir);
      else if (view === 'week') n.setDate(n.getDate() + 7 * dir);
      else n.setMonth(n.getMonth() + dir);
      return n;
    });
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['training-sessions'] });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <CalendarDays className="size-6 text-neon" />
            Lịch Tập & PT Sessions
          </h1>
          <p className="text-xs text-muted mt-1">
            Lịch kèm riêng (PT), lớp nhóm và buổi tập tự do theo ngày / tuần / tháng
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          className="font-semibold text-xs"
          onClick={() => {
            setEditing(null);
            setDefaultDate(date.toISOString().slice(0, 10));
            setFormOpen(true);
          }}
        >
          <Plus className="size-4 mr-1.5" />
          Tạo Lịch Tập
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <CalendarToolbar
          view={view}
          onViewChange={(v) => setView(v)}
          date={date}
          onNavigate={navigate}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Huấn luyện viên"
            value={trainerId}
            onChange={(e) => setTrainerId(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả HLV' },
              ...(trainersData?.data || []).map((t) => ({
                value: t.id,
                label: t.user.fullName,
              })),
            ]}
          />
          <Select
            label="Trạng thái"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'SCHEDULED', label: 'Chờ diễn ra' },
              { value: 'COMPLETED', label: 'Hoàn thành' },
              { value: 'CANCELLED', label: 'Đã hủy' },
              { value: 'NO_SHOW', label: 'Vắng mặt' },
            ]}
          />
          <Select
            label="Loại buổi"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả loại' },
              { value: 'PERSONAL_TRAINING', label: 'Kèm riêng (PT)' },
              { value: 'GROUP_CLASS', label: 'Lớp nhóm' },
              { value: 'FREE_TRAINING', label: 'Tập tự do' },
            ]}
          />
        </div>
      </div>

      {/* Desktop calendar */}
      <div className="hidden lg:block">
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
            onSlotCreate={(day, hour) => {
              setEditing(null);
              const iso = `${day.toISOString().slice(0, 10)}`;
              setDefaultDate(iso);
              setFormOpen(true);
            }}
          />
        )}
      </div>

      {/* Mobile agenda */}
      <div className="lg:hidden">
        {isLoading ? (
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="mt-2 h-20 w-full" />
            </CardContent>
          </Card>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-xs text-muted">
              Không có buổi tập trong khoảng này.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
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
                  {formatDateTime(s.startTime)} · {s.trainer?.user.fullName}
                  {s.member ? ` · ${s.member.fullName}` : ''}
                </p>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setDefaultDate(date.toISOString().slice(0, 10));
                setFormOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neon/40 bg-neon/5 py-3 text-xs font-bold text-neon"
            >
              <CalendarPlus className="size-4" /> Tạo buổi tập mới
            </button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <SessionDetailDialog
        sessionId={detailId}
        onClose={() => setDetailId(null)}
        canManage
        onChanged={refresh}
      />
      <SessionFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
        editing={editing}
        defaultDate={defaultDate}
      />
    </div>
  );
}
