'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { promotionApi } from '@/services/promotion.service';
import type { PromotionUsageRecord } from '@/services/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { PROMOTION_STATUS_META, PAYMENT_STATUS_META, PAYMENT_METHOD_LABEL } from '@/lib/status';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  CalendarDays,
  Coins,
  Hash,
  Recycle,
  Tag,
  UserRound,
  Wrench,
} from 'lucide-react';

const USAGE_STATUS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'REFUNDED', label: 'Hoàn tiền' },
  { value: 'FAILED', label: 'Thất bại' },
];

const USAGE_METHOD = [
  { value: '', label: 'Mọi phương thức' },
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
  { value: 'MOMO', label: 'MoMo' },
  { value: 'VNPAY', label: 'VNPay' },
];

export default function PromotionDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');

  const { data: promo, isLoading: promoLoading } = useQuery({
    queryKey: ['promotion-detail', id],
    queryFn: () => promotionApi.detail(id),
    enabled: !!id,
    retry: 1,
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['promotion-usages', id, method, status],
    queryFn: () =>
      promotionApi.usages(id, { method: method || undefined, status: status || undefined }),
    enabled: !!id,
    retry: 1,
  });

  if (promoLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!promo) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted">
          Không tìm thấy mã khuyến mãi.
        </CardContent>
      </Card>
    );
  }

  const statusMeta = PROMOTION_STATUS_META[promo.status] || {
    label: promo.status,
    variant: 'outline' as const,
  };
  const usages: PromotionUsageRecord[] = usage?.data || [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/promotions"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-neon"
      >
        <ArrowLeft className="size-3.5" /> Quay lại danh sách khuyến mãi
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="border border-neon/30 bg-neon/10 px-3 py-1.5 font-mono text-lg font-black tracking-wider text-neon">
              {promo.code}
            </span>
            <Badge variant={statusMeta.variant as any}>{statusMeta.label}</Badge>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
            {promo.name}
          </h1>
          {promo.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted">{promo.description}</p>
          )}
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <p className="font-display text-3xl font-black text-neon">
            {promo.discountType === 'PERCENTAGE'
              ? `-${parseFloat(String(promo.discountValue))}%`
              : `-${formatCurrency(promo.discountValue)}`}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {promo.discountType === 'PERCENTAGE' && promo.maxDiscount != null
              ? `Tối đa ${formatCurrency(promo.maxDiscount)}`
              : promo.discountType === 'FIXED_AMOUNT'
                ? 'Giảm tiền cố định'
                : 'Giảm theo phần trăm'}
          </p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <CalendarDays className="size-3.5 text-neon" /> Hiệu lực
            </p>
            <p className="text-sm font-semibold text-chalk">{formatDateTime(promo.startAt)}</p>
            <p className="text-sm font-semibold text-chalk">→ {formatDateTime(promo.endAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <Coins className="size-3.5 text-neon" /> Lượt sử dụng
            </p>
            <p className="text-2xl font-black text-chalk">
              {promo.usage}
              {promo.remaining != null && (
                <span className="text-sm font-semibold text-muted"> / còn {promo.remaining}</span>
              )}
            </p>
            <p className="text-[11px] text-muted">
              {promo.usagePaid} lượt đã thanh toán thành công
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <Hash className="size-3.5 text-neon" /> Giới hạn
            </p>
            <p className="text-sm font-semibold text-chalk">
              {promo.usageLimit != null ? `${promo.usageLimit} lượt tổng` : 'Không giới hạn lượt'}
            </p>
            <p className="text-[11px] text-muted">
              {promo.perMemberLimit != null
                ? `${promo.perMemberLimit} lượt / hội viên`
                : 'Mỗi hội viên dùng thoải mái'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <Recycle className="size-3.5 text-neon" /> Điều kiện đơn
            </p>
            <p className="text-sm font-semibold text-chalk">
              {promo.minOrderAmount != null
                ? formatCurrency(promo.minOrderAmount)
                : 'Không yêu cầu'}
            </p>
            <p className="text-[11px] text-muted">Giá trị đơn tối thiểu để áp dụng mã</p>
          </CardContent>
        </Card>
      </div>

      {/* Usages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-neon" /> Lịch sử dùng mã
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={USAGE_METHOD}
              className="sm:w-48"
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={USAGE_STATUS}
              className="sm:w-48"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-2">
          {usageLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : usages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <Wrench className="size-6 text-line" />
              <p className="text-xs text-muted">Chưa có giao dịch nào dùng mã này.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-semibold">Hóa đơn</th>
                    <th className="px-4 py-3 font-semibold">Hội viên</th>
                    <th className="px-4 py-3 font-semibold">Gói tập</th>
                    <th className="px-4 py-3 font-semibold">Tổng tiền</th>
                    <th className="px-4 py-3 font-semibold">Giảm</th>
                    <th className="px-4 py-3 font-semibold">Phương thức</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {usages.map((u) => {
                    const pm = PAYMENT_STATUS_META[u.status] || {
                      label: u.status,
                      variant: 'outline' as const,
                    };
                    return (
                      <tr key={u.id} className="transition-colors hover:bg-line/20">
                        <td className="px-4 py-3 font-mono text-xs text-neon">{u.paymentCode}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-chalk">{u.member.fullName}</p>
                          <p className="text-[11px] text-muted">{u.member.code}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">{u.packageName || '—'}</td>
                        <td className={cn('px-4 py-3 text-xs font-semibold text-chalk')}>
                          {formatCurrency(u.amount)}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-neon">
                          {u.discountAmount != null ? `-${formatCurrency(u.discountAmount)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {PAYMENT_METHOD_LABEL[u.method] || u.method}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={pm.variant as any}>{pm.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {formatDateTime(u.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center gap-2 border-t border-line px-4 py-3 text-[11px] text-muted">
            <Tag className="size-3.5 text-neon" />
            Tổng giảm giá đã phát sinh:{' '}
            <span className="font-bold text-neon">
              {formatCurrency(usage?.stats.discountTotal ?? 0)}
            </span>
            · {usage?.stats.paidUsage ?? 0} giao dịch đã thanh toán / {usage?.stats.totalUsage ?? 0}{' '}
            lượt giữ chỗ
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
