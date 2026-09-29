'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { trainingApi } from '@/services/training.service';
import { trainerApi } from '@/services/trainer.service';
import { formatDateTime } from '@/lib/utils';
import type { TrainingSession } from '@/services/types';
import { Search, UserPlus, CheckCircle2, AlertTriangle } from 'lucide-react';

const sessionSchema = z
  .object({
    trainerId: z.string().min(1, 'Vui lòng chọn huấn luyện viên'),
    type: z.enum(['PERSONAL_TRAINING', 'GROUP_CLASS', 'FREE_TRAINING']),
    memberId: z.string().optional(),
    branchId: z.string().optional(),
    roomId: z.string().optional(),
    title: z.string().min(2, 'Tiêu đề quá ngắn'),
    description: z.string().optional(),
    date: z.string().min(1, 'Chọn ngày'),
    startTime: z.string().min(1, 'Chọn giờ bắt đầu'),
    endTime: z.string().min(1, 'Chọn giờ kết thúc'),
    notes: z.string().optional(),
  })
  .refine((v) => !v.startTime || !v.endTime || v.endTime > v.startTime, {
    message: 'Giờ kết thúc phải sau giờ bắt đầu',
    path: ['endTime'],
  });

type SessionFormValues = z.infer<typeof sessionSchema>;

interface SessionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** Đang sửa buổi tập (undefined = tạo mới) */
  editing?: TrainingSession | null;
  /** Ngày mặc định (YYYY-MM-DD) khi tạo từ calendar */
  defaultDate?: string;
}

function toLocalInputs(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function SessionFormDialog({
  open,
  onClose,
  onSaved,
  editing,
  defaultDate,
}: SessionFormDialogProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [memberQuery, setMemberQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);

  const isEdit = !!editing;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      trainerId: '',
      type: 'PERSONAL_TRAINING',
      memberId: '',
      title: '',
      date: defaultDate || '',
      startTime: '07:00',
      endTime: '08:00',
    },
  });

  const watchType = watch('type');
  const watchTrainerId = watch('trainerId');
  const watchBranchId = watch('branchId');
  const watchMemberId = watch('memberId');

  // Đổ dữ liệu khi mở dialog (tạo mới / sửa)
  useEffect(() => {
    if (!open) return;
    if (editing) {
      const start = toLocalInputs(editing.startTime);
      const end = toLocalInputs(editing.endTime);
      reset({
        trainerId: editing.trainer?.id || '',
        type: editing.type as any,
        memberId: editing.member?.id || '',
        branchId: editing.branch?.id || '',
        roomId: editing.room?.id || '',
        title: editing.title,
        description: editing.description || '',
        date: start.date,
        startTime: start.time,
        endTime: end.time,
        notes: editing.notes || '',
      });
    } else {
      reset({
        trainerId: '',
        type: 'PERSONAL_TRAINING',
        memberId: '',
        title: '',
        date: defaultDate || new Date().toISOString().slice(0, 10),
        startTime: '07:00',
        endTime: '08:00',
      });
    }
  }, [open, editing, defaultDate, reset]);

  // Danh sách HLV ACTIVE (+ HLV hiện tại của buổi đang sửa)
  const { data: trainersData } = useQuery({
    queryKey: ['trainers-active-form'],
    queryFn: () => trainerApi.list({ limit: 100, status: 'ACTIVE' }),
    enabled: open,
  });
  const trainers = useMemo(() => {
    const list = trainersData?.data || [];
    if (editing?.trainer && !list.some((t) => t.id === editing.trainer!.id)) {
      return [editing.trainer, ...list];
    }
    return list;
  }, [trainersData, editing]);

  const { data: branchesData } = useQuery({
    queryKey: ['branches-form'],
    queryFn: async () => (await apiClient.get('/branches')).data,
    enabled: open,
  });

  const { data: roomsData } = useQuery({
    queryKey: ['branch-rooms-form', watchBranchId],
    queryFn: async () => {
      if (!watchBranchId) return [];
      const res = await apiClient.get(`/branches/${watchBranchId}`);
      return res.data?.rooms || [];
    },
    enabled: open && !!watchBranchId,
  });

  // Tìm kiếm hội viên
  const searchMembers = async (q: string) => {
    setMemberSearching(true);
    try {
      const res = await apiClient.get('/members', {
        params: { search: q, limit: 8, status: 'ACTIVE' },
      });
      setMembers(res.data?.data || []);
    } catch {
      setMembers([]);
    } finally {
      setMemberSearching(false);
    }
  };

  useEffect(() => {
    if (open && !editing) {
      searchMembers('');
      setMemberQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // HLV hiện tại của member được chọn (để cảnh báo khi PT chưa được gán)
  const { data: memberTrainer } = useQuery({
    queryKey: ['member-current-trainer', watchMemberId],
    queryFn: async () => {
      if (!watchMemberId) return null;
      const res = await apiClient.get(`/members/${watchMemberId}/trainers`);
      const list = res.data || [];
      return list.find((a: any) => a.status === 'ACTIVE') || null;
    },
    enabled: open && !!watchMemberId,
  });

  const selectedMember = members.find((m) => m.id === watchMemberId);

  const mutation = useMutation({
    mutationFn: (values: SessionFormValues) => {
      const startIso = new Date(`${values.date}T${values.startTime}`).toISOString();
      const endIso = new Date(`${values.date}T${values.endTime}`).toISOString();
      const payload = {
        trainerId: values.trainerId,
        memberId: values.memberId || undefined,
        branchId: values.branchId || undefined,
        roomId: values.roomId || undefined,
        type: values.type,
        title: values.title,
        description: values.description || undefined,
        startTime: startIso,
        endTime: endIso,
        notes: values.notes || undefined,
      };
      return editing ? trainingApi.update(editing.id, payload) : trainingApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật buổi tập' : 'Đã tạo buổi tập mới');
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['member-sessions'] });
      onSaved?.();
      onClose();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      toast.error('Không thể lưu buổi tập', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const onSubmit = (values: SessionFormValues) => {
    if (values.type === 'PERSONAL_TRAINING' && !values.memberId) {
      toast.error('Buổi kèm riêng (PT) bắt buộc phải chọn hội viên');
      return;
    }
    mutation.mutate(values);
  };

  const ptNotAssigned =
    watchType === 'PERSONAL_TRAINING' &&
    !!watchMemberId &&
    !!watchTrainerId &&
    memberTrainer &&
    memberTrainer.trainerId !== watchTrainerId;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa buổi tập' : 'Tạo buổi tập mới'}
      description={
        isEdit && editing
          ? `Đang sửa: ${editing.title}`
          : 'Lịch học cùng HLV, lớp nhóm hoặc buổi tập tự do'
      }
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select
              label="Huấn luyện viên *"
              error={errors.trainerId?.message}
              options={[
                { value: '', label: '-- Chọn HLV --' },
                ...trainers.map((t) => ({
                  value: t.id,
                  label:
                    t.user.fullName +
                    (t.specialization ? ` · ${t.specialization.split(',')[0]}` : ''),
                })),
              ]}
              {...register('trainerId')}
            />
          </div>

          <Select
            label="Loại buổi tập *"
            error={errors.type?.message}
            options={[
              { value: 'PERSONAL_TRAINING', label: 'Kèm riêng (PT)' },
              { value: 'GROUP_CLASS', label: 'Lớp nhóm (Group Class)' },
              { value: 'FREE_TRAINING', label: 'Tập tự do' },
            ]}
            {...register('type')}
          />

          <div className="sm:col-span-2">
            <MemberCombobox
              memberId={watchMemberId ?? ''}
              onSelect={(id) => setValue('memberId', id, { shouldValidate: true })}
              query={memberQuery}
              setQuery={(q) => {
                setMemberQuery(q);
                searchMembers(q);
              }}
              searching={memberSearching}
              members={members}
            />
            {selectedMember && (
              <p className="mt-1.5 text-xs text-muted">
                Đã chọn: <span className="font-semibold text-chalk">{selectedMember.fullName}</span>{' '}
                ({selectedMember.code})
                {memberTrainer && (
                  <span className="ml-1 text-muted">
                    · HLV hiện tại:{' '}
                    <span className="font-medium text-neon">
                      {memberTrainer.trainer?.user?.fullName}
                    </span>
                  </span>
                )}
              </p>
            )}
            {ptNotAssigned && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-400">
                <AlertTriangle className="size-3.5" />
                HLV đã chọn chưa được gán cho hội viên này — buổi PT sẽ bị từ chối ở máy chủ.
              </p>
            )}
          </div>

          <Input
            label="Tiêu đề buổi tập *"
            placeholder="VD: PT - Tăng cơ toàn thân"
            error={errors.title?.message}
            {...register('title')}
          />

          <Select
            label="Chi nhánh"
            error={errors.branchId?.message}
            options={[
              { value: '', label: '-- Theo HLV (mặc định) --' },
              ...(branchesData || []).map((b: any) => ({ value: b.id, label: b.name })),
            ]}
            {...register('branchId')}
          />

          <Select
            label="Phòng tập"
            error={errors.roomId?.message}
            options={[
              { value: '', label: '-- Chưa chọn phòng --' },
              ...(roomsData || [])
                .filter((r: any) => r.status === 'AVAILABLE' || r.id === editing?.room?.id)
                .map((r: any) => ({
                  value: r.id,
                  label: `${r.name} (${r.capacity} chỗ${r.code ? ` · ${r.code}` : ''})`,
                })),
            ]}
            {...register('roomId')}
          />
          {watchBranchId &&
            (roomsData || []).filter((r: any) => r.status === 'AVAILABLE').length === 0 && (
              <p className="text-[11px] font-medium text-amber-400">
                Chi nhánh này hiện không có phòng SẴN SÀNG — cần mở phòng trước khi đặt lịch.
              </p>
            )}

          <div>
            <Input label="Ngày *" type="date" error={errors.date?.message} {...register('date')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bắt đầu *"
              type="time"
              error={errors.startTime?.message}
              {...register('startTime')}
            />
            <Input
              label="Kết thúc *"
              type="time"
              error={errors.endTime?.message}
              {...register('endTime')}
            />
          </div>

          <div className="sm:col-span-2">
            <Textarea
              label="Mô tả"
              placeholder="Nội dung buổi tập, lưu ý kỹ thuật..."
              rows={2}
              {...register('description')}
            />
          </div>

          <div className="sm:col-span-2">
            <Textarea
              label="Ghi chú nội bộ"
              placeholder="Chỉ admin/staff nhìn thấy..."
              rows={2}
              {...register('notes')}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" size="md" isLoading={mutation.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo buổi tập'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ------------------ Member search combobox ------------------

function MemberCombobox({
  memberId,
  onSelect,
  query,
  setQuery,
  searching,
  members,
}: {
  memberId: string;
  onSelect: (id: string) => void;
  query: string;
  setQuery: (q: string) => void;
  searching: boolean;
  members: any[];
}) {
  return (
    <div>
      <label
        htmlFor="member-search-input"
        className="block text-sm font-semibold text-muted mb-1.5"
      >
        Hội viên
      </label>
      {memberId ? (
        <div className="flex items-center justify-between rounded-sm border border-neon/40 bg-neon/5 px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-sm text-chalk">
            <UserPlus className="size-4 text-neon" />
            Đã chọn hội viên
          </span>
          <button
            type="button"
            onClick={() => onSelect('')}
            className="text-xs font-semibold text-muted hover:text-danger"
          >
            Bỏ chọn
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            id="member-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT, mã hội viên..."
            className="h-11 w-full rounded-sm border border-line bg-ink pl-9 pr-3.5 text-sm text-chalk placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70"
          />
          {searching && <p className="mt-1 text-xs text-muted">Đang tìm...</p>}
          {!searching && query && (
            <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-xl">
              {members.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted">Không tìm thấy hội viên</p>
              ) : (
                members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelect(m.id);
                      setQuery('');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-chalk transition-colors hover:bg-ink"
                  >
                    {m.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatarUrl} alt="" className="size-7 rounded-full object-cover" />
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-full bg-neon/10 text-xs font-bold text-neon">
                        {m.fullName?.charAt(0)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{m.fullName}</span>
                      <span className="block truncate text-xs text-muted">
                        {m.code} · {m.phone || '--'}
                      </span>
                    </span>
                    {m.memberships?.some((ms: any) => ms.status === 'ACTIVE') ? (
                      <CheckCircle2 className="size-4 shrink-0 text-neon" />
                    ) : (
                      <span className="shrink-0 text-[10px] font-bold text-amber-400">HẾT HẠN</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
