'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { FaceScanner } from '@/components/ui/face-scanner';
import { faceApi } from '@/services/face.service';
import { formatDateTime } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, Info, ScanFace, ShieldCheck, Trash2 } from 'lucide-react';

const SAMPLE_TARGET = 5;

export default function FaceRegistrationPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: status, isLoading } = useQuery({
    queryKey: ['face-status'],
    queryFn: faceApi.getMyStatus,
    retry: 0,
  });

  const [phase, setPhase] = useState<'idle' | 'scanning'>('idle');
  const [consent, setConsent] = useState(false);
  const [samples, setSamples] = useState<number[][]>([]);
  const [scanKey, setScanKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const errMsg = (err: any, fallback: string) => err?.response?.data?.message || fallback;

  const enrollMutation = useMutation({
    mutationFn: (vecs: number[][]) => faceApi.enroll(vecs),
    onSuccess: () => {
      toast.success('ĐĂNG KÝ THÀNH CÔNG', 'Giờ bạn có thể check-in chỉ bằng khuôn mặt.');
      setPhase('idle');
      setConsent(false);
      setSamples([]);
      queryClient.invalidateQueries({ queryKey: ['face-status'] });
    },
    onError: (err: any) =>
      toast.error('Đăng ký thất bại', errMsg(err, 'Không lưu được dữ liệu lúc này.')),
  });

  const withdrawMutation = useMutation({
    mutationFn: faceApi.withdraw,
    onSuccess: (res) => {
      toast.success('ĐÃ XOÁ DỮ LIỆU', res.message || 'Dữ liệu khuôn mặt đã được xoá vĩnh viễn.');
      setConfirmDelete(false);
      setPhase('idle');
      setConsent(false);
      setSamples([]);
      queryClient.invalidateQueries({ queryKey: ['face-status'] });
    },
    onError: (err: any) => toast.error('Không xoá được', errMsg(err, 'Vui lòng thử lại sau.')),
  });

  const restartScan = () => {
    setSamples([]);
    setScanKey((k) => k + 1);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            Đăng ký khuôn mặt
          </h1>
          <p className="mt-1 text-sm text-muted">
            Check-in không cần thẻ, chỉ bằng khuôn mặt của bạn.
          </p>
        </div>
        <Link
          href="/member/checkin"
          className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-neon hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Check-in
        </Link>
      </div>

      {phase === 'scanning' ? (
        /* ------------------------------------------------ QUÉT + ĐĂNG KÝ */
        <Card className="mt-6 overflow-hidden border border-line">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <ScanFace className="size-5 text-neon" />
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-chalk">
                Quét {SAMPLE_TARGET} mẫu khuôn mặt
              </h2>
            </div>

            <FaceScanner
              key={scanKey}
              mode="enroll"
              target={SAMPLE_TARGET}
              onSamples={setSamples}
              onError={(msg) => toast.error('Không mở được camera', msg)}
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="primary"
                className="flex-1"
                size="lg"
                isLoading={enrollMutation.isPending}
                disabled={samples.length < SAMPLE_TARGET || enrollMutation.isPending}
                onClick={() => enrollMutation.mutate(samples)}
              >
                <ShieldCheck className="size-4 mr-1.5" />
                Đăng ký ({samples.length}/{SAMPLE_TARGET} mẫu)
              </Button>
              <Button variant="outline" size="lg" onClick={restartScan}>
                Chụp lại
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setPhase('idle');
                  setSamples([]);
                }}
              >
                Hủy
              </Button>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted">
              Mẹo: thay đổi góc mặt giữa các mẫu để nhận diện chính xác hơn.
            </p>
          </CardContent>
        </Card>
      ) : status?.enrolled ? (
        /* ------------------------------------------------ ĐÃ ĐĂNG KÝ */
        <Card className="mt-6 overflow-hidden border border-neon/40">
          <CardContent className="p-6 text-center sm:p-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-neon bg-neon/10">
              <CheckCircle2 className="size-8 text-neon" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold uppercase tracking-tight text-chalk">
              Đã đăng ký khuôn mặt
            </h2>
            <div className="mx-auto mt-4 max-w-sm space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-line bg-ink px-4 py-3 text-left">
                <span className="text-sm text-muted">Số mẫu đã lưu</span>
                <span className="font-mono text-sm font-bold text-neon">
                  {status.sampleCount} mẫu
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-line bg-ink px-4 py-3 text-left">
                <span className="text-sm text-muted">Đồng ý từ</span>
                <span className="font-mono text-xs text-chalk">
                  {status.consentAt ? formatDateTime(status.consentAt) : '--'}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">
              Chỉ lưu vector số — không lưu ảnh. Bạn có thể xoá bất cứ lúc nào.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/member/checkin">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  <ScanFace className="size-4 mr-1.5" /> Đi check-in
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => {
                  setConsent(false);
                  setSamples([]);
                  setPhase('scanning');
                  setScanKey((k) => k + 1);
                }}
              >
                Đăng ký lại
              </Button>
              <Button
                variant="danger"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4 mr-1.5" /> Xoá dữ liệu
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ------------------------------------------------ CÒN CHƯA ĐĂNG KÝ */
        <Card className="mt-6 overflow-hidden border border-line">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Info className="size-5 text-neon" />
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-chalk">
                Điều khoản dữ liệu sinh trắc học
              </h2>
            </div>

            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neon" />
                <span>
                  Hệ thống chỉ lưu <strong className="text-chalk">vector số</strong> (đặc trưng mã
                  hoá) — <strong className="text-chalk">không lưu ảnh hay video</strong> khuôn mặt
                  của bạn.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neon" />
                <span>Dữ liệu chỉ được dùng để đối sánh khi bạn tự check-in tại phòng tập.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neon" />
                <span>
                  Khuôn mặt là dữ liệu cá nhân nhạy cảm theo Nghị định 13/2023/NĐ-CP — được bảo vệ ở
                  mức cao nhất và không chia sẻ cho bên thứ ba.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neon" />
                <span>
                  Bạn có thể <strong className="text-chalk">rút lui bất cứ lúc nào</strong>: xoá
                  toàn bộ dữ liệu, không ảnh hưởng quyền lợi hội viên.
                </span>
              </li>
            </ul>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-ink p-4 transition-colors hover:border-neon/40">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-neon"
              />
              <span className="text-sm text-chalk">
                Tôi đồng ý cho GymShark xử lý dữ liệu sinh trắc học (khuôn mặt) của tôi để phục vụ
                check-in.
              </span>
            </label>

            <Button
              variant="primary"
              size="lg"
              className="mt-4 w-full"
              disabled={!consent}
              onClick={() => {
                setSamples([]);
                setScanKey((k) => k + 1);
                setPhase('scanning');
              }}
            >
              <ScanFace className="size-4 mr-1.5" /> Bắt đầu quét khuôn mặt
            </Button>
            {!consent && (
              <p className="mt-2 text-center text-[11px] text-muted">
                Bạn cần tick đồng ý trước khi bắt đầu.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Xác nhận xoá */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Xoá dữ liệu khuôn mặt?"
        description="Toàn bộ vector khuôn mặt của bạn sẽ bị xoá vĩnh viễn (không thể hoàn tác). Bạn cần đăng ký lại nếu muốn dùng check-in khuôn mặt."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Giữ lại
          </Button>
          <Button
            variant="danger"
            isLoading={withdrawMutation.isPending}
            onClick={() => withdrawMutation.mutate()}
          >
            <Trash2 className="size-4 mr-1.5" /> Xoá vĩnh viễn
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
