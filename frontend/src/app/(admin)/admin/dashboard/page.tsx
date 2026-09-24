'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Users,
  UserCheck,
  QrCode,
  DollarSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Dumbbell,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [memberCodeInput, setMemberCodeInput] = useState('');
  const [checkInMsg, setCheckInMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch summary stats
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/summary');
      return res.data;
    },
  });

  // 2. Fetch live checkins
  const { data: checkIns, isLoading: isCheckInsLoading } = useQuery({
    queryKey: ['recent-checkins'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/checkins');
      return res.data;
    },
  });

  // 3. Quick CheckIn Mutation
  const checkInMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiClient.post('/admin/checkins', { memberCode: code });
      return res.data;
    },
    onSuccess: (data) => {
      setCheckInMsg({
        type: 'success',
        text: `Hội viên ${data.checkIn.member.fullName} (${data.checkIn.member.code}) check-in thành công!`,
      });
      setMemberCodeInput('');
      queryClient.invalidateQueries({ queryKey: ['recent-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Check-in thất bại. Kiểm tra mã thẻ.';
      setCheckInMsg({ type: 'error', text: msg });
    },
  });

  const handleQuickCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberCodeInput.trim()) return;
    checkInMutation.mutate(memberCodeInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Hệ thống Quản lý Vận hành GymMaster v1.0</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Chào mừng trở lại trung tâm quản trị! 👋
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Theo dõi tình hình hội viên, lượt quét thẻ ra vào trong ngày và tình trạng vận hành thiết bị theo thời gian thực.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/checkins">
              <Button variant="secondary" size="md" className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-bold text-xs">
                <QrCode className="w-4 h-4 mr-1.5" />
                Mở Máy Quét Check-in
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Hội Viên"
          value={isSummaryLoading ? '...' : (summary?.totalMembers ?? 1)}
          subtitle="Đã đăng ký tài khoản"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Hội Viên Đang Hoạt Động"
          value={isSummaryLoading ? '...' : (summary?.activeMembers ?? 1)}
          subtitle="Thẻ tập còn hiệu lực"
          icon={UserCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Lượt Check-in Hôm Nay"
          value={isSummaryLoading ? '...' : (summary?.todayCheckIns ?? 0)}
          subtitle="Tính từ 00:00 sáng nay"
          icon={QrCode}
          colorScheme="amber"
        />
        <StatCard
          title="Tổng Doanh Thu Thu Được"
          value={isSummaryLoading ? '...' : formatCurrency(summary?.totalRevenue ?? 2400000)}
          subtitle="Giao dịch thành công"
          icon={DollarSign}
          colorScheme="purple"
        />
      </div>

      {/* Two Column Layout: Quick Check-in & Live Checkin Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Check-in Terminal Card */}
        <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <QrCode className="w-5 h-5" />
              <CardTitle className="text-base font-bold">Quét Thẻ Check-in Nhanh</CardTitle>
            </div>
            <CardDescription>
              Nhập mã thẻ hội viên (hoặc quét barcode) để ghi nhận lượt tập ngay
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleQuickCheckIn} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Ví dụ: MEM-0001"
                  value={memberCodeInput}
                  onChange={(e) => setMemberCodeInput(e.target.value.toUpperCase())}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase transition-all"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 font-bold"
                isLoading={checkInMutation.isPending}
              >
                Xác nhận Check-in
              </Button>
            </form>

            {checkInMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  checkInMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{checkInMsg.text}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700 dark:text-slate-300">💡 Gợi ý mã mẫu test:</p>
              <button
                type="button"
                onClick={() => setMemberCodeInput('MEM-0001')}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] hover:text-emerald-500"
              >
                MEM-0001 (Trần Minh Quân)
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Live Check-in Feed Table */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Lượt Check-in Gần Đây
              </CardTitle>
              <CardDescription>Thời gian thực hội viên ra vào phòng tập</CardDescription>
            </div>
            <Link href="/admin/checkins" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {isCheckInsLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Đang tải lịch sử check-in...</div>
            ) : checkIns && checkIns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Hội viên</th>
                      <th className="py-2.5 px-3">Mã thẻ</th>
                      <th className="py-2.5 px-3">Chi nhánh</th>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {checkIns.slice(0, 5).map((ci: any) => (
                      <tr key={ci.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {ci.member.fullName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{ci.member.code}</td>
                        <td className="py-2.5 px-3 text-slate-500">{ci.branch.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{formatDateTime(ci.checkInTime)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge variant="success">ĐÃ VÀO CỔNG</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                Chưa có lượt check-in nào trong ngày hôm nay. Hãy quét mã thẻ bên cạnh để ghi nhận!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/admin/members" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 transition-colors group">
          <Users className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Quản lý Hội viên</h4>
          <p className="text-xs text-slate-400 mt-0.5">Danh sách, tạo mới, gia hạn thẻ</p>
        </Link>
        <Link href="/admin/membership-packages" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 transition-colors group">
          <Dumbbell className="w-5 h-5 text-teal-500 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Gói tập Gym</h4>
          <p className="text-xs text-slate-400 mt-0.5">Cấu hình thời hạn & giá gói</p>
        </Link>
        <Link href="/admin/payments" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 transition-colors group">
          <DollarSign className="w-5 h-5 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Thu ngân & Hoá đơn</h4>
          <p className="text-xs text-slate-400 mt-0.5">Theo dõi lịch sử thanh toán</p>
        </Link>
        <Link href="/admin/reports" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 transition-colors group">
          <ShieldCheck className="w-5 h-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Báo cáo & Phân tích</h4>
          <p className="text-xs text-slate-400 mt-0.5">Biểu đồ doanh thu và vận hành</p>
        </Link>
      </div>
    </div>
  );
}
