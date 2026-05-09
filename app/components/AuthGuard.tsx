'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (!loading && !user && !redirected.current) {
      redirected.current = true;
      router.replace('/auth');
    }
  }, [user, loading, router]);

  // Don't block rendering — show immediately, redirect if truly unauthed
  if (!loading && !user) return null;
  return <>{children}</>;
}
