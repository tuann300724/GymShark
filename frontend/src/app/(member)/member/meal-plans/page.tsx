'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MemberGuard } from '@/components/guards/member-guard';
import { mealPlanApi, type MealPlan } from '@/services/meal-plan.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Utensils, Check } from 'lucide-react';

export default function MemberMealPlansPage() {
  return (
    <MemberGuard>
      <MealPlans />
    </MemberGuard>
  );
}

function MealPlans() {
  const { data, isLoading } = useQuery({
    queryKey: ['member-meal-plans'],
    queryFn: () => mealPlanApi.listMember({ limit: 50 }),
  });

  const plans = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Thực đơn của tôi
        </h1>
        <p className="mt-1 text-sm text-muted">Xem thực đơn dinh dưỡng do HLV gửi.</p>
      </div>

      <Card className="border-line bg-surface/95 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="size-4" /> Thực đơn
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="divide-y divide-line/60">
              {plans.map((p: MealPlan) => (
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
                          ? 'Chờ xác nhận'
                          : 'Nháp'}
                    </Badge>
                    {p.status === 'SENT' && (
                      <Button size="sm" variant="outline">
                        <Check className="size-3.5" /> Xác nhận
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {plans.length === 0 && (
                <EmptyState
                  icon={Utensils}
                  title="Chưa có thực đơn nào"
                  description="HLV sẽ gửi thực đơn dinh dưỡng cho bạn trong thời gian tới."
                  className="border-0 bg-transparent py-8"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
