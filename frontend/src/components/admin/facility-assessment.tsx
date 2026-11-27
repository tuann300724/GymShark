'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Check, ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { partnerApi, type PartnerLeadRecord } from '@/services/partner.service';
import type { GymTier } from '@/services/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { FACILITY_AREA_LABELS } from '@/components/partner/facility-photo-uploader';
import { GYM_TIERS, GYM_TIER_CRITERIA, gymTierLabel } from '@/lib/package-options';
import { cn, formatDateTime } from '@/lib/utils';

/** Chọn hạng phòng gym kèm tiêu chí (dùng chung cho yêu cầu hợp tác & hồ sơ đối tác) */
export function TierPicker({
  value,
  onChange,
}: {
  value: GymTier | null;
  onChange: (tier: GymTier) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Hạng phòng gym" className="grid gap-2 sm:grid-cols-3">
      {GYM_TIERS.map((tier) => {
        const active = value === tier.value;
        return (
          <button
            key={tier.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(tier.value)}
            className={cn(
              'rounded-xl border p-3 text-left transition-colors',
              active ? 'border-neon bg-neon/10' : 'border-line bg-ink hover:border-neon/40',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className={cn('text-sm font-bold', active ? 'text-neon' : 'text-chalk')}>
                {tier.shortLabel}
              </span>
              {active && <Check className="size-4 text-neon" />}
            </span>
            <ul className="mt-2 space-y-1">
              {GYM_TIER_CRITERIA[tier.value].map((item) => (
                <li key={item} className="text-[11px] leading-snug text-muted">
                  • {item}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Khối đánh giá cơ sở vật chất trong chi tiết yêu cầu Gym Cộng đồng:
 * xem ảnh đối tác gửi (có phóng to) → chọn hạng theo tiêu chí → ghi nhận xét.
 */
export function LeadFacilityAssessment({ lead }: { lead: PartnerLeadRecord }) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [tier, setTier] = useState<GymTier | null>(lead.assessedTier ?? null);
  const [note, setNote] = useState(lead.assessmentNote ?? '');
  const [viewer, setViewer] = useState<number | null>(null);

  useEffect(() => {
    setTier(lead.assessedTier ?? null);
    setNote(lead.assessmentNote ?? '');
  }, [lead.id, lead.assessedTier, lead.assessmentNote]);

  const photos = useQuery({
    queryKey: ['admin-partner-lead-photos', lead.id],
    queryFn: () => partnerApi.adminLeadPhotos(lead.id),
    staleTime: 5 * 60_000,
  });

  const save = useMutation({
    mutationFn: () => partnerApi.adminAssessLead(lead.id, { tier: tier!, note: note.trim() }),
    onSuccess: () => {
      success(`Đã xếp hạng phòng: ${gymTierLabel(tier)}.`);
      queryClient.invalidateQueries({ queryKey: ['admin-partner-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partner-lead-history', lead.id] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Không lưu được đánh giá.';
      error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const list = photos.data ?? [];
  const current = viewer !== null ? list[viewer] : null;
  const locked = lead.status === 'CLOSED';
  const unchanged =
    tier === (lead.assessedTier ?? null) && note.trim() === (lead.assessmentNote ?? '');

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
          <Award className="size-3.5 text-neon" /> Đánh giá cơ sở vật chất
        </h3>
        <Badge variant={lead.assessedTier ? 'success' : 'warning'}>
          {lead.assessedTier ? `Hạng ${gymTierLabel(lead.assessedTier)}` : 'Chưa xếp hạng'}
        </Badge>
      </div>

      {photos.isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : list.length ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {list.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setViewer(index)}
                className="group relative block aspect-square w-full overflow-hidden rounded-lg border border-line"
                aria-label={`Xem ảnh ${FACILITY_AREA_LABELS[photo.area]}`}
              >
                <Image
                  src={photo.dataUrl}
                  alt={photo.caption || FACILITY_AREA_LABELS[photo.area]}
                  fill
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-ink/80 px-1.5 py-0.5 text-[10px] text-chalk">
                  {FACILITY_AREA_LABELS[photo.area]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 rounded-xl border border-dashed border-line p-3 text-xs text-muted">
          <ImageOff className="size-4" />
          Yêu cầu này chưa có ảnh (gửi trước khi bắt buộc ảnh). Hãy xin ảnh qua email/Zalo hoặc khảo
          sát trực tiếp trước khi xếp hạng.
        </p>
      )}

      <TierPicker value={tier} onChange={setTier} />
      <Textarea
        label="Nhận xét / căn cứ xếp hạng *"
        name="assessment-note"
        rows={2}
        maxLength={2000}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="VD: 400m², máy Life Fitness mới, có xông hơi và tủ khóa → Premium."
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted">
          {lead.assessedAt
            ? `Đánh giá lần cuối ${formatDateTime(lead.assessedAt)}`
            : 'Bắt buộc xếp hạng trước khi chốt hợp tác.'}
        </p>
        <Button
          size="sm"
          isLoading={save.isPending}
          disabled={locked || !tier || !note.trim() || unchanged}
          onClick={() => save.mutate()}
        >
          <Award className="size-3.5" /> Lưu xếp hạng
        </Button>
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh cơ sở vật chất"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Đóng xem ảnh"
            className="absolute inset-0 bg-ink/95"
            onClick={() => setViewer(null)}
          />
          <button
            type="button"
            aria-label="Đóng"
            className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full border border-line text-chalk hover:text-neon"
            onClick={() => setViewer(null)}
          >
            <X className="size-5" />
          </button>
          <div className="relative h-[70vh] w-full max-w-4xl">
            <Image
              src={current.dataUrl}
              alt={current.caption || FACILITY_AREA_LABELS[current.area]}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
          <p className="relative mt-3 text-center text-sm text-chalk">
            {FACILITY_AREA_LABELS[current.area]}
            {current.caption ? ` — ${current.caption}` : ''}
            <span className="ml-2 text-xs text-muted">
              {viewer! + 1}/{list.length}
            </span>
          </p>
          <div className="relative mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={viewer === 0}
              onClick={() => setViewer((v) => (v ?? 0) - 1)}
            >
              <ChevronLeft className="size-4" /> Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={viewer === list.length - 1}
              onClick={() => setViewer((v) => (v ?? 0) + 1)}
            >
              Sau <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Thẻ hạng phòng gym ở trang chi tiết đối tác — xếp hạng / đánh giá lại khi cơ sở thay đổi */
export function PartnerTierCard({
  partner,
}: {
  partner: {
    id: string;
    gymTier?: GymTier | null;
    tierNote?: string | null;
    tierAssessedAt?: string | null;
  };
}) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [tier, setTier] = useState<GymTier | null>(partner.gymTier ?? null);
  const [note, setNote] = useState(partner.tierNote ?? '');

  useEffect(() => {
    setTier(partner.gymTier ?? null);
    setNote(partner.tierNote ?? '');
  }, [partner.id, partner.gymTier, partner.tierNote]);

  const save = useMutation({
    mutationFn: () =>
      partnerApi.adminUpdateTier(partner.id, { gymTier: tier, note: note.trim() || undefined }),
    onSuccess: () => {
      success(tier ? `Đã xếp hạng phòng: ${gymTierLabel(tier)}.` : 'Đã bỏ xếp hạng phòng gym.');
      queryClient.invalidateQueries({ queryKey: ['admin-partner', partner.id] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Không lưu được hạng phòng gym.';
      error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const unchanged = tier === (partner.gymTier ?? null) && note.trim() === (partner.tierNote ?? '');

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase text-chalk">
            <Award className="size-5 text-neon" /> Hạng phòng gym
          </h2>
          <p className="mt-1 text-xs text-muted">
            Hội viên chỉ check-in được tại phòng này nếu gói tập của họ bao gồm hạng đã xếp. Chưa
            xếp hạng thì không giới hạn theo hạng.
          </p>
        </div>
        <Badge variant={partner.gymTier ? 'success' : 'warning'}>
          {gymTierLabel(partner.gymTier)}
          {partner.tierAssessedAt ? ` · ${formatDateTime(partner.tierAssessedAt)}` : ''}
        </Badge>
      </div>
      <TierPicker value={tier} onChange={setTier} />
      <Textarea
        label="Căn cứ xếp hạng"
        name="partner-tier-note"
        rows={2}
        maxLength={2000}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="VD: Khảo sát 12/2026 — nâng cấp thêm khu xông hơi, đủ chuẩn Premium."
      />
      <div className="flex flex-wrap justify-end gap-2">
        {partner.gymTier && (
          <Button
            variant="outline"
            size="sm"
            disabled={save.isPending}
            onClick={() => setTier(null)}
          >
            Bỏ xếp hạng
          </Button>
        )}
        <Button
          size="sm"
          isLoading={save.isPending}
          disabled={unchanged || (Boolean(tier) && !note.trim())}
          onClick={() => save.mutate()}
        >
          <Award className="size-3.5" /> Lưu hạng phòng
        </Button>
      </div>
    </section>
  );
}
