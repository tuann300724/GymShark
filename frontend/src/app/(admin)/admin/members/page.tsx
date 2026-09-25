'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Users, Search, Plus, Filter, Eye } from 'lucide-react';

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const {
    data: members,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['members-list'],
    queryFn: async () => {
      const res = await apiClient.get('/members');
      return res.data;
    },
  });

  const filteredMembers = (members || []).filter((m: any) => {
    const matchSearch =
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search);
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <Users className="size-6 text-neon" />
            Quản Lý Hội Viên
          </h1>
          <p className="text-xs text-muted mt-1">
            Danh sách tất cả hội viên đã đăng ký, thông tin liên lạc và tình trạng gói tập
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" className="font-semibold text-xs">
            <Plus className="size-4 mr-1.5" />
            Đăng ký Hội viên mới
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="size-4 text-muted absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã thẻ, số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-sm border border-line bg-ink text-chalk placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="size-4 text-muted shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-sm border border-line bg-ink text-chalk px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70 w-full sm:w-auto font-medium [&>option]:bg-surface [&>option]:text-chalk"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                <option value="EXPIRED">Đã hết hạn (EXPIRED)</option>
                <option value="INACTIVE">Ngưng hoạt động (INACTIVE)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted">
              Đang tải danh sách hội viên...
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-xs text-danger">
              Không thể tải dữ liệu hội viên từ Backend REST API. Vui lòng kiểm tra kết nối API.
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Mã HV</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Số điện thoại</th>
                    <th className="py-3 px-4">Gói tập hiện tại</th>
                    <th className="py-3 px-4">Ngày đăng ký</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {filteredMembers.map((m: any) => {
                    const activePkg = m.memberships?.[0]?.package?.name || 'Chưa đăng ký gói';
                    return (
                      <tr key={m.id} className="hover:bg-line/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-neon">{m.code}</td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-chalk">{m.fullName}</p>
                          <p className="text-[11px] text-muted">{m.email || 'Không có email'}</p>
                        </td>
                        <td className="py-3 px-4 text-muted">{m.phone}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-chalk">{activePkg}</span>
                        </td>
                        <td className="py-3 px-4 text-muted">{formatDate(m.joinedAt)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={m.status === 'ACTIVE' ? 'success' : 'warning'}>
                            {m.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/members/${m.id}`}>
                            <Button variant="outline" size="sm" className="font-medium text-xs">
                              <Eye className="size-3.5 mr-1 text-muted" />
                              Chi tiết
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-muted">
              Không tìm thấy hội viên nào phù hợp với bộ lọc tìm kiếm.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
