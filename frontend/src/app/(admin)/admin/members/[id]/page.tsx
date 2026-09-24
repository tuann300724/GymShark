'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  QrCode,
  Dumbbell,
  Receipt,
  Clock,
} from 'lucide-react';

export default function MemberDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<'memberships' | 'checkins' | 'payments' | 'schedules'>('memberships');

  const { data: member, isLoading, isError } = useQuery({
    queryKey: ['member-detail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/members/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-400">Đang tải thông tin chi tiết hội viên...</div>;
  }

  if (isError || !member) {
    return (
      <div className="space-y-4">
        <Link href="/admin/members">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại danh sách
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-rose-500 text-sm">
            Không tìm thấy thông tin hội viên hoặc có lỗi kết nối đến API.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/admin/members">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Danh sách hội viên
          </Button>
        </Link>
        <Badge variant={member.status === 'ACTIVE' ? 'success' : 'warning'}>
          Trạng thái: {member.status}
        </Badge>
      </div>

      {/* Member Profile Overview Header */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white border-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-2xl uppercase shadow-lg shadow-emerald-500/20">
                {member.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{member.fullName}</h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    {member.code}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {member.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {member.email || 'Chưa cung cấp email'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {member.branch?.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
              <p className="text-xs text-slate-400">Ngày tham gia phòng tập</p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{formatDate(member.joinedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('memberships')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'memberships'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Gói tập & Thẻ hội viên ({member.memberships?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('checkins')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'checkins'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Lịch sử Check-in ({member.checkIns?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Lịch sử Hoá đơn ({member.payments?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'memberships' && (
        <div className="space-y-4">
          {member.memberships && member.memberships.length > 0 ? (
            member.memberships.map((m: any) => (
              <Card key={m.id}>
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">{m.package?.name}</h4>
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : 'outline'}>{m.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Hiệu lực: {formatDate(m.startDate)} đến {formatDate(m.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Giá trị hợp đồng</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(m.price)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-xs text-slate-400">
                Hội viên này chưa đăng ký gói tập nào.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'checkins' && (
        <Card>
          <CardContent className="p-0">
            {member.checkIns && member.checkIns.length > 0 ? (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4">Thời gian vào</th>
                    <th className="py-2.5 px-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {member.checkIns.map((c: any) => (
                    <tr key={c.id}>
                      <td className="py-2.5 px-4 font-mono">{formatDateTime(c.checkInTime)}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant="success">CHECKED IN</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">Chưa có lượt quét thẻ check-in nào.</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card>
          <CardContent className="p-0">
            {member.payments && member.payments.length > 0 ? (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4">Mã hoá đơn</th>
                    <th className="py-2.5 px-4">Số tiền</th>
                    <th className="py-2.5 px-4">Phương thức</th>
                    <th className="py-2.5 px-4">Thời gian</th>
                    <th className="py-2.5 px-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {member.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{p.code}</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{p.method}</td>
                      <td className="py-2.5 px-4 text-slate-500">{formatDate(p.createdAt)}</td>
                      <td className="py-2.5 px-4 text-right">
                        <Badge variant="success">{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">Chưa có hoá đơn thanh toán nào.</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
