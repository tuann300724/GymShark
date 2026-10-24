'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, CreditCard, Landmark, RefreshCw, ScanFace, Wallet } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaceScanner } from '@/components/ui/face-scanner';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import apiClient from '@/lib/axios';
import { formatCurrency, cn } from '@/lib/utils';
import { faceApi } from '@/services/face.service';
import { paymentApi } from '@/services/payment.service';
import {
  adminMemberApi,
  type RegisterCardPayload,
  type RegisterCardResult,
} from '@/services/admin-member.service';
import type { MembershipPackage } from '@/services/types';

/**
 * MemberPackageDialog — đăng ký gói tập cho hội viên đã có sẵn tại quầy.
 */

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
  { value: 'MOMO', label: 'MoMo' },
];

type Step = 1 | 2 | 3 | 4;

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: 'Gói tập' },
  { step: 2, label: 'Thanh toán' },
  { step: 3, label: 'Khuôn mặt' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  member: { id: string; code: string; fullName: string } | null;
  onSuccess?: (result: RegisterCardResult) => void;
}

export function MemberPackageDialog({ open, onClose, member, onSuccess }: Props) {
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [packageId, setPackageId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [promotionCode, setPromotionCode] = useState('');
  const [payNow, setPayNow] = useState(true);
  const [notes, setNotes] = useState('');
  const [registration, setRegistration] = useState<RegisterCardResult | null>(null);
  const [faceSamples, setFaceSamples] = useState<number[][]>([]);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [faceDone, setFaceDone] = useState(false);

  const { data: packages = [], isLoading: pkgLoading } = useQuery({
    queryKey: ['membership-packages'],
    queryFn: async () => {
      const res = await apiClient.get<MembershipPackage[]>('/membership-packages');
      return res.data;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: bankInfo,
    isLoading: bankInfoLoading,
    isError: bankInfoError,
  } = useQuery({
    queryKey: ['bank-info'],
    queryFn: paymentApi.getBankInfo,
    enabled: open && paymentMethod === 'BANK_TRANSFER',
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: checkedPayment,
    isError: paymentCheckError,
    isFetching: paymentChecking,
    refetch: checkPayment,
  } = useQuery({
    queryKey: ['admin-payment-detail', registration?.payment.id],
    queryFn: async () => {
      await paymentApi.checkCasso(registration!.payment.id);
      return paymentApi.getPayment(registration!.payment.id);
    },
    enabled:
      open &&
      step === 2 &&
      ['BANK_TRANSFER', 'MOMO'].includes(paymentMethod) &&
      !!registration?.payment.id,
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 2000 : false),
    refetchIntervalInBackground: true,
    retry: 1,
  });

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setPackageId('');
    setPaymentMethod('CASH');
    setPromotionCode('');
    setPayNow(true);
    setNotes('');
    setRegistration(null);
    setFaceSamples([]);
    setFaceImage(null);
    setConsent(false);
    setFaceError('');
    setFaceDone(false);
  }, [open, member?.id]);

  useEffect(() => {
    if (!packageId && packages.length > 0) {
      const firstActive = packages.find((p) => p.status === 'ACTIVE') ?? packages[0];
      setPackageId(firstActive.id);
    }
  }, [packages, packageId]);

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageId) ?? null,
    [packages, packageId],
  );
  const transferContent =
    member && registration ? `GYM ${member.code} ${registration.payment.code}` : '';
  const qrUrl =
    bankInfo && registration
      ? `https://img.vietqr.io/image/${encodeURIComponent(bankInfo.shortName)}-${encodeURIComponent(bankInfo.accountNumber)}-qr_only.svg?amount=${Math.round(Number(registration.payment.amount ?? 0))}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankInfo.accountName)}`
      : null;

  useEffect(() => {
    if (checkedPayment?.status !== 'PAID' || !registration || registration.activated) return;
    const updated: RegisterCardResult = {
      ...registration,
      activated: true,
      membership: { ...registration.membership, status: 'ACTIVE' },
      payment: { ...registration.payment, status: 'PAID' },
    };
    setRegistration(updated);
    setStep(3);
    onSuccess?.(updated);
    toast.success('Đã nhận thanh toán', 'Gói tập của hội viên đã được kích hoạt.');
  }, [checkedPayment?.status, onSuccess, registration, toast]);

  const isManualMethod = paymentMethod === 'CASH' || paymentMethod === 'BANK_TRANSFER';
  const payNowBlocked = payNow && !isManualMethod;

  useEffect(() => {
    if (payNowBlocked) setPayNow(false);
  }, [payNowBlocked]);

  const mutation = useMutation({
    mutationFn: async (payload: RegisterCardPayload) =>
      adminMemberApi.registerCard(member!.id, payload),
    onSuccess: (res, payload) => {
      setRegistration(res);
      onSuccess?.(res);
      if (res.activated) {
        setStep(3);
        toast.success(
          'Đã kích hoạt gói tập',
          `Hoá đơn ${res.payment.code} · ${formatCurrency(String(res.payment.amount ?? 0))}`,
        );
      } else {
        setStep(2);
        toast.success(
          payload.paymentMethod === 'BANK_TRANSFER'
            ? 'Đã tạo hóa đơn chờ thanh toán'
            : 'Đã tạo gói — chờ thanh toán',
          payload.paymentMethod === 'BANK_TRANSFER'
            ? `Quét mã QR để thanh toán ${formatCurrency(String(res.payment.amount ?? 0))}.`
            : `Hoá đơn ${res.payment.code} đang chờ xác nhận.`,
        );
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      toast.error(
        'Không đăng ký được gói',
        Array.isArray(msg) ? msg.join(' · ') : msg || 'Vui lòng thử lại.',
      );
    },
  });

  const submit = (
    method: RegisterCardPayload['paymentMethod'] = paymentMethod as RegisterCardPayload['paymentMethod'],
    shouldPayNow = payNow,
  ) => {
    if (!member) return;
    if (!packageId) {
      toast.error('Chưa chọn gói tập', 'Vui lòng chọn gói tập cho hội viên.');
      return;
    }
    const payload: RegisterCardPayload = {
      packageId,
      paymentMethod: method,
      payNow: shouldPayNow,
    };
    if (promotionCode.trim()) payload.promotionCode = promotionCode.trim().toUpperCase();
    if (notes.trim()) payload.notes = notes.trim();
    mutation.mutate(payload);
  };

  const faceMutation = useMutation({
    mutationFn: async () => {
      if (!member) throw new Error('Không tìm thấy hội viên.');
      return faceApi.adminEnroll(member.id, faceSamples, faceImage);
    },
    onSuccess: () => {
      setFaceDone(true);
      setStep(4);
      toast.success('Đã đăng ký khuôn mặt', 'Hội viên có thể check-in nhận diện nhanh tại quầy.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setFaceError(Array.isArray(msg) ? msg.join(' · ') : msg || 'Không đăng ký được khuôn mặt.');
    },
  });

  const skipFace = () => {
    setFaceDone(false);
    setStep(4);
  };

  const stepIndicator = (
    <div className="flex items-center gap-1.5">
      {STEPS.map((item) => {
        const active = step === item.step;
        const done = step > item.step;
        return (
          <div
            key={item.step}
            className={cn(
              'flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors',
              active ? 'border-neon/70 bg-neon/10' : 'border-line',
            )}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                done || active ? 'bg-neon text-ink' : 'bg-ink text-muted',
              )}
            >
              {done ? <CheckCircle2 className="size-3.5" /> : item.step}
            </span>
            <span
              className={cn(
                'truncate text-[11px] font-semibold',
                active ? 'text-neon' : done ? 'text-chalk' : 'text-muted',
              )}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Đăng ký gói tập tại quầy"
      description={member ? `${member.fullName} (${member.code}) · Hồ sơ hội viên đã hoàn tất` : ''}
      className="max-w-xl"
    >
      <div className="space-y-4">
        {step < 4 && stepIndicator}
        {step === 2 && registration ? (
          <div className="space-y-4">
            {checkedPayment?.status === 'PAID' ? (
              <div className="flex items-center gap-2 rounded-lg border border-neon/40 bg-neon/5 p-3 text-sm text-chalk">
                <CheckCircle2 className="size-5 text-neon" />
                Thanh toán thành công. Gói tập đã được kích hoạt.
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-line bg-ink p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-chalk">
                  {paymentMethod === 'BANK_TRANSFER' ? (
                    <>
                      <Landmark className="size-4 text-neon" />
                      Quét QR chuyển khoản
                      {bankInfo && (
                        <span className="ml-auto text-xs font-normal text-muted">
                          {bankInfo.bankName}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4 text-neon" />
                      Chờ xác nhận thanh toán
                    </>
                  )}
                </div>
                {paymentMethod !== 'BANK_TRANSFER' && paymentMethod !== 'MOMO' ? (
                  <p className="text-xs text-muted">
                    Hóa đơn đang chờ xác nhận trong mục thanh toán.
                  </p>
                ) : paymentMethod === 'MOMO' ? (
                  <p className="text-xs text-muted">
                    Hóa đơn MoMo đang chờ xác nhận. Trạng thái sẽ được kiểm tra tự động.
                  </p>
                ) : bankInfoLoading ? (
                  <p className="text-xs text-muted">Đang tải thông tin tài khoản ngân hàng...</p>
                ) : bankInfoError ? (
                  <p className="text-xs text-danger">
                    Không tải được thông tin ngân hàng. Hóa đơn đã được tạo; vui lòng thử lại hoặc
                    xác nhận thủ công trong mục thanh toán.
                  </p>
                ) : qrUrl && bankInfo ? (
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                    <div className="relative shrink-0">
                      {/* VietQR là ảnh được tạo từ dịch vụ ngoài. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrUrl}
                        alt={`Mã VietQR chuyển khoản ${bankInfo.bankName}`}
                        className={cn(
                          'size-56 rounded-xl border border-line bg-surface object-contain p-2',
                          checkedPayment?.status === 'PAID' && 'opacity-40',
                        )}
                      />
                      {checkedPayment?.status === 'PAID' && (
                        <div className="absolute inset-0 flex items-center justify-center text-neon">
                          <CheckCircle2 className="size-12" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2 text-xs text-muted">
                      <p>
                        <b className="text-chalk">Số tài khoản:</b>{' '}
                        <span className="font-mono text-neon">{bankInfo.accountNumber}</span>
                      </p>
                      <p>
                        <b className="text-chalk">Chủ tài khoản:</b> {bankInfo.accountName}
                      </p>
                      <p>
                        <b className="text-chalk">Số tiền:</b>{' '}
                        <span className="font-mono text-chalk">
                          {formatCurrency(String(registration.payment.amount ?? 0))}
                        </span>
                      </p>
                      <p>
                        <b className="text-chalk">Nội dung chuyển khoản:</b>
                      </p>
                      <p className="break-all rounded-lg border border-line bg-surface px-2.5 py-2 font-mono font-bold text-neon">
                        {transferContent}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted">Đang chuẩn bị mã QR thanh toán...</p>
                )}
                {paymentCheckError && (
                  <p className="text-xs text-danger">
                    Chưa kiểm tra được trạng thái thanh toán tự động. Thử kiểm tra lại hoặc xác nhận
                    thủ công trong mục thanh toán.
                  </p>
                )}
                {checkedPayment?.status === 'PAID' ? (
                  <p className="flex items-center gap-2 text-xs font-semibold text-neon">
                    <CheckCircle2 className="size-4" /> Đã nhận thanh toán và kích hoạt gói.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-[11px] text-muted">
                      <RefreshCw className="size-3 animate-spin text-neon" />
                      Đang chờ ngân hàng xác nhận...
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkPayment()}
                      disabled={paymentChecking}
                    >
                      <RefreshCw className={cn('mr-1 size-3', paymentChecking && 'animate-spin')} />
                      Kiểm tra thanh toán
                    </Button>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end border-t border-line pt-4">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        ) : step === 3 && registration ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
              <ScanFace className="size-4 shrink-0 text-neon" />
              <p className="text-[11px] leading-relaxed text-muted">
                Thanh toán đã hoàn tất. Có thể đăng ký khuôn mặt cho hội viên ngay tại quầy hoặc bỏ
                qua để thực hiện sau trong hồ sơ hội viên.
              </p>
            </div>

            <FaceScanner
              key={`face-${member?.id ?? 'member'}`}
              mode="enroll"
              target={5}
              withImage
              onSamples={(samples, image) => {
                setFaceSamples(samples);
                setFaceImage(image);
              }}
              onError={(msg) => setFaceError(msg)}
            />

            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-neon"
              />
              <span className="text-[11px] leading-relaxed text-muted">
                Hội viên đã được thông báo và <span className="text-chalk">đồng ý</span> cho hệ
                thống lưu dữ liệu sinh trắc học khuôn mặt phục vụ nhận diện tại quầy (Nghị định
                13/2023). Hệ thống lưu vector đặc trưng và 1 ảnh tham chiếu, không lưu video.{' '}
                <span className="text-amber-400">
                  Một ảnh chụp sẽ được gửi tới Microsoft Azure để kiểm tra hội viên có đeo kính
                  không; ảnh này chỉ dùng để trả kết quả, không lưu tại dịch vụ.
                </span>
              </span>
            </label>

            {faceError && (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-[11px] text-danger">
                {faceError}
              </p>
            )}

            <div className="flex justify-between gap-2 border-t border-line pt-4">
              <Button variant="ghost" onClick={onClose} disabled={faceMutation.isPending}>
                Đóng
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={skipFace} disabled={faceMutation.isPending}>
                  Bỏ qua
                </Button>
                <Button
                  isLoading={faceMutation.isPending}
                  disabled={faceSamples.length < 5 || !faceImage || !consent}
                  onClick={() => faceMutation.mutate()}
                >
                  <ScanFace className="size-4" /> Đăng ký khuôn mặt
                </Button>
              </div>
            </div>
          </div>
        ) : step === 4 && registration ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 rounded-lg border border-neon/40 bg-neon/5 px-4 py-5 text-center">
              <CheckCircle2 className="size-9 text-neon" />
              <p className="text-sm font-bold text-chalk">Hoàn tất đăng ký gói tập</p>
              <p className="text-[11px] text-muted">
                {member?.fullName} · Mã hội viên{' '}
                <span className="font-mono text-chalk">{member?.code}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Thanh toán
                </p>
                <p className="mt-1 text-xs font-semibold text-chalk">
                  {registration.activated || checkedPayment?.status === 'PAID'
                    ? 'Đã xác nhận'
                    : 'Chờ xác nhận'}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Hóa đơn {registration.payment.code} ·{' '}
                  {formatCurrency(String(registration.payment.amount ?? 0))}
                </p>
              </div>
              <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Khuôn mặt
                </p>
                <p className="mt-1 text-xs font-semibold text-chalk">
                  {faceDone ? 'Đã đăng ký nhận diện' : 'Chưa đăng ký (có thể quét sau)'}
                </p>
              </div>
            </div>
            <div className="flex justify-end border-t border-line pt-4">
              <Button onClick={onClose}>Xong</Button>
            </div>
          </div>
        ) : step === 1 ? (
          <>
            <Select
              label="Gói tập *"
              value={packageId}
              options={[
                {
                  value: '',
                  label: pkgLoading
                    ? 'Đang tải gói tập...'
                    : packages.length
                      ? '— Chọn gói tập —'
                      : 'Chưa có gói tập nào',
                },
                ...packages
                  .filter((p) => p.status === 'ACTIVE')
                  .map((p) => ({
                    value: p.id,
                    label: `${p.name} · ${p.durationDays} ngày · ${formatCurrency(p.price)}`,
                  })),
              ]}
              onChange={(e) => setPackageId(e.target.value)}
            />

            {selectedPackage && (
              <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {selectedPackage.name}
                </p>
                <p className="mt-1.5 font-mono text-2xl font-bold text-neon">
                  {formatCurrency(selectedPackage.price)}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Thời hạn {selectedPackage.durationDays} ngày
                  {selectedPackage.sessions ? ` · ${selectedPackage.sessions} buổi` : ''}
                </p>
              </div>
            )}

            <Input
              label="Ghi chú (tuỳ chọn)"
              placeholder="Ghi chú cho hồ sơ thẻ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={mutation.isPending}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Mã khuyến mãi (tuỳ chọn)"
                placeholder="GYM10..."
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value)}
                disabled={mutation.isPending}
              />
              <Select
                label="Phương thức thanh toán"
                value={paymentMethod}
                options={PAYMENT_METHODS}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPayNow(e.target.value !== 'BANK_TRANSFER');
                }}
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-2">
              {paymentMethod !== 'BANK_TRANSFER' && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Thanh toán tại quầy
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPayNow(true)}
                      disabled={!isManualMethod || mutation.isPending}
                      className={cn(
                        'rounded-[10px] border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                        payNow ? 'border-neon/70 bg-neon/10' : 'border-line hover:border-neon/40',
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold text-chalk">
                        <Wallet className="size-3.5 text-neon" /> Thu tiền ngay
                      </span>
                      <span className="mt-1 block text-[11px] text-muted">
                        Chỉ chọn khi nhân viên đã nhận hoặc đối chiếu tiền thực tế.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayNow(false)}
                      disabled={mutation.isPending}
                      className={cn(
                        'rounded-[10px] border p-3 text-left transition-colors',
                        !payNow ? 'border-neon/70 bg-neon/10' : 'border-line hover:border-neon/40',
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold text-chalk">
                        <CreditCard className="size-3.5 text-neon" /> Chờ xác nhận
                      </span>
                      <span className="mt-1 block text-[11px] text-muted">
                        Tạo hóa đơn chờ thu và xác nhận sau.
                      </span>
                    </button>
                  </div>
                </>
              )}
              {!isManualMethod && (
                <p className="text-[11px] text-muted">
                  Ví điện tử không thể thu tiền tại quầy — đã tự chuyển sang chế độ chờ xác nhận.
                </p>
              )}
              {paymentMethod === 'BANK_TRANSFER' && !payNow && (
                <p className="rounded-lg border border-line bg-surface px-3 py-2 text-[11px] leading-relaxed text-muted">
                  Tiếp tục để tạo hóa đơn và mở mã QR. Gói được kích hoạt sau khi ngân hàng xác nhận
                  giao dịch.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
                Huỷ
              </Button>
              <Button isLoading={mutation.isPending} onClick={() => submit()}>
                <CreditCard className="size-4" /> Tiếp tục thanh toán
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
