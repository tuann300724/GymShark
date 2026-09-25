import React from 'react';
import Image from 'next/image';
import { ArrowUpRight, Clock, Dumbbell } from 'lucide-react';
import { Reveal } from './reveal';

const PROGRAMS = [
  {
    day: 'Day 01',
    group: 'Chest + Triceps',
    name: 'Push Day',
    exercises: 4,
    duration: 60,
    img: '/images/program-push.jpg',
    alt: 'Bàn tay chọn tạ dumbbell trên giá tạ trong phòng gym tối',
  },
  {
    day: 'Day 02',
    group: 'Back + Biceps',
    name: 'Pull Day',
    exercises: 5,
    duration: 65,
    img: '/images/program-pull.jpg',
    alt: 'Vận động viên tập deadlift dưới ánh sáng spotlight trong phòng tối',
  },
  {
    day: 'Day 03',
    group: 'Shoulders',
    name: 'Shoulder Blast',
    exercises: 4,
    duration: 50,
    img: '/images/program-shoulders.jpg',
    alt: 'Vận động viên tập ép tạ qua đầu',
  },
  {
    day: 'Day 04',
    group: 'Legs + Abs',
    name: 'Leg Day',
    exercises: 5,
    duration: 70,
    img: '/images/program-legs-abs.jpg',
    alt: 'Vận động viên tập nâng tạ trong phòng tối',
  },
  {
    day: 'Day 05',
    group: 'Chest + Shoulders',
    name: 'Upper Power',
    exercises: 4,
    duration: 55,
    img: '/images/program-upper.jpg',
    alt: 'Hình bóng vận động viên chuẩn bị nâng tạ barbell trong ánh đèn pha',
  },
  {
    day: 'Day 06',
    group: 'Back + Arms',
    name: 'Back & Arms',
    exercises: 5,
    duration: 60,
    img: '/images/program-back-arms.jpg',
    alt: 'Vận động viên tập xà kép',
  },
];

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
            <Reveal key={p.name} delay={(i % 3) * 90}>
              <article className="group h-full overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-300 hover:border-neon/40">
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

                <div className="p-5">
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
                      {p.exercises} bài tập
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {p.duration} phút
                    </span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
