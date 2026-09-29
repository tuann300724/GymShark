'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { branchApi } from '@/services/branch.service';
import { getStoredUser } from '@/lib/auth';
import { BRANCH_STATUS_META } from '@/lib/status';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  Building2,
  Plus,
  Phone,
  MapPin,
  Clock,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  ArrowRight,
  LayoutGrid,
  Users,
  Dumbbell,
} from 'lucide-react';
import type { Branch } from '@/services/types';

const canManage = () => {
  const user = getStoredUser();
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
};

interface BranchFormState {
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  openingHours: string;
  description: string;
}

const emptyForm: BranchFormState = {
  code: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  openingTime: '',
  closingTime: '',
  openingHours: '',
  description: '',
};

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const [manage] = useState(canManage);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormState>(emptyForm);
  const [formError, setFormError] = useState('');

  const {
    data: branches,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['branches-list'],
    queryFn: branchApi.list,
  });

  // Reset form khi mở dialog
  useEffect(() => {
    if (!dialogOpen) return;
    if (editing) {
      setForm({
        code: editing.code,
        name: editing.name,
        address: editing.address,
        phone: editing.phone,
        email: editing.email || '',
        openingTime: editing.openingTime || '',
        closingTime: editing.closingTime || '',
        openingHours: editing.openingHours || '',
        description: editing.description || '',
      });
    } else {
      setForm(emptyForm);
    }
    setFormError('');
  }, [dialogOpen, editing]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['branches-list'] });
    queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['reports-branches'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.code.trim() || !form.name.trim() || !form.address.trim() || !form.phone.trim()) {
        throw new Error('Vui lòng điền đủ mã, tên, địa chỉ và số điện thoại.');
      }
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        description: form.description.trim() || undefined,
        openingTime: form.openingTime || undefined,
        closingTime: form.closingTime || undefined,
        openingHours: form.openingHours.trim() || undefined,
      };
      if (editing) return branchApi.update(editing.id, payload);
      return branchApi.create(payload);
    },
    onSuccess: (data) => {
      toast.success(editing ? 'Đã cập nhật chi nhánh' : 'Đã tạo chi nhánh mới', data?.message);
      setDialogOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thao tác thất bại.';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      branchApi.setStatus(id, status),
    onSuccess: (data) => {
      toast.success(data?.message || 'Đã đổi trạng thái chi nhánh.');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Không thể đổi trạng thái.';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => branchApi.remove(id),
    onSuccess: (data) => {
      toast.success('Đã xóa chi nhánh', data?.message);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Không thể xóa chi nhánh.';
      toast.error('Không thể xóa', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const setField = (key: keyof BranchFormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <Building2 className="size-6 text-neon" />
            Hệ Thống Chi Nhánh
          </h1>
          <p className="text-xs text-muted mt-1">
            Quản lý mạng lưới phòng tập, phòng tập (Room) và trạng thái hoạt động từng chi nhánh
          </p>
        </div>
        {manage && (
          <Button
            variant="primary"
            size="md"
            className="font-semibold text-xs"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4 mr-1.5" />
            Mở Thêm Chi Nhánh
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-20 text-center text-xs text-danger">Lỗi kết nối API chi nhánh.</div>
      ) : branches && branches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map((branch) => {
            const meta = BRANCH_STATUS_META[branch.status] || {
              label: branch.status,
              variant: 'outline',
            };
            return (
              <Card key={branch.id} className="flex flex-col">
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base font-bold text-chalk flex items-center gap-2">
                      <Building2 className="size-4 text-neon shrink-0" />
                      <span className="truncate">{branch.name}</span>
                    </CardTitle>
                    <CardDescription className="mt-0.5 font-mono text-[11px] text-neon">
                      {branch.code}
                    </CardDescription>
                  </div>
                  <Badge variant={meta.variant as any}>{meta.label}</Badge>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-1.5 text-xs text-muted">
                    <p className="flex items-start gap-2">
                      <MapPin className="size-3.5 text-muted shrink-0 mt-0.5" />
                      <span>{branch.address}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="size-3.5 text-muted shrink-0" />
                      {branch.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="size-3.5 text-muted shrink-0" />
                      {branch.openingHours ||
                        `${branch.openingTime || '--:--'} - ${branch.closingTime || '--:--'}`}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-line bg-ink py-2">
                      <p className="text-lg font-bold text-chalk font-display">
                        {branch._count?.members ?? 0}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted">Hội viên</p>
                    </div>
                    <div className="rounded-lg border border-line bg-ink py-2">
                      <p className="text-lg font-bold text-chalk font-display">
                        {branch._count?.rooms ?? 0}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted">Phòng</p>
                    </div>
                    <div className="rounded-lg border border-line bg-ink py-2">
                      <p className="text-lg font-bold text-chalk font-display">
                        {branch._count?.equipment ?? 0}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted">Thiết bị</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link href={`/admin/branches/${branch.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full text-xs">
                        Chi tiết & Phòng <ArrowRight className="size-3.5 ml-1" />
                      </Button>
                    </Link>
                    {manage && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setEditing(branch);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        {branch.status === 'ACTIVE' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-amber-400 hover:text-amber-300"
                            title="Ngừng hoạt động (chặn check-in & buổi tập mới)"
                            isLoading={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: branch.id, status: 'INACTIVE' })
                            }
                          >
                            <PowerOff className="size-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-neon"
                            title="Kích hoạt lại chi nhánh"
                            isLoading={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: branch.id, status: 'ACTIVE' })
                            }
                          >
                            <Power className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-danger hover:text-danger"
                          title="Xóa chi nhánh (chỉ khi không còn dữ liệu)"
                          isLoading={deleteMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Xóa chi nhánh ${branch.name}? Chỉ áp dụng khi không còn dữ liệu liên quan.`,
                              )
                            ) {
                              deleteMutation.mutate(branch.id);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-sm text-muted">
          <Building2 className="mx-auto size-10 text-muted/40 mb-3" />
          Chưa có chi nhánh nào. {manage && 'Nhấn "Mở Thêm Chi Nhánh" để bắt đầu.'}
        </div>
      )}

      {/* Edit / Create Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!saveMutation.isPending) setDialogOpen(false);
        }}
        title={editing ? 'Cập nhật chi nhánh' : 'Mở chi nhánh mới'}
        description={
          editing
            ? 'Chỉnh sửa thông tin cơ bản của chi nhánh.'
            : 'Điền thông tin chi nhánh mới (mã code duy nhất, không dấu).'
        }
        className="max-w-xl"
      >
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Mã chi nhánh *"
            value={form.code}
            onChange={(e) => setField('code', e.target.value.toUpperCase())}
            placeholder="VD: BR-HCM02"
            disabled={!!editing}
            className="font-mono"
          />
          <Input
            label="Tên chi nhánh *"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="VD: GymMaster - Gò Vấp"
          />
          <div className="sm:col-span-2">
            <Input
              label="Địa chỉ *"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              placeholder="Số nhà, đường, phường, quận..."
            />
          </div>
          <Input
            label="Số điện thoại *"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="028.3895.1234"
          />
          <Input
            label="Email liên hệ"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="govap@gymmaster.vn"
          />
          <Input
            label="Giờ mở cửa (HH:mm)"
            value={form.openingTime}
            onChange={(e) => setField('openingTime', e.target.value)}
            placeholder="05:30"
          />
          <Input
            label="Giờ đóng cửa (HH:mm)"
            value={form.closingTime}
            onChange={(e) => setField('closingTime', e.target.value)}
            placeholder="22:00"
          />
          <div className="sm:col-span-2">
            <Input
              label="Giờ mở cửa (mô tả)"
              value={form.openingHours}
              onChange={(e) => setField('openingHours', e.target.value)}
              placeholder="05:30 - 22:00 (Tất cả các ngày)"
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Mô tả"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Mô tả ngắn về cơ sở vật chất..."
            />
          </div>
        </div>

        {formError && (
          <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {formError}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(false)}
            disabled={saveMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {editing ? 'Lưu thay đổi' : 'Tạo chi nhánh'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
