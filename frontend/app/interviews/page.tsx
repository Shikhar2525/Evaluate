'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { useAsyncData } from '@/lib/hooks';
import { interviewsAPI } from '@/lib/api';
import Link from 'next/link';
import ProtectedPageWrapper from '@/lib/components/protected-page-wrapper';

export default function InterviewsPage() {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] bg-clip-text text-transparent mb-2">Interview History</h1>
              <p className="text-[#79C9C5]">Track and review all your conducted interviews</p>
            </div>
            <Link
              href="/interviews/new"
              className="inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Interview</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        {Array.isArray(interviews) && interviews.length > 0 && (
          <div className="flex items-center space-x-3 mb-8 overflow-x-auto pb-2">
            {['all', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white shadow-lg shadow-[#3F9AAE]/50'
                    : 'bg-slate-800 border border-[#3F9AAE]/30 text-[#79C9C5] hover:border-[#3F9AAE]'
                }`}
              >
                {status === 'all'
                  ? 'All'
                  : status === 'in_progress'
                    ? 'In Progress'
                    : 'Completed'}
              </button>
            ))}
          </div>
        )}

        {/* Interviews Grid */}
        {filteredInterviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {filteredInterviews.map((interview: any) => (
              <div
                key={interview.id}
                className="bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-[#3F9AAE]/20 transition-all duration-200 border border-[#3F9AAE]/30 overflow-hidden group animate-slide-in backdrop-blur-sm"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 border ${
                          interview.status === 'completed'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : interview.status === 'aborted'
                            ? 'bg-red-500/20 border-red-500/50 text-red-300'
                            : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
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
                      <h3 className="text-lg font-bold text-white group-hover:text-[#FFE2AF] transition-colors">
                        {interview.template.name}
                      </h3>
                    </div>
                  </div>

                  {/* Candidate Info */}
                  <div className="mb-4 pb-4 border-b border-[#3F9AAE]/20">
                    <p className="text-sm font-semibold text-[#79C9C5] mb-1">Candidate</p>
                    <p className="text-white">{interview.candidateName}</p>
                  </div>

                  {/* Date */}
                  <div className="flex items-center space-x-2 text-sm text-[#79C9C5] mb-6">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(interview.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  {/* Questions Progress */}
                  {interview.status === 'in_progress' && interview.interviewQuestions && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-[#79C9C5]">Progress</p>
                        <p className="text-xs font-semibold text-[#79C9C5]">
                          {interview.interviewQuestions.filter((q: any) => q.feedback).length} /{' '}
                          {interview.interviewQuestions.length}
                        </p>
                      </div>
                      <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] h-full transition-all duration-300"
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

                  {/* Stats */}
                  {interview.status === 'completed' && interview.interviewQuestions && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-[#3F9AAE]/20 rounded-lg p-3 text-center border border-[#3F9AAE]/30">
                        <p className="text-2xl font-bold text-[#79C9C5]">{interview.interviewQuestions.length}</p>
                        <p className="text-xs text-[#79C9C5] font-medium">Questions</p>
                      </div>
                      <div className="bg-emerald-500/20 rounded-lg p-3 text-center border border-emerald-500/30">
                        <p className="text-2xl font-bold text-emerald-300">
                          {interview.interviewQuestions.filter((q: any) => q.feedback).length}
                        </p>
                        <p className="text-xs text-emerald-300 font-medium">Rated</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {interview.status === 'in_progress' ? (
                      <>
                        <Link
                          href={`/interviews/${interview.id}/conduct`}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all text-center text-sm"
                        >
                          Continue
                        </Link>
                        <Link
                          href={`/interviews/${interview.id}`}
                          className="px-4 py-2.5 border border-[#3F9AAE]/30 text-[#79C9C5] font-medium rounded-lg hover:bg-[#3F9AAE]/10 hover:border-[#3F9AAE] transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => {
                            setDeleteInterviewId(interview.id);
                            setShowDeleteModal(true);
                          }}
                          className="px-4 py-2.5 border border-red-500/30 text-red-400 font-medium rounded-lg hover:bg-red-500/10 hover:border-red-500 transition-colors"
                          title="Delete Interview"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/interviews/${interview.id}`}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all text-center text-sm"
                        >
                          View Results
                        </Link>
                        <button
                          onClick={() => {
                            setDeleteInterviewId(interview.id);
                            setShowDeleteModal(true);
                          }}
                          className="px-4 py-2.5 border border-red-500/30 text-red-400 font-medium rounded-lg hover:bg-red-500/10 hover:border-red-500 transition-colors"
                          title="Delete Interview"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl shadow-lg p-16 text-center border border-[#3F9AAE]/30">
            <div className="w-16 h-16 rounded-full bg-[#3F9AAE]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#79C9C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 12a5 5 0 1110 0 5 5 0 01-10 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No interviews yet</h3>
            <p className="text-[#79C9C5] mb-8">
              {filterStatus === 'all'
                ? 'Create a new interview to get started'
                : `No ${filterStatus === 'in_progress' ? 'in-progress' : 'completed'} interviews`}
            </p>
            {filterStatus === 'all' && (
              <Link
                href="/interviews/new"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Start Your First Interview</span>
              </Link>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] rounded-xl p-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Want to create a new template?</h3>
              <p className="text-[#FFE2AF]/80">Design custom interview templates to match your evaluation needs</p>
            </div>
            <Link
              href="/templates"
              className="flex items-center space-x-2 px-6 py-3 bg-white text-[#3F9AAE] rounded-lg font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              <span>View Templates</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>

    {/* Delete Confirmation Modal */}
    {showDeleteModal && deleteInterviewId && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-[#3F9AAE]/30 max-w-md w-full p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2H9m3 0h3M7 5a2 2 0 110 4h.01a2 2 0 11.98-2H7zm10 0a2 2 0 110 4h.01a2 2 0 11.98-2h-1.99z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-white text-center mb-2">Delete Interview?</h3>
          
          {(() => {
            const interviewToDelete = interviews?.find((i: any) => i.id === deleteInterviewId);
            return (
              <>
                <p className="text-[#79C9C5] text-center mb-4 text-sm">
                  Are you sure you want to delete the interview for <span className="font-semibold text-white">{interviewToDelete?.candidateName}</span>? This action cannot be undone.
                </p>
                <p className="text-slate-400 text-center text-xs mb-6">
                  Template: {interviewToDelete?.template.name}
                </p>
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
              className="flex-1 px-4 py-2.5 border border-[#3F9AAE]/30 text-[#79C9C5] font-medium rounded-lg hover:bg-[#3F9AAE]/10 hover:border-[#3F9AAE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteInterview}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
