'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { interviewsAPI } from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';

export default function InterviewDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [overallNotes, setOverallNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);

  useEffect(() => {
    if (!token || !interviewId) return;

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
  }, [token, interviewId, router]);

  const handleSaveNotes = async () => {
    try {
      await interviewsAPI.updateOverallNotes(interviewId, overallNotes);
      setEditingNotes(false);
      // Refresh interview
      const response = await interviewsAPI.get(interviewId);
      setInterview(response.data);
    } catch (err) {
      console.error('Failed to save notes');
    }
  };



  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!interview) {
    return <div className="text-center py-12">Interview not found</div>;
  }

  // Sort questions by order field from backend
  const sortedQuestions = interview.questions ? [...interview.questions].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : [];
  
  const completedQuestions = sortedQuestions?.filter((q: any) => !q.skipped) || [];
  const skippedQuestions = sortedQuestions?.filter((q: any) => q.skipped) || [];
  const ratedQuestions = sortedQuestions?.filter((q: any) => q.feedback?.rating) || [];
  const averageRating =
    ratedQuestions.length > 0
      ? (ratedQuestions.reduce((sum: number, q: any) => sum + (q.feedback?.rating || 0), 0) /
          ratedQuestions.length).toFixed(1)
      : '0';

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-[#3F9AAE]/30 bg-slate-900/50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link href="/interviews" className="text-[#79C9C5] hover:text-[#FFE2AF] mb-2 inline-block font-medium transition-colors">
              ← Back to Interviews
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] bg-clip-text text-transparent">
              {interview.template?.name}
              {interview.candidateName && ` - ${interview.candidateName}`}
            </h1>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-white font-semibold ${
              interview.status === 'completed' 
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300' 
                : interview.status === 'aborted'
                ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                : 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
            }`}
          >
            {interview.status === 'completed' ? 'Completed' : interview.status === 'aborted' ? 'Aborted' : 'In Progress'}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg border border-[#3F9AAE]/30 p-6 hover:border-[#3F9AAE] transition-colors">
            <p className="text-sm text-[#79C9C5]">Total Questions</p>
            <p className="text-3xl font-bold text-white mt-2">{sortedQuestions?.length || 0}</p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-emerald-500/30 p-6 hover:border-emerald-500 transition-colors">
            <p className="text-sm text-emerald-300">Completed</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{completedQuestions.length}</p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-amber-500/30 p-6 hover:border-amber-500 transition-colors">
            <p className="text-sm text-amber-300">Skipped</p>
            <p className="text-3xl font-bold text-amber-400 mt-2">{skippedQuestions.length}</p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-[#FFE2AF]/30 p-6 hover:border-[#FFE2AF] transition-colors">
            <p className="text-sm text-[#FFE2AF]">Average Rating</p>
            <p className="text-3xl font-bold text-[#FFE2AF] mt-2">{averageRating}/5</p>
            {interview.status === 'aborted' && <p className="text-xs text-[#FFE2AF]/70 mt-2">Interview was aborted</p>}
          </div>
        </div>

        {/* Interview Date */}
        <div className="bg-slate-800 rounded-lg border border-[#3F9AAE]/30 p-4 mb-8 text-sm text-[#79C9C5]">
          Created {formatDistanceToNow(new Date(interview.createdAt), { addSuffix: true })} •{' '}
          {format(new Date(interview.createdAt), 'MMM d, yyyy - HH:mm')}
        </div>

        {/* Questions Review */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] bg-clip-text text-transparent">Question Review</h2>

          {sortedQuestions?.map((iq: any, index: number) => (
            <div key={iq.id} className="bg-slate-800 rounded-lg border border-[#3F9AAE]/30 overflow-hidden hover:border-[#3F9AAE] transition-colors">
              <div className="p-6">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {index + 1}. {iq.question?.text}
                    </h3>
                    {iq.question?.difficulty && (
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[#F96E5B]/20 text-[#F96E5B] border border-[#F96E5B]/30 mb-4">
                        {iq.question.difficulty}
                      </span>
                    )}
                  </div>
                  {iq.skipped && (
                    <span className="px-3 py-1 rounded-full bg-slate-700 border border-slate-600 text-slate-300 text-sm font-semibold">
                      Skipped
                    </span>
                  )}
                </div>

                {/* Code Snippet */}
                {iq.question?.codeSnippet && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-[#79C9C5] mb-2">Code Snippet:</p>
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto border border-[#3F9AAE]/20">
                      <pre>{iq.question.codeSnippet}</pre>
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {iq.feedback && !iq.skipped ? (
                  <div className="border-t border-[#3F9AAE]/20 pt-4 mt-4">
                    <p className="text-sm font-medium text-[#79C9C5] mb-2">Feedback:</p>
                    <div className="bg-[#3F9AAE]/10 border border-[#3F9AAE]/30 rounded-lg p-4 mb-4">
                      <p className="text-slate-200 whitespace-pre-wrap">{iq.feedback.notes}</p>
                    </div>
                    {iq.feedback.rating && (
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-[#79C9C5] mr-2">Rating:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-xl ${
                                i < Math.round(iq.feedback.rating)
                                  ? 'text-[#FFE2AF]'
                                  : 'text-slate-600'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="ml-2 font-semibold text-[#FFE2AF]">
                          {iq.feedback.rating}/5
                        </span>
                      </div>
                    )}
                  </div>
                ) : !iq.skipped ? (
                  <div className="border-t border-[#3F9AAE]/20 pt-4 mt-4">
                    <p className="text-slate-400 italic">No feedback recorded for this question</p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex space-x-4">
          <Link
            href="/interviews"
            className="px-6 py-3 border border-[#3F9AAE]/30 text-[#79C9C5] rounded-lg hover:bg-[#3F9AAE]/10 hover:border-[#3F9AAE] font-medium transition-all"
          >
            Back to Interviews
          </Link>
          {interview.status === 'in_progress' && (
            <Link
              href={`/interviews/${interviewId}/conduct`}
              className="px-6 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 font-medium transition-all"
            >
              Continue Interview
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
