'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CalendarClock, Pencil, Save, Users, X } from 'lucide-react';
import { partnerApi } from '@/services/partner.service';
import type { PartnershipPlan, PartnershipType } from '@/services/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { getStoredUser } from '@/lib/auth';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

export const PARTNERSHIP_LABELS: Record<PartnershipType, string> = {
  OWNER: 'Tự quản lý',
  COMMUNITY: 'Gym Cộng đồng',
};

export const PARTNERSHIP_ICONS = { OWNER: Building2, COMMUNITY: Users };

const DAY = 86_400_000;

/** Tình trạng hợp đồng: còn hạn / sắp hết hạn (≤ 7 ngày) / đã hết hạn / chưa có */
export function contractStatus(endAt?: string | null) {
  if (!endAt) return { label: 'Chưa có hợp đồng', variant: 'outline' as const, daysLeft: null };
  const daysLeft = Math.ceil((new Date(endAt).getTime() - Date.now()) / DAY);
  if (daysLeft < 0)
    return { label: `Hết hạn ${-daysLeft} ngày`, variant: 'destructive' as const, daysLeft };
  if (daysLeft <= 7)
    return { label: `Còn ${daysLeft} ngày`, variant: 'warning' as const, daysLeft };
  return { label: `Còn ${daysLeft} ngày`, variant: 'success' as const, daysLeft };
}

/** Phần trăm thời gian hợp đồng đã trôi qua (cho thanh tiến độ) */
export function contractProgress(startAt?: string | null, endAt?: string | null) {
  if (!startAt || !endAt) return 0;
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
}

export function PartnershipTypeBadge({ type }: { type?: PartnershipType | null }) {
  if (!type) return <Badge variant="outline">Chưa phân loại</Badge>;
  const Icon = PARTNERSHIP_ICONS[type];
  return (
    <Badge variant={type === 'COMMUNITY' ? 'info' : 'default'} className="gap-1">
      <Icon className="size-3" /> {PARTNERSHIP_LABELS[type]}
    </Badge>
  );
}

/**
 * Bảng giá 2 gói hợp tác — admin sửa giá tại chỗ. Giá mới áp dụng cho hợp đồng ký mới
 * và hiển thị ngay trên trang đăng ký đối tác; hợp đồng cũ giữ giá đã chốt.
 */
export function PartnershipPlansCard() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState<PartnershipType | null>(null);
  const [price, setPrice] = useState('');

  useEffect(() => setCanEdit(getStoredUser()?.role === 'ADMIN'), []);

  const plans = useQuery({ queryKey: ['admin-partnership-plans'], queryFn: partnerApi.adminPlans });

  const save = useMutation({
    mutationFn: (code: PartnershipType) =>
      partnerApi.adminUpdatePlan(code, { monthlyPrice: Number(price) }),
    onSuccess: (plan) => {
      success(`Đã cập nhật giá "${plan.name}": ${formatCurrency(plan.monthlyPrice)}/tháng.`);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['admin-partnership-plans'] });
      queryClient.invalidateQueries({ queryKey: ['public-partnership-plans'] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Không cập nhật được giá.';
      error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const startEdit = (plan: PartnershipPlan) => {
    setEditing(plan.code);
    setPrice(String(Math.round(Number(plan.monthlyPrice))));
  };
  const valid = /^\d+$/.test(price) && Number(price) >= 0;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Bảng giá gói hợp tác
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Giá mới áp dụng cho hợp đồng ký sau khi sửa; hợp đồng đang chạy giữ giá đã chốt.
          </p>
        </div>
        {!canEdit && <span className="text-[11px] text-muted">Chỉ ADMIN được sửa giá</span>}
      </div>
      {plans.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : plans.isError ? (
        <p className="text-xs text-danger">Không tải được bảng giá.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(plans.data ?? []).map((plan) => {
            const Icon = PARTNERSHIP_ICONS[plan.code];
            const isEditing = editing === plan.code;
            return (
              <div key={plan.code} className="rounded-xl border border-line bg-ink p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-chalk">
                    <Icon className="size-4 text-neon" /> {plan.name}
                  </p>
                  <Badge variant="outline">{PARTNERSHIP_LABELS[plan.code]}</Badge>
                </div>
                {isEditing ? (
                  <form
                    className="mt-2 flex items-end gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (valid) save.mutate(plan.code);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <Input
                        label="Giá / tháng (VND)"
                        name={`price-${plan.code}`}
                        inputMode="numeric"
                        value={price}
                        onChange={(event) => setPrice(event.target.value.replace(/\D/g, ''))}
                        error={valid ? undefined : 'Nhập số tiền hợp lệ'}
                      />
                    </div>
                    <Button type="submit" size="sm" isLoading={save.isPending} disabled={!valid}>
                      <Save className="size-3.5" /> Lưu
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label="Hủy sửa giá"
                      onClick={() => setEditing(null)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </form>
                ) : (
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <p className="font-display text-2xl font-extrabold text-neon">
                      {formatCurrency(plan.monthlyPrice)}
                      <span className="ml-1 font-sans text-xs font-medium text-muted">/ tháng</span>
                    </p>
                    {canEdit && (
                      <Button size="sm" variant="outline" onClick={() => startEdit(plan)}>
                        <Pencil className="size-3.5" /> Sửa giá
                      </Button>
                    )}
                  </div>
                )}
                {plan.updatedAt && (
                  <p className="mt-1 text-[11px] text-muted">
                    Cập nhật {formatDate(plan.updatedAt)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Thẻ hợp đồng ở trang chi tiết đối tác: loại hợp tác, phí, thời hạn, gia hạn */
export function PartnerContractCard({
  partner,
}: {
  partner: {
    id: string;
    partnershipType?: PartnershipType | null;
    monthlyFee?: string | number | null;
    contractStartAt?: string | null;
    contractEndAt?: string | null;
    pendingRenewal?: { at: string; months: number | null; note: string | null } | null;
  };
}) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [months, setMonths] = useState(partner.pendingRenewal?.months ?? 1);

  const mutation = useMutation({
    mutationFn: (payload: { partnershipType?: PartnershipType; extendMonths?: number }) =>
      partnerApi.adminUpdateContract(partner.id, payload),
    onSuccess: (_, payload) => {
      success(
        payload.extendMonths
          ? `Đã gia hạn hợp đồng thêm ${payload.extendMonths} tháng.`
          : 'Đã đổi loại hợp tác.',
      );
      queryClient.invalidateQueries({ queryKey: ['admin-partner', partner.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Không cập nhật được hợp đồng.';
      error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const status = contractStatus(partner.contractEndAt);
  const progress = contractProgress(partner.contractStartAt, partner.contractEndAt);

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase text-chalk">
          <CalendarClock className="size-5 text-neon" /> Hợp đồng hợp tác
        </h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {partner.pendingRenewal && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-chalk"
        >
          <p className="font-semibold">
            Đối tác xin gia hạn {partner.pendingRenewal.months ?? '?'} tháng ·{' '}
            {formatDate(partner.pendingRenewal.at)}
          </p>
          {partner.pendingRenewal.note && (
            <p className="mt-1 text-muted">Ghi chú: {partner.pendingRenewal.note}</p>
          )}
          <p className="mt-1 text-muted">
            Xác nhận thanh toán xong thì chọn số tháng bên dưới và bấm Gia hạn.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-ink p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted">Loại hợp tác</p>
          <div className="mt-1.5">
            <PartnershipTypeBadge type={partner.partnershipType} />
          </div>
        </div>
        <div className="rounded-xl border border-line bg-ink p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted">Phí / tháng (đã chốt)</p>
          <p className="mt-1 font-display text-xl font-extrabold text-neon">
            {partner.monthlyFee != null ? formatCurrency(partner.monthlyFee) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-ink p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted">Thời hạn</p>
          <p className="mt-1 text-sm font-semibold text-chalk">
            {formatDate(partner.contractStartAt)} → {formatDate(partner.contractEndAt)}
          </p>
        </div>
      </div>

      {partner.contractEndAt && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Thời gian hợp đồng đã sử dụng"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              'h-full rounded-full',
              status.variant === 'destructive'
                ? 'bg-danger'
                : status.variant === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-neon',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="block text-xs text-muted">
            <span className="mb-1 block font-semibold uppercase tracking-wider">Gia hạn thêm</span>
            <select
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
              className="h-9 rounded-lg border border-line bg-ink px-2.5 text-sm text-chalk focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
            >
              {[1, 3, 6, 12, 24].map((m) => (
                <option key={m} value={m}>
                  {m} tháng{m >= 12 ? ' (thỏa thuận nội bộ)' : ''}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            isLoading={mutation.isPending && Boolean(mutation.variables?.extendMonths)}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ extendMonths: months })}
          >
            <CalendarClock className="size-3.5" /> Gia hạn
          </Button>
        </div>
        {!partner.partnershipType &&
          (['COMMUNITY', 'OWNER'] as const).map((type) => (
            <Button
              key={type}
              size="sm"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ partnershipType: type })}
            >
              Đặt là {PARTNERSHIP_LABELS[type]}
            </Button>
          ))}
        {partner.partnershipType && (
          <Button
            size="sm"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                partnershipType: partner.partnershipType === 'OWNER' ? 'COMMUNITY' : 'OWNER',
              })
            }
          >
            Chuyển sang{' '}
            {PARTNERSHIP_LABELS[partner.partnershipType === 'OWNER' ? 'COMMUNITY' : 'OWNER']}
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted">
        Gia hạn khi còn hạn sẽ cộng tiếp từ ngày hết hạn; đã hết hạn thì tính lại từ hôm nay. Đổi
        loại hợp tác sẽ áp giá hiện hành của gói mới.
      </p>
    </section>
  );
}
