import React from 'react';
import { TrainerGuard } from '@/components/guards/trainer-guard';
import { TrainerHeader } from '@/components/layout/trainer-header';

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrainerGuard>
      <div className="min-h-screen flex flex-col bg-ink">
        <TrainerHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </TrainerGuard>
  );
}
