'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Tag, Plus, Calendar } from 'lucide-react';

export default function PromotionsPage() {
  const {
    data: promotions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['promotions-list'],
    queryFn: async () => {
      const res = await apiClient.get('/promotions');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <Tag className="size-6 text-neon" />
            Khuyến Mãi & Voucher (Promotions)
          </h1>
          <p className="text-xs text-muted mt-1">
            Tạo chiến dịch kích cầu, mã giảm giá phần trăm hoặc tiền mặt cho học viên mới và gia hạn
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs">
          <Plus className="size-4 mr-1.5" />
          Tạo Mã Khuyến Mãi
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted">Đang tải danh sách voucher...</div>
      ) : isError ? (
        <div className="py-20 text-center text-xs text-danger">Lỗi kết nối API khuyến mãi.</div>
      ) : promotions && promotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions.map((p: any) => (
            <Card key={p.id} className="border-l-2 border-l-neon">
              <CardContent className="p-5 flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-neon/10 text-neon font-mono font-black text-sm tracking-wider border border-neon/30">
                      {p.code}
                    </span>
                    <Badge variant="success">{p.status}</Badge>
                  </div>
                  <h4 className="font-bold text-sm text-chalk">{p.name}</h4>
                  <p className="text-xs text-muted">{p.description}</p>
                  <p className="text-xs text-muted flex items-center gap-1 mt-2">
                    <Calendar className="size-3.5 text-muted" />
                    Hiệu lực: {formatDate(p.startDate)} - {formatDate(p.endDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-neon font-display">
                    {p.discountType === 'PERCENTAGE'
                      ? `-${p.discountValue}%`
                      : `-${p.discountValue}đ`}
                  </span>
                  <span className="block text-[10px] text-muted mt-1">
                    Đã dùng: {p.usedCount} {p.usageLimit ? `/ ${p.usageLimit}` : 'lượt'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-xs text-muted">
            Chưa có chương trình khuyến mãi nào được tạo.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
