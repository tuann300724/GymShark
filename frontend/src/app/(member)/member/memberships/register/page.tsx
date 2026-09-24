'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '@/services/package.service';
import { memberApi } from '@/services/member.service';
import { membershipApi } from '@/services/membership.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="max-w-2xl mx-auto space-y-4">
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
        'Đăng ký gói tập thành công! 🎉',
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
      <div className="max-w-xl mx-auto text-center py-20">
        <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Chưa chọn gói tập</h1>
        <p className="mt-2 text-sm text-slate-500">Hãy chọn một gói tập trước khi đăng ký.</p>
        <Button className="mt-6" onClick={() => router.push('/packages')}>
          Xem gói tập
        </Button>
      </div>
    );
  }

  const member = me?.member;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Đăng ký gói tập
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Hoàn tất các bước bên dưới để kích hoạt gói tập của bạn (thanh toán demo).
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step
                    ? 'bg-emerald-600 text-white'
                    : i === step
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-semibold ${i <= step ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />}
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
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Step 0: Confirm info */}
            {step === 0 && (
              <>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="font-bold text-slate-900 dark:text-white">{selectedPackage.name}</h2>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedPackage.price)}
                  </span>
                  <span className="text-sm text-slate-500">/ {selectedPackage.durationDays} ngày</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedPackage.description}</p>
                <ul className="space-y-2">
                  {(selectedPackage.features?.items || []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Thông tin hội viên
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <p className="text-slate-600 dark:text-slate-300">
                      Họ tên: <b className="text-slate-900 dark:text-white">{member?.fullName || me?.fullName}</b>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      Mã HV: <b className="text-slate-900 dark:text-white">{member?.code || '--'}</b>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      Email: <b className="text-slate-900 dark:text-white">{me?.email}</b>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      SĐT: <b className="text-slate-900 dark:text-white">{member?.phone || '--'}</b>
                    </p>
                  </div>
                </div>

                <Button className="w-full h-11" onClick={() => setStep(1)}>
                  Tiếp tục
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Step 1: Payment method */}
            {step === 1 && (
              <>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Chọn phương thức thanh toán
                </p>
                <div className="space-y-2.5">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
                        method === m.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 shrink-0 ${method === m.value ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{m.label}</p>
                        <p className="text-xs text-slate-500">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-3">
                  💡 Đây là thanh toán <b>demo</b>. Hệ thống được thiết kế sẵn theo kiến trúc tách lớp để tích hợp cổng
                  thanh toán thật (MoMo, VNPay, Bank Transfer, Cash) sau này.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(2)}>
                    Tiếp tục
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
              <>
                <div className="p-5 rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Xác nhận đăng ký</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      Gói tập: <b className="text-slate-900 dark:text-white">{selectedPackage.name}</b>
                    </p>
                    <p>
                      Tổng thanh toán: <b className="text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedPackage.price)}</b>
                    </p>
                    <p>
                      Phương thức:{' '}
                      <b className="text-slate-900 dark:text-white">
                        {PAYMENT_METHODS.find((m) => m.value === method)?.label}
                      </b>
                    </p>
                    <p>
                      Hội viên: <b className="text-slate-900 dark:text-white">{member?.fullName || me?.fullName}</b> ({member?.code})
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                  </Button>
                  <Button
                    className="flex-1"
                    isLoading={registerMutation.isPending}
                    onClick={() => registerMutation.mutate()}
                  >
                    <Check className="w-4 h-4" />
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