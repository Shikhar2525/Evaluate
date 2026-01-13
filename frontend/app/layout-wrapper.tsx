'use client';

import { ReactNode, useLayoutEffect } from 'react';
import { useAuth } from '@/lib/hooks';
import Navbar from '../lib/components/navbar';
import Loader from '@/lib/components/loader';

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
    return <Loader message="Initializing..." fullScreen />;
  }

  return (
    <>
      {user && <Navbar />}
      <main className={user ? 'pt-4' : ''}>{children}</main>
    </>
  );
}
