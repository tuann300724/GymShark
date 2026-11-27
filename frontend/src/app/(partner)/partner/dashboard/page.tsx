'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, PackagePlus, QrCode, Users, Wallet } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { checkinApi } from '@/services/checkin.service';
import { partnerApi } from '@/services/partner.service';
import { cn, formatCurrency } from '@/lib/utils';

/** Nhắc đối tác khi hợp đồng còn ≤ 7 ngày hoặc đã hết hạn — dẫn sang trang gia hạn */
function PartnerContractReminder() {
  const query = useQuery({
    queryKey: ['partner-my-partnership'],
    queryFn: () => partnerApi.getMyPartnership(),
    retry: 0,
  });
  const endAt = query.data?.contractEndAt;
  if (!endAt) return null;
  const daysLeft = Math.ceil((new Date(endAt).getTime() - Date.now()) / 86_400_000);
  if (daysLeft > 7) return null;
  const expired = daysLeft < 0;
  return (
    <Link
      href="/partner/partnership"
      className={cn(
        'flex flex-col gap-1 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between',
        expired
          ? 'border-danger/40 bg-danger/10 hover:border-danger/60'
          : 'border-amber-500/40 bg-amber-500/10 hover:border-amber-500/60',
      )}
    >
      <span className="text-sm font-semibold text-chalk">
        {expired
          ? `Hợp đồng hợp tác đã hết hạn ${-daysLeft} ngày.`
          : `Hợp đồng hợp tác còn ${daysLeft} ngày (hết hạn ${new Date(endAt).toLocaleDateString('vi-VN')}).`}
      </span>
      <span className="text-xs font-semibold text-neon">Gửi yêu cầu gia hạn →</span>
    </Link>
  );
}

const LINKS = [
  {
    href: '/partner/checkins',
    title: 'Vận hành check-in',
    description: 'Ghi nhận lượt đến, xem lịch sử và hội viên đang tập.',
    icon: QrCode,
  },
  {
    href: '/partner/facility-members',
    title: 'Hội viên cộng đồng',
    description: 'Tra cứu hội viên hệ thống đủ điều kiện tập tại cơ sở này.',
    icon: Users,
  },
  {
    href: '/partner/members',
    title: 'Hội viên của phòng',
    description: 'Hội viên riêng do phòng tập tự đăng ký và quản lý.',
    icon: Users,
  },
  {
    href: '/partner/branches',
    title: 'Cơ sở / Chi nhánh',
    description: 'Quản lý địa chỉ, thông tin liên hệ và danh sách cơ sở của doanh nghiệp.',
    icon: Building2,
  },
  {
    href: '/partner/finance',
    title: 'Tài chính cơ sở',
    description: 'Theo dõi hoa hồng lượt tập và doanh thu quầy.',
    icon: Wallet,
  },
  {
    href: '/partner/beverages',
    title: 'Quầy nước',
    description: 'Quản lý mặt hàng, tồn kho và bán hàng.',
    icon: PackagePlus,
  },
];

/** Dashboard khu đối tác — tổng quan lượt tập và lối tắt nghiệp vụ tại cơ sở */
export default function PartnerDashboardPage() {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dailyQuery = useQuery({
    queryKey: ['facility-dashboard-daily', dateKey],
    queryFn: () => checkinApi.getDailyReport(dateKey, dateKey),
    retry: 0,
  });
  const insideQuery = useQuery({
    queryKey: ['facility-dashboard-inside'],
    queryFn: () => checkinApi.getCurrentlyInside(),
    retry: 0,
  });
  const commissionQuery = useQuery({
    queryKey: ['partner-my-commission'],
    queryFn: () => partnerApi.getMyCommission(),
    retry: 0,
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="meta-label">Khu vực doanh nghiệp</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight text-chalk">
          Vận hành cơ sở
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tổng quan lượt tập và các nghiệp vụ tại cơ sở của bạn.
        </p>
      </header>
      <PartnerContractReminder />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Check-in hôm nay"
          value={dailyQuery.data?.summary?.totalCheckIns ?? '—'}
          subtitle="Lượt ghi nhận tại cơ sở"
          icon={QrCode}
          colorScheme="neon"
        />
        <StatCard
          title="Đang có mặt"
          value={insideQuery.data?.length ?? '—'}
          subtitle="Hội viên chưa check-out"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Hoa hồng cộng dồn"
          value={commissionQuery.data ? formatCurrency(commissionQuery.data.totalCommission) : '—'}
          subtitle={`${commissionQuery.data?.visitCount ?? 0} lượt trong 12 tháng`}
          icon={Wallet}
          colorScheme="purple"
        />
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-neon/40"
          >
            <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-ink text-neon">
              <Icon className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-xl font-bold uppercase text-chalk group-hover:text-neon">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
