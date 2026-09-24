'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { UserCheck, Star, Plus } from 'lucide-react';

export default function TrainersPage() {
  const { data: trainers, isLoading, isError } = useQuery({
    queryKey: ['trainers-list'],
    queryFn: async () => {
      const res = await apiClient.get('/trainers');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-neon" />
            Đội Ngũ Huấn Luyện Viên Cá Nhân (PT)
          </h1>
          <p className="text-xs text-muted mt-1">
            Quản lý hồ sơ, chuyên môn tập luyện và biểu phí kèm riêng của các HLV
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm Huấn Luyện Viên
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted">Đang tải danh sách HLV...</div>
      ) : isError ? (
        <div className="py-20 text-center text-xs text-danger">Lỗi kết nối API HLV.</div>
      ) : trainers && trainers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainers.map((t: any) => (
            <Card key={t.id} className="hover:border-neon/40 transition-all">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-ink border border-neon/40 text-neon flex items-center justify-center font-bold uppercase text-base">
                    {t.user?.fullName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <CardTitle className="text-base text-chalk">{t.user?.fullName}</CardTitle>
                    <p className="text-xs text-neon font-semibold">{t.specialization}</p>
                  </div>
                </div>
                <Badge variant={t.status === 'ACTIVE' ? 'success' : 'outline'}>{t.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-2 text-xs">
                <p className="text-muted italic line-clamp-2">
                  "{t.bio || 'Chưa cập nhật tiểu sử'}"
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
                  <div className="p-2 rounded-lg bg-ink border border-line">
                    <span className="text-[10px] text-muted block">Kinh nghiệm</span>
                    <span className="font-bold text-chalk">{t.experienceYears} năm</span>
                  </div>
                  <div className="p-2 rounded-lg bg-ink border border-line">
                    <span className="text-[10px] text-muted block">Đánh giá</span>
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {t.rating} / 5.0
                    </span>
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-between text-muted">
                  <span>Phí kèm PT / giờ:</span>
                  <span className="font-bold text-neon">
                    {t.hourlyRate ? formatCurrency(t.hourlyRate) : 'Thỏa thuận'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Xem lịch dạy
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-xs text-muted">
            Chưa có huấn luyện viên nào trong hệ thống.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
