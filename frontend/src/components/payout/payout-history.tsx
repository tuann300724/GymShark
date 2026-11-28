'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, FileImage, HandCoins } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export interface PayoutHistoryRow {
  id: string;
  amount: number;
  /** "3 lượt" / "2 buổi" */
  countLabel: string;
  /** Kỳ chi (chỉ đối tác) */
  period?: string;
  note: string | null;
  createdAt: string;
  hasProof: boolean;
}

/** Ảnh chứng từ tải khi mở (không kèm trong danh sách để trang nhẹ) */
function ProofDialog({
  row,
  loadProof,
  onClose,
}: {
  row: PayoutHistoryRow;
  loadProof: (id: string) => Promise<{ proofImage: string }>;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['payout-proof', row.id],
    queryFn: () => loadProof(row.id),
  });
  return (
    <Dialog
      open
      onClose={onClose}
      title="Chứng từ chuyển khoản"
      description={`${formatCurrency(row.amount)} · ${row.countLabel} · ${formatDateTime(row.createdAt)}`}
    >
      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : isError || !data ? (
        <p className="py-6 text-center text-sm text-danger">Không tải được ảnh chứng từ.</p>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.proofImage}
          alt={`Ảnh chứng từ Gym Master chuyển ${formatCurrency(row.amount)}`}
          className="mx-auto max-h-[70vh] w-auto rounded-xl border border-line object-contain"
        />
      )}
      {row.note && (
        <p className="mt-3 text-sm text-muted">
          <b className="text-chalk">Ghi chú:</b> {row.note}
        </p>
      )}
    </Dialog>
  );
}

/** Bảng các khoản Gym Master đã chuyển cho đối tác / PT, mỗi dòng xem được ảnh chứng từ */
export function PayoutHistoryCard({
  rows,
  loadProof,
  description,
  emptyDescription,
}: {
  rows: PayoutHistoryRow[];
  loadProof: (id: string) => Promise<{ proofImage: string }>;
  description: string;
  emptyDescription: string;
}) {
  const [viewing, setViewing] = useState<PayoutHistoryRow | null>(null);
  const showPeriod = rows.some((r) => r.period);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg uppercase text-chalk">
          <BadgeCheck className="size-4 text-neon" /> Các khoản đã nhận
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {!rows.length ? (
          <EmptyState
            className="m-4"
            icon={HandCoins}
            title="Chưa có khoản nào"
            description={emptyDescription}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-line bg-ink text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Ngày nhận</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Số tiền</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Gồm</th>
                  {showPeriod && <th className="px-4 py-2.5 font-semibold">Kỳ chi</th>}
                  <th className="px-4 py-2.5 font-semibold">Ghi chú</th>
                  <th className="px-4 py-2.5 text-right font-semibold">
                    <span className="sr-only">Chứng từ</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-line/30">
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                      {formatDateTime(r.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-neon">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-chalk">
                      {r.countLabel}
                    </td>
                    {showPeriod && <td className="px-4 py-2.5 text-muted">{r.period ?? '—'}</td>}
                    <td className="max-w-56 truncate px-4 py-2.5 text-muted" title={r.note ?? ''}>
                      {r.note || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {r.hasProof ? (
                        <Button size="sm" variant="outline" onClick={() => setViewing(r)}>
                          <FileImage className="size-3.5" /> Chứng từ
                        </Button>
                      ) : (
                        <span className="text-xs text-muted">Không có ảnh</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      {viewing && (
        <ProofDialog row={viewing} loadProof={loadProof} onClose={() => setViewing(null)} />
      )}
    </Card>
  );
}
