'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  mounted: boolean;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  mounted: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = 'gym_theme';

/** Đọc theme đã lưu (mặc định dark = bộ nhận diện gốc của web). */
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // Bật animation chuyển màu toàn trang trong 500ms rồi tắt để không ảnh hưởng hover sau này.
  root.classList.add('theme-transition');
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  window.setTimeout(() => root.classList.remove('theme-transition'), 550);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getStoredTheme());
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    window.localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mounted, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Dùng trong component client để đọc/toggle theme. */
export function useTheme() {
  return useContext(ThemeContext);
}
