'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Phone, MapPin, Clock, Users, Dumbbell } from 'lucide-react';

export default function BranchesPage() {
  const { data: branches, isLoading, isError } = useQuery({
    queryKey: ['branches-list'],
    queryFn: async () => {
      const res = await apiClient.get('/branches');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-500" />
            Hệ Thống Chi Nhánh Phòng Tập (Branches)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý mạng lưới chi nhánh, cơ sở phòng tập, số điện thoại và giờ mở cửa
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Mở Thêm Chi Nhánh
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Đang tải danh sách chi nhánh...</div>
      ) : isError ? (
        <div className="py-20 text-center text-xs text-rose-500">Lỗi kết nối API chi nhánh.</div>
      ) : branches && branches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((b: any) => (
            <Card key={b.id} className="hover:border-emerald-500/40 transition-all">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <Badge variant="outline" className="font-mono text-[10px] mb-2">{b.code}</Badge>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">{b.name}</CardTitle>
                </div>
                <Badge variant="success">{b.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-2 text-xs">
                <p className="text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{b.phone}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{b.openingHours || '05:30 - 21:30'}</span>
                </p>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950">
                    <span className="text-[10px] text-slate-400 block">Hội viên</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{b._count?.members || 0}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950">
                    <span className="text-[10px] text-slate-400 block">Thiết bị</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{b._count?.equipment || 0}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950">
                    <span className="text-[10px] text-slate-400 block">Nhân sự</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{b._count?.users || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-xs text-slate-400">
            Chưa có chi nhánh nào được cấu hình.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
