'use client';

import { useEffect, useState } from 'react';
import { getStoredUser } from '@/lib/auth';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  CalendarClock,
  Check,
  FileSignature,
  Info,
  Package,
  Percent,
  Send,
  Users,
  Wallet,
} from 'lucide-react';
import { partnerApi } from '@/services/partner.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import {
  PartnershipTypeBadge,
  contractProgress,
  contractStatus,
} from '@/components/admin/partnership';
import { GYM_TIERS, GYM_TIER_CRITERIA, gymTierLabel } from '@/lib/package-options';
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

const RENEW_OPTIONS = [1, 3, 6, 12];
const DAY = 86_400_000;

/**
 * Trang của đối tác: xem hợp đồng hợp tác (loại gói, phí/tháng, thời hạn), hạng phòng
 * gym do admin xếp, các gói tập hệ thống được vào phòng mình, và gửi yêu cầu gia hạn.
 */
export default function PartnerPartnershipPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [renewOpen, setRenewOpen] = useState(false);
  const [months, setMonths] = useState(1);
  const [note, setNote] = useState('');
  // Nhân viên của đối tác chỉ xem; gửi yêu cầu gia hạn là việc của chủ tài khoản
  const [isStaff, setIsStaff] = useState(false);
  useEffect(() => setIsStaff(Boolean(getStoredUser()?.partnerStaff)), []);

  const query = useQuery({
    queryKey: ['partner-my-partnership'],
    queryFn: partnerApi.getMyPartnership,
  });

  const renew = useMutation({
    mutationFn: () => partnerApi.requestRenewal({ months, note: note.trim() || undefined }),
    onSuccess: (result) => {
      success('Đã gửi yêu cầu gia hạn', result.message);
      setRenewOpen(false);
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['partner-my-partnership'] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Không gửi được yêu cầu gia hạn.';
      error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const header = (
    <div>
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
        <FileSignature className="size-6 text-neon" /> Hợp đồng & hạng phòng
      </h1>
      <p className="mt-1 text-xs text-muted">
        Thông tin gói hợp tác, thời hạn hợp đồng và hạng phòng gym của cơ sở bạn trên mạng lưới Gym
        Master.
      </p>
    </div>
  );

  if (query.isLoading)
    return (
      <div className="space-y-6">
        {header}
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="space-y-6">
        {header}
        <ErrorState
          title="Không tải được hợp đồng"
          description="Vui lòng thử lại hoặc liên hệ quản trị viên."
          onRetry={() => query.refetch()}
        />
      </div>
    );

  const p = query.data;
  const status = contractStatus(p.contractEndAt);
  const progress = contractProgress(p.contractStartAt, p.contractEndAt);
  const isCommunity = p.partnershipType === 'COMMUNITY';
  const fee = Number(p.monthlyFee ?? p.currentPlanPrice ?? 0);
  const recentRequest =
    p.lastRenewalRequest && Date.now() - new Date(p.lastRenewalRequest.at).getTime() < DAY;
  const priceChanged =
    p.currentPlanPrice != null &&
    p.monthlyFee != null &&
    Number(p.currentPlanPrice) !== Number(p.monthlyFee);

  return (
    <div className="space-y-6">
      {header}

      {(status.variant === 'warning' || status.variant === 'destructive') && (
        <div
          role="alert"
          className={cn(
            'flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between',
            status.variant === 'destructive'
              ? 'border-danger/40 bg-danger/10'
              : 'border-amber-500/40 bg-amber-500/10',
          )}
        >
          <p className="text-sm font-semibold text-chalk">
            {status.variant === 'destructive'
              ? `Hợp đồng đã hết hạn từ ${formatDate(p.contractEndAt)}. Hãy gia hạn để tiếp tục nhận hội viên.`
              : `Hợp đồng sẽ hết hạn ngày ${formatDate(p.contractEndAt)} (${status.label.toLowerCase()}).`}
          </p>
          <Button
            size="sm"
            onClick={() => setRenewOpen(true)}
            disabled={Boolean(recentRequest) || isStaff}
          >
            <Send className="size-3.5" /> Gửi yêu cầu gia hạn
          </Button>
        </div>
      )}

      {/* Hợp đồng */}
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase text-chalk">
              <CalendarClock className="size-5 text-neon" /> Hợp đồng hợp tác
            </h2>
            <p className="mt-1 text-xs text-muted">{p.businessName}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Gói hợp tác">
            <PartnershipTypeBadge type={p.partnershipType} />
          </InfoTile>
          <InfoTile label="Phí / tháng">
            <span className="font-display text-xl font-extrabold text-neon">
              {fee ? formatCurrency(fee) : '—'}
            </span>
          </InfoTile>
          <InfoTile label="Bắt đầu">
            <span className="text-sm font-semibold text-chalk">
              {formatDate(p.contractStartAt)}
            </span>
          </InfoTile>
          <InfoTile label="Hết hạn">
            <span className="text-sm font-semibold text-chalk">{formatDate(p.contractEndAt)}</span>
          </InfoTile>
        </div>

        {p.contractEndAt && (
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

        {priceChanged && (
          <p className="flex items-start gap-1.5 text-xs text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0 text-neon" />
            Bảng giá hiện hành là {formatCurrency(p.currentPlanPrice!)}/tháng; hợp đồng của bạn giữ
            mức {formatCurrency(p.monthlyFee!)}/tháng đã chốt khi ký.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs text-muted">
            {p.lastRenewalRequest
              ? `Yêu cầu gia hạn gần nhất: ${p.lastRenewalRequest.months ?? '?'} tháng · ${formatDateTime(p.lastRenewalRequest.at)}`
              : 'Gia hạn theo tháng. Quản trị viên sẽ liên hệ xác nhận thanh toán sau khi bạn gửi yêu cầu.'}
          </p>
          <Button onClick={() => setRenewOpen(true)} disabled={Boolean(recentRequest) || isStaff}>
            <Send className="size-4" />
            {isStaff
              ? 'Chủ tài khoản gửi yêu cầu gia hạn'
              : recentRequest
                ? 'Đã gửi yêu cầu (chờ admin)'
                : 'Gửi yêu cầu gia hạn'}
          </Button>
        </div>
      </section>

      {isCommunity && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Hạng phòng */}
          <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase text-chalk">
                <Award className="size-5 text-neon" /> Hạng phòng gym
              </h2>
              <Badge variant={p.gymTier ? 'success' : 'warning'}>{gymTierLabel(p.gymTier)}</Badge>
            </div>
            <ol className="grid gap-2 sm:grid-cols-3">
              {GYM_TIERS.map((tier) => {
                const active = tier.value === p.gymTier;
                return (
                  <li
                    key={tier.value}
                    className={cn(
                      'rounded-xl border p-3',
                      active ? 'border-neon bg-neon/10' : 'border-line bg-ink',
                    )}
                  >
                    <p
                      className={cn(
                        'flex items-center justify-between text-sm font-bold',
                        active ? 'text-neon' : 'text-chalk',
                      )}
                    >
                      {tier.shortLabel}
                      {active && <Check className="size-4" />}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {GYM_TIER_CRITERIA[tier.value].map((item) => (
                        <li key={item} className="text-[11px] leading-snug text-muted">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
            {p.tierNote && (
              <p className="rounded-lg bg-ink px-3 py-2 text-xs leading-relaxed text-muted">
                <span className="font-semibold text-chalk">Nhận xét của Gym Master: </span>
                {p.tierNote}
                {p.tierAssessedAt ? ` (${formatDate(p.tierAssessedAt)})` : ''}
              </p>
            )}
            <p className="text-[11px] text-muted">
              Hạng càng cao, càng nhiều gói tập của hệ thống được vào phòng bạn. Nâng cấp cơ sở vật
              chất? Liên hệ Gym Master để được khảo sát xếp hạng lại.
            </p>
          </section>

          {/* Gói tập được vào */}
          <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase text-chalk">
                <Package className="size-5 text-neon" /> Gói tập được vào phòng bạn
              </h2>
              <Badge variant="outline">
                {p.eligiblePackages.length}/{p.totalActivePackages} gói
              </Badge>
            </div>
            {!p.gymTier ? (
              <p className="rounded-xl border border-dashed border-line p-4 text-xs text-muted">
                Cơ sở chưa được xếp hạng nên chưa nhận hội viên gói Gym Master. Gym Master sẽ xếp
                hạng sau khi đánh giá cơ sở vật chất.
              </p>
            ) : p.eligiblePackages.length ? (
              <ul className="max-h-80 divide-y divide-line overflow-y-auto rounded-xl border border-line">
                {p.eligiblePackages.map((pkg) => (
                  <li key={pkg.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-chalk">{pkg.name}</p>
                      <p className="text-[11px] text-muted">
                        {pkg.type === 'CREDIT_BASED'
                          ? `${pkg.visitLimit ?? '?'} lượt / ${pkg.durationDays} ngày`
                          : `${pkg.durationDays} ngày${pkg.visitLimit ? ` · ${pkg.visitLimit} lượt/tháng` : ''}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-chalk">
                      {formatCurrency(pkg.price)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">Chưa có gói tập nào bao gồm hạng phòng này.</p>
            )}
            <p className="text-[11px] text-muted">
              Hội viên dùng gói khác sẽ bị từ chối khi check-in tại cơ sở của bạn.
            </p>
          </section>
        </div>
      )}

      {isCommunity && (
        <section className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-5">
          <Percent className="mt-0.5 size-5 shrink-0 text-neon" />
          <div>
            <h2 className="font-display text-lg font-bold uppercase text-chalk">
              Hoa hồng {Math.round(p.commissionRate * 1000) / 10}% mỗi lượt
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Mỗi lượt hội viên Gym Master check-in tại cơ sở, bạn nhận{' '}
              {Math.round(p.commissionRate * 1000) / 10}% giá trị 1 ngày của gói hội viên đó. Xem
              chi tiết tại{' '}
              <Link
                href="/admin/finance"
                className="inline-flex items-center gap-1 text-neon hover:underline"
              >
                <Wallet className="size-3" /> Tài chính cơ sở
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      {isCommunity && <NetworkMembersSection />}

      <Dialog
        open={renewOpen}
        onClose={() => !renew.isPending && setRenewOpen(false)}
        title="Gửi yêu cầu gia hạn"
        description={`Hợp đồng hiện tại hết hạn ${formatDate(p.contractEndAt)}`}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            renew.mutate();
          }}
        >
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Gia hạn thêm
            </legend>
            <div className="grid grid-cols-4 gap-2">
              {RENEW_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={months === m}
                  onClick={() => setMonths(m)}
                  className={cn(
                    'rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors',
                    months === m
                      ? 'border-neon bg-neon/10 text-neon'
                      : 'border-line bg-ink text-chalk hover:border-neon/40',
                  )}
                >
                  {m} tháng
                </button>
              ))}
            </div>
          </fieldset>
          {fee > 0 && (
            <p className="rounded-xl border border-line bg-ink p-3 text-sm text-muted">
              Phí dự kiến: <strong className="text-neon">{formatCurrency(fee * months)}</strong> (
              {months} × {formatCurrency(fee)})
            </p>
          )}
          <Textarea
            label="Ghi chú cho Gym Master"
            name="renewal-note"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="VD: Muốn chuyển khoản trong tuần này, liên hệ qua Zalo."
          />
          <p className="text-[11px] text-muted">
            Yêu cầu được gửi tới quản trị viên. Hợp đồng chỉ được gia hạn sau khi Gym Master xác
            nhận thanh toán.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={renew.isPending}
              onClick={() => setRenewOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={renew.isPending}>
              <Send className="size-4" /> Gửi yêu cầu
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

/**
 * Hội viên Gym Master đã tập tại cơ sở (12 tháng). Hồ sơ thuộc nền tảng — đối tác chỉ thấy
 * mã, tên, gói, số lượt và hoa hồng; hội viên riêng của phòng quản lý ở trang Hội viên.
 */
function NetworkMembersSection() {
  const query = useQuery({
    queryKey: ['partner-network-members'],
    queryFn: partnerApi.getMyNetworkMembers,
  });

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase text-chalk">
            <Users className="size-5 text-neon" /> Hội viên Gym Master đã tập tại cơ sở
          </h2>
          <p className="mt-1 text-xs text-muted">
            12 tháng gần nhất. Hồ sơ do Gym Master quản lý — bạn chỉ thấy thông tin phục vụ lượt
            tập.
          </p>
        </div>
        {query.data && (
          <Badge variant="outline">
            {query.data.memberCount} hội viên · {query.data.visitCount} lượt
          </Badge>
        )}
      </div>

      {query.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : query.isError || !query.data ? (
        <ErrorState
          title="Không tải được danh sách"
          description="Vui lòng thử lại sau."
          onRetry={() => query.refetch()}
        />
      ) : query.data.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-4 text-xs text-muted">
          Chưa có hội viên Gym Master nào check-in tại cơ sở của bạn.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-ink text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Hội viên</th>
                <th className="px-3 py-2 font-semibold">Gói hiện tại</th>
                <th className="px-3 py-2 text-right font-semibold">Lượt tập</th>
                <th className="px-3 py-2 font-semibold">Lần gần nhất</th>
                <th className="px-3 py-2 text-right font-semibold">Hoa hồng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {query.data.items.map((row) => (
                <tr key={row.memberId}>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-chalk">{row.fullName}</p>
                    <p className="text-[11px] text-muted">{row.code}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-chalk">
                    {row.packageName ?? <span className="text-muted">Hết hạn</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-chalk">
                    {row.visitCount}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted">
                    {formatDateTime(row.lastVisitAt)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-neon">
                    {formatCurrency(Number(row.commission))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-ink p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
