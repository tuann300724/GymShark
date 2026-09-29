'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, Check, Pencil, Trash2, Power, Ban } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  description: '',
  durationDays: '30',
  price: '',
  sessions: '',
  type: 'FIXED_TERM',
  status: 'ACTIVE',
};

export default function MembershipPackagesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [featureItems, setFeatureItems] = useState<string[]>([
    'Tập luyện không giới hạn khung giờ',
    'Sử dụng tủ đồ và phòng tắm nóng lạnh',
  ]);

  const {
    data: packages,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['membership-packages'],
    queryFn: async () => {
      const res = await apiClient.get('/membership-packages');
      return res.data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['membership-packages'] });
    queryClient.invalidateQueries({ queryKey: ['public-packages'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const body: any = {
        name: payload.name,
        description: payload.description || undefined,
        durationDays: parseInt(payload.durationDays, 10),
        price: parseFloat(payload.price),
        sessions: payload.sessions ? parseInt(payload.sessions, 10) : undefined,
        type: payload.type,
        status: payload.status,
        features: { title: payload.name, items: featureItems },
      };
      if (editingId) {
        const res = await apiClient.patch(`/membership-packages/${editingId}`, body);
        return res.data;
      }
      const res = await apiClient.post('/membership-packages', body);
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        editingId ? 'Cập nhật thành công' : 'Tạo gói thành công',
        `Gói tập ${form.name} đã được lưu.`,
      );
      setDialogOpen(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Thao tác thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg[0]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/membership-packages/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Đã xóa gói tập', 'Gói tập đã được xóa khỏi hệ thống.');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể xóa gói tập';
      toast.error('Không thể xóa', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const toggleStatus = (pkg: any) => {
    const next = pkg.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    apiClient
      .patch(`/membership-packages/${pkg.id}`, { status: next })
      .then(() => {
        toast.success(
          next === 'ACTIVE' ? 'Gói đã mở bán' : 'Gói đã ngừng bán',
          `${pkg.name} ${next === 'ACTIVE' ? 'đã được mở bán lại' : 'đã ngừng bán'}.`,
        );
        invalidate();
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Thao tác thất bại';
        toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
      });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFeatureItems(['Tập luyện không giới hạn khung giờ', 'Sử dụng tủ đồ và phòng tắm nóng lạnh']);
    setDialogOpen(true);
  };

  const openEdit = (pkg: any) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name || '',
      description: pkg.description || '',
      durationDays: String(pkg.durationDays || 30),
      price: String(pkg.price ?? ''),
      sessions: pkg.sessions ? String(pkg.sessions) : '',
      type: pkg.type || 'FIXED_TERM',
      status: pkg.status || 'ACTIVE',
    });
    setFeatureItems(pkg.features?.items || []);
    setDialogOpen(true);
  };

  const confirmDelete = (pkg: any) => {
    if (window.confirm(`Xóa gói tập "${pkg.name}" khỏi hệ thống?`)) {
      deleteMutation.mutate(pkg.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <Package className="size-6 text-neon" />
            Gói Tập Gym (Membership Packages)
          </h1>
          <p className="text-xs text-muted mt-1">
            Thiết lập danh mục các gói tập, thời hạn sử dụng và biểu phí dịch vụ phòng tập
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs" onClick={openCreate}>
          <Plus className="size-4 mr-1.5" />
          Tạo Gói Tập Mới
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted">Đang tải danh sách gói tập...</div>
      ) : isError ? (
        <div className="py-20 text-center text-xs text-danger">
          Không thể tải dữ liệu từ Backend. Hãy đảm bảo Backend đang chạy.
        </div>
      ) : packages && packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg: any) => (
            <Card
              key={pkg.id}
              className={`relative flex flex-col justify-between transition-all ${
                pkg.status === 'ACTIVE' ? 'hover:border-neon/40' : 'opacity-75'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {pkg.code}
                  </Badge>
                  <Badge variant={pkg.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {pkg.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3 text-chalk">{pkg.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {pkg.description || 'Không có mô tả chi tiết'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-ink border border-line">
                  <span className="text-3xl font-extrabold text-neon font-display">
                    {formatCurrency(pkg.price)}
                  </span>
                  <span className="text-xs text-muted block mt-1">
                    Thời hạn: <strong className="text-chalk">{pkg.durationDays} ngày</strong> (
                    {pkg.type === 'FIXED_TERM' ? 'Theo thời hạn' : 'Theo buổi'}
                    {pkg.sessions ? ` • ${pkg.sessions} buổi` : ''})
                  </span>
                  {pkg._count?.memberships > 0 && (
                    <span className="text-[11px] text-muted block mt-1">
                      Đã bán {pkg._count.memberships} thẻ
                    </span>
                  )}
                </div>
                <ul className="text-xs space-y-2 text-muted">
                  {(pkg.features?.items || []).slice(0, 4).map((item: string) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="size-4 text-neon shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="grid w-full grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => openEdit(pkg)}
                  >
                    <Pencil className="size-3.5 mr-1" /> Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => toggleStatus(pkg)}
                  >
                    {pkg.status === 'ACTIVE' ? (
                      <>
                        <Ban className="size-3.5 mr-1" /> Ngừng bán
                      </>
                    ) : (
                      <>
                        <Power className="size-3.5 mr-1 text-neon" /> Mở bán
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold text-danger"
                    isLoading={deleteMutation.isPending}
                    onClick={() => confirmDelete(pkg)}
                  >
                    <Trash2 className="size-3.5 mr-1" /> Xóa
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-xs text-muted">
            Chưa có gói tập nào được khởi tạo. Nhấn Tạo Gói Tập Mới để bắt đầu.
          </CardContent>
        </Card>
      )}

      {/* Create/Edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? 'Chỉnh sửa gói tập' : 'Tạo gói tập mới'}
        description="Mã gói được hệ thống tự sinh"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Tên gói tập *"
              value={form.name}
              placeholder="Ví dụ: Gói Cao Cấp 6 Tháng"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Select
              label="Loại gói"
              value={form.type}
              options={[
                { value: 'FIXED_TERM', label: 'Theo thời hạn (ngày)' },
                { value: 'SESSION_BASED', label: 'Theo buổi tập' },
              ]}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <Input
              label="Thời hạn (ngày) *"
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            />
            <Input
              label="Giá bán (VND) *"
              type="number"
              min={0}
              value={form.price}
              placeholder="450000"
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              label="Số buổi (nếu gói theo buổi)"
              type="number"
              min={0}
              value={form.sessions}
              placeholder="12"
              onChange={(e) => setForm({ ...form, sessions: e.target.value })}
            />
            <Select
              label="Trạng thái"
              value={form.status}
              options={[
                { value: 'ACTIVE', label: 'Đang bán' },
                { value: 'INACTIVE', label: 'Ngừng bán' },
              ]}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
            <Input
              label="Mô tả ngắn"
              className="sm:col-span-2"
              value={form.description}
              placeholder="Tập luyện không giới hạn tại 1 chi nhánh"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Tính năng của gói
            </p>
            <div className="space-y-2">
              {featureItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={item}
                    placeholder="Mô tả tính năng..."
                    onChange={(e) => {
                      const next = [...featureItems];
                      next[idx] = e.target.value;
                      setFeatureItems(next);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFeatureItems(featureItems.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeatureItems([...featureItems, ''])}
              >
                <Plus className="size-3.5 mr-1" /> Thêm tính năng
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              isLoading={saveMutation.isPending}
              disabled={!form.name || !form.price}
              onClick={() => saveMutation.mutate(form)}
            >
              <Check className="size-4" />
              {editingId ? 'Lưu thay đổi' : 'Tạo gói tập'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
