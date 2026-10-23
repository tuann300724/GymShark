'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Landmark,
  RefreshCw,
  ScanFace,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FaceScanner } from '@/components/ui/face-scanner';
import { useToast } from '@/components/ui/toast';
import apiClient from '@/lib/axios';
import { formatCurrency, cn } from '@/lib/utils';
import { branchApi } from '@/services/branch.service';
import { paymentApi } from '@/services/payment.service';
import {
  adminMemberApi,
  type CreateMemberPayload,
  type CreateMemberResult,
  type RegisterCardPayload,
  type RegisterCardResult,
} from '@/services/admin-member.service';
import { faceApi } from '@/services/face.service';
import type { Branch, MembershipPackage } from '@/services/types';

/**
 * MemberCreateDialog — luồng "làm thẻ hội viên mới" tại quầy, 3 bước:
 *   1. Thông tin hội viên  → POST /members            (tạo tài khoản + hồ sơ)
 *   2. Gói tập + thanh toán → POST /members/:id/memberships (thẻ PENDING hoặc thu tiền ngay)
 *   3. Quét khuôn mặt (tuỳ chọn) → POST /faces/member/:id/enroll
 *
 * Bước 1 và 2 không gộp chung API: nếu bước 2 (chọn gói) hỏng, hội viên đã tạo vẫn còn trong
 * danh sách và có thể làm thẻ lại từ hồ sơ — tránh mất dữ liệu vì chọn nhầm gói.
 */

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: 'Thông tin' },
  { step: 2, label: 'Gói tập' },
  { step: 3, label: 'Thanh toán' },
  { step: 4, label: 'Khuôn mặt' },
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
  { value: 'MOMO', label: 'MoMo' },
];

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  gender: 'MALE',
  dateOfBirth: '',
  address: '',
  emergencyContact: '',
  branchId: '',
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** Hội viên vừa tạo xong (để trang cha làm mới danh sách) */
  onCreated?: (member: CreateMemberResult['member']) => void;
}

export function MemberCreateDialog({ open, onClose, onCreated }: Props) {
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Gói tập
  const [packageId, setPackageId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [promotionCode, setPromotionCode] = useState('');
  const [payNow, setPayNow] = useState(true);
  const [transactionRef, setTransactionRef] = useState('');

  // Kết quả từng bước
  const [created, setCreated] = useState<CreateMemberResult | null>(null);
  const [card, setCard] = useState<RegisterCardResult | null>(null);
  const [faceDone, setFaceDone] = useState(false);

  // Quét mặt
  const [faceSamples, setFaceSamples] = useState<number[][]>([]);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [faceError, setFaceError] = useState('');

  // Thu tiền tại quầy chỉ áp dụng cho phương thức xác nhận thủ công
  const isManualMethod = paymentMethod === 'CASH' || paymentMethod === 'BANK_TRANSFER';
  const payNowBlocked = payNow && !isManualMethod;

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-list'],
    queryFn: branchApi.list,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['membership-packages'],
    queryFn: async () => {
      const res = await apiClient.get<MembershipPackage[]>('/membership-packages');
      return res.data;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: bankInfo } = useQuery({
    queryKey: ['bank-info'],
    queryFn: paymentApi.getBankInfo,
    enabled: open && paymentMethod === 'BANK_TRANSFER',
    staleTime: 10 * 60 * 1000,
  });

  const { data: cardPayment } = useQuery({
    queryKey: ['admin-payment-detail', card?.payment.id],
    queryFn: () => paymentApi.getPayment(card!.payment.id),
    enabled: open && step >= 3 && paymentMethod === 'BANK_TRANSFER' && !!card?.payment.id,
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 2000 : false),
    refetchIntervalInBackground: true,
    retry: 1,
  });

  // Reset toàn bộ mỗi lần mở lại dialog
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setForm(EMPTY_FORM);
    setErrors({});
    setPackageId('');
    setPaymentMethod('CASH');
    setPromotionCode('');
    setPayNow(true);
    setTransactionRef('');
    setCreated(null);
    setCard(null);
    setFaceDone(false);
    setFaceSamples([]);
    setFaceImage(null);
    setConsent(false);
    setFaceError('');
  }, [open]);

  // Gợi ý gói mặc định khi danh sách vừa tải xong
  useEffect(() => {
    if (!packageId && packages.length > 0) setPackageId(packages[0].id);
  }, [packages, packageId]);

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageId) ?? null,
    [packages, packageId],
  );
  const transferContent = created && card ? `GYM ${created.member.code} ${card.payment.code}` : '';
  const qrUrl =
    bankInfo && card?.payment
      ? `https://img.vietqr.io/image/${encodeURIComponent(bankInfo.shortName)}-${encodeURIComponent(bankInfo.accountNumber)}-qr_only.svg?amount=${Math.round(Number(card.payment.amount ?? selectedPackage?.price ?? 0))}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankInfo.accountName)}`
      : null;
  const paymentConfirmed = cardPayment?.status === 'PAID';

  // Thu tiền tại quầy với ví điện tử là bất khả thi (nhân viên không xác nhận được) → tự đổi về chờ
  useEffect(() => {
    if (payNowBlocked) setPayNow(false);
  }, [payNowBlocked]);

  useEffect(() => {
    if (cardPayment?.status !== 'PAID') return;
    setCard((current) => (current ? { ...current, activated: true } : current));
    setStep(4);
    toast.success('Đã nhận thanh toán', 'Thẻ hội viên đã được kích hoạt.');
  }, [cardPayment?.status, toast]);

  const createMutation = useMutation({
    mutationFn: async (payload: CreateMemberPayload) => adminMemberApi.create(payload),
    onSuccess: (res) => {
      setCreated(res);
      setStep(2);
      onCreated?.(res.member);
      toast.success('Đã tạo hội viên', `Mã hội viên: ${res.member.code}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      if (Array.isArray(msg)) {
        // class-validator trả mảng lỗi → gắn vào đúng ô nhập
        const mapped: Record<string, string> = {};
        for (const m of msg) mapped[String(m).split(' ')[0]] = String(m);
        setErrors(mapped);
        toast.error('Không tạo được hội viên', msg.join(' · '));
        return;
      }
      toast.error('Không tạo được hội viên', msg || 'Vui lòng thử lại.');
    },
  });

  const cardMutation = useMutation({
    mutationFn: async (payload: RegisterCardPayload) =>
      adminMemberApi.registerCard(created!.member.id, payload),
    onSuccess: (res) => {
      setCard(res);
      setStep(paymentMethod === 'BANK_TRANSFER' ? 3 : 4);
      toast.success(
        res.activated ? 'Đã kích hoạt thẻ' : 'Đã tạo thẻ — chờ thanh toán',
        `Hoá đơn ${res.payment.code} · ${formatCurrency(String(res.payment.amount ?? 0))}`,
      );
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      toast.error(
        'Không tạo được thẻ',
        Array.isArray(msg) ? msg.join(' · ') : msg || 'Vui lòng thử lại.',
      );
    },
  });

  const faceMutation = useMutation({
    mutationFn: async () => faceApi.adminEnroll(created!.member.id, faceSamples, faceImage),
    onSuccess: () => {
      setFaceDone(true);
      setStep(5);
      toast.success('Đã đăng ký khuôn mặt', 'Hội viên có thể check-in nhận diện nhanh tại quầy.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setFaceError(Array.isArray(msg) ? msg.join(' · ') : msg || 'Không đăng ký được.');
    },
  });

  // ----- Bước 1: tạo hội viên -------------------------------------------------
  const validateStep1 = () => {
    const next: Record<string, string> = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Họ và tên phải có tối thiểu 2 ký tự';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = 'Email không hợp lệ';
    if (!/^[0-9+\s.()-]{8,20}$/.test(form.phone.trim())) next.phone = 'Số điện thoại không hợp lệ';
    if (form.password && form.password.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitStep1 = () => {
    if (!validateStep1()) return;
    const payload: CreateMemberPayload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      gender: form.gender as CreateMemberPayload['gender'],
    };
    if (form.password.trim()) payload.password = form.password.trim();
    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
    if (form.address.trim()) payload.address = form.address.trim();
    if (form.emergencyContact.trim()) payload.emergencyContact = form.emergencyContact.trim();
    if (form.branchId) payload.branchId = form.branchId;
    createMutation.mutate(payload);
  };

  // ----- Bước 2: tạo thẻ ----------------------------------------------------
  const submitStep2 = () => {
    if (!packageId) {
      toast.error('Chưa chọn gói tập', 'Vui lòng chọn gói tập cho hội viên.');
      return;
    }
    const payload: RegisterCardPayload = {
      packageId,
      paymentMethod: paymentMethod as RegisterCardPayload['paymentMethod'],
      payNow: paymentMethod === 'BANK_TRANSFER' ? false : payNow,
    };
    if (promotionCode.trim()) payload.promotionCode = promotionCode.trim().toUpperCase();
    if (paymentMethod !== 'BANK_TRANSFER' && payNow && transactionRef.trim()) {
      payload.transactionRef = transactionRef.trim();
    }
    cardMutation.mutate(payload);
  };

  const skipFace = () => {
    setFaceDone(false);
    setStep(5);
  };

  const submitFace = () => {
    if (faceSamples.length < 5 || !faceImage || !consent) return;
    faceMutation.mutate();
  };

  // ----- Render --------------------------------------------------------------
  const visibleSteps =
    paymentMethod === 'BANK_TRANSFER' ? STEPS : STEPS.filter((item) => item.step !== 3);

  const stepIndicator = (
    <div className="flex items-center gap-1.5">
      {visibleSteps.map((s) => {
        const active = step === s.step;
        const done = step > s.step;
        return (
          <div
            key={s.step}
            className={cn(
              'flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors',
              active
                ? 'border-neon/70 bg-neon/10'
                : done
                  ? 'border-line bg-surface'
                  : 'border-line',
            )}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                done ? 'bg-neon text-ink' : active ? 'bg-neon text-ink' : 'bg-ink text-muted',
              )}
            >
              {done ? <CheckCircle2 className="size-3.5" /> : s.step}
            </span>
            <span
              className={cn(
                'truncate text-[11px] font-semibold',
                active ? 'text-neon' : done ? 'text-chalk' : 'text-muted',
              )}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  const stepBody = () => {
    // ---------------- Bước 1 ----------------
    if (step === 1) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Họ và tên *"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              error={errors.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              label="Số điện thoại *"
              placeholder="0912345678"
              value={form.phone}
              error={errors.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Email *"
              type="email"
              placeholder="ten@gmail.com"
              value={form.email}
              error={errors.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Select
              label="Giới tính"
              value={form.gender}
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
                { value: 'OTHER', label: 'Khác' },
              ]}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            />
            <Input
              label="Ngày sinh"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
            <Select
              label="Chi nhánh"
              value={form.branchId}
              options={[
                { value: '', label: 'Chi nhánh của tôi (mặc định)' },
                ...branches
                  .filter((b: Branch) => b.status === 'ACTIVE')
                  .map((b: Branch) => ({ value: b.id, label: b.name })),
              ]}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            />
            <Input
              label="Mật khẩu đăng nhập"
              type="text"
              placeholder="Để trống = hệ thống sinh mật khẩu tạm"
              value={form.password}
              error={errors.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Input
              label="Người liên hệ khẩn cấp"
              placeholder="Nguyễn Văn B - 0911222333"
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            />
            <Input
              label="Địa chỉ"
              className="sm:col-span-2"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <p className="rounded-lg border border-line bg-surface px-3 py-2.5 text-[11px] leading-relaxed text-muted">
            Bước này tạo tài khoản đăng nhập + hồ sơ hội viên. Nếu không nhập mật khẩu, hệ thống
            sinh một mật khẩu tạm và hiển thị ở bước cuối để bàn giao cho hội viên.
          </p>
        </div>
      );
    }

    // ---------------- Bước 2 ----------------
    if (step === 2) {
      return (
        <div className="space-y-4">
          {created && (
            <div className="flex items-center gap-2 rounded-lg border border-neon/40 bg-neon/5 px-3 py-2.5">
              <UserPlus className="size-4 shrink-0 text-neon" />
              <p className="text-xs text-chalk">
                Hội viên <span className="font-mono font-bold">{created.member.code}</span> —{' '}
                {created.member.fullName}
              </p>
            </div>
          )}

          <Select
            label="Gói tập *"
            value={packageId}
            options={[
              { value: '', label: packages.length ? '— Chọn gói tập —' : 'Đang tải gói tập...' },
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Phương thức thanh toán"
              value={paymentMethod}
              options={PAYMENT_METHODS}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <Input
              label="Mã khuyến mãi (tuỳ chọn)"
              placeholder="GYM10..."
              value={promotionCode}
              onChange={(e) => setPromotionCode(e.target.value)}
            />
          </div>

          {/* Ô chọn trạng thái thẻ sau khi tạo */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Thanh toán tại quầy
            </p>
            {paymentMethod === 'BANK_TRANSFER' ? (
              <div className="rounded-sm border border-neon/70 bg-neon/10 p-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-chalk">
                  <Landmark className="size-3.5 text-neon" /> Chuyển khoản bằng QR
                </span>
                <span className="mt-1 block text-[11px] text-muted">
                  Thẻ chờ xác nhận. Hệ thống tự kích hoạt sau khi nhận được đúng số tiền và nội
                  dung.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPayNow(true)}
                  className={cn(
                    'rounded-[10px] border p-3 text-left transition-colors',
                    payNow ? 'border-neon/70 bg-neon/10' : 'border-line hover:border-neon/40',
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold text-chalk">
                    <Wallet className="size-3.5 text-neon" /> Thu tiền ngay
                  </span>
                  <span className="mt-1 block text-[11px] text-muted">
                    Kích hoạt thẻ ngay (ACTIVE) — chỉ áp dụng cho tiền mặt
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayNow(false)}
                  className={cn(
                    'rounded-[10px] border p-3 text-left transition-colors',
                    !payNow ? 'border-neon/70 bg-neon/10' : 'border-line hover:border-neon/40',
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold text-chalk">
                    <CreditCard className="size-3.5 text-neon" /> Chờ xác nhận
                  </span>
                  <span className="mt-1 block text-[11px] text-muted">
                    Thẻ PENDING + hoá đơn chờ thu, xác nhận sau ở Hoá đơn
                  </span>
                </button>
              </div>
            )}
            {!isManualMethod && (
              <p className="text-[11px] text-muted">
                Ví điện tử không thể thu tiền tại quầy — đã tự chuyển sang chế độ chờ xác nhận.
              </p>
            )}
            {paymentMethod === 'BANK_TRANSFER' && (
              <p className="text-[11px] text-muted">
                Nội dung chuyển khoản sẽ được tạo cùng mã hóa đơn sau khi đăng ký thẻ.
              </p>
            )}
          </div>
        </div>
      );
    }

    // ---------------- Bước 3: chờ thanh toán chuyển khoản ----------------
    if (step === 3) {
      return (
        <div className="space-y-4">
          {created && (
            <div className="flex items-center gap-2 rounded-lg border border-neon/40 bg-neon/5 px-3 py-2.5">
              <UserPlus className="size-4 shrink-0 text-neon" />
              <p className="text-xs text-chalk">
                Hội viên <span className="font-mono font-bold">{created.member.code}</span> —{' '}
                {created.member.fullName}
              </p>
            </div>
          )}

          {paymentMethod === 'BANK_TRANSFER' && card && qrUrl && bankInfo ? (
            <div className="rounded-xl border border-dashed border-line p-4 text-center sm:p-5">
              <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold text-chalk">
                <Landmark className="size-4 text-neon" />
                Quét QR chuyển khoản
              </div>
              <div
                data-qr-frame={!paymentConfirmed ? '' : undefined}
                className={cn(
                  'relative mx-auto w-fit overflow-hidden rounded-2xl border border-line bg-surface p-2 transition-all duration-700 sm:p-3',
                  paymentConfirmed ? 'opacity-35' : 'opacity-100',
                )}
              >
                {/* VietQR được sinh động từ dịch vụ ngoài nên dùng img thay vì next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`Mã VietQR chuyển khoản ${bankInfo.bankName}`}
                  className="mx-auto size-64 rounded-xl bg-surface object-contain sm:size-72"
                />
                {!paymentConfirmed && <span data-qr-scan-beam aria-hidden="true" />}
                {paymentConfirmed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/55 text-neon animate-fade-in">
                    <CheckCircle2 className="size-9" />
                    <span className="text-xs font-bold">Đã nhận thanh toán</span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {bankInfo.bankName} · {bankInfo.accountNumber}
              </p>
              <div className="mt-3 rounded-lg border border-line bg-ink px-3 py-2 text-left">
                <p className="text-[10px] text-muted">Nội dung chuyển khoản</p>
                <p className="mt-0.5 break-all font-mono text-xs font-bold text-neon">
                  {transferContent}
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  Số tiền: {formatCurrency(String(card.payment.amount ?? 0))}
                </p>
              </div>
              <p className="mt-3 inline-flex items-center justify-center gap-2 text-[11px] text-muted">
                <RefreshCw className="size-3 animate-spin text-neon" />
                Đang chờ ngân hàng xác nhận. Bước quét khuôn mặt sẽ mở sau khi thanh toán thành
                công.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-surface p-3 text-sm text-muted">
              Đang tải thông tin thanh toán...
            </div>
          )}
        </div>
      );
    }

    // ---------------- Bước 4: quét mặt (tuỳ chọn) ----------------
    if (step === 4) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
            <ScanFace className="size-4 shrink-0 text-neon" />
            <p className="text-[11px] leading-relaxed text-muted">
              Bước này là tuỳ chọn. Quét khuôn mặt giúp hội viên check-in nhanh bằng nhận diện tại
              quầy. Có thể bỏ qua và quét lại sau trong hồ sơ hội viên.
            </p>
          </div>

          <FaceScanner
            key={`face-${created?.member.id ?? 'new'}`}
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
              Hội viên đã được thông báo và <span className="text-chalk">đồng ý</span> cho hệ thống
              lưu dữ liệu sinh trắc học khuôn mặt phục vụ nhận diện tại quầy (Nghị định 13/2023). Hệ
              thống lưu vector đặc trưng và 1 ảnh tham chiếu, không lưu video.{' '}
              <span className="text-amber-400">
                Lưu ý: một ảnh chụp sẽ được gửi tới dịch vụ phân tích khuôn mặt của Microsoft Azure
                để kiểm tra hội viên có đeo kính không — ảnh này không lưu trong hệ thống, chỉ dùng
                để trả kết quả.
              </span>
            </span>
          </label>

          {faceError && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-[11px] text-danger">
              {faceError}
            </p>
          )}
        </div>
      );
    }

    // ---------------- Bước 5: xong ----------------
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-2 rounded-lg border border-neon/40 bg-neon/5 px-4 py-5 text-center">
          <CheckCircle2 className="size-9 text-neon" />
          <p className="text-sm font-bold text-chalk">Đăng ký hội viên hoàn tất</p>
          <p className="text-[11px] text-muted">
            {created?.member.fullName} · Mã{' '}
            <span className="font-mono text-chalk">{created?.member.code}</span>
          </p>
        </div>

        {created?.tempPassword && (
          <div className="rounded-lg border border-neon/50 bg-surface px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neon">
              Mật khẩu tạm (chỉ hiện 1 lần)
            </p>
            <p className="mt-1.5 font-mono text-lg font-bold tracking-wider text-chalk">
              {created.tempPassword}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Đưa hội viên đổi mật khẩu ở trang Hồ sơ cá nhân sau lần đăng nhập đầu.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Thẻ tập</p>
            <p className="mt-1 text-xs font-semibold text-chalk">
              {card?.activated ? 'Đã kích hoạt (ACTIVE)' : 'Chờ xác nhận thanh toán (PENDING)'}
            </p>
            {card?.payment && (
              <p className="mt-0.5 text-[11px] text-muted">
                Hoá đơn {card.payment.code} · {formatCurrency(String(card.payment.amount ?? 0))}
              </p>
            )}
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
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Đăng ký hội viên mới"
      description="Làm thẻ tại quầy: tạo hồ sơ → chọn gói tập → quét khuôn mặt"
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {step < 5 && stepIndicator}
        {stepBody()}

        {/* Thanh điều hướng bước */}
        {step < 5 && (
          <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
            <Button
              variant="ghost"
              onClick={step <= 2 ? (step === 1 ? onClose : () => setStep(1)) : onClose}
              disabled={createMutation.isPending || cardMutation.isPending}
            >
              {step <= 2 ? (
                step === 1 ? (
                  'Huỷ'
                ) : (
                  <>
                    <ChevronLeft className="size-4" /> Quay lại
                  </>
                )
              ) : (
                'Đóng'
              )}
            </Button>

            {step === 1 && (
              <Button isLoading={createMutation.isPending} onClick={submitStep1}>
                <UserPlus className="size-4" /> Tạo hồ sơ & tiếp tục
              </Button>
            )}

            {step === 2 && (
              <Button isLoading={cardMutation.isPending} onClick={submitStep2}>
                <CreditCard className="size-4" /> Tạo thẻ & tiếp tục
              </Button>
            )}

            {step === 4 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={skipFace} disabled={faceMutation.isPending}>
                  Bỏ qua
                </Button>
                <Button
                  isLoading={faceMutation.isPending}
                  disabled={faceSamples.length < 5 || !faceImage || !consent}
                  onClick={submitFace}
                >
                  <ScanFace className="size-4" /> Đăng ký khuôn mặt
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="flex justify-end border-t border-line pt-4">
            <Button onClick={onClose}>Xong</Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
