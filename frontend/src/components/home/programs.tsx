import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Clock, Dumbbell } from 'lucide-react';
import { Reveal } from './reveal';
import { PROGRAMS } from '@/lib/programs';

export function Programs() {
  return (
    <section id="programs" className="scroll-mt-24 py-20 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="section-title">Training Programs</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Sáu buổi tập xoay vòng trong tuần, cân bằng nhóm cơ lớn và nhóm cơ nhỏ để bạn tiến bộ
              mà vẫn phục hồi đúng nhịp.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 90}>
              <Link
                href={`/programs/${p.slug}`}
                className="group block h-full overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-300 hover:border-neon/40"
              >
                <article className="flex h-full flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={p.img}
                      alt={p.alt}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-surface/70 via-transparent to-transparent"
                      aria-hidden
                    />
                    <span className="absolute left-3.5 top-3.5 rounded-md border border-line bg-ink/85 px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-chalk backdrop-blur-sm">
                      {p.day}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neon">
                      {p.group}
                    </p>
                    <div className="mt-1.5 flex items-start justify-between gap-3">
                      <h3 className="font-display text-2xl font-bold uppercase leading-tight tracking-tight text-chalk transition-colors group-hover:text-neon">
                        {p.name}
                      </h3>
                      <ArrowUpRight className="mt-1 size-5 shrink-0 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neon" />
                    </div>

                    <div className="mt-4 flex items-center gap-4 border-t border-line pt-4 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <Dumbbell className="size-3.5" />
                        {p.exercises.length} bài tập
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {p.duration} phút
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
