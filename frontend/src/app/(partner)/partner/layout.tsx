import React from 'react';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { PartnerGuard } from '@/components/guards/admin-guard';

/** Khu vận hành riêng của phòng gym đối tác — tách hẳn khỏi khu quản trị hệ thống /admin */
export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PartnerGuard>
      <div className="flex min-h-screen bg-ink">
        <div className="hidden lg:block">
          <AdminSidebar area="partner" />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader area="partner" />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </PartnerGuard>
  );
}
