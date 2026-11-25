'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  CalendarDays,
  Receipt,
  Headphones,
  Phone,
  MessageCircle,
  Mail,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { partnerApi } from '@/services/partner.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Direction = 'owner' | 'community';

const DIRECTIONS: { value: Direction; icon: typeof Building2; title: string; desc: string }[] = [
  {
    value: 'owner',
    icon: Building2,
    title: 'Quản lý phòng gym riêng',
    desc: 'Tài khoản quản trị riêng — tự quản lý hội viên, lịch tập và check-in của phòng bạn.',
  },
  {
    value: 'community',
    icon: Users,
    title: 'Nâng cấp hạng Cộng đồng',
    desc: 'Hội viên đã đăng ký gói trên hệ thống có thể tập tại cơ sở của bạn với chiết khấu riêng.',
  },
];

const BENEFITS = [
  {
    icon: UserPlus,
    text: 'Thu hút thêm lượt hội viên đến tập mà không tốn chi phí quảng cáo.',
  },
  {
    icon: CalendarDays,
    text: 'Quản lý hội viên, lịch tập và check-in trực quan trên một hệ thống.',
  },
  {
    icon: Receipt,
    text: 'Minh bạch số lượt tập và chi phí đối soát định kỳ.',
  },
  {
    icon: Headphones,
    text: 'Hỗ trợ thiết lập và đồng hành cùng chủ phòng tập.',
  },
] as const;

const AMENITIES = ['Máy lạnh', 'Tắm nóng lạnh', 'Xông hơi', 'GroupX / Yoga', 'Bãi giữ xe'] as const;

const QUICK_CONTACTS = [
  { icon: Phone, label: 'Hotline', value: '1900 1009', href: 'tel:19001009' },
  { icon: MessageCircle, label: 'Zalo', value: 'Nhắn tin Zalo', href: 'https://zalo.me/19001009' },
  { icon: Mail, label: 'Email', value: 'lienhe@gymmaster.vn', href: 'mailto:lienhe@gymmaster.vn' },
] as const;

const COMMUNITY_TERMS = [
  'Hội viên đã đăng ký gói trên hệ thống Gym Master được tập tại cơ sở của bạn.',
  'Chiết khấu 10% mỗi lượt tập được đối soát minh bạch định kỳ hằng tháng.',
  'Cơ sở duy trì chất lượng dịch vụ và giờ mở cửa đã đăng ký.',
  'Hệ thống có thể tạm ngưng hợp tác nếu vi phạm điều khoản.',
];

export default function PartnerRegisterPage() {
  const [direction, setDirection] = useState<Direction>('owner');
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    price: '',
    link: '',
    notes: '',
  });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ businessName: string; direction: Direction } | null>(
    null,
  );

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleAmenity = (value: string) =>
    setAmenities((list) =>
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (
      !form.businessName.trim() ||
      !form.ownerName.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.address.trim()
    ) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu tài khoản phải có tối thiểu 6 ký tự.');
      return;
    }
    if (direction === 'community' && !agreed) {
      setError('Vui lòng đọc và đồng ý với điều khoản & mức chiết khấu hợp tác Cộng đồng.');
      return;
    }

    setLoading(true);

    // Hướng 1 — tài khoản quản trị riêng: gọi API thật, chờ duyệt ở /admin/partners.
    if (direction === 'owner') {
      try {
        const res = await partnerApi.register({
          businessName: form.businessName.trim(),
          ownerName: form.ownerName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          password: form.password,
          address: form.address.trim(),
        });
        setSuccess({ businessName: res.partner.businessName, direction: 'owner' });
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || 'Không thể gửi yêu cầu đăng ký. Vui lòng thử lại.';
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Hướng 2 — nâng hạng Cộng đồng: UI trước, chờ backend riêng.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setLoading(false);
    setSuccess({ businessName: form.businessName.trim(), direction: 'community' });
  };

  const reset = () => {
    setForm({
      businessName: '',
      ownerName: '',
      phone: '',
      email: '',
      password: '',
      address: '',
      price: '',
      link: '',
      notes: '',
    });
    setAmenities([]);
    setAgreed(false);
    setError('');
    setSuccess(null);
  };

  const isCommunity = direction === 'community';

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
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

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface/70 px-3 py-2 text-xs font-semibold text-muted backdrop-blur transition-colors hover:border-neon/40 hover:text-chalk"
        >
          <ArrowLeft className="size-3.5" /> Quay lại trang chủ
        </Link>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ===== Cột trái: quyền lợi + kênh liên hệ ===== */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center rounded-full border border-neon/40 bg-neon/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neon">
              Hợp tác phòng gym (B2B)
            </span>

            <h1 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-chalk sm:text-5xl">
              Mở rộng mạng lưới hội viên &amp; <span className="text-neon">quản lý phòng gym</span>{' '}
              hiệu quả
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Liên kết phòng gym của bạn với hệ sinh thái Gym Master và tận dụng nền tảng quản lý
              hội viên, lịch tập, check-in — tất cả ngay trên một hệ thống.
            </p>

            <ul className="mt-7 space-y-3">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-start gap-3 rounded-xl border border-line bg-surface/70 p-4 backdrop-blur"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neon/30 bg-neon/10 text-neon">
                    <Icon className="size-4" />
                  </span>
                  <p className="text-sm leading-snug text-chalk/90">{text}</p>
                </li>
              ))}
            </ul>

            <div className="mt-7 rounded-2xl border border-line bg-surface/70 p-5 backdrop-blur">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-chalk">
                Liên hệ nhanh với đội ngũ hỗ trợ
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {QUICK_CONTACTS.map(({ icon: Icon, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group flex min-w-0 flex-col gap-0.5 rounded-sm border border-line bg-ink px-4 py-2.5 transition-colors hover:border-neon/50"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <Icon className="size-3.5 text-neon" /> {label}
                    </span>
                    <span className="truncate text-sm font-semibold text-chalk transition-colors group-hover:text-neon">
                      {value}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ===== Cột phải: card form ===== */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card>
              <CardContent className="p-6 sm:p-8">
                {success ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-neon">
                      <CheckCircle2 className="size-7" />
                    </span>
                    <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                      {success.direction === 'owner'
                        ? 'Đã gửi yêu cầu đăng ký'
                        : 'Đã gửi yêu cầu hợp tác Cộng đồng'}
                    </h2>
                    <p className="max-w-md text-sm leading-relaxed text-muted">
                      {success.direction === 'owner' ? (
                        <>
                          Hồ sơ{' '}
                          <span className="font-semibold text-chalk">{success.businessName}</span>{' '}
                          đang chờ ban quản trị duyệt. Bạn có thể đăng nhập bằng email vừa đăng ký
                          để theo dõi trạng thái.
                        </>
                      ) : (
                        <>
                          Yêu cầu nâng hạng Cộng đồng của{' '}
                          <span className="font-semibold text-chalk">{success.businessName}</span>{' '}
                          đã được gửi. Đội ngũ sẽ liên hệ qua số điện thoại / Zalo để cùng bạn chốt
                          điều khoản và mức chiết khấu.
                        </>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-3">
                      <Button variant="secondary" onClick={reset}>
                        Gửi thêm hồ sơ khác
                      </Button>
                      <Link href="/">
                        <Button variant="outline">Quay lại trang chủ</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-7">
                      <div className="flex size-12 items-center justify-center rounded-xl border border-neon/40 bg-surface text-neon">
                        <Building2 className="size-6" />
                      </div>
                      <h2 className="mt-4 font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-chalk">
                        Đăng ký <span className="text-neon">đối tác</span>
                      </h2>
                      <p className="mt-3 text-xs leading-relaxed text-muted">
                        Dành cho chủ phòng gym / doanh nghiệp muốn quản lý hệ thống của riêng mình
                        trên Gym Master Pro.
                      </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                      {/* --- Chọn hướng hợp tác --- */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Hướng hợp tác *
                        </span>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {DIRECTIONS.map(({ value, icon: Icon, title, desc }) => {
                            const active = direction === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setDirection(value)}
                                className={cn(
                                  'relative rounded-xl border p-3.5 text-left transition-colors',
                                  active
                                    ? 'border-neon bg-neon/10'
                                    : 'border-line bg-ink hover:border-neon/40',
                                )}
                              >
                                {active && (
                                  <CheckCircle2 className="absolute right-3 top-3 size-4 text-neon" />
                                )}
                                <span
                                  className={cn(
                                    'flex size-8 items-center justify-center rounded-lg border',
                                    active
                                      ? 'border-neon/40 bg-neon/10 text-neon'
                                      : 'border-line bg-surface text-muted',
                                  )}
                                >
                                  <Icon className="size-4" />
                                </span>
                                <p
                                  className={cn(
                                    'mt-2.5 pr-5 text-sm font-semibold',
                                    active ? 'text-chalk' : 'text-chalk/80',
                                  )}
                                >
                                  {title}
                                </p>
                                <p className="mt-1 text-xs leading-snug text-muted">{desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* --- Điều khoản & chiết khấu (chỉ hướng Cộng đồng) --- */}
                      {isCommunity && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-3 rounded-xl border border-neon/40 bg-neon/5 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-chalk">
                                <ShieldCheck className="size-4 text-neon" /> Điều khoản hợp tác Cộng
                                đồng
                              </p>
                              <p className="mt-1 text-xs text-muted">
                                Mức chiết khấu do hệ thống Gym Master quy định
                              </p>
                            </div>
                            <span className="font-display text-3xl font-extrabold leading-none text-neon">
                              10%
                            </span>
                          </div>

                          <ul className="space-y-1.5">
                            {COMMUNITY_TERMS.map((term) => (
                              <li
                                key={term}
                                className="flex items-start gap-2 text-xs leading-snug text-muted"
                              >
                                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-neon/70" />
                                {term}
                              </li>
                            ))}
                          </ul>

                          <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={agreed}
                              onChange={(e) => setAgreed(e.target.checked)}
                              className="mt-0.5 size-4 shrink-0 rounded border-line bg-ink accent-neon"
                            />
                            <span className="text-xs leading-snug text-chalk/90">
                              Tôi đã đọc và đồng ý với{' '}
                              <span className="font-semibold text-neon">
                                điều khoản hợp tác &amp; mức chiết khấu
                              </span>{' '}
                              do Gym Master quy định.
                            </span>
                          </label>
                        </motion.div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Tên phòng gym / Cơ sở *"
                          name="businessName"
                          value={form.businessName}
                          onChange={set('businessName')}
                          placeholder="VD: Gym Alpha"
                        />
                        <Input
                          label="Họ tên người đại diện *"
                          name="ownerName"
                          value={form.ownerName}
                          onChange={set('ownerName')}
                          placeholder="VD: Nguyễn Văn A"
                        />
                        <Input
                          label="Số điện thoại / Zalo *"
                          name="phone"
                          inputMode="tel"
                          value={form.phone}
                          onChange={set('phone')}
                          placeholder="0912345678"
                        />
                        <Input
                          label="Email *"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={set('email')}
                          placeholder="partner@example.com"
                        />
                        <PasswordInput
                          label="Mật khẩu tài khoản *"
                          name="password"
                          value={form.password}
                          onChange={set('password')}
                          placeholder="Tối thiểu 6 ký tự"
                        />
                        <Input
                          label="Giá vé tập lẻ 1 buổi (VND)"
                          name="price"
                          inputMode="numeric"
                          value={form.price}
                          onChange={set('price')}
                          placeholder="VD: 50.000"
                        />
                      </div>

                      <Input
                        label="Địa chỉ phòng gym *"
                        name="address"
                        value={form.address}
                        onChange={set('address')}
                        placeholder="Số nhà, tên đường, quận, thành phố"
                      />

                      <div className="min-w-0 space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Tiện ích của phòng
                        </span>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {AMENITIES.map((item) => {
                            const active = amenities.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                aria-pressed={active}
                                onClick={() => toggleAmenity(item)}
                                className={cn(
                                  'rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors',
                                  active
                                    ? 'border-neon/60 bg-neon/10 text-neon'
                                    : 'border-line bg-ink text-muted hover:border-neon/40 hover:text-chalk',
                                )}
                              >
                                {item}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Input
                        label="Link Fanpage / Google Maps / Hình ảnh"
                        name="link"
                        value={form.link}
                        onChange={set('link')}
                        placeholder="Dán link tại đây (không bắt buộc)"
                      />

                      <Textarea
                        label="Ghi chú thêm"
                        name="notes"
                        rows={3}
                        value={form.notes}
                        onChange={set('notes')}
                        placeholder="Mô tả thêm về cơ sở của bạn (không bắt buộc)"
                      />

                      {error && (
                        <p className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
                          <AlertCircle className="size-4 shrink-0" /> {error}
                        </p>
                      )}

                      <Button type="submit" size="lg" isLoading={loading} className="w-full">
                        {isCommunity ? 'Gửi yêu cầu hợp tác Cộng đồng' : 'Gửi yêu cầu đăng ký'}
                      </Button>
                      <p className="text-center text-xs text-muted">
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="font-semibold text-neon hover:underline">
                          Đăng nhập
                        </Link>
                      </p>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
