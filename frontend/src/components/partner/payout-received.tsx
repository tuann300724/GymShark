'use client';

import React from 'react';
import { BadgeCheck, Clock, HandCoins } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { PayoutHistoryCard } from '@/components/payout/payout-history';
import { partnerApi } from '@/services/partner.service';
import type { PartnerCommissionSummary, PartnerPayoutRecord } from '@/services/types';
import { formatCurrency, formatDate } from '@/lib/utils';

function periodLabel(p: PartnerPayoutRecord) {
  if (!p.periodFrom && !p.periodTo) return 'Mọi lượt chưa chi';
  if (p.periodFrom && p.periodTo) return `${formatDate(p.periodFrom)} – ${formatDate(p.periodTo)}`;
  return p.periodFrom ? `Từ ${formatDate(p.periodFrom)}` : `Đến ${formatDate(p.periodTo!)}`;
}

/** Đối tác Gym Cộng đồng: hoa hồng Gym Master đã chuyển, còn chờ chuyển, và từng lần chuyển */
export function PayoutReceived({ commission }: { commission?: PartnerCommissionSummary }) {
  const payouts = commission?.payouts ?? [];
  const received = Number(commission?.received ?? 0);
  const pending = Number(commission?.pending ?? 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Đã nhận"
          value={formatCurrency(received)}
          subtitle={`${payouts.length} lần Gym Master chuyển khoản`}
          icon={BadgeCheck}
          colorScheme="neon"
        />
        <StatCard
          title="Chờ Gym Master chuyển"
          value={formatCurrency(pending)}
          subtitle={`${commission?.pendingVisits ?? 0} lượt chưa được chi`}
          icon={Clock}
          colorScheme="amber"
        />
        <StatCard
          title="Tổng hoa hồng"
          value={formatCurrency(received + pending)}
          subtitle="Đã nhận + chờ chuyển (toàn thời gian)"
          icon={HandCoins}
          colorScheme="blue"
        />
      </div>

      <PayoutHistoryCard
        rows={payouts.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          countLabel: `${p.visitCount} lượt`,
          period: periodLabel(p),
          note: p.note,
          createdAt: p.createdAt,
          hasProof: true,
        }))}
        loadProof={partnerApi.getMyPayoutProof}
        description="Mỗi lần Gym Master chuyển hoa hồng vào tài khoản nhận tiền của bạn, kèm ảnh chứng từ."
        emptyDescription="Khi Gym Master chuyển hoa hồng, khoản tiền sẽ hiện ở đây và bạn nhận thông báo."
      />
    </div>
  );
}
