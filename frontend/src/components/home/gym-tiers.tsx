'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, Check, MapPin } from 'lucide-react';
import { publicApi } from '@/services/package.service';
import type { GymTier, MembershipPackage } from '@/services/types';
import { GYM_TIERS, GYM_TIER_CRITERIA, normalizeTiers, gymTierLabel } from '@/lib/package-options';
import { formatCurrency, cn } from '@/lib/utils';
import { Reveal } from './reveal';
import { StaggerGroup, StaggerItem } from '@/components/ui/motion';
import { TiltCard } from './effects';

/** Giá gói tháng rẻ nhất có hạng cao nhất đúng bằng `tier` (gói 30 ngày; không có thì lấy gói bất kỳ) */
function fromPrice(packages: MembershipPackage[], tier: GymTier) {
  const ofTier = packages.filter((pkg) => {
    // API công khai trả gymTierAccess dạng chuỗi JSON — chấp nhận cả mảng lẫn chuỗi
    const raw: unknown = pkg.gymTierAccess;
    let parsed: unknown = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = [];
      }
    }
    const tiers = normalizeTiers(parsed);
    return tiers[tiers.length - 1] === tier;
  });
  const monthly = ofTier.filter((pkg) => pkg.type === 'FIXED_TERM' && pkg.durationDays === 30);
  const pool = monthly.length ? monthly : ofTier;
  if (!pool.length) return null;
  const min = Math.min(...pool.map((pkg) => Number(pkg.price)));
  return { price: min, monthly: monthly.length > 0 };
}

export function GymTiers() {
  const { data: packages = [] } = useQuery({
    queryKey: ['public-packages'],
    queryFn: publicApi.getPackages,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ['public-branches'],
    queryFn: publicApi.getBranches,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const tiers = useMemo(
    () =>
      GYM_TIERS.map((tier) => ({
        ...tier,
        from: fromPrice(packages, tier.value),
        count: branches.filter((b) => b.partner.gymTier === tier.value).length,
      })),
    [packages, branches],
  );

  return (
    <section
      id="network"
      className="scroll-mt-24 border-y border-line bg-surface/40 py-20 lg:py-24"
    >
      <div className="container-x">
        <Reveal>
          <div className="max-w-2xl">
            <p className="meta-label">Hạng phòng tập</p>
            <h2 className="section-title mt-2">Chọn hạng — tập cả mạng lưới</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Mỗi phòng đối tác được Gym Master thẩm định qua ảnh cơ sở vật chất và xếp hạng. Gói
              hạng cao vào được cả các phòng hạng thấp hơn.
            </p>
          </div>
        </Reveal>

        <StaggerGroup className="mt-12 grid gap-4 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <StaggerItem key={tier.value} className="h-full">
              <TiltCard
                className={cn(
                  'flex flex-col rounded-2xl border bg-surface p-6',
                  index === 1 ? 'border-neon/40' : 'border-line',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {tier.hint}
                    </p>
                    <h3 className="mt-1 font-display text-3xl font-extrabold uppercase text-chalk">
                      {tier.shortLabel}
                    </h3>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-muted">
                    <Building2 className="size-3.5" /> {tier.count} cơ sở
                  </span>
                </div>

                <p className="mt-4 font-display text-2xl font-bold text-neon">
                  {tier.from ? (
                    <>
                      từ {formatCurrency(tier.from.price)}
                      {tier.from.monthly && (
                        <span className="ml-1 font-sans text-sm font-semibold text-muted">
                          /tháng
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="font-sans text-sm font-semibold text-muted">
                      Gói đang cập nhật
                    </span>
                  )}
                </p>
                {index > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    Vào được cả phòng{' '}
                    {GYM_TIERS.slice(0, index)
                      .map((t) => t.shortLabel)
                      .join(', ')}
                  </p>
                )}

                <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                  {GYM_TIER_CRITERIA[tier.value].map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-neon" />
                      {item}
                    </li>
                  ))}
                </ul>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerGroup>

        {/* Cơ sở đang mở trong mạng lưới (dữ liệu thật) */}
        <Reveal delay={120}>
          <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-bold uppercase text-chalk">
                Cơ sở trong mạng lưới
              </h3>
              <p className="mt-1 text-sm text-muted">
                Các phòng đối tác đã được duyệt và đang nhận hội viên Gym Master.
              </p>
            </div>
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 text-sm font-semibold text-neon transition-all hover:gap-3"
            >
              Xem bản đồ & gói tập <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>

        {branches.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
            Mạng lưới đang mở rộng — các phòng đối tác sẽ xuất hiện tại đây khi được duyệt.
          </div>
        ) : (
          <StaggerGroup className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {branches.slice(0, 6).map((branch) => (
              <StaggerItem
                key={branch.id}
                className="flex flex-col gap-2 rounded-xl border border-line bg-ink p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-chalk">{branch.name}</p>
                    <p className="truncate text-xs text-muted">{branch.partner.businessName}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-neon/30 bg-neon/10 px-2.5 py-0.5 text-[11px] font-semibold text-neon">
                    {gymTierLabel(branch.partner.gymTier)}
                  </span>
                </div>
                {branch.address && (
                  <p className="flex gap-1.5 text-xs leading-relaxed text-muted">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </p>
                )}
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}
