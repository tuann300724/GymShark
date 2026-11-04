import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { MethodBars } from '@/components/charts/bar-chart';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/lib/axios';

interface EquipmentStat {
  status: string;
  count: number;
}

export function EquipmentReportTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-equipment-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/equipment/stats');
      return res.data as EquipmentStat[];
    },
    retry: 1,
  });

  const stats = useMemo(() => data ?? [], [data]);
  const chartData = useMemo(
    () => stats.map((stat) => ({ label: stat.status, value: stat.count })),
    [stats],
  );

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.status}
            title={stat.status}
            value={String(stat.count)}
            subtitle={
              stat.status === 'AVAILABLE'
                ? 'Sẵn sàng'
                : stat.status === 'INACTIVE'
                  ? 'Không hoạt động'
                  : stat.status === 'MAINTENANCE'
                    ? 'Bảo trì'
                    : 'Hỏng'
            }
            icon={BarChart3}
            colorScheme={
              stat.status === 'AVAILABLE'
                ? 'neon'
                : stat.status === 'MAINTENANCE'
                  ? 'amber'
                  : 'rose'
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatCard
          title="Phân bố trạng thái"
          value={String(stats.length)}
          subtitle="Nhóm trạng thái"
          icon={BarChart3}
        />
        <div>
          <h3 className="mb-2 text-sm font-bold text-chalk">Thống kê theo trạng thái</h3>
          <MethodBars data={chartData} />
        </div>
      </div>
    </div>
  );
}
