'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { cn } from '@/lib/utils';

/**
 * Nút chuyển giao diện sáng/tối.
 * Icon mặt trời/mặt trăng xoay + mờ dần (CSS .theme-toggle-icon trong globals.css),
 * toàn trang chuyển màu mượt 450ms qua lớp .theme-transition.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className={cn(
        'relative flex size-9 items-center justify-center overflow-hidden rounded-sm border border-line bg-surface text-muted transition-colors hover:border-neon/50 hover:text-neon',
        className,
      )}
    >
      <Sun className="theme-toggle-icon theme-toggle-icon-sun absolute size-4" aria-hidden />
      <Moon className="theme-toggle-icon theme-toggle-icon-moon absolute size-4" aria-hidden />
    </button>
  );
}
