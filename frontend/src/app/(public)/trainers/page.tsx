'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Award, Briefcase, Quote } from 'lucide-react';
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
    <div className="bg-slate-50 dark:bg-slate-950">
      <section className="bg-slate-950 py-16 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2">Our Trainers</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Đội ngũ huấn luyện viên
          </h1>
          <p className="mt-3 text-slate-400 max-w-2xl">
            Gặp gỡ những chuyên gia sẽ đồng hành và truyền cảm hứng cho bạn tại GymMaster.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Specialization filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {specializations.slice(0, 8).map((s) => (
            <button
              key={s}
              onClick={() => setSpecialization(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border max-w-[260px] truncate ${
                specialization === s
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-500/50'
              }`}
              title={s}
            >
              {s === 'ALL' ? 'Tất cả' : s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tr) => (
              <div
                key={tr.id}
                className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-500/20 shrink-0">
                    {tr.user?.fullName?.charAt(0) || 'H'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-slate-900 dark:text-white text-lg truncate">
                      {tr.user?.fullName}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{tr.rating}</span>
                      <span className="text-xs text-slate-400">/ 5.0</span>
                    </div>
                  </div>
                </div>

                <Badge className="mt-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  {tr.specialization}
                </Badge>

                <div className="mt-4 space-y-2.5 text-sm">
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Briefcase className="w-4 h-4 text-emerald-500 shrink-0" />
                    {tr.experienceYears} năm kinh nghiệm
                  </p>
                  {tr.certification && (
                    <p className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                      <Award className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{tr.certification}</span>
                    </p>
                  )}
                </div>

                {tr.bio && (
                  <p className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex gap-2">
                    <Quote className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{tr.bio}</span>
                  </p>
                )}

                {tr.hourlyRate && (
                  <p className="mt-4 text-xs text-slate-400">
                    Giá PT: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(tr.hourlyRate)}</span>/giờ
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}