'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, LayoutDashboard, Star, MessageCircle, Calendar, Home,
  Menu, X, LogOut, User, ImageIcon, ChevronDown, Film, Sun, Moon, Leaf, Sparkles, Play, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from './ThemeProvider';

// Internal tools shown only when user is authenticated
const appNavLinks: { href: string; label: string; longLabel?: string; icon: typeof Zap }[] = [
  { href: '/home', label: 'Home', longLabel: 'Home', icon: Home },
  { href: '/my-campaigns', label: 'Campaigns', icon: LayoutDashboard },
  { href: '/post-studio', label: 'Post Studio', icon: ImageIcon },
  { href: '/video-studio', label: 'Video Studio', longLabel: 'Video Studio', icon: Film },
  { href: '/campaign', label: 'Campaign', longLabel: 'Campaign Generator', icon: Zap },
  { href: '/festivals', label: 'Festivals', longLabel: 'Festival Calendar', icon: Calendar },
  { href: '/scorer', label: 'Scorer', longLabel: 'Virality Scorer', icon: Star },
  { href: '/reply-agent', label: 'Replies', longLabel: 'Reply Agent', icon: MessageCircle },
];

// Public navigation shown when visitor is not logged in
const publicNavLinks = [
  { href: '/#features', label: 'Features', icon: Sparkles },
  { href: '/#how', label: 'How It Works', icon: Play },
  { href: '/#experts', label: 'Creative Experts', icon: Users },
  { href: '/#testimonials', label: 'Success Stories', icon: Star },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Hide navbar on checkout/onboard/auth pages
  if (pathname.startsWith('/checkout') || pathname.startsWith('/onboard') || pathname.startsWith('/auth')) return null;

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || '?';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'color-mix(in srgb, var(--bg) 96%, transparent)' : 'color-mix(in srgb, var(--bg) 60%, transparent)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href={user ? '/home' : '/'} aria-label="GrowMitra home" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-[1.5px]">
            <div className="w-full h-full rounded-[6px] bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] flex items-center justify-center">
              <Leaf size={13} className="text-emerald-400" />
            </div>
          </div>
          <span className="text-sm font-light text-[var(--text)] hidden sm:block uppercase tracking-[0.15em]">
            Grow<span className="text-[var(--accent-soft)]">Mitra</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5">
          {user ? (
            appNavLinks.map(({ href, label, longLabel, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link key={href} href={href} aria-label={longLabel || label} aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-1.5 text-xs font-light px-3 py-2 rounded-xl transition-all tracking-wide"
                  style={{
                    background: active ? 'var(--hover-fill)' : 'transparent',
                    color: active ? 'var(--accent-soft)' : 'var(--text-muted)',
                    border: active ? '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' : '1px solid transparent',
                  }}>
                  <Icon size={11} />{label}
                </Link>
              );
            })
          ) : (
            publicNavLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 text-xs font-light px-3.5 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-fill)] transition-all tracking-wide">
                <Icon size={11} className="text-[var(--accent-soft)]" />{label}
              </Link>
            ))
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] hover:bg-[var(--hover-fill)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-all">
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[var(--input-border)] hover:border-[var(--accent)]/30 bg-[var(--input-bg)] hover:bg-[var(--hover-fill)] transition-all">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent-soft)] text-[10px] font-medium">
                    {initials}
                  </div>
                )}
                <span className="text-xs text-[var(--text-soft)] font-light hidden sm:block max-w-[100px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown size={11} className="text-[var(--text-faint)]" />
              </button>

              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-xs font-light text-[var(--text)] truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 font-light">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { router.push('/home'); setUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 text-xs font-light text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--hover-fill)] px-3 py-2.5 rounded-xl transition-all text-left">
                      <Home size={12} /> Dashboard Home
                    </button>
                    <button onClick={() => { router.push('/profile'); setUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 text-xs font-light text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--hover-fill)] px-3 py-2.5 rounded-xl transition-all text-left">
                      <User size={12} /> My Profile
                    </button>
                    <button onClick={() => { router.push('/my-campaigns'); setUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 text-xs font-light text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-[var(--hover-fill)] px-3 py-2.5 rounded-xl transition-all text-left">
                      <LayoutDashboard size={12} /> My Campaigns
                    </button>
                    <div className="h-px bg-[var(--border)] my-1" />
                    <button onClick={async () => { await logout(); router.push('/'); setUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 text-xs font-light text-[var(--danger)] hover:bg-[var(--danger)]/8 px-3 py-2.5 rounded-xl transition-all text-left">
                      <LogOut size={12} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth"
                className="hidden sm:inline-flex items-center text-xs font-light text-[var(--text-muted)] hover:text-[var(--text)] px-3 py-1.5 rounded-xl transition-all">
                Sign In
              </Link>
              <Link href="/auth"
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent)]/25 transition-all hover:-translate-y-0.5 tracking-wide [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
                <Zap size={11} /> Get Started
              </Link>
            </div>
          )}

          <button className="md:hidden text-[var(--text-muted)] hover:text-[var(--text)] transition-colors" onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav-menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-nav-menu" className="md:hidden border-t border-[var(--border)] bg-[var(--bg)] px-6 py-4 space-y-1">
          {user ? (
            <>
              {appNavLinks.map(({ href, label, longLabel, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)} aria-label={longLabel || label}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center gap-3 text-sm font-light px-3 py-2.5 rounded-xl transition-all tracking-wide"
                    style={{ color: active ? 'var(--accent-soft)' : 'var(--text-muted)', background: active ? 'var(--hover-fill)' : 'transparent' }}>
                    <Icon size={14} />{label}
                  </Link>
                );
              })}
              <div className="h-px bg-[var(--border)] my-2" />
              <button onClick={async () => { await logout(); setOpen(false); router.push('/'); }}
                className="w-full flex items-center gap-3 text-sm font-light px-3 py-2.5 rounded-xl text-[var(--danger)]">
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <>
              {publicNavLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 text-sm font-light px-3 py-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)]">
                  <Icon size={14} className="text-[var(--accent-soft)]" />{label}
                </Link>
              ))}
              <div className="h-px bg-[var(--border)] my-2" />
              <Link href="/auth" onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-xl text-[var(--accent-soft)]">
                <Zap size={14} /> Sign In / Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
