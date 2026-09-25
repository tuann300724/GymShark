'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { authApi, saveSession } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, AlertCircle, Sparkles, KeyRound, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'STAFF'];

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@gym.com',
      password: 'Admin@123456',
    },
  });

  const getRedirectPath = (role: string, next?: string | null) => {
    if (next) return next;
    return ADMIN_ROLES.includes(role) ? '/admin' : '/member';
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await authApi.login(values.email, values.password);
      const { accessToken, user } = response;

      saveSession(accessToken, user);
      if (rememberMe) {
        localStorage.setItem('gym_remember_email', values.email);
      } else {
        localStorage.removeItem('gym_remember_email');
      }

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const next = params.get('next');
        router.push(getRedirectPath(user.role, next));
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra xem Backend đã khởi động chưa.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickAccount = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-4 py-10">
      {/* Background photo + heavy overlay */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/images/bw-training.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-ink/90" />
        <div className="absolute inset-x-0 top-0 h-px bg-line" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
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
            Hệ thống Quản lý Vận hành Phòng Gym
          </p>
        </div>

        {/* Login card */}
        <Card className="border-line bg-surface/95 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="font-display text-2xl font-bold uppercase tracking-tight text-chalk">
              Đăng nhập
            </CardTitle>
            <CardDescription>
              Truy cập khu vực hội viên hoặc trang quản trị theo vai trò của bạn
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
              <div>
                <Input
                  label="Email tài khoản"
                  type="email"
                  placeholder="you@email.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div>
                <Input
                  label="Mật khẩu"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer select-none items-center gap-2 text-chalk">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-line bg-ink accent-neon"
                  />
                  Ghi nhớ đăng nhập
                </label>
                <Link
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorMessage(
                      'Vui lòng liên hệ nhân viên lễ tân của phòng gym để được hỗ trợ đặt lại mật khẩu.',
                    );
                  }}
                  className="inline-flex items-center gap-1 font-medium text-neon hover:underline"
                >
                  <KeyRound className="size-3.5" />
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="h-11 w-full text-sm font-bold"
                isLoading={isLoading}
              >
                Đăng nhập
              </Button>
            </form>

            {/* Register link */}
            <p className="mt-4 text-center text-xs text-muted">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-semibold text-neon hover:underline">
                Đăng ký ngay
              </Link>
            </p>

            {/* Quick Demo Accounts Helper */}
            <div className="mt-6 border-t border-line pt-5">
              <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Sparkles className="size-3.5 text-neon" />
                <span>Chọn nhanh tài khoản mẫu:</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('admin@gym.com', 'Admin@123456')}
                  className="rounded-sm border border-line bg-ink px-2.5 py-1.5 text-left font-medium text-chalk transition-colors hover:border-neon/40 hover:bg-line/40"
                >
                  <span className="block font-bold text-neon text-[11px]">ADMIN</span>
                  admin@gym.com
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('manager@gym.com', 'Manager@123456')}
                  className="rounded-sm border border-line bg-ink px-2.5 py-1.5 text-left font-medium text-chalk transition-colors hover:border-neon/40 hover:bg-line/40"
                >
                  <span className="block font-bold text-neon text-[11px]">MANAGER</span>
                  manager@gym.com
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('staff@gym.com', 'Staff@123456')}
                  className="rounded-sm border border-line bg-ink px-2.5 py-1.5 text-left font-medium text-chalk transition-colors hover:border-neon/40 hover:bg-line/40"
                >
                  <span className="block font-bold text-neon text-[11px]">STAFF</span>
                  staff@gym.com
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('trainer@gym.com', 'Trainer@123456')}
                  className="rounded-sm border border-line bg-ink px-2.5 py-1.5 text-left font-medium text-chalk transition-colors hover:border-neon/40 hover:bg-line/40"
                >
                  <span className="block font-bold text-neon text-[11px]">TRAINER</span>
                  trainer@gym.com
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('member@gym.com', 'Member@123456')}
                  className="rounded-sm border border-line bg-ink px-2.5 py-1.5 text-left font-medium text-chalk transition-colors hover:border-neon/40 hover:bg-line/40"
                >
                  <span className="block font-bold text-neon text-[11px]">MEMBER</span>
                  member@gym.com
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
