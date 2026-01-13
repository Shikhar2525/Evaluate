'use client';

import { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { interviewsAPI } from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import Loader from '@/lib/components/loader';

// Defined interfaces to fix 'any' related potential crashes
interface Question {
  id: string;
  text: string;
  order?: number;
  difficulty?: string;
  skipped?: boolean;
  codeSnippet?: string;
  sectionId: string;
  feedback?: {
    rating?: number;
    notes?: string;
  };
}

interface Section {
  id: string;
  name?: string;
  title?: string;
  sectionName?: string;
  description?: string;
  instructions?: string;
  questions: Record<string, Question>;
}

export default function InterviewDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;
  
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [filterTab, setFilterTab] = useState<'all' | 'rated' | 'skipped'>('rated');

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user || !interviewId) return;

    const fetchInterview = async () => {
      try {
        const response = await interviewsAPI.get(interviewId);
        if (!response.data) throw new Error('No data');
        setInterview(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        router.push('/interviews');
      }
    };

    fetchInterview();
  }, [user, interviewId, router]);

  // toggleQuestion helper - only one accordion open at a time
  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.clear();
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  // Memoize calculations for performance and to prevent unnecessary re-renders
  const { sortedQuestions, ratedQuestions, skippedQuestions, averageRating, groupedQuestions, sectionMap } = useMemo(() => {
    const questions: Question[] = [];
    const secMap = new Map<string, Section>();

    if (interview?.sections) {
      Object.values(interview.sections as Record<string, Section>).forEach((section) => {
        secMap.set(section.id, section);
        if (section.questions) {
          Object.values(section.questions).forEach((q) => {
            questions.push({ ...q, sectionId: section.id });
          });
        }
      });
    }

    const sorted = questions.sort((a, b) => (a.order || 0) - (b.order || 0));
    const rated = sorted.filter((q) => q.feedback?.rating && !q.skipped);
    const notRated = sorted.filter((q) => !q.feedback?.rating || q.skipped);
    const skipped = sorted.filter((q) => q.skipped || !q.feedback?.rating);
    const avg = rated.length > 0 
      ? (rated.reduce((sum, q) => sum + (q.feedback?.rating || 0), 0) / rated.length).toFixed(1) 
      : '0';

    const filtered = sorted.filter((q) => {
      if (filterTab === 'rated') return q.feedback?.rating && !q.skipped;
      if (filterTab === 'skipped') return !q.feedback?.rating || q.skipped;
      return true;
    });

    const grouped = filtered.reduce((acc, q) => {
      if (!acc[q.sectionId]) acc[q.sectionId] = [];
      acc[q.sectionId].push(q);
      return acc;
    }, {} as Record<string, Question[]>);

    return { sortedQuestions: sorted, ratedQuestions: rated, skippedQuestions: skipped, averageRating: avg, groupedQuestions: grouped, sectionMap: secMap };
  }, [interview, filterTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader message="Loading interview..." />
      </div>
    );
  }

  if (!interview) return <div className="text-center py-12 text-[#79C9C5]">Interview not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="sticky top-0 z-50 border-b border-[#3F9AAE]/20 bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link href="/interviews" className="text-[#79C9C5] hover:text-[#FFE2AF] mb-2 inline-flex items-center gap-1 font-medium transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Interviews
            </Link>
            <h1 className="text-3xl font-black text-white">{interview.template?.name || 'Interview Details'}</h1>
            {interview.candidateName && <p className="text-[#79C9C5] font-medium mt-1">Candidate: {interview.candidateName}</p>}
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
            interview.status === 'completed' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300' : 
            interview.status === 'aborted' ? 'bg-red-500/20 border border-red-500/50 text-red-300' : 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
          }`}>
            {interview.status === 'completed' ? '✓ Completed' : interview.status === 'aborted' ? '✗ Aborted' : '⏳ In Progress'}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-gradient-to-br from-[#3F9AAE]/20 to-transparent rounded-xl border border-[#3F9AAE]/30 p-6">
            <p className="text-[#79C9C5]/70 text-xs font-bold tracking-wider">TOTAL QUESTIONS</p>
            <p className="text-4xl font-black text-white mt-3">{sortedQuestions.length}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-transparent rounded-xl border border-emerald-500/30 p-6">
            <p className="text-emerald-300/70 text-xs font-bold tracking-wider">RATED</p>
            <p className="text-4xl font-black text-emerald-400 mt-3">{ratedQuestions.length}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-transparent rounded-xl border border-red-500/30 p-6">
            <p className="text-red-300/70 text-xs font-bold tracking-wider">SKIPPED</p>
            <p className="text-4xl font-black text-red-400 mt-3">{skippedQuestions.length}</p>
          </div>
          <div className="bg-gradient-to-br from-[#FFE2AF]/20 to-transparent rounded-xl border border-[#FFE2AF]/30 p-6">
            <p className="text-[#FFE2AF]/70 text-xs font-bold tracking-wider">AVG RATING</p>
            <p className="text-4xl font-black text-[#FFE2AF] mt-3">{averageRating}<span className="text-lg">/5</span></p>
          </div>
        </div>

        {interview.createdAt && (
          <div className="bg-slate-800/50 rounded-xl border border-[#3F9AAE]/20 p-4 mb-10 text-sm flex gap-4">
            <div>
              <p className="text-[#79C9C5]/60 text-xs font-bold tracking-wider">CREATED</p>
              <p className="text-white font-medium">{format(new Date(interview.createdAt), 'MMM d, yyyy • HH:mm')}</p>
            </div>
            <div>
              <p className="text-[#79C9C5]/60 text-xs font-bold tracking-wider">TIME AGO</p>
              <p className="text-white font-medium">{formatDistanceToNow(new Date(interview.createdAt), { addSuffix: true })}</p>
            </div>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-8 border-b border-[#3F9AAE]/20 pb-4">
          {['all', 'rated', 'skipped'].map((key) => (
            <button
              key={key}
              onClick={() => setFilterTab(key as any)}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filterTab === key ? 'bg-[#3F9AAE] text-white shadow-lg' : 'bg-slate-800/50 text-[#79C9C5] border border-[#3F9AAE]/30'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)} ({key === 'all' ? sortedQuestions.length : key === 'rated' ? ratedQuestions.length : skippedQuestions.length})
            </button>
          ))}
        </div>

        {/* Sections Mapping */}
        {Object.entries(groupedQuestions).map(([sectionId, questions]) => {
          const section = sectionMap.get(sectionId);
          const sectionName = section?.name || section?.title || section?.sectionName || `Section ${sectionId.slice(0, 8)}`;
          const sectionDescription = section?.description || section?.instructions || '';
          const sectionRatedCount = questions.filter((q) => q.feedback?.rating && !q.skipped).length;
          const sectionSkippedCount = questions.filter((q) => !q.feedback?.rating || q.skipped).length;

          return (
            <div key={sectionId} className="mb-12">
              {/* Section Header with Enhanced Design */}
              <div className="bg-gradient-to-r from-[#3F9AAE]/30 via-[#3F9AAE]/15 to-transparent rounded-xl border-l-4 border-l-[#3F9AAE] border border-[#3F9AAE]/40 p-6 mb-6 shadow-lg shadow-[#3F9AAE]/10">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#3F9AAE]/40 text-[#79C9C5] font-bold flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-white mb-1">{sectionName}</h2>
                    {sectionDescription && (
                      <p className="text-[#79C9C5]/70 text-sm leading-relaxed mb-3">{sectionDescription}</p>
                    )}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-[#3F9AAE]/30 text-[#79C9C5] text-xs font-bold">
                        {questions.length} Questions
                      </span>
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        {sectionRatedCount} Rated
                      </span>
                      {sectionSkippedCount > 0 && (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold">
                          {sectionSkippedCount} Skipped
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions Container */}
              <div className="relative pl-6 ml-2 border-l-2 border-[#3F9AAE]/30 space-y-4">
                {/* Connecting dot */}
                <div className="absolute -left-4 top-4 w-3 h-3 rounded-full bg-[#3F9AAE] border-2 border-slate-900"></div>

                {questions.map((iq) => {
                  const isExpanded = expandedQuestions.has(iq.id);
                  const hasNotes = iq.feedback?.notes;
                  const hasCodeSnippet = iq.codeSnippet;
                  const isSkipped = iq.skipped;
                  const isUnrated = !iq.feedback?.rating && !isSkipped;
                  const isNotRated = isSkipped || isUnrated;
                  const hasContent = (hasNotes || hasCodeSnippet) && !isNotRated;
                  const canExpand = hasContent;

                  // Debug: log question structure
                  if (!hasCodeSnippet && iq.id) {
                    console.log('Question:', iq.id, {
                      text: iq.text,
                      codeSnippet: iq.codeSnippet,
                      feedback: iq.feedback,
                      allKeys: Object.keys(iq)
                    });
                  }

                  return (
                    <div key={iq.id} className="group">
                      <button
                        onClick={() => canExpand && toggleQuestion(iq.id)}
                        className={`w-full bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-2 rounded-lg p-4 text-left transition-all ${
                          isNotRated
                            ? 'opacity-50 border-red-500/40 cursor-not-allowed'
                            : canExpand
                            ? 'border-[#3F9AAE]/40 hover:border-[#3F9AAE]/70 hover:from-slate-800 hover:to-slate-800/50 cursor-pointer'
                            : 'border-slate-700/40 cursor-default'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h3 className={`font-semibold group-hover:transition-colors ${
                              isNotRated ? 'text-slate-400 line-through' : 'text-white group-hover:text-[#79C9C5]'
                            }`}>
                              {iq.text}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              {iq.difficulty && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F96E5B]/20 text-[#F96E5B] border border-[#F96E5B]/30">
                                  {iq.difficulty.toUpperCase()}
                                </span>
                              )}
                              {isNotRated && (
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                                  isSkipped 
                                    ? 'bg-red-500/30 text-red-300 border-red-500/40' 
                                    : 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                                }`}>
                                  {isSkipped ? '✕ SKIPPED' : '⊘ NOT RATED'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {iq.feedback?.rating && !isNotRated && (
                              <span className="text-[#FFE2AF] text-sm font-bold">★ {iq.feedback.rating}/5</span>
                            )}
                            {canExpand && (
                              <svg className={`w-5 h-5 text-[#79C9C5] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Skipped Indicator */}
                      {isSkipped && (
                        <div className="border-x border-b rounded-b-lg p-4 text-center bg-red-500/10 border-red-500/30">
                          <p className="font-semibold text-sm text-red-400">✕ This question was skipped</p>
                        </div>
                      )}

                      {/* Expanded Content */}
                      {isExpanded && hasContent && (
                        <div className="p-4 bg-gradient-to-r from-slate-800/40 to-slate-800/20 border-x border-b border-[#3F9AAE]/20 rounded-b-lg space-y-4">
                          {hasNotes && (
                            <div>
                              <p className="text-xs font-bold text-[#79C9C5]/70 tracking-wider mb-2">INTERVIEWER NOTES</p>
                              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{iq.feedback?.notes}</p>
                            </div>
                          )}
                          {hasCodeSnippet && (
                            <div>
                              <p className="text-xs font-bold text-[#79C9C5]/70 tracking-wider mb-2">CODE SNIPPET</p>
                              <pre className="bg-slate-950 rounded-lg border border-[#3F9AAE]/20 p-3 text-xs font-mono text-slate-300 overflow-x-auto max-h-40">
                                {iq.codeSnippet}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}