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
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen overflow-hidden">
      {/* Premium animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-500/15 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/25 to-purple-500/15 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-gradient-to-b from-white/8 via-white/2 to-transparent backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Link href="/interviews" className="text-cyan-400 hover:text-cyan-300 mb-3 inline-flex items-center gap-2 font-semibold transition-colors text-sm group">
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Interviews
              </Link>
              <div>
                <h1 className="text-4xl font-black text-white mb-2">{interview.template?.name || 'Interview Details'}</h1>
                {interview.candidateName && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {interview.candidateName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Candidate</p>
                      <p className="text-white font-semibold">{interview.candidateName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold ${
                interview.status === 'completed' ? 'bg-gradient-to-r from-green-500/20 to-green-400/10 text-green-300' : 
                interview.status === 'aborted' ? 'bg-gradient-to-r from-red-500/20 to-red-400/10 text-red-300' : 'bg-gradient-to-r from-blue-500/20 to-blue-400/10 text-blue-300'
              }`}>
                {interview.status === 'completed' ? '✓ Completed' : interview.status === 'aborted' ? '✗ Aborted' : '⏳ In Progress'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-400/30 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all group-hover:from-white/12 group-hover:to-white/6 shadow-lg">
              <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">Total Questions</p>
              <p className="text-5xl font-black text-white group-hover:text-cyan-300 transition-colors">{sortedQuestions.length}</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-green-400/30 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all group-hover:from-white/12 group-hover:to-white/6 shadow-lg">
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">Rated</p>
              <p className="text-5xl font-black text-green-300 group-hover:text-green-200 transition-colors">{ratedQuestions.length}</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-red-400/30 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all group-hover:from-white/12 group-hover:to-white/6 shadow-lg">
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-3">Skipped</p>
              <p className="text-5xl font-black text-red-300 group-hover:text-red-200 transition-colors">{skippedQuestions.length}</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-400/30 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all group-hover:from-white/12 group-hover:to-white/6 shadow-lg">
              <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-3">Average Rating</p>
              <p className="text-5xl font-black text-purple-300 group-hover:text-purple-200 transition-colors">{averageRating}<span className="text-2xl">/5</span></p>
            </div>
          </div>
        </div>

        {/* Timeline Info */}
        {interview.createdAt && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <div className="relative rounded-2xl p-6 bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Created</p>
                <p className="text-white font-semibold text-lg">{format(new Date(interview.createdAt), 'MMM d, yyyy • HH:mm')}</p>
              </div>
            </div>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <div className="relative rounded-2xl p-6 bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Time Ago</p>
                <p className="text-white font-semibold text-lg">{formatDistanceToNow(new Date(interview.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-12 flex gap-3 overflow-x-auto pb-2">
          {['all', 'rated', 'skipped'].map((key) => (
            <button
              key={key}
              onClick={() => setFilterTab(key as any)}
              className={`px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                filterTab === key 
                  ? 'bg-gradient-to-r from-cyan-400/30 via-blue-400/30 to-purple-400/30 text-white border border-white/20 shadow-lg shadow-blue-500/20' 
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)} ({key === 'all' ? sortedQuestions.length : key === 'rated' ? ratedQuestions.length : skippedQuestions.length})
            </button>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {Object.entries(groupedQuestions).map(([sectionId, questions]) => {
            const section = sectionMap.get(sectionId);
            const sectionName = section?.name || section?.title || section?.sectionName || `Section ${sectionId.slice(0, 8)}`;
            const sectionDescription = section?.description || section?.instructions || '';
            const sectionRatedCount = questions.filter((q) => q.feedback?.rating && !q.skipped).length;
            const sectionSkippedCount = questions.filter((q) => !q.feedback?.rating || q.skipped).length;

            return (
              <div key={sectionId}>
                {/* Section Header */}
                <div className="group relative mb-8">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                  <div className="relative rounded-2xl p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-3xl font-black text-white mb-2">{sectionName}</h2>
                        {sectionDescription && (
                          <p className="text-slate-400 text-base leading-relaxed font-light mb-4">{sectionDescription}</p>
                        )}
                        <div className="flex flex-wrap gap-3">
                          <span className="inline-flex items-center px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-bold">
                            {questions.length} Question{questions.length !== 1 ? 's' : ''}
                          </span>
                          <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-bold">
                            {sectionRatedCount} Rated
                          </span>
                          {sectionSkippedCount > 0 && (
                            <span className="inline-flex items-center px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold">
                              {sectionSkippedCount} Skipped
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  {questions.map((iq) => {
                    const isExpanded = expandedQuestions.has(iq.id);
                    const hasNotes = iq.feedback?.notes;
                    const hasCodeSnippet = iq.codeSnippet;
                    const isSkipped = iq.skipped;
                    const isUnrated = !iq.feedback?.rating && !isSkipped;
                    const isNotRated = isSkipped || isUnrated;
                    const hasContent = (hasNotes || hasCodeSnippet) && !isNotRated;
                    const canExpand = hasContent;

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
                          className={`w-full transition-all ${
                            isNotRated
                              ? 'opacity-60'
                              : ''
                          }`}
                        >
                          <div className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all group-hover:from-white/12 group-hover:to-white/6 ${
                            canExpand ? 'cursor-pointer' : 'cursor-default'
                          }`}>
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-full group-hover:translate-x-0 duration-500"></div>

                            <div className="relative z-10 flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h3 className={`font-bold text-lg mb-3 transition-colors ${
                                  isNotRated ? 'text-slate-400 line-through' : 'text-white group-hover:text-cyan-300'
                                }`}>
                                  {iq.text}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2">
                                  {iq.difficulty && (
                                    <span className="text-xs font-bold px-3 py-1 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                                      {iq.difficulty.toUpperCase()}
                                    </span>
                                  )}
                                  {isNotRated && (
                                    <span className={`text-xs font-bold px-3 py-1 rounded-md border ${
                                      isSkipped 
                                        ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                    }`}>
                                      {isSkipped ? '✕ SKIPPED' : '⊘ NOT RATED'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                {iq.feedback?.rating && !isNotRated && (
                                  <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                                    <span className="text-yellow-300 font-bold">★</span>
                                    <span className="text-yellow-300 font-bold">{iq.feedback.rating}/5</span>
                                  </div>
                                )}
                                {canExpand && (
                                  <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Skipped Indicator */}
                        {isSkipped && (
                          <div className="mt-2 rounded-xl p-4 text-center bg-gradient-to-r from-red-500/10 to-red-400/10 border border-red-500/20">
                            <p className="font-semibold text-sm text-red-300">✕ This question was skipped</p>
                          </div>
                        )}

                        {/* Expanded Content */}
                        {isExpanded && hasContent && (
                          <div className="mt-2 rounded-xl p-6 bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl space-y-6">
                            {hasNotes && (
                              <div>
                                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">Interviewer Notes</p>
                                <p className="text-slate-300 text-sm leading-relaxed font-light whitespace-pre-wrap">{iq.feedback?.notes}</p>
                              </div>
                            )}
                            {hasCodeSnippet && (
                              <div>
                                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">Code Snippet</p>
                                <pre className="bg-slate-950/50 rounded-lg border border-white/10 p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-64 backdrop-blur-sm">
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
        </div>
      </main>
    </div>
  );
}