'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkinApi } from '@/services/checkin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  QrCode,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 8;

export default function MemberCheckinsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['member-checkins', page],
    queryFn: () => checkinApi.getMyCheckins(page, PAGE_SIZE),
    retry: 0,
  });

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));
  const stats = data?.stats;

  const statItems = [
    { label: 'Tổng lượt check-in', value: stats?.total ?? 0, icon: QrCode },
    { label: 'Tháng này', value: stats?.month ?? 0, icon: CalendarCheck },
    { label: 'Tuần này', value: stats?.week ?? 0, icon: CalendarDays },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Lịch sử check-in
        </h1>
        <p className="mt-1 text-sm text-muted">Các lượt vào/ra phòng tập của bạn.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statItems.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex size-9 items-center justify-center rounded-lg border border-neon/25 bg-neon/10">
                <s.icon className="size-4 text-neon" />
              </div>
              <p className="mt-2.5 font-display text-xl font-bold text-chalk sm:text-2xl">
                {s.value}
              </p>
              <p className="mt-0.5 text-[11px] text-muted sm:text-xs">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 sm:p-2">
          {isLoading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (data?.data || []).length === 0 ? (
            <p className="py-14 text-center text-sm text-muted">
              Chưa có lượt check-in nào. Ghé phòng tập để bắt đầu nhé!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Ngày
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Check-in
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Check-out
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Chi nhánh
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data?.data.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-line/30">
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-chalk">
                        {formatDate(c.checkInTime)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <LogIn className="size-3.5 text-neon" />
                          {new Date(c.checkInTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                        {c.checkOutTime ? (
                          <span className="inline-flex items-center gap-1.5">
                            <LogOut className="size-3.5 text-muted" />
                            {new Date(c.checkOutTime).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-muted">{c.branch?.name || '--'}</td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <Badge variant={c.status === 'CHECKED_OUT' ? 'success' : 'info'}>
                          {c.status === 'CHECKED_OUT' ? 'Hoàn tất' : 'Đang tập'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && (data?.total || 0) > 0 && (
            <div className="flex items-center justify-between border-t border-line p-4">
              <p className="text-xs text-muted">
                Trang {page}/{totalPages} • {data?.total} lượt
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
