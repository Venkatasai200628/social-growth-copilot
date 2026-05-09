'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-8"
    >
      <ArrowLeft size={14} />
      Back to Home
    </Link>
  );
}
