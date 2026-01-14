'use client';

import { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { interviewsAPI } from '@/lib/api';
import { geminiAPI } from '@/lib/gemini';
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
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [publicShareLoading, setPublicShareLoading] = useState(false);
  const [publicAccessCode, setPublicAccessCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if this is a public access code (starts with "pub_")
    const isPublicCode = interviewId.startsWith('pub_');
    setIsPublicView(isPublicCode);

    // For public codes, we don't need authentication
    if (isPublicCode) {
      fetchPublicInterview();
    } else if (user) {
      fetchInterview();
    }
  }, [user, interviewId, router]);

  const fetchPublicInterview = async () => {
    try {
      setLoading(true);
      const response = await interviewsAPI.getPublicInterview(interviewId);
      if (!response.data) {
        router.push('/');
        return;
      }
      
      // Check if interview is completed
      if ((response.data as any).status !== 'completed') {
        router.push('/');
        return;
      }
      
      setInterview(response.data as any);
      
      if ((response.data as any).aiSummary) {
        setAiSummary((response.data as any).aiSummary);
        setSummaryLoading(false);
      }
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      router.push('/');
    }
  };

  const fetchInterview = async () => {
    try {
      const response = await interviewsAPI.get(interviewId);
      if (!response.data) throw new Error('No data');
      
      // Check if interview is completed
      if (response.data.status !== 'completed') {
        router.push('/interviews');
        return;
      }
      
      setInterview(response.data);
      
      // Check if summary already exists
      if (response.data.aiSummary) {
        setAiSummary(response.data.aiSummary);
        setSummaryLoading(false);
      } else {
        // Generate summary only if it doesn't exist
        generateSummary(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      router.push('/interviews');
    }
  };

  const generateSummary = async (interviewData: any) => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const summary = await geminiAPI.generateInterviewSummary(interviewData);
      setAiSummary(summary);
      
      // Save the generated summary to the backend
      try {
        await interviewsAPI.saveAISummary(interviewId, summary);
      } catch (saveErr) {
        console.warn('Failed to save summary to backend:', saveErr);
        // Continue even if save fails - summary is still displayed
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate summary';
      setSummaryError(message);
      console.error('Summary generation error:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleMakePublic = async () => {
    setPublicShareLoading(true);
    try {
      const response = await interviewsAPI.makePublic(interviewId);
      setPublicAccessCode(response.data.publicAccessCode);
      setInterview(response.data.interview);
    } catch (err) {
      console.error('Failed to make interview public:', err);
    } finally {
      setPublicShareLoading(false);
    }
  };

  const handleMakePrivate = async () => {
    setPublicShareLoading(true);
    try {
      await interviewsAPI.makePrivate(interviewId);
      setPublicAccessCode(null);
      const response = await interviewsAPI.get(interviewId);
      setInterview(response.data);
    } catch (err) {
      console.error('Failed to make interview private:', err);
    } finally {
      setPublicShareLoading(false);
    }
  };

  const copyPublicLink = () => {
    const code = interview?.publicAccessCode || publicAccessCode;
    if (!code) return;
    
    const publicUrl = `${window.location.origin}/interviews/${code}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

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
              {isPublicView ? (
                <div className="mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    🔗 Public Interview Results
                  </span>
                </div>
              ) : (
                <Link href="/interviews" className="text-cyan-400 hover:text-cyan-300 mb-3 inline-flex items-center gap-2 font-semibold transition-colors text-sm group">
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Interviews
                </Link>
              )}
              <div>
                <h1 className="text-4xl font-black text-white mb-2">{interview.template?.name || 'Interview Details'}</h1>
                <div className="flex items-center gap-6">
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
                  {isPublicView && interview.interviewer && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                        {interview.interviewer.charAt(0)}
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Conducted by</p>
                        <p className="text-white font-semibold">{interview.interviewer}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-4">
              {!isPublicView && interview.isPublic && (
                <button
                  onClick={copyPublicLink}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-semibold transition-all"
                  title="Copy public link"
                >
                  {copySuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>
              )}
              {!isPublicView && (
                <button
                  onClick={interview.isPublic ? handleMakePrivate : handleMakePublic}
                  disabled={publicShareLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    interview.isPublic
                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 border border-slate-600/30'
                  }`}
                >
                  {publicShareLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {interview.isPublic ? 'Make Private' : 'Make Public'}
                </button>
              )}
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
        {aiSummary && !summaryError && (
          <div className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Powered Analysis
              </h2>
              {!isPublicView && (
                <button
                  onClick={() => generateSummary(interview)}
                  disabled={summaryLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {summaryLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Confidence Meter */}
            {aiSummary.confidence && (
              <div className="group relative mb-8">
                <div className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl ${
                  aiSummary.confidence.score >= 80 ? 'bg-gradient-to-r from-green-400/30 to-emerald-400/30' :
                  aiSummary.confidence.score >= 65 ? 'bg-gradient-to-r from-blue-400/30 to-cyan-400/30' :
                  aiSummary.confidence.score >= 50 ? 'bg-gradient-to-r from-yellow-400/30 to-amber-400/30' :
                  aiSummary.confidence.score >= 35 ? 'bg-gradient-to-r from-orange-400/30 to-red-400/30' :
                  'bg-gradient-to-r from-red-400/30 to-red-500/30'
                }`}></div>
                <div className={`relative rounded-2xl p-8 backdrop-blur-xl hover:border-white/40 transition-all border ${
                  aiSummary.confidence.score >= 80 ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20' :
                  aiSummary.confidence.score >= 65 ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20' :
                  aiSummary.confidence.score >= 50 ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20' :
                  aiSummary.confidence.score >= 35 ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20' :
                  'bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20'
                }`}>
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex-1">
                      <h3 className={`text-2xl font-black mb-2 ${
                        aiSummary.confidence.score >= 80 ? 'text-green-300' :
                        aiSummary.confidence.score >= 65 ? 'text-blue-300' :
                        aiSummary.confidence.score >= 50 ? 'text-yellow-300' :
                        aiSummary.confidence.score >= 35 ? 'text-orange-300' :
                        'text-red-300'
                      }`}>
                        {aiSummary.confidence.level}
                      </h3>
                      <p className={`font-bold text-lg mb-3 ${
                        aiSummary.confidence.score >= 80 ? 'text-green-400' :
                        aiSummary.confidence.score >= 65 ? 'text-blue-400' :
                        aiSummary.confidence.score >= 50 ? 'text-yellow-400' :
                        aiSummary.confidence.score >= 35 ? 'text-orange-400' :
                        'text-red-400'
                      }`}>
                        {aiSummary.confidence.hiring_likelihood}
                      </p>
                      <p className="text-slate-300 text-sm leading-relaxed">{aiSummary.confidence.description}</p>
                    </div>
                    {/* Circular Progress Meter */}
                    <div className="flex-shrink-0">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                          {/* Background circle */}
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                          />
                          {/* Progress circle */}
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke={
                              aiSummary.confidence.score >= 80 ? '#10b981' :
                              aiSummary.confidence.score >= 65 ? '#3b82f6' :
                              aiSummary.confidence.score >= 50 ? '#eab308' :
                              aiSummary.confidence.score >= 35 ? '#f97316' :
                              '#ef4444'
                            }
                            strokeWidth="8"
                            strokeDasharray={`${(aiSummary.confidence.score / 100) * 314} 314`}
                            strokeLinecap="round"
                            style={{transition: 'stroke-dasharray 1s ease'}}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className={`text-3xl font-black ${
                              aiSummary.confidence.score >= 80 ? 'text-green-400' :
                              aiSummary.confidence.score >= 65 ? 'text-blue-400' :
                              aiSummary.confidence.score >= 50 ? 'text-yellow-400' :
                              aiSummary.confidence.score >= 35 ? 'text-orange-400' :
                              'text-red-400'
                            }`}>
                              {aiSummary.confidence.score}%
                            </div>
                            <div className="text-xs text-slate-400 font-semibold">Score</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Summary */}
            <div className="group relative mb-8">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-purple-400/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              <div className="relative rounded-2xl p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all">
                <h3 className="text-2xl font-bold text-purple-300 mb-4">Overall Performance Summary</h3>
                <p className="text-slate-300 text-base leading-relaxed mb-6">{aiSummary.overallSummary}</p>
                <p className="text-slate-400 text-sm leading-relaxed italic border-l-4 border-purple-500/40 pl-4">{aiSummary.overallRating}</p>
              </div>
            </div>

            {/* Key Strengths & Areas for Improvement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Key Strengths */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                <div className="relative rounded-2xl p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 backdrop-blur-xl hover:border-green-500/40 transition-all">
                  <h4 className="text-lg font-bold text-green-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Key Strengths
                  </h4>
                  <ul className="space-y-2">
                    {aiSummary.keyStrengths?.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="text-green-400 font-bold mt-0.5">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Areas for Improvement */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                <div className="relative rounded-2xl p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all">
                  <h4 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {aiSummary.areasForImprovement?.map((area: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="text-amber-400 font-bold mt-0.5">→</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              <div className="relative rounded-2xl p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 backdrop-blur-xl hover:border-cyan-500/40 transition-all">
                <h4 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Recommendations
                </h4>
                <ol className="space-y-2">
                  {aiSummary.recommendations?.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="text-cyan-400 font-bold min-w-fit mt-0.5">{idx + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Section-wise Analysis */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-white mb-6">Section-wise Analysis</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {aiSummary.sections?.map((section: any, idx: number) => (
                  <div key={idx} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-slate-400/20 to-slate-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                    <div className="relative rounded-2xl p-6 bg-gradient-to-br from-white/8 to-white/3 border border-white/15 backdrop-blur-xl hover:border-white/25 transition-all">
                      <h5 className="text-lg font-bold text-white mb-4">{section.name}</h5>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">{section.summary}</p>
                      
                      {/* Section Strengths */}
                      <div className="mb-4">
                        <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-2">Strengths</p>
                        <ul className="space-y-1">
                          {section.strengths?.map((strength: string, sidx: number) => (
                            <li key={sidx} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-green-400 mt-0.5">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Section Gaps */}
                      <div>
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2">Gaps</p>
                        <ul className="space-y-1">
                          {section.gaps?.map((gap: string, gidx: number) => (
                            <li key={gidx} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-amber-400 mt-0.5">→</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Topics Assessment */}
                      {section.topics && section.topics.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-white/10">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Topics Covered</p>
                          <div className="flex flex-wrap gap-2">
                            {section.topics.map((topic: any, tidx: number) => (
                              <span
                                key={tidx}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  topic.understood
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}
                              >
                                {topic.understood ? (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                <span>{topic.name}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {summaryLoading && (
          <div className="mb-16 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40 mb-4">
                <span className="inline-block w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></span>
              </div>
              <p className="text-slate-300 font-semibold">Generating AI Analysis...</p>
            </div>
          </div>
        )}

        {summaryError && (
          <div className="mb-16 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-sm">
            <p className="font-semibold mb-1">Summary Generation Error</p>
            <p>{summaryError}</p>
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
                        <div className={`relative rounded-lg px-4 py-3 border transition-all duration-200 ${
                          isNotRated 
                            ? 'bg-slate-800/40 border-slate-700/40 opacity-65 cursor-default' 
                            : 'bg-slate-800/50 border-cyan-500/50 hover:border-cyan-400 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-cyan-500/20 cursor-pointer'
                        }`}
                        onClick={() => canExpand && toggleQuestion(iq.id)}>
                          <div className="flex items-center justify-between gap-3">
                            {/* Question Text */}
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm font-semibold leading-snug break-words ${
                                isNotRated 
                                  ? 'text-slate-500 line-through' 
                                  : 'text-slate-100'
                              }`}>
                                {iq.text}
                              </h3>
                            </div>

                            {/* Right Section: Badges, Rating, Arrow */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {iq.difficulty && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                                  iq.difficulty.toLowerCase() === 'easy' ? 'bg-green-500/30 text-green-200' :
                                  iq.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                                  'bg-red-500/30 text-red-200'
                                }`}>
                                  {iq.difficulty.charAt(0)}
                                </span>
                              )}
                              {isNotRated && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  isSkipped 
                                    ? 'bg-red-500/30 text-red-200' 
                                    : 'bg-yellow-500/30 text-yellow-200'
                                }`}>
                                  {isSkipped ? '✕' : '⊘'}
                                </span>
                              )}
                              {iq.feedback?.rating && !isNotRated && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-500/30 text-yellow-200">
                                  ★{iq.feedback.rating}
                                </span>
                              )}
                              {canExpand && (
                                <svg className={`w-4 h-4 text-cyan-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && hasContent && (
                          <div className="mt-1 ml-0 rounded-lg overflow-hidden border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm">
                            {hasNotes && (
                              <div className="px-4 py-2.5 border-b border-cyan-500/20">
                                <p className="text-cyan-400 text-xs font-bold mb-2">Notes:</p>
                                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{iq.feedback?.notes}</p>
                              </div>
                            )}
                            {hasCodeSnippet && (
                              <div className="px-4 py-2.5">
                                <p className="text-cyan-400 text-xs font-bold mb-2">Code:</p>
                                <pre className="bg-slate-950/60 rounded border border-slate-700 p-2.5 text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
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