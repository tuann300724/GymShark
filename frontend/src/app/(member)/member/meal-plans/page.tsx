'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mealPlanApi, type MealPlan, type Meal } from '@/services/meal-plan.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { cn, formatDate } from '@/lib/utils';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  RefreshCw,
  Search,
  Utensils,
} from 'lucide-react';

const PAGE_SIZE = 8;

const STATUS_META: Record<string, { label: string; variant: 'default' | 'success' | 'warning' }> = {
  DRAFT: { label: 'Bản nháp', variant: 'warning' },
  SENT: { label: 'Chờ xác nhận', variant: 'default' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'success' },
};

const MEAL_TYPE_LABEL: Record<string, string> = {
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  DINNER: 'Bữa tối',
  SNACK: 'Bữa phụ',
};

const SCOPE_LABEL: Record<string, string> = {
  DAY: 'Theo ngày',
  WEEK: 'Theo tuần',
};

export default function MemberMealPlansPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['member-meal-plans', page, search],
    queryFn: () =>
      mealPlanApi.listMember({ page, limit: PAGE_SIZE, search: search.trim() || undefined }),
    retry: 0,
  });

  const plans = data?.data || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));

  const detailQuery = useQuery({
    queryKey: ['member-meal-plan-detail', detailId],
    queryFn: () => mealPlanApi.get(detailId!),
    enabled: Boolean(detailId),
    retry: 0,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => mealPlanApi.confirm(id),
    onSuccess: () => {
      toast.success('Đã xác nhận thực đơn', 'Huấn luyện viên sẽ nhận được phản hồi của bạn.');
      queryClient.invalidateQueries({ queryKey: ['member-meal-plans'] });
      queryClient.invalidateQueries({ queryKey: ['member-meal-plan-detail'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không xác nhận được thực đơn. Thử lại.';
      toast.error('Xác nhận thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Utensils className="size-6 text-neon" />
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-chalk">
            Thực đơn của tôi
          </h1>
          <p className="text-sm text-muted">
            Các kế hoạch dinh dưỡng huấn luyện viên dành cho bạn.
          </p>
        </div>
      </header>

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm thực đơn..."
            className="pl-9"
            aria-label="Tìm thực đơn"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['member-meal-plans'] })}
          aria-label="Tải lại"
        >
          <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
        </Button>
      </div>

      {/* Danh sách */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Utensils className="size-8 text-muted" />
            <p className="text-sm text-muted">
              {search.trim()
                ? 'Không tìm thấy thực đơn nào khớp.'
                : 'Bạn chưa được giao thực đơn nào. Huấn luyện viên sẽ gửi thực đơn qua mục này.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const meta = STATUS_META[plan.status] || STATUS_META.DRAFT;
            return (
              <Card key={plan.id} className="transition-colors hover:border-neon/40">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-bold uppercase leading-tight text-chalk">
                      {plan.title}
                    </h2>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>

                  {plan.description && (
                    <p className="line-clamp-2 text-sm text-muted">{plan.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {SCOPE_LABEL[plan.scope] || plan.scope}
                      {plan.startDate ? ` • từ ${formatDate(plan.startDate)}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Utensils className="size-3.5" />
                      {plan._count?.meals ?? plan.meals?.length ?? 0} bữa
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 rounded-xl border border-line bg-ink p-2.5 text-center">
                    <Macro label="Kcal" value={plan.totalCalories} highlight />
                    <Macro label="Protein" value={plan.totalProtein} unit="g" />
                    <Macro label="Carb" value={plan.totalCarbs} unit="g" />
                    <Macro label="Fat" value={plan.totalFat} unit="g" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDetailId(plan.id)}>
                      Xem chi tiết
                    </Button>
                    {plan.status === 'SENT' && (
                      <Button
                        size="sm"
                        isLoading={
                          confirmMutation.isPending && confirmMutation.variables === plan.id
                        }
                        onClick={() => confirmMutation.mutate(plan.id)}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Xác nhận
                      </Button>
                    )}
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

      {/* Dialog chi tiết */}
      <Dialog
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        title={detailQuery.data?.title || 'Chi tiết thực đơn'}
        description={
          detailQuery.data
            ? `${SCOPE_LABEL[detailQuery.data.scope] || detailQuery.data.scope}${
                detailQuery.data.startDate ? ` • từ ${formatDate(detailQuery.data.startDate)}` : ''
              }`
            : undefined
        }
        className="max-w-2xl"
      >
        {detailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : detailQuery.data ? (
          <MealPlanDetail plan={detailQuery.data} />
        ) : (
          <p className="text-sm text-muted">Không tải được chi tiết thực đơn.</p>
        )}

        {detailQuery.data?.status === 'SENT' && (
          <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="outline" onClick={() => setDetailId(null)}>
              Đóng
            </Button>
            <Button
              isLoading={confirmMutation.isPending}
              onClick={() => confirmMutation.mutate(detailQuery.data!.id)}
            >
              <CheckCircle2 className="size-4" />
              Xác nhận thực đơn
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}

/* ------------------------------- Helpers ------------------------------- */

function Macro({
  label,
  value,
  unit = '',
  highlight = false,
}: {
  label: string;
  value: number | null | undefined;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          'font-display text-lg font-bold leading-none',
          highlight ? 'text-neon' : 'text-chalk',
        )}
      >
        {value ?? 0}
        {unit}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

function MealPlanDetail({ plan }: { plan: MealPlan }) {
  const meals = [...(plan.meals || [])].sort((a, b) => a.orderIndex - b.orderIndex);

  if (meals.length === 0) {
    return <p className="text-sm text-muted">Thực đơn này chưa có bữa ăn nào.</p>;
  }

  return (
    <div className="space-y-4">
      {plan.description && <p className="text-sm leading-relaxed text-muted">{plan.description}</p>}

      <div className="grid grid-cols-4 gap-2 rounded-xl border border-line bg-ink p-3 text-center">
        <Macro label="Tổng kcal" value={plan.totalCalories} highlight />
        <Macro label="Protein" value={plan.totalProtein} unit="g" />
        <Macro label="Carb" value={plan.totalCarbs} unit="g" />
        <Macro label="Fat" value={plan.totalFat} unit="g" />
      </div>

      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}
    </div>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  const items = [...(meal.items || [])].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="rounded-xl border border-line bg-ink p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold uppercase text-neon">
          {MEAL_TYPE_LABEL[meal.type] || meal.type}
          {meal.dayIndex != null ? ` • Ngày ${meal.dayIndex + 1}` : ''}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted">
          {meal.time && <span>{meal.time}</span>}
          <span className="inline-flex items-center gap-1">
            <Flame className="size-3.5" />
            {meal.totalCalories} kcal
          </span>
        </div>
      </div>

      {meal.note && <p className="mt-1 text-sm italic text-muted">{meal.note}</p>}

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 border-b border-line/60 pb-2 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-chalk">{item.name}</p>
              <p className="text-xs text-muted">
                {item.quantity} {item.unit} • P {item.protein}g · C {item.carbs}g · F {item.fat}g
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-neon">{item.calories} kcal</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
