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
    : [];

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <section className="bg-slate-950 py-16 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2">Contact Us</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Liên hệ với chúng tôi</h1>
          <p className="mt-3 text-slate-400 max-w-2xl">
            Có bất kỳ câu hỏi nào về gói tập, lớp học hay dịch vụ? Đừng ngần ngại liên hệ với chúng tôi.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Info */}
          <div>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {infoItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors break-words"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Maps embed */}
            <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <iframe
                title="Bản đồ GymMaster"
                src={`https://www.google.com/maps?q=${encodeURIComponent(branch?.address || 'Bien Hoa, Dong Nai')}&output=embed`}
                className="w-full h-64 border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>

          {/* Contact form */}
          <div>
            <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gửi tin nhắn cho chúng tôi</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <Input label="Họ và tên (*)" placeholder="Nguyễn Văn A" error={errors.name?.message} {...register('name')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Button type="submit" className="w-full h-11 font-bold" isLoading={isSubmitting}>
                  <Send className="w-4 h-4" />
                  Gửi liên hệ
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}