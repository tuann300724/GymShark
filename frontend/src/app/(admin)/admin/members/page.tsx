'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { MemberCreateDialog } from '@/components/admin/member-create-dialog';
import { MemberPackageDialog } from '@/components/admin/member-package-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import { MEMBERSHIP_STATUS_META } from '@/lib/status';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Pencil,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

const DEFAULT_STATUS = 'ALL';
const LIMIT = 10;

export default function MembersPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS);
  const [membershipStatus, setMembershipStatus] = useState(DEFAULT_STATUS);
  const [packageId, setPackageId] = useState(DEFAULT_STATUS);
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [showCreate, setShowCreate] = useState(false);

  // Đăng ký gói cho hội viên có sẵn tại quầy
  const [cardTarget, setCardTarget] = useState<any>(null);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, membershipStatus, packageId, sort]);

  // Danh sách gói để lọc
  const { data: packages } = useQuery({
    queryKey: ['membership-packages'],
    queryFn: async () => {
      const res = await apiClient.get('/membership-packages');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-members', search, statusFilter, membershipStatus, packageId, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set('search', search);
      if (statusFilter !== DEFAULT_STATUS) params.set('status', statusFilter);
      if (membershipStatus !== DEFAULT_STATUS) params.set('membershipStatus', membershipStatus);
      if (packageId !== DEFAULT_STATUS) params.set('packageId', packageId);
      if (sort) params.set('sort', sort);
      const res = await apiClient.get(`/members?${params.toString()}`);
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`/members/${id}`, { status });
      return res.data;
    },
    onSuccess: (res: any, vars) => {
      toast.success(
        'Cập nhật trạng thái thành công',
        `Hội viên ${vars.status === 'SUSPENDED' ? 'đã bị khóa' : 'đã được kích hoạt'}.`,
      );
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Cập nhật trạng thái thất bại';
      toast.error('Cập nhật thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.patch(`/members/${payload.id}`, payload.data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Cập nhật thành công', 'Thông tin hội viên đã được lưu.');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Cập nhật thất bại';
      toast.error('Cập nhật thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      fullName: m.fullName || '',
      phone: m.phone || '',
      email: m.email || '',
      gender: m.gender || 'MALE',
      dateOfBirth: m.dateOfBirth ? m.dateOfBirth.slice(0, 10) : '',
      address: m.address || '',
      emergencyContact: m.emergencyContact || '',
      notes: m.notes || '',
      status: m.status || 'ACTIVE',
    });
  };

  const submitEdit = () => {
    if (!editing) return;
    const payload: any = {};
    (Object.keys(form) as (keyof typeof form)[]).forEach((k) => {
      if (form[k] !== '' && form[k] !== undefined) payload[k] = form[k];
    });
    updateMutation.mutate({ id: editing.id, data: payload });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk flex items-center gap-2">
            <Users className="size-6 text-neon" />
            Quản Lý Hội Viên
          </h1>
          <p className="text-xs text-muted mt-1">
            Tìm kiếm, lọc, khóa/kích hoạt tài khoản hội viên ({data?.total ?? 0} hội viên)
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          className="font-semibold text-xs"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="size-4 mr-1.5" />
          Đăng ký Hội viên mới
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1 w-full">
              <Search className="size-4 text-muted absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã thẻ, email, số điện thoại..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSearch(searchInput.trim());
                }}
                className="w-full pl-9 pr-24 py-2 text-xs rounded-sm border border-line bg-ink text-chalk placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70"
              />
              <Button
                variant="primary"
                size="sm"
                className="absolute right-1.5 top-1.5 h-7 text-xs"
                onClick={() => setSearch(searchInput.trim())}
              >
                Tìm
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted shrink-0" />
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs"
                  options={[
                    { value: 'ALL', label: 'Tất cả trạng thái hội viên' },
                    { value: 'ACTIVE', label: 'Hoạt động' },
                    { value: 'INACTIVE', label: 'Ngừng hoạt động' },
                    { value: 'SUSPENDED', label: 'Bị khóa' },
                    { value: 'EXPIRED', label: 'Hết hạn' },
                  ]}
                />
              </div>
              <Select
                value={membershipStatus}
                onChange={(e) => setMembershipStatus(e.target.value)}
                className="text-xs"
                options={[
                  { value: 'ALL', label: 'Tất cả trạng thái thẻ' },
                  { value: 'ACTIVE', label: 'Thẻ đang hoạt động' },
                  { value: 'PENDING', label: 'Thẻ chờ xác nhận' },
                  { value: 'EXPIRED', label: 'Thẻ đã hết hạn' },
                  { value: 'SUSPENDED', label: 'Thẻ tạm khóa' },
                  { value: 'CANCELLED', label: 'Thẻ đã hủy' },
                ]}
              />
              <Select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="text-xs"
                options={[
                  { value: 'ALL', label: 'Tất cả gói tập' },
                  ...(packages || []).map((p: any) => ({
                    value: p.id,
                    label: p.name,
                  })),
                ]}
              />
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-xs"
                options={[
                  { value: 'createdAt', label: 'Mới đăng ký trước' },
                  { value: '-createdAt', label: 'Đăng ký lâu nhất' },
                  { value: 'name', label: 'Tên A→Z' },
                  { value: '-name', label: 'Tên Z→A' },
                  { value: 'code', label: 'Mã thẻ tăng dần' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-xs text-muted">
              <Spinner /> Đang tải danh sách hội viên...
            </div>
          ) : isError ? (
            <ErrorState
              className="m-3"
              title="Không tải được dữ liệu"
              description="Không thể tải danh sách hội viên từ Backend REST API. Vui lòng kiểm tra kết nối API."
              onRetry={() => refetch()}
            />
          ) : data?.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1128px] text-left text-sm table-fixed">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="w-[104px] py-3 px-4 font-semibold whitespace-nowrap">Mã HV</th>
                    <th className="py-3 px-4 font-semibold">Họ và Tên</th>
                    <th className="w-[176px] py-3 px-4 font-semibold whitespace-nowrap">
                      Số điện thoại
                    </th>
                    <th className="w-[206px] py-3 px-4 font-semibold">Gói tập</th>
                    <th className="w-[110px] py-3 px-4 font-semibold whitespace-nowrap">
                      Ngày đăng ký
                    </th>
                    <th className="w-[156px] py-3 px-4 font-semibold">Trạng thái</th>
                    <th className="w-[208px] py-3 px-4 font-semibold text-right whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {data.data.map((m: any) => {
                    const latestMs = m.memberships?.[0];
                    const activePkg = latestMs?.package?.name || 'Chưa đăng ký gói';
                    return (
                      <tr key={m.id} className="hover:bg-line/30 transition-colors">
                        <td className="py-3 px-4 align-middle font-mono font-bold text-neon whitespace-nowrap">
                          {m.code}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <p className="font-semibold text-chalk truncate" title={m.fullName}>
                            {m.fullName}
                          </p>
                          <p
                            className="text-[11px] text-muted truncate"
                            title={m.email || undefined}
                          >
                            {m.email || 'Không có email'}
                          </p>
                        </td>
                        <td
                          className="py-3 px-4 align-middle text-muted truncate"
                          title={m.phone || undefined}
                        >
                          {m.phone}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex flex-col items-start gap-1.5">
                            <span
                              className="font-semibold text-chalk truncate max-w-full"
                              title={activePkg}
                            >
                              {activePkg}
                            </span>
                            {latestMs && (
                              <Badge
                                variant={
                                  MEMBERSHIP_STATUS_META[latestMs.status]?.variant || 'outline'
                                }
                                className="whitespace-nowrap"
                              >
                                {MEMBERSHIP_STATUS_META[latestMs.status]?.label || latestMs.status}
                              </Badge>
                            )}
                          </div>
                          {!latestMs && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1.5 text-[10px] h-6 px-2 font-medium"
                              onClick={() =>
                                setCardTarget({ id: m.id, code: m.code, fullName: m.fullName })
                              }
                            >
                              <Package className="size-3 mr-1" /> Đăng ký gói
                            </Button>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle text-muted whitespace-nowrap">
                          {formatDate(m.joinedAt)}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Select
                            value={m.status}
                            options={[
                              { value: 'ACTIVE', label: 'Hoạt động' },
                              { value: 'INACTIVE', label: 'Ngừng hoạt động' },
                              { value: 'SUSPENDED', label: 'Bị khóa' },
                              { value: 'EXPIRED', label: 'Hết hạn' },
                            ]}
                            className="text-xs h-9 py-0 bg-ink text-chalk focus:ring-0"
                            disabled={statusMutation.isPending}
                            onChange={(e) =>
                              statusMutation.mutate({ id: m.id, status: e.target.value })
                            }
                          />
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                            <Link href={`/admin/members/${m.id}`} title="Chi tiết">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`Chi tiết hội viên ${m.fullName}`}
                              >
                                <Eye className="size-4 text-muted" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="Sửa"
                              aria-label={`Sửa hội viên ${m.fullName}`}
                              onClick={() => openEdit(m)}
                            >
                              <Pencil className="size-4 text-muted" />
                            </Button>
                            {m.status === 'SUSPENDED' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="font-medium text-xs text-neon"
                                isLoading={statusMutation.isPending}
                                onClick={() =>
                                  statusMutation.mutate({ id: m.id, status: 'ACTIVE' })
                                }
                              >
                                <Unlock className="size-3.5 mr-1" /> Kích hoạt
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="font-medium text-xs text-danger"
                                isLoading={statusMutation.isPending}
                                onClick={() =>
                                  statusMutation.mutate({ id: m.id, status: 'SUSPENDED' })
                                }
                              >
                                <Lock className="size-3.5 mr-1" /> Khóa
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              className="m-3"
              icon={Users}
              title="Không tìm thấy hội viên"
              description="Không có hội viên nào phù hợp với bộ lọc tìm kiếm. Hãy thử từ khóa khác hoặc bỏ bớt điều kiện lọc."
            />
          )}

          {/* Pagination */}
          {data && data.total > 0 && (
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <p className="text-[11px] text-muted">
                Trang {data.page} / {totalPages} • {data.total} hội viên
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  aria-label="Trang trước"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  aria-label="Trang sau"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Cập nhật hội viên"
        description={editing ? `${editing.fullName} (${editing.code})` : ''}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Họ và tên"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Select
              label="Giới tính"
              value={form.gender}
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
                { value: 'OTHER', label: 'Khác' },
              ]}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            />
            <Input
              label="Ngày sinh"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
            <Select
              label="Trạng thái"
              value={form.status}
              options={[
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'INACTIVE', label: 'Ngừng hoạt động' },
                { value: 'SUSPENDED', label: 'Bị khóa' },
                { value: 'EXPIRED', label: 'Hết hạn' },
              ]}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
            <Input
              label="Địa chỉ"
              className="sm:col-span-2"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              label="Người liên hệ khẩn cấp"
              className="sm:col-span-2"
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            />
            <Input
              label="Ghi chú nội bộ"
              className="sm:col-span-2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Hủy
            </Button>
            <Button isLoading={updateMutation.isPending} onClick={submitEdit}>
              <ShieldCheck className="size-4" />
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Đăng ký hội viên mới tại quầy: hồ sơ → gói tập → quét khuôn mặt */}
      <MemberCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['admin-members'] })}
      />

      {/* Đăng ký gói tập cho hội viên đã có sẵn (A — tại quầy) */}
      <MemberPackageDialog
        open={!!cardTarget}
        onClose={() => setCardTarget(null)}
        member={cardTarget}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-members'] })}
      />
    </div>
  );
}
