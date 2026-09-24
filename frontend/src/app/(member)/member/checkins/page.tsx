'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkinApi } from '@/services/checkin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { QrCode, CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Lịch sử check-in
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Các lượt vào/ra phòng tập của bạn.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statItems.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 sm:p-5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <s.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-2.5 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
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
            <p className="py-14 text-center text-sm text-slate-400">
              Chưa có lượt check-in nào. Ghé phòng tập để bắt đầu nhé!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Ngày
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Check-in
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Check-out
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Chi nhánh
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data?.data.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatDate(c.checkInTime)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                          {new Date(c.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {c.checkOutTime ? (
                          <span className="inline-flex items-center gap-1.5">
                            <LogOut className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(c.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{c.branch?.name || '--'}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
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
            <div className="flex items-center justify-between px-4 py-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                Trang {page}/{totalPages} • {data?.total} lượt
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}