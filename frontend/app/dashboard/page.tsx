'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Metadata } from 'next';
import { useAuth } from '@/lib/hooks';
import { useAsyncData } from '@/lib/hooks';
import { templatesAPI, interviewsAPI, objectToArray } from '@/lib/api';
import Link from 'next/link';
import ProtectedPageWrapper from '@/lib/components/protected-page-wrapper';
import RichTextDisplay from '@/lib/components/rich-text-display';
import Loader from '@/lib/components/loader';

export default function DashboardPage() {
  useLayoutEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);

  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: templates } = useAsyncData<any[]>(
    () => templatesAPI.list(),
    [user?.id],
  );
  const { data: interviews } = useAsyncData<any[]>(
    () => interviewsAPI.list(),
    [user?.id],
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

  const isLoading = false;

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

  if (isLoading) {
    return (
      <ProtectedPageWrapper>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <Loader message="Loading dashboard..." />
        </div>
      </ProtectedPageWrapper>
    );
  }

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
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen overflow-hidden">
        {/* Premium animated background with blob animations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-500/15 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/25 to-purple-500/15 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-32 right-1/2 w-80 h-80 bg-gradient-to-br from-purple-500/15 to-pink-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Premium Page Header */}
        <div className="relative z-10 border-b border-white/5 bg-gradient-to-b from-white/8 via-white/2 to-transparent backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 group-hover:shadow-blue-500/60 transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Welcome to</span>
                    <span className="block text-sm font-semibold text-white">Interview Hub</span>
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
                  Welcome back, <br/>
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : user?.email?.split('@')[0]}
                  </span>
                </h1>
                <p className="text-slate-400 text-lg font-light">Manage your interviews with precision and ease</p>
              </div>
              
              {/* Premium Stats Card */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <div className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">{totalTemplates}</div>
                      <p className="text-xs text-slate-400 font-semibold mt-2 uppercase tracking-wider">Templates</p>
                    </div>
                    <div className="h-16 w-px bg-gradient-to-b from-white/0 via-white/20 to-white/0 mx-4"></div>
                    <div className="flex-1 text-center">
                      <div className="text-3xl font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text">{totalInterviews}</div>
                      <p className="text-xs text-slate-400 font-semibold mt-2 uppercase tracking-wider">Interviews</p>
                    </div>
                    <div className="h-16 w-px bg-gradient-to-b from-white/0 via-white/20 to-white/0 mx-4"></div>
                    <div className="flex-1 text-center">
                      <div className="text-3xl font-black text-transparent bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text">{completedInterviews}</div>
                      <p className="text-xs text-slate-400 font-semibold mt-2 uppercase tracking-wider">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-20">
          {/* Premium Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative"
              >
                {/* Animated gradient border */}
                <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-400/30 via-transparent to-purple-400/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                
                <div className="relative overflow-hidden rounded-2xl p-7 bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all duration-300 group-hover:from-white/15 group-hover:to-white/8 shadow-xl">
                  {/* Premium shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-full group-hover:translate-x-0 duration-500"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-5xl font-black text-white mt-4 group-hover:text-cyan-300 transition-colors">{stat.value}</p>
                      </div>
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} text-white text-2xl shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all transform`}>
                        {stat.icon}
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/10 text-xs text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                      {stat.label === 'Completed' && `${Math.round((completedInterviews / totalInterviews) * 100) || 0}% completion rate`}
                      {stat.label === 'Pending' && `${pendingInterviews} pending`}
                      {stat.label === 'Total Templates' && 'Ready to use'}
                      {stat.label === 'Total Interviews' && 'In your system'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions - Premium */}
          <div className="mb-20">
            <div className="mb-10">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Get Started</span>
              <h2 className="text-4xl font-black text-white mt-2 mb-2">Quick Actions</h2>
              <p className="text-slate-400 font-light">Jump right into your next task</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  href: '/templates',
                  title: 'Create Template',
                  description: 'Design a new interview template',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  ),
                  gradient: 'from-cyan-400 to-cyan-600',
                  glowColor: 'shadow-cyan-500/40',
                },
                {
                  href: '/interviews/new',
                  title: 'Start Interview',
                  description: 'Conduct a new interview session',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
                    </svg>
                  ),
                  gradient: 'from-blue-400 to-blue-600',
                  glowColor: 'shadow-blue-500/40',
                },
                {
                  href: '/interviews',
                  title: 'View Interviews',
                  description: 'Review interviews and feedback',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  ),
                  gradient: 'from-purple-400 to-purple-600',
                  glowColor: 'shadow-purple-500/40',
                },
              ].map((action, idx) => (
                <Link
                  key={idx}
                  href={action.href}
                  className="group relative overflow-hidden"
                >
                  {/* Animated gradient border */}
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm rounded-2xl"></div>

                  <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-xl hover:border-white/30 transition-all duration-300 group-hover:from-white/15 group-hover:to-white/8 shadow-xl">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-full group-hover:translate-x-0 duration-500"></div>

                    <div className="relative z-10">
                      <div className={`inline-flex items-center justify-center p-4 rounded-xl bg-gradient-to-br ${action.gradient} text-white text-2xl shadow-xl shadow-${action.glowColor.split('-')[1]}-500/40 group-hover:shadow-2xl group-hover:scale-110 transition-all transform mb-6`}>
                        {action.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">{action.title}</h3>
                      <p className="text-slate-400 text-base font-light group-hover:text-slate-300 transition-colors mb-6">{action.description}</p>
                      
                      {/* Arrow indicator */}
                      <div className="flex items-center text-cyan-400 text-sm font-semibold">
                        <span>Get Started</span>
                        <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Items - Premium Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Recent Templates */}
            <div>
              <div className="mb-8">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Your Work</span>
                <h2 className="text-3xl font-black text-white mt-2 mb-2">Recent Templates</h2>
                <p className="text-slate-400 font-light">{totalTemplates} templates total</p>
              </div>
              {recentTemplates.length > 0 ? (
                <div className="space-y-4">
                  {recentTemplates.map((template: any) => (
                    <Link
                      key={template.id}
                      href={`/templates/${template.id}`}
                      className="group block relative overflow-hidden"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm rounded-xl"></div>
                      
                      <div className="relative p-6 rounded-xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all group-hover:from-white/12 group-hover:to-white/6 shadow-lg">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors truncate flex-1">{template.name}</h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-300 text-xs font-bold whitespace-nowrap">✓ Template</span>
                        </div>
                        {template.description && (
                          <div className="text-slate-400 text-sm line-clamp-2 mb-4 font-light">
                            <RichTextDisplay content={template.description} className="text-sm text-slate-400" />
                          </div>
                        )}
                        <div className="flex items-center gap-5 text-xs text-slate-500 group-hover:text-slate-400 transition-colors font-medium">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 012-2h6a2 2 0 012 2v2h2a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2V3z"/></svg>
                            {objectToArray(template.sections)?.length || 0} sections
                          </span>
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 3.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM9 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/></svg>
                            {objectToArray(template.sections)?.reduce((sum: number, s: any) => sum + (objectToArray(s.questions)?.length || 0), 0) || 0} questions
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg rounded-2xl"></div>
                  <div className="relative p-10 text-center rounded-2xl bg-gradient-to-br from-white/5 to-white/2 border-2 border-dashed border-white/20 group-hover:border-white/40 transition-all">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-400/10 flex items-center justify-center mx-auto mb-4 text-cyan-400 text-2xl">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-slate-400 font-light mb-5">No templates created yet</p>
                    <Link
                      href="/templates"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-400 to-cyan-600 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-cyan-500/40 hover:scale-105 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Create First Template
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Interviews */}
            <div>
              <div className="mb-8">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Activity</span>
                <h2 className="text-3xl font-black text-white mt-2 mb-2">Recent Interviews</h2>
                <p className="text-slate-400 font-light">{totalInterviews} interviews total</p>
              </div>
              {recentInterviews.length > 0 ? (
                <div className="space-y-4">
                  {recentInterviews.map((interview: any) => (
                    <Link
                      key={interview.id}
                      href={`/interviews/${interview.id}`}
                      className="group block relative overflow-hidden"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm rounded-xl"></div>
                      
                      <div className="relative p-6 rounded-xl bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all group-hover:from-white/12 group-hover:to-white/6 shadow-lg">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors truncate flex-1">{interview.candidateName || 'Unnamed Candidate'}</h3>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                              interview.status === 'completed'
                                ? 'bg-gradient-to-r from-green-500/20 to-green-400/10 text-green-300'
                                : interview.status === 'in-progress'
                                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-400/10 text-blue-300'
                                  : 'bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 text-yellow-300'
                            }`}
                          >
                            {interview.status === 'completed' && '✓'} {interview.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm font-light mb-4">{interview.template?.name || 'Unknown Template'}</p>
                        <div className="flex items-center gap-5 text-xs text-slate-500 group-hover:text-slate-400 transition-colors font-medium">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
                            Interview
                          </span>
                          <span>{new Date(interview.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg rounded-2xl"></div>
                  <div className="relative p-10 text-center rounded-2xl bg-gradient-to-br from-white/5 to-white/2 border-2 border-dashed border-white/20 group-hover:border-white/40 transition-all">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-400/10 flex items-center justify-center mx-auto mb-4 text-blue-400 text-2xl">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
                      </svg>
                    </div>
                    <p className="text-slate-400 font-light mb-5">No interviews conducted yet</p>
                    <Link
                      href="/interviews/new"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
                      </svg>
                      Start First Interview
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedPageWrapper>
  );
}
