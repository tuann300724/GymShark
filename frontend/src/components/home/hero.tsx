'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { ArrowRight, FlaskConical, Headphones, TrendingUp, Users } from 'lucide-react';
import { Reveal } from './reveal';

const FEATURES = [
  {
    icon: FlaskConical,
    title: 'Scientific Training',
    desc: 'Lịch tập được thiết kế theo nguyên lý tiến tải và hồi phục.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    desc: 'Đội ngũ HLV hỗ trợ giải đáp và điều chỉnh bài tập mọi lúc.',
  },
  {
    icon: TrendingUp,
    title: 'Track Your Progress',
    desc: 'Theo dõi số buổi tập, chuỗi ngày và sức mạnh theo tuần.',
  },
];

export function Hero() {
  const { data: homeStats } = useQuery({
    queryKey: ['public-home-stats'],
    queryFn: publicApi.getHomeStats,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const memberCount = homeStats?.totalMembers?.toLocaleString('vi-VN') || '500+';

  return (
    <section className="relative">
      <div className="container-x grid items-center gap-10 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20 lg:pt-16">
        {/* ===== Left content ===== */}
        <div>
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-neon" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
                Nền tảng fitness cao cấp
              </span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-[clamp(3.25rem,9vw,6rem)] font-extrabold uppercase leading-[0.92] tracking-tight text-chalk">
              Build your
              <br />
              <span className="text-neon">strongest self</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Chương trình tập khoa học, huấn luyện viên chuyên nghiệp và công nghệ theo dõi tiến độ
              để bạn mạnh hơn sau mỗi buổi tập.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <button className="inline-flex h-12 items-center justify-center gap-2.5 rounded-sm bg-neon px-6 text-[15px] font-bold text-ink shadow-[0_0_28px_-10px_rgba(183,255,0,0.55)] transition-colors hover:bg-neon-hover active:translate-y-px">
                  Bắt đầu ngay
                  <ArrowRight className="size-4" />
                </button>
              </Link>
              <Link href="/schedule">
                <button className="inline-flex h-12 items-center justify-center gap-2.5 rounded-sm border border-line bg-transparent px-6 text-[15px] font-semibold text-chalk transition-colors hover:border-neon/60 hover:text-neon active:translate-y-px">
                  Xem chương trình
                </button>
              </Link>
            </div>
          </Reveal>
        </div>

        {/* ===== Right: hero visual ===== */}
        <Reveal delay={140} className="relative">
          <div className="relative aspect-[4/5] max-h-[560px] overflow-hidden rounded-2xl border border-line">
            <Image
              src="/images/hero.jpg"
              alt="Vận động viên tập battle rope trong không gian gym tối"
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover object-center"
            />
            {/* Dark cinematic overlays */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-ink/30"
              aria-hidden
            />
            <div
              className="absolute inset-y-0 left-0 hidden w-28 bg-gradient-to-r from-ink/70 to-transparent lg:block"
              aria-hidden
            />
          </div>

          {/* Floating stat card */}
          <div className="absolute bottom-5 left-4 flex items-center gap-3 rounded-xl border border-line bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-sm lg:-left-6">
            <span className="flex size-10 items-center justify-center rounded-sm border border-neon/25 bg-neon/10 text-neon">
              <Users size={18} />
            </span>
            <span>
              <span className="block font-display text-xl font-bold leading-none text-chalk">
                {memberCount}
              </span>
              <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted">
                Hội viên đang tập luyện
              </span>
            </span>
          </div>
        </Reveal>
      </div>

      {/* ===== Feature strip ===== */}
      <div className="container-x border-t border-line pb-10 pt-8">
        <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <div className="flex gap-3.5">
                <f.icon className="mt-0.5 size-5 shrink-0 text-neon" />
                <div>
                  <h3 className="text-sm font-bold text-chalk">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
