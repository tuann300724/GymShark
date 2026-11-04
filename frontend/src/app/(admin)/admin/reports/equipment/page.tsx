'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EquipmentTab } from '../EquipmentTab';

export default function EquipmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-chalk"
            >
              <ArrowLeft className="size-3" /> Quay lại Báo cáo
            </Link>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
            Quản lý & Thống kê Thiết bị
          </h1>
          <p className="text-sm text-muted">
            Theo dõi hiện trạng, bảo trì và danh mục trang thiết bị phòng tập
          </p>
        </div>
      </div>
      <EquipmentTab />
    </div>
  );
}
