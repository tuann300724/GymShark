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
import { ArrowLeft, Phone, Mail, MapPin, CreditCard, QrCode, Receipt } from 'lucide-react';

export default function MemberDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<'memberships' | 'checkins' | 'payments' | 'schedules'>(
    'memberships',
  );

  const {
    data: member,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['member-detail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/members/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-muted">
        Đang tải thông tin chi tiết hội viên...
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="space-y-4">
        <Link href="/admin/members">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 mr-1.5" /> Quay lại danh sách
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-danger text-sm">
            Không tìm thấy thông tin hội viên hoặc có lỗi kết nối đến API.
          </CardContent>
        </Card>
      </div>
    );
  }

  const TABS = [
    {
      key: 'memberships' as const,
      label: 'Gói tập & Thẻ hội viên',
      count: member.memberships?.length || 0,
      icon: CreditCard,
    },
    {
      key: 'checkins' as const,
      label: 'Lịch sử Check-in',
      count: member.checkIns?.length || 0,
      icon: QrCode,
    },
    {
      key: 'payments' as const,
      label: 'Lịch sử Hoá đơn',
      count: member.payments?.length || 0,
      icon: Receipt,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/admin/members">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="size-4 mr-1.5" />
            Danh sách hội viên
          </Button>
        </Link>
        <Badge variant={member.status === 'ACTIVE' ? 'success' : 'warning'}>
          Trạng thái: {member.status}
        </Badge>
      </div>

      {/* Member Profile Overview Header */}
      <Card className="border-neon/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-ink border border-neon/40 text-neon flex items-center justify-center font-bold text-2xl uppercase">
                {member.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-chalk">{member.fullName}</h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-neon/10 text-neon border border-neon/40 font-bold">
                    {member.code}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted mt-2">
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5 text-muted" /> {member.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="size-3.5 text-muted" /> {member.email || 'Chưa cung cấp email'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-muted" /> {member.branch?.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-line">
              <p className="text-xs text-muted">Ngày tham gia phòng tập</p>
              <p className="text-sm font-bold text-chalk mt-0.5">{formatDate(member.joinedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Tabs Navigation */}
      <div className="flex border-b border-line gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'border-neon text-neon'
                  : 'border-transparent text-muted hover:text-chalk'
              }`}
            >
              <Icon className="size-4" />
              {tab.label} ({tab.count})
            </button>
          );
        })}
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
                      <h4 className="font-bold text-base text-chalk">{m.package?.name}</h4>
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : 'outline'}>
                        {m.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Hiệu lực: {formatDate(m.startDate)} đến {formatDate(m.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Giá trị hợp đồng</p>
                    <p className="text-base font-bold text-neon">{formatCurrency(m.price)}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-xs text-muted">
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
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-ink border-b border-line text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="py-2.5 px-4">Thời gian vào</th>
                      <th className="py-2.5 px-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-medium">
                    {member.checkIns.map((c: any) => (
                      <tr key={c.id} className="hover:bg-line/20 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-muted">
                          {formatDateTime(c.checkInTime)}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="success">CHECKED IN</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted">
                Chưa có lượt quét thẻ check-in nào.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card>
          <CardContent className="p-0">
            {member.payments && member.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-ink border-b border-line text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="py-2.5 px-4">Mã hoá đơn</th>
                      <th className="py-2.5 px-4">Số tiền</th>
                      <th className="py-2.5 px-4">Phương thức</th>
                      <th className="py-2.5 px-4">Thời gian</th>
                      <th className="py-2.5 px-4 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-medium">
                    {member.payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-line/20 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-chalk">{p.code}</td>
                        <td className="py-2.5 px-4 font-bold text-neon">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-2.5 px-4 text-muted">{p.method}</td>
                        <td className="py-2.5 px-4 text-muted">{formatDate(p.createdAt)}</td>
                        <td className="py-2.5 px-4 text-right">
                          <Badge variant="success">{p.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted">
                Chưa có hoá đơn thanh toán nào.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
