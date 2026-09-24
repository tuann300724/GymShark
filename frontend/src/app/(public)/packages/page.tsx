'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { getStoredUser } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, ArrowRight, CreditCard, CalendarDays } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type SortKey = 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc';

export default function PublicPackagesPage() {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>('price_asc');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'FIXED_TERM' | 'SESSION_BASED'>('ALL');

  const { data: packages, isLoading } = useQuery({
    queryKey: ['public-packages'],
    queryFn: publicApi.getPackages,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const handleRegister = (packageId: string) => {
    const user = getStoredUser();
    const registerUrl = `/member/memberships/register?packageId=${packageId}`;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(registerUrl)}`);
    } else {
      router.push(registerUrl);
    }
  };

  const filtered = (packages || [])
    .filter((p) => typeFilter === 'ALL' || p.type === typeFilter)
    .sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price_desc':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'duration_asc':
          return a.durationDays - b.durationDays;
        case 'duration_desc':
          return b.durationDays - a.durationDays;
      }
    });

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      {/* Page hero */}
      <section className="bg-slate-950 py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2">Membership Packages</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Gói tập & bảng giá</h1>
          <p className="mt-3 text-slate-400 max-w-2xl">
            Chọn gói phù hợp để bắt đầu. Tất cả gói đều bao gồm quyền sử dụng khu Gym + Cardio và tủ đồ cá nhân.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filter / sort */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-8">
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'FIXED_TERM', 'SESSION_BASED'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  typeFilter === t
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-500/50'
                }`}
              >
                {t === 'ALL' ? 'Tất cả' : t === 'FIXED_TERM' ? 'Theo thời hạn' : 'Theo buổi tập'}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="duration_asc">Thời hạn tăng dần</option>
            <option value="duration_desc">Thời hạn giảm dần</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filtered.map((pkg) => (
              <div
                key={pkg.id}
                className="flex flex-col p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{pkg.name}</h2>
                  <Badge variant={pkg.status === 'ACTIVE' ? 'success' : 'outline'}>
                    {pkg.status === 'ACTIVE' ? 'Đang bán' : pkg.status}
                  </Badge>
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(pkg.price)}
                  </span>
                  <span className="text-xs text-slate-500">
                    / {pkg.type === 'SESSION_BASED' ? `${pkg.sessions} buổi` : `${pkg.durationDays} ngày`}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{pkg.description}</p>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Thời hạn: {pkg.durationDays} ngày</span>
                  {pkg.sessions ? (
                    <>
                      <span>•</span>
                      <span>{pkg.sessions} buổi</span>
                    </>
                  ) : null}
                </div>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {(pkg.features?.items || []).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-7 w-full h-11 font-bold"
                  onClick={() => handleRegister(pkg.id)}
                >
                  <CreditCard className="w-4 h-4" />
                  Đăng ký gói này
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="font-semibold">Không tìm thấy gói tập phù hợp với bộ lọc.</p>
          </div>
        )}
      </section>
    </div>
  );
}