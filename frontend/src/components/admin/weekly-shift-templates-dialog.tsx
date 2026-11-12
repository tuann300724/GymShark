'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { StaffShiftTemplatePayload, staffShiftApi } from '@/services/staff-shift.service';
import { CalendarDays, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  staff: { id: string; fullName: string; email: string }[];
  onClose: () => void;
  onGenerated: () => void;
}

const WEEKDAYS = [
  { value: '1', label: 'Thứ Hai' },
  { value: '2', label: 'Thứ Ba' },
  { value: '3', label: 'Thứ Tư' },
  { value: '4', label: 'Thứ Năm' },
  { value: '5', label: 'Thứ Sáu' },
  { value: '6', label: 'Thứ Bảy' },
  { value: '7', label: 'Chủ Nhật' },
];

const EMPTY_FORM = {
  staffId: '',
  title: '',
  weekday: '1',
  startTime: '08:00',
  endTime: '12:00',
  notes: '',
};

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function defaultRange() {
  const from = new Date();
  const daysUntilMonday = (8 - from.getDay()) % 7;
  from.setDate(from.getDate() + daysUntilMonday);
  const to = new Date(from);
  to.setDate(to.getDate() + 13);
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [range, setRange] = useState(defaultRange);

  const templatesQuery = useQuery({
    queryKey: ['staff-shift-templates'],
    queryFn: staffShiftApi.templates,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (payload: StaffShiftTemplatePayload) => staffShiftApi.createTemplate(payload),
    onSuccess: () => {
      toast.success('Đã lưu mẫu ca lặp hàng tuần');
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['staff-shift-templates'] });
    },
    onError: (error) =>
      toast.error('Không thể lưu mẫu ca', getErrorMessage(error, 'Vui lòng thử lại.')),
  });

  const removeMutation = useMutation({
    mutationFn: staffShiftApi.removeTemplate,
    onSuccess: () => {
      toast.success('Đã xóa mẫu ca');
      queryClient.invalidateQueries({ queryKey: ['staff-shift-templates'] });
    },
    onError: (error) =>
      toast.error('Không thể xóa mẫu ca', getErrorMessage(error, 'Vui lòng thử lại.')),
  });

  const generateMutation = useMutation({
    mutationFn: staffShiftApi.generateFromTemplates,
    onSuccess: (result) => {
      toast.success('Đã tạo lịch ca', result.message);
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
      onGenerated();
    },
    onError: (error) =>
      toast.error(
        'Không thể tạo lịch ca',
        getErrorMessage(error, 'Vui lòng kiểm tra khoảng ngày.'),
      ),
  });

  const submitTemplate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({
      ...form,
      weekday: Number(form.weekday),
      notes: form.notes.trim() || undefined,
    });
  };

  const generate = () => {
    if (!range.from || !range.to) {
      toast.error('Thiếu khoảng ngày', 'Hãy chọn ngày bắt đầu và ngày kết thúc.');
      return;
    }
    if (window.confirm(`Sinh các ca theo mẫu từ ${range.from} đến ${range.to}?`)) {
      generateMutation.mutate(range);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Mẫu phân ca hàng tuần"
      description="Lưu lịch lặp theo thứ, sau đó sinh ca cụ thể cho tối đa 31 ngày. Xóa mẫu không ảnh hưởng các ca đã được tạo."
      className="max-w-3xl"
    >
      <div className="space-y-6">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitTemplate}>
          <Select
            label="Nhân viên"
            value={form.staffId}
            options={[
              { value: '', label: 'Chọn nhân viên' },
              ...staff.map((item) => ({
                value: item.id,
                label: `${item.fullName} · ${item.email}`,
              })),
            ]}
            onChange={(event) => setForm({ ...form, staffId: event.target.value })}
            required
          />
          <Input
            label="Tên ca"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            maxLength={255}
            required
          />
          <Select
            label="Lặp vào"
            value={form.weekday}
            options={WEEKDAYS}
            onChange={(event) => setForm({ ...form, weekday: event.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bắt đầu"
              type="time"
              value={form.startTime}
              onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              required
            />
            <Input
              label="Kết thúc"
              type="time"
              value={form.endTime}
              onChange={(event) => setForm({ ...form, endTime: event.target.value })}
              required
            />
          </div>
          <Input
            label="Ghi chú (không bắt buộc)"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            maxLength={1000}
          />
          <div className="flex items-end sm:justify-end">
            <Button type="submit" isLoading={createMutation.isPending}>
              Lưu mẫu ca
            </Button>
          </div>
        </form>

        <section className="space-y-3 border-t border-line pt-5">
          <h3 className="font-display text-lg font-bold uppercase text-chalk">Mẫu đang lưu</h3>
          {templatesQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : templatesQuery.isError ? (
            <div className="flex items-center justify-between gap-3 text-sm text-danger">
              Không tải được danh sách mẫu ca.
              <Button variant="outline" size="sm" onClick={() => templatesQuery.refetch()}>
                Tải lại
              </Button>
            </div>
          ) : templatesQuery.data?.length ? (
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {templatesQuery.data.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ink/40 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-chalk">
                      {template.title} · {template.staffName}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {WEEKDAYS[template.weekday - 1]?.label} ·{' '}
                      {`${String(Math.floor(template.startMinute / 60)).padStart(2, '0')}:${String(
                        template.startMinute % 60,
                      ).padStart(2, '0')}`}
                      {' – '}
                      {`${String(Math.floor(template.endMinute / 60)).padStart(2, '0')}:${String(
                        template.endMinute % 60,
                      ).padStart(2, '0')}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Xóa mẫu ${template.title}`}
                    isLoading={removeMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Xóa mẫu "${template.title}"?`)) {
                        removeMutation.mutate(template.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Chưa có mẫu ca. Tạo mẫu ở biểu mẫu phía trên.</p>
          )}
        </section>

        <section className="space-y-3 border-t border-line pt-5">
          <h3 className="font-display text-lg font-bold uppercase text-chalk">
            Sinh ca từ mẫu đã lưu
          </h3>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
            <Button
              onClick={generate}
              isLoading={generateMutation.isPending}
              disabled={!templatesQuery.data?.length}
            >
              <CalendarDays className="mr-2 size-4" />
              Sinh lịch
            </Button>
          </div>
          <p className="text-xs text-muted">
            Ca đã tồn tại hoặc đã qua sẽ được bỏ qua; lịch tối đa 31 ngày mỗi lần. Giờ ca dùng múi
            giờ Việt Nam.
          </p>
        </section>
      </div>
    </Dialog>
  );
}
