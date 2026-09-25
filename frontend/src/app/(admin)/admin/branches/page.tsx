'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Phone, MapPin, Clock } from 'lucide-react';

export default function BranchesPage() {
  const {
    data: branches,
    isLoading,
    isError,
  } = useQuery({
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
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <Building2 className="size-6 text-neon" />
            Hệ Thống Chi Nhánh Phòng Tập (Branches)
          </h1>
          <p className="text-xs text-muted mt-1">
            Quản lý mạng lưới chi nhánh, cơ sở phòng tập, số điện thoại và giờ mở cửa
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs">
          <Plus className="size-4 mr-1.5" />
          Mở Thêm Chi Nhánh
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted">Đang tải danh sách chi nhánh...</div>
      ) : isError ? (
        <div className="py-20 text-center text-xs text-danger">Lỗi kết nối API chi nhánh.</div>
      ) : branches && branches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((b: any) => (
            <Card key={b.id} className="hover:border-neon/40 transition-all">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <Badge variant="outline" className="font-mono text-[10px] mb-2">
                    {b.code}
                  </Badge>
                  <CardTitle className="text-lg text-chalk">{b.name}</CardTitle>
                </div>
                <Badge variant="success">{b.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-2 text-xs">
                <p className="text-muted flex items-start gap-2">
                  <MapPin className="size-4 text-neon shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </p>
                <p className="text-muted flex items-center gap-2">
                  <Phone className="size-4 text-neon shrink-0" />
                  <span>{b.phone}</span>
                </p>
                <p className="text-muted flex items-center gap-2">
                  <Clock className="size-4 text-neon shrink-0" />
                  <span>{b.openingHours || '05:30 - 21:30'}</span>
                </p>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-line text-center">
                  <div className="p-2 rounded bg-ink border border-line">
                    <span className="text-[10px] text-muted block">Hội viên</span>
                    <span className="font-bold text-chalk">{b._count?.members || 0}</span>
                  </div>
                  <div className="p-2 rounded bg-ink border border-line">
                    <span className="text-[10px] text-muted block">Thiết bị</span>
                    <span className="font-bold text-chalk">{b._count?.equipment || 0}</span>
                  </div>
                  <div className="p-2 rounded bg-ink border border-line">
                    <span className="text-[10px] text-muted block">Nhân sự</span>
                    <span className="font-bold text-chalk">{b._count?.users || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-xs text-muted">
            Chưa có chi nhánh nào được cấu hình.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
