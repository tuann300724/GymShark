import React from 'react';
import { Hero } from '@/components/home/hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { GymTiers } from '@/components/home/gym-tiers';
import { PartnerProgram } from '@/components/home/partner-program';
import { Cta } from '@/components/home/cta';
import { Marquee } from '@/components/home/effects';

const MARQUEE = [
  'Một thẻ nhiều phòng',
  'Check-in khuôn mặt',
  'Standard · Plus · Premium',
  'Tìm phòng gần bạn',
  'Phòng tập được thẩm định',
  'Quản lý phòng gym trọn gói',
];

/** Trang chủ: giới thiệu mạng lưới phòng gym liên kết Gym Master (hội viên + chủ phòng gym) */
export default function PublicHomePage() {
  return (
    <div className="overflow-x-hidden">
      <Hero />
      <Marquee items={MARQUEE} />
      <HowItWorks />
      <GymTiers />
      <PartnerProgram />
      <Cta />
    </div>
  );
}
