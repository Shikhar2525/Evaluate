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
    <nav className="sticky top-0 z-50 border-b border-[#3F9AAE]/30 bg-slate-900/50 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/templates" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3F9AAE] to-[#F96E5B] flex items-center justify-center text-white group-hover:shadow-lg group-hover:shadow-[#3F9AAE]/50 transition-shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] bg-clip-text text-transparent">
              Evaluate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-[#FFE2AF] border-b-2 border-[#3F9AAE] pb-4'
                    : 'text-[#79C9C5] hover:text-[#FFE2AF]'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4 relative">
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 hover:bg-[#3F9AAE]/20 rounded-lg transition-all"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#3F9AAE] to-[#F96E5B] text-white font-semibold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-2xl border border-[#3F9AAE]/30 py-2 z-20 backdrop-blur-xl">
                  <div className="px-4 py-3 border-b border-[#3F9AAE]/30">
                    <p className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-[#79C9C5] truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#FFE2AF] hover:bg-[#F96E5B]/20 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-[#3F9AAE]/20 rounded-lg transition-colors text-[#79C9C5]"
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
          <div className="md:hidden pb-4 border-t border-[#3F9AAE]/30 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowMenu(false)}
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'bg-[#3F9AAE]/20 text-[#FFE2AF] font-medium'
                    : 'text-[#79C9C5] hover:bg-[#3F9AAE]/10'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
