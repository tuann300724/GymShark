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
  Flame,
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
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md flex flex-col h-screen sticky top-0 z-30 transition-all select-none">
      {/* Brand Logo Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Flame className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
            GYM<span className="text-emerald-500">MASTER</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mt-1">
            Operations Pro
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navigationSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h5 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group',
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-4 border-emerald-500 pl-2.5'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200')} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <div className="truncate flex-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">CN Biên Hòa - Đồng Nai</p>
            <p className="text-[10px] text-slate-400">Chi nhánh hoạt động</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </aside>
  );
}
