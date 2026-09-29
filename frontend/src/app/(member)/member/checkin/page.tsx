'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkinApi } from '@/services/checkin.service';
import { memberApi } from '@/services/member.service';
import { faceApi } from '@/services/face.service';
import apiClient from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { FaceScanner } from '@/components/ui/face-scanner';
import { useToast } from '@/components/ui/toast';
import { formatTime } from '@/lib/utils';
import { BRANCH_STATUS_META } from '@/lib/status';
import {
  LogIn,
  LogOut,
  Clock,
  Timer,
  CheckCircle2,
  Activity,
  MapPin,
  ScanFace,
} from 'lucide-react';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function MemberCheckInPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  const { data: me } = useQuery({
    queryKey: ['member-me'],
    queryFn: memberApi.getMe,
    retry: 0,
  });

  const {
    data: current,
    isLoading: currentLoading,
    refetch: refetchCurrent,
  } = useQuery({
    queryKey: ['checkin-current'],
    queryFn: checkinApi.getMyCurrent,
    retry: 0,
    refetchInterval: 30000,
  });

  // Danh sách chi nhánh ACTIVE để member chọn khi check-in
  const { data: branches } = useQuery({
    queryKey: ['public-branches'],
    queryFn: async () => (await apiClient.get('/public/branches')).data,
    retry: 0,
  });
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // ------------------ Check-in bằng khuôn mặt ------------------
  const [checkinTab, setCheckinTab] = useState<'manual' | 'face'>('manual');
  // Tăng số để remount FaceScanner (quét lại sau lỗi đối sánh)
  const [scanKey, setScanKey] = useState(0);

  const { data: faceStatus, isLoading: faceLoading } = useQuery({
    queryKey: ['face-status'],
    queryFn: faceApi.getMyStatus,
    retry: 0,
  });

  // Timer đếm thời gian tập (chỉ chạy khi đang check-in)
  useEffect(() => {
    if (!current?.checkedIn) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [current?.checkedIn]);

  const checkedIn = current?.checkedIn ?? false;
  const elapsedMs = useMemo(() => {
    if (!checkedIn || !current?.checkInAt) return 0;
    return now - new Date(current.checkInAt).getTime();
  }, [checkedIn, current?.checkInAt, now]);

  const checkInMutation = useMutation({
    mutationFn: () => checkinApi.checkIn('MANUAL', selectedBranchId || undefined),
    onSuccess: (res) => {
      const name = res.data.member?.fullName || me?.fullName || '';
      toast.success(
        'CHECK-IN THÀNH CÔNG',
        `${name ? `Xin chào ${name}. ` : ''}Chúc bạn có buổi tập hiệu quả!`,
      );
      setSelectedBranchId('');
      setNow(Date.now());
      queryClient.invalidateQueries({ queryKey: ['checkin-current'] });
      queryClient.invalidateQueries({ queryKey: ['member-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      refetchCurrent();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể check-in lúc này.';
      toast.error('Check-in thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkinApi.checkOut(),
    onSuccess: (res) => {
      toast.success(
        'CHECK-OUT THÀNH CÔNG',
        res.data.durationMinutes
          ? `Bạn đã tập ${Math.round(res.data.durationMinutes / 60)}h${res.data.durationMinutes % 60}m. Hẹn gặp lại!`
          : 'Hẹn gặp lại bạn lần sau!',
      );
      queryClient.invalidateQueries({ queryKey: ['checkin-current'] });
      queryClient.invalidateQueries({ queryKey: ['member-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      refetchCurrent();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể check-out lúc này.';
      toast.error('Check-out thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const faceCheckInMutation = useMutation({
    mutationFn: (embedding: number[]) =>
      checkinApi.faceCheckIn(embedding, selectedBranchId || undefined),
    onSuccess: (res) => {
      const name = res.data.member?.fullName || me?.fullName || '';
      toast.success(
        'CHECK-IN BẰNG KHUÔN MẶT THÀNH CÔNG',
        `${name ? `Xin chào ${name}. ` : ''}Chúc bạn có buổi tập hiệu quả!`,
      );
      setSelectedBranchId('');
      setNow(Date.now());
      queryClient.invalidateQueries({ queryKey: ['checkin-current'] });
      queryClient.invalidateQueries({ queryKey: ['member-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      refetchCurrent();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể check-in lúc này.';
      toast.error('Check-in thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
      // Quét lại từ đầu sau khi đối sánh thất bại
      setScanKey((k) => k + 1);
    },
  });

  const busy =
    checkInMutation.isPending || checkOutMutation.isPending || faceCheckInMutation.isPending;

  if (currentLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Check-in / Check-out
        </h1>
        <p className="mt-1 text-sm text-muted">Chấm công ra vào phòng tập của bạn hôm nay.</p>
      </div>

      <Card
        className={`mt-6 overflow-hidden border-2 transition-colors duration-500 ${
          checkedIn ? 'border-neon/60' : 'border-line'
        }`}
      >
        <CardContent className="p-6 sm:p-10">
          {!checkedIn ? (
            /* ------------------------------------------------ CHƯA CHECK-IN */
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex size-20 items-center justify-center rounded-full border border-line bg-surface">
                <Activity className="size-9 text-muted" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                Bạn chưa check-in
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted">
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
                {' • '}
                Hãy chấm công để bắt đầu buổi tập!
              </p>

              {branches && branches.length > 0 && (
                <div className="mt-5 w-full max-w-sm">
                  <Select
                    label="Chọn chi nhánh check-in"
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    options={[
                      { value: '', label: '-- Chọn chi nhánh --' },
                      ...branches
                        .filter((b: any) => b.status === 'ACTIVE')
                        .map((b: any) => ({ value: b.id, label: `${b.name} (${b.code})` })),
                    ]}
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    Chi nhánh bạn chọn phải được phép theo thẻ hội viên.
                  </p>
                </div>
              )}

              {/* Chọn hình thức: thủ công hoặc quét khuôn mặt */}
              <div className="mt-5 w-full max-w-sm">
                <Tabs
                  fill
                  value={checkinTab}
                  onChange={(v) => setCheckinTab(v as 'manual' | 'face')}
                  tabs={[
                    { value: 'manual', label: 'Thủ công' },
                    { value: 'face', label: 'Khuôn mặt' },
                  ]}
                />
              </div>

              {checkinTab === 'manual' ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    className="mt-8 h-16 w-full max-w-xs gap-3 rounded-xl text-lg font-bold uppercase tracking-widest"
                    isLoading={checkInMutation.isPending}
                    disabled={busy}
                    onClick={() => checkInMutation.mutate()}
                  >
                    <LogIn className="size-6" />
                    Check-in
                  </Button>
                  <p className="mt-3 text-xs text-muted">
                    Lấy 1 lượt mỗi lần vào phòng. Chuyển sang tab{' '}
                    <strong className="text-chalk">Khuôn mặt</strong> để check-in không cần chạm gì.
                  </p>
                </>
              ) : (
                <div className="mt-5 w-full max-w-sm">
                  {faceLoading ? (
                    <Skeleton className="h-72 w-full rounded-xl" />
                  ) : !faceStatus?.enrolled ? (
                    /* Chưa đăng ký khuôn mặt → CTA */
                    <div className="rounded-xl border border-line bg-ink p-5 text-center">
                      <ScanFace className="mx-auto size-8 text-muted" />
                      <p className="mt-3 text-sm text-muted">
                        Bạn chưa đăng ký khuôn mặt. Đăng ký một lần để check-in bằng khuôn mặt ở
                        những lần sau.
                      </p>
                      <Link href="/member/face-registration">
                        <Button variant="primary" className="mt-4 w-full">
                          Đăng ký khuôn mặt
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    /* Đã đăng ký → quét 1:1 và check-in */
                    <>
                      <FaceScanner
                        key={scanKey}
                        mode="verify"
                        onCapture={(embedding) => faceCheckInMutation.mutate(embedding)}
                        onError={(msg) => toast.error('Không mở được camera', msg)}
                      />
                      <p className="mt-3 text-center text-[11px] text-muted">
                        Hệ thống tự đối sánh với mẫu đã đăng ký — chỉ gửi vector, không lưu ảnh.
                      </p>
                      <p className="mt-1 text-center text-[11px] text-muted">
                        <Link
                          href="/member/face-registration"
                          className="text-neon hover:underline"
                        >
                          Quản lý đăng ký khuôn mặt
                        </Link>
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ------------------------------------------------ ĐANG CHECK-IN */
            <div className="flex flex-col items-center py-4 text-center">
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-neon/10 animate-pulse" />
                <div className="relative flex size-20 items-center justify-center rounded-full border-2 border-neon bg-neon/10">
                  <CheckCircle2 className="size-9 text-neon" />
                </div>
              </div>

              <h2 className="mt-6 font-display text-2xl font-bold uppercase tracking-tight text-neon">
                Đang tập
              </h2>
              <Badge variant="success" className="mt-2">
                TRONG PHÒNG GYM
              </Badge>

              <div className="mt-6 flex w-full max-w-sm flex-col gap-2.5 text-left">
                <div className="flex items-center justify-between rounded-xl border border-line bg-ink px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <Clock className="size-4 text-neon" /> Giờ vào
                  </span>
                  <span className="font-mono text-sm font-semibold text-chalk">
                    {formatTime(current?.checkInAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-line bg-ink px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <Timer className="size-4 text-neon" /> Thời gian đã tập
                  </span>
                  <span className="font-mono text-lg font-bold tabular-nums text-neon">
                    {formatElapsed(elapsedMs)}
                  </span>
                </div>
                {current?.branch && (
                  <div className="flex items-center justify-between rounded-xl border border-line bg-ink px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-muted">
                      <MapPin className="size-4 text-neon" /> Chi nhánh
                    </span>
                    <span className="text-sm font-semibold text-chalk">{current.branch.name}</span>
                  </div>
                )}
              </div>

              <Button
                variant="secondary"
                size="lg"
                className="mt-8 h-16 w-full max-w-xs gap-3 rounded-xl text-lg font-bold uppercase tracking-widest"
                isLoading={checkOutMutation.isPending}
                disabled={busy}
                onClick={() => checkOutMutation.mutate()}
              >
                <LogOut className="size-6" />
                Check-out
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
