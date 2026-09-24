'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '@/services/package.service';
import { memberApi } from '@/services/member.service';
import { membershipApi } from '@/services/membership.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  CreditCard,
  CheckCircle2,
  Wallet,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  Package,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tiền mặt', desc: 'Thanh toán tại quầy lễ tân' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', desc: 'VCB / ACB / MBBank...' },
  { value: 'MOMO', label: 'Ví MoMo', desc: 'Thanh toán nhanh qua ví điện tử' },
  { value: 'VNPAY', label: 'VNPay', desc: 'Cổng thanh toán VNPay' },
  { value: 'CREDIT_CARD', label: 'Thẻ tín dụng / ghi nợ', desc: 'Visa, Mastercard...' },
];

const STEPS = ['Xác nhận thông tin', 'Chọn phương thức', 'Hoàn tất'];

export default function RegisterMembershipPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      }
    >
      <RegisterMembershipContent />
    </Suspense>
  );
}

function RegisterMembershipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const packageId = searchParams.get('packageId');

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState('CASH');

  const { data: packages, isLoading: pkgLoading } = useQuery({
    queryKey: ['public-packages'],
    queryFn: packageApi.getPublicPackages,
    retry: 1,
  });

  const { data: me } = useQuery({
    queryKey: ['member-me'],
    queryFn: memberApi.getMe,
    retry: 0,
  });

  const selectedPackage = packages?.find((p) => p.id === packageId);

  useEffect(() => {
    if (packageId && !pkgLoading && packages && !selectedPackage) {
      toast.error('Không tìm thấy gói tập', 'Gói tập không tồn tại hoặc đã ngừng bán.');
    }
  }, [packageId, packages, pkgLoading, selectedPackage, toast]);

  const registerMutation = useMutation({
    mutationFn: () =>
      membershipApi.register({ packageId: packageId || '', paymentMethod: method, notes: 'Đăng ký từ public website' }),
    onSuccess: (res: any) => {
      toast.success(
        'Đăng ký gói tập thành công!',
        `Gói ${res.membership?.package?.name || ''} đã kích hoạt. Thanh toán demo đã hoàn tất.`,
      );
      queryClient.invalidateQueries({ queryKey: ['member-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      queryClient.invalidateQueries({ queryKey: ['member-notif-badge'] });
      router.push('/member/membership');
    },
    onError: (err: any) => {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Đăng ký thất bại';
      toast.error(
        status === 409 ? 'Bạn đang có gói tập hoạt động' : 'Đăng ký thất bại',
        Array.isArray(msg) ? msg.join(', ') : msg,
      );
    },
  });

  if (!packageId) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-muted" />
        <h1 className="mt-4 text-xl font-bold text-chalk">Chưa chọn gói tập</h1>
        <p className="mt-2 text-sm text-muted">Hãy chọn một gói tập trước khi đăng ký.</p>
        <Button className="mt-6" onClick={() => router.push('/packages')}>
          Xem gói tập
        </Button>
      </div>
    );
  }

  const member = me?.member;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Đăng ký gói tập
        </h1>
        <p className="mt-1 text-sm text-muted">
          Hoàn tất các bước bên dưới để kích hoạt gói tập của bạn (thanh toán demo).
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i < step
                    ? 'bg-neon text-ink'
                    : i === step
                      ? 'bg-neon text-ink ring-4 ring-neon/30'
                      : 'bg-line text-muted'
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-semibold ${i <= step ? 'text-chalk' : 'text-muted'}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-line" />}
          </React.Fragment>
        ))}
      </div>

      {pkgLoading || !selectedPackage ? (
        <Card>
          <CardContent className="p-8">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8">
            {/* Step 0: Confirm info */}
            {step === 0 && (
              <>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-neon" />
                  <h2 className="font-bold text-chalk">{selectedPackage.name}</h2>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-bold text-neon">
                    {formatCurrency(selectedPackage.price)}
                  </span>
                  <span className="text-sm text-muted">/ {selectedPackage.durationDays} ngày</span>
                </div>
                <p className="text-sm text-muted">{selectedPackage.description}</p>
                <ul className="space-y-2">
                  {(selectedPackage.features?.items || []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl border border-line bg-ink p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                    <User className="h-3.5 w-3.5" />
                    Thông tin hội viên
                  </p>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <p className="text-muted">
                      Họ tên: <b className="font-semibold text-chalk">{member?.fullName || me?.fullName}</b>
                    </p>
                    <p className="text-muted">
                      Mã HV: <b className="font-semibold text-chalk">{member?.code || '--'}</b>
                    </p>
                    <p className="text-muted">
                      Email: <b className="font-semibold text-chalk">{me?.email}</b>
                    </p>
                    <p className="text-muted">
                      SĐT: <b className="font-semibold text-chalk">{member?.phone || '--'}</b>
                    </p>
                  </div>
                </div>

                <Button className="h-11 w-full" onClick={() => setStep(1)}>
                  Tiếp tục
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Step 1: Payment method */}
            {step === 1 && (
              <>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted">
                  <Wallet className="h-4 w-4 text-neon" />
                  Chọn phương thức thanh toán
                </p>
                <div className="space-y-2.5">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                        method === m.value
                          ? 'border-neon bg-neon/10'
                          : 'border-line hover:border-neon/40'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-5 w-5 shrink-0 ${method === m.value ? 'text-neon' : 'text-muted'}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-chalk">{m.label}</p>
                        <p className="text-xs text-muted">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="rounded-lg border border-dashed border-line bg-ink p-3 text-[11px] text-muted">
                  Đây là thanh toán <b className="font-semibold text-chalk">demo</b>. Hệ thống được thiết kế sẵn theo
                  kiến trúc tách lớp để tích hợp cổng thanh toán thật (MoMo, VNPay, Bank Transfer, Cash) sau này.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(2)}>
                    Tiếp tục
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
              <>
                <div className="rounded-xl border border-neon/40 bg-neon/10 p-5">
                  <p className="text-sm font-bold text-chalk">Xác nhận đăng ký</p>
                  <div className="mt-3 space-y-2 text-sm text-muted">
                    <p>
                      Gói tập: <b className="font-semibold text-chalk">{selectedPackage.name}</b>
                    </p>
                    <p>
                      Tổng thanh toán:{' '}
                      <b className="font-semibold text-neon">{formatCurrency(selectedPackage.price)}</b>
                    </p>
                    <p>
                      Phương thức:{' '}
                      <b className="font-semibold text-chalk">
                        {PAYMENT_METHODS.find((m) => m.value === method)?.label}
                      </b>
                    </p>
                    <p>
                      Hội viên: <b className="font-semibold text-chalk">{member?.fullName || me?.fullName}</b> ({member?.code})
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </Button>
                  <Button
                    className="flex-1"
                    isLoading={registerMutation.isPending}
                    onClick={() => registerMutation.mutate()}
                  >
                    <Check className="h-4 w-4" />
                    Xác nhận thanh toán
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
