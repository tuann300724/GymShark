'use client';

import React, { createContext, useEffect, useState } from 'react';

/**
 * Design system Dark Cinematic + Neon Fitness là dark-only.
 * Provider luôn giữ lớp `dark` trên <html> để nhận diện khớp với token màu.
 */
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Dark-only brand: luôn ép dark, bỏ lưu trữ light cũ nếu có.
    localStorage.setItem('gym_theme', 'dark');
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    // No-op: giao diện chỉ có chế độ dark theo design system.
    document.documentElement.classList.add('dark');
  };

  if (!mounted) {
    return <div className="dark">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme }}>{children}</ThemeContext.Provider>
  );
}
