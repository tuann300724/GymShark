'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { staffShiftApi } from '@/services/staff-shift.service';
import { CalendarDays } from 'lucide-react';

interface Props {
  open: boolean;
  staff: { id: string; fullName: string; email: string }[];
  onClose: () => void;
  onGenerated: () => void;
}

interface PreviewShift {
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  notes: string;
}

const WEEKDAYS = [
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
];

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function defaultRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - (from.getDay() || 7)) % 7;
  from.setDate(from.getDate() + daysUntilMonday);
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  return { from: toDateInputValue(from), to: toDateInputValue(to) };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) {
      return message.filter((item) => typeof item === 'string').join(', ');
    }
  }
  return error instanceof Error ? error.message : fallback;
}

export function WeeklyShiftTemplatesDialog({ open, staff, onClose, onGenerated }: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [staffId, setStaffId] = useState('');
  const [title, setTitle] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [range, setRange] = useState(defaultRange);
  const [preview, setPreview] = useState<PreviewShift[]>([]);
  const [conflictIndexes, setConflictIndexes] = useState<number[]>([]);

  const createMutation = useMutation({
    mutationFn: staffShiftApi.quickCreate,
    onSuccess: (result) => {
      toast.success('Đã tạo ca nhanh', result.message);
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
      onGenerated();
      onClose();
    },
    onError: (error) =>
      toast.error('Không thể tạo ca nhanh', getErrorMessage(error, 'Vui lòng thử lại.')),
  });

  const toggleWeekday = (weekday: number) => {
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((item) => item !== weekday)
        : [...current, weekday].sort(),
    );
  };

  const submitQuickCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!staffId) {
      toast.error('Thiếu nhân viên', 'Hãy chọn nhân viên.');
      return;
    }
    if (!weekdays.length) {
      toast.error('Thiếu ngày làm', 'Hãy chọn ít nhất một ngày trong tuần.');
      return;
    }
    if (!range.from || !range.to) {
      toast.error('Thiếu khoảng ngày', 'Hãy chọn từ ngày và đến ngày.');
      return;
    }
    const from = new Date(`${range.from}T00:00:00`);
    const to = new Date(`${range.to}T00:00:00`);
    if (to < from) {
      toast.error('Khoảng ngày không hợp lệ', 'Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }
    const nextPreview: PreviewShift[] = [];
    for (let date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) {
      const jsDay = date.getDay();
      const mondayBasedDay = jsDay === 0 ? 6 : jsDay - 1;
      if (!weekdays.includes(mondayBasedDay)) continue;
      const dateText = toDateInputValue(date);
      nextPreview.push({
        date: dateText,
        title: title.trim(),
        startTime: `${dateText}T${startTime}:00`,
        endTime: `${dateText}T${endTime}:00`,
        notes: notes.trim(),
      });
    }
    setPreview(nextPreview);
  };

  const updatePreview = (index: number, patch: Partial<PreviewShift>) => {
    setPreview((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
    setConflictIndexes([]);
  };

  const removePreview = (index: number) => {
    setPreview((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setConflictIndexes([]);
  };

  const confirmCreate = () => {
    if (!preview.length) {
      toast.error('Danh sách trống', 'Không có ca nào để tạo.');
      return;
    }
    const invalidIndexes = new Set<number>();
    for (let index = 0; index < preview.length; index += 1) {
      const current = preview[index];
      const start = new Date(`${current.startTime}+07:00`).getTime();
      const end = new Date(`${current.endTime}+07:00`).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        invalidIndexes.add(index);
      }
      for (let otherIndex = 0; otherIndex < preview.length; otherIndex += 1) {
        if (index === otherIndex) continue;
        const other = preview[otherIndex];
        const otherStart = new Date(`${other.startTime}+07:00`).getTime();
        const otherEnd = new Date(`${other.endTime}+07:00`).getTime();
        if (start < otherEnd && end > otherStart) {
          invalidIndexes.add(index);
          invalidIndexes.add(otherIndex);
        }
      }
    }
    if (invalidIndexes.size) {
      const indexes = Array.from(invalidIndexes);
      setConflictIndexes(indexes);
      toast.error(
        'Danh sách ca bị trùng hoặc sai giờ',
        'Ca đánh dấu đỏ đang chồng giờ. Hãy chỉnh lại giờ bắt đầu/kết thúc.',
      );
      return;
    }
    createMutation.mutate({
      staffId,
      title: title.trim(),
      weekdays,
      startTime,
      endTime,
      from: range.from,
      to: range.to,
      notes: notes.trim() || undefined,
      shifts: preview.map((item) => ({
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        notes: item.notes.trim() || undefined,
      })),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tạo ca nhanh trong tuần"
      description="Chọn nhân viên, các ngày từ thứ Hai đến thứ Bảy và giờ làm trong khoảng ngày."
      className="max-w-3xl"
    >
      <form className="space-y-5" onSubmit={submitQuickCreate}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Nhân viên"
            value={staffId}
            options={[
              { value: '', label: 'Chọn nhân viên' },
              ...staff.map((item) => ({
                value: item.id,
                label: `${item.fullName} · ${item.email}`,
              })),
            ]}
            onChange={(event) => setStaffId(event.target.value)}
            required
          />
          <Input
            label="Tên ca"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ví dụ: Ca sáng"
            maxLength={255}
            required
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-chalk">Các ngày trong tuần</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {WEEKDAYS.map((weekday) => {
              const checked = weekdays.includes(weekday.value);
              return (
                <label
                  key={weekday.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${
                    checked
                      ? 'border-neon/50 bg-neon/10 text-chalk'
                      : 'border-line bg-ink/40 text-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleWeekday(weekday.value)}
                    className="size-4 accent-[#B7FF00]"
                  />
                  {weekday.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Giờ bắt đầu"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
          />
          <Input
            label="Giờ kết thúc"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Từ ngày"
            type="date"
            value={range.from}
            onChange={(event) => setRange({ ...range, from: event.target.value })}
            required
          />
          <Input
            label="Đến ngày"
            type="date"
            value={range.to}
            onChange={(event) => setRange({ ...range, to: event.target.value })}
            required
          />
        </div>

        <Input
          label="Ghi chú (không bắt buộc)"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={1000}
        />

        {!preview.length ? (
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">
              <CalendarDays className="mr-2 size-4" />
              Xem danh sách ca
            </Button>
          </div>
        ) : (
          <section className="space-y-3 border-t border-line pt-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold uppercase text-chalk">
                Danh sách xem trước
              </h3>
              <span className="text-xs text-muted">{preview.length} ca</span>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {preview.map((item, index) => (
                <div
                  key={`${item.date}-${index}`}
                  className={`rounded-xl border p-3 ${
                    conflictIndexes.includes(index) ? 'border-danger/70 bg-danger/5' : 'border-line'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-chalk">
                      {new Date(`${item.date}T00:00:00`).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePreview(index)}
                    >
                      Bỏ ca
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input
                      label="Tên ca"
                      value={item.title}
                      onChange={(event) => updatePreview(index, { title: event.target.value })}
                      required
                    />
                    <Input
                      label="Giờ bắt đầu"
                      type="datetime-local"
                      value={item.startTime}
                      onChange={(event) => updatePreview(index, { startTime: event.target.value })}
                      required
                    />
                    <Input
                      label="Giờ kết thúc"
                      type="datetime-local"
                      value={item.endTime}
                      onChange={(event) => updatePreview(index, { endTime: event.target.value })}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button type="button" variant="outline" onClick={() => setPreview([])}>
                Quay lại chỉnh
              </Button>
              <Button type="button" isLoading={createMutation.isPending} onClick={confirmCreate}>
                Tạo ca
              </Button>
            </div>
          </section>
        )}
      </form>
    </Dialog>
  );
}
