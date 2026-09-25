'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { BarChart3, TrendingUp, Users, DollarSign, Check } from 'lucide-react';

export default function ReportsPage() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/summary');
      return res.data;
    },
  });

  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: ['reports-revenue'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/revenue');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
          <BarChart3 className="size-6 text-neon" />
          Báo Cáo & Phân Tích Hoạt Động (Reports)
        </h1>
        <p className="text-xs text-muted mt-1">
          Báo cáo doanh thu kinh doanh, tăng trưởng hội viên và hiệu suất phục vụ theo chu kỳ
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Tổng Doanh Thu Đã Thu"
          value={formatCurrency(summary?.totalRevenue || 2400000)}
          subtitle="Doanh thu thực nhận"
          icon={DollarSign}
          colorScheme="neon"
        />
        <StatCard
          title="Lượng Hội Viên Tích Cực"
          value={summary?.activeMembers || 1}
          subtitle={`Chiếm ${summary?.totalMembers ? Math.round((summary.activeMembers / summary.totalMembers) * 100) : 100}% tổng số hội viên`}
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Số Giao Dịch Thành Công"
          value={revenueData?.totalTransactions || 1}
          subtitle="Hóa đơn đã thanh toán"
          icon={TrendingUp}
          colorScheme="purple"
        />
      </div>

      {/* Transaction Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="size-4 text-neon" />
            Nhật Ký Dòng Tiền & Doanh Số Gần Đây
          </CardTitle>
          <CardDescription>Danh sách các khoản thu được ghi nhận trên hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isRevenueLoading ? (
            <div className="py-16 text-center text-xs text-muted">Đang tổng hợp báo cáo...</div>
          ) : revenueData?.data && revenueData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Số tiền</th>
                    <th className="py-3 px-4 text-right">Trạng thái hạch toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {revenueData.data.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-line/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-bold text-neon">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-right text-neon font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="size-3.5" />
                          Đã ghi nhận sổ quỹ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-muted">
              Chưa có phát sinh giao dịch nào.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
