'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Flame, AlertCircle, UserPlus } from 'lucide-react';

const registerSchema = z
  .object({
    fullName: z.string().min(3, 'Họ và tên phải có tối thiểu 3 ký tự'),
    email: z.string().email('Email không đúng định dạng'),
    phone: z
      .string()
      .regex(/^[0-9+\-\s]{9,15}$/, 'Số điện thoại không hợp lệ'),
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

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { gender: 'MALE' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await authApi.memberRegister({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth || undefined,
        address: values.address || undefined,
      });
      toast.success(
        'Tạo tài khoản thành công!',
        'Bạn đã là hội viên của GymMaster Pro. Vui lòng đăng nhập để tiếp tục.',
      );
      router.push('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden py-10">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/25 mb-3">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            GYM<span className="text-emerald-500">MASTER</span> PRO
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            Đăng ký tài khoản hội viên
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Tạo tài khoản hội viên
            </CardTitle>
            <CardDescription className="text-slate-400">
              Điền thông tin bên dưới để bắt đầu hành trình fitness của bạn
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
              <Input
                label="Họ và tên (*)"
                placeholder="Nguyễn Văn A"
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Mật khẩu (*)"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  label="Xác nhận mật khẩu (*)"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-sm font-bold shadow-lg shadow-emerald-600/30"
                isLoading={isLoading}
              >
                Đăng ký
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-400">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}