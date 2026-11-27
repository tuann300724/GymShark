'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Reveal } from '@/components/home/reveal';
import { ArrowUpRight, Award, Briefcase, Star, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getTrainerFocusTags, getTrainerImage } from '@/lib/trainer-visuals';

const ALL = 'ALL';

export default function PublicTrainersPage() {
  const [focus, setFocus] = useState<string>(ALL);

  const {
    data: trainers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['public-trainers'],
    queryFn: publicApi.getTrainers,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const focusOptions = useMemo(
    () =>
      [
        ALL,
        ...Array.from(
          new Set(
            (trainers ?? []).flatMap((trainer) => getTrainerFocusTags(trainer.specialization)),
          ),
        ),
      ].slice(0, 8),
    [trainers],
  );

  const filtered = useMemo(
    () =>
      (trainers ?? []).filter(
        (trainer) => focus === ALL || getTrainerFocusTags(trainer.specialization).includes(focus),
      ),
    [trainers, focus],
  );

  const specialtyCount = useMemo(
    () => new Set((trainers ?? []).flatMap((t) => getTrainerFocusTags(t.specialization))).size,
    [trainers],
  );

  return (
    <div className="overflow-x-hidden">
      {/* ===== Page hero ===== */}
      <section className="border-b border-line">
        <div className="container-x grid gap-10 py-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:py-20">
          <Reveal>
            <p className="meta-label !text-neon">Our Trainers</p>
            <h1 className="section-title mt-4">Đội ngũ huấn luyện viên</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              Mỗi HLV là một chuyên gia trong lĩnh vực riêng. Tìm người phù hợp với mục tiêu của bạn
              và bắt đầu hành trình tập luyện đúng cách.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              <div className="bg-surface p-5 lg:p-6">
                <p className="meta-label">Huấn luyện viên</p>
                <p className="mt-2 font-display text-4xl font-extrabold leading-none tabular-nums text-neon lg:text-5xl">
                  {trainers?.length ?? '—'}
                </p>
                <p className="mt-2 text-xs text-muted">Đang hoạt động</p>
              </div>
              <div className="bg-surface p-5 lg:p-6">
                <p className="meta-label">Chuyên môn</p>
                <p className="mt-2 font-display text-4xl font-extrabold leading-none tabular-nums text-chalk lg:text-5xl">
                  {specialtyCount || '—'}
                </p>
                <p className="mt-2 text-xs text-muted">Lĩnh vực huấn luyện</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Trainer directory ===== */}
      <section className="py-14 lg:py-20">
        <div className="container-x">
          <Reveal>
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Lọc theo chuyên môn"
            >
              {focusOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFocus(option)}
                  aria-pressed={focus === option}
                  className={`max-w-[240px] truncate rounded-sm border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    focus === option
                      ? 'border-neon bg-neon font-bold text-ink'
                      : 'border-line bg-surface text-muted hover:border-neon/40 hover:text-chalk'
                  }`}
                >
                  {option === ALL ? 'Tất cả' : option}
                </button>
              ))}
            </div>
          </Reveal>

          {isLoading ? (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[430px] rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState className="mt-10" onRetry={() => refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState
              className="mt-10"
              icon={Users}
              title="Chưa có huấn luyện viên phù hợp"
              description="Thử chọn một chuyên môn khác."
            />
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((trainer, index) => {
                const visual = getTrainerImage(trainer);
                const tags = getTrainerFocusTags(trainer.specialization);
                const name = trainer.user?.fullName ?? 'Huấn luyện viên';

                return (
                  <Reveal key={trainer.id} delay={Math.min(index, 5) * 60}>
                    <Link
                      href={`/trainers/${trainer.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-neon/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                        <Image
                          src={visual.src}
                          alt={visual.alt}
                          unoptimized={visual.unoptimized}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                        <span className="absolute left-4 top-4 rounded-md border border-neon/40 bg-ink/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neon backdrop-blur-sm">
                          {tags[0] ?? 'Huấn luyện'}
                        </span>
                        <div className="absolute inset-x-4 bottom-4">
                          <h2 className="font-display text-2xl font-bold uppercase leading-tight tracking-tight text-chalk lg:text-3xl">
                            {name}
                          </h2>
                          <p className="mt-1 line-clamp-1 text-xs text-chalk/70">
                            {trainer.specialization}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-chalk">
                            <Star className="size-4 fill-neon text-neon" />
                            {trainer.rating.toFixed(1)}
                            <span className="font-normal text-muted">/ 5.0</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 border-l border-line pl-4">
                            <Briefcase className="size-4 text-neon" />
                            {trainer.experienceYears} năm kinh nghiệm
                          </span>
                        </div>

                        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted">
                          {trainer.bio ??
                            trainer.certification ??
                            'Huấn luyện viên chính thức của GymMaster.'}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md border border-line bg-ink px-2 py-1 text-[11px] text-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
                          <div className="min-w-0">
                            <p className="meta-label">Phí kèm riêng</p>
                            <p className="mt-1 font-display text-lg font-bold leading-none text-neon">
                              {trainer.hourlyRate ? formatCurrency(trainer.hourlyRate) : 'Liên hệ'}
                              {trainer.hourlyRate && (
                                <span className="ml-1 font-sans text-xs font-normal text-muted">
                                  /buổi
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-chalk transition-colors duration-200 group-hover:text-neon">
                            Xem hồ sơ
                            <ArrowUpRight className="size-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          )}

          {!isLoading && !isError && trainers?.length ? (
            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
              <Award className="size-4 text-neon" />
              Tất cả HLV đều có chứng chỉ hành nghề và lộ trình tập được cá nhân hóa.
            </p>
          ) : null}

          <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-display text-2xl font-extrabold uppercase text-chalk">
                Bạn là PT? <span className="text-neon">Tham gia GymMaster</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                Đăng ký miễn phí, được thẩm định hồ sơ và nhận học viên online trên toàn mạng lưới.
              </p>
            </div>
            <Link
              href="/trainers/register"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-neon px-5 text-sm font-bold text-ink transition-colors hover:bg-neon-hover"
            >
              Đăng ký làm PT <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
