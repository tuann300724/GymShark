'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { promotionApi, type PromotionPayload } from '@/services/promotion.service';
import type { Promotion } from '@/services/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { PROMOTION_STATUS_META } from '@/lib/status';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  CalendarClock,
  CalendarX2,
  Coins,
  Eye,
  HeartPulse,
  Pencil,
  Plus,
  Power,
  Search,
  Tag,
  Wallet,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang chạy' },
  { value: 'INACTIVE', label: 'Ngừng kích hoạt' },
  { value: 'EXPIRED', label: 'Đã hết hạn' },
];

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type FormState = {
  code: string;
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: string;
  maxDiscount: string;
  minOrderAmount: string;
  startAt: string;
  endAt: string;
  usageLimit: string;
  perMemberLimit: string;
};

const EMPTY_FORM: FormState = {
  code: '',
  name: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: '',
  startAt: '',
  endAt: '',
  usageLimit: '',
  perMemberLimit: '',
};

function discountLabel(p: Promotion) {
  return p.discountType === 'PERCENTAGE'
    ? `-${parseFloat(String(p.discountValue))}%`
    : `-${formatCurrency(p.discountValue)}`;
}

export default function PromotionsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['promotions-list', search, status],
    queryFn: () => promotionApi.list({ search: search || undefined, status: status || undefined }),
    retry: 1,
  });

  const promoList = data?.data || [];
  const stats = data?.stats;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['promotions-list'] });
    queryClient.invalidateQueries({ queryKey: ['promotions-stats'] });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      code: p.code,
      name: p.name,
      description: p.description || '',
      discountType: p.discountType === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
      discountValue: String(p.discountValue),
      maxDiscount: p.maxDiscount != null ? String(p.maxDiscount) : '',
      minOrderAmount: p.minOrderAmount != null ? String(p.minOrderAmount) : '',
      startAt: toLocalInput(p.startAt),
      endAt: toLocalInput(p.endAt),
      usageLimit: p.usageLimit != null ? String(p.usageLimit) : '',
      perMemberLimit: p.perMemberLimit != null ? String(p.perMemberLimit) : '',
    });
    setDialogOpen(true);
  };

  const buildPayload = (): PromotionPayload | null => {
    const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
    const nl = (v: string) => (v.trim() === '' ? null : Number(v));
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Thiếu thông tin', 'Vui lòng nhập mã và tên chương trình.');
      return null;
    }
    const discountValue = num(form.discountValue);
    if (discountValue == null || discountValue <= 0) {
      toast.error('Giá trị giảm không hợp lệ', 'Giá trị giảm phải là số lớn hơn 0.');
      return null;
    }
    if (form.discountType === 'PERCENTAGE' && discountValue > 100) {
      toast.error('Giá trị giảm không hợp lệ', 'Phần trăm giảm không được vượt quá 100%.');
      return null;
    }
    if (!form.startAt || !form.endAt) {
      toast.error('Thiếu thời gian', 'Vui lòng chọn ngày bắt đầu và kết thúc.');
      return null;
    }
    const startAt = new Date(form.startAt);
    const endAt = new Date(form.endAt);
    if (endAt <= startAt) {
      toast.error('Thời gian không hợp lệ', 'Ngày kết thúc phải sau ngày bắt đầu.');
      return null;
    }
    return {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue,
      maxDiscount: nl(form.maxDiscount) ?? undefined,
      minOrderAmount: nl(form.minOrderAmount) ?? undefined,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      usageLimit: nl(form.usageLimit) ?? undefined,
      perMemberLimit: nl(form.perMemberLimit) ?? undefined,
    };
  };

  const saveMutation = useMutation({
    mutationFn: (payload: PromotionPayload) =>
      editing ? promotionApi.update(editing.id, payload) : promotionApi.create(payload),
    onSuccess: (res: { message?: string }) => {
      toast.success(editing ? 'Đã cập nhật mã khuyến mãi' : 'Đã tạo mã khuyến mãi', res.message);
      setDialogOpen(false);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      toast.error(
        editing ? 'Cập nhật thất bại' : 'Tạo mã thất bại',
        Array.isArray(msg) ? msg.join(', ') : msg || 'Có lỗi xảy ra.',
      );
    },
  });

  const handleSave = () => {
    const payload = buildPayload();
    if (payload) saveMutation.mutate(payload);
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'activate' | 'deactivate' }) =>
      action === 'activate' ? promotionApi.activate(id) : promotionApi.deactivate(id),
    onSuccess: (res: any) => {
      toast.success('Đã cập nhật trạng thái', res?.message);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      toast.error('Không thể cập nhật', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const filterCounts = useMemo(() => {
    const all = data?.data || [];
    return {
      active: all.filter((p) => p.status === 'ACTIVE').length,
      inactive: all.filter((p) => p.status === 'INACTIVE').length,
      expired: all.filter((p) => p.status === 'EXPIRED').length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
            <Tag className="size-6 text-neon" /> Khuyến mãi &amp; Voucher
          </h1>
          <p className="mt-1 text-xs text-muted">
            Tạo mã giảm giá % hoặc tiền mặt cho hội viên mới và gia hạn — backend tự tính chiết khấu
            khi đăng ký.
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" /> Tạo mã khuyến mãi
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Mã đang chạy"
          value={stats?.activeCount ?? filterCounts.active ?? 0}
          icon={Tag}
          colorScheme="neon"
          subtitle="Còn hiệu lực"
        />
        <StatCard
          title="Sắp hết hạn"
          value={stats?.expiringSoon ?? 0}
          icon={CalendarClock}
          colorScheme="amber"
          subtitle="Trong 7 ngày tới"
        />
        <StatCard
          title="Đã hết hạn"
          value={stats?.expiredCount ?? 0}
          icon={CalendarX2}
          colorScheme="rose"
          subtitle="Tổng cộng"
        />
        <StatCard
          title="Tổng giảm giá"
          value={formatCurrency(stats?.totalDiscount ?? 0)}
          icon={Wallet}
          colorScheme="purple"
          subtitle={`${stats?.totalUsage ?? 0} lượt dùng`}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã hoặc tên chương trình..."
              className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-chalk placeholder:text-muted/70 outline-none transition-colors focus:border-neon/60"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
            className="sm:w-56"
          />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <HeartPulse className="size-3.5 text-neon" />
          {data?.total ?? promoList.length} mã · {filterCounts.active} đang chạy ·{' '}
          {filterCounts.inactive} tạm ngưng
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-14 text-center text-xs text-danger">
            Không kết nối được API khuyến mãi. Hãy kiểm tra backend.
          </CardContent>
        </Card>
      ) : promoList.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-xs text-muted">
            Chưa có mã khuyến mãi nào phù hợp với bộ lọc.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {promoList.map((p) => {
            const statusMeta = PROMOTION_STATUS_META[p.status] || {
              label: p.status,
              variant: 'outline' as const,
            };
            const expired = p.endAt < new Date().toISOString();
            return (
              <Card
                key={p.id}
                className={cn(
                  'border-l-2',
                  p.status === 'ACTIVE' ? 'border-l-neon' : 'border-l-line',
                )}
              >
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border border-neon/30 bg-neon/10 px-2.5 py-1 font-mono text-sm font-black tracking-wider text-neon">
                        {p.code}
                      </span>
                      <Badge variant={statusMeta.variant as any}>{statusMeta.label}</Badge>
                      {expired && p.status === 'ACTIVE' && (
                        <Badge variant="warning">Sắp hết hạn</Badge>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-chalk">{p.name}</h4>
                    {p.description && (
                      <p className="line-clamp-2 text-xs text-muted">{p.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-muted">
                      <span>
                        Hiệu lực: {formatDate(p.startAt)} → {formatDate(p.endAt)}
                      </span>
                      {p.usageLimit != null && <span>Tối đa {p.usageLimit} lượt</span>}
                      {p.perMemberLimit != null && <span>· {p.perMemberLimit} lượt/hội viên</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-3">
                    <div className="text-right">
                      <p className="font-display text-2xl font-black leading-none text-neon">
                        {discountLabel(p)}
                      </p>
                      <p className="mt-1.5 flex items-center justify-end gap-1 text-[11px] text-muted">
                        <Coins className="size-3.5" />
                        {p.usage} lượt đã dùng
                        {p.remaining != null && <span> · còn {p.remaining}</span>}
                      </p>
                      {p.minOrderAmount != null && (
                        <p className="mt-0.5 text-[10px] text-line">
                          Đơn tối thiểu {formatCurrency(p.minOrderAmount)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/promotions/${p.id}`}
                      className="flex size-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-neon/50 hover:text-neon"
                      title="Chi tiết & lịch sử dùng"
                    >
                      <Eye className="size-3.5" />
                    </Link>
                    <button
                      onClick={() => openEdit(p)}
                      className="flex size-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-neon/50 hover:text-neon"
                      title="Chỉnh sửa"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    {p.status === 'ACTIVE' ? (
                      <button
                        onClick={() => toggleMutation.mutate({ id: p.id, action: 'deactivate' })}
                        disabled={toggleMutation.isPending}
                        className="flex size-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-danger/50 hover:text-danger disabled:opacity-50"
                        title="Ngừng kích hoạt"
                      >
                        <Power className="size-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleMutation.mutate({ id: p.id, action: 'activate' })}
                        disabled={toggleMutation.isPending || p.status === 'EXPIRED'}
                        className="flex size-8 items-center justify-center rounded-lg border border-neon/30 text-neon transition-colors hover:border-neon disabled:opacity-40"
                        title={
                          p.status === 'EXPIRED'
                            ? 'Mã đã hết hạn, không kích hoạt lại được'
                            : 'Kích hoạt'
                        }
                      >
                        <Power className="size-3.5" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? `Chỉnh sửa mã ${editing.code}` : 'Tạo mã khuyến mãi mới'}
        description="Số tiền giảm do backend tự tính khi hội viên áp dụng mã lúc đăng ký gói."
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Mã khuyến mãi"
              placeholder="VD: GYM20"
              value={form.code}
              disabled={!!editing}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
            <Input
              label="Tên chương trình"
              placeholder="VD: Giảm 20% hội viên mới"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <Textarea
            label="Mô tả (tùy chọn)"
            rows={2}
            placeholder="Điều kiện áp dụng..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select
              label="Loại giảm giá"
              value={form.discountType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT',
                }))
              }
              options={[
                { value: 'PERCENTAGE', label: 'Phần trăm (%)' },
                { value: 'FIXED_AMOUNT', label: 'Số tiền cố định' },
              ]}
            />
            <Input
              label={form.discountType === 'PERCENTAGE' ? 'Giảm (%)' : 'Giảm (VNĐ)'}
              type="number"
              placeholder={form.discountType === 'PERCENTAGE' ? '10' : '500000'}
              value={form.discountValue}
              onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
            />
            {form.discountType === 'PERCENTAGE' ? (
              <Input
                label="Giảm tối đa (VNĐ)"
                type="number"
                placeholder="500000"
                value={form.maxDiscount}
                onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
              />
            ) : (
              <Input
                label="Đơn tối thiểu (VNĐ)"
                type="number"
                placeholder="2000000"
                value={form.minOrderAmount}
                onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
              />
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Bắt đầu"
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
            />
            <Input
              label="Kết thúc"
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Giới hạn tổng lượt (bỏ trống = không giới hạn)"
              type="number"
              placeholder="100"
              value={form.usageLimit}
              onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
            />
            <Input
              label="Giới hạn mỗi hội viên (bỏ trống = không giới hạn)"
              type="number"
              placeholder="1"
              value={form.perMemberLimit}
              onChange={(e) => setForm((f) => ({ ...f, perMemberLimit: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" isLoading={saveMutation.isPending} onClick={handleSave}>
              {editing ? 'Lưu thay đổi' : 'Tạo mã'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
