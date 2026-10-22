'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { TrainerGuard } from '@/components/guards/trainer-guard';
import { mealPlanApi, type MealPlan, type MealType } from '@/services/meal-plan.service';
import { foodApi, type FoodItem } from '@/services/food.service';
import { trainerApi } from '@/services/trainer.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  Utensils,
  Plus,
  Trash2,
  Send,
  Save,
  Search,
  Minus,
  User,
  CalendarDays,
  Clock,
} from 'lucide-react';

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'BREAKFAST', label: 'Bữa sáng' },
  { value: 'LUNCH', label: 'Bữa trưa' },
  { value: 'DINNER', label: 'Bữa tối' },
  { value: 'SNACK', label: 'Ăn nhẹ' },
];

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

const CATEGORY_LABELS: Record<string, string> = {
  PROTEIN: 'Đạm',
  CARBOHYDRATE: 'Tinh bột',
  VEGETABLE: 'Rau củ',
  FRUIT: 'Trái cây',
  DAIRY: 'Sữa',
  FAT: 'Chất béo',
  DRINK: 'Đồ uống',
  SNACK: 'Ăn vặt',
  OTHER: 'Khác',
};

interface MealItemDraft {
  foodId: string | null;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealDraft {
  type: MealType;
  dayIndex: number | null;
  time: string;
  note: string;
  items: MealItemDraft[];
}

export default function MealPlanBuilderPage() {
  return (
    <TrainerGuard>
      <Builder />
    </TrainerGuard>
  );
}

function Builder() {
  const router = useRouter();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'DAY' | 'WEEK'>('DAY');
  const [startDate, setStartDate] = useState('');
  const [memberId, setMemberId] = useState('');
  const [meals, setMeals] = useState<MealDraft[]>([]);
  const [sending, setSending] = useState(false);

  const { data: members } = useQuery({
    queryKey: ['trainer-members'],
    queryFn: trainerApi.myMembers,
  });

  const activeMembers = (members || []).filter((a: any) => a.status === 'ACTIVE');

  const addMeal = () => {
    setMeals((prev) => [
      ...prev,
      {
        type: 'BREAKFAST',
        dayIndex: scope === 'WEEK' ? 0 : null,
        time: '07:30',
        note: '',
        items: [],
      },
    ]);
  };

  const removeMeal = (idx: number) => {
    setMeals((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMeal = (idx: number, patch: Partial<MealDraft>) => {
    setMeals((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const addItem = (mealIdx: number) => {
    setMeals((prev) =>
      prev.map((m, i) =>
        i === mealIdx
          ? {
              ...m,
              items: [
                ...m.items,
                {
                  foodId: null,
                  name: '',
                  imageUrl: null,
                  quantity: 100,
                  unit: 'g',
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                },
              ],
            }
          : m,
      ),
    );
  };

  const removeItem = (mealIdx: number, itemIdx: number) => {
    setMeals((prev) =>
      prev.map((m, i) =>
        i === mealIdx ? { ...m, items: m.items.filter((_, j) => j !== itemIdx) } : m,
      ),
    );
  };

  const updateItem = (mealIdx: number, itemIdx: number, patch: Partial<MealItemDraft>) => {
    setMeals((prev) =>
      prev.map((m, i) =>
        i === mealIdx
          ? { ...m, items: m.items.map((it, j) => (j === itemIdx ? { ...it, ...patch } : it)) }
          : m,
      ),
    );
  };

  const calcNutrition = (items: MealItemDraft[]) => {
    const total = items.reduce(
      (acc, it) => ({
        calories: acc.calories + (it.calories * it.quantity) / 100,
        protein: acc.protein + (it.protein * it.quantity) / 100,
        carbs: acc.carbs + (it.carbs * it.quantity) / 100,
        fat: acc.fat + (it.fat * it.quantity) / 100,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return {
      calories: Math.round(total.calories),
      protein: Math.round(total.protein * 10) / 10,
      carbs: Math.round(total.carbs * 10) / 10,
      fat: Math.round(total.fat * 10) / 10,
    };
  };

  const grandTotal = meals.reduce(
    (acc, m) => {
      const n = calcNutrition(m.items);
      return {
        calories: acc.calories + n.calories,
        protein: acc.protein + n.protein,
        carbs: acc.carbs + n.carbs,
        fat: acc.fat + n.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const buildPayload = (status: 'DRAFT' | 'SENT') => ({
    title: title.trim(),
    description: description.trim() || undefined,
    scope,
    startDate: startDate || undefined,
    memberId: memberId || undefined,
    status,
    meals: meals.map((m) => ({
      type: m.type,
      dayIndex: m.dayIndex,
      time: m.time || undefined,
      note: m.note.trim() || undefined,
      items: m.items.map((it) => ({
        foodId: it.foodId || undefined,
        name: it.name.trim(),
        imageUrl: it.imageUrl,
        quantity: it.quantity,
        unit: it.unit || 'g',
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
      })),
    })),
  });

  const saveMut = useMutation({
    mutationFn: (status: 'DRAFT' | 'SENT') => mealPlanApi.create(buildPayload(status)),
    onSuccess: (plan: MealPlan) => {
      if (memberId && plan.status === 'SENT') {
        mealPlanApi.send(plan.id, { content: description.trim() || undefined }).catch(() => {});
      }
      qc.invalidateQueries({ queryKey: ['trainer-meal-plans'] });
      router.push('/trainer/meal-plans');
    },
  });

  const handleSave = () => saveMut.mutate('DRAFT');
  const handleSend = () => {
    if (!memberId) return;
    setSending(true);
    saveMut.mutate('SENT');
  };

  const isValid = title.trim() && meals.length > 0 && meals.every((m) => m.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 lg:px-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            Tạo thực đơn
          </h1>
          <p className="mt-1 text-sm text-muted">
            Xây dựng thực đơn dinh dưỡng và gửi cho hội viên.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={!isValid || saveMut.isPending}>
            <Save className="size-4" /> Lưu nháp
          </Button>
          <Button onClick={handleSend} disabled={!isValid || !memberId || saveMut.isPending}>
            <Send className="size-4" /> Gửi cho hội viên
          </Button>
        </div>
      </div>

      {/* Thông tin cơ bản */}
      <Card className="border-line bg-surface/95 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="size-4" /> Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="builder-title" className="mb-1 block text-xs font-semibold text-muted">
              Tên thực đơn *
            </label>
            <Input
              id="builder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thực đơn tăng cơ tuần 1"
              maxLength={160}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="builder-description"
              className="mb-1 block text-xs font-semibold text-muted"
            >
              Mô tả / hướng dẫn
            </label>
            <Input
              id="builder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú cho hội viên..."
              maxLength={2000}
            />
          </div>
          <div>
            <p className="mb-1 block text-xs font-semibold text-muted">Phạm vi</p>
            <div className="flex gap-2">
              {(['DAY', 'WEEK'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={cn(
                    'rounded-sm border px-3 py-2 text-sm font-medium transition-colors',
                    scope === s
                      ? 'border-neon bg-neon/10 text-neon'
                      : 'border-line bg-ink text-muted hover:text-chalk',
                  )}
                >
                  {s === 'DAY' ? 'Theo ngày' : 'Theo tuần'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="builder-start-date"
              className="mb-1 block text-xs font-semibold text-muted"
            >
              Ngày bắt đầu
            </label>
            <Input
              id="builder-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="builder-member" className="mb-1 block text-xs font-semibold text-muted">
              <User className="mr-1 inline size-3" /> Hội viên nhận
            </label>
            <select
              id="builder-member"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="h-10 w-full rounded-sm border border-line bg-ink px-3 text-sm text-chalk [&>option]:bg-surface [&>option]:text-chalk focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
            >
              <option value="">— Chọn hội viên —</option>
              {activeMembers.map((a: any) => (
                <option key={a.member?.id} value={a.member?.id}>
                  {a.member?.fullName} ({a.member?.code})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bữa ăn */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-chalk">
            Bữa ăn ({meals.length})
          </h2>
          <Button size="sm" variant="outline" onClick={addMeal}>
            <Plus className="size-4" /> Thêm bữa
          </Button>
        </div>

        {meals.map((meal, mi) => {
          const nutrition = calcNutrition(meal.items);
          return (
            <Card key={mi} className="border-line bg-surface/95 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={meal.type}
                    onChange={(e) => updateMeal(mi, { type: e.target.value as MealType })}
                    className="h-9 rounded-sm border border-line bg-ink px-2 text-sm text-chalk focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
                  >
                    {MEAL_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {scope === 'WEEK' && (
                    <select
                      value={meal.dayIndex ?? 0}
                      onChange={(e) => updateMeal(mi, { dayIndex: Number(e.target.value) })}
                      className="h-9 rounded-sm border border-line bg-ink px-2 text-sm text-chalk focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
                    >
                      {DAY_LABELS.map((d, i) => (
                        <option key={i} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="size-3.5 text-muted" />
                    <Input
                      type="time"
                      value={meal.time}
                      onChange={(e) => updateMeal(mi, { time: e.target.value })}
                      className="h-9 w-28"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{nutrition.calories} kcal</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Xóa bữa ăn"
                    onClick={() => removeMeal(mi)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {meal.items.map((item, ii) => (
                  <FoodItemRow
                    key={ii}
                    item={item}
                    onChange={(patch) => updateItem(mi, ii, patch)}
                    onRemove={() => removeItem(mi, ii)}
                  />
                ))}
                <Button size="sm" variant="outline" onClick={() => addItem(mi)}>
                  <Plus className="size-3.5" /> Thêm món
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {meals.length === 0 && (
          <EmptyState
            icon={Utensils}
            title="Chưa có bữa ăn nào"
            description="Bấm “Thêm bữa” để bắt đầu xây dựng thực đơn."
            action={
              <Button size="sm" variant="secondary" onClick={addMeal}>
                <Plus className="size-4" /> Thêm bữa
              </Button>
            }
            className="border-line"
          />
        )}
      </div>

      {/* Tổng dinh dưỡng */}
      {meals.length > 0 && (
        <Card className="border-line bg-surface/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Tổng dinh dưỡng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <NutritionStat label="Calo" value={grandTotal.calories} unit="kcal" />
              <NutritionStat label="Protein" value={grandTotal.protein} unit="g" />
              <NutritionStat label="Carbs" value={grandTotal.carbs} unit="g" />
              <NutritionStat label="Chất béo" value={grandTotal.fat} unit="g" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NutritionStat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-sm border border-line bg-ink p-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display text-xl font-bold text-neon">
        {value}
        <span className="ml-1 text-xs font-normal text-muted">{unit}</span>
      </p>
    </div>
  );
}

function FoodItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: MealItemDraft;
  onChange: (patch: Partial<MealItemDraft>) => void;
  onRemove: () => void;
}) {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: foods, isLoading } = useQuery({
    queryKey: ['foods-search', search],
    queryFn: () => foodApi.list({ search, limit: 50 }),
    enabled: showSearch,
  });



  const pickFood = (f: FoodItem) => {
    onChange({
      foodId: f.id,
      name: f.name,
      imageUrl: f.imageUrl,
      calories: f.caloriesPer100g,
      protein: f.proteinPer100g,
      carbs: f.carbsPer100g,
      fat: f.fatPer100g,
      unit: 'g',
    });
    setShowSearch(false);
    setSearch('');
  };

  return (
    <div className="rounded-sm border border-line bg-ink p-3">
      <div className="flex flex-wrap items-center gap-2">
        {item.foodId ? (
          <Badge variant="default">{item.name}</Badge>
        ) : (
          <Input
            value={item.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Tên món ăn"
            className="h-9 flex-1 min-w-[140px]"
          />
        )}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => onChange({ quantity: Number(e.target.value) })}
            className="h-9 w-20"
            min={0}
          />
          <span className="text-xs text-muted">g</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowSearch(!showSearch)}>
          <Search className="size-3.5" /> Thư viện
        </Button>
        <Button size="sm" variant="ghost" aria-label="Xóa món ăn" onClick={onRemove}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {item.foodId && (
        <div className="mt-2 flex gap-3 text-xs text-muted">
          <span>{item.calories} kcal/100g</span>
          <span>P {item.protein}g</span>
          <span>C {item.carbs}g</span>
          <span>F {item.fat}g</span>
        </div>
      )}

      {showSearch && (
        <div className="mt-3 border-t border-line pt-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món trong thư viện..."
            className="mb-2 h-9"
          />
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <div className="max-h-64 space-y-1 overflow-auto">
              {(foods?.data ?? []).map((f) => (
                <button
                  key={f.id}
                  onClick={() => pickFood(f)}
                  className="flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-left text-sm transition hover:bg-line/30"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-chalk">{f.name}</span>
                    <span className="block text-[10px] text-muted">
                      {CATEGORY_LABELS[f.category] ?? f.category} • P {f.proteinPer100g}g • C{' '}
                      {f.carbsPer100g}g • F {f.fatPer100g}g
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-neon">
                    {f.caloriesPer100g} kcal
                  </span>
                </button>
              ))}
              {(foods?.data ?? []).length === 0 && (
                <p className="py-2 text-center text-xs text-muted">
                  Không tìm thấy món nào — thử từ khoá khác (gà, cá, cơm, chuối...)
                </p>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
