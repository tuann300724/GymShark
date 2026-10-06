'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/services/auth.service';
import { GoogleLoginButton } from '@/components/auth/google-login-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import {
  Dumbbell,
  AlertCircle,
  UserPlus,
  ArrowLeft,
  MailCheck,
  ShieldCheck,
  RotateCw,
  Check,
} from 'lucide-react';

const registerSchema = z
  .object({
    fullName: z.string().min(3, 'Họ và tên phải có tối thiểu 3 ký tự'),
    email: z.string().email('Email không đúng định dạng'),
    phone: z.string().regex(/^[0-9+\-\s]{9,15}$/, 'Số điện thoại không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
    confirmPassword: z.string(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

/** Mã xác minh: đúng 6 chữ số */
const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Mã xác minh gồm đúng 6 chữ số'),
});

type CodeFormValues = z.infer<typeof codeSchema>;

const STEPS = ['Thông tin', 'Xác minh email'];

/** Che bớt email khi hiển thị: n****@gmail.com — tránh lộ thông tin trên màn hình công cộng */
function maskEmail(email: string): string {
  const [name = '', domain = ''] = email.split('@');
  if (!domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(3, name.length - 2))}@${domain}`;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Bước 1: 'form' | Bước 2: 'verify'
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [targetEmail, setTargetEmail] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { gender: 'MALE' },
  });

  const {
    register: registerCode,
    handleSubmit: handleCodeSubmit,
    reset: resetCode,
    setFocus,
    formState: { errors: codeErrors },
  } = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  });

  // Đếm ngược hạn mã + khoảng nghỉ gửi lại (một vòng cho cả hai, luôn chạy ở bước 2)
  useEffect(() => {
    if (step !== 'verify') return;
    const timer = window.setInterval(() => {
      setExpiresIn((v) => Math.max(0, v - 1));
      setCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  // Hết hạn thì báo ngay để hội viên bấm "gửi lại mã" thay vì mất công nhập
  const isExpired = expiresIn === 0;
  const codeStepHint = useMemo(() => {
    if (cooldown > 0) return `Bạn có thể gửi lại mã sau ${formatCountdown(cooldown)}.`;
    if (isExpired) return 'Mã đã hết hạn. Hãy gửi lại mã mới để tiếp tục.';
    return `Mã hết hạn sau ${formatCountdown(expiresIn)}.`;
  }, [cooldown, expiresIn, isExpired]);

  // ---- Bước 1: gửi mã xác minh về email ----
  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.memberRegisterSendCode({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth || undefined,
        address: values.address || undefined,
      });

      setTargetEmail(res.email);
      setExpiresIn(res.expiresInSeconds);
      setCooldown(res.resendAfterSeconds);
      resetCode();
      setStep('verify');
      setErrorMessage(null);
      setFocus('code');
      toast.success(
        'Mã xác minh đã được gửi',
        `Vui lòng kiểm tra hộp thư ${maskEmail(res.email)} để lấy mã xác minh.`,
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Bước 2: xác minh mã để hoàn tất đăng ký ----
  const onVerify = async (values: CodeFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.memberRegisterVerify({ email: targetEmail, code: values.code });
      toast.success(
        'Đăng ký thành công!',
        `Mã hội viên của bạn là ${res.member.code}. Đăng nhập để bắt đầu hành trình fitness.`,
      );
      router.push('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Mã xác minh không đúng. Vui lòng thử lại.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const onResend = async () => {
    setIsResending(true);
    setErrorMessage(null);
    try {
      const res = await authApi.memberRegisterResendCode(targetEmail);
      setExpiresIn(res.expiresInSeconds);
      setCooldown(res.resendAfterSeconds);
      resetCode();
      setFocus('code');
      toast.success('Đã gửi lại mã', 'Mã cũ không còn hiệu lực, hãy dùng mã mới vừa nhận.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không gửi lại được mã. Vui lòng thử lại.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsResending(false);
    }
  };

  const backToForm = () => {
    setErrorMessage(null);
    resetCode();
    setStep('form');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-4 py-10">
      {/* Background photo + heavy overlay */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/images/gym-wide.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-ink/90" />
        <div className="absolute inset-x-0 top-0 h-px bg-line" />
      </div>

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        {/* Back to home */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface/70 px-3 py-2 text-xs font-semibold text-muted backdrop-blur transition-colors hover:border-neon/40 hover:text-chalk"
        >
          <ArrowLeft className="size-3.5" />
          Quay lại trang chủ
        </Link>

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl border border-neon/40 bg-surface text-neon">
            <Dumbbell className="size-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-chalk">
            GYM<span className="text-neon">MASTER</span> PRO
          </h1>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            Đăng ký tài khoản hội viên
          </p>
        </div>

        {/* Stepper — 2 bước: điền thông tin → xác minh email */}
        <div className="mb-5 flex items-center gap-2">
          {STEPS.map((s, i) => {
            const active = (step === 'form' && i === 0) || (step === 'verify' && i === 1);
            const done = step === 'verify' && i === 0;
            return (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      active
                        ? 'bg-neon text-ink ring-4 ring-neon/30'
                        : done
                          ? 'bg-neon text-ink'
                          : 'bg-line text-muted'
                    }`}
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold ${active || done ? 'text-chalk' : 'text-muted'}`}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="h-px flex-1 bg-line" />}
              </React.Fragment>
            );
          })}
        </div>

        <Card className="border-line bg-surface/95 shadow-2xl backdrop-blur-xl">
          {step === 'form' ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2.5 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                  <span className="flex size-9 items-center justify-center rounded-sm border border-neon/25 bg-neon/10 text-neon">
                    <UserPlus className="size-4" />
                  </span>
                  Tạo tài khoản hội viên
                </CardTitle>
                <CardDescription>
                  Điền thông tin bên dưới để bắt đầu hành trình fitness của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                {errorMessage && (
                  <div className="mb-4 flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Họ và tên (*)"
                    placeholder="Nguyễn Văn A"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Email (*)"
                      type="email"
                      placeholder="you@email.com"
                      error={errors.email?.message}
                      {...register('email')}
                    />
                    <Input
                      label="Số điện thoại (*)"
                      placeholder="0912345678"
                      error={errors.phone?.message}
                      {...register('phone')}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <PasswordInput
                      label="Mật khẩu (*)"
                      placeholder="Tối thiểu 6 ký tự"
                      error={errors.password?.message}
                      {...register('password')}
                    />
                    <PasswordInput
                      label="Xác nhận mật khẩu (*)"
                      placeholder="Nhập lại mật khẩu"
                      error={errors.confirmPassword?.message}
                      {...register('confirmPassword')}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Ngày sinh"
                      type="date"
                      error={errors.dateOfBirth?.message}
                      {...register('dateOfBirth')}
                    />
                    <Select
                      label="Giới tính"
                      options={[
                        { value: 'MALE', label: 'Nam' },
                        { value: 'FEMALE', label: 'Nữ' },
                        { value: 'OTHER', label: 'Khác' },
                      ]}
                      error={errors.gender?.message}
                      {...register('gender')}
                    />
                  </div>

                  <Input
                    label="Địa chỉ (tuỳ chọn)"
                    placeholder="Quận 9, TP. Hồ Chí Minh"
                    error={errors.address?.message}
                    {...register('address')}
                  />

                  {/* Nhắc hội viên biết bước 2 ngay từ đầu để không thấy bất ngờ */}
                  <div className="flex items-start gap-2 rounded-sm border border-line bg-ink/60 p-3 text-xs text-muted">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-neon" />
                    <span>
                      Bước tiếp theo, hệ thống gửi mã xác minh 6 số về chính email{' '}
                      <strong className="text-chalk">{getValues('email') || 'bạn nhập'}</strong> để
                      xác nhận bạn sở hữu email này.
                    </span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="h-11 w-full text-sm font-bold"
                    isLoading={isLoading}
                  >
                    Gửi mã xác minh
                  </Button>
                </form>

                <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                  <span className="h-px flex-1 bg-line" />
                  Hoặc
                  <span className="h-px flex-1 bg-line" />
                </div>
                <GoogleLoginButton label="Đăng ký bằng Google" />

                <p className="mt-4 text-center text-xs text-muted">
                  Đã có tài khoản?{' '}
                  <Link href="/login" className="font-semibold text-neon hover:underline">
                    Đăng nhập
                  </Link>
                </p>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2.5 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                  <span className="flex size-9 items-center justify-center rounded-sm border border-neon/25 bg-neon/10 text-neon">
                    <MailCheck className="size-4" />
                  </span>
                  Xác minh email
                </CardTitle>
                <CardDescription>
                  Nhập mã 6 số đã gửi tới{' '}
                  <strong className="text-chalk">{maskEmail(targetEmail)}</strong> để hoàn tất đăng
                  ký
                </CardDescription>
              </CardHeader>
              <CardContent>
                {errorMessage && (
                  <div className="mb-4 flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleCodeSubmit(onVerify)} className="space-y-4">
                  <Input
                    label="Mã xác minh (*)"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    className="h-14 text-center font-mono text-2xl font-bold tracking-[0.5em] text-neon"
                    error={codeErrors.code?.message}
                    {...registerCode('code', {
                      onChange: (e) => {
                        // Chỉ nhận chữ số — tránh nhập sai ký tự rồi mới báo lỗi
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                        e.target.value = digits;
                      },
                    })}
                  />

                  <p className="text-center text-xs text-muted">{codeStepHint}</p>

                  <Button
                    type="submit"
                    variant="primary"
                    className="h-11 w-full text-sm font-bold"
                    isLoading={isLoading}
                  >
                    Xác minh &amp; hoàn tất đăng ký
                  </Button>
                </form>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={backToForm}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="size-3.5" />
                    Sửa thông tin
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 text-xs"
                    onClick={onResend}
                    isLoading={isResending}
                    disabled={cooldown > 0 || isLoading}
                  >
                    <RotateCw className="size-3.5" />
                    {cooldown > 0 ? `Gửi lại mã (${formatCountdown(cooldown)})` : 'Gửi lại mã'}
                  </Button>
                </div>

                <p className="mt-5 text-center text-xs text-muted">
                  Không nhận được mã? Kiểm tra thư mục{' '}
                  <strong className="text-chalk">spam / quảng cáo</strong> hoặc gửi lại mã sau 60
                  giây.
                </p>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
