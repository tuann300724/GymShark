'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { getStoredUser } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { StaggerGroup, StaggerItem } from '@/components/ui/motion';
import { Reveal } from '@/components/home/reveal';
import { Check, ArrowRight, CreditCard, CalendarDays, PackageOpen } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type SortKey = 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'duration_asc', label: 'Thời hạn tăng dần' },
  { value: 'duration_desc', label: 'Thời hạn giảm dần' },
];

export default function PublicPackagesPage() {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>('price_asc');

  const {
    data: packages,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['public-packages'],
    queryFn: publicApi.getPackages,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const handleRegister = (packageId: string) => {
    const user = getStoredUser();
    const registerUrl = `/member/register-membership/${packageId}`;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(registerUrl)}`);
    } else {
      router.push(registerUrl);
    }
  };

  const filtered = [...(packages || [])].sort((a, b) => {
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
    <div className="overflow-x-hidden">
      {/* ===== Page hero ===== */}
      <section className="border-b border-line">
        <div className="container-x py-14 lg:py-16">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
              Membership Packages
            </p>
            <h1 className="section-title mt-4">Gói tập &amp; bảng giá</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              Chọn gói phù hợp để bắt đầu. Tất cả gói đều bao gồm quyền sử dụng khu Gym + Cardio và
              tủ đồ cá nhân.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section className="py-14 lg:py-16">
        <div className="container-x">
          {/* Filter / sort */}
          <Reveal>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <label htmlFor="pkg-sort" className="text-xs uppercase tracking-wider text-muted">
                  Sắp xếp
                </label>
                <select
                  id="pkg-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="h-10 rounded-sm border border-line bg-ink px-3.5 text-sm text-chalk transition-colors focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70 [&>option]:bg-surface [&>option]:text-chalk"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Reveal>

          {/* Grid */}
          {isLoading ? (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-96 rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState className="mt-8" onRetry={() => refetch()} />
          ) : (
            <StaggerGroup className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((pkg) => {
                const isActive = pkg.status === 'ACTIVE';
                return (
                  <StaggerItem key={pkg.id} className="h-full">
                    <div
                      className={`flex h-full flex-col rounded-2xl border bg-surface p-7 transition-all duration-300 ${
                        isActive
                          ? 'border-neon/30 hover:border-neon/60'
                          : 'border-line hover:border-neon/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-display text-xl font-bold uppercase leading-tight tracking-tight text-chalk">
                          {pkg.name}
                        </h2>
                        <Badge variant={isActive ? 'success' : 'outline'}>
                          {isActive ? 'Đang bán' : pkg.status}
                        </Badge>
                      </div>

                      <div className="mt-4 flex items-baseline gap-1.5">
                        <span className="font-display text-4xl font-extrabold leading-none text-neon">
                          {formatCurrency(pkg.price)}
                        </span>
                        <span className="text-xs text-muted">/ {pkg.durationDays} ngày</span>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-muted">{pkg.description}</p>

                      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                        <CalendarDays className="size-3.5 shrink-0" />
                        <span>Thời hạn: {pkg.durationDays} ngày</span>
                        {pkg.sessions ? (
                          <>
                            <span aria-hidden>•</span>
                            <span>{pkg.sessions} buổi tập với PT</span>
                          </>
                        ) : null}
                      </div>

                      <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5">
                        {(pkg.features?.items || []).map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-muted">
                            <Check className="mt-0.5 size-4 shrink-0 text-neon" />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="mt-7 h-11 w-full font-bold"
                        onClick={() => handleRegister(pkg.id)}
                      >
                        <CreditCard className="size-4" />
                        Đăng ký gói này
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState
              className="mt-8"
              icon={PackageOpen}
              title="Không tìm thấy gói tập phù hợp"
              description="Hiện không có gói tập nào đang mở bán."
            />
          )}
        </div>
      </section>
    </div>
  );
}
