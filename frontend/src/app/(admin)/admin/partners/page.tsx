'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, FilterX, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { partnerApi } from '@/services/partner.service';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { PARTNER_STATUS_META } from '@/lib/status';
import { formatDate } from '@/lib/utils';

const LIMIT = 20;
const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...Object.entries(PARTNER_STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
];

export default function AdminPartnersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [applied, setApplied] = useState({ search: '', status: '' });

  const query = useQuery({
    queryKey: ['admin-partners', page, applied],
    queryFn: () => partnerApi.adminList({ page, limit: LIMIT, ...applied }),
    retry: 1,
  });

  const list = query.data?.data || [];
  const totalPages = Math.max(1, Math.ceil((query.data?.total || 0) / LIMIT));
  const counts = list.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
          <Building2 className="size-6 text-neon" /> Đối tác phòng gym
        </h1>
        <p className="mt-1 text-xs text-muted">
          Xem hồ sơ đăng ký, kiểm tra thông tin doanh nghiệp và duyệt / từ chối / tạm khóa đối tác.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          title="Tổng trong trang"
          value={list.length}
          subtitle={`${query.data?.total || 0} hồ sơ khớp bộ lọc`}
          icon={Building2}
        />
        {Object.entries(PARTNER_STATUS_META)
          .slice(0, 3)
          .map(([key, meta]) => (
            <StatCard
              key={key}
              title={meta.label}
              value={counts[key] || 0}
              subtitle="Trong trang hiện tại"
              icon={Building2}
            />
          ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
            <Input
              label="Tìm kiếm"
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên doanh nghiệp, email, điện thoại, MST…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  setApplied({ search: search.trim(), status });
                }
              }}
            />
            <Select
              label="Trạng thái"
              name="status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
            <div className="flex items-end gap-2">
              <Button
                onClick={() => {
                  setPage(1);
                  setApplied({ search: search.trim(), status });
                }}
              >
                <Search className="size-4" /> Lọc
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setStatus('');
                  setPage(1);
                  setApplied({ search: '', status: '' });
                }}
              >
                <FilterX className="size-4" /> Xóa
              </Button>
            </div>
          </div>

          {query.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : query.isError ? (
            <ErrorState
              description="Không tải được danh sách đối tác."
              onRetry={() => query.refetch()}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-ink/70 text-[11px] uppercase tracking-wider text-muted">
                    <tr className="border-b border-line">
                      <th className="p-3 font-semibold">Doanh nghiệp</th>
                      <th className="p-3 font-semibold">Chủ sở hữu</th>
                      <th className="p-3 font-semibold">Liên hệ</th>
                      <th className="p-3 font-semibold">Mã số thuế</th>
                      <th className="p-3 font-semibold">Chi nhánh</th>
                      <th className="p-3 font-semibold">Ngày đăng ký</th>
                      <th className="p-3 font-semibold text-center">Trạng thái</th>
                      <th className="p-3 font-semibold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {list.length ? (
                      list.map((p) => {
                        const meta = PARTNER_STATUS_META[p.status] || {
                          label: p.status,
                          variant: 'outline' as const,
                        };
                        return (
                          <tr key={p.id} className="transition-colors hover:bg-surface/50">
                            <td className="p-3">
                              <p className="font-semibold text-chalk">{p.businessName}</p>
                              <p className="max-w-[260px] truncate text-xs text-muted">
                                {p.address || 'Chưa có địa chỉ'}
                              </p>
                            </td>
                            <td className="p-3 text-chalk">{p.user?.fullName || '—'}</td>
                            <td className="p-3 text-xs text-muted">
                              <p>{p.email || '—'}</p>
                              <p>{p.phone || '—'}</p>
                            </td>
                            <td className="p-3 text-xs text-muted">{p.taxCode || '—'}</td>
                            <td className="p-3 text-chalk">{p._count?.branches ?? 0}</td>
                            <td className="p-3 text-xs text-muted">{formatDate(p.createdAt)}</td>
                            <td className="p-3 text-center">
                              <Badge variant={meta.variant}>{meta.label}</Badge>
                            </td>
                            <td className="p-3 text-right">
                              <Link href={`/admin/partners/${p.id}`}>
                                <Button variant="secondary" size="sm">
                                  <Eye className="size-3.5" /> Xem
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-xs text-muted">
                          Không có đối tác nào khớp bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted">
                  Trang {page} / {totalPages} · {query.data?.total || 0} hồ sơ
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-3.5" /> Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
