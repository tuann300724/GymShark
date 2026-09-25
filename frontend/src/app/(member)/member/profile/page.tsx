'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { memberApi } from '@/services/member.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  User,
  Mail,
  Phone,
  Cake,
  MapPin,
  HeartPulse,
  Pencil,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const profileSchema = z.object({
  fullName: z.string().min(3, 'Họ và tên tối thiểu 3 ký tự'),
  phone: z.string().regex(/^[0-9+\-\s]{9,15}$/, 'Số điện thoại không hợp lệ'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

const GENDER_LABEL: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };

export default function MemberProfilePage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const { data: me, isLoading } = useQuery({
    queryKey: ['member-me'],
    queryFn: memberApi.getMe,
    retry: 0,
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (me?.member) {
      profileForm.reset({
        fullName: me.member.fullName,
        phone: me.member.phone,
        gender: me.member.gender,
        dateOfBirth: me.member.dateOfBirth ? me.member.dateOfBirth.slice(0, 10) : '',
        address: me.member.address || '',
        emergencyContact: me.member.emergencyContact || '',
      });
    }
  }, [me, profileForm]);

  const pwForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (values: z.infer<typeof profileSchema>) => memberApi.updateMe(values),
    onSuccess: async () => {
      toast.success('Cập nhật hồ sơ thành công!');
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['member-me'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Cập nhật thất bại';
      toast.error('Không thể cập nhật hồ sơ', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const pwMutation = useMutation({
    mutationFn: (values: z.infer<typeof passwordSchema>) =>
      memberApi.changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
      setPwOpen(false);
      pwForm.reset();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại';
      toast.error('Đổi mật khẩu thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const member = me?.member;

  const infoRows = [
    { icon: User, label: 'Họ và tên', value: member?.fullName || me?.fullName },
    { icon: Mail, label: 'Email', value: me?.email },
    { icon: Phone, label: 'Số điện thoại', value: member?.phone || me?.phone },
    {
      icon: Cake,
      label: 'Ngày sinh',
      value: member?.dateOfBirth ? formatDate(member.dateOfBirth) : '--',
    },
    { icon: ShieldCheck, label: 'Giới tính', value: GENDER_LABEL[member?.gender || ''] || '--' },
    { icon: MapPin, label: 'Địa chỉ', value: member?.address || '--' },
    { icon: HeartPulse, label: 'Liên hệ khẩn cấp', value: member?.emergencyContact || '--' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Hồ sơ của tôi
        </h1>
        <p className="mt-1 text-sm text-muted">Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Profile summary card */}
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex size-24 shrink-0 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-3xl font-black text-neon">
                  {(me?.fullName || 'H').charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-chalk">{me?.fullName}</h2>
                  {member?.code && (
                    <p className="mt-0.5 text-sm font-semibold text-neon">
                      Mã hội viên: {member.code}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="info">{me?.isTrainer ? 'HUẤN LUYỆN VIÊN' : 'HỘI VIÊN'}</Badge>
                    {member?.status && (
                      <Badge variant={member.status === 'ACTIVE' ? 'success' : 'outline'}>
                        {member.status}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-3.5" />
                    Chỉnh sửa hồ sơ
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPwOpen(true)}>
                    <KeyRound className="size-3.5" />
                    Đổi mật khẩu
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin chi tiết</CardTitle>
              <CardDescription>Thông tin liên hệ và hồ sơ hội viên của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                {infoRows.map((row, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neon/25 bg-neon/10">
                      <row.icon className="size-4 text-neon" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        {row.label}
                      </p>
                      <p className="break-words text-sm font-semibold text-chalk">
                        {row.value || '--'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Chỉnh sửa hồ sơ">
        <form
          onSubmit={profileForm.handleSubmit((v) => updateMutation.mutate(v))}
          className="space-y-4"
        >
          <Input
            label="Họ và tên (*)"
            error={profileForm.formState.errors.fullName?.message}
            {...profileForm.register('fullName')}
          />
          <Input
            label="Số điện thoại (*)"
            error={profileForm.formState.errors.phone?.message}
            {...profileForm.register('phone')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Giới tính"
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
                { value: 'OTHER', label: 'Khác' },
              ]}
              error={profileForm.formState.errors.gender?.message}
              {...profileForm.register('gender')}
            />
            <Input
              label="Ngày sinh"
              type="date"
              error={profileForm.formState.errors.dateOfBirth?.message}
              {...profileForm.register('dateOfBirth')}
            />
          </div>
          <Input
            label="Địa chỉ"
            error={profileForm.formState.errors.address?.message}
            {...profileForm.register('address')}
          />
          <Input
            label="Người liên hệ khẩn cấp"
            placeholder="VD: Nguyễn Văn B - 0911222333"
            error={profileForm.formState.errors.emergencyContact?.message}
            {...profileForm.register('emergencyContact')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} title="Đổi mật khẩu">
        <form onSubmit={pwForm.handleSubmit((v) => pwMutation.mutate(v))} className="space-y-4">
          <Input
            label="Mật khẩu hiện tại (*)"
            type="password"
            error={pwForm.formState.errors.currentPassword?.message}
            {...pwForm.register('currentPassword')}
          />
          <Input
            label="Mật khẩu mới (*)"
            type="password"
            error={pwForm.formState.errors.newPassword?.message}
            {...pwForm.register('newPassword')}
          />
          <Input
            label="Xác nhận mật khẩu (*)"
            type="password"
            error={pwForm.formState.errors.confirmPassword?.message}
            {...pwForm.register('confirmPassword')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setPwOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" isLoading={pwMutation.isPending}>
              <KeyRound className="size-4" />
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
