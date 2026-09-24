'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { CreditCard, Plus, Eye } from 'lucide-react';
import Link from 'next/link';

export default function MembershipsPage() {
  const { data: memberships, isLoading, isError } = useQuery({
    queryKey: ['memberships-list'],
    queryFn: async () => {
      const res = await apiClient.get('/memberships');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-neon" />
            Hợp Đồng & Thẻ Hội Viên
          </h1>
          <p className="text-xs text-muted mt-1">
            Quản lý việc đăng ký, kích hoạt và gia hạn thẻ tập cho từng hội viên
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Ký Hợp Đồng Mới
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted">Đang tải danh sách thẻ hội viên...</div>
          ) : isError ? (
            <div className="py-16 text-center text-xs text-danger">Lỗi tải dữ liệu thẻ hội viên từ Backend.</div>
          ) : memberships && memberships.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Mã HV</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Gói dịch vụ</th>
                    <th className="py-3 px-4">Ngày kích hoạt</th>
                    <th className="py-3 px-4">Ngày hết hạn</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {memberships.map((item: any) => (
                    <tr key={item.id} className="hover:bg-line/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-neon">
                        {item.member?.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-chalk">
                        {item.member?.fullName}
                      </td>
                      <td className="py-3 px-4 text-muted">{item.package?.name}</td>
                      <td className="py-3 px-4 text-muted">{formatDate(item.startDate)}</td>
                      <td className="py-3 px-4 text-muted">{formatDate(item.endDate)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'outline'}>{item.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/members/${item.member?.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-muted">Chưa có hợp đồng nào được tạo.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
