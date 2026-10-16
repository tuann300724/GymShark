'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  mealPlanApi,
  type MealPlan,
  type MealType,
  type MealPlanScope,
  type MealPlanStatus,
} from '@/services/meal-plan.service';
import { trainerApi } from '@/services/trainer.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { cn, formatDate } from '@/lib/utils';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flame,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';

const PAGE_SIZE = 8;

const STATUS_META: Record<string, { label: string; variant: 'default' | 'success' | 'warning' }> = {
  DRAFT: { label: 'Bản nháp', variant: 'warning' },
  SENT: { label: 'Đã gửi', variant: 'default' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'success' },
};

const MEAL_TYPE_OPTIONS = [
  { value: 'BREAKFAST', label: 'Bữa sáng' },
  { value: 'LUNCH', label: 'Bữa trưa' },
  { value: 'DINNER', label: 'Bữa tối' },
  { value: 'SNACK', label: 'Bữa phụ' },
];

const MEAL_TYPE_LABEL: Record<string, string> = {
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  DINNER: 'Bữa tối',
  SNACK: 'Bữa phụ',
};

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

/* ------------------------------ Form state ------------------------------ */

interface ItemForm {
  name: string;
  quantity: string;
  unit: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

interface MealForm {
  type: MealType;
  dayIndex: string;
  time: string;
  note: string;
  items: ItemForm[];
}

interface PlanFormState {
  title: string;
  description: string;
  scope: MealPlanScope;
  startDate: string;
  memberId: string;
  isTemplate: boolean;
  templateName: string;
  meals: MealForm[];
}

const emptyItem = (): ItemForm => ({
  name: '',
  quantity: '',
  unit: 'g',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
});

const emptyMeal = (): MealForm => ({
  type: 'BREAKFAST',
  dayIndex: '',
  time: '',
  note: '',
  items: [emptyItem()],
});

const emptyForm = (): PlanFormState => ({
  title: '',
  description: '',
  scope: 'DAY',
  startDate: '',
  memberId: '',
  isTemplate: false,
  templateName: '',
  meals: [emptyMeal()],
});

function planToForm(plan: MealPlan): PlanFormState {
  return {
    title: plan.title,
    description: plan.description || '',
    scope: plan.scope,
    startDate: plan.startDate ? plan.startDate.slice(0, 10) : '',
    memberId: plan.memberId || '',
    isTemplate: plan.isTemplate,
    templateName: plan.templateName || '',
    meals:
      (plan.meals || []).length > 0
        ? [...plan.meals]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((m) => ({
              type: m.type,
              dayIndex: m.dayIndex != null ? String(m.dayIndex) : '',
              time: m.time || '',
              note: m.note || '',
              items:
                (m.items || []).length > 0
                  ? [...m.items]
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((it) => ({
                        name: it.name,
                        quantity: String(it.quantity),
                        unit: it.unit || 'g',
                        calories: String(it.calories ?? ''),
                        protein: String(it.protein ?? ''),
                        carbs: String(it.carbs ?? ''),
                        fat: String(it.fat ?? ''),
                      }))
                  : [emptyItem()],
            }))
        : [emptyMeal()],
  };
}

function toPayload(form: PlanFormState) {
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    scope: form.scope,
    startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
    memberId: form.memberId || undefined,
    isTemplate: form.isTemplate,
    templateName: form.isTemplate ? form.templateName.trim() || form.title.trim() : undefined,
    meals: form.meals.map((m) => ({
      type: m.type,
      dayIndex: form.scope === 'WEEK' && m.dayIndex !== '' ? Number(m.dayIndex) : undefined,
      time: m.time || undefined,
      note: m.note.trim() || undefined,
      items: m.items
        .filter((it) => it.name.trim() && it.quantity.trim() !== '')
        .map((it) => ({
          name: it.name.trim(),
          quantity: Number(it.quantity),
          unit: it.unit.trim() || 'g',
          calories: num(it.calories),
          protein: num(it.protein),
          carbs: num(it.carbs),
          fat: num(it.fat),
        })),
    })),
  };
}

/* --------------------------------- Page --------------------------------- */

export default function TrainerMealPlansPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');

  // Editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormState>(emptyForm);
  const [formError, setFormError] = useState('');

  // Hành động phụ trợ
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState<MealPlan | null>(null);
  const [sendContent, setSendContent] = useState('');
  const [duplicateTarget, setDuplicateTarget] = useState<MealPlan | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState('');
  const [duplicateMemberId, setDuplicateMemberId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MealPlan | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['trainer-meal-plans', page, search, statusFilter, templateFilter],
    queryFn: () =>
      mealPlanApi.listTrainer({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        status: (statusFilter || undefined) as MealPlanStatus | undefined,
        isTemplate: templateFilter === '' ? undefined : templateFilter === 'true',
      }),
    retry: 0,
  });

  const membersQuery = useQuery({
    queryKey: ['trainer-my-members'],
    queryFn: () => trainerApi.myMembers(),
    retry: 0,
  });

  const memberOptions = useMemo(() => {
    const list = (membersQuery.data || [])
      .filter((a) => a.status === 'ACTIVE' && a.member)
      .map((a) => ({
        value: a.memberId,
        label: `${a.member!.fullName} (${a.member!.code})`,
      }));
    return [{ value: '', label: '— Lưu làm thực đơn mẫu —' }, ...list];
  }, [membersQuery.data]);

  const plans = data?.data || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));

  const detailQuery = useQuery({
    queryKey: ['trainer-meal-plan-detail', detailId],
    queryFn: () => mealPlanApi.get(detailId!),
    enabled: Boolean(detailId),
    retry: 0,
  });

  /* ------------------------------- Mutations ------------------------------ */

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['trainer-meal-plans'] });
    queryClient.invalidateQueries({ queryKey: ['trainer-meal-plan-detail'] });
    queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
  };

  const errMsg = (err: any, fallback: string) => {
    const msg = err.response?.data?.message || fallback;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => mealPlanApi.create(payload),
    onSuccess: () => {
      toast.success('Đã tạo thực đơn', 'Thực đơn được lưu ở trạng thái bản nháp.');
      invalidate();
      closeEditor();
    },
    onError: (err: any) => toast.error('Tạo thất bại', errMsg(err, 'Không tạo được thực đơn.')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => mealPlanApi.update(id, payload),
    onSuccess: () => {
      toast.success('Đã lưu thay đổi');
      invalidate();
      closeEditor();
    },
    onError: (err: any) => toast.error('Lưu thất bại', errMsg(err, 'Không lưu được thực đơn.')),
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content?: string }) =>
      mealPlanApi.send(id, content ? { content } : {}),
    onSuccess: () => {
      toast.success('Đã gửi thực đơn', 'Hội viên sẽ nhận được trong khung tin nhắn.');
      invalidate();
      setSendTarget(null);
      setSendContent('');
    },
    onError: (err: any) => toast.error('Gửi thất bại', errMsg(err, 'Không gửi được thực đơn.')),
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, title, memberId }: { id: string; title?: string; memberId?: string }) =>
      mealPlanApi.duplicate(id, { title: title || undefined, memberId: memberId || undefined }),
    onSuccess: () => {
      toast.success('Đã nhân bản', 'Bản sao được lưu ở trạng thái bản nháp.');
      invalidate();
      setDuplicateTarget(null);
      setDuplicateTitle('');
      setDuplicateMemberId('');
    },
    onError: (err: any) => toast.error('Nhân bản thất bại', errMsg(err, 'Không nhân bản được.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mealPlanApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá thực đơn');
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error('Xoá thất bại', errMsg(err, 'Không xoá được thực đơn.')),
  });

  /* -------------------------------- Editor -------------------------------- */

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError('');
    setEditorOpen(true);
  };

  const openEdit = async (plan: MealPlan) => {
    try {
      const full = await mealPlanApi.get(plan.id);
      setEditingId(plan.id);
      setForm(planToForm(full));
      setFormError('');
      setEditorOpen(true);
    } catch {
      toast.error('Không mở được thực đơn', 'Không tải được chi tiết để chỉnh sửa.');
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setFormError('');
  };

  const submitEditor = () => {
    if (!form.title.trim()) {
      setFormError('Tên thực đơn không được để trống.');
      return;
    }
    const meals = form.meals.map((m) => ({
      ...m,
      items: m.items.filter((it) => it.name.trim() && it.quantity.trim() !== ''),
    }));
    if (meals.some((m) => m.items.length === 0)) {
      setFormError('Mỗi bữa ăn cần ít nhất một món có tên và khối lượng.');
      return;
    }
    const payload = toPayload({ ...form, meals });
    if (editingId) updateMutation.mutate({ id: editingId, payload });
    else createMutation.mutate(payload);
  };

  const patchForm = (patch: Partial<PlanFormState>) => setForm((f) => ({ ...f, ...patch }));

  const patchMeal = (index: number, patch: Partial<MealForm>) =>
    setForm((f) => ({
      ...f,
      meals: f.meals.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }));

  const patchItem = (mealIndex: number, itemIndex: number, patch: Partial<ItemForm>) =>
    setForm((f) => ({
      ...f,
      meals: f.meals.map((m, i) =>
        i === mealIndex
          ? { ...m, items: m.items.map((it, j) => (j === itemIndex ? { ...it, ...patch } : it)) }
          : m,
      ),
    }));

  /* -------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Utensils className="size-6 text-neon" />
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-chalk">
              Thực đơn
            </h1>
            <p className="text-sm text-muted">
              Soạn thực đơn theo ngày/tuần và gửi cho hội viên qua tin nhắn.
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Tạo thực đơn
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
              placeholder="Tìm theo tên thực đơn..."
              className="pl-9"
              aria-label="Tìm thực đơn"
            />
          </div>
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả trạng thái' },
            { value: 'DRAFT', label: 'Bản nháp' },
            { value: 'SENT', label: 'Đã gửi' },
            { value: 'CONFIRMED', label: 'Đã xác nhận' },
          ]}
          aria-label="Lọc theo trạng thái"
        />
        <Select
          value={templateFilter}
          onChange={(e) => {
            setTemplateFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Thực đơn & mẫu' },
            { value: 'false', label: 'Đã giao hội viên' },
            { value: 'true', label: 'Chỉ thực đơn mẫu' },
          ]}
          aria-label="Lọc thực đơn mẫu"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['trainer-meal-plans'] })}
          aria-label="Tải lại"
        >
          <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
        </Button>
      </div>

      {/* Danh sách */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Utensils className="size-8 text-muted" />
            <p className="text-sm text-muted">
              {search.trim() || statusFilter || templateFilter
                ? 'Không tìm thấy thực đơn nào khớp.'
                : 'Chưa có thực đơn nào. Bấm "Tạo thực đơn" để bắt đầu.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const meta = STATUS_META[plan.status] || STATUS_META.DRAFT;
            return (
              <Card key={plan.id} className="flex flex-col transition-colors hover:border-neon/40">
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-bold uppercase leading-tight text-chalk">
                      {plan.title}
                    </h2>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {plan.isTemplate && <Badge variant="info">Mẫu</Badge>}
                    </div>
                  </div>

                  <p className="text-xs text-muted">
                    {plan.member
                      ? `Hội viên: ${plan.member.fullName}`
                      : plan.isTemplate
                        ? 'Thực đơn mẫu (chưa giao)'
                        : 'Chưa giao hội viên'}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {plan.scope === 'WEEK' ? 'Theo tuần' : 'Theo ngày'}
                      {plan.startDate ? ` • ${formatDate(plan.startDate)}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Flame className="size-3.5" />
                      {plan.totalCalories} kcal
                    </span>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setDetailId(plan.id)}>
                      Xem
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                      <Pencil className="size-3.5" />
                      Sửa
                    </Button>
                    {plan.status !== 'CONFIRMED' && !plan.isTemplate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSendTarget(plan);
                          setSendContent('');
                        }}
                      >
                        <Send className="size-3.5" />
                        Gửi
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDuplicateTarget(plan);
                        setDuplicateTitle(`${plan.title} (bản sao)`);
                        setDuplicateMemberId('');
                      }}
                      aria-label="Nhân bản"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger"
                      onClick={() => setDeleteTarget(plan)}
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

      {/* Dialog chi tiết (chỉ xem) */}
      <Dialog
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        title={detailQuery.data?.title || 'Chi tiết thực đơn'}
        description={
          detailQuery.data?.member
            ? `Hội viên: ${detailQuery.data.member.fullName}`
            : detailQuery.data?.isTemplate
              ? 'Thực đơn mẫu'
              : undefined
        }
        className="max-w-2xl"
      >
        {detailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : detailQuery.data ? (
          <div className="space-y-4">
            {detailQuery.data.description && (
              <p className="text-sm leading-relaxed text-muted">{detailQuery.data.description}</p>
            )}
            {[...detailQuery.data.meals]
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((meal) => (
                <div key={meal.id} className="rounded-xl border border-line bg-ink p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold uppercase text-neon">
                      {MEAL_TYPE_LABEL[meal.type] || meal.type}
                      {meal.dayIndex != null ? ` • ${DAY_LABELS[meal.dayIndex]}` : ''}
                    </h3>
                    <span className="text-xs text-muted">{meal.totalCalories} kcal</span>
                  </div>
                  {meal.note && <p className="mt-1 text-sm italic text-muted">{meal.note}</p>}
                  <ul className="mt-2 space-y-1">
                    {[...meal.items]
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((it) => (
                        <li key={it.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-chalk">
                            {it.name}{' '}
                            <span className="text-xs text-muted">
                              {it.quantity} {it.unit}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-neon">{it.calories} kcal</span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Không tải được chi tiết.</p>
        )}
      </Dialog>

      {/* Dialog gửi */}
      <Dialog
        open={Boolean(sendTarget)}
        onClose={() => setSendTarget(null)}
        title="Gửi thực đơn"
        description={
          sendTarget
            ? `Gửi "${sendTarget.title}" cho ${
                sendTarget.member?.fullName || 'hội viên'
              } qua khung tin nhắn.`
            : undefined
        }
      >
        <div className="space-y-4">
          <Input
            label="Ghi chú kèm theo (không bắt buộc)"
            value={sendContent}
            onChange={(e) => setSendContent(e.target.value)}
            placeholder="VD: Em xem thực đơn rồi phản hồi anh nhé!"
            maxLength={500}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setSendTarget(null)}>
            Huỷ
          </Button>
          <Button
            isLoading={sendMutation.isPending}
            onClick={() =>
              sendTarget && sendMutation.mutate({ id: sendTarget.id, content: sendContent })
            }
          >
            <Send className="size-4" />
            Gửi
          </Button>
        </div>
      </Dialog>

      {/* Dialog nhân bản */}
      <Dialog
        open={Boolean(duplicateTarget)}
        onClose={() => setDuplicateTarget(null)}
        title="Nhân bản thực đơn"
        description={duplicateTarget ? `Từ "${duplicateTarget.title}"` : undefined}
      >
        <div className="space-y-4">
          <Input
            label="Tên bản sao"
            value={duplicateTitle}
            onChange={(e) => setDuplicateTitle(e.target.value)}
            maxLength={160}
          />
          <Select
            label="Giao cho hội viên (tùy chọn)"
            value={duplicateMemberId}
            onChange={(e) => setDuplicateMemberId(e.target.value)}
            options={memberOptions}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDuplicateTarget(null)}>
            Huỷ
          </Button>
          <Button
            isLoading={duplicateMutation.isPending}
            onClick={() =>
              duplicateTarget &&
              duplicateMutation.mutate({
                id: duplicateTarget.id,
                title: duplicateTitle,
                memberId: duplicateMemberId,
              })
            }
          >
            <Copy className="size-4" />
            Nhân bản
          </Button>
        </div>
      </Dialog>

      {/* Dialog xoá */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Xoá thực đơn?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" sẽ bị xoá vĩnh viễn. Hành động này không hoàn tác.`
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

      {/* Dialog tạo/sửa */}
      <Dialog
        open={editorOpen}
        onClose={closeEditor}
        title={editingId ? 'Chỉnh sửa thực đơn' : 'Tạo thực đơn'}
        description="Thực đơn cần ít nhất một bữa ăn; mỗi bữa cần ít nhất một món."
        className="max-w-3xl"
      >
        <div className="space-y-5">
          <Input
            label="Tên thực đơn *"
            value={form.title}
            onChange={(e) => patchForm({ title: e.target.value })}
            placeholder="VD: Thực đơn tăng cơ tuần 1"
            maxLength={160}
            error={formError && !form.title.trim() ? 'Bắt buộc' : undefined}
          />

          <div>
            <label
              htmlFor="meal-plan-description"
              className="mb-1.5 block text-sm font-semibold text-muted"
            >
              Mô tả / hướng dẫn
            </label>
            <textarea
              id="meal-plan-description"
              value={form.description}
              onChange={(e) => patchForm({ description: e.target.value })}
              rows={2}
              maxLength={2000}
              placeholder="Ghi chú cho hội viên..."
              className="w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-chalk placeholder:text-muted/70 focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Kiểu thực đơn"
              value={form.scope}
              onChange={(e) => patchForm({ scope: e.target.value as MealPlanScope })}
              options={[
                { value: 'DAY', label: 'Theo ngày' },
                { value: 'WEEK', label: 'Theo tuần' },
              ]}
            />
            <Input
              type="date"
              label="Ngày bắt đầu"
              value={form.startDate}
              onChange={(e) => patchForm({ startDate: e.target.value })}
            />
            <Select
              label="Giao cho hội viên"
              value={form.memberId}
              onChange={(e) => patchForm({ memberId: e.target.value })}
              options={memberOptions}
            />
            <Select
              label="Loại thực đơn"
              value={form.isTemplate ? 'template' : 'assign'}
              onChange={(e) => patchForm({ isTemplate: e.target.value === 'template' })}
              options={[
                { value: 'assign', label: 'Giao hội viên' },
                { value: 'template', label: 'Lưu làm mẫu' },
              ]}
            />
          </div>

          {form.isTemplate && (
            <Input
              label="Tên mẫu"
              value={form.templateName}
              onChange={(e) => patchForm({ templateName: e.target.value })}
              placeholder="Đặc tên cho mẫu (bỏ trống = dùng tên thực đơn)"
              maxLength={160}
            />
          )}

          {/* Bữa ăn */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold uppercase text-chalk">Bữa ăn</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, meals: [...f.meals, emptyMeal()] }))}
              >
                <Plus className="size-3.5" />
                Thêm bữa
              </Button>
            </div>

            {form.meals.map((meal, mi) => (
              <div key={mi} className="rounded-xl border border-line bg-ink p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={meal.type}
                    onChange={(e) => patchMeal(mi, { type: e.target.value as MealType })}
                    options={MEAL_TYPE_OPTIONS}
                    aria-label="Loại bữa"
                    className="w-40"
                  />
                  {form.scope === 'WEEK' && (
                    <Select
                      value={meal.dayIndex}
                      onChange={(e) => patchMeal(mi, { dayIndex: e.target.value })}
                      options={[
                        { value: '', label: 'Mọi ngày' },
                        ...DAY_LABELS.map((d, i) => ({ value: String(i), label: d })),
                      ]}
                      aria-label="Ngày trong tuần"
                      className="w-36"
                    />
                  )}
                  <Input
                    type="time"
                    value={meal.time}
                    onChange={(e) => patchMeal(mi, { time: e.target.value })}
                    aria-label="Giờ ăn"
                    className="w-36"
                  />
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger"
                      disabled={form.meals.length <= 1}
                      onClick={() =>
                        setForm((f) => ({ ...f, meals: f.meals.filter((_, i) => i !== mi) }))
                      }
                      aria-label="Xoá bữa"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>

                <Input
                  value={meal.note}
                  onChange={(e) => patchMeal(mi, { note: e.target.value })}
                  placeholder="Ghi chú bữa này (không bắt buộc)"
                  className="mt-2"
                  maxLength={1000}
                />

                {/* Món ăn */}
                <div className="mt-3 space-y-3">
                  {meal.items.map((item, ii) => (
                    <div
                      key={ii}
                      className="grid grid-cols-2 gap-2 rounded-lg border border-line/60 p-2.5 sm:grid-cols-7"
                    >
                      <div className="col-span-2 sm:col-span-2">
                        <Input
                          value={item.name}
                          onChange={(e) => patchItem(mi, ii, { name: e.target.value })}
                          placeholder="Tên món *"
                          maxLength={120}
                        />
                      </div>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => patchItem(mi, ii, { quantity: e.target.value })}
                        placeholder="KL *"
                        min={0}
                      />
                      <Input
                        value={item.unit}
                        onChange={(e) => patchItem(mi, ii, { unit: e.target.value })}
                        placeholder="ĐVT"
                        maxLength={20}
                      />
                      <Input
                        type="number"
                        value={item.calories}
                        onChange={(e) => patchItem(mi, ii, { calories: e.target.value })}
                        placeholder="Kcal"
                        min={0}
                      />
                      <Input
                        type="number"
                        value={item.protein}
                        onChange={(e) => patchItem(mi, ii, { protein: e.target.value })}
                        placeholder="P (g)"
                        min={0}
                      />
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={item.carbs}
                          onChange={(e) => patchItem(mi, ii, { carbs: e.target.value })}
                          placeholder="C (g)"
                          min={0}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-danger hover:text-danger"
                          disabled={meal.items.length <= 1}
                          onClick={() =>
                            patchMeal(mi, {
                              items: meal.items.filter((_, j) => j !== ii),
                            })
                          }
                          aria-label="Xoá món"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => patchMeal(mi, { items: [...meal.items, emptyItem()] })}
                  >
                    <Plus className="size-3.5" />
                    Thêm món
                  </Button>
                </div>
              </div>
            ))}
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
            {editingId ? 'Lưu thay đổi' : 'Tạo thực đơn'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
