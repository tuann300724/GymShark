'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { memberApi } from '@/services/member.service';
import { trainerApi } from '@/services/trainer.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
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
} from 'lucide-react';

export default function TrainerProfilePage() {
  const toast = useToast();

  const { data: profile, isLoading } = useQuery({
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
        <Card>
          <CardContent className="py-14 text-center text-xs text-danger">
            Không tải được hồ sơ huấn luyện viên. Vui lòng liên hệ quản trị viên.
          </CardContent>
        </Card>
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
                    {Number(profile.hourlyRate).toLocaleString('vi-VN')} ₫{' '}
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
