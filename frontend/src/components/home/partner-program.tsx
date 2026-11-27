'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CreditCard,
  ScanFace,
  UserCog,
  Users,
} from 'lucide-react';
import { partnerApi } from '@/services/partner.service';
import { formatCurrency } from '@/lib/utils';
import { Reveal } from './reveal';
import { StaggerGroup, StaggerItem } from '@/components/ui/motion';
import { TiltCard } from './effects';

const MODES = [
  {
    code: 'COMMUNITY',
    title: 'Gym cộng đồng',
    desc: 'Mở cửa đón hội viên Gym Master. Mỗi lượt check-in tại phòng bạn được chia hoa hồng từ giá trị gói của hội viên.',
    points: [
      'Thêm nguồn khách từ toàn mạng lưới',
      'Hoa hồng tính theo từng lượt check-in',
      'Được xếp hạng sau khi thẩm định ảnh cơ sở vật chất',
    ],
  },
  {
    code: 'OWNER',
    title: 'Gym tự quản lý',
    desc: 'Dùng Gym Master làm phần mềm quản lý riêng: hội viên, gói tập, PT và doanh thu của phòng bạn tách biệt hoàn toàn.',
    points: [
      'Hội viên riêng không cần tài khoản — quét mặt là vào',
      'Tự đặt gói tập và giá bán của phòng',
      'Dữ liệu không lẫn với hệ thống Gym Master',
    ],
  },
] as const;

const TOOLS = [
  { icon: Users, label: 'Hồ sơ hội viên & thẻ tập' },
  { icon: CreditCard, label: 'Gói tập, thu tiền, hoá đơn' },
  { icon: ScanFace, label: 'Check-in nhận diện khuôn mặt' },
  { icon: UserCog, label: 'Huấn luyện viên & nhân viên' },
  { icon: CalendarDays, label: 'Lịch tập & lớp học' },
  { icon: BarChart3, label: 'Doanh thu & hoa hồng' },
];

export function PartnerProgram() {
  const { data: plans = [] } = useQuery({
    queryKey: ['public-partnership-plans'],
    queryFn: partnerApi.publicPlans,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const priceOf = (code: string) => plans.find((plan) => plan.code === code)?.monthlyPrice;

  return (
    <section id="partners" className="scroll-mt-24 py-20 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="max-w-2xl">
            <p className="meta-label">Dành cho chủ phòng gym</p>
            <h2 className="section-title mt-2">Gia nhập mạng lưới</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Hai hình thức hợp tác theo tháng — chọn cách phù hợp với phòng gym của bạn. Gym Master
              tư vấn, thẩm định và cấp tài khoản quản lý trong vài ngày.
            </p>
          </div>
        </Reveal>

        <StaggerGroup className="mt-12 grid gap-4 lg:grid-cols-2">
          {MODES.map((mode) => {
            const price = priceOf(mode.code);
            return (
              <StaggerItem key={mode.code} className="h-full">
                <TiltCard className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="font-display text-2xl font-extrabold uppercase text-chalk">
                      {mode.title}
                    </h3>
                    {price != null && (
                      <p className="font-display text-xl font-bold text-neon">
                        {formatCurrency(Number(price))}
                        <span className="ml-1 font-sans text-sm font-semibold text-muted">
                          /tháng
                        </span>
                      </p>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{mode.desc}</p>
                  <ul className="mt-5 space-y-2.5">
                    {mode.points.map((point) => (
                      <li key={point} className="flex gap-2 text-sm text-chalk">
                        <Check className="mt-0.5 size-4 shrink-0 text-neon" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </StaggerGroup>

        <Reveal delay={120}>
          <div className="mt-4 rounded-2xl border border-line bg-surface p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Công cụ quản lý đi kèm tài khoản đối tác
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.map((tool) => (
                <div key={tool.label} className="flex items-center gap-3 text-sm text-chalk">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-line bg-ink text-neon">
                    <tool.icon className="size-4" />
                  </span>
                  {tool.label}
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-line pt-5">
              <Link
                href="/partner/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-neon transition-all hover:gap-3"
              >
                Đăng ký tư vấn hợp tác <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
