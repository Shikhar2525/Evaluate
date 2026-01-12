'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { interviewsAPI } from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';

export default function InterviewDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [overallNotes, setOverallNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [filterTab, setFilterTab] = useState<'all' | 'answered' | 'skipped'>('all');

  useEffect(() => {
    if (!user || !interviewId) return;

    const fetchInterview = async () => {
      try {
        const response = await interviewsAPI.get(interviewId);
        setInterview(response.data);
        setOverallNotes(response.data.overallNotes || '');
        setLoading(false);
      } catch {
        router.push('/interviews');
      }
    };

    fetchInterview();
  }, [user, interviewId, router]);

  const handleSaveNotes = async () => {
    try {
      await interviewsAPI.updateOverallNotes(interviewId, overallNotes);
      setEditingNotes(false);
      const response = await interviewsAPI.get(interviewId);
      setInterview(response.data);
    } catch (err) {
      console.error('Failed to save notes');
    }
  };

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!interview) {
    return <div className="text-center py-12">Interview not found</div>;
  }

  const sortedQuestions = interview.questions ? [...interview.questions].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : [];
  
  const completedQuestions = sortedQuestions?.filter((q: any) => !q.skipped) || [];
  const skippedQuestions = sortedQuestions?.filter((q: any) => q.skipped) || [];
  const ratedQuestions = sortedQuestions?.filter((q: any) => q.feedback?.rating) || [];
  const averageRating =
    ratedQuestions.length > 0
      ? (ratedQuestions.reduce((sum: number, q: any) => sum + (q.feedback?.rating || 0), 0) /
          ratedQuestions.length).toFixed(1)
      : '0';

  const filteredQuestions = sortedQuestions.filter((q: any) => {
    if (filterTab === 'answered') return !q.skipped;
    if (filterTab === 'skipped') return q.skipped;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#3F9AAE]/20 bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link href="/interviews" className="text-[#79C9C5] hover:text-[#FFE2AF] mb-2 inline-flex items-center gap-1 font-medium transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Interviews
            </Link>
            <h1 className="text-3xl font-black text-white">
              {interview.template?.name}
            </h1>
            {interview.candidateName && (
              <p className="text-[#79C9C5] font-medium mt-1">Candidate: {interview.candidateName}</p>
            )}
          </div>
          <span
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${
              interview.status === 'completed' 
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300' 
                : interview.status === 'aborted'
                ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                : 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
            }`}
          >
            {interview.status === 'completed' ? '✓ Completed' : interview.status === 'aborted' ? '✗ Aborted' : '⏳ In Progress'}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-gradient-to-br from-[#3F9AAE]/20 to-transparent rounded-xl border border-[#3F9AAE]/30 p-6">
            <p className="text-[#79C9C5]/70 text-xs font-bold tracking-wider">TOTAL QUESTIONS</p>
            <p className="text-4xl font-black text-white mt-3">{sortedQuestions?.length || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-transparent rounded-xl border border-emerald-500/30 p-6">
            <p className="text-emerald-300/70 text-xs font-bold tracking-wider">ANSWERED</p>
            <p className="text-4xl font-black text-emerald-400 mt-3">{completedQuestions.length}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-transparent rounded-xl border border-amber-500/30 p-6">
            <p className="text-amber-300/70 text-xs font-bold tracking-wider">SKIPPED</p>
            <p className="text-4xl font-black text-amber-400 mt-3">{skippedQuestions.length}</p>
          </div>
          <div className="bg-gradient-to-br from-[#FFE2AF]/20 to-transparent rounded-xl border border-[#FFE2AF]/30 p-6">
            <p className="text-[#FFE2AF]/70 text-xs font-bold tracking-wider">AVG RATING</p>
            <p className="text-4xl font-black text-[#FFE2AF] mt-3">{averageRating}<span className="text-lg">/5</span></p>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-slate-800/50 rounded-xl border border-[#3F9AAE]/20 p-4 mb-10 text-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <p className="text-[#79C9C5]/60 text-xs font-bold tracking-wider">CREATED</p>
              <p className="text-white font-medium">{format(new Date(interview.createdAt), 'MMM d, yyyy • HH:mm')}</p>
            </div>
            <div>
              <p className="text-[#79C9C5]/60 text-xs font-bold tracking-wider">TIME AGO</p>
              <p className="text-white font-medium">{formatDistanceToNow(new Date(interview.createdAt), { addSuffix: true })}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 border-b border-[#3F9AAE]/20 pb-4">
          {[
            { key: 'all', label: 'All Questions', count: sortedQuestions.length },
            { key: 'answered', label: 'Answered', count: completedQuestions.length },
            { key: 'skipped', label: 'Skipped', count: skippedQuestions.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filterTab === tab.key
                  ? 'bg-[#3F9AAE] text-white shadow-lg shadow-[#3F9AAE]/50'
                  : 'bg-slate-800/50 text-[#79C9C5] border border-[#3F9AAE]/30 hover:bg-slate-800'
              }`}
            >
              {tab.label} <span className="ml-2 font-black">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Questions List */}
        <div className="space-y-3 mb-10">
          {filteredQuestions?.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-[#3F9AAE]/20">
              <p className="text-slate-400">No questions found</p>
            </div>
          ) : (
            filteredQuestions?.map((iq: any, index: number) => {
              const isExpanded = expandedQuestions.has(iq.id);
              const getRatingColor = (rating: number) => {
                if (rating >= 4) return 'text-emerald-400';
                if (rating >= 3) return 'text-yellow-400';
                if (rating >= 2) return 'text-amber-400';
                return 'text-red-400';
              };

              return (
                <div key={iq.id} className="group">
                  <button
                    onClick={() => toggleQuestion(iq.id)}
                    className="w-full bg-gradient-to-r from-slate-800/50 to-slate-800/30 hover:from-slate-800 hover:to-slate-800/50 border border-[#3F9AAE]/20 hover:border-[#3F9AAE]/50 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#3F9AAE]/20 text-[#79C9C5] font-bold text-sm flex-shrink-0">
                            {sortedQuestions.indexOf(iq) + 1}
                          </span>
                          <h3 className="text-base font-semibold text-white group-hover:text-[#79C9C5] transition-colors line-clamp-2">
                            {iq.question?.text}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 ml-11">
                          {iq.question?.difficulty && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F96E5B]/20 text-[#F96E5B] border border-[#F96E5B]/30">
                              {iq.question.difficulty.toUpperCase()}
                            </span>
                          )}
                          {iq.skipped && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              SKIPPED
                            </span>
                          )}
                          {!iq.skipped && iq.feedback?.rating && (
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${getRatingColor(iq.feedback.rating)} bg-opacity-20`}>
                              ★ {iq.feedback.rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-[#79C9C5] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="bg-slate-800/40 border-x border-b border-[#3F9AAE]/20 rounded-b-lg p-6 space-y-6 animate-in fade-in duration-200">
                      {/* Code Snippet */}
                      {iq.question?.codeSnippet && (
                        <div>
                          <p className="text-xs font-bold text-[#79C9C5]/70 tracking-wider mb-3">CODE SNIPPET</p>
                          <div className="bg-slate-950 rounded-lg border border-[#3F9AAE]/20 p-4 overflow-x-auto">
                            <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                              {iq.question.codeSnippet}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Feedback Section */}
                      {!iq.skipped ? (
                        iq.feedback ? (
                          <div className="space-y-4">
                            {/* Rating */}
                            {iq.feedback.rating && (
                              <div className="bg-gradient-to-r from-[#3F9AAE]/20 to-transparent rounded-lg border border-[#3F9AAE]/30 p-4">
                                <p className="text-xs font-bold text-[#79C9C5]/70 tracking-wider mb-3">PERFORMANCE RATING</p>
                                <div className="flex items-center gap-4">
                                  <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <span
                                        key={i}
                                        className={`text-2xl ${
                                          i < Math.round(iq.feedback.rating)
                                            ? 'text-[#FFE2AF]'
                                            : 'text-slate-700'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  <span className="text-xl font-bold text-white">{iq.feedback.rating}/5</span>
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {iq.feedback.notes && (
                              <div className="bg-slate-900/50 rounded-lg border border-[#79C9C5]/20 p-4">
                                <p className="text-xs font-bold text-[#79C9C5]/70 tracking-wider mb-3">INTERVIEWER NOTES</p>
                                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm">
                                  {iq.feedback.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-slate-900/30 rounded-lg border border-slate-700/50">
                            <p className="text-slate-400 text-sm italic">No feedback recorded for this question</p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-6 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <p className="text-amber-300 text-sm font-semibold">This question was skipped</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-between mt-12">
          <Link
            href="/interviews"
            className="px-6 py-3 border border-[#3F9AAE]/30 text-[#79C9C5] rounded-lg hover:bg-[#3F9AAE]/10 hover:border-[#3F9AAE] font-semibold transition-all inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Interviews
          </Link>
          {interview.status === 'in_progress' && (
            <Link
              href={`/interviews/${interviewId}/conduct`}
              className="px-6 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 font-semibold transition-all inline-flex items-center gap-2"
            >
              Continue Interview
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

