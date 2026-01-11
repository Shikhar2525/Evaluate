'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Navbar from '@/lib/components/navbar';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect based on authentication status
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/sign-in');
    }
  }, [user, router]);

  return (
    <>
      {user && <Navbar />}
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    </>
  );
}
