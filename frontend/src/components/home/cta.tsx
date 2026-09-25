import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './reveal';

export function Cta() {
  return (
    <section className="pb-20 lg:pb-24">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-line">
            <Image
              src="/images/cta.jpg"
              alt=""
              fill
              aria-hidden
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-ink via-ink/92 to-ink/55"
              aria-hidden
            />

            <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
              <div>
                <h2 className="max-w-xl font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-chalk sm:text-5xl">
                  Start today.
                  <br />
                  <span className="text-neon">Get stronger</span> every week.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                  Đăng ký hội viên và nhận buổi đánh giá thể lực miễn phí cùng huấn luyện viên của
                  GymMaster.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/register">
                  <button className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-neon px-6 text-[15px] font-bold text-ink shadow-[0_0_28px_-10px_rgba(183,255,0,0.55)] transition-colors hover:bg-neon-hover active:translate-y-px">
                    Đăng ký ngay
                    <ArrowRight className="size-4" />
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-line bg-ink/60 px-6 text-[15px] font-semibold text-chalk backdrop-blur-sm transition-colors hover:border-neon/60 hover:text-neon active:translate-y-px">
                    Liên hệ tư vấn
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
