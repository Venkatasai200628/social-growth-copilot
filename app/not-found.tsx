import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-light text-white/10 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>404</div>
        <h1 className="text-2xl font-light text-white mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Page not found</h1>
        <p className="text-slate-500 mb-8 text-sm">This page doesn&apos;t exist or your campaign link is wrong.</p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-2xl text-white"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
