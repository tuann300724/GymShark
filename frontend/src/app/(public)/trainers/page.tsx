'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/home/reveal';
import { Star, Award, Briefcase, Quote, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PublicTrainersPage() {
  const [specialization, setSpecialization] = useState<string>('ALL');

  const { data: trainers, isLoading } = useQuery({
    queryKey: ['public-trainers'],
    queryFn: publicApi.getTrainers,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const specializations = ['ALL', ...Array.from(new Set((trainers || []).map((t) => t.specialization)))];
  const filtered = (trainers || []).filter(
    (t) => specialization === 'ALL' || t.specialization === specialization,
  );

  return (
    <div className="overflow-x-hidden">
      {/* ===== Page hero ===== */}
      <section className="border-b border-line">
        <div className="container-x py-14 lg:py-16">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
              Our Trainers
            </p>
            <h1 className="section-title mt-4">Đội ngũ huấn luyện viên</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              Gặp gỡ những chuyên gia sẽ đồng hành và truyền cảm hứng cho bạn tại GymMaster.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== Trainer cards ===== */}
      <section className="py-14 lg:py-16">
        <div className="container-x">
          {/* Specialization filter */}
          <Reveal>
            <div className="flex flex-wrap gap-2">
              {specializations.slice(0, 8).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpecialization(s)}
                  title={s}
                  className={`max-w-[260px] truncate rounded-[10px] border px-4 py-2 text-sm transition-colors ${
                    specialization === s
                      ? 'border-neon bg-neon font-bold text-ink'
                      : 'border-line text-muted hover:border-neon/40 hover:text-chalk'
                  }`}
                >
                  {s === 'ALL' ? 'Tất cả' : s}
                </button>
              ))}
            </div>
          </Reveal>

          {isLoading ? (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tr, i) => (
                <Reveal key={tr.id} delay={(i % 3) * 90}>
                  <div className="h-full rounded-2xl border border-line bg-surface p-7 transition-colors duration-300 hover:border-neon/40">
                    {/* Avatar tile */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-neon/30 bg-ink">
                        <span className="font-display text-2xl font-bold text-neon">
                          {tr.user?.fullName?.charAt(0) || 'H'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate font-display text-xl font-bold uppercase tracking-tight text-chalk">
                          {tr.user?.fullName}
                        </h2>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Star className="h-4 w-4 fill-neon text-neon" />
                          <span className="text-sm font-semibold text-chalk">{tr.rating}</span>
                          <span className="text-xs text-muted">/ 5.0</span>
                        </div>
                      </div>
                    </div>

                    <Badge className="mt-4" variant="success">
                      {tr.specialization}
                    </Badge>

                    <div className="mt-4 space-y-2.5 text-sm">
                      <p className="flex items-center gap-2 text-muted">
                        <Briefcase className="h-4 w-4 shrink-0 text-neon" />
                        {tr.experienceYears} năm kinh nghiệm
                      </p>
                      {tr.certification && (
                        <p className="flex items-start gap-2 text-muted">
                          <Award className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                          <span>{tr.certification}</span>
                        </p>
                      )}
                    </div>

                    {tr.bio && (
                      <p className="mt-4 flex gap-2 border-t border-line pt-4 text-sm leading-relaxed text-muted">
                        <Quote className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                        <span>{tr.bio}</span>
                      </p>
                    )}

                    {tr.hourlyRate && (
                      <p className="mt-4 border-t border-line pt-4 text-xs text-muted">
                        Giá PT:{' '}
                        <span className="font-display text-base font-bold text-neon">
                          {formatCurrency(tr.hourlyRate)}
                        </span>
                        /giờ
                      </p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="mt-8 rounded-2xl border border-line bg-surface py-16 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-muted opacity-50" />
              <p className="font-semibold text-chalk">Chưa có huấn luyện viên phù hợp.</p>
              <p className="mt-1.5 text-sm text-muted">Thử chọn một chuyên môn khác.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
