'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
type Theme = 'dark' | 'light';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  useEffect(() => {
    const saved = localStorage.getItem('sgc_theme') as Theme | null;
    if (saved) { setTheme(saved); document.documentElement.setAttribute('data-theme', saved); }
  }, []);
  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next); localStorage.setItem('sgc_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };
  return <ThemeContext.Provider value={{ theme, toggle }}><div data-theme={theme}>{children}</div></ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
