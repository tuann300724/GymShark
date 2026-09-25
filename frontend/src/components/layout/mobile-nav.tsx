'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navigationSections } from './admin-sidebar';
import { Menu, X, Dumbbell } from 'lucide-react';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-sm text-muted hover:bg-line/30 hover:text-chalk transition-colors"
        aria-label="Open Navigation"
      >
        <Menu className="size-5" />
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <button
              type="button"
              tabIndex={-1}
              aria-label="Đóng menu"
              className="fixed inset-0 bg-ink/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative flex flex-col w-72 max-w-xs bg-surface border-r border-line h-full p-4 shadow-2xl z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-line">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-sm border border-neon/40 bg-ink flex items-center justify-center text-neon">
                    <Dumbbell className="size-4" />
                  </div>
                  <span className="font-display font-extrabold uppercase text-sm text-chalk">
                    GYM<span className="text-neon">MASTER</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-sm text-muted hover:bg-line/30 hover:text-chalk transition-colors"
                  aria-label="Close Navigation"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {navigationSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <h6 className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                      {section.title}
                    </h6>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-semibold transition-colors',
                              isActive
                                ? 'bg-neon/10 text-neon'
                                : 'text-muted hover:bg-line/30 hover:text-chalk',
                            )}
                          >
                            <Icon
                              className={cn('w-4 h-4', isActive ? 'text-neon' : 'text-muted')}
                            />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
