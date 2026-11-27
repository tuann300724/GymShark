'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { canAccessAdminPath, getStoredUser } from '@/lib/auth';
import {
  LayoutDashboard,
  Users,
  UserCog,
  CreditCard,
  Package,
  QrCode,
  UserCheck,
  CalendarDays,
  Receipt,
  Dumbbell,
  Wrench,
  BarChart3,
  Bell,
  Settings,
  ClipboardCheck,
  ScrollText,
  UtensilsCrossed,
  Droplets,
  Building2,
  ClipboardList,
  ShoppingCart,
  Boxes,
  Wallet,
  ChevronDown,
  FileSignature,
  ScanFace,
  BadgeCheck,
  HandCoins,
} from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export type NavArea = 'admin' | 'partner';

/** Mục STAFF (lễ tân hệ thống) không thấy */
const STAFF_HIDDEN_HREFS = [
  '/admin/partners',
  '/admin/partner-leads',
  '/admin/beverages',
  '/admin/beverages/imports',
  '/admin/reports/beverages',
];

/** Menu khu quản trị hệ thống (ADMIN / MANAGER / STAFF) */
const adminNavigationSections: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [{ name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Hội viên & Vận hành',
    items: [
      // Chỉ STAFF (lễ tân) còn check-in tại quầy — xem canAccessAdminPath
      { name: 'Lượt Check-in', href: '/admin/checkins', icon: QrCode, badge: 'Live' },
      { name: 'Hội viên', href: '/admin/members', icon: Users },
      { name: 'Duyệt ảnh khuôn mặt', href: '/admin/face-reviews', icon: ScanFace },
      { name: 'Thẻ hội viên', href: '/admin/memberships', icon: CreditCard },
      { name: 'Gói tập Gym', href: '/admin/membership-packages', icon: Package },
      { name: 'Huấn luyện viên (PT)', href: '/admin/trainers', icon: UserCheck },
      { name: 'Duyệt hồ sơ PT', href: '/admin/trainer-applications', icon: BadgeCheck },
      { name: 'Buổi PT & chi trả', href: '/admin/pt-sessions', icon: HandCoins },
      { name: 'Báo cáo chuyên cần', href: '/admin/reports/attendance', icon: ClipboardCheck },
    ],
  },
  {
    title: 'Đối tác',
    items: [
      { name: 'Đối tác phòng gym', href: '/admin/partners', icon: Building2 },
      { name: 'Yêu cầu hợp tác', href: '/admin/partner-leads', icon: ClipboardList },
    ],
  },
  {
    title: 'Tài chính',
    items: [
      { name: 'Hóa đơn & Thu phí', href: '/admin/payments', icon: Receipt },
      { name: 'Báo cáo doanh thu', href: '/admin/reports/revenue', icon: BarChart3 },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { name: 'Báo cáo thống kê', href: '/admin/reports', icon: BarChart3 },
      { name: 'Thiết bị', href: '/admin/reports/equipment', icon: Wrench },
      { name: 'Thông báo', href: '/admin/notifications', icon: Bell },
      { name: 'Nhật ký hệ thống', href: '/admin/audit-logs', icon: ScrollText },
      { name: 'Thư viện thực phẩm', href: '/admin/foods', icon: UtensilsCrossed },
      { name: 'Cài đặt', href: '/admin/settings', icon: Settings },
    ],
  },
];

/** Menu khu đối tác (phòng gym tự quản lý) — /partner */
const partnerNavigationSections: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [{ name: 'Dashboard', href: '/partner/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Hợp tác',
    items: [{ name: 'Hợp đồng & hạng phòng', href: '/partner/partnership', icon: FileSignature }],
  },
  {
    title: 'Hội viên & Vận hành',
    items: [
      { name: 'Lượt Check-in', href: '/partner/checkins', icon: QrCode, badge: 'Live' },
      { name: 'Hội viên cộng đồng', href: '/partner/facility-members', icon: Users },
      { name: 'Cơ sở / Chi nhánh', href: '/partner/branches', icon: Building2 },
      { name: 'Hội viên', href: '/partner/members', icon: Users },
      { name: 'Thẻ hội viên', href: '/partner/memberships', icon: CreditCard },
      { name: 'Gói tập Gym', href: '/partner/membership-packages', icon: Package },
      { name: 'Huấn luyện viên (PT)', href: '/partner/trainers', icon: UserCheck },
      { name: 'Lịch tập & Lớp học', href: '/partner/schedules', icon: CalendarDays },
      { name: 'Tài khoản nhân viên', href: '/partner/staff', icon: UserCog },
    ],
  },
  {
    title: 'Kinh doanh nước uống',
    items: [
      { name: 'Dashboard nước uống', href: '/partner/beverages', icon: Droplets },
      { name: 'Sản phẩm nước uống', href: '/partner/beverages/products', icon: Package },
      { name: 'Nhập kho nước uống', href: '/partner/beverages/imports', icon: ClipboardList },
      { name: 'Bán nước tại quầy', href: '/partner/beverages/pos', icon: ShoppingCart },
      { name: 'Tồn kho nước uống', href: '/partner/beverages/stock', icon: Boxes },
    ],
  },
  {
    title: 'Tài chính',
    items: [
      { name: 'Tài chính cơ sở', href: '/partner/finance', icon: Wallet },
      { name: 'Hóa đơn & Thu phí', href: '/partner/payments', icon: Receipt },
      { name: 'Báo cáo doanh thu', href: '/partner/reports/revenue', icon: BarChart3 },
    ],
  },
];

export function getNavSections(area: NavArea): NavSection[] {
  return area === 'partner' ? partnerNavigationSections : adminNavigationSections;
}

/** Lọc mục menu theo role trong từng khu */
export function getVisibleAdminItems(
  section: NavSection,
  role: string,
  area: NavArea = 'admin',
): NavItem[] {
  if (area === 'partner') {
    // Nhân viên của đối tác không quản lý tài khoản nhân viên (chỉ chủ đối tác)
    const partnerStaff = Boolean(getStoredUser()?.partnerStaff);
    return section.items.filter((item) => !(partnerStaff && item.href === '/partner/staff'));
  }
  return section.items.filter((item) => {
    if (!canAccessAdminPath(role, item.href)) return false;
    return role !== 'STAFF' || !STAFF_HIDDEN_HREFS.includes(item.href);
  });
}

export function AdminSidebar({ area = 'admin' }: { area?: NavArea }) {
  const navigationSections = getNavSections(area);
  const pathname = usePathname();
  const [role, setRole] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setRole(getStoredUser()?.role || '');
  }, []);

  useEffect(() => {
    const activeSection = navigationSections.find(
      (section) =>
        getVisibleAdminItems(section, role, area).length > 1 &&
        getVisibleAdminItems(section, role, area).some(
          (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
        ),
    );

    if (activeSection) {
      setOpenSections((current) => ({ ...current, [activeSection.title]: true }));
    }
  }, [pathname, role, area, navigationSections]);

  return (
    <aside className="w-64 border-r border-line bg-surface/95 backdrop-blur-md flex flex-col h-screen sticky top-0 z-30 transition-all select-none">
      {/* Brand Logo Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-line">
        <div className="size-10 rounded-sm border border-neon/40 bg-ink flex items-center justify-center text-neon">
          <Dumbbell className="size-5" />
        </div>
        <div>
          <span className="font-display text-base font-extrabold uppercase tracking-tight text-chalk flex items-center gap-1">
            GYM<span className="text-neon">MASTER</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted block -mt-0.5">
            {area === 'partner' ? 'Partner Portal' : 'Operations Pro'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationSections.map((section) => {
          const visibleItems = getVisibleAdminItems(section, role, area);
          if (!visibleItems.length) return null;

          const isCollapsible = visibleItems.length > 1;
          const isOpen = openSections[section.title] ?? false;
          const isSectionActive = visibleItems.some(
            (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
          );

          return (
            <div key={section.title} className="space-y-1">
              {isCollapsible ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenSections((current) => ({
                      ...current,
                      [section.title]: !(current[section.title] ?? false),
                    }))
                  }
                  className={cn(
                    'flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider transition-colors',
                    isSectionActive
                      ? 'text-chalk hover:bg-line/30'
                      : 'text-muted hover:bg-line/30 hover:text-chalk',
                  )}
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'size-4 transition-transform duration-200',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
              ) : null}
              {isOpen || !isCollapsible ? (
                <div className="space-y-0.5 pt-1">
                  {visibleItems.map((item) => {
                    const hasMoreSpecificMatch = visibleItems.some(
                      (candidate) =>
                        candidate.href !== item.href &&
                        candidate.href.startsWith(`${item.href}/`) &&
                        (pathname === candidate.href || pathname.startsWith(`${candidate.href}/`)),
                    );
                    const isActive =
                      pathname === item.href ||
                      (pathname.startsWith(`${item.href}/`) && !hasMoreSpecificMatch);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center justify-between rounded-[10px] border-l-2 px-3 py-2 text-xs font-semibold transition-all group',
                          isActive
                            ? 'border-neon bg-neon/10 font-bold text-neon'
                            : 'border-transparent text-muted hover:bg-line/30 hover:text-chalk',
                          isCollapsible && 'ml-2',
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              'size-4 transition-colors',
                              isActive ? 'text-neon' : 'text-muted group-hover:text-chalk',
                            )}
                          />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="rounded-full bg-neon/15 px-1.5 py-0.5 text-[10px] font-extrabold text-neon">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
