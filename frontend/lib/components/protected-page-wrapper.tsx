'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import Link from 'next/link';

export default function ProtectedPageWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Don't auto-redirect, let the component render the error screen
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#79C9C5] border-t-[#3F9AAE] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#79C9C5]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-[#79C9C5] mb-2 text-lg">You need to be logged in to access this page</p>
          <p className="text-[#79C9C5]/70 mb-8">Please sign in with your credentials to continue</p>
          
          <div className="flex flex-col gap-3">
            <Link
              href="/sign-in"
              className="px-8 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-8 py-3 border border-[#3F9AAE]/30 text-[#79C9C5] font-semibold rounded-lg hover:bg-[#3F9AAE]/10 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
