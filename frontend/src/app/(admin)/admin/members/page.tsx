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
import { formatDate } from '@/lib/utils';
import { MEMBER_STATUS_META, MEMBERSHIP_STATUS_META } from '@/lib/status';
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

  const { data, isLoading, isError } = useQuery({
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
      const meta = MEMBER_STATUS_META[vars.status];
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
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
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
            <div className="py-16 text-center text-xs text-muted">
              Đang tải danh sách hội viên...
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-xs text-danger">
              Không thể tải dữ liệu hội viên từ Backend REST API. Vui lòng kiểm tra kết nối API.
            </div>
          ) : data?.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Mã HV</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Số điện thoại</th>
                    <th className="py-3 px-4">Gói tập</th>
                    <th className="py-3 px-4">Ngày đăng ký</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {data.data.map((m: any) => {
                    const latestMs = m.memberships?.[0];
                    const activePkg = latestMs?.package?.name || 'Chưa đăng ký gói';
                    const statusMeta = MEMBER_STATUS_META[m.status] || {
                      label: m.status,
                      variant: 'outline',
                    };
                    return (
                      <tr key={m.id} className="hover:bg-line/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-neon">{m.code}</td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-chalk">{m.fullName}</p>
                          <p className="text-[11px] text-muted">{m.email || 'Không có email'}</p>
                        </td>
                        <td className="py-3 px-4 text-muted">{m.phone}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-chalk">{activePkg}</span>
                          {latestMs && (
                            <Badge
                              variant={
                                MEMBERSHIP_STATUS_META[latestMs.status]?.variant || 'outline'
                              }
                              className="ml-2"
                            >
                              {MEMBERSHIP_STATUS_META[latestMs.status]?.label || latestMs.status}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted">{formatDate(m.joinedAt)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/members/${m.id}`}>
                              <Button variant="outline" size="sm" className="font-medium text-xs">
                                <Eye className="size-3.5 mr-1 text-muted" /> Chi tiết
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="font-medium text-xs"
                              onClick={() => openEdit(m)}
                            >
                              <Pencil className="size-3.5 mr-1 text-muted" /> Sửa
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
            <div className="py-16 text-center text-xs text-muted">
              Không tìm thấy hội viên nào phù hợp với bộ lọc tìm kiếm.
            </div>
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
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
    </div>
  );
}
