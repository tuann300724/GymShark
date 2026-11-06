'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { roomApi } from '@/services/room.service';
import { classBookingApi } from '@/services/class-booking.service';
import { formatDateTime } from '@/lib/utils';
import { getStoredUser } from '@/lib/auth';
import type { TrainingSession } from '@/services/types';
import { Search, UserPlus, CheckCircle2, AlertTriangle, X } from 'lucide-react';

const sessionSchema = z
  .object({
    trainerId: z.string().min(1, 'Vui lòng chọn huấn luyện viên'),
    type: z.enum(['PERSONAL_TRAINING', 'GROUP_CLASS', 'FREE_TRAINING']),
    memberId: z.string().optional(),
    roomId: z.string().optional(),
    title: z.string().min(2, 'Tiêu đề quá ngắn'),
    description: z.string().optional(),
    date: z.string().min(1, 'Chọn ngày'),
    startTime: z.string().min(1, 'Chọn giờ bắt đầu'),
    endTime: z.string().min(1, 'Chọn giờ kết thúc'),
    notes: z.string().optional(),
    // valueAsNumber trên ô disabled/rỗng trả về NaN → preprocess về undefined để .optional() chấp nhận
    capacity: z.preprocess(
      (v) => (typeof v === 'number' && Number.isNaN(v) ? undefined : v),
      z.number().min(1, 'Tối thiểu 1').max(50, 'Tối đa 50').optional(),
    ),
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
  /** Hội viên đã gán vào ca nhóm (mode GROUP_CLASS — chọn được nhiều) */
  const [groupMembers, setGroupMembers] = useState<
    { id: string; fullName: string; code: string }[]
  >([]);
  const groupPrefilled = useRef(false);

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
  const watchMemberId = watch('memberId');
  const watchCapacity = watch('capacity');

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

  // Khi PT mở form — tự động lấy trainerId của chính mình để điền vào
  const isTrainer = getStoredUser()?.role === 'TRAINER';
  const { data: myTrainerProfile } = useQuery({
    queryKey: ['trainer-my-profile-form'],
    queryFn: () => trainerApi.myProfile(),
    enabled: open && isTrainer && !editing,
  });

  useEffect(() => {
    if (open && !editing && isTrainer && myTrainerProfile?.id) {
      setValue('trainerId', myTrainerProfile.id, { shouldValidate: true });
    }
  }, [open, editing, isTrainer, myTrainerProfile, setValue]);
  const trainers = useMemo(() => {
    const list = trainersData?.data || [];
    const extra: Array<(typeof list)[number] | NonNullable<TrainingSession['trainer']>> = [];
    if (editing?.trainer && !list.some((t) => t.id === editing.trainer!.id)) {
      extra.push(editing.trainer);
    }
    // Đảm bảo HLV hiện tại luôn có trong dropdown (kể cả khi list chưa load kịp)
    if (
      isTrainer &&
      myTrainerProfile?.id &&
      !list.some((t) => t.id === myTrainerProfile.id) &&
      !extra.some((t) => t.id === myTrainerProfile.id)
    ) {
      extra.push({
        id: myTrainerProfile.id,
        user: myTrainerProfile.user,
        specialization: myTrainerProfile.specialization,
        experienceYears: myTrainerProfile.experienceYears,
        rating: myTrainerProfile.rating,
        status: myTrainerProfile.status,
      } as any);
    }
    return [...extra, ...list];
  }, [trainersData, editing, isTrainer, myTrainerProfile]);

  const { data: roomsData } = useQuery({
    queryKey: ['rooms-form'],
    queryFn: roomApi.rooms,
    enabled: open,
  });

  // Sửa ca nhóm → lấy danh sách hội viên đã đăng ký để điền vào chips
  const { data: editingBookings } = useQuery({
    queryKey: ['class-bookings-session', editing?.id],
    queryFn: () => classBookingApi.listBySession(editing!.id),
    enabled: open && !!editing && editing.type === 'GROUP_CLASS',
  });

  useEffect(() => {
    if (!open) {
      groupPrefilled.current = false;
      setGroupMembers([]);
      return;
    }
    if (!editing || editing.type !== 'GROUP_CLASS') {
      setGroupMembers([]);
      return;
    }
    // Prefill đúng 1 lần khi data book về (tránh đè selection của người dùng khi refetch)
    if (!groupPrefilled.current && editingBookings) {
      groupPrefilled.current = true;
      setGroupMembers(
        editingBookings.data.map((b) => ({
          id: b.member.id,
          fullName: b.member.fullName,
          code: b.member.code,
        })),
      );
    }
  }, [open, editing, editingBookings]);

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
    mutationFn: async (values: SessionFormValues) => {
      const startIso = new Date(`${values.date}T${values.startTime}`).toISOString();
      const endIso = new Date(`${values.date}T${values.endTime}`).toISOString();
      const isGroup = values.type === 'GROUP_CLASS';
      const payload = {
        trainerId: values.trainerId,
        // Ca nhóm KHÔNG giữ memberId (1 người) — thành viên nằm ở ClassBooking để ca hiện "mở đăng ký"
        memberId: isGroup ? undefined : values.memberId || undefined,
        roomId: values.roomId || undefined,
        type: values.type,
        title: values.title,
        description: values.description || undefined,
        capacity: isGroup
          ? values.capacity !== undefined
            ? values.capacity
            : undefined
          : undefined,
        startTime: startIso,
        endTime: endIso,
        notes: values.notes || undefined,
      };
      const errMsg = (e: any) => {
        const m = e?.response?.data?.message;
        return Array.isArray(m) ? m.join(', ') : m || 'Lỗi không xác định';
      };

      let bookingError: string | null = null;
      if (editing) {
        await trainingApi.update(editing.id, payload);
        if (isGroup) {
          // So sánh chips với danh sách đang book → thêm người mới / bỏ người đã bỏ chọn
          const res = await classBookingApi.listBySession(editing.id);
          const currentIds = res.data.map((b) => b.member.id);
          const wanted = groupMembers.map((m) => m.id);
          const toAdd = wanted.filter((id) => !currentIds.includes(id));
          const toRemove = currentIds.filter((id) => !wanted.includes(id));
          const errs: string[] = [];
          if (toAdd.length) {
            try {
              await classBookingApi.addMembers(editing.id, toAdd);
            } catch (e) {
              errs.push(errMsg(e));
            }
          }
          for (const id of toRemove) {
            try {
              await classBookingApi.removeMember(editing.id, id);
            } catch (e) {
              errs.push(errMsg(e));
            }
          }
          if (errs.length) bookingError = Array.from(new Set(errs)).join(' · ');
        }
      } else {
        const res = await trainingApi.create(payload);
        const newId = res?.session?.id;
        if (isGroup && groupMembers.length && newId) {
          try {
            await classBookingApi.addMembers(
              newId,
              groupMembers.map((m) => m.id),
            );
          } catch (e) {
            bookingError = errMsg(e);
          }
        }
      }
      return { bookingError };
    },
    onSuccess: ({ bookingError }) => {
      if (bookingError) {
        toast.error(
          isEdit
            ? 'Đã lưu buổi tập nhưng chưa gán xong hội viên'
            : 'Đã tạo buổi tập nhưng chưa gán được hội viên',
          bookingError,
        );
      } else {
        toast.success(isEdit ? 'Đã cập nhật buổi tập' : 'Đã tạo buổi tập mới');
      }
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['member-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['class-bookings-session'] });
      queryClient.invalidateQueries({ queryKey: ['session-detail'] });
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
    if (values.type === 'GROUP_CLASS' && (!values.capacity || values.capacity < 1)) {
      toast.error('Ca nhóm phải có sức chứa (tối thiểu 1 chỗ)');
      return;
    }
    mutation.mutate(values);
  };

  // Validation fail → hiện toast thay vì "im lặng" (trường lỗi có thể bị scroll ẩn)
  const onInvalid = (errs: typeof errors) => {
    const first = Object.values(errs)[0];
    const msg = first?.message || 'Vui lòng kiểm tra lại các trường bắt buộc.';
    toast.error('Chưa thể tạo buổi tập', msg);
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
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
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
            {watchType === 'GROUP_CLASS' ? (
              <>
                <MemberCombobox
                  multiple
                  label="Hội viên trong lớp (chọn nhiều)"
                  selected={groupMembers}
                  onToggle={(m) =>
                    setGroupMembers((list) =>
                      list.some((x) => x.id === m.id)
                        ? list.filter((x) => x.id !== m.id)
                        : [...list, m],
                    )
                  }
                  query={memberQuery}
                  setQuery={(q) => {
                    setMemberQuery(q);
                    searchMembers(q);
                  }}
                  searching={memberSearching}
                  members={members}
                />
                <p className="mt-1.5 text-xs text-muted">
                  Đã chọn <span className="font-semibold text-chalk">{groupMembers.length}</span>
                  {typeof watchCapacity === 'number' && watchCapacity > 0
                    ? ` / ${watchCapacity}`
                    : ''}{' '}
                  chỗ · Để trống cũng được — hội viên có thể tự đăng ký qua app.
                </p>
              </>
            ) : (
              <>
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
                    Đã chọn:{' '}
                    <span className="font-semibold text-chalk">{selectedMember.fullName}</span> (
                    {selectedMember.code})
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
              </>
            )}
          </div>

          <Input
            label="Tiêu đề buổi tập *"
            placeholder="VD: PT - Tăng cơ toàn thân"
            error={errors.title?.message}
            {...register('title')}
          />

          <Input
            label={watchType === 'GROUP_CLASS' ? 'Sức chứa (ca)' : undefined}
            placeholder={watchType === 'GROUP_CLASS' ? 'VD: 15' : ''}
            type="number"
            min={1}
            max={50}
            disabled={watchType !== 'GROUP_CLASS'}
            error={watchType === 'GROUP_CLASS' ? errors.capacity?.message : undefined}
            {...register('capacity', { valueAsNumber: true })}
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
          {(roomsData || []).filter((r: any) => r.status === 'AVAILABLE').length === 0 && (
            <p className="text-[11px] font-medium text-amber-400">
              Hiện không có phòng SẴN SÀNG — cần mở phòng trước khi đặt lịch.
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

type PickedMember = { id: string; fullName: string; code: string };

function MemberCombobox({
  multiple = false,
  label = 'Hội viên',
  memberId,
  onSelect,
  selected,
  onToggle,
  query,
  setQuery,
  searching,
  members,
}: {
  /** true = chọn nhiều (ca nhóm) — render ô tìm + chips đã chọn */
  multiple?: boolean;
  label?: string;
  /** mode 1 người */
  memberId?: string;
  onSelect?: (id: string) => void;
  /** mode nhiều: danh sách đã chọn */
  selected?: PickedMember[];
  onToggle?: (m: PickedMember) => void;
  query: string;
  setQuery: (q: string) => void;
  searching: boolean;
  members: any[];
}) {
  const pickedIds = new Set((selected || []).map((m) => m.id));
  /** Dropdown chỉ mở khi đang thao tác ô tìm — không che các field bên dưới */
  const [openDropdown, setOpenDropdown] = useState(false);

  const inputProps = {
    onFocus: () => setOpenDropdown(true),
    onBlur: () => setOpenDropdown(false),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') setOpenDropdown(false);
    },
  };

  const dropdown = (
    <>
      {searching && <p className="mt-1 text-xs text-muted">Đang tìm...</p>}
      {/* Mở khi focus ô tìm (danh sách tải sẵn — không ép phải gõ).
          onMouseDown preventDefault trên item: bấm chọn không làm mất focus ô tìm */}
      {!searching && openDropdown && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-xl">
          {members.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted">
              {query ? 'Không tìm thấy hội viên' : 'Không có hội viên đang hoạt động'}
            </p>
          ) : (
            members.map((m) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (multiple) {
                    onToggle?.({ id: m.id, fullName: m.fullName, code: m.code });
                    setQuery('');
                  } else {
                    onSelect?.(m.id);
                    setQuery('');
                  }
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
                {multiple && pickedIds.has(m.id) ? (
                  <span className="shrink-0 rounded-full border border-neon/40 bg-neon/10 px-2 py-0.5 text-[10px] font-bold text-neon">
                    ĐÃ CHỌN
                  </span>
                ) : m.memberships?.some((ms: any) => ms.status === 'ACTIVE') ? (
                  <CheckCircle2 className="size-4 shrink-0 text-neon" />
                ) : (
                  <span className="shrink-0 text-[10px] font-bold text-amber-400">HẾT HẠN</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </>
  );

  // ---- Mode nhiều (ca nhóm): ô tìm + chips đã chọn, bấm lại để bỏ ----
  if (multiple) {
    return (
      <div>
        <label
          htmlFor="member-search-input"
          className="block text-sm font-semibold text-muted mb-1.5"
        >
          {label}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            id="member-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm và bấm để thêm hội viên vào lớp..."
            className="h-11 w-full rounded-sm border border-line bg-ink pl-9 pr-3.5 text-sm text-chalk placeholder:text-muted/70 focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
            {...inputProps}
          />
          {dropdown}
        </div>
        {(selected || []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selected!.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/5 py-1 pl-2.5 pr-1.5 text-xs text-chalk"
              >
                <UserPlus className="size-3.5 text-neon" />
                <span className="font-semibold">{m.fullName}</span>
                <span className="text-muted">({m.code})</span>
                <button
                  type="button"
                  onClick={() => onToggle?.(m)}
                  aria-label={`Bỏ ${m.fullName}`}
                  className="rounded-full p-0.5 text-muted transition-colors hover:bg-danger/15 hover:text-danger"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Mode 1 người (PT / tập tự do) ----
  return (
    <div>
      <label
        htmlFor="member-search-input"
        className="block text-sm font-semibold text-muted mb-1.5"
      >
        {label}
      </label>
      {memberId ? (
        <div className="flex items-center justify-between rounded-sm border border-neon/40 bg-neon/5 px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-sm text-chalk">
            <UserPlus className="size-4 text-neon" />
            Đã chọn hội viên
          </span>
          <button
            type="button"
            onClick={() => onSelect?.('')}
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
            className="h-11 w-full rounded-sm border border-line bg-ink pl-9 pr-3.5 text-sm text-chalk placeholder:text-muted/70 focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
            {...inputProps}
          />
          {dropdown}
        </div>
      )}
    </div>
  );
}
