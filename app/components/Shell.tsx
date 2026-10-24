'use client';
import { usePathname } from 'next/navigation';

// The navbar hides itself on these routes; only pad for it elsewhere.
const NAVLESS = ['/auth', '/onboard', '/checkout'];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navless = NAVLESS.some((r) => pathname.startsWith(r));
  return <div className={navless ? '' : 'pt-14'}>{children}</div>;
}
