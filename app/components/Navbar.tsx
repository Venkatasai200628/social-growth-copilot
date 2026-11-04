'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, LayoutDashboard, Star, MessageCircle, Calendar, Home,
  Menu, X, LogOut, User, ImageIcon, ChevronDown, Film, Sun, Moon, Leaf, Sparkles, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from './ThemeProvider';

// Internal studio tools grouped inside the Tools dropdown
const studioTools = [
  { href: '/post-studio', label: 'Post Studio', desc: 'AI festival posters, 1:1, 4:5 & 9:16', icon: ImageIcon, color: 'var(--accent-soft)' },
  { href: '/video-studio', label: 'Video Studio', desc: 'Motion explainers, promo reels & AI voiceovers', icon: Film, color: 'var(--neon)' },
  { href: '/campaign', label: 'Campaign Generator', desc: 'Multi-day plan with budget split', icon: Zap, color: 'var(--gold)' },
  { href: '/festivals', label: 'Festival Calendar', desc: '18+ Indian shopping festivals', icon: Calendar, color: '#f59e0b' },
  { href: '/scorer', label: 'Virality Scorer', desc: 'A/B test hooks & captions head-to-head', icon: Star, color: '#eab308' },
  { href: '/reply-agent', label: 'Reply Agent', desc: 'Brand-safe customer comment & DM replies', icon: MessageCircle, color: '#25d366' },
];

// Public navigation shown when visitor is not logged in
const publicNavLinks = [
  { href: '/#overview', label: 'Overview', icon: Sparkles },
  { href: '/#studios', label: 'Creative Studios', icon: ImageIcon },
  { href: '/#how', label: 'How It Works', icon: Film },
  { href: '/#experts', label: 'Creative Experts', icon: Users },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [toolsMenu, setToolsMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false);
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsMenu(false);
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
        <div className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              {/* Dashboard Home */}
              <Link href="/home" aria-current={pathname === '/home' ? 'page' : undefined}
                className="flex items-center gap-1.5 text-xs font-light px-3.5 py-2 rounded-xl transition-all tracking-wide"
                style={{
                  background: pathname === '/home' ? 'var(--hover-fill)' : 'transparent',
                  color: pathname === '/home' ? 'var(--accent-soft)' : 'var(--text-muted)',
                  border: pathname === '/home' ? '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' : '1px solid transparent',
                }}>
                <Home size={12} /> Dashboard
              </Link>

              {/* My Campaigns */}
              <Link href="/my-campaigns" aria-current={pathname === '/my-campaigns' ? 'page' : undefined}
                className="flex items-center gap-1.5 text-xs font-light px-3.5 py-2 rounded-xl transition-all tracking-wide"
                style={{
                  background: pathname === '/my-campaigns' ? 'var(--hover-fill)' : 'transparent',
                  color: pathname === '/my-campaigns' ? 'var(--accent-soft)' : 'var(--text-muted)',
                  border: pathname === '/my-campaigns' ? '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' : '1px solid transparent',
                }}>
                <LayoutDashboard size={12} /> Campaigns
              </Link>

              {/* Tools Dropdown */}
              <div className="relative" ref={toolsRef}>
                <button
                  onClick={() => setToolsMenu(!toolsMenu)}
                  className="flex items-center gap-1.5 text-xs font-light px-3.5 py-2 rounded-xl transition-all tracking-wide"
                  style={{
                    background: studioTools.some(t => pathname === t.href || pathname.startsWith(t.href + '/')) || toolsMenu ? 'var(--hover-fill)' : 'transparent',
                    color: studioTools.some(t => pathname === t.href || pathname.startsWith(t.href + '/')) || toolsMenu ? 'var(--accent-soft)' : 'var(--text-muted)',
                    border: studioTools.some(t => pathname === t.href || pathname.startsWith(t.href + '/')) || toolsMenu ? '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' : '1px solid transparent',
                  }}
                >
                  <Sparkles size={12} /> Studio Tools <ChevronDown size={11} className={`transition-transform duration-200 ${toolsMenu ? 'rotate-180' : ''}`} />
                </button>

                {toolsMenu && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-2 z-50 animate-fade-in space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider">
                      Marketing & Content Studios
                    </div>
                    {studioTools.map(({ href, label, desc, icon: Icon, color }) => {
                      const active = pathname === href;
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setToolsMenu(false)}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[var(--hover-fill)] transition-all group text-left"
                          style={{ background: active ? 'var(--hover-fill)' : 'transparent' }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
                            <Icon size={14} style={{ color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-[var(--text)] group-hover:text-[var(--accent-soft)] transition-colors flex items-center gap-1.5">
                              {label}
                              {active && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{desc}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
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
          {user && (
            <Link
              href="/post-studio"
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full text-white shadow-md shadow-[var(--accent)]/20 transition-all hover:opacity-90 tracking-wide [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]"
            >
              <ImageIcon size={11} /> Create Post
            </Link>
          )}
          <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] hover:bg-[var(--hover-fill)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-all">
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[var(--input-border)] hover:border-[var(--accent)]/30 bg-[var(--input-bg)] hover:bg-[var(--hover-fill)] transition-all">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
              <Link href="/home" onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-sm font-light px-3 py-2.5 rounded-xl transition-all tracking-wide"
                style={{ color: pathname === '/home' ? 'var(--accent-soft)' : 'var(--text-muted)', background: pathname === '/home' ? 'var(--hover-fill)' : 'transparent' }}>
                <Home size={14} /> Dashboard Home
              </Link>
              <Link href="/my-campaigns" onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-sm font-light px-3 py-2.5 rounded-xl transition-all tracking-wide"
                style={{ color: pathname === '/my-campaigns' ? 'var(--accent-soft)' : 'var(--text-muted)', background: pathname === '/my-campaigns' ? 'var(--hover-fill)' : 'transparent' }}>
                <LayoutDashboard size={14} /> My Campaigns
              </Link>

              <div className="pt-2 pb-1 px-3 text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider">
                Creative Tools
              </div>

              {studioTools.map(({ href, label, icon: Icon, color }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 text-sm font-light px-3 py-2 rounded-xl transition-all tracking-wide"
                    style={{ color: active ? 'var(--accent-soft)' : 'var(--text-muted)', background: active ? 'var(--hover-fill)' : 'transparent' }}>
                    <Icon size={14} style={{ color }} /> {label}
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
