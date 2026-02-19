'use client';

import { useAuth } from '@/lib/hooks';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const { user, loading } = useAuth();
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  const handleLogout = () => {
    clearAuth();
    router.push('/sign-in');
  };

  const isActive = (path: string) => pathname.startsWith(path);

  // Hide navbar on auth pages or if user is not logged in
  if (!user || loading || pathname === '/sign-in' || pathname === '/sign-up') return null;

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Interviews', href: '/interviews', icon: '🎤' },
    { label: 'Templates', href: '/templates', icon: '📋' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-gradient-to-b from-white/8 via-white/2 to-transparent backdrop-blur-2xl overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-lg opacity-0 group-hover:opacity-75 transition-opacity duration-300 blur-sm"></div>
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <span className="text-lg font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent group-hover:brightness-110 transition-all">
              Evaluate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 group ${
                  isActive(link.href)
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {/* Active indicator background */}
                {isActive(link.href) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 rounded-lg -z-10"></div>
                )}
                
                <span className="flex items-center gap-2">
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </span>

                {/* Hover underline effect */}
                {!isActive(link.href) && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                )}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4 relative overflow-visible">
            <div className="relative overflow-visible" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-300 group ${
                  showProfileMenu 
                    ? 'bg-white/10 border border-white/20' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={`${user?.firstName} ${user?.lastName}`}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-lg object-cover border border-white/20 shadow-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                )}
                <div className="hidden sm:flex flex-col items-start">
                  <p className="text-sm font-semibold text-white">{user?.firstName}</p>
                  <p className="text-xs text-slate-400">{user?.lastName}</p>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 rounded-2xl shadow-2xl border border-white/15 py-0 z-[9999] backdrop-blur-xl overflow-hidden">
                  {/* Profile Header */}
                  <div className="bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 px-6 py-6 flex items-center gap-4 border-b border-white/10">
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={`${user?.firstName} ${user?.lastName}`}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover border-2 border-cyan-400/30 shadow-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-slate-400 truncate mt-1">{user?.email}</p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="px-4 py-3">
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-400/30 rounded-xl transition-all duration-200 group"
                    >
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 rounded-lg transition-all ${showMenu ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMenu && (
          <div className="md:hidden pb-4 border-t border-white/5 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowMenu(false)}
                className={`block px-4 py-3 rounded-lg font-semibold transition-all ${
                  isActive(link.href)
                    ? 'bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 text-white border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
