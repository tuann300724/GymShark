'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { UserCheck, Star, Award, Phone, Mail, Plus } from 'lucide-react';

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-500" />
            Đội Ngũ Huấn Luyện Viên Cá Nhân (PT)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý hồ sơ, chuyên môn tập luyện và biểu phí kèm riêng của các HLV
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm Huấn Luyện Viên
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Đang tải danh sách HLV...</div>
      ) : isError ? (
        <div className="py-20 text-center text-xs text-rose-500">Lỗi kết nối API HLV.</div>
      ) : trainers && trainers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainers.map((t: any) => (
            <Card key={t.id} className="hover:border-emerald-500/40 transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white uppercase text-base shadow-md">
                    {t.user?.fullName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <CardTitle className="text-base text-slate-900 dark:text-white">{t.user?.fullName}</CardTitle>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{t.specialization}</p>
                  </div>
                </div>
                <Badge variant={t.status === 'ACTIVE' ? 'success' : 'outline'}>{t.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-2 text-xs">
                <p className="text-slate-500 dark:text-slate-400 italic line-clamp-2">
                  "{t.bio || 'Chưa cập nhật tiểu sử'}"
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                    <span className="text-[10px] text-slate-400 block">Kinh nghiệm</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{t.experienceYears} năm</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                    <span className="text-[10px] text-slate-400 block">Đánh giá</span>
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> {t.rating} / 5.0
                    </span>
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Phí kèm PT / giờ:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
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
          <CardContent className="py-16 text-center text-xs text-slate-400">
            Chưa có huấn luyện viên nào trong hệ thống.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
