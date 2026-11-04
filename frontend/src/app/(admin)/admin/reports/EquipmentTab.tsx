import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { MethodBars } from '@/components/charts/bar-chart';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

import apiClient from '@/lib/axios';

export function EquipmentTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-equipment-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/equipment/stats');
      return res.data;
    },
    retry: 1,
  });

  const stats = useMemo(() => (data || []) as { status: string; count: number }[], [data]);

  const chartData = useMemo(() => {
    return stats.map((s) => ({ label: s.status, value: s.count }));
  }, [stats]);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError || !stats.length)
    return (
      <EmptyState
        icon={BarChart3}
        title="Không có dữ liệu"
        description="Chưa có thiết bị nào được ghi nhận."
      />
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard
            key={s.status}
            title={s.status}
            value={String(s.count)}
            subtitle={
              s.status === 'AVAILABLE'
                ? 'Sẵn sàng'
                : s.status === 'INACTIVE'
                  ? 'Không hoạt động'
                  : s.status === 'MAINTENANCE'
                    ? 'Bảo trì'
                    : 'Hỏng'
            }
            icon={BarChart3}
            colorScheme={
              s.status === 'AVAILABLE' ? 'neon' : s.status === 'MAINTENANCE' ? 'amber' : 'rose'
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard
          title="Phân bố trạng thái"
          value={`${stats.length}`}
          subtitle="Nhóm trạng thái"
          icon={BarChart3}
        />
        <div>
          <h3 className="text-sm font-bold text-chalk mb-2">Thống kê theo trạng thái</h3>
          <MethodBars data={chartData.map((d) => ({ label: d.label, value: d.value }))} />
        </div>
      </div>
    </div>
  );
}
