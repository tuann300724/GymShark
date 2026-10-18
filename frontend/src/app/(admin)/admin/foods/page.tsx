'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminGuard } from '@/components/guards/admin-guard';
import { foodApi, type FoodCategory, type FoodItem } from '@/services/food.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const PAGE_SIZE = 20;

const CATEGORY_OPTIONS = [
  { value: 'PROTEIN', label: 'Đạm' },
  { value: 'CARBOHYDRATE', label: 'Tinh bột' },
  { value: 'VEGETABLE', label: 'Rau củ' },
  { value: 'FRUIT', label: 'Trái cây' },
  { value: 'DAIRY', label: 'Sữa & sản phẩm từ sữa' },
  { value: 'FAT', label: 'Chất béo' },
  { value: 'DRINK', label: 'Đồ uống' },
  { value: 'SNACK', label: 'Đồ ăn vặt' },
  { value: 'OTHER', label: 'Khác' },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
);

/* ------------------------------ Form state ------------------------------ */

interface FoodFormState {
  name: string;
  category: FoodCategory;
  description: string;
  servingSize: string;
  servingUnit: string;
  caloriesPer100g: string;
  proteinPer100g: string;
  carbsPer100g: string;
  fatPer100g: string;
}

const emptyForm: FoodFormState = {
  name: '',
  category: 'PROTEIN',
  description: '',
  servingSize: '100',
  servingUnit: 'g',
  caloriesPer100g: '',
  proteinPer100g: '',
  carbsPer100g: '',
  fatPer100g: '',
};

const foodToForm = (food: FoodItem): FoodFormState => ({
  name: food.name,
  category: food.category,
  description: food.description || '',
  servingSize: String(food.servingSize),
  servingUnit: food.servingUnit,
  caloriesPer100g: String(food.caloriesPer100g),
  proteinPer100g: String(food.proteinPer100g),
  carbsPer100g: String(food.carbsPer100g),
  fatPer100g: String(food.fatPer100g),
});

const errMsg = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg.join(', ') : msg;
};

/* --------------------------------- Page --------------------------------- */

export default function AdminFoodsPage() {
  return (
    <AdminGuard>
      <Foods />
    </AdminGuard>
  );
}

function Foods() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);

  // Editor (tạo / sửa)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FoodFormState>(emptyForm);
  const [formError, setFormError] = useState('');

  // Xác nhận ẩn (xoá mềm)
  const [hideTarget, setHideTarget] = useState<FoodItem | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['admin-foods', page, search, category, includeInactive],
    queryFn: () =>
      foodApi.list({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        category: (category || undefined) as FoodCategory | undefined,
        includeInactive: includeInactive || undefined,
      }),
    retry: 0,
  });

  const foods = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-foods'] });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<FoodItem>) => foodApi.create(payload),
    onSuccess: (food) => {
      toast.success('Đã thêm thực phẩm', `"${food.name}" đã vào thư viện.`);
      invalidate();
      closeEditor();
    },
    onError: (err: any) => toast.error('Thêm thất bại', errMsg(err, 'Không thêm được thực phẩm.')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<FoodItem> }) =>
      foodApi.update(id, payload),
    onSuccess: (food) => {
      toast.success('Đã lưu thay đổi', `"${food.name}" đã được cập nhật.`);
      invalidate();
      closeEditor();
    },
    onError: (err: any) => toast.error('Lưu thất bại', errMsg(err, 'Không lưu được thực phẩm.')),
  });

  const hideMutation = useMutation({
    mutationFn: (id: string) => foodApi.remove(id),
    onSuccess: () => {
      toast.success('Đã ẩn thực phẩm', 'Thực đơn đã dùng món này không bị ảnh hưởng.');
      invalidate();
      setHideTarget(null);
    },
    onError: (err: any) => toast.error('Ẩn thất bại', errMsg(err, 'Không ẩn được thực phẩm.')),
  });

  /* -------------------------------- Editor -------------------------------- */

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setEditorOpen(true);
  };

  const openEdit = (food: FoodItem) => {
    setEditingId(food.id);
    setForm(foodToForm(food));
    setFormError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setFormError('');
  };

  const patchForm = (patch: Partial<FoodFormState>) => setForm((f) => ({ ...f, ...patch }));

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

  const submitEditor = () => {
    if (!form.name.trim()) {
      setFormError('Tên thực phẩm không được để trống.');
      return;
    }
    const payload: Partial<FoodItem> = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || undefined,
      servingSize: num(form.servingSize),
      servingUnit: form.servingUnit.trim() || undefined,
      caloriesPer100g: num(form.caloriesPer100g),
      proteinPer100g: num(form.proteinPer100g),
      carbsPer100g: num(form.carbsPer100g),
      fatPer100g: num(form.fatPer100g),
    };
    if (editingId) updateMutation.mutate({ id: editingId, payload });
    else createMutation.mutate(payload);
  };

  /* -------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            Thư viện thực phẩm
          </h1>
          <p className="mt-1 text-sm text-muted">
            Quản lý danh sách thực phẩm dùng cho thực đơn dinh dưỡng.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Thêm
        </Button>
      </div>

      <Card className="border-line bg-surface/95 backdrop-blur">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="size-4" /> Danh sách ({total})
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-56"
              aria-label="Tìm thực phẩm"
            />
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              options={[{ value: '', label: 'Tất cả nhóm' }, ...CATEGORY_OPTIONS]}
              aria-label="Lọc theo nhóm"
              className="w-44"
            />
            <button
              type="button"
              onClick={() => {
                setIncludeInactive((v) => !v);
                setPage(1);
              }}
              className={cn(
                'rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                includeInactive
                  ? 'border-neon/40 bg-neon/10 text-neon'
                  : 'border-line text-muted hover:text-chalk',
              )}
            >
              Gồm đã ẩn
            </button>
            <Button variant="ghost" size="sm" onClick={invalidate} aria-label="Tải lại">
              <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : isError ? (
            <ErrorState
              title="Không tải được thực phẩm"
              description="Không tải được thư viện thực phẩm từ Backend. Vui lòng thử lại."
              onRetry={() => refetch()}
            />
          ) : foods.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="Chưa có thực phẩm"
              description={
                search.trim() || category
                  ? 'Không tìm thấy thực phẩm nào khớp với bộ lọc.'
                  : 'Chưa có thực phẩm nào. Nhấn Thêm để nhập liệu dinh dưỡng đầu tiên.'
              }
            />
          ) : (
            <div className="divide-y divide-line/60">
              {foods.map((f) => (
                <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          'text-sm font-semibold text-chalk',
                          !f.isActive && 'opacity-60',
                        )}
                      >
                        {f.name}
                      </p>
                      <Badge variant="info">{CATEGORY_LABEL[f.category] || f.category}</Badge>
                      {!f.isActive && <Badge variant="destructive">Đã ẩn</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      Khẩu phần {f.servingSize} {f.servingUnit} • {f.caloriesPer100g} kcal/100g • P
                      {f.proteinPer100g} C{f.carbsPer100g} F{f.fatPer100g}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(f)}>
                      <Pencil className="size-3.5" /> Sửa
                    </Button>
                    {f.isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger hover:text-danger"
                        onClick={() => setHideTarget(f)}
                        aria-label={`Ẩn ${f.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
            Trước
          </Button>
          <span className="text-sm text-muted">
            {page}/{totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Dialog tạo / sửa */}
      <Dialog
        open={editorOpen}
        onClose={closeEditor}
        title={editingId ? 'Chỉnh sửa thực phẩm' : 'Thêm thực phẩm'}
        description="Dinh dưỡng nhập theo khẩu phần 100g."
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label="Tên thực phẩm *"
            value={form.name}
            onChange={(e) => patchForm({ name: e.target.value })}
            placeholder="VD: Ức gà nạc"
            maxLength={120}
            error={formError && !form.name.trim() ? 'Bắt buộc' : undefined}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Nhóm"
              value={form.category}
              onChange={(e) => patchForm({ category: e.target.value as FoodCategory })}
              options={CATEGORY_OPTIONS}
            />
            <Input
              label="Khẩu phần"
              type="number"
              min={0}
              value={form.servingSize}
              onChange={(e) => patchForm({ servingSize: e.target.value })}
              placeholder="100"
            />
            <Input
              label="Đơn vị khẩu phần"
              value={form.servingUnit}
              onChange={(e) => patchForm({ servingUnit: e.target.value })}
              placeholder="g / cái / ly..."
              maxLength={20}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              label="Calo (kcal)"
              type="number"
              min={0}
              value={form.caloriesPer100g}
              onChange={(e) => patchForm({ caloriesPer100g: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Protein (g)"
              type="number"
              min={0}
              value={form.proteinPer100g}
              onChange={(e) => patchForm({ proteinPer100g: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Carb (g)"
              type="number"
              min={0}
              value={form.carbsPer100g}
              onChange={(e) => patchForm({ carbsPer100g: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Chất béo (g)"
              type="number"
              min={0}
              value={form.fatPer100g}
              onChange={(e) => patchForm({ fatPer100g: e.target.value })}
              placeholder="0"
            />
          </div>

          <div>
            <label
              htmlFor="food-description"
              className="mb-1.5 block text-sm font-semibold text-muted"
            >
              Mô tả
            </label>
            <textarea
              id="food-description"
              value={form.description}
              onChange={(e) => patchForm({ description: e.target.value })}
              rows={2}
              maxLength={2000}
              placeholder="Cách chế biến, lưu ý..."
              className="w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-chalk placeholder:text-muted/70 focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
            />
          </div>

          {formError && <p className="text-sm font-medium text-danger">{formError}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="outline" onClick={closeEditor}>
            Huỷ
          </Button>
          <Button
            isLoading={createMutation.isPending || updateMutation.isPending}
            onClick={submitEditor}
          >
            {editingId ? 'Lưu thay đổi' : 'Thêm thực phẩm'}
          </Button>
        </div>
      </Dialog>

      {/* Dialog xác nhận ẩn (xoá mềm) */}
      <Dialog
        open={Boolean(hideTarget)}
        onClose={() => setHideTarget(null)}
        title="Ẩn thực phẩm khỏi thư viện?"
        description={
          hideTarget
            ? `"${hideTarget.name}" sẽ bị ẩn (xoá mềm). Thực đơn đã gửi cho hội viên giữ nguyên snapshot dinh dưỡng, không bị ảnh hưởng.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setHideTarget(null)}>
            Huỷ
          </Button>
          <Button
            variant="danger"
            isLoading={hideMutation.isPending}
            onClick={() => hideTarget && hideMutation.mutate(hideTarget.id)}
          >
            <Trash2 className="size-4" />
            Ẩn thực phẩm
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
