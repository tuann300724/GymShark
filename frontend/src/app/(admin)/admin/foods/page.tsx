'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foodApi, type FoodItem, type FoodCategory } from '@/services/food.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  Flame,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

const PAGE_SIZE = 12;

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

const CATEGORY_META: Record<string, { label: string; variant: 'default' | 'success' | 'info' }> = {
  PROTEIN: { label: 'Đạm', variant: 'success' },
  CARBOHYDRATE: { label: 'Tinh bột', variant: 'info' },
  VEGETABLE: { label: 'Rau củ', variant: 'success' },
  FRUIT: { label: 'Trái cây', variant: 'success' },
  DAIRY: { label: 'Sữa', variant: 'info' },
  FAT: { label: 'Chất béo', variant: 'default' },
  DRINK: { label: 'Đồ uống', variant: 'info' },
  SNACK: { label: 'Đồ ăn vặt', variant: 'default' },
  OTHER: { label: 'Khác', variant: 'default' },
};

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
  isActive: boolean;
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
  isActive: true,
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
  isActive: food.isActive,
});

/* --------------------------------- Page --------------------------------- */

export default function AdminFoodsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  // Editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FoodFormState>(emptyForm);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<FoodItem | null>(null);

  const { data, isLoading, isFetching } = useQuery({
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

  const foods = data?.data || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-foods'] });

  const errMsg = (err: any, fallback: string) => {
    const msg = err.response?.data?.message || fallback;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => foodApi.create(payload),
    onSuccess: () => {
      toast.success('Đã thêm thực phẩm', 'Món mới đã vào thư viện.');
      invalidate();
      closeEditor();
    },
    onError: (err: any) => toast.error('Thêm thất bại', errMsg(err, 'Không thêm được thực phẩm.')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => foodApi.update(id, payload),
    onSuccess: () => {
      toast.success('Đã lưu thay đổi');
      invalidate();
      closeEditor();
    },
    onError: (err: any) => toast.error('Lưu thất bại', errMsg(err, 'Không lưu được thực phẩm.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => foodApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá thực phẩm');
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error('Xoá thất bại', errMsg(err, 'Không xoá được thực phẩm.')),
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

  const submitEditor = () => {
    if (!form.name.trim()) {
      setFormError('Tên thực phẩm không được để trống.');
      return;
    }
    const num = (v: string) => (v.trim() === '' ? 0 : Number(v));
    const servingSize = num(form.servingSize);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || undefined,
      servingSize: servingSize > 0 ? servingSize : 100,
      servingUnit: form.servingUnit.trim() || 'g',
      caloriesPer100g: num(form.caloriesPer100g),
      proteinPer100g: num(form.proteinPer100g),
      carbsPer100g: num(form.carbsPer100g),
      fatPer100g: num(form.fatPer100g),
      isActive: form.isActive,
    };
    if (editingId) updateMutation.mutate({ id: editingId, payload });
    else createMutation.mutate(payload);
  };

  const patchForm = (patch: Partial<FoodFormState>) => setForm((f) => ({ ...f, ...patch }));

  /* -------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Apple className="size-6 text-neon" />
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-chalk">
              Thư viện thực phẩm
            </h1>
            <p className="text-sm text-muted">
              Cơ sở dinh dưỡng để huấn luyện viên soạn thực đơn cho hội viên.
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm thực phẩm
        </Button>
      </header>

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm thực phẩm..."
              className="pl-9"
              aria-label="Tìm thực phẩm"
            />
          </div>
        </div>
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          options={[{ value: '', label: 'Tất cả nhóm' }, ...CATEGORY_OPTIONS]}
          aria-label="Lọc theo nhóm"
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
          Gồm đã ngừng dùng
        </button>
        <Button variant="ghost" size="sm" onClick={invalidate} aria-label="Tải lại">
          <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
        </Button>
      </div>

      {/* Danh sách */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : foods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Apple className="size-8 text-muted" />
            <p className="text-sm text-muted">
              {search.trim() || category
                ? 'Không tìm thấy thực phẩm nào khớp.'
                : 'Thư viện trống. Bấm "Thêm thực phẩm" để nhập món đầu tiên.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {foods.map((food) => {
            const meta = CATEGORY_META[food.category] || CATEGORY_META.OTHER;
            return (
              <Card
                key={food.id}
                className={cn(
                  'transition-colors hover:border-neon/40',
                  !food.isActive && 'opacity-60',
                )}
              >
                <CardContent className="flex h-full flex-col gap-2.5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-bold uppercase leading-tight text-chalk">
                      {food.name}
                    </h2>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {!food.isActive && <Badge variant="destructive">Ngừng dùng</Badge>}
                    </div>
                  </div>

                  {food.description && (
                    <p className="line-clamp-2 text-xs text-muted">{food.description}</p>
                  )}

                  <p className="text-[11px] uppercase tracking-wider text-muted">
                    Khẩu phần: {food.servingSize} {food.servingUnit}
                  </p>

                  <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-line bg-ink p-2 text-center">
                    <NutriCell label="Kcal" value={food.caloriesPer100g} highlight />
                    <NutriCell label="Đạm" value={food.proteinPer100g} unit="g" />
                    <NutriCell label="Carb" value={food.carbsPer100g} unit="g" />
                    <NutriCell label="Béo" value={food.fatPer100g} unit="g" />
                  </div>
                  <p className="text-center text-[10px] text-muted">trên 100g</p>

                  <div className="mt-auto flex items-center justify-end gap-1 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(food)}>
                      <Pencil className="size-3.5" />
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger"
                      onClick={() => setDeleteTarget(food)}
                      aria-label="Xoá"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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

      {/* Dialog tạo/sửa */}
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

          <div className="grid gap-4 sm:grid-cols-2">
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
            <Select
              label="Trạng thái"
              value={form.isActive ? 'active' : 'inactive'}
              onChange={(e) => patchForm({ isActive: e.target.value === 'active' })}
              options={[
                { value: 'active', label: 'Đang dùng' },
                { value: 'inactive', label: 'Ngừng dùng' },
              ]}
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
              maxLength={1000}
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

      {/* Dialog xoá */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Xoá thực phẩm?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" sẽ bị xoá khỏi thư viện. Thực đơn đã dùng món này không bị ảnh hưởng.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Huỷ
          </Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            <Trash2 className="size-4" />
            Xoá
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

/* -------------------------------- Helpers -------------------------------- */

function NutriCell({
  label,
  value,
  unit = '',
  highlight = false,
}: {
  label: string;
  value: number | string | null | undefined;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          'font-display text-base font-bold leading-none',
          highlight ? 'text-neon' : 'text-chalk',
        )}
      >
        {value ?? 0}
        {unit}
      </p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}
