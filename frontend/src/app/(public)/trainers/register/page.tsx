'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Dumbbell,
  Mail,
  MessageSquare,
  Star,
} from 'lucide-react';
import { trainerApi, type TrainerDocumentInput } from '@/services/trainer.service';
import { CertificateUploader, MIN_CERTIFICATES } from '@/components/trainer/certificate-uploader';
import { AvatarUploader } from '@/components/trainer/avatar-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const BENEFITS = [
  { icon: Star, text: 'Đăng ký và duy trì hồ sơ hoàn toàn miễn phí.' },
  { icon: MessageSquare, text: 'Hội viên toàn mạng lưới tìm thấy, nhắn tin và đặt lịch với bạn.' },
  { icon: BadgeCheck, text: 'Hồ sơ được thẩm định — tăng độ tin cậy với học viên.' },
  { icon: Mail, text: 'Được duyệt, tài khoản PT và mật khẩu đăng nhập gửi thẳng về email.' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'Không muốn nêu' },
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  specialization: '',
  certification: '',
  experienceYears: '',
  hourlyRate: '',
  gender: '',
  avatarUrl: '',
  bio: '',
};

const BIO_MIN = 30;

/**
 * Trang công khai: huấn luyện viên tự do gửi đơn + ảnh bằng cấp (giống đăng ký đối tác).
 * Chưa tạo tài khoản — admin duyệt xong hệ thống mới tạo và gửi mật khẩu qua email.
 */
export default function TrainerRegisterPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doneEmail, setDoneEmail] = useState<string | null>(null);
  const [documents, setDocuments] = useState<TrainerDocumentInput[]>([]);
  const [docError, setDocError] = useState('');

  const set =
    (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDocError('');
    if (documents.length < MIN_CERTIFICATES) {
      setDocError('Vui lòng tải lên ít nhất 1 ảnh bằng cấp hoặc chứng chỉ.');
      return setError('Thiếu ảnh bằng cấp / chứng chỉ.');
    }
    if (form.bio.trim().length < BIO_MIN)
      return setError(`Phần giới thiệu cần ít nhất ${BIO_MIN} ký tự để admin thẩm định.`);
    if (!agreed) return setError('Vui lòng xác nhận thông tin hồ sơ là chính xác.');

    setLoading(true);
    try {
      await trainerApi.apply({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        specialization: form.specialization.trim(),
        certification: form.certification.trim() || undefined,
        experienceYears: Number(form.experienceYears) || 0,
        bio: form.bio.trim(),
        avatarUrl: form.avatarUrl.trim() || undefined,
        gender: (form.gender || undefined) as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        documents: documents.map((d) => ({
          dataUrl: d.dataUrl,
          caption: d.caption?.trim() || undefined,
        })),
      });
      setDoneEmail(form.email.trim());
      setForm(EMPTY_FORM);
      setDocuments([]);
      setAgreed(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể gửi đơn. Vui lòng thử lại.';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x py-10 lg:py-14">
      <Link
        href="/trainers"
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted hover:border-neon/40 hover:text-chalk"
      >
        <ArrowLeft className="size-3.5" /> Đội ngũ huấn luyện viên
      </Link>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <section>
          <span className="inline-flex rounded-full border border-neon/40 bg-neon/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neon">
            Dành cho huấn luyện viên
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-chalk sm:text-5xl">
            Trở thành PT <span className="text-neon">trên GymMaster</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Gửi thông tin chuyên môn và ảnh bằng cấp — hoàn toàn miễn phí. Quản trị viên thẩm định
            hồ sơ, được duyệt thì GymMaster tạo tài khoản PT và gửi thông tin đăng nhập qua email.
          </p>
          <ul className="mt-7 space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neon/30 bg-neon/10 text-neon">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm text-chalk/90">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <Card>
          <CardContent className="p-6 sm:p-8">
            {doneEmail ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <span className="flex size-14 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-neon">
                  <CheckCircle2 className="size-7" />
                </span>
                <h2 className="font-display text-2xl font-bold uppercase text-chalk">
                  Đã gửi đơn đăng ký
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-muted">
                  Cảm ơn bạn! GymMaster đã nhận hồ sơ và ảnh bằng cấp. Khi được duyệt, tài khoản PT
                  cùng mật khẩu đăng nhập sẽ được gửi tới <b className="text-chalk">{doneEmail}</b>.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/"
                    className="inline-flex h-11 items-center rounded-sm bg-neon px-5 text-sm font-bold text-ink hover:bg-neon-hover"
                  >
                    Về trang chủ
                  </Link>
                  <Link
                    href="/trainers"
                    className="inline-flex h-11 items-center rounded-sm border border-line px-5 text-sm font-semibold text-chalk hover:border-neon/40"
                  >
                    Xem đội ngũ PT
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex size-12 items-center justify-center rounded-xl border border-neon/40 bg-surface text-neon">
                    <Dumbbell className="size-6" />
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-extrabold uppercase text-chalk">
                    Hồ sơ <span className="text-neon">huấn luyện viên</span>
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Các trường có dấu * là bắt buộc. Chưa cần đặt mật khẩu — tài khoản được tạo sau
                    khi duyệt.
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="pt-fullName"
                      label="Họ và tên *"
                      required
                      minLength={2}
                      maxLength={120}
                      value={form.fullName}
                      onChange={set('fullName')}
                      autoComplete="name"
                    />
                    <Input
                      id="pt-phone"
                      label="Số điện thoại *"
                      required
                      type="tel"
                      pattern="[0-9+\-\s]{9,15}"
                      value={form.phone}
                      onChange={set('phone')}
                      autoComplete="tel"
                    />
                  </div>
                  <Input
                    id="pt-email"
                    label="Email *"
                    type="email"
                    required
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                  />
                  <div className="border-t border-line pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neon">
                      Hồ sơ chuyên môn
                    </p>
                  </div>
                  <Input
                    id="pt-specialization"
                    label="Chuyên môn chính *"
                    required
                    minLength={2}
                    maxLength={400}
                    placeholder="Ví dụ: Tăng cơ giảm mỡ, Yoga trị liệu"
                    value={form.specialization}
                    onChange={set('specialization')}
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input
                      id="pt-exp"
                      label="Số năm kinh nghiệm *"
                      type="number"
                      required
                      min={0}
                      max={60}
                      value={form.experienceYears}
                      onChange={set('experienceYears')}
                    />
                    <Input
                      id="pt-rate"
                      label="Phí kèm (VND/buổi)"
                      type="number"
                      min={0}
                      step={10000}
                      placeholder="300000"
                      value={form.hourlyRate}
                      onChange={set('hourlyRate')}
                    />
                    <Select
                      id="pt-gender"
                      label="Giới tính"
                      options={GENDER_OPTIONS}
                      value={form.gender}
                      onChange={set('gender')}
                    />
                  </div>
                  <Input
                    id="pt-cert"
                    label="Chứng chỉ"
                    maxLength={400}
                    placeholder="Ví dụ: ISSA CPT, NASM, chứng chỉ HLV quốc gia"
                    value={form.certification}
                    onChange={set('certification')}
                  />
                  <AvatarUploader
                    label="Ảnh đại diện (hiển thị công khai)"
                    name={form.fullName}
                    value={form.avatarUrl}
                    onChange={(avatarUrl) => setForm((current) => ({ ...current, avatarUrl }))}
                  />
                  <Textarea
                    id="pt-bio"
                    label="Giới thiệu bản thân *"
                    rows={5}
                    required
                    maxLength={2000}
                    placeholder="Kinh nghiệm huấn luyện, thành tích, phương pháp, đối tượng học viên bạn hướng tới..."
                    value={form.bio}
                    onChange={set('bio')}
                  />
                  <p className="-mt-2 text-right text-[11px] text-muted">
                    {form.bio.trim().length}/{BIO_MIN} ký tự tối thiểu
                  </p>

                  <CertificateUploader
                    value={documents}
                    onChange={(next) => {
                      setDocuments(next);
                      if (next.length) setDocError('');
                    }}
                    error={docError}
                  />

                  <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 accent-neon"
                    />
                    Tôi xác nhận thông tin và bằng cấp là chính xác, đồng ý để GymMaster thẩm định
                    và hiển thị công khai hồ sơ (không gồm ảnh bằng cấp) sau khi được duyệt.
                  </label>

                  {error && (
                    <p
                      role="alert"
                      className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                    Gửi đơn đăng ký PT
                  </Button>
                  <p className="text-center text-xs text-muted">
                    Đã được duyệt?{' '}
                    <Link href="/login" className="font-semibold text-neon hover:underline">
                      Đăng nhập cổng PT
                    </Link>
                  </p>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
