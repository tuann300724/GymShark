import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './reveal';

export function FeaturedArticle() {
  return (
    <section className="scroll-mt-24 py-20 lg:py-24">
      <div className="container-x">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image */}
          <Reveal>
            <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-line">
              <Image
                src="/images/article.jpg"
                alt="Vận động viên với ánh sáng tối cinematic trong phòng gym"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent"
                aria-hidden
              />
              <span className="absolute left-4 top-4 rounded-md border border-line bg-ink/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neon backdrop-blur-sm">
                Featured
              </span>
            </div>
          </Reveal>

          {/* Content */}
          <Reveal delay={120}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
                Dinh dưỡng
              </p>
              <h2 className="mt-4 font-display text-3xl font-bold uppercase leading-[1.05] tracking-tight text-chalk sm:text-4xl">
                Nạp năng lượng đúng lúc, phục hồi nhanh hơn
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                Thời điểm nạp carbohydrate và protein quyết định phần lớn hiệu quả phục hồi
                sau buổi tập. Những nguyên tắc đơn giản bạn có thể áp dụng ngay tuần này.
              </p>
              <div className="mt-5 flex items-center gap-3 text-xs text-muted">
                <span>12/09/2026</span>
                <span className="h-1 w-1 rounded-full bg-line" aria-hidden />
                <span>5 phút đọc</span>
              </div>
              <Link
                href="/blog"
                className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-chalk transition-colors hover:text-neon"
              >
                Đọc thêm
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
