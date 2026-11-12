'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Search, UserCog, UserPlus, UserRound, UserRoundX, UserRoundCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateStaffAccountDialog } from '@/components/admin/create-staff-account-dialog';
import { useToast } from '@/components/ui/toast';
import apiClient from '@/lib/axios';
import { formatDate } from '@/lib/utils';

interface StaffAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: 'STAFF';
  status: string;
  createdAt: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) {
      return message.filter((item) => typeof item === 'string').join(', ');
    }
  }
  return error instanceof Error ? error.message : 'Vui lòng thử lại.';
}

export default function StaffAccountsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);

  const staffQuery = useQuery({
    queryKey: ['staff-accounts', search],
    queryFn: async () => {
      const response = await apiClient.get<StaffAccount[]>('/users/staff', {
        params: search ? { search } : undefined,
      });
      return response.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      const response = await apiClient.patch(`/users/staff/${id}/status`, { status });
      return response.data;
    },
    onSuccess: (_result, variables) => {
      toast.success(
        variables.status === 'ACTIVE' ? 'Đã mở tài khoản nhân viên' : 'Đã khóa tài khoản nhân viên',
      );
      queryClient.invalidateQueries({ queryKey: ['staff-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['staff-shift-options'] });
    },
    onError: (error) => toast.error('Cập nhật trạng thái thất bại', getErrorMessage(error)),
  });

  const staff = staffQuery.data ?? [];
  const filteredStaff = staff.filter(
    (account) => statusFilter === 'ALL' || account.status === statusFilter,
  );
  const activeCount = staff.filter((account) => account.status === 'ACTIVE').length;
  const inactiveCount = staff.length - activeCount;

  const searchStaff = () => setSearch(searchInput.trim());

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
            <UserCog className="size-6 text-neon" />
            Tài khoản nhân viên
          </h1>
          <p className="mt-1 text-xs text-muted">
            Tra cứu, lọc và khóa hoặc kích hoạt lại tài khoản STAFF.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 size-4" />
          Tạo tài khoản
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-ink text-neon">
              <UserRound className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted">Tổng nhân viên</p>
              <p className="font-display text-2xl font-bold text-chalk">{staff.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-ink text-neon">
              <UserRoundCheck className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted">Đang hoạt động</p>
              <p className="font-display text-2xl font-bold text-chalk">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-ink text-muted">
              <UserRoundX className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted">Đã khóa / ngừng hoạt động</p>
              <p className="font-display text-2xl font-bold text-chalk">{inactiveCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') searchStaff();
              }}
              placeholder="Tìm theo tên, email hoặc số điện thoại"
              className="h-11 w-full rounded-[10px] border border-line bg-ink pl-9 pr-4 text-sm text-chalk placeholder:text-muted/70 focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
            />
          </div>
          <Button variant="outline" onClick={searchStaff}>
            Tìm kiếm
          </Button>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'INACTIVE', label: 'Đã khóa' },
            ]}
            className="sm:w-52"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {staffQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : staffQuery.isError ? (
          <ErrorState
            className="m-4"
            title="Không tải được tài khoản nhân viên"
            description={getErrorMessage(staffQuery.error)}
            onRetry={() => staffQuery.refetch()}
          />
        ) : filteredStaff.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title={staff.length === 0 ? 'Chưa có tài khoản nhân viên' : 'Không tìm thấy nhân viên'}
            description={
              staff.length === 0
                ? 'Tạo tài khoản STAFF để phân ca và cấp quyền sử dụng hệ thống.'
                : 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.'
            }
            action={
              staff.length === 0 ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <UserPlus className="mr-2 size-4" />
                  Tạo tài khoản nhân viên
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-ink text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nhân viên</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Điện thoại</th>
                  <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredStaff.map((account) => {
                  const isActive = account.status === 'ACTIVE';
                  const nextStatus = isActive ? 'INACTIVE' : 'ACTIVE';
                  return (
                    <tr key={account.id} className="transition-colors hover:bg-line/20">
                      <td className="px-4 py-3 font-semibold text-chalk">{account.fullName}</td>
                      <td className="px-4 py-3 text-muted">{account.email}</td>
                      <td className="px-4 py-3 text-muted">{account.phone || '—'}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(account.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={isActive ? 'success' : 'outline'}>
                          {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant={isActive ? 'outline' : 'secondary'}
                          disabled={statusMutation.isPending}
                          onClick={() => {
                            const action = isActive ? 'khóa' : 'mở lại';
                            if (
                              window.confirm(
                                `Bạn có chắc muốn ${action} tài khoản ${account.fullName}?`,
                              )
                            ) {
                              statusMutation.mutate({ id: account.id, status: nextStatus });
                            }
                          }}
                        >
                          {isActive ? (
                            <>
                              <UserRoundX className="mr-1.5 size-4" />
                              Khóa tài khoản
                            </>
                          ) : (
                            <>
                              <UserRoundCheck className="mr-1.5 size-4" />
                              Mở tài khoản
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateStaffAccountDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
