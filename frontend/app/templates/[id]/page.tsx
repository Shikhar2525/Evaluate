'use client';

import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { templatesAPI, objectToArray } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import RichTextEditor from '@/lib/components/rich-text-editor';
import RichTextDisplay from '@/lib/components/rich-text-display';
import Loader from '@/lib/components/loader';

export default function TemplateDetailPage() {
  useLayoutEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);
  const { user, loading } = useAuth();
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<any>(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editQuestionValues, setEditQuestionValues] = useState<any>({});
  const [newSection, setNewSection] = useState({ title: '', codeLanguage: 'javascript' });
  const [newQuestion, setNewQuestion] = useState({ text: '', codeSnippet: '', difficulty: 'easy', expectedAnswer: '' });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [originalQuestion, setOriginalQuestion] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteSectionConfirm, setShowDeleteSectionConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
      return;
    }

    if (!user || !templateId) return;

    const fetchTemplate = async () => {
      try {
        setTemplateLoading(true);
        const response = await templatesAPI.get(templateId);
        setTemplate(response.data);
      } catch (err) {
        console.error('Failed to load template:', err);
        router.push('/templates');
      } finally {
        setTemplateLoading(false);
      }
    };

    fetchTemplate();
  }, [user, templateId, router]);

  // Validate question text and difficulty in real-time (only if user has made changes)
  useEffect(() => {
    if (editingQuestion && originalQuestion) {
      // Only validate if user has actually modified the field, not just opened it
      const textChanged = editQuestionValues.text !== undefined && editQuestionValues.text !== originalQuestion.text;
      const difficultyChanged = editQuestionValues.difficulty !== undefined && editQuestionValues.difficulty !== originalQuestion.difficulty;
      
      if (textChanged || difficultyChanged) {
        if (!editQuestionValues.text?.trim()) {
          setValidationError('Question text cannot be empty');
        } else if (textChanged && !editQuestionValues.difficulty?.trim()) {
          setValidationError('Please select a difficulty level');
        } else if (difficultyChanged && !editQuestionValues.difficulty?.trim()) {
          setValidationError('Please select a difficulty level');
        } else {
          setValidationError(null);
        }
      } else {
        setValidationError(null);
      }
    }
  }, [editQuestionValues.text, editQuestionValues.difficulty, editingQuestion, originalQuestion]);

  const handleUpdateTemplate = async (field: string, value: string) => {
    try {
      await templatesAPI.update(templateId, { [field]: value });
      setTemplate({ ...template, [field]: value });
      setEditing(null);
    } catch (err) {
      console.error('Failed to update template:', err);
    }
  };

  const handleAddSection = async () => {
    if (!newSection.title.trim()) {
      setValidationError('Please enter a section title');
      return;
    }

    try {
      setValidationError(null);
      const response = await templatesAPI.addSection(templateId, newSection);
      if (!response.data) {
        throw new Error('No data returned from server');
      }
      setTemplate({
        ...template,
        sections: { ...template.sections, [response.data.id]: response.data },
      });
      setNewSection({ title: '', codeLanguage: 'javascript' });
    } catch (err: any) {
      console.error('Failed to add section:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add section';
      setValidationError(errorMsg);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      console.log('Attempting to delete section:', sectionId);
      await templatesAPI.deleteSection(templateId, sectionId);
      const updatedSections = { ...template.sections };
      delete updatedSections[sectionId];
      setTemplate({
        ...template,
        sections: updatedSections,
      });
      console.log('Section deleted successfully');
    } catch (err: any) {
      console.error('Delete section error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config?.url,
      });
      alert(`Failed to delete section: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAddQuestion = async (sectionId: string) => {
    if (!newQuestion.text.trim()) return;

    try {
      const response = await templatesAPI.addQuestion(templateId, sectionId, newQuestion);
      setTemplate({
        ...template,
        sections: {
          ...template.sections,
          [sectionId]: {
            ...template.sections[sectionId],
            questions: {
              ...(template.sections[sectionId].questions || {}),
              [response.data.id]: response.data,
            },
          },
        },
      });
      setNewQuestion({ text: '', codeSnippet: '', difficulty: 'easy', expectedAnswer: '' });
    } catch (err) {
      console.error('Failed to add question:', err);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      console.log('Attempting to delete question:', questionId);
      // Find the section containing this question
      let foundSectionId = null;
      for (const [sectionId, section] of Object.entries(template.sections)) {
        const questions = objectToArray((section as any).questions);
        if (questions.some((q: any) => q.id === questionId)) {
          foundSectionId = sectionId;
          break;
        }
      }
      
      if (!foundSectionId) throw new Error('Section not found');
      
      const response = await templatesAPI.deleteQuestion(templateId, foundSectionId, questionId);
      console.log('Delete response:', response);
      
      const updatedQuestions = { ...template.sections[foundSectionId].questions };
      delete updatedQuestions[questionId];
      
      setTemplate({
        ...template,
        sections: {
          ...template.sections,
          [foundSectionId]: {
            ...template.sections[foundSectionId],
            questions: updatedQuestions,
          },
        },
      });
      setShowDeleteConfirm(null);
    } catch (err: any) {
      console.error('Delete question error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config?.url,
      });
      alert(`Failed to delete question: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleUpdateQuestion = async (questionId: string) => {
    try {
      // Find the section containing this question
      let foundSectionId = null;
      for (const [sectionId, section] of Object.entries(template.sections)) {
        const questions = objectToArray((section as any).questions);
        if (questions.some((q: any) => q.id === questionId)) {
          foundSectionId = sectionId;
          break;
        }
      }
      
      if (!foundSectionId) throw new Error('Section not found');
      
      await templatesAPI.updateQuestion(templateId, foundSectionId, questionId, editQuestionValues);
      setTemplate({
        ...template,
        sections: {
          ...template.sections,
          [foundSectionId]: {
            ...template.sections[foundSectionId],
            questions: {
              ...template.sections[foundSectionId].questions,
              [questionId]: {
                ...template.sections[foundSectionId].questions[questionId],
                ...editQuestionValues,
              },
            },
          },
        },
      });
      setEditingQuestion(null);
      setEditQuestionValues({});
      setValidationError(null);
    } catch (err: any) {
      console.error('Failed to update question:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update question';
      setValidationError(errorMsg);
    }
  };

  const toggleQuestionExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const copyCodeSnippet = (code: string, questionId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(questionId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleLogout = useCallback(() => {
    clearAuth();
    router.push('/sign-in');
  }, [clearAuth, router]);

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader message="Loading template..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-500/25 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/2 -right-48 w-96 h-96 bg-gradient-to-br from-blue-500/25 to-purple-500/25 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header with Back Button and Template Name */}
      <div className="relative border-b border-cyan-500/20 bg-gradient-to-r from-white/8 via-white/4 to-transparent backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cyan-500/20 transition-all text-cyan-300 font-medium"
            title="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </button>
          <div className="h-8 w-px bg-cyan-500/30" />
          <div className="flex-1">
            <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Edit Template</p>
            {editing === 'name' ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  type="text"
                  value={editValues.name || template.name}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateTemplate('name', editValues.name);
                    } else if (e.key === 'Escape') {
                      setEditing(null);
                    }
                  }}
                  className="px-4 py-2 bg-white/10 border border-cyan-500/40 rounded-lg text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm"
                />
                <button
                  onClick={() => handleUpdateTemplate('name', editValues.name)}
                  className="px-3 py-2 bg-green-600/50 hover:bg-green-600 rounded-lg text-sm text-white transition-all font-bold"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-all font-bold backdrop-blur-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h1
                onClick={() => {
                  setEditing('name');
                  setEditValues({ ...editValues, name: template.name });
                }}
                className="text-3xl font-black bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
                title="Click to edit template name"
              >
                {template.name}
              </h1>
            )}
          </div>
        </div>
      </div>

      <main className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="mb-12 bg-gradient-to-br from-white/8 to-white/3 rounded-2xl p-8 border border-cyan-500/20 shadow-2xl backdrop-blur-2xl">
          <h2 className="text-sm font-bold text-cyan-300 mb-4 uppercase tracking-widest">Description</h2>
          {editing === 'description' ? (
            <div className="space-y-3">
              <RichTextEditor
                value={editValues.description || template.description || ''}
                onChange={(value) => setEditValues({ ...editValues, description: value })}
                placeholder="Add optional description for this template..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-bold hover:bg-white/20 transition-all backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateTemplate('description', editValues.description)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-cyan-500/40 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                setEditing('description');
                setEditValues({ description: template.description || '' });
              }}
              className="min-h-20 p-4 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all border border-cyan-500/30 hover:border-cyan-400/50 flex items-center text-cyan-300 backdrop-blur-sm"
            >
              {template.description ? (
                <RichTextDisplay content={template.description} className="text-white/90" />
              ) : (
                <p className="text-white/50 italic">Click here to add description...</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6 mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Sections</h2>
          {objectToArray(template.sections).length > 0 ? (
            objectToArray(template.sections).map((section: any) => (
              <div key={section.id} className="bg-gradient-to-br from-white/8 to-white/3 rounded-2xl shadow-2xl border border-cyan-500/20 overflow-hidden hover:shadow-cyan-500/30 hover:border-cyan-400/40 transition-all duration-300 backdrop-blur-2xl">
                <div
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent cursor-pointer hover:from-cyan-500/15 hover:via-blue-500/10 transition-all duration-200 relative"
                >
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 translate-x-full group-hover:translate-x-0"></div>

                  <div className="relative flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-sm font-black flex-shrink-0 shadow-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white">{section.title}</h3>
                        {section.codeLanguage && (
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wide">
                            {section.codeLanguage}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-cyan-300/80 ml-11">{objectToArray(section.questions).length || 0} questions</p>
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteSectionConfirm(showDeleteSectionConfirm === section.id ? null : section.id);
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-cyan-300 hover:text-red-400"
                        title="Delete section"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <div className={`p-2 text-cyan-300 transition-transform duration-300 ${expandedSection === section.id ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedSection === section.id && (
                  <div className="p-6 space-y-4">
                    {objectToArray(section.questions).length > 0 ? (
                      objectToArray(section.questions).map((question: any, index: number) => (
                        <div key={question.id} className="bg-gradient-to-br from-slate-700/50 to-slate-700/30 rounded-xl border border-[#3F9AAE]/30 overflow-hidden hover:shadow-xl hover:shadow-[#3F9AAE]/10 transition-all backdrop-blur-sm">
                          {editingQuestion === question.id ? (
                            <div className="p-6 bg-slate-800/50 border-b border-[#3F9AAE]/20 space-y-4 backdrop-blur-sm">
                              {validationError && (
                                <div className="p-3 bg-[#F96E5B]/20 border border-[#F96E5B]/50 rounded-lg flex items-start gap-2">
                                  <svg className="w-5 h-5 text-[#F96E5B] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-sm text-[#FFE2AF]">{validationError}</p>
                                </div>
                              )}
                              <div>
                                <label className="block text-xs font-bold text-transparent bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] bg-clip-text mb-2 uppercase tracking-widest">Editing Question #{index + 1}</label>
                                <input
                                  autoFocus
                                  type="text"
                                  value={editQuestionValues.text !== undefined ? editQuestionValues.text : ''}
                                  onChange={(e) => setEditQuestionValues({ ...editQuestionValues, text: e.target.value })}
                                  className="w-full px-4 py-3 border border-[#3F9AAE]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F9AAE] bg-slate-700/50 text-white placeholder-slate-400"
                                  placeholder="Question text"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#FFE2AF] mb-2 uppercase tracking-wider">Difficulty Level</label>
                                <select
                                  value={editQuestionValues.difficulty !== undefined ? editQuestionValues.difficulty : ''}
                                  onChange={(e) => setEditQuestionValues({ ...editQuestionValues, difficulty: e.target.value })}
                                  className="w-full px-3 py-2 border border-[#3F9AAE]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F9AAE] bg-slate-700/50 text-white"
                                >
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#FFE2AF] mb-2 uppercase tracking-wider">Code Snippet (Optional)</label>
                                <textarea
                                  value={editQuestionValues.codeSnippet !== undefined ? editQuestionValues.codeSnippet : ''}
                                  onChange={(e) => setEditQuestionValues({ ...editQuestionValues, codeSnippet: e.target.value })}
                                  className="w-full px-3 py-2 border border-[#3F9AAE]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F9AAE] bg-slate-700/50 text-white"
                                  placeholder="Code snippet (optional)"
                                  rows={2}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#FFE2AF] mb-2 uppercase tracking-wider">Expected Answer (Optional)</label>
                                <textarea
                                  value={editQuestionValues.expectedAnswer !== undefined ? editQuestionValues.expectedAnswer : ''}
                                  onChange={(e) => setEditQuestionValues({ ...editQuestionValues, expectedAnswer: e.target.value })}
                                  className="w-full px-3 py-2 border border-[#3F9AAE]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F9AAE] bg-slate-700/50 text-white"
                                  placeholder="Expected answer (optional)"
                                  rows={2}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    handleUpdateQuestion(question.id);
                                    setTimeout(() => {
                                      setEditQuestionValues({});
                                    }, 100);
                                  }}
                                  disabled={validationError !== null}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    validationError
                                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white hover:shadow-lg hover:shadow-[#3F9AAE]/50'
                                  }`}
                                  title={validationError ? `Cannot save: ${validationError}` : 'Save changes'}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingQuestion(null);
                                    setEditQuestionValues({});
                                    setOriginalQuestion(null);
                                    setValidationError(null);
                                  }}
                                  className="flex-1 px-3 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => {
                                const hasExpandableContent = question.codeSnippet || question.expectedAnswer;
                                if (hasExpandableContent) {
                                  toggleQuestionExpanded(question.id);
                                }
                              }}
                              className={`p-4 transition-colors border-b border-[#3F9AAE]/30 bg-gradient-to-r from-slate-700/50 to-slate-700/30 ${
                                (question.codeSnippet || question.expectedAnswer) ? 'cursor-pointer hover:bg-slate-700/70' : 'cursor-default'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#3F9AAE] to-[#F96E5B] text-white text-sm font-bold rounded-full flex-shrink-0 mt-0.5">
                                    {index + 1}
                                  </span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-white font-semibold">{question.text}</p>
                                      {question.difficulty && (
                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full border whitespace-nowrap ${
                                          question.difficulty.toLowerCase() === 'easy' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
                                          question.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                                          'bg-red-500/20 text-red-300 border-red-500/40'
                                        }`}>
                                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingQuestion(question.id);
                                      setOriginalQuestion({
                                        text: question.text,
                                        difficulty: question.difficulty,
                                        codeSnippet: question.codeSnippet,
                                        expectedAnswer: question.expectedAnswer,
                                      });
                                      setEditQuestionValues({
                                        text: question.text,
                                        difficulty: question.difficulty,
                                        codeSnippet: question.codeSnippet,
                                        expectedAnswer: question.expectedAnswer,
                                      });
                                      setValidationError(null);
                                    }}
                                    className="p-2 hover:bg-[#3F9AAE]/20 rounded-lg transition-colors text-[#79C9C5] hover:text-[#FFE2AF]"
                                    title="Edit question"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <div className="relative">
                                    {showDeleteConfirm === question.id ? (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteQuestion(question.id);
                                          }}
                                          className="px-2 py-1 text-xs bg-[#F96E5B] text-white rounded hover:bg-[#F96E5B]/80 transition-colors font-medium"
                                          title="Confirm delete"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowDeleteConfirm(null);
                                          }}
                                          className="px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded hover:bg-slate-600 transition-colors"
                                          title="Cancel delete"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowDeleteConfirm(question.id);
                                        }}
                                        className="p-2 hover:bg-[#F96E5B]/20 rounded-lg transition-colors text-[#79C9C5] hover:text-[#F96E5B]"
                                        title="Delete question"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                  {(question.codeSnippet || question.expectedAnswer) ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleQuestionExpanded(question.id);
                                      }}
                                      className="p-2 hover:bg-[#3F9AAE]/20 rounded-lg transition-colors text-[#79C9C5] hover:text-[#FFE2AF]"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedQuestions.has(question.id) ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'} />
                                      </svg>
                                    </button>
                                  ) : (
                                    <div className="p-2 text-slate-600 cursor-default" title="No additional details">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {!editingQuestion && expandedQuestions.has(question.id) && (
                            <div className="p-4 space-y-4 bg-slate-700/30 border-t border-[#3F9AAE]/30">
                              {question.codeSnippet && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-[#FFE2AF] uppercase tracking-wider">Code Example</p>
                                    <button
                                      onClick={() => copyCodeSnippet(question.codeSnippet, question.id)}
                                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                        copiedCode === question.id
                                          ? 'bg-[#79C9C5]/20 text-[#79C9C5]'
                                          : 'bg-[#3F9AAE]/40 text-[#79C9C5] hover:bg-[#3F9AAE]/60'
                                      }`}
                                    >
                                      {copiedCode === question.id ? '✓ Copied' : 'Copy'}
                                    </button>
                                  </div>
                                  <div className="p-4 bg-slate-900 rounded-lg text-slate-100 font-mono text-sm overflow-x-auto max-h-60 border border-[#3F9AAE]/30">
                                    <pre className="whitespace-pre-wrap break-words">{question.codeSnippet}</pre>
                                  </div>
                                </div>
                              )}

                              {question.expectedAnswer && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-[#FFE2AF] uppercase tracking-wider">Expected Answer</p>
                                  <div className="p-4 bg-slate-700/50 rounded-lg border border-[#3F9AAE]/30">
                                    <p className="text-[#79C9C5] text-sm whitespace-pre-wrap">{question.expectedAnswer}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-[#79C9C5] text-sm">No questions yet. Add one below!</p>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-cyan-500/30">
                      <h4 className="text-sm font-bold text-cyan-300 mb-4 uppercase tracking-widest">Add New Question</h4>
                      <div className="bg-gradient-to-br from-white/8 to-white/3 rounded-2xl p-6 border border-cyan-500/20 space-y-4 backdrop-blur-2xl">
                        <div>
                          <label className="block text-xs font-bold text-cyan-300 mb-3 uppercase tracking-widest">Question Text <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            placeholder="Enter the question..."
                            value={newQuestion.text}
                            onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                            className="w-full px-4 py-3 border border-cyan-500/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white/5 text-white placeholder-cyan-400/40 backdrop-blur-sm transition-all font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-cyan-300 mb-3 uppercase tracking-widest">Difficulty Level <span className="text-red-400">*</span></label>
                            <select
                              value={newQuestion.difficulty}
                              onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                              className="w-full px-4 py-3 border border-cyan-500/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white/5 text-white backdrop-blur-sm transition-all font-medium"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-cyan-300 mb-3 uppercase tracking-widest">Code Snippet (Optional)</label>
                          <textarea
                            placeholder="Paste code example here..."
                            value={newQuestion.codeSnippet}
                            onChange={(e) => setNewQuestion({ ...newQuestion, codeSnippet: e.target.value })}
                            className="w-full px-4 py-3 border border-cyan-500/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white/5 text-white placeholder-cyan-400/40 resize-vertical backdrop-blur-sm transition-all font-medium"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-cyan-300 mb-3 uppercase tracking-widest">Expected Answer (Optional)</label>
                          <textarea
                            placeholder="Enter the ideal or expected answer..."
                            value={newQuestion.expectedAnswer}
                            onChange={(e) => setNewQuestion({ ...newQuestion, expectedAnswer: e.target.value })}
                            className="w-full px-4 py-3 border border-cyan-500/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white/5 text-white placeholder-cyan-400/40 resize-vertical backdrop-blur-sm transition-all font-medium"
                            rows={3}
                          />
                        </div>

                        <button
                          onClick={() => handleAddQuestion(section.id)}
                          disabled={!newQuestion.text.trim()}
                          className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Question
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-white/8 to-white/3 rounded-2xl border border-cyan-500/20 backdrop-blur-2xl">
              <p className="text-cyan-300/80 font-semibold">No sections yet. Create one below.</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-gradient-to-br from-white/8 via-white/5 to-cyan-500/10 rounded-2xl shadow-2xl border border-cyan-500/20 p-8 backdrop-blur-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-black shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Add New Section</h3>
          </div>
          {validationError && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg flex items-start gap-2 backdrop-blur-sm">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-300">{validationError}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-cyan-300 mb-2 uppercase tracking-wide">Section Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="e.g., React Fundamentals, JavaScript Basics..."
                value={newSection.title}
                onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                className="w-full px-4 py-3 border border-cyan-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white/5 text-white placeholder-cyan-400/40 backdrop-blur-sm transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-cyan-300 mb-2 uppercase tracking-wide">Default Code Language <span className="text-red-400">*</span></label>
              <select
                value={newSection.codeLanguage}
                onChange={(e) => setNewSection({ ...newSection, codeLanguage: e.target.value })}
                className="w-full px-4 py-3 border border-cyan-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white/5 text-white backdrop-blur-sm transition-all font-medium"
              >
                <option value="">Select a Language</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="ruby">Ruby</option>
                <option value="php">PHP</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
                <option value="scala">Scala</option>
                <option value="nodejs">Node.js</option>
                <option value="react">React</option>
                <option value="angular">Angular</option>
                <option value="vue">Vue.js</option>
                <option value="sql">SQL</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="bash">Bash</option>
              </select>
            </div>
            <button
              onClick={handleAddSection}
              disabled={!newSection.title.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Section
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Section Delete Modal - Outside Accordion */}
      {showDeleteSectionConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm" 
            onClick={() => setShowDeleteSectionConfirm(null)}
          />
          <div 
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-white/10 to-white/5 border border-red-500/30 rounded-2xl shadow-2xl z-[9999] min-w-96 backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-red-500/30">
              <p className="text-white font-bold text-lg">Delete Section?</p>
              <p className="text-red-300 text-sm mt-1">This will remove the section and all its questions</p>
            </div>
            <div className="flex gap-2 p-6 justify-end">
              <button
                onClick={() => setShowDeleteSectionConfirm(null)}
                className="px-4 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-bold backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteSection(showDeleteSectionConfirm);
                  setShowDeleteSectionConfirm(null);
                }}
                className="px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/40 transition-all font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
