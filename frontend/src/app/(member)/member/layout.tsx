import React from 'react';
import { MemberGuard } from '@/components/guards/member-guard';
import { MemberHeader } from '@/components/layout/member-header';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <MemberGuard>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <MemberHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </MemberGuard>
  );
}