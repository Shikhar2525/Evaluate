'use client';

import { useEffect, useState, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { useAsyncData } from '@/lib/hooks';
import { interviewsAPI } from '@/lib/api';
import Link from 'next/link';
import ProtectedPageWrapper from '@/lib/components/protected-page-wrapper';
import Loader from '@/lib/components/loader';

export default function InterviewsPage() {
  useLayoutEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);

  const { user } = useAuth();
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInterviewId, setDeleteInterviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: interviews, refetch } = useAsyncData<any[]>(
    () => interviewsAPI.list(),
    [user],
  );

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, router]);

  const filteredInterviews = (interviews || [])
    .filter((interview: any) =>
        filterStatus === 'all' ? true : interview.status === filterStatus,
      );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 badge-emerald';
      case 'in_progress':
        return 'bg-amber-50 border-amber-200 text-amber-700 badge-amber';
      case 'aborted':
        return 'bg-red-50 border-red-200 text-red-700 badge-red';
      default:
        return 'bg-neutral-50 border-neutral-200 text-neutral-700 badge-neutral';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'aborted':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleDeleteInterview = async () => {
    if (!deleteInterviewId) return;
    
    setIsDeleting(true);
    try {
      await interviewsAPI.delete(deleteInterviewId);
      setShowDeleteModal(false);
      setDeleteInterviewId(null);
      await refetch();
    } catch (error) {
      console.error('Failed to delete interview:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return <Loader message="Loading interviews..." fullScreen />;
  }

  if (!interviews) {
    return <Loader message="Loading interviews..." fullScreen />;
  }

  return (
    <ProtectedPageWrapper>
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen overflow-hidden">
        {/* Premium animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-500/15 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/25 to-purple-500/15 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Page Header - Premium Section */}
        <div className="relative z-10 border-b border-white/5 bg-gradient-to-b from-white/8 via-white/2 to-transparent backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 group-hover:shadow-blue-500/60 transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Management</span>
                    <span className="block text-sm font-semibold text-white">Interview History</span>
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
                  Your <br/>
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Interviews
                  </span>
                </h1>
                <p className="text-slate-400 text-lg font-light">Track and review all your conducted interviews</p>
              </div>
              
              <Link
                href="/interviews/new"
                className="group relative w-fit"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/50 via-blue-400/50 to-purple-400/50 rounded-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                <div className="relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold rounded-xl shadow-2xl shadow-blue-500/40 group-hover:shadow-blue-500/60 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Interview</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-20">
          {/* Filters - Premium */}
          {Array.isArray(interviews) && interviews.length > 0 && (
            <div className="mb-12 overflow-x-auto pb-3">
              <div className="flex items-center gap-3 min-w-max">
                {['all', 'in_progress', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      filterStatus === status
                        ? 'bg-gradient-to-r from-cyan-400/30 via-blue-400/30 to-purple-400/30 text-white border border-white/20 shadow-lg shadow-blue-500/20'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {status === 'all'
                      ? 'All Interviews'
                      : status === 'in_progress'
                        ? 'In Progress'
                        : 'Completed'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interviews Grid */}
          {filteredInterviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {filteredInterviews.map((interview: any) => (
                <div
                  key={interview.id}
                  className="group relative"
                >
                  {/* Animated gradient border */}
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-400/30 via-transparent to-purple-400/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  
                  <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all group-hover:from-white/12 group-hover:to-white/6 shadow-lg flex flex-col h-full">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-full group-hover:translate-x-0 duration-500"></div>

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 ${
                          interview.status === 'completed'
                            ? 'bg-gradient-to-r from-green-500/20 to-green-400/10 text-green-300'
                            : interview.status === 'aborted'
                            ? 'bg-gradient-to-r from-red-500/20 to-red-400/10 text-red-300'
                            : 'bg-gradient-to-r from-blue-500/20 to-blue-400/10 text-blue-300'
                        }`}>
                          {getStatusIcon(interview.status)}
                          <span>
                            {interview.status === 'completed'
                              ? 'Completed'
                              : interview.status === 'aborted'
                              ? 'Aborted'
                              : 'In Progress'}
                          </span>
                        </div>
                      </div>

                      {/* Template Name */}
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {interview.template?.name || interview.templateName || 'Unnamed Template'}
                      </h3>

                      {/* Candidate Info */}
                      <div className="mb-4 pb-4 border-b border-white/10">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Candidate</p>
                        <p className="text-white font-semibold">{interview.candidateName}</p>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(interview.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>

                      {/* Progress or Stats */}
                      {interview.status === 'in_progress' && interview.interviewQuestions && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-400">Progress</p>
                            <p className="text-xs font-semibold text-cyan-300">
                              {interview.interviewQuestions.filter((q: any) => q.feedback).length} / {interview.interviewQuestions.length}
                            </p>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 h-full transition-all duration-300"
                              style={{
                                width: `${
                                  (interview.interviewQuestions.filter((q: any) => q.feedback).length /
                                    interview.interviewQuestions.length) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {interview.status === 'completed' && interview.interviewQuestions && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                            <p className="text-2xl font-black text-white">{interview.interviewQuestions.length}</p>
                            <p className="text-xs text-slate-400 font-medium mt-1">Questions</p>
                          </div>
                          <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/20">
                            <p className="text-2xl font-black text-green-300">
                              {interview.interviewQuestions.filter((q: any) => q.feedback).length}
                            </p>
                            <p className="text-xs text-green-300 font-medium mt-1">Rated</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-auto grid grid-cols-2 gap-2">
                        {interview.status === 'in_progress' ? (
                          <>
                            <Link
                              href={`/interviews/${interview.id}/conduct`}
                              className="px-4 py-3 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/40 transition-all text-center text-sm"
                            >
                              Continue Interview
                            </Link>
                            <button
                              onClick={() => {
                                setDeleteInterviewId(interview.id);
                                setShowDeleteModal(true);
                              }}
                              className="px-4 py-3 border border-red-500/30 text-red-400 font-bold rounded-lg hover:bg-red-500/10 hover:border-red-500/50 transition-all text-sm flex items-center justify-center gap-1"
                              title="Delete Interview"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            {interview.status === 'completed' && (
                              <Link
                                href={`/interviews/${interview.id}`}
                                className="px-4 py-3 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/40 transition-all text-center text-sm"
                              >
                                View Results
                              </Link>
                            )}
                            {interview.status === 'aborted' && (
                              <Link
                                href={`/interviews/${interview.id}/conduct`}
                                className="px-4 py-3 bg-gradient-to-r from-orange-400 to-red-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-orange-500/40 transition-all text-center text-sm flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Resume
                              </Link>
                            )}
                            <button
                              onClick={() => {
                                setDeleteInterviewId(interview.id);
                                setShowDeleteModal(true);
                              }}
                              className="px-4 py-3 border border-red-500/30 text-red-400 font-bold rounded-lg hover:bg-red-500/10 hover:border-red-500/50 transition-all text-sm flex items-center justify-center gap-1"
                              title="Delete Interview"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg rounded-2xl"></div>
              <div className="relative p-12 text-center rounded-2xl bg-gradient-to-br from-white/5 to-white/2 border-2 border-dashed border-white/20 group-hover:border-white/40 transition-all">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-400/10 flex items-center justify-center mx-auto mb-4 text-blue-400 text-2xl">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
                  </svg>
                </div>
                <p className="text-slate-300 font-light mb-2 text-lg">No interviews yet</p>
                <p className="text-slate-400 font-light mb-6">
                  {filterStatus === 'all'
                    ? 'Create a new interview to get started'
                    : `No ${filterStatus === 'in_progress' ? 'in-progress' : 'completed'} interviews`}
                </p>
                {filterStatus === 'all' && (
                  <Link
                    href="/interviews/new"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Start Your First Interview
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Premium CTA Section */}
          {Array.isArray(interviews) && interviews.length > 0 && (
            <div className="mt-16 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/40 via-blue-400/40 to-purple-400/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              <div className="relative bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl p-8 border border-white/20 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Want to create a new template?</h3>
                    <p className="text-slate-300 font-light">Design custom interview templates to match your evaluation needs</p>
                  </div>
                  <Link
                    href="/templates"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition-all whitespace-nowrap shadow-lg hover:shadow-2xl"
                  >
                    <span>View Templates</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

    {/* Delete Confirmation Modal */}
    {showDeleteModal && deleteInterviewId && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 rounded-2xl shadow-2xl border border-white/15 max-w-md w-full p-8 backdrop-blur-xl">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-400/10 rounded-full mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-white text-center mb-3">Delete Interview?</h3>
          
          {(() => {
            const interviewToDelete = interviews?.find((i: any) => i.id === deleteInterviewId);
            return (
              <>
                <p className="text-slate-300 text-center mb-4 text-sm font-light">
                  Are you sure you want to delete the interview for <span className="font-semibold text-white">{interviewToDelete?.candidateName}</span>? This action cannot be undone.
                </p>
                {interviewToDelete?.template && (
                  <p className="text-slate-400 text-center text-xs mb-6">
                    Template: {interviewToDelete.template.name}
                  </p>
                )}
                {!interviewToDelete?.template && interviewToDelete?.templateName && (
                  <p className="text-slate-400 text-center text-xs mb-6">
                    Template: {interviewToDelete.templateName}
                  </p>
                )}
              </>
            );
          })()}
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteInterviewId(null);
              }}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/5 hover:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteInterview}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-red-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete Interview'
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </ProtectedPageWrapper>
  );
}
