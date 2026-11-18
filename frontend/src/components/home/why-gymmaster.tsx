'use client';

import React from 'react';
import Link from 'next/link';
import { Dumbbell, BadgeCheck, Salad, ScanFace, ShowerHead, Car, ArrowRight } from 'lucide-react';
import { Reveal } from './reveal';
import { StaggerGroup, StaggerItem } from '@/components/ui/motion';

const FEATURES = [
  {
    icon: Dumbbell,
    title: 'Giàn tạ & máy thế hệ mới',
    description:
      'Khu tạ nặng, giàn functional và máy cardio nhập khẩu — bảo trì định kỳ hằng tháng.',
  },
  {
    icon: BadgeCheck,
    title: 'HLV chứng chỉ quốc tế',
    description:
      'Huấn luyện viên cá nhân được đào tạo bài bản, xây giáo án bám sát mục tiêu của bạn.',
  },
  {
    icon: Salad,
    title: 'Dinh dưỡng cá nhân hoá',
    description:
      'Thực đơn từ thư viện 70+ món Việt, thiết kế riêng cho mục tiêu tăng cơ hoặc giảm mỡ.',
  },
  {
    icon: ScanFace,
    title: 'Check-in bằng khuôn mặt',
    description:
      'Vào cửa trong vài giây, không cần quẹt thẻ. Dữ liệu khuôn mặt được mã hoá, chỉ dùng để đối chiếu giờ tập.',
  },
  {
    icon: ShowerHead,
    title: 'Phòng tắm & locker',
    description:
      'Locker riêng, phòng tắm sạch sẽ, khăn và nước uống miễn phí cho hội viên mỗi ngày.',
  },
  {
    icon: Car,
    title: 'Bãi xe rộng · an ninh 24/7',
    description: 'Giờ mở cửa từ 5h đến 22h hằng ngày, bãi xe rộng rãi, camera an ninh 24/7.',
  },
];

const TRUST_STATS = [
  { value: '3.500+', label: 'Hội viên đang tập', accent: true },
  { value: '40+', label: 'HLV & nhân sự tại cơ sở', accent: false },
  { value: '4.9/5', label: 'Điểm hài lòng trung bình', accent: false },
];

export function WhyGymmaster() {
  return (
    <section className="scroll-mt-24 py-20 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="section-title">Why GymMaster</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Một cơ sở tập được đầu tư thật sự: thiết bị, con người và môi trường — để bạn không
              còn lý do trì hoãn.
            </p>
          </div>
        </Reveal>

        <StaggerGroup className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((f) => (
            <StaggerItem
              key={f.title}
              className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-neon/30 sm:p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-sm border border-neon/25 bg-neon/10 text-neon">
                <f.icon className="size-5" />
              </span>
              <span className="font-display text-lg font-bold uppercase tracking-wide text-chalk">
                {f.title}
              </span>
              <span className="text-sm leading-relaxed text-muted">{f.description}</span>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal delay={150}>
          <div className="mt-4 grid grid-cols-1 divide-y divide-line rounded-2xl border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {TRUST_STATS.map((s) => (
              <div key={s.label} className="px-6 py-5 text-center sm:py-6">
                <p
                  className={`font-display text-3xl font-extrabold leading-none sm:text-4xl ${
                    s.accent ? 'text-neon' : 'text-chalk'
                  }`}
                >
                  {s.value}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-6 text-center">
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 text-sm font-semibold text-neon transition-all hover:gap-3"
            >
              Xem gói tập & ưu đãi hôm nay
              <ArrowRight className="size-4" />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
