'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '@/services/member.service';
import { trainerApi } from '@/services/trainer.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TRAINER_STATUS_META } from '@/lib/status';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  GraduationCap,
  Star,
  KeyRound,
  ShieldCheck,
  Wallet,
  Pencil,
} from 'lucide-react';

export default function TrainerProfilePage() {
  const toast = useToast();

  const {
    data: profile,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['trainer-my-profile'],
    queryFn: trainerApi.myProfile,
    retry: 0,
  });

  const { data: me } = useQuery({
    queryKey: ['trainer-me'],
    queryFn: memberApi.getMe,
    retry: 0,
  });

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePw = useMutation({
    mutationFn: () => memberApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Đã đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (e: any) => toast.error('Không thể đổi mật khẩu', e?.response?.data?.message),
  });

  const submitPassword = () => {
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    changePw.mutate();
  };

  // Hồ sơ công khai + phí kèm riêng do chính HLV chỉnh sửa
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    specialization: '',
    certification: '',
    experienceYears: '0',
    bio: '',
    avatarUrl: '',
    gender: 'MALE',
    dateOfBirth: '',
    hourlyRate: '',
  });

  const openEdit = () => {
    if (!profile) return;
    setForm({
      specialization: profile.specialization ?? '',
      certification: profile.certification ?? '',
      experienceYears: String(profile.experienceYears ?? 0),
      bio: profile.bio ?? '',
      avatarUrl: profile.user?.avatarUrl ?? '',
      gender: profile.gender ?? 'MALE',
      dateOfBirth: profile.dateOfBirth
        ? new Date(profile.dateOfBirth).toISOString().slice(0, 10)
        : '',
      hourlyRate: profile.hourlyRate != null ? String(Number(profile.hourlyRate)) : '',
    });
    setEditOpen(true);
  };

  const updateProfile = useMutation({
    mutationFn: () =>
      trainerApi.updateMyProfile({
        specialization: form.specialization.trim(),
        certification: form.certification.trim() || null,
        experienceYears: Number(form.experienceYears) || 0,
        bio: form.bio.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        gender: form.gender as 'MALE' | 'FEMALE' | 'OTHER',
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null,
        hourlyRate: form.hourlyRate.trim() ? Number(form.hourlyRate) : null,
      }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Đã cập nhật hồ sơ huấn luyện viên');
      setEditOpen(false);
      void refetch();
      void qc.invalidateQueries({ queryKey: ['public-trainer', profile?.id] });
      void qc.invalidateQueries({ queryKey: ['public-trainers'] });
    },
    onError: (e: any) =>
      toast.error('Không thể cập nhật hồ sơ', e?.response?.data?.message || e?.message),
  });

  const submitProfile = () => {
    if (form.specialization.trim().length < 2) {
      toast.error('Chuyên môn phải có ít nhất 2 ký tự');
      return;
    }
    const rate = form.hourlyRate.trim() ? Number(form.hourlyRate) : null;
    if (rate !== null && (!Number.isFinite(rate) || rate < 0)) {
      toast.error('Phí kèm riêng phải là số không âm');
      return;
    }
    updateProfile.mutate();
  };

  const statusMeta = profile
    ? TRAINER_STATUS_META[profile.status] || { label: profile.status, variant: 'outline' as const }
    : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Hồ sơ của tôi
        </h1>
        <p className="mt-1 text-sm text-muted">Thông tin cá nhân và bảo mật tài khoản.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !profile ? (
        <ErrorState
          title="Không tải được hồ sơ huấn luyện viên"
          description="Vui lòng thử lại hoặc liên hệ quản trị viên nếu lỗi tiếp diễn."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {/* Profile card */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {profile.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.user.avatarUrl}
                    alt=""
                    className="size-20 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="flex size-20 items-center justify-center rounded-2xl border border-neon/40 bg-neon/10 text-3xl font-bold uppercase text-neon">
                    {profile.user.fullName?.charAt(0)}
                  </span>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold uppercase tracking-tight text-chalk">
                      {profile.user.fullName}
                    </h2>
                    {statusMeta && <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-neon">{profile.specialization}</p>
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                  <Star className="size-4 text-amber-400" />
                  <span className="font-display text-xl font-bold text-amber-400">
                    {profile.rating}
                  </span>
                  <span className="text-xs text-muted">/ 5.0</span>
                </div>
                <Button variant="outline" size="sm" onClick={openEdit}>
                  <Pencil className="size-4" /> Chỉnh sửa hồ sơ
                </Button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoTile
                  icon={Mail}
                  label="Email"
                  value={profile.user.email || '--'}
                  valueClass="text-neon"
                />
                <InfoTile icon={Phone} label="Số điện thoại" value={profile.user.phone || '--'} />
                <InfoTile
                  icon={User}
                  label="Giới tính"
                  value={
                    profile.gender === 'MALE'
                      ? 'Nam'
                      : profile.gender === 'FEMALE'
                        ? 'Nữ'
                        : profile.gender === 'OTHER'
                          ? 'Khác'
                          : '--'
                  }
                />
                <InfoTile
                  icon={GraduationCap}
                  label="Kinh nghiệm"
                  value={`${profile.experienceYears} năm`}
                />
                <InfoTile icon={Award} label="Chứng chỉ" value={profile.certification || '--'} />
                <InfoTile
                  icon={Briefcase}
                  label="Ngày sinh"
                  value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '--'}
                />
              </div>

              {profile.bio && (
                <div className="mt-5 rounded-xl border border-line bg-ink/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Giới thiệu
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{profile.bio}</p>
                </div>
              )}

              {profile.hourlyRate && (
                <div className="mt-4 rounded-xl border border-neon/30 bg-neon/5 p-3 text-center sm:text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Phí kèm riêng
                  </p>
                  <p className="mt-0.5 font-display text-lg font-bold text-neon">
                    {formatCurrency(profile.hourlyRate)}{' '}
                    <span className="font-sans text-xs font-medium">/ buổi</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change password */}
          <Card>
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-chalk">
                <KeyRound className="size-5 text-neon" /> Đổi mật khẩu
              </h3>
              <p className="mt-1 text-xs text-muted">
                Mật khẩu tài khoản đăng nhập <span className="text-chalk">{me?.email}</span>.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input
                  label="Mật khẩu hiện tại"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Input
                  label="Mật khẩu mới"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <Input
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  isLoading={changePw.isPending}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                  onClick={submitPassword}
                >
                  <ShieldCheck className="size-4" /> Đổi mật khẩu
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Chỉnh sửa hồ sơ huấn luyện viên"
        description="Thông tin này hiển thị công khai trên trang giới thiệu HLV. Phí kèm riêng được tính theo buổi và thanh toán trực tiếp với bạn qua tin nhắn."
      >
        <div className="space-y-4">
          <Input
            label="Chuyên môn chính"
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            placeholder="Ví dụ: Giảm mỡ & tăng cơ"
            maxLength={400}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Số năm kinh nghiệm"
              type="number"
              min={0}
              max={60}
              value={form.experienceYears}
              onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
            />
            <Select
              label="Giới tính"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
                { value: 'OTHER', label: 'Khác' },
              ]}
            />
          </div>
          <Input
            label="Ngày sinh"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
          />
          <Input
            label="Chứng chỉ"
            value={form.certification}
            onChange={(e) => setForm({ ...form, certification: e.target.value })}
            placeholder="Ví dụ: ACE-CPT, NASM..."
            maxLength={400}
          />
          <Input
            label="Ảnh đại diện (URL)"
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            placeholder="https://..."
            maxLength={400}
          />
          <Textarea
            label="Giới thiệu bản thân"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Chia sẻ về phương pháp huấn luyện của bạn..."
            maxLength={2000}
            rows={4}
          />
          <div className="rounded-xl border border-neon/30 bg-neon/5 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Wallet className="size-4 text-neon" /> Phí kèm riêng (VNĐ / buổi)
            </p>
            <Input
              className="mt-2"
              type="number"
              min={0}
              max={1000000000}
              value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
              placeholder="Ví dụ: 350000"
            />
            <p className="mt-2 text-xs text-muted">
              Hội viên xem giá này trên hồ sơ công khai và nhắn tin trực tiếp để đặt lịch. Để trống
              nếu bạn muốn liên hệ thỏa thuận riêng.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Huỷ
            </Button>
            <Button variant="primary" isLoading={updateProfile.isPending} onClick={submitProfile}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-ink/60 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-neon" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className={`truncate text-sm font-medium text-chalk ${valueClass || ''}`}>{value}</p>
      </div>
    </div>
  );
}
