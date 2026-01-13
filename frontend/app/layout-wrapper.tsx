'use client';

import { ReactNode, useLayoutEffect } from 'react';
import { useAuth } from '@/lib/hooks';
import Navbar from '../lib/components/navbar';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();

  // Ensure auth state is restored from localStorage on initial load
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          JSON.parse(savedUser);
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user && <Navbar />}
      <main className={user ? 'pt-4' : ''}>{children}</main>
    </>
  );
}
