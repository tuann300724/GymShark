'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { trainerApi } from '@/services/trainer.service';
import { KeyRound } from 'lucide-react';
import type { TrainerDetail } from '@/services/types';

const trainerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên quá ngắn'),
  email: z.string().email('Email không hợp lệ'),
  phone: z
    .string()
    .regex(/^[0-9+\-\s]{9,15}$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  specialization: z.string().min(2, 'Chuyên môn quá ngắn'),
  certification: z.string().optional().or(z.literal('')),
  experienceYears: z.coerce.number().min(0).max(60).optional(),
  bio: z.string().max(2000).optional().or(z.literal('')),
  hourlyRate: z.coerce.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).optional(),
});

type TrainerFormValues = z.infer<typeof trainerSchema>;

interface TrainerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** Đang sửa HLV (undefined = tạo mới) */
  editing?: TrainerDetail | null;
}

export function TrainerFormDialog({ open, onClose, onSaved, editing }: TrainerFormDialogProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const isEdit = !!editing;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerSchema),
    defaultValues: { gender: 'MALE', status: 'ACTIVE', experienceYears: 1 },
  });

  useEffect(() => {
    if (!open) return;
    setTempPassword(null);
    if (editing) {
      reset({
        fullName: editing.user.fullName,
        email: editing.user.email || '',
        phone: editing.user.phone || '',
        gender: editing.gender || 'MALE',
        dateOfBirth: editing.dateOfBirth ? editing.dateOfBirth.slice(0, 10) : '',
        specialization: editing.specialization,
        certification: editing.certification || '',
        experienceYears: editing.experienceYears,
        bio: editing.bio || '',
        hourlyRate: editing.hourlyRate ? Number(editing.hourlyRate) : undefined,
        status: editing.status as any,
      });
    } else {
      reset({
        fullName: '',
        email: '',
        phone: '',
        gender: 'MALE',
        dateOfBirth: '',
        specialization: '',
        certification: '',
        experienceYears: 1,
        bio: '',
        hourlyRate: undefined,
        status: 'ACTIVE',
      });
    }
  }, [open, editing, reset]);

  const mutation = useMutation({
    mutationFn: (values: TrainerFormValues) => {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth || undefined,
        specialization: values.specialization,
        certification: values.certification || undefined,
        experienceYears: values.experienceYears,
        bio: values.bio || undefined,
        hourlyRate: values.hourlyRate,
        status: values.status,
      };
      return editing ? trainerApi.update(editing.id, payload) : trainerApi.create(payload);
    },
    onSuccess: (data) => {
      toast.success(isEdit ? 'Đã cập nhật huấn luyện viên' : 'Tạo huấn luyện viên thành công');
      if (!isEdit && data?.tempPassword) {
        setTempPassword(data.tempPassword);
      } else {
        queryClient.invalidateQueries({ queryKey: ['trainers'] });
        queryClient.invalidateQueries({ queryKey: ['trainer-detail'] });
        onSaved?.();
        onClose();
      }
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      toast.error('Không thể lưu HLV', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const onSubmit = (values: TrainerFormValues) => mutation.mutate(values);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa huấn luyện viên' : 'Thêm huấn luyện viên mới'}
      description={
        isEdit
          ? `Đang sửa: ${editing?.user.fullName}`
          : 'Hệ thống tự tạo tài khoản đăng nhập (vai trò TRAINER) cho HLV mới.'
      }
      className="max-w-2xl"
    >
      {tempPassword ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-neon/40 bg-neon/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-neon">
              <KeyRound className="size-4" /> Tài khoản đã được tạo!
            </p>
            <p className="mt-2 text-sm text-chalk">
              Email:{' '}
              <span className="font-mono font-semibold">{mutation.data?.trainer?.user?.email}</span>
            </p>
            <p className="mt-1 text-sm text-chalk">
              Mật khẩu tạm thời:{' '}
              <span className="rounded bg-ink px-2 py-1 font-mono font-bold text-neon">
                {tempPassword}
              </span>
            </p>
            <p className="mt-2 text-xs text-muted">
              Hãy chuyển mật khẩu này cho HLV — chỉ hiển thị duy nhất một lần tại đây.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setTempPassword(null);
                queryClient.invalidateQueries({ queryKey: ['trainers'] });
                onSaved?.();
                onClose();
              }}
            >
              Hoàn tất
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Họ và tên *"
              placeholder="HLV Nguyễn Văn A"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="Email đăng nhập *"
              type="email"
              placeholder="trainer@gym.com"
              disabled={isEdit}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Số điện thoại"
              placeholder="0912345678"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Select
              label="Giới tính"
              error={errors.gender?.message}
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
                { value: 'OTHER', label: 'Khác' },
              ]}
              {...register('gender')}
            />
            <Input
              label="Ngày sinh"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
            />
            <Input
              label="Số năm kinh nghiệm"
              type="number"
              min={0}
              max={60}
              placeholder="5"
              error={errors.experienceYears?.message}
              {...register('experienceYears')}
            />
            <Input
              label="Chuyên môn chính *"
              placeholder="Tăng cơ giảm mỡ, Thể hình"
              error={errors.specialization?.message}
              {...register('specialization')}
            />
            <Input
              label="Chứng chỉ"
              placeholder="ISSA Certified PT"
              error={errors.certification?.message}
              {...register('certification')}
            />
            <Input
              label="Phí kèm riêng (VND/buổi)"
              type="number"
              min={0}
              placeholder="350000"
              error={errors.hourlyRate?.message}
              {...register('hourlyRate')}
            />
            <Select
              label="Trạng thái"
              error={errors.status?.message}
              options={[
                { value: 'ACTIVE', label: 'Đang hoạt động' },
                { value: 'ON_LEAVE', label: 'Tạm nghỉ' },
                { value: 'INACTIVE', label: 'Ngừng hoạt động' },
              ]}
              {...register('status')}
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Giới thiệu (bio)"
                rows={3}
                placeholder="Kinh nghiệm, thành tích, phong cách huấn luyện..."
                {...register('bio')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              {isEdit ? 'Lưu thay đổi' : 'Tạo huấn luyện viên'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
