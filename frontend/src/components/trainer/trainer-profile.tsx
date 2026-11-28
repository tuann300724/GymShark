'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Briefcase,
  CalendarDays,
  Check,
  Crosshair,
  Loader2,
  MapPin,
  MessageSquare,
  Star,
  Users,
} from 'lucide-react';
import { publicApi } from '@/services/package.service';
import { getStoredUser } from '@/lib/auth';
import { TrainerReviews } from '@/components/trainer/trainer-reviews';
import { Reveal } from '@/components/home/reveal';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { distanceKm, formatKm, useDeviceLocation } from '@/lib/geo';
import { getTrainerFocusTags, getTrainerImage } from '@/lib/trainer-visuals';

interface TrainerProfileProps {
  id: string;
}

function ProfileSkeleton() {
  return (
    <div className="container-x py-10 lg:py-14">
      <Skeleton className="h-5 w-36" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-16 w-full max-w-lg" />
          <Skeleton className="mt-4 h-6 w-2/3" />
          <Skeleton className="mt-6 h-20 w-full max-w-xl" />
          <Skeleton className="mt-7 h-10 w-40" />
        </div>
        <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface p-5 lg:p-6">
      <div className="flex items-center gap-2 text-muted">
        <span className={accent ? 'text-neon' : ''}>{icon}</span>
        <span className="meta-label">{label}</span>
      </div>
      <p
        className={`mt-3 font-display text-3xl font-extrabold leading-none tabular-nums lg:text-4xl ${
          accent ? 'text-neon' : 'text-chalk'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

const ctaClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-sm px-4 text-sm font-semibold transition-colors duration-200';

export function TrainerProfile({ id }: TrainerProfileProps) {
  const {
    data: trainer,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['public-trainer', id],
    queryFn: () => publicApi.getTrainer(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: others } = useQuery({
    queryKey: ['public-trainers'],
    queryFn: publicApi.getTrainers,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Chỉ MEMBER đã đăng nhập mới nhắn được HLV; khách vào trang login rồi quay lại.
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  useEffect(() => {
    setViewerRole(getStoredUser()?.role ?? null);
  }, []);

  if (isLoading) return <ProfileSkeleton />;

  const status = (error as { response?: { status?: number } } | null)?.response?.status;

  if (isError || !trainer) {
    if (status === 404) {
      return (
        <div className="container-x py-16 lg:py-24">
          <EmptyState
            icon={Users}
            title="Không tìm thấy hồ sơ huấn luyện viên"
            description="HLV này có thể đã ngừng hoạt động. Quay lại danh sách để chọn một huấn luyện viên khác."
            action={
              <Link
                href="/trainers"
                className={`${ctaClass} bg-neon font-bold text-ink hover:bg-neon-hover`}
              >
                Về danh sách HLV
              </Link>
            }
          />
        </div>
      );
    }
    return (
      <div className="container-x py-16 lg:py-24">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const name = trainer.user?.fullName ?? 'Huấn luyện viên';
  const shortName = name.replace(/^HLV\s*/, '');
  const tags = getTrainerFocusTags(trainer.specialization);
  const visual = getTrainerImage(trainer);
  const related = (others ?? []).filter((item) => item.id !== trainer.id).slice(0, 3);
  const chatPath = `/member/messages?trainer=${encodeURIComponent(trainer.id)}`;
  const canChat = viewerRole === null || viewerRole === 'MEMBER';
  const chatHref = viewerRole === null ? `/login?next=${encodeURIComponent(chatPath)}` : chatPath;

  return (
    <div className="overflow-x-hidden">
      {/* ===== Hero ===== */}
      <section className="border-b border-line">
        <div className="container-x py-10 lg:py-14">
          <Link
            href="/trainers"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-neon"
          >
            <ArrowLeft className="size-4" />
            Danh sách huấn luyện viên
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
            <Reveal>
              <p className="meta-label !text-neon">Hồ sơ huấn luyện viên</p>
              <h1 className="mt-4 font-display text-[clamp(2.75rem,6vw,5rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-chalk">
                {name}
              </h1>
              <p className="mt-4 font-display text-xl font-bold uppercase tracking-tight text-neon lg:text-2xl">
                {trainer.specialization}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {trainer.bio && (
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">{trainer.bio}</p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {canChat ? (
                  <Link
                    href={chatHref}
                    className={`${ctaClass} bg-neon font-bold text-ink hover:bg-neon-hover`}
                  >
                    {viewerRole === null ? 'Đăng nhập để nhắn tin' : 'Nhắn tin HLV'}
                    <MessageSquare className="size-4" />
                  </Link>
                ) : (
                  <Link
                    href="/packages"
                    className={`${ctaClass} bg-neon font-bold text-ink hover:bg-neon-hover`}
                  >
                    Xem gói tập
                    <ArrowUpRight className="size-4" />
                  </Link>
                )}
                <Link
                  href="/packages"
                  className={`${ctaClass} border border-line bg-surface text-chalk hover:border-neon/60 hover:text-neon`}
                >
                  {canChat ? 'Xem gói tập' : 'Lịch lớp học'}
                </Link>
                {canChat && (
                  <Link
                    href="/schedule"
                    className={`${ctaClass} border border-line bg-surface text-chalk hover:border-neon/60 hover:text-neon`}
                  >
                    Lịch lớp học
                  </Link>
                )}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                <Image
                  src={visual.src}
                  alt={visual.alt}
                  unoptimized={visual.unoptimized}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="meta-label !text-chalk">Đánh giá</p>
                    <p className="mt-1 font-display text-4xl font-extrabold leading-none text-neon">
                      {trainer.rating.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="meta-label !text-chalk">Kinh nghiệm</p>
                    <p className="mt-1 font-display text-4xl font-extrabold leading-none text-chalk">
                      {trainer.experienceYears} năm
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== Numbers ===== */}
      <section className="container-x py-10 lg:py-12">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          <StatTile
            label="Kinh nghiệm"
            value={`${trainer.experienceYears} năm`}
            icon={<Briefcase className="size-4" />}
            accent
          />
          <StatTile
            label="Đánh giá"
            value={`${trainer.rating.toFixed(1)} / 5`}
            icon={<Star className="size-4 fill-current" />}
            accent
          />
          <StatTile
            label="Học viên hiện tại"
            value={String(trainer.stats.activeMembers)}
            icon={<Users className="size-4" />}
          />
          <StatTile
            label="Lớp sắp tới"
            value={String(trainer.stats.upcomingSessions)}
            icon={<CalendarDays className="size-4" />}
          />
        </div>
      </section>

      {/* ===== Body ===== */}
      <section className="container-x grid gap-6 pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <Reveal>
          <div className="h-full rounded-2xl border border-line bg-surface p-6 lg:p-8">
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk lg:text-3xl">
              Triết lý huấn luyện
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              {trainer.bio ??
                `${name} tập trung vào kỹ thuật nền tảng, lộ trình rõ ràng và sự đồng hành dài hạn cùng từng hội viên.`}
            </p>

            <div className="mt-8 border-t border-line pt-6">
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-chalk">
                Trọng tâm huấn luyện
              </h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="flex items-start gap-3 rounded-xl border border-line bg-ink p-4 text-sm text-muted"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-neon" />
                    <span>{tag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={80}>
            <div className="rounded-2xl border border-line bg-surface p-6 lg:p-8">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                Chứng nhận & thông tin
              </h2>
              {trainer.certification && (
                <p className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-muted">
                  <Award className="mt-0.5 size-4 shrink-0 text-neon" />
                  {trainer.certification}
                </p>
              )}
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6 text-sm">
                <div>
                  <dt className="meta-label">Phí kèm riêng</dt>
                  <dd className="mt-1.5 font-display text-lg font-bold text-neon">
                    {trainer.hourlyRate ? formatCurrency(trainer.hourlyRate) : 'Liên hệ'}
                    {trainer.hourlyRate && (
                      <span className="ml-1 font-sans text-xs font-medium text-muted">/ buổi</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="meta-label">Trạng thái</dt>
                  <dd className="mt-1.5 font-semibold text-chalk">Đang nhận học viên</dd>
                </div>
              </dl>
              <TrainerWorkArea
                address={trainer.workAddress}
                lat={trainer.workLatitude}
                lng={trainer.workLongitude}
              />
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="rounded-2xl border border-neon/30 bg-surface p-6 lg:p-8">
              <p className="meta-label !text-neon">Bắt đầu ngay</p>
              <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                Tập cùng {shortName}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Nhắn tin trực tiếp để thỏa thuận lịch và phí tập theo buổi với HLV {shortName}. Cần
                có tài khoản hội viên để gửi tin nhắn.
              </p>
              {canChat ? (
                <Link
                  href={chatHref}
                  className={`${ctaClass} mt-6 w-full bg-neon font-bold text-ink hover:bg-neon-hover`}
                >
                  {viewerRole === null ? 'Đăng nhập để nhắn tin' : `Nhắn tin ${shortName}`}
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                <Link
                  href="/packages"
                  className={`${ctaClass} mt-6 w-full bg-neon font-bold text-ink hover:bg-neon-hover`}
                >
                  Xem gói tập
                  <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Reviews ===== */}
      <TrainerReviews trainerId={trainer.id} />

      {/* ===== Other trainers ===== */}
      {related.length > 0 && (
        <section className="border-t border-line py-14 lg:py-16">
          <div className="container-x">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk lg:text-3xl">
                Huấn luyện viên khác
              </h2>
              <Link
                href="/trainers"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-neon"
              >
                Xem tất cả
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => {
                const itemVisual = getTrainerImage(item);
                return (
                  <Link
                    key={item.id}
                    href={`/trainers/${item.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-3 transition-colors duration-300 hover:border-neon/40"
                  >
                    <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-ink">
                      <Image
                        src={itemVisual.src}
                        alt={itemVisual.alt}
                        unoptimized={itemVisual.unoptimized}
                        fill
                        sizes="80px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-bold uppercase tracking-tight text-chalk">
                        {item.user?.fullName}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                        {item.specialization}
                      </p>
                    </div>
                    <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted transition-colors group-hover:text-neon" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/** Khu vực dạy của PT + khoảng cách từ vị trí người xem (toạ độ công khai đã làm tròn ~1 km) */
function TrainerWorkArea({
  address,
  lat,
  lng,
}: {
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}) {
  const { origin, locating, error, locate } = useDeviceLocation();
  const hasPin = lat != null && lng != null;
  const km = origin && hasPin ? distanceKm(origin.lat, origin.lng, lat, lng) : null;

  return (
    <div className="mt-6 border-t border-line pt-6 text-sm">
      <p className="meta-label">Khu vực dạy</p>
      <p className="mt-1.5 flex items-start gap-2 text-chalk">
        <MapPin className="mt-0.5 size-4 shrink-0 text-neon" />
        {address || 'PT chưa cập nhật khu vực dạy.'}
      </p>
      {hasPin && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {km != null ? (
            <span className="font-display text-lg font-bold text-neon">
              Cách bạn ~{formatKm(km)}
            </span>
          ) : (
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-sm border border-line px-3 py-1.5 text-xs font-semibold text-chalk transition-colors hover:border-neon/50"
            >
              {locating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Crosshair className="size-3.5 text-neon" />
              )}
              Xem khoảng cách tới tôi
            </button>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-muted underline-offset-2 hover:text-neon hover:underline"
          >
            Xem trên bản đồ
          </a>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
