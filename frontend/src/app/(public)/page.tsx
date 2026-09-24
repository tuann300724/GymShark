'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Flame,
  Dumbbell,
  Award,
  Building2,
  CalendarDays,
  HeartPulse,
  Zap,
  Timer,
  Users,
  Shirt,
  Droplets,
  Check,
  ArrowRight,
  Star,
  Play,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const WHY_US = [
  {
    icon: Dumbbell,
    title: 'Trang thiết bị hiện đại',
    desc: 'Hệ thống máy tập nhập khẩu mới nhất, đầy đủ khu cardio, máy tập khối và tạ tự do.',
  },
  {
    icon: Award,
    title: 'Huấn luyện viên chuyên nghiệp',
    desc: 'Đội ngũ HLV có chứng chỉ quốc tế, giàu kinh nghiệm, luôn đồng hành và truyền động lực.',
  },
  {
    icon: Building2,
    title: 'Không gian tập luyện',
    desc: 'Không gian thoáng đãng, vệ sinh sạch sẽ, hệ thống xông hơi - phòng thay đồ tiện nghi.',
  },
  {
    icon: CalendarDays,
    title: 'Lịch tập linh hoạt',
    desc: 'Mở cửa từ 5:00 - 22:00 hàng ngày, hàng chục lớp học mỗi tuần để bạn chủ động sắp xếp.',
  },
];

const GYM_FEATURES = [
  { icon: HeartPulse, name: 'Cardio' },
  { icon: Dumbbell, name: 'Weight Training' },
  { icon: Users, name: 'Personal Training' },
  { icon: Zap, name: 'Group Classes' },
  { icon: Shirt, name: 'Locker' },
  { icon: Droplets, name: 'Shower' },
];

export default function PublicHomePage() {
  const { data: packages, isLoading: pkgLoading } = useQuery({
    queryKey: ['public-packages'],
    queryFn: publicApi.getPackages,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: trainers, isLoading: trLoading } = useQuery({
    queryKey: ['public-trainers'],
    queryFn: publicApi.getTrainers,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: homeStats } = useQuery({
    queryKey: ['public-home-stats'],
    queryFn: publicApi.getHomeStats,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const featuredPackages = packages?.slice(0, 3) || [];
  const featuredTrainers = trainers?.slice(0, 4) || [];

  return (
    <div className="overflow-x-hidden">
      {/* ======================= HERO ======================= */}
      <section className="relative min-h-[88vh] flex items-center bg-slate-950 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/60" />
          <div className="absolute top-20 -left-32 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 -right-24 w-[420px] h-[420px] bg-teal-600/15 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="animate-slide-up">
            <Badge className="mb-5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
              <Zap className="w-3.5 h-3.5 mr-1" />
              {' '}
              Phòng gym hiện đại bậc nhất tại Đồng Nai
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              KHỎE HƠN MỖI NGÀY
              <br />
              CÙNG{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                GYM MASTER
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl">
              Biến mục tiêu của bạn thành hiện thực với trang thiết bị tối tân, đội ngũ huấn luyện viên
              chuyên nghiệp và cộng đồng tập luyện đầy cảm hứng.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" className="shadow-xl shadow-emerald-600/30">
                  Đăng ký ngay
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/packages">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-700 text-white hover:bg-slate-800/60 hover:border-emerald-500/50"
                >
                  <Play className="w-4 h-4" />
                  Xem gói tập
                </Button>
              </Link>
            </div>

            {/* Stats strip */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {homeStats?.totalMembers?.toLocaleString('vi-VN') || '500+'}
                </p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Hội viên</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {homeStats?.totalTrainers?.toLocaleString('vi-VN') || '20+'}
                </p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">HLV chuyên nghiệp</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {homeStats?.totalBranches?.toLocaleString('vi-VN') || '1'}
                </p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Chi nhánh</p>
              </div>
            </div>
          </div>

          {/* Right: hero visual */}
          <div className="hidden lg:block relative">
            <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/40">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-white">GYM MASTER</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Smart Fitness</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Đang mở cửa</Badge>
              </div>

              {/* Fake "membership card" visual */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest opacity-80 font-bold">Premium Membership</p>
                  <Dumbbell className="w-5 h-5 opacity-80" />
                </div>
                <p className="mt-6 font-mono text-xl tracking-widest">MEM-0001</p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-80">Ngày hết hạn</p>
                    <p className="font-bold">01/10/2026</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest opacity-80">Trạng thái</p>
                    <p className="font-bold text-emerald-200">Active</p>
                  </div>
                </div>
              </div>

              {/* Floating stat chips */}
              <div className="absolute -top-5 -right-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">-20% hội viên mới</p>
                    <p className="text-[10px] text-slate-500">Khuyến mãi tháng này</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= WHY CHOOSE US ======================= */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2">
              Why Choose Us
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Vì sao chọn GymMaster?
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Chúng tôi mang đến trải nghiệm tập luyện đẳng cấp với sự khác biệt tạo nên từng chi tiết.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= PACKAGES ======================= */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2">
              Membership Packages
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Gói tập phù hợp cho bạn
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Chọn gói tập linh hoạt theo nhu cầu - linh hoạt, minh bạch, không phí ẩn.
            </p>
          </div>

          {pkgLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPackages.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  className={`relative p-7 rounded-2xl border transition-all flex flex-col ${
                    idx === 1
                      ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-500/10 to-transparent dark:from-emerald-500/10 shadow-xl shadow-emerald-500/10 md:-translate-y-3'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40'
                  }`}
                >
                  {idx === 1 && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white border-0 shadow-lg">
                      Phổ biến nhất
                    </Badge>
                  )}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{pkg.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(pkg.price)}
                    </span>
                    <span className="text-xs text-slate-500">/{pkg.durationDays} ngày</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {pkg.description}
                  </p>
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {(pkg.features?.items || []).slice(0, 4).map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex gap-2">
                    <Link href="/packages" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Xem chi tiết
                      </Button>
                    </Link>
                    <Link href="/register" className="flex-1">
                      <Button size="sm" className="w-full">
                        Đăng ký ngay
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ======================= TRAINERS ======================= */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2">
              Our Trainers
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Đội ngũ huấn luyện viên
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Được dẫn dắt bởi những HLV có chứng chỉ quốc tế và nhiều năm kinh nghiệm.
            </p>
          </div>

          {trLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredTrainers.map((tr) => (
                <div
                  key={tr.id}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center hover:border-emerald-500/40 transition-all"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-500/20">
                    {tr.user?.fullName?.charAt(0) || 'H'}
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{tr.user?.fullName}</h3>
                  <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {tr.specialization}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      {tr.rating}
                    </span>
                    <span>•</span>
                    <span>{tr.experienceYears} năm kinh nghiệm</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ======================= GYM FEATURES ======================= */}
      <section className="py-20 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2">Gym Facilities</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Tiện nghi đẳng cấp tại GymMaster
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {GYM_FEATURES.map((f) => (
              <div
                key={f.name}
                className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 hover:bg-slate-900 transition-all text-center"
              >
                <f.icon className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="mt-3 text-sm font-semibold text-slate-200">{f.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= CTA ======================= */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 p-10 sm:p-14 text-center text-white overflow-hidden shadow-2xl shadow-emerald-600/30">
            <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <h2 className="relative text-3xl sm:text-4xl font-black tracking-tight">
              Ready to start your fitness journey?
            </h2>
            <p className="relative mt-4 text-emerald-50/90 max-w-xl mx-auto">
              Hôm nay chính là ngày tốt nhất để bắt đầu. Đăng ký ngay để nhận ưu đãi đặc biệt cho hội viên mới.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl"
                >
                  Đăng ký ngay
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}