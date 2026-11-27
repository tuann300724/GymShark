'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Building2,
  Check,
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
} from 'lucide-react';
import { partnerApi, type FacilityPhotoInput } from '@/services/partner.service';
import {
  FacilityPhotoUploader,
  MIN_FACILITY_PHOTOS,
} from '@/components/partner/facility-photo-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

type Direction = 'owner' | 'community';

/** 2 hướng hợp tác — chú thích ngắn để đối tác thấy rõ khác biệt */
const DIRECTIONS = [
  {
    value: 'owner',
    icon: Building2,
    title: 'Quản lý phòng gym riêng',
    price: '699.000đ',
    summary: 'Dùng phần mềm Gym Master để vận hành phòng tập của bạn.',
    points: [
      'Quản lý hội viên, gói tập, lịch tập và check-in',
      'Chỉ phục vụ hội viên riêng của phòng bạn',
    ],
  },
  {
    value: 'community',
    icon: Users,
    title: 'Lên Gym Cộng đồng',
    price: '799.000đ',
    summary: 'Đưa phòng tập vào mạng lưới phòng gym đối tác Gym Master.',
    points: [
      'Hội viên mua gói trên Gym Master được đến tập tại phòng bạn',
      'Nhận hoa hồng theo mỗi lượt check-in, đối soát hằng tháng',
      'Gửi kèm ảnh cơ sở vật chất để được xếp hạng Standard/Plus/Premium',
    ],
  },
] as const satisfies readonly {
  value: Direction;
  icon: typeof Building2;
  title: string;
  price: string;
  summary: string;
  points: readonly string[];
}[];
const BENEFITS = [
  { icon: UserPlus, text: 'Tiếp cận thêm hội viên phù hợp với phòng tập.' },
  { icon: CalendarDays, text: 'Trao đổi giải pháp quản lý và vận hành phòng gym.' },
  { icon: Receipt, text: 'Thông tin chi phí và quyền lợi được tư vấn rõ ràng.' },
  { icon: Headphones, text: 'Đội ngũ hỗ trợ đồng hành trong quá trình hợp tác.' },
];
const CONTACTS = [
  { icon: Phone, label: 'Hotline', value: '1900 1009', href: 'tel:19001009' },
  { icon: MessageCircle, label: 'Zalo', value: 'Nhắn tin Zalo', href: 'https://zalo.me/19001009' },
  { icon: Mail, label: 'Email', value: 'lienhe@gymmaster.vn', href: 'mailto:lienhe@gymmaster.vn' },
];

export default function PartnerRegisterPage() {
  const [direction, setDirection] = useState<Direction>('owner');
  const [form, setForm] = useState({
    contactName: '',
    address: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(true);
  const [photos, setPhotos] = useState<FacilityPhotoInput[]>([]);
  const [photoError, setPhotoError] = useState('');
  const isCommunity = direction === 'community';
  // Giá 2 gói hợp tác do admin cấu hình — lỗi mạng thì dùng giá mặc định trong DIRECTIONS
  const plansQuery = useQuery({
    queryKey: ['public-partnership-plans'],
    queryFn: partnerApi.publicPlans,
    staleTime: 5 * 60_000,
  });
  const priceOf = (value: Direction, fallback: string) => {
    const plan = plansQuery.data?.find(
      (p) => p.code === (value === 'owner' ? 'OWNER' : 'COMMUNITY'),
    );
    return plan ? `${Number(plan.monthlyPrice).toLocaleString('vi-VN')}đ` : fallback;
  };
  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPhotoError('');
    if (isCommunity && photos.length < MIN_FACILITY_PHOTOS) {
      setPhotoError(
        `Gym Cộng đồng cần tối thiểu ${MIN_FACILITY_PHOTOS} ảnh phòng tập để admin đánh giá hạng.`,
      );
      return;
    }
    setLoading(true);
    try {
      const result = await partnerApi.submitLead({
        direction: isCommunity ? 'COMMUNITY' : 'OWNER',
        contactName: form.contactName.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        photos: isCommunity
          ? photos.map((photo) => ({ ...photo, caption: photo.caption?.trim() || undefined }))
          : undefined,
      });
      setPhotos([]);
      setConfirmationEmailSent(result.emailSent);
      setSuccess(true);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.';
      setError(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink">
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/70 px-3 py-2 text-xs font-semibold text-muted hover:border-neon/40 hover:text-chalk"
        >
          <ArrowLeft className="size-3.5" /> Quay lại trang chủ
        </Link>
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <section>
            <span className="inline-flex rounded-full border border-neon/40 bg-neon/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neon">
              Hợp tác phòng gym
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-chalk sm:text-5xl">
              Cùng Gym Master <span className="text-neon">phát triển phòng tập</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Chọn hướng hợp tác phù hợp và để lại thông tin. Đội ngũ sẽ liên hệ trao đổi trực tiếp,
              chưa cần tạo tài khoản.
            </p>
            <ul className="mt-7 space-y-3">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface/70 p-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neon/30 bg-neon/10 text-neon">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm text-chalk/90">{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 rounded-2xl border border-line bg-surface/70 p-5">
              <h2 className="font-display text-lg font-bold uppercase text-chalk">Liên hệ nhanh</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {CONTACTS.map(({ icon: Icon, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-line bg-ink px-4 py-2.5 hover:border-neon/50"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <Icon className="size-3.5 text-neon" />
                      {label}
                    </span>
                    <span className="truncate text-sm font-semibold text-chalk">{value}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <Card>
            <CardContent className="p-6 sm:p-8">
              {success ? (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-neon">
                    <CheckCircle2 className="size-7" />
                  </span>
                  <h2 className="font-display text-2xl font-bold uppercase text-chalk">
                    Đã nhận thông tin
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-muted">
                    {confirmationEmailSent
                      ? `Cảm ơn ${form.contactName}. Đã gửi email xác nhận đến ${form.email}. Đội ngũ Gym Master sẽ xem thông tin và liên hệ lại, vui lòng chờ phản hồi.`
                      : `Cảm ơn ${form.contactName}. Yêu cầu đã được lưu nhưng hiện chưa gửi được email xác nhận. Đội ngũ Gym Master vẫn sẽ xem thông tin và liên hệ lại.`}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess(false);
                      setConfirmationEmailSent(true);
                      setForm({ contactName: '', address: '', email: '', phone: '', message: '' });
                    }}
                  >
                    Gửi yêu cầu khác
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex size-12 items-center justify-center rounded-xl border border-neon/40 bg-surface text-neon">
                      <Building2 className="size-6" />
                    </div>
                    <h2 className="mt-4 font-display text-3xl font-extrabold uppercase text-chalk">
                      Trao đổi <span className="text-neon">hợp tác</span>
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      Để lại thông tin liên hệ và nội dung bạn muốn trao đổi.
                    </p>
                  </div>
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {DIRECTIONS.map(({ value, icon: Icon, title, price, summary, points }) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={direction === value}
                          onClick={() => setDirection(value)}
                          className={`rounded-xl border p-3.5 text-left transition-colors ${direction === value ? 'border-neon bg-neon/10' : 'border-line bg-ink hover:border-neon/40'}`}
                        >
                          <span className="flex items-center justify-between">
                            <Icon
                              className={`size-4 ${direction === value ? 'text-neon' : 'text-muted'}`}
                            />
                            {direction === value && <CheckCircle2 className="size-4 text-neon" />}
                          </span>
                          <span className="mt-2 block text-sm font-semibold text-chalk">
                            {title}
                          </span>
                          <span className="mt-1 block font-display text-2xl font-extrabold text-neon">
                            {priceOf(value, price)}
                            <span className="ml-1 font-sans text-xs font-medium text-muted">
                              / tháng
                            </span>
                          </span>
                          <span className="mt-2 block text-xs leading-relaxed text-muted">
                            {summary}
                          </span>
                          <span className="mt-2 block space-y-1 border-t border-line pt-2">
                            {points.map((point) => (
                              <span
                                key={point}
                                className="flex items-start gap-1.5 text-xs leading-snug text-chalk"
                              >
                                <Check className="mt-0.5 size-3 shrink-0 text-neon" />
                                {point}
                              </span>
                            ))}
                          </span>
                        </button>
                      ))}
                    </div>
                    <Input
                      label="Họ tên người liên hệ *"
                      name="contactName"
                      autoComplete="name"
                      required
                      value={form.contactName}
                      onChange={set('contactName')}
                      placeholder="VD: Nguyễn Văn A"
                    />
                    <Input
                      label="Địa chỉ phòng gym / cơ sở"
                      name="address"
                      autoComplete="street-address"
                      value={form.address}
                      onChange={set('address')}
                      placeholder="Số nhà, tên đường, quận, thành phố"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Số điện thoại *"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="0912345678"
                      />
                      <Input
                        label="Email *"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={form.email}
                        onChange={set('email')}
                        placeholder="ban@example.com"
                      />
                    </div>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Thông tin muốn trao đổi
                      </span>
                      <textarea
                        name="message"
                        rows={4}
                        value={form.message}
                        onChange={set('message')}
                        placeholder="Bạn muốn tìm hiểu hoặc trao đổi điều gì?"
                        className="w-full rounded-lg border border-line bg-ink px-3.5 py-3 text-sm text-chalk placeholder:text-muted focus:border-neon focus:outline-none"
                      />
                    </label>
                    {isCommunity && (
                      <FacilityPhotoUploader
                        value={photos}
                        onChange={(next) => {
                          setPhotos(next);
                          if (next.length >= MIN_FACILITY_PHOTOS) setPhotoError('');
                        }}
                        error={photoError}
                      />
                    )}
                    {error && (
                      <p
                        role="alert"
                        className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-medium text-danger"
                      >
                        <AlertCircle className="size-4 shrink-0" />
                        {error}
                      </p>
                    )}
                    <Button type="submit" size="lg" isLoading={loading} className="w-full">
                      Gửi yêu cầu tư vấn
                    </Button>
                    <p className="text-center text-xs text-muted">
                      Đội ngũ sẽ liên hệ để tư vấn và xác nhận chi tiết gói.
                    </p>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
