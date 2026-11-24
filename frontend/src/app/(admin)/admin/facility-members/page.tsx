'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, ChevronLeft, ChevronRight, QrCode } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { getFacilityMembers } from '@/services/checkin.service';
import { formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 20;

export default function FacilityMembersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['facility-members', search, page],
    queryFn: () =>
      getFacilityMembers({ search: search.trim() || undefined, page, limit: PAGE_SIZE }),
    retry: 0,
  });
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header>
        <p className="meta-label">Vận hành cơ sở</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight text-chalk">
          Hội viên tại cơ sở
        </h1>
        <p className="mt-1 text-sm text-muted">
          Danh sách chỉ gồm hội viên đã từng check-in tại cơ sở này.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              aria-label="Tìm hội viên tại cơ sở"
              placeholder="Tìm theo tên, mã hội viên hoặc số điện thoại"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Users className="size-4" /> {query.data?.total ?? 0} hội viên đã từng đến
          </div>
        </CardContent>
      </Card>

      {query.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          title="Không tải được danh sách hội viên"
          description="Vui lòng thử tải lại."
          onRetry={() => query.refetch()}
        />
      ) : query.data?.data.length ? (
        <>
          <Card>
            <div className="divide-y divide-line">
              {query.data.data.map((member) => (
                <div
                  key={member.id}
                  className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-chalk">{member.fullName}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {member.code}
                      {member.phone ? ` · ${member.phone}` : ''}
                    </p>
                  </div>
                  <p className="text-sm text-muted">{member.visitCount} lượt check-in</p>
                  <p className="text-xs text-muted">
                    Gần nhất: {member.lastVisit ? formatDateTime(member.lastVisit) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              Trang {page} / {pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                aria-label="Trang trước"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((value) => value + 1)}
                aria-label="Trang sau"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="Chưa có hội viên ghi nhận tại cơ sở"
          description="Lượt check-in mới sẽ tự động được lưu vào danh sách này."
          action={
            <Link
              href="/admin/checkins"
              className="inline-flex h-10 items-center gap-2 border border-line px-4 text-sm font-semibold text-chalk hover:border-neon/60 hover:text-neon"
              style={{ borderRadius: 10 }}
            >
              <QrCode className="size-4" />
              Mở trang check-in
            </Link>
          }
        />
      )}
    </div>
  );
}
