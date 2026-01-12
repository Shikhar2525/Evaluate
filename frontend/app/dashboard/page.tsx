'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { useAsyncData } from '@/lib/hooks';
import { templatesAPI, interviewsAPI } from '@/lib/api';
import Link from 'next/link';
import ProtectedPageWrapper from '@/lib/components/protected-page-wrapper';
import RichTextDisplay from '@/lib/components/rich-text-display';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: templates } = useAsyncData<any[]>(
    () => templatesAPI.list(),
    [user],
  );
  const { data: interviews } = useAsyncData<any[]>(
    () => interviewsAPI.list(),
    [user],
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  const totalTemplates = templates?.length || 0;
  const totalInterviews = interviews?.length || 0;
  const completedInterviews = interviews?.filter((i: any) => i.status === 'completed').length || 0;
  const pendingInterviews = interviews?.filter((i: any) => i.status === 'pending').length || 0;

  const recentTemplates = templates?.slice(0, 3) || [];
  const recentInterviews = interviews?.slice(0, 3) || [];

  const stats = [
    {
      label: 'Total Templates',
      value: totalTemplates,
      icon: '📋',
      color: 'from-[#3F9AAE] to-[#79C9C5]',
    },
    {
      label: 'Total Interviews',
      value: totalInterviews,
      icon: '🎤',
      color: 'from-[#79C9C5] to-[#FFE2AF]',
    },
    {
      label: 'Completed',
      value: completedInterviews,
      icon: '✓',
      color: 'from-[#3F9AAE] to-[#79C9C5]',
    },
    {
      label: 'Pending',
      value: pendingInterviews,
      icon: '⏳',
      color: 'from-[#F96E5B] to-[#FFE2AF]',
    },
  ];

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
    <ProtectedPageWrapper>
      <div className="bg-slate-950 min-h-screen">
      {/* Page Header */}
      <div className="border-b border-[#3F9AAE]/30 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-[#79C9C5]">Welcome back, {user?.email?.split('@')[0]}! Here's your interview management overview</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
              <div className="pt-4 border-t border-white/20 text-xs opacity-75">
                {stat.label === 'Completed' && `${Math.round((completedInterviews / totalInterviews) * 100) || 0}% completion rate`}
                {stat.label === 'Pending' && `${pendingInterviews} awaiting review`}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/templates/create"
              className="bg-slate-800 rounded-xl p-8 border border-[#3F9AAE]/30 hover:border-[#3F9AAE] hover:shadow-lg hover:shadow-[#3F9AAE]/20 transition-all group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#3F9AAE]/20 text-[#79C9C5] group-hover:bg-[#3F9AAE]/30 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#FFE2AF] transition-colors">Create Template</h3>
              <p className="text-[#79C9C5] text-sm">Design a new interview template</p>
            </Link>

            <Link
              href="/interviews/new"
              className="bg-slate-800 rounded-xl p-8 border border-[#79C9C5]/30 hover:border-[#79C9C5] hover:shadow-lg hover:shadow-[#79C9C5]/20 transition-all group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#79C9C5]/20 text-[#FFE2AF] group-hover:bg-[#79C9C5]/30 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#FFE2AF] transition-colors">Start Interview</h3>
              <p className="text-[#79C9C5] text-sm">Conduct a new interview</p>
            </Link>

            <Link
              href="/interviews"
              className="bg-slate-800 rounded-xl p-8 border border-[#FFE2AF]/30 hover:border-[#FFE2AF] hover:shadow-lg hover:shadow-[#FFE2AF]/20 transition-all group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#FFE2AF]/20 text-[#F96E5B] group-hover:bg-[#FFE2AF]/30 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#FFE2AF] transition-colors">View Interviews</h3>
              <p className="text-[#79C9C5] text-sm">See all interviews and feedback</p>
            </Link>
          </div>
        </div>

        {/* Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Recent Templates */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Templates</h2>
              <Link href="/templates" className="text-[#79C9C5] hover:text-[#FFE2AF] transition-colors text-sm font-medium">
                View All →
              </Link>
            </div>
            {recentTemplates.length > 0 ? (
              <div className="space-y-4">
                {recentTemplates.map((template: any) => (
                  <Link
                    key={template.id}
                    href={`/templates/${template.id}`}
                    className="block bg-slate-800 rounded-lg p-4 border border-[#3F9AAE]/30 hover:border-[#3F9AAE] hover:shadow-lg hover:shadow-[#3F9AAE]/20 transition-all"
                  >
                    <h3 className="font-bold text-white hover:text-[#FFE2AF] transition-colors mb-1 truncate">{template.name}</h3>
                    {template.description && (
                      <div className="text-[#79C9C5] text-sm line-clamp-2 mb-3">
                        <RichTextDisplay content={template.description} className="text-sm" />
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-[#79C9C5]">
                      <span>📋 {template.sections?.length || 0} sections</span>
                      <span>❓ {template.sections?.reduce((sum: number, s: any) => sum + (s.questions?.length || 0), 0) || 0} questions</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-lg p-8 text-center border border-[#3F9AAE]/30">
                <p className="text-[#79C9C5] mb-4">No templates yet</p>
                <Link
                  href="/templates"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all"
                >
                  <span>Create Template</span>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Interviews */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Interviews</h2>
              <Link href="/interviews" className="text-[#79C9C5] hover:text-[#FFE2AF] transition-colors text-sm font-medium">
                View All →
              </Link>
            </div>
            {recentInterviews.length > 0 ? (
              <div className="space-y-4">
                {recentInterviews.map((interview: any) => (
                  <Link
                    key={interview.id}
                    href={`/interviews/${interview.id}`}
                    className="block bg-slate-800 rounded-lg p-4 border border-[#79C9C5]/30 hover:border-[#79C9C5] hover:shadow-lg hover:shadow-[#79C9C5]/20 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h3 className="font-bold text-white hover:text-[#FFE2AF] transition-colors truncate">{interview.candidateName || 'Unnamed'}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                          interview.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : interview.status === 'in-progress'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {interview.status}
                      </span>
                    </div>
                    <p className="text-[#79C9C5] text-sm mb-2">{interview.template?.name || 'Unknown Template'}</p>
                    <div className="flex items-center space-x-4 text-xs text-[#79C9C5]">
                      <span>🎤 Interview</span>
                      <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-lg p-8 text-center border border-[#79C9C5]/30">
                <p className="text-[#79C9C5] mb-4">No interviews yet</p>
                <Link
                  href="/interviews/new"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#79C9C5]/50 transition-all"
                >
                  <span>Start Interview</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </ProtectedPageWrapper>
  );
}
