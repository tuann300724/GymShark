'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { authApi, saveSession } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, AlertCircle, Sparkles, KeyRound } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/25 mb-3">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            GYM<span className="text-emerald-500">MASTER</span> PRO
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            Hệ thống Quản lý Vận hành Phòng Gym
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white">Đăng nhập</CardTitle>
            <CardDescription className="text-slate-400">
              Truy cập khu vực hội viên hoặc trang quản trị theo vai trò của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
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
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 accent-emerald-600"
                  />
                  Ghi nhớ đăng nhập
                </label>
                <Link
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorMessage('Vui lòng liên hệ nhân viên lễ tân của phòng gym để được hỗ trợ đặt lại mật khẩu.');
                  }}
                  className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-medium"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-sm font-bold shadow-lg shadow-emerald-600/30"
                isLoading={isLoading}
              >
                Đăng nhập
              </Button>
            </form>

            {/* Register link */}
            <p className="mt-4 text-center text-xs text-slate-400">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-emerald-400 font-semibold hover:underline">
                Đăng ký ngay
              </Link>
            </p>

            {/* Quick Demo Accounts Helper */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chọn nhanh tài khoản mẫu:</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('admin@gym.com', 'Admin@123456')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-left font-medium transition-colors"
                >
                  <span className="font-bold text-emerald-400 block text-[11px]">ADMIN</span>
                  admin@gym.com
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('manager@gym.com', 'Manager@123456')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-left font-medium transition-colors"
                >
                  <span className="font-bold text-sky-400 block text-[11px]">MANAGER</span>
                  manager@gym.com
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('staff@gym.com', 'Staff@123456')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-left font-medium transition-colors"
                >
                  <span className="font-bold text-amber-400 block text-[11px]">STAFF</span>
                  staff@gym.com
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('trainer@gym.com', 'Trainer@123456')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-left font-medium transition-colors"
                >
                  <span className="font-bold text-purple-400 block text-[11px]">TRAINER</span>
                  trainer@gym.com
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('member@gym.com', 'Member@123456')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-left font-medium transition-colors"
                >
                  <span className="font-bold text-teal-400 block text-[11px]">MEMBER</span>
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