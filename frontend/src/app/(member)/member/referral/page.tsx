'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { memberApi } from '@/services/member.service';
import { EmptyState } from '@/components/ui/empty-state';
import { Gift, Users, CheckCircle2 } from 'lucide-react';

export default function MemberReferralPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['member-referral'],
    queryFn: () => memberApi.getMyReferral(),
    retry: 0,
  });

  const info = data?.data;
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk">
        Giới thiệu bạn bè
      </h1>

      <Card className="border-neon/20 bg-gradient-to-br from-ink/60 to-ink/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-neon/10 border border-neon/30">
              <Gift className="size-7 text-neon" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-chalk">Mã giới thiệu của bạn</p>
              <p className="text-xs text-muted">Chia sẻ để nhận thêm 7 ngày tập miễn phí</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <code className="rounded-xl bg-ink px-4 py-2.5 font-mono text-xl font-bold tracking-widest text-neon shadow-inner shadow-neon/10">
              {isLoading ? '----' : info?.referralCode || 'GYM-XXXX'}
            </code>
            <Badge className="border-neon/30 text-neon">+7 ngày / hội viên mới</Badge>
          </div>
          {info?.referredCount != null && (
            <div className="mt-3 flex gap-6 text-sm text-muted">
              <span>
                Đã giới thiệu: <b className="text-chalk">{info.referredCount}</b>
              </span>
              <span>
                Đã nhận thưởng:{' '}
                <b className="text-chalk">{info.referralRewardedAt ? 'Có' : 'Chưa'}</b>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="font-display text-lg font-bold text-chalk">Danh sách người được giới thiệu</h2>
      {isLoading ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : info?.referredMembers?.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Chưa có người được giới thiệu"
          description="Khi bạn bè đăng ký bằng mã của bạn, họ sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="grid gap-3">
          {(info?.referredMembers || []).map((m: any) => (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="font-semibold text-chalk">{m.fullName}</p>
                  <p className="text-xs text-muted">
                    {m.email || '--'} · {m.phone || '--'}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                  <CheckCircle2 className="size-3.5 text-neon" /> Đã kích hoạt
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
