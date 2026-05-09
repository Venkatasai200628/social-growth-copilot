'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, TrendingUp, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type Mode = 'signin' | 'signup' | 'reset';

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, signInEmail, signUpEmail, signInGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace('/my-campaigns');
  }, [user, loading, router]);

  const friendlyError = (code: string) => {
    const map: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
      'auth/invalid-credential': 'Incorrect email or password.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  };

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (mode !== 'reset' && !password.trim()) { setError('Password is required.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Your name is required.'); return; }
    setBusy(true);
    try {
      if (mode === 'signin') { await signInEmail(email, password); router.replace('/my-campaigns'); }
      else if (mode === 'signup') { await signUpEmail(email, password, name); router.replace('/welcome'); }
      else { await resetPassword(email); setSuccess('Password reset email sent! Check your inbox.'); }
    } catch (e: unknown) {
      const code = (e as { code?: string }).code || '';
      setError(friendlyError(code));
    } finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    setError(''); setBusy(true);
    try {
      const isNew = !document.cookie.includes('sgc_returning');
      await signInGoogle();
      document.cookie = 'sgc_returning=1;max-age=31536000';
      router.replace(isNew ? '/welcome' : '/my-campaigns');
    }
    catch (e: unknown) { const code = (e as { code?: string }).code || ''; setError(friendlyError(code)); }
    finally { setBusy(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-violet-400" />
    </div>
  );

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-16">
      <div className="orb w-[600px] h-[600px] bg-violet-600/10 top-[-200px] right-[-150px]" />
      <div className="orb w-[400px] h-[400px] bg-cyan-600/6 bottom-[-100px] left-[-100px]" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
            <TrendingUp size={20} className="text-violet-400" />
          </div>
          <h1 className="text-4xl font-light text-white mb-1 tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h1>
          <p className="text-slate-500 text-sm font-light">
            {mode === 'signin' ? 'Sign in to your campaigns' : mode === 'signup' ? 'Start growing your brand today' : 'We\'ll send you a reset link'}
          </p>
        </div>

        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8">

          {/* Google button */}
          {mode !== 'reset' && (
            <>
              <button onClick={handleGoogle} disabled={busy}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all text-sm font-light text-slate-300 mb-6 disabled:opacity-50">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-slate-600 font-light">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            </>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 text-sm font-light transition-colors" />
              </div>
            )}

            <div className="relative">
              <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 text-sm font-light transition-colors" />
            </div>

            {mode !== 'reset' && (
              <div className="relative">
                <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type={showPass ? 'text' : 'password'} placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-10 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 text-sm font-light transition-colors" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* Forgot password */}
          {mode === 'signin' && (
            <button onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors mt-3 block">
              Forgot password?
            </button>
          )}

          {/* Error / success */}
          {error && (
            <div className="mt-4 flex items-start gap-2.5 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3 text-red-400 text-xs font-light">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="mt-4 flex items-start gap-2.5 bg-green-500/8 border border-green-500/15 rounded-xl px-4 py-3 text-green-400 text-xs font-light">
              <CheckCircle size={13} className="mt-0.5 flex-shrink-0" />{success}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={busy}
            className="w-full mt-6 py-3.5 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-white hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : (
              <>{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}<ArrowRight size={13} /></>
            )}
          </button>

          {/* Mode switch */}
          <p className="text-center text-xs text-slate-600 font-light mt-5">
            {mode === 'signin' ? (
              <>Don&apos;t have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(''); }} className="text-violet-400 hover:text-violet-300 transition-colors">Sign up free</button>
              </>
            ) : mode === 'signup' ? (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('signin'); setError(''); }} className="text-violet-400 hover:text-violet-300 transition-colors">Sign in</button>
              </>
            ) : (
              <button onClick={() => { setMode('signin'); setError(''); }} className="text-violet-400 hover:text-violet-300 transition-colors">← Back to sign in</button>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
