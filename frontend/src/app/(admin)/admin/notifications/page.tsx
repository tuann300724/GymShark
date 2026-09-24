'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { Bell, CheckCheck, Info } from 'lucide-react';

export default function NotificationsPage() {
  const { data: notifications, isLoading, isError } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <Bell className="w-6 h-6 text-neon" />
            Thông Báo Hệ Thống (Notifications)
          </h1>
          <p className="text-xs text-muted mt-1">
            Cảnh báo thẻ sắp hết hạn, lịch bảo trì máy móc và tin tức nội bộ phòng tập
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs">
          <CheckCheck className="w-4 h-4 mr-1.5" />
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-muted">Đang tải thông báo...</div>
        ) : isError ? (
          <div className="py-20 text-center text-xs text-danger">Lỗi kết nối API thông báo.</div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((n: any) => (
            <Card key={n.id} className={n.isRead ? 'opacity-70' : 'border-neon/40'}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-neon/10 text-neon shrink-0 border border-neon/25">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-chalk">{n.title}</h4>
                    <p className="text-xs text-muted mt-0.5">{n.content}</p>
                    <span className="text-[10px] text-muted block mt-2 font-mono">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                </div>
                {!n.isRead && (
                  <Badge variant="success">Mới</Badge>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-xs text-muted">
              Hiện tại không có thông báo mới nào.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
