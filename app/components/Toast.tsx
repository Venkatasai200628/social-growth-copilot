'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X, Zap } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'ai';
interface Toast { id: string; message: string; type: ToastType; }
interface ToastContextType { toast: (message: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  const icons = { success: CheckCircle, error: AlertCircle, info: Info, ai: Zap };
  const colors = {
    success: { bg: 'color-mix(in srgb, var(--success) 12%, transparent)', border: 'color-mix(in srgb, var(--success) 25%, transparent)', text: 'var(--success)' },
    error:   { bg: 'color-mix(in srgb, var(--danger) 12%, transparent)',  border: 'color-mix(in srgb, var(--danger) 25%, transparent)',  text: 'var(--danger)' },
    info:    { bg: 'color-mix(in srgb, var(--neon) 12%, transparent)',    border: 'color-mix(in srgb, var(--neon) 25%, transparent)',    text: 'var(--neon)' },
    ai:      { bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',  border: 'color-mix(in srgb, var(--accent) 25%, transparent)',  text: 'var(--accent-soft)' },
  };
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => {
          const Icon = icons[t.type]; const c = colors[t.type];
          return (
            <div key={t.id} role="status" className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-slide-up max-w-[min(24rem,calc(100vw-3rem))]"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <Icon size={15} style={{ color: c.text, flexShrink: 0 }} />
              <span className="text-sm font-light text-[var(--text)] flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} aria-label="Dismiss notification" className="text-[var(--text-faint)] hover:text-[var(--text-soft)] transition-colors ml-1"><X size={13} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.toast;
}
