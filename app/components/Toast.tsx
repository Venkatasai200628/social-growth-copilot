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
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#10b981' },
    error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  text: '#ef4444' },
    info:    { bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.25)', text: '#22d3ee' },
    ai:      { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)', text: '#a78bfa' },
  };
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => {
          const Icon = icons[t.type]; const c = colors[t.type];
          return (
            <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-slide-up max-w-sm"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <Icon size={15} style={{ color: c.text, flexShrink: 0 }} />
              <span className="text-sm font-light text-white flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="text-slate-600 hover:text-slate-400 transition-colors ml-1"><X size={13} /></button>
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
