'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { trainerApi } from '@/services/trainer.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { ASSIGNMENT_STATUS_META } from '@/lib/status';
import { Users, Phone, CalendarDays, Search, UserRound, Award } from 'lucide-react';
import { useState } from 'react';

export default function TrainerMembersPage() {
  const [query, setQuery] = useState('');

  const {
    data: assignments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['trainer-me-members'],
    queryFn: trainerApi.myMembers,
    retry: 0,
  });

  const active = (assignments || []).filter((a) => a.status === 'ACTIVE');
  const history = (assignments || []).filter((a) => a.status !== 'ACTIVE');

  const filtered = active.filter((a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      a.member?.fullName?.toLowerCase().includes(q) ||
      a.member?.code?.toLowerCase().includes(q) ||
      a.member?.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Hội viên phụ trách
        </h1>
        <p className="mt-1 text-sm text-muted">
          Danh sách hội viên đang được bạn huấn luyện ({active.length} hội viên).
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên, mã hội viên, SĐT..."
          className="h-11 w-full rounded-sm border border-line bg-ink pl-9 pr-3.5 text-sm text-chalk placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-14 text-center text-xs text-danger">
            Không tải được danh sách hội viên.
          </CardContent>
        </Card>
      ) : active.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <UserRound className="mx-auto size-10 text-muted/50" />
            <p className="mt-3 text-sm text-muted">
              Bạn chưa được gán cho hội viên nào. Liên hệ quản trị viên để bắt đầu huấn luyện.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((a) => {
              const membership = a.member?.memberships?.find((m) => m.status === 'ACTIVE');
              return (
                <Card key={a.id} className="overflow-hidden border-neon/25">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-neon/15 text-lg font-bold uppercase text-neon">
                        {a.member?.fullName?.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-chalk">
                            {a.member?.fullName}
                          </p>
                          <Badge variant="outline">{a.member?.code}</Badge>
                        </div>
                        {membership && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-neon">
                            <Award className="size-3.5" /> {membership.package?.name}
                          </p>
                        )}
                        {!membership && (
                          <p className="mt-1 text-xs font-semibold text-amber-400">
                            Gói tập đã hết hạn — hãy nhắc hội viên gia hạn.
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                          {a.member?.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="size-3.5" /> {a.member.phone}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3.5" /> Phụ trách từ{' '}
                            {formatDate(a.startDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted">
                Không tìm thấy hội viên nào khớp với từ khóa.
              </CardContent>
            </Card>
          )}

          {/* History */}
          {history.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-chalk">
                <Users className="size-5 text-neon" />
                Đã kết thúc ({history.length})
              </h2>
              <div className="space-y-2">
                {history.slice(0, 6).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-chalk">
                        {a.member?.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(a.startDate)} → {a.endDate ? formatDate(a.endDate) : 'hiện tại'}
                      </p>
                    </div>
                    <Badge variant={ASSIGNMENT_STATUS_META[a.status]?.variant || 'outline'}>
                      {ASSIGNMENT_STATUS_META[a.status]?.label || a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
