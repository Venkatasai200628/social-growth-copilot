'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, LayoutDashboard, Star, MessageCircle, TrendingUp,
  Menu, X, LogOut, User, ImageIcon, ChevronDown, Film, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from './ThemeProvider';

const navLinks = [
  { href: '/my-campaigns', label: 'My Campaigns', icon: LayoutDashboard },
  { href: '/post-studio', label: 'Post Studio', icon: ImageIcon },
  { href: '/video-studio', label: 'Video Studio', icon: Film },
  { href: '/campaign', label: 'Campaign Gen', icon: Zap },
  { href: '/scorer', label: 'Virality Score', icon: Star },
  { href: '/reply-agent', label: 'Auto-Reply', icon: MessageCircle },
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
        background: scrolled ? 'rgba(8,8,13,0.95)' : 'rgba(8,8,13,0.6)',
        backdropFilter: 'blur(24px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
      }}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-violet-600/15 border border-violet-500/25 flex items-center justify-center">
            <TrendingUp size={13} className="text-violet-400" />
          </div>
          <span className="text-sm font-light text-white hidden sm:block tracking-widest uppercase"
            style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.15em' }}>
            Growth <span className="text-violet-400">Copilot</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 text-xs font-light px-3 py-2 rounded-xl transition-all tracking-wide"
                style={{
                  background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
                  color: active ? '#a78bfa' : '#475569',
                  border: active ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
                }}>
                <Icon size={11} />{label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme}
            className="w-8 h-8 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center text-slate-500 hover:text-white transition-all">
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.05] transition-all">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 text-[10px] font-medium">
                    {initials}
                  </div>
                )}
                <span className="text-xs text-slate-400 font-light hidden sm:block max-w-[100px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown size={11} className="text-slate-600" />
              </button>

              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#16161f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-xs font-light text-white truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5 font-light">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { router.push('/profile'); setUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 text-xs font-light text-slate-400 hover:text-white hover:bg-white/[0.05] px-3 py-2.5 rounded-xl transition-all text-left">
                      <User size={12} /> My Profile
                    </button>
                    <button onClick={() => { router.push('/my-campaigns'); setUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 text-xs font-light text-slate-400 hover:text-white hover:bg-white/[0.05] px-3 py-2.5 rounded-xl transition-all text-left">
                      <LayoutDashboard size={12} /> My Campaigns
                    </button>
                    <div className="h-px bg-white/[0.05] my-1" />
                    <button onClick={async () => { await logout(); router.push('/'); setUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 text-xs font-light text-red-400 hover:text-red-300 hover:bg-red-500/8 px-3 py-2.5 rounded-xl transition-all text-left">
                      <LogOut size={12} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth"
              className="hidden md:flex items-center gap-1.5 text-xs font-light px-4 py-2 rounded-xl text-white transition-all hover:opacity-85 tracking-wide"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              <Zap size={11} /> Get Started
            </Link>
          )}

          <button className="md:hidden text-slate-500 hover:text-white transition-colors" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.05] bg-[#08080d]/98 px-6 py-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-sm font-light px-3 py-3 rounded-xl transition-all tracking-wide"
                style={{ color: active ? '#a78bfa' : '#475569', background: active ? 'rgba(124,58,237,0.08)' : 'transparent' }}>
                <Icon size={14} />{label}
              </Link>
            );
          })}
          {!user && (
            <Link href="/auth" onClick={() => setOpen(false)}
              className="flex items-center gap-3 text-sm font-light px-3 py-3 rounded-xl text-violet-400">
              <Zap size={14} /> Sign In / Sign Up
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
