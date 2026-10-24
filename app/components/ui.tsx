'use client';
import { ReactNode, ButtonHTMLAttributes, HTMLAttributes, CSSProperties, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import { copyText } from '@/lib/client';
import { LANGUAGES } from '@/lib/india';

export function Button({
  children, variant = 'primary', size = 'md', loading, className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const sizes = { sm: 'text-xs px-4 py-2', md: 'text-sm px-6 py-3', lg: 'text-base px-8 py-4' };
  const variants = {
    primary:
      'text-white shadow-lg shadow-[color-mix(in_srgb,var(--accent)_25%,transparent)] hover:shadow-xl hover:shadow-[color-mix(in_srgb,var(--accent)_35%,transparent)] hover:-translate-y-0.5 [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]',
    ghost: 'border border-[var(--border)] text-[var(--text-soft)] hover:border-[var(--accent)] hover:text-[var(--text)]',
    subtle: 'bg-[var(--hover-fill)] text-[var(--text-soft)] hover:text-[var(--text)]',
    danger: 'bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_25%,transparent)]',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ children, className = '', hover = false, style, ...rest }: { children: ReactNode; className?: string; hover?: boolean; style?: CSSProperties } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={style}
      {...rest}
      className={`bg-[var(--card)] border border-[var(--border)] rounded-3xl ${
        hover ? 'hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:-translate-y-1 transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] rounded-full px-4 py-1.5">
      {children}
    </span>
  );
}

export function PageHeader({ eyebrow, title, sub, icon }: { eyebrow: ReactNode; title: string; sub?: string; icon?: ReactNode }) {
  return (
    <div className="mb-10 animate-fade-up">
      <Eyebrow>{icon}{eyebrow}</Eyebrow>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-5 text-[var(--text)] leading-tight">{title}</h1>
      {sub && <p className="text-[var(--text-muted)] mt-3 max-w-2xl text-sm leading-relaxed">{sub}</p>}
    </div>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--text-soft)] tracking-wide uppercase">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-[var(--text-faint)] mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-[var(--danger)] mt-1.5">{error}</span>}
    </label>
  );
}

export const inputCls =
  'w-full mt-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] outline-none transition-colors';

export function CopyButton({ text, label = 'Copy', className = '' }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
      aria-label={`Copy ${label}`}
      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-all ${className}`}
    >
      {done ? <Check size={13} className="text-[var(--success)]" /> : <Copy size={13} />}
      {done ? 'Copied!' : label}
    </button>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-2xl ${className}`} />;
}

export function EmptyState({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-6 border border-dashed border-[var(--border)] rounded-3xl">
      {icon && <div className="mx-auto w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] flex items-center justify-center text-[var(--accent-soft)] mb-4">{icon}</div>}
      <p className="text-[var(--text)] font-medium">{title}</p>
      {sub && <p className="text-[var(--text-muted)] text-sm mt-1 max-w-sm mx-auto">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1.5 p-1.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded-full overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            active === t.id ? 'bg-[var(--card)] text-[var(--text)] shadow border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function LanguageSelect({ value, onChange, className = '' }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Language" className={className || inputCls}>
      {LANGUAGES.map((l) => (
        <option key={l.id} value={l.id}>
          {l.label}
        </option>
      ))}
    </select>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-[var(--text-muted)] text-sm" role="status" aria-live="polite">
      <Loader2 size={16} className="animate-spin text-[var(--accent-soft)]" />
      {label}
    </div>
  );
}
