'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { interviewsAPI } from '@/lib/api';
import Link from 'next/link';

export default function InterviewConductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;
  const [interview, setInterview] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState({ notes: '', rating: 0 });
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [completingInterview, setCompletingInterview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<'abort' | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [previousSectionId, setPreviousSectionId] = useState<string | null>(null);
  const [showSectionNotification, setShowSectionNotification] = useState(false);
  const [sectionNotificationText, setSectionNotificationText] = useState('');

  // Initialize start time from localStorage
  useEffect(() => {
    const storedStartTime = localStorage.getItem(`interview_start_time_${interviewId}`);
    if (storedStartTime) {
      setStartTime(parseInt(storedStartTime, 10));
    } else {
      const newStartTime = Date.now();
      setStartTime(newStartTime);
      localStorage.setItem(`interview_start_time_${interviewId}`, newStartTime.toString());
    }
  }, [interviewId]);

  // Fetch interview on mount
  useEffect(() => {
    if (!user || !interviewId) return;

    const fetchInterview = async () => {
      try {
        const response = await interviewsAPI.get(interviewId);
        setInterview(response.data);
        setLoading(false);
      } catch {
        router.push('/interviews');
      }
    };

    fetchInterview();
  }, [user, interviewId, router]);

  const rawQuestions = (() => {
    const questions: any[] = [];
    if (interview?.sections) {
      // Use sectionOrder if available, otherwise use Object.keys
      const sectionIds = interview?.sectionOrder && interview.sectionOrder.length > 0
        ? interview.sectionOrder
        : Object.keys(interview.sections);
      
      sectionIds.forEach((sectionId: string) => {
        const section = interview.sections[sectionId];
        if (section && section.questions) {
          Object.values(section.questions).forEach((question: any) => {
            questions.push({
              ...question,
              sectionId: section.id,
            });
          });
        }
      });
    }
    return questions;
  })();
  
  // Sort questions by their order field
  const allQuestions = rawQuestions.length > 0
    ? [...rawQuestions].sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    : rawQuestions;
    
  const totalQuestions = allQuestions.length;
  const currentQuestion = allQuestions[currentQuestionIndex];

  // Get section for current question
  const getCurrentSection = () => {
    if (!interview?.template?.sections || !currentQuestion) return null;
    const templateSections = Object.values(interview.template.sections);
    for (const section of templateSections) {
      if ((section as any).id === currentQuestion.sectionId) {
        return section;
      }
    }
    return null;
  };

  const currentSection = getCurrentSection();

  // Get section for a specific question
  const getQuestionSection = (question: any) => {
    if (!interview?.template?.sections) return null;
    const templateSections = Object.values(interview.template.sections);
    for (const section of templateSections) {
      if ((section as any).id === question.sectionId) {
        return section;
      }
    }
    return null;
  };

  // Color palette for sections with RGB values
  const sectionColors = [
    { hex: '#3F9AAE', rgb: '63, 154, 174' },
    { hex: '#79C9C5', rgb: '121, 201, 197' },
    { hex: '#FFE2AF', rgb: '255, 226, 175' },
    { hex: '#F96E5B', rgb: '249, 110, 91' },
  ];

  const getSectionColor = (sectionId: string) => {
    const templateSections = interview?.template?.sections ? Object.values(interview.template.sections) : [];
    const sectionIndex = templateSections.findIndex((s: any) => s.id === sectionId);
    return sectionColors[(sectionIndex >= 0 ? sectionIndex : 0) % sectionColors.length];
  };

  // Get question status
  const getQuestionStatus = (question: any) => {
    if (question.skipped) return 'skipped';
    if (question.feedback && question.feedback.rating && question.feedback.rating >= 1 && question.feedback.rating <= 5) {
      return 'saved';
    }
    if (visitedQuestions.has(question.id)) {
      return 'visited';
    }
    return 'unanswered';
  };

  // Timer effect
  useEffect(() => {
    if (startTime === null) return;
    
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Load feedback when question changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Mark previous question as visited if it didn't have a rating
    if (currentQuestion && !currentQuestion.feedback?.rating && !currentQuestion.skipped) {
      setVisitedQuestions((prev) => new Set(prev).add(currentQuestion.id));
    }
    
    // Check if section changed
    const newSection = currentSection as any;
    if (newSection && previousSectionId && previousSectionId !== newSection.id) {
      setSectionNotificationText(`📍 ${newSection.title}`);
      setShowSectionNotification(true);
      setTimeout(() => setShowSectionNotification(false), 2500);
    }
    if (newSection) {
      setPreviousSectionId(newSection.id);
    }
    
    const loadFeedback = async () => {
      if (!currentQuestion?.id || !currentQuestion?.sectionId) {
        setFeedback({ notes: '', rating: 0 });
        setLoadingFeedback(false);
        return;
      }
      
      setLoadingFeedback(true);
      try {
        const response = await interviewsAPI.getFeedback(interviewId, currentQuestion.sectionId, currentQuestion.id);
        if (response?.data) {
          setFeedback({
            notes: response.data.notes || '',
            rating: response.data.rating || 0,
          });
        } else {
          setFeedback({ notes: '', rating: 0 });
        }
      } catch (err) {
        console.error('Failed to load feedback:', err);
        setFeedback({ notes: '', rating: 0 });
      } finally {
        setLoadingFeedback(false);
      }
    };
    
    loadFeedback();
  }, [currentQuestionIndex, currentQuestion?.id, (currentSection as any)?.id, previousSectionId]);

  // Handle rating click with auto-save
  const handleRatingClick = async (rating: number) => {
    setFeedback({ ...feedback, rating });
    if (!interview || !allQuestions[currentQuestionIndex]) return;

    try {
      const currentInterviewQuestion = allQuestions[currentQuestionIndex];
      const feedbackToSave: any = {
        notes: feedback.notes?.trim() || '',
        rating: rating,
      };

      await interviewsAPI.saveFeedback(
        interviewId,
        currentInterviewQuestion.sectionId,
        currentInterviewQuestion.id,
        feedbackToSave
      );

      // Update local state
      const updatedQuestions = allQuestions.map((q: any, idx: number) =>
        idx === currentQuestionIndex ? { ...q, feedback: feedbackToSave } : q
      );

      setInterview({
        ...interview,
        questions: updatedQuestions,
      });

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save feedback:', err);
    }
  };

  const handleSkipQuestion = async () => {
    if (!interview || !allQuestions[currentQuestionIndex]) return;

    try {
      const currentQuestion = allQuestions[currentQuestionIndex];
      await interviewsAPI.skipQuestion(
        interviewId,
        currentQuestion.sectionId,
        currentQuestion.id
      );

      const updatedQuestions = allQuestions.map((q: any, idx: number) =>
        idx === currentQuestionIndex ? { ...q, skipped: true } : q
      );
      setInterview({
        ...interview,
        questions: updatedQuestions,
      });

      if (currentQuestionIndex < allQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setShowSummary(true);
      }
    } catch (err) {
      console.error('Failed to skip question');
    }
  };

  const handleCompleteInterview = async () => {
    try {
      setCompletingInterview(true);
      await interviewsAPI.updateStatus(interviewId, 'completed');
      localStorage.removeItem(`interview_start_time_${interviewId}`);
      router.push(`/interviews/${interviewId}`);
    } catch (err) {
      console.error('Failed to complete interview');
      setCompletingInterview(false);
    }
  };

  const handleAbortInterview = async () => {
    try {
      await interviewsAPI.updateStatus(interviewId, 'aborted');
      localStorage.removeItem(`interview_start_time_${interviewId}`);
      router.push('/interviews');
    } catch (err) {
      console.error('Failed to abort interview');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-slate-950 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#79C9C5] border-t-[#3F9AAE] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#79C9C5]">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-bold text-white mb-2">Interview not found</h3>
          <p className="text-[#79C9C5] mb-6">The interview you're looking for doesn't exist.</p>
          <Link href="/interviews" className="inline-block px-6 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white rounded-lg">
            Back to Interviews
          </Link>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-12 text-center border border-[#3F9AAE]/50">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-[#79C9C5]/20 flex items-center justify-center mx-auto mb-8 border-2 border-emerald-500/50">
              <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Excellent Work! 🎉</h2>
            <p className="text-[#79C9C5] mb-8">You've successfully completed all questions</p>
            <div className="grid grid-cols-2 gap-6 my-8 py-8 border-t border-b border-[#3F9AAE]/30">
              <div>
                <p className="text-[#FFE2AF] text-3xl font-bold">{totalQuestions}</p>
                <p className="text-[#79C9C5] text-sm">Total Questions</p>
              </div>
              <div>
                <p className="text-[#FFE2AF] text-3xl font-bold">{formatTime(elapsedTime)}</p>
                <p className="text-[#79C9C5] text-sm">Time Taken</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleCompleteInterview}
                disabled={completingInterview}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {completingInterview ? 'Completing...' : 'Complete Interview'}
              </button>
              <Link href="/interviews" className="block px-6 py-3 border-2 border-[#3F9AAE]/50 text-[#79C9C5] font-semibold rounded-xl hover:bg-[#3F9AAE]/10 transition-colors">
                Back to Interviews
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[#3F9AAE]/10 via-[#79C9C5]/5 to-[#3F9AAE]/10 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <Link href="/interviews" className="p-2 hover:bg-[#3F9AAE]/20 rounded-lg text-[#79C9C5] transition-colors" title="Back to Interviews">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <p className="text-[#FFE2AF] text-xs font-semibold tracking-wide">INTERVIEW SESSION</p>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] bg-clip-text text-transparent">
                {interview?.candidateName ? `${interview.candidateName} • ${interview?.template?.name}` : interview?.template?.name}
              </h2>
              {(currentSection as any) && <p className="text-[#79C9C5]/70 text-xs mt-1">📍 {(currentSection as any).title}</p>}
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center px-6 py-3 bg-gradient-to-r from-[#FFE2AF]/10 to-[#F96E5B]/10 rounded-xl border border-[#FFE2AF]/30">
              <p className="text-[#FFE2AF]/70 text-xs font-semibold mb-1">ELAPSED TIME</p>
              <p className="text-3xl font-mono font-black text-[#FFE2AF]">{formatTime(elapsedTime)}</p>
            </div>
            <div className="text-center">
              <p className="text-[#79C9C5]/70 text-xs font-semibold">PROGRESS</p>
              <p className="text-2xl font-bold text-[#79C9C5]">{currentQuestionIndex + 1}/{totalQuestions}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowConfirmDialog('abort')} className="flex items-center gap-2 px-4 py-2 bg-[#F96E5B]/20 hover:bg-[#F96E5B]/30 text-[#F96E5B] rounded-lg font-semibold transition-all border border-[#F96E5B]/50" title="Abort Interview">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Abort
              </button>
              <button onClick={() => setShowCompletionModal(true)} disabled={completingInterview} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg text-white rounded-lg font-semibold transition-all disabled:opacity-50" title="Complete Interview">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {completingInterview ? 'Completing...' : 'Complete'}
              </button>
            </div>
          </div>
        </div>

        {/* Questions Tracker */}
        <div className="border-t border-[#3F9AAE]/30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide pr-4 ml-16">
              <span className="text-xs font-semibold text-[#FFE2AF] whitespace-nowrap">QUESTIONS:</span>
            {allQuestions.length > 0 ? (
            <div className="flex items-center gap-3">
              {allQuestions.map((question: any, index: number) => {
                const status = getQuestionStatus(question);
                const isActive = index === currentQuestionIndex;
                const questionSection = getQuestionSection(question);
                const sectionColor = questionSection ? getSectionColor((questionSection as any).id) : sectionColors[0];

                return (
                  <button
                    key={question.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className="w-9 h-9 rounded-lg font-bold text-xs transition-all flex items-center justify-center flex-shrink-0 border-2 hover:scale-110"
                    title={`Question ${index + 1}`}
                    style={{
                      borderColor: status === 'saved' ? '#10b981' : status === 'skipped' ? '#ef4444' : status === 'visited' ? '#ef4444' : sectionColor.hex,
                      backgroundColor: isActive
                        ? sectionColor.hex
                        : status === 'saved'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : status === 'skipped'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : status === 'visited'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : `rgba(${sectionColor.rgb}, 0.1)`,
                      color: isActive ? 'white' : status === 'saved' ? '#10b981' : status === 'skipped' ? '#ef4444' : status === 'visited' ? '#ef4444' : sectionColor.hex,
                    }}
                  >
                    {status === 'saved' ? '✓' : status === 'skipped' ? '⊘' : index + 1}
                  </button>
                );
              })}
            </div>
            ) : (
              <div className="text-xs text-[#79C9C5]/50">Loading questions...</div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl">
          {currentQuestion ? (
            <div className="mb-12">
              {/* Progress Bar */}
              <div className="mb-12">
                <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden border border-[#3F9AAE]/30">
                  <div
                    className="h-2 bg-gradient-to-r from-[#3F9AAE] via-[#79C9C5] to-[#FFE2AF] transition-all"
                    style={{ width: `${((currentQuestionIndex + 1) / (totalQuestions || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-12 mb-10 border border-[#3F9AAE]/30">
                <div className="mb-6">
                  <p className="text-[#FFE2AF] text-sm font-bold tracking-widest mb-2">
                    {(currentSection as any)?.title || 'Section'}
                  </p>
                  <p className="text-[#79C9C5]/70 text-xs font-semibold tracking-wide">
                    QUESTION {currentQuestionIndex + 1} OF {totalQuestions} • 
                    {currentSection ? ` ${allQuestions.filter((q: any) => (getQuestionSection(q) as any)?.id === (currentSection as any).id).findIndex((q: any) => q.id === currentQuestion?.id) + 1} OF ${allQuestions.filter((q: any) => (getQuestionSection(q) as any)?.id === (currentSection as any).id).length} IN SECTION` : ''}
                  </p>
                </div>
                <h3 className="text-4xl font-bold text-white leading-relaxed mb-8">
                  {currentQuestion?.text || 'Loading question...'}
                </h3>

                {currentQuestion?.codeSnippet && (
                  <div className="mb-10">
                    <p className="text-[#79C9C5] text-sm font-semibold mb-3">Code Snippet:</p>
                    <div className="bg-slate-900/80 text-[#79C9C5] p-6 rounded-xl font-mono text-sm overflow-x-auto border border-[#3F9AAE]/20">
                      <pre className="whitespace-pre-wrap break-words">{currentQuestion.codeSnippet}</pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback Form */}
              <div className="border-t border-[#3F9AAE]/30 pt-10">
                <div className="space-y-8">
                  {(feedback.notes || feedback.rating > 0) && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#79C9C5]/10 rounded-lg border border-[#79C9C5]/30">
                      <svg className="w-5 h-5 text-[#79C9C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-[#79C9C5] font-medium">Feedback saved for this question</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-bold text-[#FFE2AF] mb-4 tracking-wide">
                      📝 INTERVIEWER NOTES
                    </label>
                    <textarea
                      value={feedback.notes}
                      onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })}
                      placeholder="Record your observations and feedback..."
                      disabled={loadingFeedback}
                      className="w-full rounded-xl border-2 border-[#3F9AAE]/30 focus:border-[#3F9AAE] shadow-lg focus:outline-none focus:ring-2 focus:ring-[#3F9AAE]/50 bg-slate-700/50 text-white placeholder-slate-400 px-6 py-4 text-lg transition-all disabled:opacity-50"
                      rows={6}
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-bold text-[#FFE2AF] mb-4 tracking-wide">
                      ⭐ PERFORMANCE RATING
                    </label>
                    <div className="flex gap-3 justify-center">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRatingClick(rating)}
                          disabled={loadingFeedback}
                          className={`w-16 h-16 rounded-xl font-black text-xl transition-all transform hover:scale-110 ${
                            feedback.rating === rating
                              ? 'bg-gradient-to-br from-[#FFE2AF] to-[#F96E5B] text-white shadow-2xl shadow-[#FFE2AF]/50 scale-110 border-2 border-[#FFE2AF]'
                              : 'bg-slate-700/50 text-[#79C9C5] border-2 border-[#3F9AAE]/30 hover:border-[#3F9AAE]/60'
                          } disabled:opacity-50`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4 px-4 mt-12">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-[#3F9AAE]/50 text-[#79C9C5] rounded-lg hover:bg-[#3F9AAE]/10 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="text-center text-[#79C9C5] font-semibold">
                  {currentQuestionIndex + 1} / {totalQuestions}
                </div>

                <button
                  onClick={() => {
                    if (currentQuestionIndex === totalQuestions - 1) {
                      setShowSummary(true);
                    } else {
                      setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1));
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-[#3F9AAE]/50 text-[#79C9C5] rounded-lg hover:bg-[#3F9AAE]/10 font-bold transition-all"
                >
                  {currentQuestionIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-2xl font-bold text-white mb-2">No Questions Found</h3>
              <p className="text-[#79C9C5] mb-6">This interview template has no questions yet.</p>
              <Link href="/interviews" className="inline-block px-6 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white rounded-lg">
                Back to Interviews
              </Link>
            </div>
          )}
        </div>
      </div>      {/* Completion Review Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-[#3F9AAE]/30 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Interview Summary</h3>
            
            <div className="space-y-6 mb-8">
              {/* Rated Questions */}
              <div>
                <p className="text-[#79C9C5] font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  Rated Questions ({allQuestions.filter((q: any) => q.feedback?.rating).length})
                </p>
                <div className="space-y-2 ml-8">
                  {allQuestions
                    .filter((q: any) => q.feedback?.rating)
                    .map((q: any, idx: number) => (
                      <div key={q.id} className="text-emerald-400 text-sm">
                        Question {allQuestions.findIndex((x: any) => x.id === q.id) + 1}: {q.text?.substring(0, 60)}...
                      </div>
                    ))}
                </div>
              </div>

              {/* Unanswered Questions */}
              <div>
                <p className="text-[#79C9C5] font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-2xl">⊘</span>
                  Unanswered Questions ({allQuestions.filter((q: any) => !q.feedback?.rating && !q.skipped).length})
                </p>
                <div className="space-y-2 ml-8">
                  {allQuestions
                    .filter((q: any) => !q.feedback?.rating && !q.skipped)
                    .map((q: any) => (
                      <div key={q.id} className="text-[#FFE2AF] text-sm">
                        Question {allQuestions.findIndex((x: any) => x.id === q.id) + 1}: {q.text?.substring(0, 60)}...
                      </div>
                    ))}
                </div>
              </div>

              {/* Skipped Questions */}
              {allQuestions.filter((q: any) => q.skipped).length > 0 && (
                <div>
                  <p className="text-[#79C9C5] font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="text-2xl">—</span>
                    Skipped Questions ({allQuestions.filter((q: any) => q.skipped).length})
                  </p>
                  <div className="space-y-2 ml-8">
                    {allQuestions
                      .filter((q: any) => q.skipped)
                      .map((q: any) => (
                        <div key={q.id} className="text-red-400 text-sm">
                          Question {allQuestions.findIndex((x: any) => x.id === q.id) + 1}: {q.text?.substring(0, 60)}...
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#3F9AAE]/30 pt-6 space-y-3">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  handleCompleteInterview();
                }}
                disabled={completingInterview}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {completingInterview ? 'Completing...' : 'Confirm & Complete Interview'}
              </button>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="w-full px-6 py-3 border-2 border-[#3F9AAE]/50 text-[#79C9C5] rounded-xl font-bold hover:bg-[#3F9AAE]/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-[#3F9AAE]/30 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-3 text-center">Abort Interview?</h3>
            <p className="text-[#79C9C5] mb-8 text-center">This interview will be marked as aborted. You can view it in your interview history.</p>
            <div className="space-y-3">
              <button
                onClick={handleAbortInterview}
                className="w-full px-6 py-3 bg-[#F96E5B]/20 hover:bg-[#F96E5B]/30 text-[#F96E5B] rounded-xl font-bold border border-[#F96E5B]/50 transition-all"
              >
                Abort Interview
              </button>
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="w-full px-6 py-3 border-2 border-[#3F9AAE]/50 text-[#79C9C5] rounded-xl font-bold hover:bg-[#3F9AAE]/10 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Success Toast */}
      {showSaveSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-300/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold">Feedback saved!</p>
          </div>
        </div>
      )}

      {/* Section Change Notification */}
      {showSectionNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/40 absolute inset-0 backdrop-blur-sm" onClick={() => setShowSectionNotification(false)} />
          <div className="relative bg-gradient-to-br from-[#3F9AAE] to-[#79C9C5] text-white px-12 py-8 rounded-2xl shadow-2xl border-2 border-[#FFE2AF]/30 text-center animate-bounce">
            <p className="text-6xl mb-4">📍</p>
            <h3 className="text-4xl font-black mb-2">{sectionNotificationText.replace('📍 ', '')}</h3>
            <p className="text-[#FFE2AF] font-semibold text-sm">New Section</p>
          </div>
        </div>
      )}
    </div>
  );
}
