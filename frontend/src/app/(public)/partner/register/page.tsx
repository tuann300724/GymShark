'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { partnerApi } from '@/services/partner.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent } from '@/components/ui/card';

export default function PartnerRegisterPage() {
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    taxCode: '',
    address: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ businessName: string; email: string } | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (
      !form.businessName.trim() ||
      !form.ownerName.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError('Vui lòng điền đầy đủ tên doanh nghiệp, chủ sở hữu, email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const res = await partnerApi.register({
        businessName: form.businessName.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim(),
        taxCode: form.taxCode.trim() || undefined,
        address: form.address.trim() || undefined,
        password: form.password,
      });
      setSuccess({ businessName: res.partner.businessName, email: form.email.trim() });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Không thể gửi yêu cầu đăng ký. Vui lòng thử lại.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-4 py-12">
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
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface/70 px-3 py-2 text-xs font-semibold text-muted backdrop-blur transition-colors hover:border-neon/40 hover:text-chalk"
        >
          <ArrowLeft className="size-3.5" /> Quay lại trang chủ
        </Link>

        {success ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-neon">
                <CheckCircle2 className="size-7" />
              </span>
              <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                Đã gửi yêu cầu đăng ký
              </h1>
              <p className="max-w-md text-sm text-muted">
                Hồ sơ <span className="font-semibold text-chalk">{success.businessName}</span> đang
                chờ ban quản trị duyệt. Bạn có thể đăng nhập bằng{' '}
                <span className="font-semibold text-chalk">{success.email}</span> để theo dõi trạng
                thái.
              </p>
              <Link href="/login">
                <Button>Đi đến đăng nhập</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl border border-neon/40 bg-surface text-neon">
                  <Building2 className="size-7" />
                </div>
                <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-chalk">
                  Đăng ký <span className="text-neon">đối tác</span>
                </h1>
                <p className="mt-3 text-xs text-muted">
                  Dành cho chủ phòng gym / doanh nghiệp muốn quản lý hệ thống của riêng mình trên
                  Gym Master Pro.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Tên phòng gym / doanh nghiệp *"
                    name="businessName"
                    value={form.businessName}
                    onChange={set('businessName')}
                    placeholder="VD: Gym Alpha"
                  />
                  <Input
                    label="Họ tên chủ sở hữu *"
                    name="ownerName"
                    value={form.ownerName}
                    onChange={set('ownerName')}
                    placeholder="VD: Nguyễn Văn A"
                  />
                  <Input
                    label="Số điện thoại"
                    name="phone"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="0912345678"
                  />
                  <Input
                    label="Email đăng nhập *"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="partner@example.com"
                  />
                  <Input
                    label="Mã số thuế (nếu có)"
                    name="taxCode"
                    value={form.taxCode}
                    onChange={set('taxCode')}
                    placeholder="0312345678"
                  />
                  <PasswordInput
                    label="Mật khẩu *"
                    name="password"
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
                <Input
                  label="Địa chỉ doanh nghiệp"
                  name="address"
                  value={form.address}
                  onChange={set('address')}
                  placeholder="Số nhà, tên đường, quận, thành phố"
                />

                {error && (
                  <p className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
                    <AlertCircle className="size-4 shrink-0" /> {error}
                  </p>
                )}

                <Button type="submit" size="lg" isLoading={loading} className="w-full">
                  Gửi yêu cầu đăng ký
                </Button>
                <p className="text-center text-xs text-muted">
                  Đã có tài khoản?{' '}
                  <Link href="/login" className="font-semibold text-neon hover:underline">
                    Đăng nhập
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
