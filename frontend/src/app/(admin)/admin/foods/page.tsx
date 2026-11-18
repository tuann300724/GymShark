'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminGuard } from '@/components/guards/admin-guard';
import { foodApi, type FoodCategory, type FoodItem, type FoodSort } from '@/services/food.service';
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
import { useConfirm } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import {
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  Undo2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calculator,
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

const SORT_OPTIONS = [
  { value: 'category', label: 'Nhóm & tên (mặc định)' },
  { value: 'name', label: 'Tên A–Z' },
  { value: 'kcal', label: 'Calo cao → thấp' },
  { value: 'protein', label: 'Protein cao → thấp' },
  { value: 'recent', label: 'Mới thêm trước' },
];

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
  imageUrl: string;
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
  imageUrl: '',
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
  imageUrl: food.imageUrl || '',
});

const errMsg = (err: unknown, fallback: string) => {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e?.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg.join(', ') : String(msg);
};

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
  const { confirm } = useConfirm();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<FoodSort>('category');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FoodFormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce ô tìm kiếm ~300ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset lựa chọn bulk khi đổi bộ lọc / trang
  useEffect(() => {
    setSelected(new Set());
  }, [page, search, category, sort, includeInactive]);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['admin-foods', page, search, category, sort, includeInactive],
    queryFn: () =>
      foodApi.list({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        category: (category || undefined) as FoodCategory | undefined,
        sort,
        includeInactive: includeInactive || undefined,
      }),
    retry: 0,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-foods-stats'],
    queryFn: async () => {
      const [all, active] = await Promise.all([
        foodApi.list({ limit: 1, includeInactive: true }),
        foodApi.list({ limit: 1 }),
      ]);
      return { total: all.total, active: active.total, hidden: all.total - active.total };
    },
    staleTime: 30_000,
    retry: 0,
  });

  const foods = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-foods'] });
    queryClient.invalidateQueries({ queryKey: ['admin-foods-stats'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Partial<FoodItem>) => foodApi.create(payload),
    onSuccess: (food) => {
      toast.success('Đã thêm thực phẩm', `"${food.name}" đã vào thư viện.`);
      invalidate();
      closeEditor();
    },
    onError: (err: unknown) =>
      toast.error('Thêm thất bại', errMsg(err, 'Không thêm được thực phẩm.')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<FoodItem> }) =>
      foodApi.update(id, payload),
    onSuccess: (food) => {
      toast.success('Đã lưu thay đổi', `"${food.name}" đã được cập nhật.`);
      invalidate();
      closeEditor();
    },
    onError: (err: unknown) =>
      toast.error('Lưu thất bại', errMsg(err, 'Không lưu được thực phẩm.')),
  });

  const hideMutation = useMutation({
    mutationFn: (id: string) => foodApi.remove(id),
    onSuccess: () => {
      toast.success('Đã ẩn thực phẩm', 'Thực đơn đã dùng món này không bị ảnh hưởng.');
      invalidate();
    },
    onError: (err: unknown) => toast.error('Ẩn thất bại', errMsg(err, 'Không ẩn được thực phẩm.')),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => foodApi.restore(id),
    onSuccess: () => {
      toast.success('Đã bỏ ẩn thực phẩm', 'Món đã hiển thị lại trong thư viện.');
      invalidate();
    },
    onError: (err: unknown) =>
      toast.error('Bỏ ẩn thất bại', errMsg(err, 'Không bỏ ẩn được thực phẩm.')),
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'hide' | 'restore' }) => {
      const results = await Promise.allSettled(
        ids.map((id) => (action === 'hide' ? foodApi.remove(id) : foodApi.restore(id))),
      );
      return results;
    },
    onSuccess: (results, variables) => {
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - ok;
      if (failed === 0) {
        toast.success(
          variables.action === 'hide' ? 'Đã ẩn' : 'Đã bỏ ẩn',
          `${ok} thực phẩm đã được cập nhật.`,
        );
      } else {
        toast.error('Một số mục thất bại', `${ok} thành công, ${failed} thất bại.`);
      }
      setSelected(new Set());
      invalidate();
    },
    onError: () => toast.error('Thao tác thất bại', 'Không thực hiện được hàng loạt.'),
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

  const onImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 900 * 1024) {
      setFormError('Ảnh quá lớn — tối đa khoảng 900KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => patchForm({ imageUrl: String(reader.result || '') });
    reader.readAsDataURL(file);
  };

  const autoCalcKcal = () => {
    if (!form.proteinPer100g && !form.carbsPer100g && !form.fatPer100g) {
      setFormError('Nhập Protein / Carb / Chất béo trước khi tự tính kcal.');
      return;
    }
    const p = Number(form.proteinPer100g) || 0;
    const c = Number(form.carbsPer100g) || 0;
    const f = Number(form.fatPer100g) || 0;
    setFormError('');
    patchForm({ caloriesPer100g: String(Math.round(p * 4 + c * 4 + f * 9)) });
  };

  const checkDuplicateName = async (name: string): Promise<string | null> => {
    try {
      const res = await foodApi.list({
        search: name.trim(),
        limit: 10,
        includeInactive: true,
      });
      const norm = (s: string) => s.trim().toLowerCase();
      const found = res.data.find((f) => norm(f.name) === norm(name) && f.id !== editingId);
      return found ? found.name : null;
    } catch {
      return null; // lỗi mạng → không chặn lưu
    }
  };

  const submitEditor = async () => {
    const name = form.name.trim();
    if (!name) {
      setFormError('Tên thực phẩm không được để trống.');
      return;
    }
    setFormError('');
    const dup = await checkDuplicateName(name);
    if (dup) {
      setFormError(`Đã tồn tại thực phẩm "${dup}" — tránh trùng tên.`);
      return;
    }
    const payload: Partial<FoodItem> = {
      name,
      category: form.category,
      description: form.description.trim() || undefined,
      servingSize: num(form.servingSize),
      servingUnit: form.servingUnit.trim() || undefined,
      caloriesPer100g: num(form.caloriesPer100g),
      proteinPer100g: num(form.proteinPer100g),
      carbsPer100g: num(form.carbsPer100g),
      fatPer100g: num(form.fatPer100g),
      imageUrl: form.imageUrl.trim() || undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, payload });
    else createMutation.mutate(payload);
  };

  const handleHide = async (food: FoodItem) => {
    const ok = await confirm({
      title: 'Ẩn thực phẩm khỏi thư viện?',
      description: `"${food.name}" sẽ bị ẩn (xoá mềm). Thực đơn đã gửi cho hội viên giữ nguyên snapshot dinh dưỡng, không bị ảnh hưởng.`,
      type: 'danger',
    });
    if (ok) hideMutation.mutate(food.id);
  };

  const handleRestore = async (food: FoodItem) => {
    const ok = await confirm({
      title: 'Bỏ ẩn thực phẩm?',
      description: `"${food.name}" sẽ hiển thị lại trong thư viện và có thể dùng cho thực đơn mới.`,
      type: 'info',
    });
    if (ok) restoreMutation.mutate(food.id);
  };

  /* ------------------------------- Selection ------------------------------ */

  const allChecked = foods.length > 0 && foods.every((f) => selected.has(f.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) foods.forEach((f) => next.delete(f.id));
      else foods.forEach((f) => next.add(f.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulk = async (action: 'hide' | 'restore') => {
    const targets = foods.filter(
      (f) => selected.has(f.id) && (action === 'hide' ? f.isActive : !f.isActive),
    );
    if (targets.length === 0) {
      toast.error(
        'Không có mục phù hợp',
        action === 'hide'
          ? 'Các món đã chọn đều đang bị ẩn.'
          : 'Các món đã chọn đều đang hiển thị.',
      );
      return;
    }
    const ok = await confirm({
      title:
        action === 'hide'
          ? `Ẩn ${targets.length} thực phẩm?`
          : `Bỏ ẩn ${targets.length} thực phẩm?`,
      description:
        action === 'hide'
          ? 'Các món đã chọn sẽ bị ẩn khỏi thư viện (xoá mềm). Thực đơn cũ không bị ảnh hưởng.'
          : 'Các món đã chọn sẽ hiển thị lại trong thư viện.',
      type: action === 'hide' ? 'danger' : 'info',
    });
    if (ok) bulkMutation.mutate({ ids: targets.map((t) => t.id), action });
  };

  /* -------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta-label">Dinh dưỡng</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-chalk">
            Thư viện thực phẩm
          </h1>
          <p className="mt-1 text-sm text-muted">
            Quản lý danh sách thực phẩm dùng cho thực đơn dinh dưỡng.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Thêm thực phẩm
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Tổng thực phẩm', value: stats?.total },
          { label: 'Đang hiển thị', value: stats?.active },
          { label: 'Đã ẩn', value: stats?.hidden },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 sm:p-4">
              <p className="meta-label">{s.label}</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums text-chalk">
                {s.value ?? '—'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <Input
            aria-label="Tìm thực phẩm"
            placeholder="Tìm theo tên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="lg:w-64"
          />
          <Select
            aria-label="Lọc theo nhóm"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            options={[{ value: '', label: 'Tất cả nhóm' }, ...CATEGORY_OPTIONS]}
            className="lg:w-48"
          />
          <Select
            aria-label="Sắp xếp"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as FoodSort);
              setPage(1);
            }}
            options={SORT_OPTIONS}
            className="lg:w-52"
          />
          <label className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => {
                setIncludeInactive(e.target.checked);
                setPage(1);
              }}
              className="size-4 accent-lime-500"
            />
            Gồm đã ẩn
          </label>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Tải lại"
            onClick={invalidate}
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="size-4" /> Danh sách ({total})
          </CardTitle>
          {selected.size > 0 && <span className="text-xs text-muted">Đã chọn {selected.size}</span>}
        </CardHeader>

        {selected.size > 0 && (
          <div className="flex flex-col gap-2 border-y border-line bg-ink/60 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-chalk">
              Đã chọn <span className="font-semibold text-neon">{selected.size}</span> món
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                isLoading={bulkMutation.isPending}
                onClick={() => handleBulk('hide')}
              >
                <Trash2 className="size-3.5" /> Ẩn đã chọn
              </Button>
              <Button
                size="sm"
                variant="outline"
                isLoading={bulkMutation.isPending}
                onClick={() => handleBulk('restore')}
              >
                <Undo2 className="size-3.5" /> Bỏ ẩn đã chọn
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="p-4">
              <ErrorState
                title="Không tải được thực phẩm"
                description="Không tải được thư viện thực phẩm từ Backend. Vui lòng thử lại."
                onRetry={() => refetch()}
              />
            </div>
          ) : foods.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={UtensilsCrossed}
                title="Chưa có thực phẩm"
                description={
                  search || category
                    ? 'Không tìm thấy thực phẩm nào khớp với bộ lọc.'
                    : 'Chưa có thực phẩm nào. Nhấn Thêm thực phẩm để nhập liệu dinh dưỡng đầu tiên.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-y border-line text-xs uppercase text-muted">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        aria-label="Chọn tất cả"
                        className="size-4 accent-lime-500"
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold">Thực phẩm</th>
                    <th className="px-4 py-3 font-semibold">Khẩu phần</th>
                    <th className="px-4 py-3 font-semibold">kcal/100g</th>
                    <th className="px-4 py-3 font-semibold">P · C · F</th>
                    <th className="px-4 py-3" aria-label="Hành động" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {foods.map((f) => (
                    <tr key={f.id} className="hover:bg-ink/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(f.id)}
                          onChange={() => toggleOne(f.id)}
                          aria-label={`Chọn ${f.name}`}
                          className="size-4 accent-lime-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {f.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={f.imageUrl}
                              alt={f.name}
                              className="size-10 shrink-0 rounded-md border border-line object-cover"
                            />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-ink">
                              <UtensilsCrossed className="size-4 text-muted" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p
                              className={cn(
                                'font-semibold text-chalk',
                                !f.isActive && 'opacity-60',
                              )}
                            >
                              {f.name}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <Badge variant="info">
                                {CATEGORY_LABEL[f.category] || f.category}
                              </Badge>
                              {!f.isActive && <Badge variant="destructive">Đã ẩn</Badge>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {f.servingSize} {f.servingUnit}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-chalk">
                        {f.caloriesPer100g}
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-muted">
                        P {f.proteinPer100g} · C {f.carbsPer100g} · F {f.fatPer100g}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openEdit(f)}>
                            <Pencil className="size-3.5" /> Sửa
                          </Button>
                          {f.isActive ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-danger hover:text-danger"
                              onClick={() => handleHide(f)}
                              aria-label={`Ẩn ${f.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-neon hover:text-neon"
                              onClick={() => handleRestore(f)}
                              aria-label={`Bỏ ẩn ${f.name}`}
                            >
                              <Undo2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <p className="text-xs text-muted">
                Trang {page}/{totalPages} · {total} món
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" /> Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

          <div>
            <span className="mb-1.5 block text-sm font-semibold text-muted">
              Ảnh minh hoạ (tuỳ chọn)
            </span>
            <div className="flex items-center gap-3">
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt="Ảnh thực phẩm"
                  className="size-16 shrink-0 rounded-lg border border-line object-cover"
                />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-line bg-ink">
                  <UtensilsCrossed className="size-6 text-muted" />
                </div>
              )}
              <Input
                aria-label="URL ảnh"
                value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                onChange={(e) => patchForm({ imageUrl: e.target.value })}
                placeholder={
                  form.imageUrl.startsWith('data:') ? 'Ảnh đã tải lên' : 'Dán URL ảnh (https://...)'
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Tải ảnh
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageFile}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">URL ảnh hoặc tải ảnh lên (tối đa ~900KB).</p>
          </div>

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

          <div className="flex items-center justify-between gap-2">
            <p className="meta-label">Dinh dưỡng / 100g</p>
            <Button type="button" variant="ghost" size="sm" onClick={autoCalcKcal}>
              <Calculator className="size-3.5" /> Tự tính kcal (P×4 + C×4 + F×9)
            </Button>
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
    </div>
  );
}
