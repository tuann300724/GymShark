'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { CalendarDays, Plus } from 'lucide-react';

export default function SchedulesPage() {
  const { data: schedules, isLoading, isError } = useQuery({
    queryKey: ['schedules-list'],
    queryFn: async () => {
      const res = await apiClient.get('/schedules');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-neon" />
            Lịch Tập Luyện & Lớp Học PT (Schedules)
          </h1>
          <p className="text-xs text-muted mt-1">
            Theo dõi lịch hẹn tập cùng huấn luyện viên, các lớp học nhóm và phòng tập tương ứng
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Đặt Lịch Tập Mới
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted">Đang tải lịch tập...</div>
          ) : isError ? (
            <div className="py-16 text-center text-xs text-danger">Lỗi kết nối API lịch tập.</div>
          ) : schedules && schedules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Buổi tập / Lớp</th>
                    <th className="py-3 px-4">Huấn luyện viên</th>
                    <th className="py-3 px-4">Hội viên</th>
                    <th className="py-3 px-4">Phòng tập</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {schedules.map((s: any) => (
                    <tr key={s.id} className="hover:bg-line/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-chalk">{s.title}</td>
                      <td className="py-3 px-4 font-semibold text-neon">
                        {s.trainer?.user?.fullName}
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {s.member?.fullName || 'Lớp tập thể (Nhiều HV)'}
                      </td>
                      <td className="py-3 px-4 text-muted">{s.room?.name || 'Khu tự do'}</td>
                      <td className="py-3 px-4 font-mono text-muted">
                        {formatDateTime(s.startTime)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={s.status === 'SCHEDULED' ? 'info' : 'success'}>
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-muted">
              Hiện chưa có buổi tập hoặc lớp học nào được lên lịch.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
