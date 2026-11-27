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
import {
  Check,
  ArrowRight,
  CreditCard,
  CalendarDays,
  PackageOpen,
  Building2,
  MapPin,
  Search,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { gymTierLabel } from '@/lib/package-options';

type SortKey = 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'duration_asc', label: 'Thời hạn tăng dần' },
  { value: 'duration_desc', label: 'Thời hạn giảm dần' },
];

const normalizeBranchSearch = (value: string) =>
  value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export default function PublicPackagesPage() {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>('price_asc');
  const [focusedBranchId, setFocusedBranchId] = useState('');
  const [branchSearch, setBranchSearch] = useState('');

  const {
    data: branches,
    isLoading: branchesLoading,
    isError: branchesError,
    refetch: refetchBranches,
  } = useQuery({
    queryKey: ['public-branches'],
    queryFn: publicApi.getBranches,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const matchingBranches = (branches || []).filter((branch) => {
    const query = normalizeBranchSearch(branchSearch.trim());
    if (!query) return true;
    return normalizeBranchSearch(
      `${branch.name} ${branch.partner.businessName} ${branch.address || ''}`,
    ).includes(query);
  });
  const mapBranch =
    matchingBranches.find((branch) => branch.id === focusedBranchId) || matchingBranches[0];
  // Ưu tiên toạ độ đối tác đã ghim trên bản đồ; chưa ghim thì tìm theo địa chỉ chữ
  const mapAddress = mapBranch
    ? mapBranch.latitude != null && mapBranch.longitude != null
      ? `${mapBranch.latitude},${mapBranch.longitude}`
      : `${mapBranch.address || mapBranch.name}, ${mapBranch.partner.businessName}, Việt Nam`
    : '';
  const mapEmbedUrl = mapAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&z=16&output=embed`
    : '';
  const mapExternalUrl = mapAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`
    : '';

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

      <section className="border-b border-line py-10 lg:py-12">
        <div className="container-x space-y-5">
          <div>
            <p className="meta-label">Tìm cơ sở gần bạn</p>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase text-chalk">
              Tìm phòng gym
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tìm theo khu vực để xem các cơ sở lân cận. Việc chọn cơ sở không ảnh hưởng đến đăng ký
              gói tập.
            </p>
          </div>

          {branchesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : branchesError ? (
            <ErrorState onRetry={() => refetchBranches()} />
          ) : branches?.length ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative block w-full sm:max-w-xl">
                  <Search className="pointer-events-none absolute inset-y-0 left-3.5 my-auto size-4 text-muted" />
                  <input
                    type="search"
                    value={branchSearch}
                    onChange={(event) => setBranchSearch(event.target.value)}
                    placeholder="Tìm theo tên phòng gym hoặc khu vực..."
                    aria-label="Tìm phòng gym theo tên hoặc địa chỉ"
                    className="h-11 w-full rounded-sm border border-line bg-surface pl-10 pr-3.5 text-sm text-chalk placeholder:text-muted focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
                  />
                </label>
                <p className="text-xs text-muted" aria-live="polite">
                  Tìm thấy {matchingBranches.length} / {branches.length} cơ sở
                </p>
              </div>

              {matchingBranches.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="order-1 grid content-start gap-3 lg:order-2 lg:max-h-72 lg:overflow-y-auto lg:pr-1">
                    {matchingBranches.map((branch) => {
                      const isSelected = focusedBranchId === branch.id;
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setFocusedBranchId(branch.id)}
                          className={`rounded-2xl border p-3.5 text-left transition-colors ${
                            isSelected
                              ? 'border-neon bg-neon/10'
                              : 'border-line bg-surface hover:border-neon/50'
                          }`}
                        >
                          <span className="flex items-start justify-between gap-3">
                            <span>
                              <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                {branch.partner.businessName}
                              </span>
                              <span className="mt-1 block font-semibold text-chalk">
                                {branch.name}
                              </span>
                              {branch.partner.gymTier && (
                                <span className="mt-1.5 inline-flex rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 text-[10px] font-semibold text-neon">
                                  Hạng {gymTierLabel(branch.partner.gymTier)}
                                </span>
                              )}
                            </span>
                            <Building2
                              className={`size-5 shrink-0 ${isSelected ? 'text-neon' : 'text-muted'}`}
                            />
                          </span>
                          {branch.address && (
                            <span className="mt-3 flex items-start gap-1.5 text-xs text-muted">
                              <MapPin className="mt-0.5 size-3.5 shrink-0" />
                              {branch.address}
                            </span>
                          )}
                          <span
                            className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${
                              isSelected ? 'text-neon' : 'text-muted'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="size-3.5" /> Đang xem bản đồ
                              </>
                            ) : (
                              'Xem vị trí trên bản đồ'
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {mapBranch && (
                    <div className="order-2 overflow-hidden rounded-2xl border border-line bg-surface lg:order-1">
                      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="meta-label">Bản đồ phòng gym</p>
                          <p className="mt-1 truncate text-sm font-semibold text-chalk">
                            {mapBranch.name}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted">
                            {mapBranch.address || mapBranch.partner.businessName}
                          </p>
                        </div>
                        <a
                          href={mapExternalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-neon hover:text-neon-hover"
                        >
                          Mở bản đồ <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                      <iframe
                        title={`Bản đồ vị trí ${mapBranch.name}`}
                        src={mapEmbedUrl}
                        className="h-64 w-full border-0 sm:h-72"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={MapPin}
                  title="Không tìm thấy phòng gym phù hợp"
                  description="Thử tìm bằng tên phòng gym, tên đối tác hoặc khu vực khác."
                />
              )}
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title="Chưa có chi nhánh đang hoạt động"
              description="Danh sách sẽ hiển thị sau khi đối tác được duyệt và thêm chi nhánh."
            />
          )}
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section className="py-14 lg:py-16">
        <div className="container-x">
          <div className="mb-6">
            <p className="meta-label">Danh mục</p>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase text-chalk">
              Chọn gói tập
            </h2>
          </div>

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
