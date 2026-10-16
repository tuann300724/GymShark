'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrainerGuard } from '@/components/guards/trainer-guard';
import { mealPlanApi, type MealPlan } from '@/services/meal-plan.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Utensils, Plus, Send, Trash2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TrainerMealPlansPage() {
  return (
    <TrainerGuard>
      <MealPlans />
    </TrainerGuard>
  );
}

function MealPlans() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-meal-plans', search],
    queryFn: () => mealPlanApi.listTrainer({ limit: 50, search }),
  });

  const plans = data?.data ?? [];
  const filtered = plans.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            Thực đơn dinh dưỡng
          </h1>
          <p className="mt-1 text-sm text-muted">Tạo và quản lý thực đơn gửi cho hội viên.</p>
        </div>
        <Button size="sm" onClick={() => router.push('/trainer/meal-plans/builder')}>
          <Plus className="size-4" /> Tạo mới
        </Button>
      </div>

      <Card className="border-line bg-surface/95 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="size-4" /> Danh sách ({filtered.length})
          </CardTitle>
          <Input
            placeholder="Tìm thực đơn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="divide-y divide-line/60">
              {filtered.map((p: MealPlan) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-chalk">{p.title}</p>
                    <p className="text-xs text-muted">
                      {p.scope === 'WEEK' ? 'Theo tuần' : 'Theo ngày'} • {p.meals.length} bữa •{' '}
                      {p.totalCalories} kcal
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        p.status === 'CONFIRMED'
                          ? 'default'
                          : p.status === 'SENT'
                            ? 'info'
                            : 'outline'
                      }
                    >
                      {p.status === 'CONFIRMED'
                        ? 'Đã xác nhận'
                        : p.status === 'SENT'
                          ? 'Đã gửi'
                          : 'Nháp'}
                    </Badge>
                    {p.status !== 'CONFIRMED' && (
                      <>
                        <Button size="sm" variant="outline">
                          <Send className="size-3.5" /> Gửi
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">Chưa có thực đơn nào.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
