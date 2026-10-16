'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminGuard } from '@/components/guards/admin-guard';
import { foodApi, type FoodItem } from '@/services/food.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed, Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminFoodsPage() {
  return (
    <AdminGuard>
      <Foods />
    </AdminGuard>
  );
}

function Foods() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-foods', search],
    queryFn: () => foodApi.list({ limit: 50, search }),
  });

  const foods = data?.data ?? [];

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
        <Button size="sm">
          <Plus className="size-4" /> Thêm
        </Button>
      </div>

      <Card className="border-line bg-surface/95 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="size-4" /> Danh sách ({data?.total ?? 0})
          </CardTitle>
          <Input
            placeholder="Tìm theo tên..."
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
              {foods.map((f: FoodItem) => (
                <div key={f.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-chalk">{f.name}</p>
                      {!f.isActive && <Badge variant="info">Ẩn</Badge>}
                    </div>
                    <p className="text-xs text-muted">
                      {f.category} • {f.caloriesPer100g} kcal/100g • P{f.proteinPer100g} C
                      {f.carbsPer100g} F{f.fatPer100g}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Pencil className="size-3.5" /> Sửa
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {foods.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">Chưa có thực phẩm nào.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
