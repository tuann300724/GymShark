'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  Layers,
  MapPin,
  MousePointer2,
  ScanFace,
  Users,
} from 'lucide-react';
import { publicApi } from '@/services/package.service';
import { Reveal } from './reveal';
import { VietnamMap3D } from './vietnam-map-3d';
import { CountUp } from './effects';
import { StaggerGroup, StaggerItem } from '@/components/ui/motion';

const FEATURES = [
  {
    icon: Layers,
    title: 'Một thẻ — nhiều phòng tập',
    desc: 'Mua gói theo hạng, tập ở bất kỳ phòng đối tác nào cùng hạng hoặc thấp hơn trong mạng lưới.',
  },
  {
    icon: ScanFace,
    title: 'Check-in bằng khuôn mặt',
    desc: 'Đến phòng nào cũng chỉ cần quét mặt tại quầy — không thẻ cứng, không mã QR.',
  },
  {
    icon: Building2,
    title: 'Phòng tập được thẩm định',
    desc: 'Mỗi phòng đối tác được Gym Master đánh giá cơ sở vật chất và xếp hạng Standard / Plus / Premium.',
  },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { data: homeStats } = useQuery({
    queryKey: ['public-home-stats'],
    queryFn: publicApi.getHomeStats,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ['public-branches'],
    queryFn: publicApi.getBranches,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const pinned = branches
    .filter((b) => b.latitude != null && b.longitude != null)
    .map((b) => ({
      name: b.name,
      latitude: b.latitude!,
      longitude: b.longitude!,
      // "…, Phường X, Thành phố Biên Hòa, Tỉnh Đồng Nai" → "Biên Hòa"
      area:
        (b.address ?? '')
          .split(',')
          .slice(-2, -1)[0]
          ?.trim()
          .replace(/^(thành phố|tp\.?|quận|huyện|thị xã)\s+/i, '') || null,
    }));

  // Ánh sáng mờ bám theo chuột (CSS variables, không re-render)
  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const el = sectionRef.current;
    if (!el || event.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  return (
    <section ref={sectionRef} onPointerMove={onPointerMove} className="relative">
      <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />
      <div className="container-x relative grid items-center gap-10 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20 lg:pt-16">
        {/* ===== Nội dung ===== */}
        <div>
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full rounded-full bg-neon opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-neon" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
                Mạng lưới phòng gym liên kết
              </span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            {/* leading > 1 để dấu tiếng Việt (Ộ, Ả, Ớ…) không đè lên dòng trên/dưới */}
            <h1 className="mt-6 font-display text-[clamp(3rem,8vw,5.5rem)] font-extrabold uppercase leading-[1.04] tracking-tight text-chalk">
              Một thẻ tập.
              <br />
              <span className="text-neon">Cả mạng lưới.</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Gym Master kết nối các phòng gym đối tác thành một mạng lưới chung: hội viên mua một
              gói, tập ở nhiều phòng gần nhà, gần chỗ làm; chủ phòng gym có sẵn công cụ quản lý hội
              viên, gói tập, check-in và doanh thu.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/packages"
                className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-sm bg-neon px-6 text-[15px] font-bold text-ink shadow-[0_0_28px_-10px_rgba(183,255,0,0.55)] transition-all hover:bg-neon-hover hover:shadow-[0_0_36px_-8px_rgba(183,255,0,0.7)] active:translate-y-px"
              >
                <MapPin className="size-4 transition-transform group-hover:-translate-y-0.5" />
                Tìm phòng tập gần bạn
              </Link>
              <Link
                href="/partner/register"
                className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-sm border border-line bg-transparent px-6 text-[15px] font-semibold text-chalk transition-colors hover:border-neon/60 hover:text-neon active:translate-y-px"
              >
                Đưa phòng gym vào mạng lưới
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <dl className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-line border-y border-line">
              {[
                { label: 'Phòng đối tác', value: homeStats?.totalPartners ?? 0 },
                { label: 'Cơ sở đang mở', value: homeStats?.totalBranches ?? 0 },
                { label: 'Hội viên', value: homeStats?.totalMembers ?? 0 },
              ].map((s) => (
                <div key={s.label} className="p-4 first:pl-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {s.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-3xl font-bold leading-none text-chalk">
                    <CountUp value={s.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* ===== Bản đồ Việt Nam 3D — vị trí cơ sở trong mạng lưới ===== */}
        <Reveal delay={140} className="relative">
          <div className="relative aspect-square max-h-[580px] overflow-hidden rounded-2xl border border-line bg-ink">
            <VietnamMap3D
              branches={pinned}
              className="absolute inset-0 size-full cursor-grab active:cursor-grabbing"
            />
            <span className="pointer-events-none absolute bottom-4 right-4 hidden items-center gap-1.5 text-[11px] text-muted sm:flex">
              <MousePointer2 className="size-3.5" /> Kéo để xoay
            </span>
          </div>

          {/* Thẻ nổi: số cơ sở */}
          <div className="absolute -bottom-4 left-4 flex items-center gap-3 rounded-xl border border-line bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-sm lg:-left-6">
            <span className="flex size-10 items-center justify-center rounded-sm border border-neon/25 bg-neon/10 text-neon">
              <Building2 size={18} />
            </span>
            <span>
              <span className="block font-display text-xl font-bold leading-none text-chalk">
                {branches.length ? (
                  <>
                    <CountUp value={branches.length} /> cơ sở
                  </>
                ) : (
                  'Đang mở rộng'
                )}
              </span>
              <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted">
                Trong mạng lưới Gym Master
              </span>
            </span>
          </div>
          {(homeStats?.totalCheckIns ?? 0) > 0 && (
            <div className="absolute right-4 top-4 hidden items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-[11px] font-semibold text-chalk backdrop-blur-sm sm:flex">
              <Users className="size-3.5 text-neon" />
              <CountUp value={homeStats?.totalCheckIns ?? 0} /> lượt check-in
            </div>
          )}
        </Reveal>
      </div>

      {/* ===== Dải giá trị cốt lõi ===== */}
      <div className="container-x relative border-t border-line pb-10 pt-8">
        <StaggerGroup className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title}>
              <div className="flex gap-3.5">
                <f.icon className="mt-0.5 size-5 shrink-0 text-neon" />
                <div>
                  <h3 className="text-sm font-bold text-chalk">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{f.desc}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
