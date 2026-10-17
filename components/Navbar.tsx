'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HeartHandshake,
  LayoutDashboard,
  Package,
  ShieldCheck,
  LogOut,
  LogIn,
  User,
  ExternalLink,
} from 'lucide-react';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'donor' | 'volunteer' | 'admin';
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'volunteer':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'donor':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <nav className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all shadow-sm shadow-emerald-950">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                Give<span className="text-emerald-400">Track</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center ml-8 space-x-1">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  pathname === '/'
                    ? 'text-white bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Campaigns
              </Link>

              {user && (
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/dashboard'
                      ? 'text-white bg-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Donor Dashboard
                  </span>
                </Link>
              )}

              {user && (user.role === 'volunteer' || user.role === 'admin') && (
                <Link
                  href="/volunteer"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pathname.startsWith('/volunteer')
                      ? 'text-sky-300 bg-sky-950/50 border border-sky-800/60'
                      : 'text-slate-400 hover:text-sky-300 hover:bg-slate-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-sky-400" />
                    Volunteer Hub
                  </span>
                </Link>
              )}

              {user && user.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pathname.startsWith('/admin')
                      ? 'text-amber-300 bg-amber-950/50 border border-amber-800/60'
                      : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Admin Console
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                  <div className="flex items-center justify-end gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : !loading ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-sm shadow-emerald-950"
                >
                  Get Started
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
