'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Dumbbell, AlertCircle, UserPlus } from 'lucide-react';

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
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-neon/40 bg-surface text-neon">
            <Dumbbell className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-chalk">
            GYM<span className="text-neon">MASTER</span> PRO
          </h1>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            Đăng ký tài khoản hội viên
          </p>
        </div>

        <Card className="border-line bg-surface/95 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2.5 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-neon/25 bg-neon/10 text-neon">
                <UserPlus className="h-4 w-4" />
              </span>
              Tạo tài khoản hội viên
            </CardTitle>
            <CardDescription>
              Điền thông tin bên dưới để bắt đầu hành trình fitness của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 flex items-start gap-2 rounded-[10px] border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
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

              <Button type="submit" variant="primary" className="h-11 w-full text-sm font-bold" isLoading={isLoading}>
                Đăng ký
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-semibold text-neon hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
