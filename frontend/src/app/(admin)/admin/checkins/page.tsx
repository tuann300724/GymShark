'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { QrCode, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Building2 } from 'lucide-react';

export default function CheckinsPage() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: any;
  } | null>(null);

  const {
    data: checkIns,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['checkins-all'],
    queryFn: async () => {
      const res = await apiClient.get('/checkins');
      return res.data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (memberCode: string) => {
      const res = await apiClient.post('/checkins', { memberCode });
      return res.data;
    },
    onSuccess: (data) => {
      setFeedback({
        type: 'success',
        text: `Check-in hợp lệ: ${data.checkIn.member.fullName}`,
        details: data.activeMembership
          ? `Gói tập: ${data.activeMembership.package?.name}`
          : 'Không có gói tập',
      });
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['checkins-all'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể check-in. Kiểm tra mã thẻ.';
      setFeedback({
        type: 'error',
        text: msg,
      });
    },
  });

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    checkInMutation.mutate(code.trim().toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <QrCode className="size-6 text-neon" />
            Cổng Quét Thẻ & Kiểm Soát Ra Vào (Check-ins)
          </h1>
          <p className="text-xs text-muted mt-1">
            Ghi nhận lượt tập theo thời gian thực và tự động xác thực thời hạn thẻ của hội viên
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
          <RefreshCw className="size-3.5 mr-1.5" />
          Làm mới bảng
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CheckIn Scanner Terminal */}
        <Card className="lg:col-span-1 border-neon/30">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-neon" />
              Bàn Quẹt Thẻ Lễ Tân
            </CardTitle>
            <CardDescription>Nhập hoặc quẹt barcode hội viên</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleScan} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="MEM-0001"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full h-14 text-center font-mono font-black text-2xl tracking-widest rounded-sm border border-line bg-ink text-chalk placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70 uppercase"
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-sm font-bold"
                isLoading={checkInMutation.isPending}
              >
                XÁC NHẬN CỬA MỞ (CHECK-IN)
              </Button>
            </form>

            {feedback && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1 ${
                  feedback.type === 'success'
                    ? 'bg-neon/10 border-neon/40 text-neon'
                    : 'bg-danger/10 border-danger/40 text-danger'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <AlertCircle className="size-5" />
                  )}
                  <span>{feedback.text}</span>
                </div>
                {feedback.details && <p className="text-muted pl-7">{feedback.details}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Check-in Stream */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Nhật Ký Quẹt Thẻ Hôm Nay</CardTitle>
            <CardDescription>Lịch sử các lượt vào cửa mới nhất</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-muted">Đang đồng bộ dữ liệu...</div>
            ) : checkIns && checkIns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                    <tr>
                      <th className="py-3 px-4">Mã thẻ</th>
                      <th className="py-3 px-4">Hội viên</th>
                      <th className="py-3 px-4">Chi nhánh</th>
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-medium">
                    {checkIns.map((item: any) => (
                      <tr key={item.id} className="hover:bg-line/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-neon">
                          {item.member?.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-chalk">
                          {item.member?.fullName}
                        </td>
                        <td className="py-3 px-4 text-muted">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-muted" />
                            {item.branch?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-muted">
                          {formatDateTime(item.checkInTime)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant="success">CHECKED IN</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-muted">
                Chưa có lượt check-in nào được ghi nhận.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
