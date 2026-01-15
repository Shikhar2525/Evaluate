'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { interviewsAPI } from '@/lib/api';
import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import Link from 'next/link';
import Loader from '@/lib/components/loader';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import * as prettierStandalone from 'prettier/standalone';
import babelParser from 'prettier/parser-babel';

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
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [copySuccess, setCopySuccess] = useState(false);
  const [editableCode, setEditableCode] = useState('');
  const [isCodeEditable, setIsCodeEditable] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320); // 80 * 4 = 320px
  const [isResizing, setIsResizing] = useState(false);

  // Sidebar width constraints
  const MIN_SIDEBAR_WIDTH = 200;
  const MAX_SIDEBAR_WIDTH = 500;

  // Handle sidebar resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Initialize start time from Firebase (cross-device reliable)
  useEffect(() => {
    if (!user || !interviewId) return;

    const initializeStartTime = async () => {
      try {
        // Reference to interview metadata in Firebase
        const interviewRef = ref(database, `user_interviews/${user.id}/${interviewId}`);
        
        // First, check if interview has a startTime stored in Firebase
        const snapshot = await get(interviewRef);
        const interviewData = snapshot.val();
        
        if (interviewData?.startTime) {
          // Use existing start time from Firebase
          setStartTime(interviewData.startTime);
        } else {
          // First time opening this interview - set start time in Firebase
          const newStartTime = Date.now();
          await update(interviewRef, { startTime: newStartTime });
          setStartTime(newStartTime);
        }
      } catch (error) {
        console.error('Error initializing start time:', error);
        // Fallback to localStorage if Firebase fails
        const storedStartTime = localStorage.getItem(`interview_start_time_${interviewId}`);
        if (storedStartTime) {
          setStartTime(parseInt(storedStartTime, 10));
        } else {
          const newStartTime = Date.now();
          setStartTime(newStartTime);
          localStorage.setItem(`interview_start_time_${interviewId}`, newStartTime.toString());
        }
      }
    };

    initializeStartTime();
  }, [interviewId, user]);

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
      // Get section order from interview data (order selected during interview creation)
      const sectionOrder = interview.sectionOrder || [];
      const templateSections = interview?.template?.sections ? Object.values(interview.template.sections) : [];
      
      // Sort sections based on the sectionOrder saved during interview creation
      let sortedSections = [...templateSections];
      if (sectionOrder.length > 0) {
        sortedSections = sectionOrder
          .map(sectionId => templateSections.find((s: any) => s.id === sectionId))
          .filter(Boolean);
        // Add any sections that weren't in sectionOrder
        const remainingSections = templateSections.filter((s: any) => !sectionOrder.includes(s.id));
        sortedSections.push(...remainingSections);
      }
      
      sortedSections.forEach((templateSection: any) => {
        const section = interview.sections[templateSection.id];
        if (section && section.questions) {
          // Sort questions within the section by order
          const sectionQuestions = Object.values(section.questions)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .map((question: any) => ({
              ...question,
              sectionId: section.id,
              sectionOrder: templateSection.order || 0,
            }));
          questions.push(...sectionQuestions);
        }
      });
    }
    return questions;
  })();
  
  // Questions are already sorted by section order and then by question order
  const allQuestions = rawQuestions;
    
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
    // Only mark as saved if there's a rating (rating is mandatory)
    if (question.feedback && question.feedback.rating && question.feedback.rating >= 1 && question.feedback.rating <= 5) {
      return 'saved';
    }
    // Don't show visited status - either it's saved (with rating) or unanswered
    return 'unanswered';
  };

  // Toggle section collapse state
  const toggleSectionCollapse = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  // Timer effect
  useEffect(() => {
    if (startTime === null) return;
    
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Copy code to clipboard
  const copyCodeToClipboard = async () => {
    const codeToCopy = isCodeEditable ? editableCode : currentQuestion?.codeSnippet;
    if (codeToCopy) {
      try {
        await navigator.clipboard.writeText(codeToCopy);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  };

  // Reset code to original
  const resetCode = () => {
    if (currentQuestion?.codeSnippet) {
      setEditableCode(currentQuestion.codeSnippet);
    }
  };

  // Format code with Prettier standalone
  const formatCodeWithPrettier = async (code: string, language: string): Promise<string> => {
    try {
      if (!code || typeof code !== 'string') {
        return code;
      }

      // Map language to prettier parser
      let parser: string = 'babel';
      let plugins: any[] = [babelParser];
      
      if (language === 'javascript' || language === 'typescript') {
        parser = 'babel';
        plugins = [babelParser];
      } else if (language === 'json') {
        parser = 'json';
        plugins = [babelParser];
      } else if (language === 'html') {
        parser = 'html';
        plugins = [babelParser];
      } else if (language === 'css') {
        parser = 'css';
        plugins = [babelParser];
      } else {
        // For unsupported languages, use fallback
        return formatCode(code, language);
      }

      const formatted = await prettierStandalone.format(code, {
        parser,
        plugins,
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
      });

      return formatted;
    } catch (error) {
      // If formatting fails, use fallback formatter
      return formatCode(code, language);
    }
  };

  // Format code (synchronous fallback version)
  const formatCode = (code: string, language: string): string => {
    try {
      if (!code || typeof code !== 'string') {
        return code;
      }

      // For JavaScript/TypeScript
      if (language === 'javascript' || language === 'typescript') {
        let formatted = code;
        let indentLevel = 0;
        
        // First, split multiple statements on same line into separate lines
        // Only add newline if there isn't already one after the semicolon
        formatted = formatted.replace(/;(?=\s*(?!\n)[a-zA-Z0-9_$({])/g, ';\n');
        
        const lines = formatted.split('\n');
        const result: string[] = [];

        for (let line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            result.push('');
            continue;
          }

          // Decrease indent for closing braces
          if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
            indentLevel = Math.max(0, indentLevel - 1);
          }

          // Add line with proper indentation
          result.push('  '.repeat(indentLevel) + trimmed);

          // Increase indent for opening braces
          if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
            indentLevel++;
          } else if (trimmed.includes('{')) {
            const openCount = (trimmed.match(/{/g) || []).length;
            const closeCount = (trimmed.match(/}/g) || []).length;
            indentLevel += openCount - closeCount;
          }
        }

        return result.join('\n');
      }

      // For JSON
      if (language === 'json') {
        const parsed = JSON.parse(code);
        return JSON.stringify(parsed, null, 2);
      }

      // For other languages, return as-is
      return code;
    } catch (error) {
      // If formatting fails, return original code
      return code;
    }
  };

  // Get syntax highlighting
  const getHighlightedCode = (code: string, language: string) => {
    try {
      if (!code || typeof code !== 'string') {
        return '';
      }
      
      const langMap: { [key: string]: string } = {
        javascript: 'javascript',
        typescript: 'typescript',
        python: 'python',
        java: 'java',
        cpp: 'cpp',
        csharp: 'csharp',
        go: 'go',
        rust: 'rust',
        php: 'php',
        ruby: 'ruby',
        swift: 'swift',
        kotlin: 'kotlin',
        html: 'html',
        css: 'css',
        sql: 'sql',
        bash: 'bash',
        json: 'json',
        yaml: 'yaml',
        plaintext: 'plaintext',
      };
      
      const hlLanguage = langMap[language] || 'javascript';
      const highlighted = hljs.highlight(code, { language: hlLanguage, ignoreIllegals: true });
      return highlighted?.value || code;
    } catch (error) {
      try {
        const highlighted = hljs.highlightAuto(code);
        return highlighted?.value || code;
      } catch {
        return code;
      }
    }
  };



  // Execute code
  const executeCode = async () => {
    if (codeLanguage !== 'javascript' && codeLanguage !== 'typescript') {
      setConsoleOutput(['⚠️ Code execution is currently supported for JavaScript/TypeScript only']);
      return;
    }

    setIsExecuting(true);
    setConsoleOutput(['▶️ Running code...']);
    
    try {
      // Capture console output
      const output: string[] = [];
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.log = (...args: any[]) => {
        output.push(args.map(arg => {
          try {
            return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
          } catch {
            return String(arg);
          }
        }).join(' '));
        originalLog(...args);
      };
      
      console.error = (...args: any[]) => {
        output.push('❌ ' + args.map(arg => String(arg)).join(' '));
        originalError(...args);
      };
      
      console.warn = (...args: any[]) => {
        output.push('⚠️ ' + args.map(arg => String(arg)).join(' '));
        originalWarn(...args);
      };
      
      // Execute the code
      const codeToExecute = isCodeEditable ? editableCode : currentQuestion?.codeSnippet;
      const fn = new Function(codeToExecute);
      const result = fn();
      
      if (result !== undefined) {
        output.push('→ ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)));
      }
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      
      setConsoleOutput(output.length > 0 ? output : ['✓ Code executed successfully (no output)']);
    } catch (error: any) {
      setConsoleOutput([`❌ Error: ${error.message}`, `${error.stack || ''}`]);
    } finally {
      setIsExecuting(false);
    }
  };
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Set code language from question or default
    if (currentQuestion?.codeLanguage) {
      setCodeLanguage(currentQuestion.codeLanguage);
    } else {
      setCodeLanguage('javascript');
    }
    
    // Initialize editable code with formatted version
    if (currentQuestion?.codeSnippet) {
      const formattedCode = formatCode(currentQuestion.codeSnippet, currentQuestion?.codeLanguage || 'javascript');
      setEditableCode(formattedCode);
    }
    
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
    // Allow revoking rating by clicking the same rating again
    const newRating = feedback.rating === rating ? 0 : rating;
    setFeedback({ ...feedback, rating: newRating });
    if (!interview || !allQuestions[currentQuestionIndex]) return;

    try {
      const currentInterviewQuestion = allQuestions[currentQuestionIndex];
      const feedbackToSave: any = {
        notes: feedback.notes?.trim() || '',
        rating: newRating,
      };

      await interviewsAPI.saveFeedback(
        interviewId,
        currentInterviewQuestion.sectionId,
        currentInterviewQuestion.id,
        feedbackToSave
      );

      // Update the interview state with the feedback so questions bar reflects the saved status
      const updatedInterview = { ...interview };
      if (updatedInterview.sections && updatedInterview.sections[currentInterviewQuestion.sectionId]) {
        const section = updatedInterview.sections[currentInterviewQuestion.sectionId];
        if (section.questions && section.questions[currentInterviewQuestion.id]) {
          section.questions[currentInterviewQuestion.id] = {
            ...section.questions[currentInterviewQuestion.id],
            feedback: feedbackToSave
          };
        }
      }
      
      setInterview(updatedInterview);

      if (newRating > 0) {
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save feedback:', err);
    }
  };

  // Handle notes change with auto-save debounce
  const handleNotesChange = async (notes: string) => {
    setFeedback({ ...feedback, notes });
    
    if (!interview || !allQuestions[currentQuestionIndex]) return;

    try {
      const currentInterviewQuestion = allQuestions[currentQuestionIndex];
      const feedbackToSave: any = {
        notes: notes?.trim() || '',
        rating: feedback.rating,
      };

      await interviewsAPI.saveFeedback(
        interviewId,
        currentInterviewQuestion.sectionId,
        currentInterviewQuestion.id,
        feedbackToSave
      );

      // Update the interview state with the feedback
      const updatedInterview = { ...interview };
      if (updatedInterview.sections && updatedInterview.sections[currentInterviewQuestion.sectionId]) {
        const section = updatedInterview.sections[currentInterviewQuestion.sectionId];
        if (section.questions && section.questions[currentInterviewQuestion.id]) {
          section.questions[currentInterviewQuestion.id] = {
            ...section.questions[currentInterviewQuestion.id],
            feedback: feedbackToSave
          };
        }
      }
      
      setInterview(updatedInterview);
    } catch (err) {
      console.error('Failed to save notes:', err);
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
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen flex items-center justify-center">
        <Loader message="Loading interview..." />
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
              <button
                onClick={() => setShowSummary(false)}
                className="w-full px-6 py-3 border-2 border-[#3F9AAE]/50 text-[#79C9C5] font-semibold rounded-xl hover:bg-[#3F9AAE]/10 transition-colors"
              >
                Back to Questions
              </button>
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
                    onClick={() => {
                      // Find which section this question belongs to
                      const questionSection = getQuestionSection(question);
                      // If the section is collapsed, expand it
                      if (questionSection && collapsedSections.has((questionSection as any).id)) {
                        const newCollapsed = new Set(collapsedSections);
                        newCollapsed.delete((questionSection as any).id);
                        setCollapsedSections(newCollapsed);
                      }
                      // Navigate to the question
                      setCurrentQuestionIndex(index);
                    }}
                    className="w-9 h-9 rounded-lg font-bold text-xs transition-all flex items-center justify-center flex-shrink-0 border-2 hover:scale-110 relative"
                    title={`Question ${index + 1} - ${questionSection ? (questionSection as any).title : ''}`}
                    style={{
                      borderColor: status === 'saved' ? '#10b981' : status === 'skipped' ? '#ef4444' : sectionColor.hex,
                      backgroundColor: isActive
                        ? sectionColor.hex
                        : status === 'saved'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : status === 'skipped'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : `rgba(${sectionColor.rgb}, 0.15)`,
                      color: isActive ? 'white' : status === 'saved' ? '#10b981' : status === 'skipped' ? '#ef4444' : sectionColor.hex,
                      boxShadow: isActive ? `0 0 12px ${sectionColor.hex}` : 'none',
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

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex relative">
        {/* Sidebar - Questions Navigator */}
        <div 
            className="bg-gradient-to-b from-slate-900 to-slate-950 border-r border-t border-[#3F9AAE]/30 overflow-hidden flex flex-col"
            style={{ width: `${sidebarWidth}px` }}
          >
            <div className="p-6 sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/80 backdrop-blur-sm border-b border-[#3F9AAE]/30 z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#FFE2AF] tracking-widest mb-1">QUESTIONS</h3>
                  <p className="text-xs text-[#79C9C5]/60">{currentQuestionIndex + 1} of {totalQuestions}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#3F9AAE]/50 scrollbar-track-slate-900">
              {interview?.template?.sections && Object.values(interview.template.sections).length > 0 ? (
                (() => {
                  // Sort sections based on the sectionOrder saved during interview creation
                  const sectionOrder = interview.sectionOrder || [];
                  const allSections = [...Object.values(interview.template.sections)] as any[];
                  
                  let sortedSections = allSections;
                  if (sectionOrder.length > 0) {
                    sortedSections = sectionOrder
                      .map(sectionId => allSections.find((s: any) => s.id === sectionId))
                      .filter(Boolean);
                    // Add any sections that weren't in sectionOrder
                    const remainingSections = allSections.filter((s: any) => !sectionOrder.includes(s.id));
                    sortedSections.push(...remainingSections);
                  }
                  
                  return sortedSections;
                })()
                  .map((section: any, sectionIdx: number) => {
                    const sectionColor = getSectionColor(section.id);
                    const sectionQuestions = allQuestions.filter((q: any) => q.sectionId === section.id);
                    const ratedQuestions = sectionQuestions.filter((q: any) => q.feedback?.rating && q.feedback.rating >= 1 && q.feedback.rating <= 5);
                    
                    return (
                      <div key={section.id} className="space-y-2">
                        {/* Section Header */}
                        <button
                          onClick={() => toggleSectionCollapse(section.id)}
                          className="w-full px-3 py-2 rounded-lg border transition-all hover:shadow-md" 
                          style={{
                            borderColor: sectionColor.hex,
                            backgroundColor: `rgba(${sectionColor.rgb}, 0.08)`
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: sectionColor.hex }}
                            />
                            <p className="text-xs font-bold text-white truncate flex-1 text-left">
                              {section.title}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {ratedQuestions.length === sectionQuestions.length ? (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40">
                                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs font-bold text-emerald-400">{ratedQuestions.length}/{sectionQuestions.length}</span>
                                </div>
                              ) : (
                                <span className="text-xs font-semibold" style={{ color: sectionColor.hex }}>
                                  {ratedQuestions.length}/{sectionQuestions.length}
                                </span>
                              )}
                            </div>
                            <svg 
                              className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
                                collapsedSections.has(section.id) ? 'rotate-0' : 'rotate-180'
                              }`}
                              style={{ color: sectionColor.hex }}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                        </button>
                        
                        {/* Questions in Section - Collapsible */}
                        {!collapsedSections.has(section.id) && (
                          <div className="space-y-1 ml-2 animate-in fade-in duration-200">
                            {sectionQuestions.map((question: any, questionIdx: number) => {
                              const globalIndex = allQuestions.findIndex((q: any) => q.id === question.id);
                              const status = getQuestionStatus(question);
                              const isCurrentQuestion = globalIndex === currentQuestionIndex;
                              
                              return (
                                <button
                                  key={question.id}
                                  onClick={() => {
                                    // If section is collapsed, expand it
                                    if (collapsedSections.has(section.id)) {
                                      const newCollapsed = new Set(collapsedSections);
                                      newCollapsed.delete(section.id);
                                      setCollapsedSections(newCollapsed);
                                    }
                                    // Then navigate to the question
                                    setCurrentQuestionIndex(globalIndex);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all border border-transparent hover:border-[#3F9AAE]/50 ${
                                    isCurrentQuestion
                                      ? 'bg-gradient-to-r from-[#3F9AAE]/30 to-[#79C9C5]/20 border-[#3F9AAE]/50'
                                      : 'hover:bg-slate-800/50'
                                  }`}
                                  title={`Q${globalIndex + 1}: ${question.text}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="flex items-center justify-center min-w-6 h-6 rounded-full font-bold text-xs flex-shrink-0" style={{
                                      backgroundColor: status === 'saved' ? '#10b981' : isCurrentQuestion ? sectionColor.hex : `rgba(${sectionColor.rgb}, 0.2)`,
                                      color: status === 'saved' ? 'white' : isCurrentQuestion ? 'white' : sectionColor.hex,
                                      border: `2px solid ${status === 'saved' ? '#10b981' : isCurrentQuestion ? sectionColor.hex : `rgba(${sectionColor.rgb}, 0.4)`}`
                                    }}>
                                      {status === 'saved' ? '✓' : status === 'skipped' ? '⊘' : globalIndex + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-semibold ${
                                        status === 'saved' ? 'text-emerald-400' : isCurrentQuestion ? 'text-[#FFE2AF]' : 'text-[#79C9C5]'
                                      }`}
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: sidebarWidth > 350 ? 2 : 1,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        wordBreak: 'break-word'
                                      }}>
                                        {question.text}
                                      </p>
                                      {question.codeSnippet && (
                                        <p className="text-xs text-[#3F9AAE]/60 mt-0.5">📄 Has code</p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-[#79C9C5]/50">No sections available</p>
                </div>
              )}
            </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          className={`w-1 bg-gradient-to-b from-transparent via-[#3F9AAE]/50 to-transparent hover:via-[#3F9AAE] cursor-col-resize transition-colors ${
            isResizing ? 'via-[#3F9AAE]' : ''
          }`}
          title="Drag to resize sidebar"
        />

        {/* Main Question Content */}
        <div className="flex-1 flex items-center justify-center py-12 px-4 overflow-y-auto">
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
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#79C9C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <p className="text-[#79C9C5] text-sm font-bold tracking-wide">CODE PLAYGROUND</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Run Button - Only for JS/TS */}
                        {(codeLanguage === 'javascript' || codeLanguage === 'typescript') && (
                          <button
                            onClick={executeCode}
                            disabled={isExecuting}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/40 transition-all disabled:opacity-50"
                            title="Run code"
                          >
                            {isExecuting ? (
                              <>
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Running...
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                                Run
                              </>
                            )}
                          </button>
                        )}

                        {/* Edit Toggle */}
                        <button
                          onClick={() => setIsCodeEditable(!isCodeEditable)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            isCodeEditable
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                              : 'bg-slate-700/80 text-[#79C9C5] border-[#3F9AAE]/30 hover:bg-slate-600/80'
                          }`}
                          title="Toggle edit mode"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {isCodeEditable ? 'Editing' : 'Edit'}
                        </button>

                        {/* Reset Button */}
                        {isCodeEditable && (
                          <button
                            onClick={resetCode}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/40 transition-all"
                            title="Reset to original code"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset
                          </button>
                        )}

                        {/* Language Selector */}
                        <select
                          value={codeLanguage}
                          onChange={(e) => setCodeLanguage(e.target.value)}
                          className="px-3 py-1.5 bg-slate-700/80 text-[#79C9C5] text-xs font-semibold rounded-lg border border-[#3F9AAE]/30 focus:outline-none focus:ring-2 focus:ring-[#3F9AAE]/50 cursor-pointer"
                          title={`Current language: ${codeLanguage}`}
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                          <option value="csharp">C#</option>
                          <option value="go">Go</option>
                          <option value="rust">Rust</option>
                          <option value="php">PHP</option>
                          <option value="ruby">Ruby</option>
                          <option value="swift">Swift</option>
                          <option value="kotlin">Kotlin</option>
                          <option value="html">HTML</option>
                          <option value="css">CSS</option>
                          <option value="sql">SQL</option>
                          <option value="bash">Bash</option>
                          <option value="json">JSON</option>
                          <option value="yaml">YAML</option>
                          <option value="plaintext">Plain Text</option>
                        </select>
                        
                        {/* Copy Button */}
                        <button
                          onClick={copyCodeToClipboard}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#3F9AAE]/20 hover:bg-[#3F9AAE]/30 text-[#79C9C5] text-xs font-semibold rounded-lg border border-[#3F9AAE]/30 transition-all"
                          title="Copy code to clipboard"
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Code Editor */}
                    <div className="bg-slate-950/95 rounded-xl border-2 border-[#3F9AAE]/20 shadow-2xl overflow-hidden">
                      {/* Editor Header */}
                      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2 border-b border-[#3F9AAE]/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                          </div>
                          <span className="text-[#79C9C5]/60 text-xs font-mono ml-3">
                            code.{codeLanguage === 'javascript' ? 'js' : codeLanguage === 'typescript' ? 'ts' : codeLanguage === 'python' ? 'py' : codeLanguage === 'java' ? 'java' : codeLanguage === 'cpp' ? 'cpp' : codeLanguage === 'csharp' ? 'cs' : codeLanguage === 'go' ? 'go' : codeLanguage === 'rust' ? 'rs' : codeLanguage === 'php' ? 'php' : codeLanguage === 'ruby' ? 'rb' : codeLanguage === 'swift' ? 'swift' : codeLanguage === 'kotlin' ? 'kt' : codeLanguage === 'html' ? 'html' : codeLanguage === 'css' ? 'css' : codeLanguage === 'sql' ? 'sql' : codeLanguage === 'bash' ? 'sh' : codeLanguage === 'json' ? 'json' : codeLanguage === 'yaml' ? 'yml' : 'txt'}
                          </span>
                        </div>
                        <span className="text-[#79C9C5]/40 text-xs font-medium">
                          {isCodeEditable ? '● Modified' : '○ Read-only'}
                        </span>
                      </div>
                      
                      {/* Code Content with Line Numbers */}
                      <div className="flex max-h-96">
                        {/* Line Numbers */}
                        <div className="bg-slate-900/50 text-[#79C9C5]/30 text-right py-4 px-3 select-none border-r border-[#3F9AAE]/10 font-mono text-sm leading-6 overflow-y-auto">
                          {(isCodeEditable ? editableCode : currentQuestion.codeSnippet).split('\n').map((_: string, index: number) => (
                            <div key={index}>
                              {index + 1}
                            </div>
                          ))}
                        </div>
                        
                        {/* Code */}
                        <div className="flex-1 overflow-y-auto overflow-x-auto">
                          {isCodeEditable ? (
                            <textarea
                              value={editableCode}
                              onChange={(e) => setEditableCode(e.target.value)}
                              className="w-full h-full bg-transparent text-[#79C9C5] font-mono text-sm leading-6 p-4 focus:outline-none resize-none"
                              style={{ tabSize: 2, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                              spellCheck={false}
                            />
                          ) : (
                            <div className="p-4 overflow-x-auto overflow-y-auto">
                              <pre className="m-0 bg-transparent">
                                <code
                                  className={`font-mono text-sm leading-6 hljs language-${codeLanguage}`}
                                  style={{ 
                                    tabSize: 2, 
                                    display: 'block', 
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    backgroundColor: 'transparent',
                                    backgroundImage: 'none'
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: getHighlightedCode(formatCode(currentQuestion.codeSnippet, codeLanguage), codeLanguage)
                                  }}
                                />
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Console Output */}
                    {consoleOutput.length > 0 && (
                      <div className="mt-4 bg-slate-950/95 rounded-xl border-2 border-cyan-500/20 shadow-2xl overflow-hidden">
                        {/* Console Header */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2 border-b border-cyan-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-cyan-400 text-xs font-semibold">OUTPUT CONSOLE</span>
                          </div>
                          <button
                            onClick={() => setConsoleOutput([])}
                            className="text-[#79C9C5]/40 hover:text-[#79C9C5]/70 text-xs transition-colors"
                            title="Clear console"
                          >
                            Clear
                          </button>
                        </div>
                        
                        {/* Console Content */}
                        <div className="p-4 font-mono text-sm max-h-[200px] overflow-y-auto space-y-1">
                          {consoleOutput.map((line, index) => (
                            <div
                              key={index}
                              className={`text-sm leading-relaxed ${
                                line.includes('❌')
                                  ? 'text-red-400'
                                  : line.includes('⚠️')
                                  ? 'text-amber-400'
                                  : line.includes('▶️')
                                  ? 'text-cyan-400'
                                  : line.includes('✓')
                                  ? 'text-emerald-400'
                                  : line.includes('→')
                                  ? 'text-[#79C9C5]'
                                  : 'text-[#79C9C5]'
                              }`}
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Footer Info */}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[#79C9C5]/50 text-xs italic">
                        Language: {codeLanguage.charAt(0).toUpperCase() + codeLanguage.slice(1)}
                      </p>
                      {isCodeEditable && (
                        <p className="text-amber-400/70 text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                          </svg>
                          Changes are for reference only and won't be saved
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {currentQuestion?.expectedAnswer && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-cyan-400 text-sm font-bold tracking-wide">EXPECTED ANSWER / KEY POINTS</p>
                    </div>
                    <div className="bg-cyan-500/10 p-6 rounded-xl border border-cyan-500/20">
                      <p className="text-cyan-200/90 text-sm leading-relaxed">{currentQuestion.expectedAnswer}</p>
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
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Record your observations and feedback..."
                      disabled={loadingFeedback}
                      className="w-full rounded-xl border-2 border-[#3F9AAE]/30 focus:border-[#3F9AAE] shadow-lg focus:outline-none focus:ring-2 focus:ring-[#3F9AAE]/50 bg-slate-700/50 text-white placeholder-slate-400 px-6 py-4 text-lg transition-all disabled:opacity-50"
                      rows={6}
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-bold text-[#FFE2AF] mb-6 tracking-wide">
                      ⭐ PERFORMANCE RATING (Click to select or deselect)
                    </label>
                    <div className="flex gap-4 justify-center">
                      {[1, 2, 3, 4, 5].map((rating) => {
                        const isSelected = feedback.rating === rating;
                        const ratingColor = 
                          rating === 1 ? '#EF4444' :
                          rating === 2 ? '#F97316' :
                          rating === 3 ? '#FFE2AF' :
                          rating === 4 ? '#84CC16' :
                          '#10B981';
                        
                        return (
                          <button
                            key={rating}
                            onClick={() => handleRatingClick(rating)}
                            disabled={loadingFeedback}
                            className={`relative group flex flex-col items-center gap-2 transition-all duration-300 transform ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                          >
                            <div className={`w-16 h-16 rounded-2xl font-black text-2xl transition-all duration-300 flex items-center justify-center border-3 ${
                              isSelected
                                ? `bg-gradient-to-br from-white to-${ratingColor}/30 border-white text-white shadow-2xl`
                                : `bg-slate-700/50 text-slate-400 border-slate-600 hover:border-slate-500 hover:text-${ratingColor}`
                            } disabled:opacity-50`}
                            style={isSelected ? {
                              background: `linear-gradient(135deg, ${ratingColor}30, ${ratingColor}10)`,
                              borderColor: ratingColor,
                              color: ratingColor,
                              boxShadow: `0 0 30px ${ratingColor}40`
                            } : {
                              borderColor: '#4B5563'
                            }}>
                              {rating}
                            </div>
                            <span className={`text-xs font-bold tracking-wide transition-colors ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {rating === 1 && 'Poor'}
                              {rating === 2 && 'Fair'}
                              {rating === 3 && 'Good'}
                              {rating === 4 && 'Very Good'}
                              {rating === 5 && 'Excellent'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-12 pb-24">
                {/* Content goes here */}
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
        </div>
      </div>

      {/* Completion Review Modal */}
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
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white px-6 py-3 rounded-lg shadow-lg border border-[#FFE2AF]/30 flex items-center gap-3 animate-in slide-in-from-top fade-in duration-300">
            <span className="text-2xl">📍</span>
            <div>
              <p className="font-bold text-sm">{sectionNotificationText.replace('📍 ', '')}</p>
              <p className="text-xs text-[#FFE2AF]/80">New Section</p>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      {currentQuestion && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-6 px-6 border-t border-[#3F9AAE]/20 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
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
                  setShowCompletionModal(true);
                } else {
                  setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1));
                }
              }}
              className="flex items-center gap-2 px-6 py-3 border-2 border-[#3F9AAE]/50 text-[#79C9C5] rounded-lg hover:bg-[#3F9AAE]/10 font-bold transition-all"
              title="Move to next question"
            >
              {currentQuestionIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
