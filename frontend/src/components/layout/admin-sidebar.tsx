'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  QrCode,
  UserCheck,
  CalendarDays,
  Receipt,
  Tag,
  Dumbbell,
  Building2,
  BarChart3,
  Bell,
  Settings,
  ChevronRight,
} from 'lucide-react';

export const navigationSections = [
  {
    title: 'Tổng quan',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Hội viên & Vận hành',
    items: [
      { name: 'Lượt Check-in', href: '/admin/checkins', icon: QrCode, badge: 'Live' },
      { name: 'Hội viên', href: '/admin/members', icon: Users },
      { name: 'Thẻ hội viên', href: '/admin/memberships', icon: CreditCard },
      { name: 'Gói tập Gym', href: '/admin/membership-packages', icon: Package },
      { name: 'Huấn luyện viên (PT)', href: '/admin/trainers', icon: UserCheck },
      { name: 'Lịch tập & Lớp học', href: '/admin/schedules', icon: CalendarDays },
    ],
  },
  {
    title: 'Tài chính & Ưu đãi',
    items: [
      { name: 'Hóa đơn & Thu phí', href: '/admin/payments', icon: Receipt },
      { name: 'Khuyến mãi & Voucher', href: '/admin/promotions', icon: Tag },
    ],
  },
  {
    title: 'Cơ sở & Thiết bị',
    items: [
      { name: 'Thiết bị máy móc', href: '/admin/equipment', icon: Dumbbell },
      { name: 'Chi nhánh phòng tập', href: '/admin/branches', icon: Building2 },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { name: 'Báo cáo thống kê', href: '/admin/reports', icon: BarChart3 },
      { name: 'Thông báo', href: '/admin/notifications', icon: Bell },
      { name: 'Cài đặt', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-line bg-surface/95 backdrop-blur-md flex flex-col h-screen sticky top-0 z-30 transition-all select-none">
      {/* Brand Logo Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-line">
        <div className="w-10 h-10 rounded-[10px] border border-neon/40 bg-ink flex items-center justify-center text-neon">
          <Dumbbell className="w-5 h-5" />
        </div>
        <div>
          <span className="font-display text-base font-extrabold uppercase tracking-tight text-chalk flex items-center gap-1">
            GYM<span className="text-neon">MASTER</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted block -mt-0.5">
            Operations Pro
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navigationSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h5 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted">
              {section.title}
            </h5>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-semibold transition-all group border-l-2',
                      isActive
                        ? 'bg-neon/10 text-neon font-bold border-neon'
                        : 'text-muted border-transparent hover:bg-line/30 hover:text-chalk',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-neon' : 'text-muted group-hover:text-chalk')} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-neon/15 text-neon">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Branch & User Footer */}
      <div className="p-3 border-t border-line bg-ink/50">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-[10px] bg-ink border border-line text-xs">
          <div className="w-2 h-2 rounded-full bg-neon shrink-0" />
          <div className="truncate flex-1">
            <p className="font-semibold text-chalk truncate">CN Biên Hòa - Đồng Nai</p>
            <p className="text-[10px] text-muted">Chi nhánh hoạt động</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted" />
        </div>
      </div>
    </aside>
  );
}
