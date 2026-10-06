'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, KeyRound, AlertCircle, CheckCircle2, MailCheck } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
});

const resetSchema = z
  .object({
    code: z.string().length(6, 'Mã gồm đúng 6 chữ số'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(6, 'Vui lòng nhập lại mật khẩu mới'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });

type EmailValues = z.infer<typeof emailSchema>;
type ResetValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (expiresIn <= 0 && cooldown <= 0) return;
    const t = setInterval(() => {
      setExpiresIn((s) => Math.max(0, s - 1));
      setCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [expiresIn, cooldown]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const sendCode = async (values: EmailValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await authApi.forgotPassword(values.email.trim().toLowerCase());
      setEmail(res.email);
      setExpiresIn(res.expiresInSeconds);
      setCooldown(res.resendAfterSeconds);
      setStep(2);
      setSuccessMessage(res.message);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không gửi được mã. Vui lòng thử lại sau.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const doReset = async (values: ResetValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.resetPassword(email, values.code.trim(), values.newPassword);
      setSuccessMessage(`${res.message} Đang chuyển về trang đăng nhập...`);
      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-4 py-10">
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface/70 px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-neon/40 hover:text-chalk"
        >
          <ArrowLeft className="size-3.5" />
          Quay lại đăng nhập
        </Link>

        <Card className="border-line bg-surface/95 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
              <KeyRound className="size-5 text-neon" />
              Quên mật khẩu
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Nhập email đã đăng ký — hệ thống gửi mã 6 số để đặt lại mật khẩu'
                : `Mã đã gửi về ${email}. Nhập mã và tạo mật khẩu mới.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 flex items-start gap-2 rounded-sm border border-neon/30 bg-neon/10 p-3 text-xs text-chalk">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-neon" />
                <span>{successMessage}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={emailForm.handleSubmit(sendCode)} className="space-y-4">
                <Input
                  label="Email đã đăng ký"
                  type="email"
                  placeholder="you@email.com"
                  error={emailForm.formState.errors.email?.message}
                  {...emailForm.register('email')}
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="h-11 w-full text-sm font-bold"
                  isLoading={isLoading}
                >
                  Gửi mã đặt lại mật khẩu
                </Button>
              </form>
            ) : (
              <form onSubmit={resetForm.handleSubmit(doReset)} className="space-y-4">
                <div className="flex items-center justify-between rounded-sm border border-line bg-ink px-3 py-2 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MailCheck className="size-3.5 text-neon" />
                    {email}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="font-semibold text-neon hover:underline"
                  >
                    Đổi email
                  </button>
                </div>
                <Input
                  label="Mã 6 số trong email"
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  error={resetForm.formState.errors.code?.message}
                  {...resetForm.register('code')}
                />
                <PasswordInput
                  label="Mật khẩu mới"
                  placeholder="Tối thiểu 6 ký tự"
                  error={resetForm.formState.errors.newPassword?.message}
                  {...resetForm.register('newPassword')}
                />
                <PasswordInput
                  label="Nhập lại mật khẩu mới"
                  placeholder="Nhập lại mật khẩu mới"
                  error={resetForm.formState.errors.confirmPassword?.message}
                  {...resetForm.register('confirmPassword')}
                />
                {expiresIn > 0 && (
                  <p className="text-xs text-muted">
                    Mã hết hạn sau{' '}
                    <span className="font-semibold text-chalk">{formatTime(expiresIn)}</span>
                  </p>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  className="h-11 w-full text-sm font-bold"
                  isLoading={isLoading}
                >
                  Đặt lại mật khẩu
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 w-full text-xs"
                  disabled={cooldown > 0 || isLoading}
                  onClick={() => email && sendCode({ email })}
                >
                  {cooldown > 0 ? `Gửi lại mã sau ${formatTime(cooldown)}` : 'Gửi lại mã'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
