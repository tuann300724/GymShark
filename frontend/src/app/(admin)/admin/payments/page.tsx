'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Receipt, Plus } from 'lucide-react';

export default function PaymentsPage() {
  const {
    data: payments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['payments-list'],
    queryFn: async () => {
      const res = await apiClient.get('/payments');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <Receipt className="size-6 text-neon" />
            Hóa Đơn & Thu Phí (Payments)
          </h1>
          <p className="text-xs text-muted mt-1">
            Quản lý doanh thu, hoá đơn đăng ký gói tập, gia hạn và các hình thức chuyển khoản
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs">
          <Plus className="size-4 mr-1.5" />
          Tạo Hoá Đơn Thu Mới
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted">Đang tải lịch sử thu phí...</div>
          ) : isError ? (
            <div className="py-16 text-center text-xs text-danger">Lỗi kết nối API thanh toán.</div>
          ) : payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Mã hoá đơn</th>
                    <th className="py-3 px-4">Hội viên</th>
                    <th className="py-3 px-4">Gói / Dịch vụ</th>
                    <th className="py-3 px-4">Số tiền thu</th>
                    <th className="py-3 px-4">Phương thức</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-line/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-chalk">{p.code}</td>
                      <td className="py-3 px-4 font-semibold text-chalk">
                        {p.member?.fullName} ({p.member?.code})
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {p.membership?.package?.name || 'Dịch vụ phụ trợ'}
                      </td>
                      <td className="py-3 px-4 font-bold text-neon">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{p.method}</Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted">
                        {formatDateTime(p.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant="success">{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-muted">
              Chưa có giao dịch thanh toán nào.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
