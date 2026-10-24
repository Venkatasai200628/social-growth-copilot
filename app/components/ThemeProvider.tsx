'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
type Theme = 'dark' | 'light';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} });

const KEY = 'growmitra_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The inline script in layout.tsx already set the attribute pre-hydration;
  // pick up whatever it resolved so first paint === hydrated paint.
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) || localStorage.getItem('sgc_theme')) as Theme | null;
    const initial = saved ?? (document.documentElement.getAttribute('data-theme') as Theme) ?? 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(KEY, next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return <ThemeContext.Provider value={{ theme, toggle }}><div data-theme={theme}>{children}</div></ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
