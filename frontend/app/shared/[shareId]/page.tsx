'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { sharedTemplatesAPI, objectToArray } from '@/lib/api';
import Loader from '@/lib/components/loader';
import RichTextDisplay from '@/lib/components/rich-text-display';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import Link from 'next/link';

export default function SharedTemplatePreviewPage() {
  useLayoutEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const shareId = params.shareId as string;

  const [template, setTemplate] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [selectedQuestions, setSelectedQuestions] = useState<Map<string, Set<string>>>(new Map());
  const [showCustomization, setShowCustomization] = useState(false);

  useEffect(() => {
    const loadSharedTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await sharedTemplatesAPI.getShared(shareId);
        setTemplate(response.data.template);
        setOwner(response.data.owner);

        // Initialize all sections and questions as selected by default
        const sections = objectToArray(response.data.template.sections);
        const allSectionIds = new Set(sections.map((s: any) => s.id));
        setSelectedSections(allSectionIds);

        const questionsMap = new Map<string, Set<string>>();
        sections.forEach((section: any) => {
          const questions = objectToArray(section.questions);
          questionsMap.set(section.id, new Set(questions.map((q: any) => q.id)));
        });
        setSelectedQuestions(questionsMap);
      } catch (err: any) {
        setError(err.message || 'Failed to load shared template');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      loadSharedTemplate();
    }
  }, [shareId]);

  const handleImportTemplate = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    // Validate that at least one section with at least one question is selected
    const hasSectionsSelected = selectedSections.size > 0;
    const hasQuestionsSelected = Array.from(selectedQuestions.values()).some(
      (questions) => questions.size > 0
    );

    if (!hasSectionsSelected || !hasQuestionsSelected) {
      setImportError('Please select at least one section with questions to import');
      return;
    }

    setImporting(true);
    setImportError(null);

    try {
      // Create a filtered template with only selected sections and questions
      const filteredTemplate = {
        ...template,
        sections: Object.fromEntries(
          Object.entries(template.sections || {}).filter(([sectionId, section]: [string, any]) => {
            if (!selectedSections.has(sectionId)) {
              return false;
            }
            // Filter questions within the section
            if (section.questions) {
              const selectedQs = selectedQuestions.get(sectionId) || new Set();
              section.questions = Object.fromEntries(
                Object.entries(section.questions).filter(
                  ([qId]) => selectedQs.has(qId)
                )
              );
            }
            return true;
          })
        ),
      };

      const response = await sharedTemplatesAPI.import(
        shareId,
        `${template.name} (from ${owner?.firstName || 'User'})`,
        filteredTemplate
      );
      setImported(true);
      setTimeout(() => {
        router.push(`/templates/${response.data.id}`);
      }, 1500);
    } catch (err: any) {
      setImportError(err.message || 'Failed to import template');
    } finally {
      setImporting(false);
    }
  };

  const toggleSectionSelection = (sectionId: string) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(sectionId)) {
      newSelected.delete(sectionId);
      // Also deselect all questions in this section
      selectedQuestions.delete(sectionId);
    } else {
      newSelected.add(sectionId);
      // Auto-select all questions in this section
      const section = template.sections?.[sectionId];
      if (section) {
        const questions = objectToArray(section.questions);
        selectedQuestions.set(sectionId, new Set(questions.map((q: any) => q.id)));
      }
    }
    setSelectedSections(newSelected);
    setSelectedQuestions(new Map(selectedQuestions));
  };

  const toggleQuestionSelection = (sectionId: string, questionId: string) => {
    const questionsInSection = selectedQuestions.get(sectionId) || new Set();
    const newQuestions = new Set(questionsInSection);
    
    if (newQuestions.has(questionId)) {
      newQuestions.delete(questionId);
    } else {
      newQuestions.add(questionId);
    }

    // If all questions are deselected, deselect the section too
    if (newQuestions.size === 0) {
      const newSelected = new Set(selectedSections);
      newSelected.delete(sectionId);
      setSelectedSections(newSelected);
    } else {
      // If this was the first question selected, select the section too
      if (questionsInSection.size === 0) {
        const newSelected = new Set(selectedSections);
        newSelected.add(sectionId);
        setSelectedSections(newSelected);
      }
    }

    selectedQuestions.set(sectionId, newQuestions);
    setSelectedQuestions(new Map(selectedQuestions));
  };

  const formatCode = (code: string, language: string): string => {
    try {
      if (!code || typeof code !== 'string') {
        return code;
      }

      if (language === 'javascript' || language === 'typescript') {
        let formatted = code;
        let indentLevel = 0;
        
        formatted = formatted.replace(/;(?=\s*(?!\n)[a-zA-Z0-9_$({])/g, ';\n');
        
        const lines = formatted.split('\n');
        const result: string[] = [];

        for (let line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            result.push('');
            continue;
          }

          if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
            indentLevel = Math.max(0, indentLevel - 1);
          }

          result.push('  '.repeat(indentLevel) + trimmed);

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

      if (language === 'json') {
        const parsed = JSON.parse(code);
        return JSON.stringify(parsed, null, 2);
      }

      return code;
    } catch (error) {
      return code;
    }
  };

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
      };

      const lang = langMap[language.toLowerCase()] || language;
      const highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      return highlighted;
    } catch (error) {
      return code;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader message="Loading shared template..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-500/25 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/2 -right-48 w-96 h-96 bg-gradient-to-br from-blue-500/25 to-purple-500/25 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="relative">
          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-2xl p-8 max-w-md backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-xl font-bold text-red-300">Error Loading Template</h1>
            </div>
            <p className="text-red-200 mb-6">{error}</p>
            <Link href="/templates" className="block text-center px-4 py-2 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded-lg font-medium transition-all border border-cyan-500/30">
              Back to Templates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-500/25 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '0s' }}></div>
        </div>
        <div className="relative text-center">
          <p className="text-cyan-300/60 text-lg">Template not found</p>
          <Link href="/templates" className="text-cyan-400 hover:text-cyan-300 font-medium mt-4 inline-block">
            Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  const sections = objectToArray(template.sections);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-500/25 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/2 -right-48 w-96 h-96 bg-gradient-to-br from-blue-500/25 to-purple-500/25 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header with Back Button */}
      <div className="relative border-b border-cyan-500/20 bg-gradient-to-r from-white/8 via-white/4 to-transparent backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
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
              <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Shared Template</p>
              <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                {template.name}
              </h1>
            </div>
          </div>

          {/* Import Button in Header */}
          {imported ? (
            <div className="px-6 py-3 bg-green-500/20 text-green-300 rounded-lg font-semibold border border-green-500/50 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Imported!
            </div>
          ) : (
            <button
              onClick={handleImportTemplate}
              disabled={importing || authLoading}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                user
                  ? importing
                    ? 'bg-cyan-500/30 text-cyan-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/40'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {importing ? 'Importing...' : 'Import Template'}
            </button>
          )}
        </div>
      </div>

      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Template Info Section */}
        <div className="mb-12 bg-gradient-to-br from-white/8 to-white/3 rounded-2xl p-8 border border-cyan-500/20 shadow-2xl backdrop-blur-2xl">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-widest">Description</h2>
              {template.description ? (
                <div className="text-cyan-200/80 leading-relaxed prose prose-invert max-w-none">
                  <RichTextDisplay content={template.description} />
                </div>
              ) : (
                <span className="text-cyan-300/50 italic">No description provided</span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-widest">Shared By</h2>
              <div className="bg-white/5 rounded-xl p-4 border border-cyan-500/30">
                <p className="text-white font-semibold">
                  {owner?.firstName} {owner?.lastName}
                </p>
                <p className="text-cyan-300/70 text-sm">{owner?.email}</p>
              </div>
            </div>
          </div>

          {/* Import Status Messages */}
          {importError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-300 text-sm mb-4">
              <p className="font-semibold mb-1">❌ Error:</p>
              <p>{importError}</p>
            </div>
          )}
          {!user && !authLoading && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 text-blue-300 text-sm">
              <p className="font-semibold mb-1">💡 Sign in to import</p>
              <p>
                <Link href="/sign-in" className="text-blue-400 hover:text-blue-300 font-medium underline">
                  Sign in
                </Link> or <Link href="/sign-up" className="text-blue-400 hover:text-blue-300 font-medium underline">create an account</Link> to import this template
              </p>
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-6 mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Sections</h2>
          {sections.length === 0 ? (
            <div className="bg-gradient-to-br from-white/8 to-white/3 rounded-2xl p-8 text-center text-cyan-300/60 border border-cyan-500/20 shadow-2xl backdrop-blur-2xl">
              No sections in this template yet.
            </div>
          ) : (
            sections
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((section: any, sectionIndex: number) => {
                const questions = objectToArray(section.questions);
                const isExpanded = expandedSection === section.id;

                return (
                  <div key={section.id} className="bg-gradient-to-br from-white/8 to-white/3 rounded-2xl shadow-2xl border border-cyan-500/20 overflow-hidden hover:shadow-cyan-500/30 hover:border-cyan-400/40 transition-all duration-300 backdrop-blur-2xl">
                    {/* Section Header */}
                    <div
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent cursor-pointer hover:from-cyan-500/15 hover:via-blue-500/10 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedSections.has(section.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSectionSelection(section.id);
                            }}
                            className="w-5 h-5 appearance-none rounded-lg border-2 border-cyan-400/40 bg-gradient-to-br from-slate-900 to-slate-950 cursor-pointer transition-all duration-200 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/30 checked:border-cyan-400 checked:bg-gradient-to-br checked:from-cyan-500 checked:via-cyan-400 checked:to-blue-500 checked:shadow-xl checked:shadow-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-950"
                            title="Select/deselect all questions in this section"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-sm font-black flex-shrink-0 shadow-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h3 className="text-xl font-bold text-white">{section.title}</h3>
                            </div>
                            <p className="text-sm text-cyan-300/80 ml-11">{questions.length || 0} questions ({selectedQuestions.get(section.id)?.size || 0} selected)</p>
                          </div>
                        </div>
                        <svg
                          className={`w-6 h-6 text-cyan-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>

                    {/* Questions */}
                    {isExpanded && (
                      <div className="p-6 space-y-6">
                        {questions.length === 0 ? (
                          <p className="text-cyan-300/50 text-center py-8">No questions in this section</p>
                        ) : (
                          questions
                            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                            .map((question: any, qIndex: number) => {
                              const isSelected = selectedQuestions.get(section.id)?.has(question.id) ?? false;
                              return (
                                <div key={question.id} className={`border-b border-cyan-500/20 last:border-b-0 pb-6 last:pb-0 rounded-lg p-4 transition-all ${isSelected ? 'bg-cyan-500/5' : 'bg-transparent'}`}>
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3 flex-1">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleQuestionSelection(section.id, question.id)}
                                        className="relative w-5 h-5 mt-0.5 appearance-none rounded border-2 border-cyan-400/50 bg-slate-950/50 text-cyan-400 cursor-pointer transition-all hover:border-cyan-400 hover:bg-cyan-500/10 checked:bg-gradient-to-br checked:from-cyan-500 checked:to-blue-500 checked:border-cyan-400 shadow-lg shadow-cyan-500/20 checked:shadow-cyan-500/40 flex-shrink-0"
                                      />
                                      <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-white">
                                          Q{qIndex + 1}. {question.text}
                                        </h4>
                                      </div>
                                    </div>
                                    {question.difficulty && (
                                      <span
                                        className={`ml-4 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                          question.difficulty === 'easy'
                                            ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                                            : question.difficulty === 'medium'
                                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                                              : 'bg-red-500/20 text-red-300 border border-red-500/50'
                                        }`}
                                      >
                                        {question.difficulty}
                                      </span>
                                    )}
                                  </div>

                                  {question.codeSnippet && (
                                    <div className="my-4">
                                      <p className="text-xs font-medium text-cyan-400 mb-2 uppercase tracking-wide">Code Snippet:</p>
                                      <div className="bg-slate-950/95 rounded-xl border-2 border-cyan-500/20 shadow-2xl overflow-hidden">
                                        {/* Code Editor Header */}
                                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2 border-b border-cyan-500/20 flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                            </div>
                                            <span className="text-cyan-300/60 text-xs font-mono ml-3">
                                              code.{question.codeLanguage === 'javascript' ? 'js' : question.codeLanguage === 'typescript' ? 'ts' : question.codeLanguage === 'python' ? 'py' : question.codeLanguage}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {/* Code Content */}
                                        <pre className="max-h-96 overflow-y-auto py-4 px-4">
                                          <code
                                            dangerouslySetInnerHTML={{
                                              __html: getHighlightedCode(
                                                formatCode(question.codeSnippet, question.codeLanguage),
                                                question.codeLanguage,
                                              ),
                                            }}
                                            className="text-cyan-200 text-sm font-mono leading-relaxed"
                                          />
                                        </pre>
                                      </div>
                                    </div>
                                  )}

                                  {question.expectedAnswer && (
                                    <div className="my-4">
                                      <p className="text-xs font-medium text-cyan-400 mb-2 uppercase tracking-wide">Expected Answer:</p>
                                      <div className="bg-cyan-500/10 border border-cyan-500/40 rounded-lg p-4 text-cyan-100">
                                        <RichTextDisplay content={question.expectedAnswer} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-cyan-500/20">
          <p className="text-cyan-300/60 mb-4">Want to use this template in your account?</p>
          {imported ? (
            <div className="text-green-300 font-semibold">✓ Template imported successfully!</div>
          ) : (
            <button
              onClick={handleImportTemplate}
              disabled={importing || authLoading}
              className={`px-8 py-3 rounded-lg font-bold transition-all inline-flex items-center gap-2 ${
                user
                  ? importing
                    ? 'bg-cyan-500/30 text-cyan-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/40'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/40'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {importing ? 'Importing...' : authLoading ? 'Loading...' : 'Import This Template'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
