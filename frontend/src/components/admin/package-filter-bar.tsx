'use client';

import React from 'react';
import { ArrowUpDown, Filter, RotateCcw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeTiers } from '@/lib/package-options';
import type { MembershipPackage } from '@/services/types';

// ---------------------------------------------------------------------------
// Bộ lọc
// ---------------------------------------------------------------------------

export type PackageFilters = {
  search: string;
  type: 'ALL' | 'FIXED_TERM' | 'CREDIT_BASED' | 'SESSION_BASED';
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
  tier: 'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3';
  duration: 'ALL' | 'SHORT' | 'MID' | 'LONG';
  price: 'ALL' | 'LT_500K' | '500K_2M' | '2M_5M' | 'GT_5M';
  sort:
    | 'DEFAULT'
    | 'PRICE_ASC'
    | 'PRICE_DESC'
    | 'DURATION_ASC'
    | 'DURATION_DESC'
    | 'VISIT_COST_ASC'
    | 'NAME_ASC';
};

type FacetKey = 'type' | 'status' | 'tier' | 'duration' | 'price';

export const DEFAULT_PACKAGE_FILTERS: PackageFilters = {
  search: '',
  type: 'ALL',
  status: 'ALL',
  tier: 'ALL',
  duration: 'ALL',
  price: 'ALL',
  sort: 'DEFAULT',
};

type Option<V extends string> = { value: V; label: string };

const FACETS: { key: FacetKey; label: string; options: Option<string>[] }[] = [
  {
    key: 'type',
    label: 'Loại gói',
    options: [
      { value: 'FIXED_TERM', label: 'Gói Tháng' },
      { value: 'CREDIT_BASED', label: 'Gói Lượt' },
      { value: 'SESSION_BASED', label: 'Gói cũ theo buổi' },
    ],
  },
  {
    key: 'status',
    label: 'Trạng thái',
    options: [
      { value: 'ACTIVE', label: 'Đang bán' },
      { value: 'INACTIVE', label: 'Ngừng bán' },
    ],
  },
  {
    key: 'tier',
    label: 'Hạng gói (hạng phòng cao nhất)',
    options: [
      { value: 'TIER_1', label: 'Standard' },
      { value: 'TIER_2', label: 'Plus' },
      { value: 'TIER_3', label: 'Premium' },
    ],
  },
  {
    key: 'duration',
    label: 'Thời hạn sử dụng',
    options: [
      { value: 'SHORT', label: 'Đến 1 tháng' },
      { value: 'MID', label: '1 – 6 tháng' },
      { value: 'LONG', label: 'Trên 6 tháng' },
    ],
  },
  {
    key: 'price',
    label: 'Mức giá',
    options: [
      { value: 'LT_500K', label: 'Dưới 500k' },
      { value: '500K_2M', label: '500k – 2 triệu' },
      { value: '2M_5M', label: '2 – 5 triệu' },
      { value: 'GT_5M', label: 'Trên 5 triệu' },
    ],
  },
];

const SORT_OPTIONS: Option<PackageFilters['sort']>[] = [
  { value: 'DEFAULT', label: 'Mới tạo gần đây' },
  { value: 'PRICE_ASC', label: 'Giá thấp → cao' },
  { value: 'PRICE_DESC', label: 'Giá cao → thấp' },
  { value: 'DURATION_ASC', label: 'Thời hạn ngắn → dài' },
  { value: 'DURATION_DESC', label: 'Thời hạn dài → ngắn' },
  { value: 'VISIT_COST_ASC', label: 'Chi phí mỗi lượt thấp nhất' },
  { value: 'NAME_ASC', label: 'Tên A → Z' },
];

/** Bỏ dấu tiếng Việt để tìm "goi thang" vẫn khớp "Gói Tháng" */
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Hạng phòng cao nhất mà gói mở khóa */
function topTier(pkg: MembershipPackage): string | null {
  const tiers = normalizeTiers(pkg.gymTierAccess);
  return tiers.length ? tiers[tiers.length - 1] : null;
}

/** Chi phí trung bình mỗi lượt tập nếu dùng tối đa quyền lợi gói (tối đa 1 lượt/ngày) */
export function costPerVisit(pkg: MembershipPackage): number {
  const price = Number(pkg.price) || 0;
  const days = Math.max(1, pkg.durationDays);
  const daily = Math.max(1, pkg.dailyVisitLimit ?? 1);
  let visits = days * daily;
  if (pkg.type === 'CREDIT_BASED' && pkg.visitLimit) visits = Math.min(visits, pkg.visitLimit);
  if (pkg.type === 'FIXED_TERM' && pkg.visitLimit) {
    visits = Math.min(visits, Math.ceil((pkg.visitLimit * days) / 30));
  }
  return price / Math.max(1, visits);
}

function matchFacet(pkg: MembershipPackage, key: FacetKey, value: string): boolean {
  if (value === 'ALL') return true;
  const price = Number(pkg.price) || 0;
  switch (key) {
    case 'type':
      return pkg.type === value;
    case 'status':
      return value === 'ACTIVE' ? pkg.status === 'ACTIVE' : pkg.status !== 'ACTIVE';
    case 'tier':
      return topTier(pkg) === value;
    case 'duration':
      if (value === 'SHORT') return pkg.durationDays <= 31;
      if (value === 'MID') return pkg.durationDays > 31 && pkg.durationDays <= 186;
      return pkg.durationDays > 186;
    case 'price':
      if (value === 'LT_500K') return price < 500_000;
      if (value === '500K_2M') return price >= 500_000 && price < 2_000_000;
      if (value === '2M_5M') return price >= 2_000_000 && price <= 5_000_000;
      return price > 5_000_000;
  }
}

function matchSearch(pkg: MembershipPackage, search: string): boolean {
  const q = normalizeText(search);
  if (!q) return true;
  const haystack = normalizeText(
    [pkg.name, pkg.code, pkg.description ?? '', ...(pkg.features?.items ?? [])].join(' '),
  );
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

function matches(pkg: MembershipPackage, filters: PackageFilters, skip?: FacetKey): boolean {
  if (!matchSearch(pkg, filters.search)) return false;
  return FACETS.every(({ key }) => key === skip || matchFacet(pkg, key, filters[key]));
}

/** Lọc + sắp xếp danh sách gói theo bộ lọc hiện tại */
export function applyPackageFilters(
  packages: MembershipPackage[],
  filters: PackageFilters,
): MembershipPackage[] {
  const result = packages.filter((pkg) => matches(pkg, filters));
  const byPrice = (a: MembershipPackage, b: MembershipPackage) => Number(a.price) - Number(b.price);
  switch (filters.sort) {
    case 'PRICE_ASC':
      return result.sort(byPrice);
    case 'PRICE_DESC':
      return result.sort((a, b) => byPrice(b, a));
    case 'DURATION_ASC':
      return result.sort((a, b) => a.durationDays - b.durationDays || byPrice(a, b));
    case 'DURATION_DESC':
      return result.sort((a, b) => b.durationDays - a.durationDays || byPrice(a, b));
    case 'VISIT_COST_ASC':
      return result.sort((a, b) => costPerVisit(a) - costPerVisit(b));
    case 'NAME_ASC':
      return result.sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true }));
    default:
      return result;
  }
}

// ---------------------------------------------------------------------------
// Giao diện
// ---------------------------------------------------------------------------

type Props = {
  /** Ẩn lọc theo hạng phòng (gói riêng của đối tác không có hạng) */
  hideTier?: boolean;
  packages: MembershipPackage[];
  filters: PackageFilters;
  onChange: (next: PackageFilters) => void;
  resultCount: number;
};

const ALL_LABEL: Record<FacetKey, string> = {
  type: 'Tất cả loại',
  status: 'Mọi trạng thái',
  tier: 'Mọi hạng gói',
  duration: 'Mọi thời hạn',
  price: 'Mọi mức giá',
};

const controlClass =
  'h-10 w-full min-w-0 rounded-sm border bg-ink text-sm text-chalk transition-colors focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70';

export function PackageFilterBar({
  packages,
  filters,
  onChange,
  resultCount,
  hideTier = false,
}: Props) {
  const set = <K extends keyof PackageFilters>(key: K, value: PackageFilters[K]) =>
    onChange({ ...filters, [key]: value });

  // Đếm kiểu faceted: mỗi nhóm đếm trên kết quả của các nhóm còn lại
  const countFor = (key: FacetKey, value: string) =>
    packages.filter((pkg) => matches(pkg, filters, key) && matchFacet(pkg, key, value)).length;

  const facetOptions = (key: FacetKey) =>
    FACETS.find((f) => f.key === key)!.options.filter(
      (o) => o.value !== 'SESSION_BASED' || packages.some((p) => p.type === 'SESSION_BASED'),
    );

  const activeTags = FACETS.flatMap(({ key, label, options }) => {
    const option = options.find((o) => o.value === filters[key]);
    return option ? [{ key, text: `${label.split(' (')[0]}: ${option.label}` }] : [];
  });
  const hasSearch = filters.search.trim().length > 0;
  const isDirty = hasSearch || activeTags.length > 0 || filters.sort !== 'DEFAULT';

  return (
    <section
      aria-label="Bộ lọc gói tập"
      className="space-y-3 rounded-2xl border border-line bg-surface p-3 sm:p-4"
    >
      {/* Hàng 1: tìm kiếm + loại gói */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Tìm gói tập</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Tìm theo tên, mã gói, mô tả, quyền lợi..."
            className={cn(
              controlClass,
              'border-line px-9 placeholder:text-muted/70 [&::-webkit-search-cancel-button]:hidden',
            )}
          />
          {hasSearch && (
            <button
              type="button"
              onClick={() => set('search', '')}
              aria-label="Xoá từ khoá"
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-line hover:text-chalk"
            >
              <X className="size-4" />
            </button>
          )}
        </label>

        <div
          role="group"
          aria-label="Loại gói"
          className="grid shrink-0 grid-cols-3 gap-1 rounded-sm border border-line bg-ink p-1 md:flex"
        >
          {[{ value: 'ALL', label: 'Tất cả' }, ...facetOptions('type')].map((o) => {
            const active = filters.type === o.value;
            const count =
              o.value === 'ALL'
                ? packages.filter((pkg) => matches(pkg, filters, 'type')).length
                : countFor('type', o.value);
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() => set('type', o.value as PackageFilters['type'])}
                disabled={!active && count === 0}
                className={cn(
                  'inline-flex h-8 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs sm:px-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  active ? 'bg-neon/10 text-neon' : 'text-muted hover:text-chalk',
                )}
              >
                {o.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[10px] tabular-nums',
                    active ? 'bg-neon/20' : 'bg-line',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hàng 2: bộ lọc phụ + sắp xếp + đặt lại */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
        {(hideTier
          ? (['status', 'duration', 'price'] as const)
          : (['status', 'tier', 'duration', 'price'] as const)
        ).map((key) => {
          const facet = FACETS.find((f) => f.key === key)!;
          const allCount = packages.filter((pkg) => matches(pkg, filters, key)).length;
          const active = filters[key] !== 'ALL';
          return (
            <label key={key} className="block min-w-0">
              <span className="sr-only">{facet.label}</span>
              <select
                value={filters[key]}
                onChange={(e) => set(key, e.target.value as never)}
                title={facet.label}
                className={cn(
                  controlClass,
                  'px-3 [&>option]:bg-surface',
                  active ? 'border-neon/50 text-neon' : 'border-line',
                )}
              >
                <option value="ALL">
                  {ALL_LABEL[key]} ({allCount})
                </option>
                {facetOptions(key).map((o) => {
                  const count = countFor(key, o.value);
                  return (
                    <option
                      key={o.value}
                      value={o.value}
                      disabled={count === 0 && filters[key] !== o.value}
                    >
                      {o.label} ({count})
                    </option>
                  );
                })}
              </select>
            </label>
          );
        })}
        <label className="relative block min-w-0">
          <span className="sr-only">Sắp xếp</span>
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <select
            value={filters.sort}
            onChange={(e) => set('sort', e.target.value as PackageFilters['sort'])}
            className={cn(
              controlClass,
              'pl-9 pr-3 [&>option]:bg-surface',
              filters.sort !== 'DEFAULT' ? 'border-neon/50' : 'border-line',
            )}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_PACKAGE_FILTERS)}
          disabled={!isDirty}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-line px-3.5 text-xs font-semibold text-chalk transition-colors hover:border-neon/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" />
          Đặt lại
        </button>
      </div>

      {/* Hàng 3: kết quả + nhãn lọc đang bật */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
        <p className="flex items-center gap-1.5" aria-live="polite">
          <Filter className="size-3.5 text-neon" />
          Hiển thị <strong className="text-chalk">{resultCount}</strong> / {packages.length} gói tập
        </p>
        {activeTags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {activeTags.map((tag) => (
              <li key={tag.key}>
                <button
                  type="button"
                  onClick={() => set(tag.key, 'ALL' as never)}
                  aria-label={`Bỏ lọc ${tag.text}`}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-ink px-2.5 py-0.5 text-[11px] font-medium text-chalk hover:border-danger/50 hover:text-danger"
                >
                  {tag.text}
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
