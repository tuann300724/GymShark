'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, Check } from 'lucide-react';

export default function MembershipPackagesPage() {
  const {
    data: packages,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['membership-packages'],
    queryFn: async () => {
      const res = await apiClient.get('/membership-packages');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <Package className="size-6 text-neon" />
            Gói Tập Gym (Membership Packages)
          </h1>
          <p className="text-xs text-muted mt-1">
            Thiết lập danh mục các gói tập, thời hạn sử dụng và biểu phí dịch vụ phòng tập
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs">
          <Plus className="size-4 mr-1.5" />
          Tạo Gói Tập Mới
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted">Đang tải danh sách gói tập...</div>
      ) : isError ? (
        <div className="py-20 text-center text-xs text-danger">
          Không thể tải dữ liệu từ Backend. Hãy đảm bảo Backend đang chạy.
        </div>
      ) : packages && packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg: any) => (
            <Card
              key={pkg.id}
              className="relative flex flex-col justify-between hover:border-neon/40 transition-all"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {pkg.code}
                  </Badge>
                  <Badge variant="success">Hoạt động</Badge>
                </div>
                <CardTitle className="text-lg mt-3 text-chalk">{pkg.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {pkg.description || 'Không có mô tả chi tiết'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-ink border border-line">
                  <span className="text-3xl font-extrabold text-neon font-display">
                    {formatCurrency(pkg.price)}
                  </span>
                  <span className="text-xs text-muted block mt-1">
                    Thời hạn: <strong className="text-chalk">{pkg.durationDays} ngày</strong> (
                    {pkg.type})
                  </span>
                </div>
                <ul className="text-xs space-y-2 text-muted">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-neon shrink-0" />
                    Tập luyện không giới hạn khung giờ
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-neon shrink-0" />
                    Sử dụng tủ đồ và phòng tắm nóng lạnh
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Chỉnh sửa gói tập
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-xs text-muted">
            Chưa có gói tập nào được khởi tạo.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
