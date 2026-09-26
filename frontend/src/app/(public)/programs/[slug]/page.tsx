import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Dumbbell,
  Layers,
  Lightbulb,
  Repeat,
  Timer,
  Wrench,
} from 'lucide-react';
import { Reveal } from '@/components/home/reveal';
import { Button } from '@/components/ui/button';
import { PROGRAMS, getProgram, type ProgramExercise } from '@/lib/programs';

interface ProgramDetailProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProgramDetailProps): Promise<Metadata> {
  const program = getProgram(params.slug);
  if (!program) {
    return { title: 'Không tìm thấy chương trình tập | GymMaster Pro' };
  }
  return {
    title: `${program.name} · ${program.day} | GymMaster Pro`,
    description: program.summary,
  };
}

function MetaChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-ink px-2.5 py-1.5 text-xs text-muted">
      <span className="text-neon/80">{icon}</span>
      {children}
    </span>
  );
}

function ExerciseItem({ ex, index }: { ex: ProgramExercise; index: number }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors duration-300 hover:border-neon/40 lg:gap-5 lg:p-6">
      <span className="w-8 shrink-0 font-display text-3xl font-extrabold leading-none tabular-nums text-neon/60">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-display text-xl font-bold uppercase leading-tight tracking-tight text-chalk">
            {ex.name}
          </h3>
          <span className="text-xs uppercase tracking-[0.14em] text-muted">{ex.en}</span>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2">
          <MetaChip icon={<Repeat className="size-3.5" />}>
            {ex.sets} hiệp × {ex.reps}
          </MetaChip>
          <MetaChip icon={<Timer className="size-3.5" />}>Nghỉ {ex.rest}</MetaChip>
          <MetaChip icon={<Wrench className="size-3.5" />}>{ex.equipment}</MetaChip>
        </div>

        {ex.tip && (
          <p className="mt-3.5 flex items-start gap-2 text-sm leading-relaxed text-muted">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-neon/70" />
            {ex.tip}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProgramDetailPage({ params }: ProgramDetailProps) {
  const program = getProgram(params.slug);
  if (!program) notFound();

  const currentIndex = PROGRAMS.findIndex((p) => p.slug === program.slug);
  const next = PROGRAMS[(currentIndex + 1) % PROGRAMS.length];

  return (
    <div className="overflow-x-hidden">
      {/* ===== Page hero ===== */}
      <section className="border-b border-line">
        <div className="container-x py-10 lg:py-14">
          <Reveal>
            <Link
              href="/#programs"
              className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-neon"
            >
              <ArrowLeft className="size-4" />
              Quay lại danh sách chương trình
            </Link>

            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
              {program.day} · {program.group}
            </p>
            <h1 className="section-title mt-3">{program.name}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{program.summary}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Dumbbell className="size-4 text-neon/80" />
                {program.exercises.length} bài tập
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-neon/80" />
                {program.duration} phút
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="size-4 text-neon/80" />
                {program.group}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Ảnh đại diện ===== */}
      <section className="container-x pt-10 lg:pt-14">
        <Reveal className="overflow-hidden rounded-2xl border border-line">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={program.img}
              alt={program.alt}
              fill
              sizes="(min-width: 1280px) 1152px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </Reveal>
      </section>

      {/* ===== Danh sách bài tập ===== */}
      <section className="py-10 lg:py-14">
        <div className="container-x">
          <Reveal>
            <h2 className="section-title">Danh sách bài tập</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              Làm theo đúng thứ tự: bài compound nặng nhất mở đầu, bài cô lập giữ lại cuối buổi. Nếu
              chưa chắc kỹ thuật, giảm tải khoảng 20% cho tới khi động tác sạch.
            </p>
          </Reveal>

          <ol className="mt-8 list-none space-y-4">
            {program.exercises.map((ex, i) => (
              <li key={ex.name}>
                <Reveal delay={(i % 2) * 80}>
                  <ExerciseItem ex={ex} index={i} />
                </Reveal>
              </li>
            ))}
          </ol>

          {/* ===== Buổi tập tiếp theo ===== */}
          <Reveal>
            <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neon">
                  Buổi tập tiếp theo
                </p>
                <p className="mt-1.5 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                  {next.day} · {next.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {next.group} · {next.exercises.length} bài tập · {next.duration} phút
                </p>
              </div>
              <Link href={`/programs/${next.slug}`}>
                <Button className="h-11 w-full font-bold sm:w-auto">
                  Xem chương trình tiếp theo
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
