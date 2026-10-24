import Link from 'next/link';
import { Compass, Leaf, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-[1.5px] mx-auto mb-8">
          <div className="w-full h-full rounded-[14px] bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] flex items-center justify-center">
            <Leaf size={20} className="text-emerald-400" />
          </div>
        </div>
        <div className="font-display text-8xl font-bold text-[var(--text)]/10 mb-4">404</div>
        <h1 className="font-display text-2xl font-bold text-[var(--text)] mb-3 flex items-center justify-center gap-2">
          <Compass size={20} className="text-[var(--accent-soft)]" /> This page wandered off
        </h1>
        <p className="text-[var(--text-muted)] mb-8 text-sm">
          The link may be old or mistyped — but your marketing mitra is still right here.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium px-8 py-3 rounded-full text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent)]/25 hover:-translate-y-0.5 transition-all [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>
    </main>
  );
}
