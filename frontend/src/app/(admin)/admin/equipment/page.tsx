'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Plus } from 'lucide-react';

export default function EquipmentPage() {
  const { data: equipment, isLoading, isError } = useQuery({
    queryKey: ['equipment-list'],
    queryFn: async () => {
      const res = await apiClient.get('/equipment');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-neon" />
            Thiết Bị & Máy Móc Phòng Tập (Equipment)
          </h1>
          <p className="text-xs text-muted mt-1">
            Quản lý cơ sở vật chất, máy chạy, giàn tạ và theo dõi lịch bảo dưỡng định kỳ
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Khai Báo Thiết Bị Mới
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted">Đang tải danh mục thiết bị...</div>
          ) : isError ? (
            <div className="py-16 text-center text-xs text-danger">Lỗi kết nối API thiết bị.</div>
          ) : equipment && equipment.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Mã tài sản</th>
                    <th className="py-3 px-4">Tên thiết bị</th>
                    <th className="py-3 px-4">Phân loại</th>
                    <th className="py-3 px-4">Vị trí phòng</th>
                    <th className="py-3 px-4">Chi nhánh</th>
                    <th className="py-3 px-4 text-right">Trạng thái vận hành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {equipment.map((item: any) => (
                    <tr key={item.id} className="hover:bg-line/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-chalk">
                        {item.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-chalk">
                        {item.name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted">{item.room?.name || 'Khu chung'}</td>
                      <td className="py-3 px-4 text-muted">{item.branch?.name}</td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={item.status === 'OPERATIONAL' ? 'success' : 'warning'}>
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-muted">Chưa có thiết bị nào trong hệ thống.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
