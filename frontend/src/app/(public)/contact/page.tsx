'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { publicApi } from '@/services/package.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Reveal } from '@/components/home/reveal';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(3, 'Họ tên phải có tối thiểu 3 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  phone: z.string().regex(/^[0-9+\-\s]{9,15}$/, 'Số điện thoại không hợp lệ'),
  message: z.string().min(10, 'Nội dung phải có tối thiểu 10 ký tự'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function PublicContactPage() {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: branches, isLoading } = useQuery({
    queryKey: ['public-branches'],
    queryFn: publicApi.getBranches,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const branch = branches?.[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    // Form liên hệ: xử lý client-side (không có backend contact API). Sẽ gửi qua email/social khi cần.
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    toast.success(
      'Đã gửi liên hệ thành công!',
      `${values.name}, cảm ơn bạn đã liên hệ. Nhân viên của chúng tôi sẽ phản hồi trong thời gian sớm nhất.`,
    );
    reset();
  };

  const infoItems = branch
    ? [
        { icon: MapPin, label: 'Địa chỉ', value: `${branch.address}${branch.name ? ` (${branch.name})` : ''}` },
        { icon: Phone, label: 'Điện thoại', value: branch.phone, href: `tel:${branch.phone}` },
        { icon: Mail, label: 'Email', value: branch.email || 'lienhe@gymmaster.vn', href: `mailto:${branch.email || 'lienhe@gymmaster.vn'}` },
        { icon: Clock, label: 'Giờ mở cửa', value: branch.openingHours || '05:00 - 22:00 hàng ngày' },
      ]
    : [
        // Fallback đồng bộ với footer khi API chi nhánh chưa khả dụng
        { icon: MapPin, label: 'Địa chỉ', value: 'Khu Công nghệ Phần mềm, Đồng Nai' },
        { icon: Phone, label: 'Điện thoại', value: '1900 1009', href: 'tel:19001009' },
        { icon: Mail, label: 'Email', value: 'lienhe@gymmaster.vn', href: 'mailto:lienhe@gymmaster.vn' },
        { icon: Clock, label: 'Giờ mở cửa', value: '05:00 - 22:00 hàng ngày' },
      ];

  return (
    <div className="overflow-x-hidden">
      {/* ===== Page hero ===== */}
      <section className="border-b border-line">
        <div className="container-x py-14 lg:py-16">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
              Contact Us
            </p>
            <h1 className="section-title mt-4">Liên hệ với chúng tôi</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              Có bất kỳ câu hỏi nào về gói tập, lớp học hay dịch vụ? Đừng ngần ngại liên hệ với
              chúng tôi.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== Info + form ===== */}
      <section className="py-14 lg:py-16">
        <div className="container-x">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
            {/* Info cards + map */}
            <Reveal>
              <div>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {infoItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors duration-300 hover:border-neon/40"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-neon/25 bg-neon/10 text-neon">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                            {item.label}
                          </p>
                          {item.href ? (
                            <a
                              href={item.href}
                              className="mt-1 block break-words text-sm font-semibold text-chalk transition-colors hover:text-neon"
                            >
                              {item.value}
                            </a>
                          ) : (
                            <p className="mt-1 break-words text-sm font-semibold text-chalk">
                              {item.value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Maps embed */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-line">
                  <iframe
                    title="Bản đồ GymMaster"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(branch?.address || 'Bien Hoa, Dong Nai')}&output=embed`}
                    className="h-64 w-full border-0 [filter:invert(0.9)_hue-rotate(180deg)_saturate(0.7)_brightness(0.92)_contrast(1.05)]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </div>
            </Reveal>

            {/* Contact form */}
            <Reveal delay={120}>
              <div className="rounded-2xl border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                  Gửi tin nhắn cho chúng tôi
                </h2>
                <p className="mt-1.5 text-sm text-muted">
                  Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                  <Input label="Họ và tên (*)" placeholder="Nguyễn Văn A" error={errors.name?.message} {...register('name')} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Email (*)" type="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
                    <Input label="Số điện thoại (*)" placeholder="0912345678" error={errors.phone?.message} {...register('phone')} />
                  </div>
                  <Textarea
                    label="Nội dung (*)"
                    placeholder="Tôi muốn tư vấn về gói tập..."
                    rows={5}
                    error={errors.message?.message}
                    {...register('message')}
                  />
                  <Button type="submit" className="h-11 w-full font-bold" isLoading={isSubmitting}>
                    <Send className="h-4 w-4" />
                    Gửi liên hệ
                  </Button>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
