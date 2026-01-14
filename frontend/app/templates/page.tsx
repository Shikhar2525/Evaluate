'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { useAsyncData } from '@/lib/hooks';
import { templatesAPI, objectToArray } from '@/lib/api';
import { geminiAPI, GeneratedTemplate } from '@/lib/gemini';
import Link from 'next/link';
import ProtectedPageWrapper from '@/lib/components/protected-page-wrapper';
import RichTextEditor from '@/lib/components/rich-text-editor';
import RichTextDisplay from '@/lib/components/rich-text-display';
import Loader from '@/lib/components/loader';

export default function TemplatesPage() {
  useLayoutEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);

  const { user, loading } = useAuth();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // AI Generation state
  const [showAIForm, setShowAIForm] = useState(false);
  const [aiFormData, setAIFormData] = useState({
    position: '',
    duration: 60,
    experienceLevel: '2-5 years',
    interviewDifficulty: 'Medium',
    sections: [{ name: '', details: '', questionCount: 5 }],
  });
  const [aiGenerating, setAIGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);
  const [savingGenerated, setSavingGenerated] = useState(false);
  const [regenerationEnhancement, setRegenerationEnhancement] = useState('');
  
  const { data: templates, loading: templatesLoading, refetch } = useAsyncData<any[]>(
    () => templatesAPI.list(),
    [user?.id],
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;

    setFormLoading(true);
    try {
      await templatesAPI.create(newTemplate);
      setNewTemplate({ name: '', description: '' });
      setShowCreateForm(false);
      refetch();
    } catch (err) {
      console.error('Failed to create template');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setDeleting(templateId);
    try {
      await templatesAPI.delete(templateId);
      setDeleteConfirm(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete template');
    } finally {
      setDeleting(null);
    }
  };

  const handleGenerateTemplate = async (e: React.FormEvent, enhancement?: string) => {
    e.preventDefault();
    const validSections = aiFormData.sections.filter(s => s.name.trim());
    
    if (!aiFormData.position.trim() || validSections.length === 0) {
      setAIError('Position and at least one section are required');
      return;
    }

    setAIGenerating(true);
    setAIError(null);
    if (!enhancement) {
      setGeneratedTemplate(null);
    }

    try {
      const template = await geminiAPI.generateTemplate({
        position: aiFormData.position,
        description: '',
        fields: validSections.map(s => s.name),
        sectionDetails: validSections.map(s => ({ name: s.name, details: s.details, questionCount: s.questionCount })),
        duration: Math.max(aiFormData.duration, 15),
        experienceLevel: aiFormData.experienceLevel,
        interviewDifficulty: aiFormData.interviewDifficulty,
        enhancement: enhancement || undefined,
      });

      setRegenerationEnhancement('');

      setGeneratedTemplate(template);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate template';
      setAIError(message);
      console.error('Template generation error:', err);
    } finally {
      setAIGenerating(false);
    }
  };

  const handleSaveGeneratedTemplate = async () => {
    if (!generatedTemplate) return;

    setSavingGenerated(true);
    try {
      // Create the template
      const templateRes = await templatesAPI.create({
        name: generatedTemplate.name,
        description: generatedTemplate.description,
      });

      const templateId = templateRes.data.id;

      // Add sections and questions
      for (const section of generatedTemplate.sections) {
        const sectionRes = await templatesAPI.addSection(templateId, {
          title: section.title,
          order: section.order,
        });

        for (const question of section.questions) {
          await templatesAPI.addQuestion(templateId, sectionRes.data.id, {
            text: question.text,
            difficulty: question.difficulty,
            order: question.order,
            expectedAnswer: question.expectedAnswer,
            codeSnippet: question.codeSnippet,
            codeLanguage: question.codeLanguage,
          });
        }
      }

      // Reset and refresh
      setGeneratedTemplate(null);
      setAIFormData({ position: '', duration: 60, experienceLevel: '2-5 years', interviewDifficulty: 'Medium', sections: [{ name: '', details: '', questionCount: 5 }] });
      setShowAIForm(false);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save template';
      setAIError(message);
      console.error('Save error:', err);
    } finally {
      setSavingGenerated(false);
    }
  };

  if (!user) {
    return <Loader message="Loading templates..." fullScreen />;
  }

  return (
    <ProtectedPageWrapper>
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-500/25 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/2 -right-48 w-96 h-96 bg-gradient-to-br from-blue-500/25 to-purple-500/25 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Page Header */}
        <div className="relative border-b border-cyan-500/20 bg-gradient-to-r from-white/8 via-white/4 to-transparent backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-black text-white">Interview Templates</h1>
                </div>
              <p className="text-cyan-300/90">Create and manage interview templates for consistent evaluations</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAIForm(!showAIForm)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/40 transition-all uppercase tracking-wide text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate with AI</span>
                </button>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/40 transition-all uppercase tracking-wide text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Template</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="relative max-w-6xl mx-auto px-6 py-8">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-gradient-to-br from-white/8 to-white/3 rounded-2xl shadow-2xl p-8 mb-8 border border-cyan-500/20 backdrop-blur-2xl animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Template</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-cyan-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-cyan-300 mb-3 uppercase tracking-wide">Template Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Senior Frontend Engineer"
                  className="w-full px-4 py-3 rounded-lg border border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white/5 text-white placeholder-cyan-400/40 backdrop-blur-sm transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-cyan-300 mb-3 uppercase tracking-wide">Description</label>
                <RichTextEditor
                  value={newTemplate.description}
                  onChange={(value) => setNewTemplate({ ...newTemplate, description: value })}
                  placeholder="Add optional description for this template..."
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:shadow-none uppercase tracking-wide"
                >
                  {formLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Template'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI Generation Form */}
        {showAIForm && !generatedTemplate && (
          <div className="bg-gradient-to-br from-white/8 to-white/3 rounded-2xl shadow-2xl p-8 mb-8 border border-purple-500/20 backdrop-blur-2xl animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Generate Template with AI</h2>
              <button
                onClick={() => {
                  setShowAIForm(false);
                  setAIError(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-purple-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {aiError && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm">
                {aiError}
              </div>
            )}

            <form onSubmit={handleGenerateTemplate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-purple-300 mb-3 uppercase tracking-wide">
                    Position / Job Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={aiFormData.position}
                    onChange={(e) => setAIFormData({ ...aiFormData, position: e.target.value })}
                    placeholder="e.g., Senior Frontend Engineer"
                    className="w-full px-4 py-3 rounded-lg border border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/5 text-white placeholder-purple-400/40 backdrop-blur-sm transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-purple-300 mb-3 uppercase tracking-wide">
                    Experience Level <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={aiFormData.experienceLevel}
                    onChange={(e) => setAIFormData({ ...aiFormData, experienceLevel: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/5 text-white backdrop-blur-sm transition-all font-medium"
                  >
                    <option value="0-1 years" className="bg-slate-900">0-1 years (Entry Level)</option>
                    <option value="2-5 years" className="bg-slate-900">2-5 years (Mid Level)</option>
                    <option value="5-10 years" className="bg-slate-900">5-10 years (Senior)</option>
                    <option value="10+ years" className="bg-slate-900">10+ years (Expert/Lead)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-300 mb-3 uppercase tracking-wide">Interview Duration (minutes)</label>
                <input
                  type="number"
                  value={aiFormData.duration}
                  onChange={(e) => setAIFormData({ ...aiFormData, duration: parseInt(e.target.value) || 60 })}
                  min="15"
                  max="480"
                  className="w-full px-4 py-3 rounded-lg border border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/5 text-white placeholder-purple-400/40 backdrop-blur-sm transition-all font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-purple-300 uppercase tracking-wide">
                    Sections <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAIFormData({ ...aiFormData, sections: [...aiFormData.sections, { name: '', details: '', questionCount: 5 }] })}
                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold rounded-lg border border-purple-500/40 transition-all"
                  >
                    + Add Section
                  </button>
                </div>
                <div className="space-y-4">
                  {aiFormData.sections.map((section, index) => (
                    <div key={index} className="bg-white/5 border border-purple-500/30 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={section.name}
                            onChange={(e) => {
                              const newSections = [...aiFormData.sections];
                              newSections[index].name = e.target.value;
                              setAIFormData({ ...aiFormData, sections: newSections });
                            }}
                            placeholder="Section name (e.g., Technical Skills)"
                            className="w-full px-3 py-2 rounded-lg border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/5 text-white placeholder-purple-400/40 text-sm font-medium"
                            required
                          />
                          <textarea
                            value={section.details}
                            onChange={(e) => {
                              const newSections = [...aiFormData.sections];
                              newSections[index].details = e.target.value;
                              setAIFormData({ ...aiFormData, sections: newSections });
                            }}
                            placeholder="Details about how questions should be (e.g., Focus on React hooks, state management, performance optimization)"
                            className="w-full px-3 py-2 rounded-lg border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/5 text-white placeholder-purple-400/40 text-sm resize-none"
                            rows={2}
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-purple-300 font-medium">Questions:</label>
                            <input
                              type="number"
                              value={section.questionCount}
                              onChange={(e) => {
                                const newSections = [...aiFormData.sections];
                                newSections[index].questionCount = Math.max(1, parseInt(e.target.value) || 5);
                                setAIFormData({ ...aiFormData, sections: newSections });
                              }}
                              min="1"
                              max="20"
                              className="w-20 px-3 py-1.5 rounded-lg border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/5 text-white text-sm"
                            />
                          </div>
                        </div>
                        {aiFormData.sections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setAIFormData({ ...aiFormData, sections: aiFormData.sections.filter((_, i) => i !== index) })}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            title="Remove section"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-300 mb-3 uppercase tracking-wide">
                  Interview Difficulty <span className="text-red-400">*</span>
                </label>
                <select
                  value={aiFormData.interviewDifficulty}
                  onChange={(e) => setAIFormData({ ...aiFormData, interviewDifficulty: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/5 text-white backdrop-blur-sm transition-all font-medium"
                >
                  <option value="Easy" className="bg-slate-900">Easy</option>
                  <option value="Medium" className="bg-slate-900">Medium</option>
                  <option value="Hard" className="bg-slate-900">Hard</option>
                  <option value="Very Hard" className="bg-slate-900">Very Hard (Expert)</option>
                </select>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={aiGenerating}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:shadow-none uppercase tracking-wide"
                >
                  {aiGenerating ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Template
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAIForm(false);
                    setAIError(null);
                  }}
                  className="px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI Generation Preview */}
        {generatedTemplate && (
          <div className="bg-gradient-to-br from-white/8 to-white/3 rounded-2xl shadow-2xl p-8 mb-8 border border-purple-500/20 backdrop-blur-2xl animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Generated Template Preview</h2>
              <button
                onClick={() => setGeneratedTemplate(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-purple-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {aiError && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm">
                {aiError}
              </div>
            )}

            {/* Preview Content */}
            <div className="space-y-6 mb-6">
              {/* Template Header */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-2">{generatedTemplate.name}</h3>
                {generatedTemplate.description && (
                  <p className="text-purple-300/90 mb-3">{generatedTemplate.description}</p>
                )}
                {/* Section Summary */}
                <div className="mt-3 pt-3 border-t border-purple-500/20">
                  <p className="text-sm text-purple-300 font-semibold mb-2">Template Overview:</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedTemplate.sections.map((section, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs">
                        <span className="text-purple-200 font-semibold">{section.title}</span>
                        <span className="text-purple-300/70 ml-2">({section.questions.length} questions)</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-400/70 mt-2">Total: {generatedTemplate.sections.reduce((acc, s) => acc + s.questions.length, 0)} questions across {generatedTemplate.sections.length} sections</p>
                </div>
              </div>

              {/* Sections and Questions */}
              <div className="space-y-4">
                {generatedTemplate.sections.map((section, sectionIdx) => (
                  <div key={sectionIdx} className="p-4 border border-purple-500/30 rounded-lg bg-white/5">
                    <h4 className="text-lg font-bold text-purple-300 mb-3">{section.title}</h4>
                    <div className="space-y-2 ml-4">
                      {section.questions.map((q, qIdx) => (
                        <div key={qIdx} className="border-l-2 border-purple-500/30 pl-4 py-2">
                          <div className="flex items-start gap-3 text-sm mb-2">
                            <span className="text-purple-400/70 font-semibold min-w-fit">Q{qIdx + 1}:</span>
                            <div className="flex-1">
                              <p className="text-white/90 mb-2">{q.text}</p>
                              <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                                q.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300' :
                                q.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-red-500/20 text-red-300'
                              }`}>
                                {q.difficulty}
                              </span>
                            </div>
                          </div>
                          
                          {q.expectedAnswer && (
                            <div className="ml-8 mt-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs">
                              <p className="text-cyan-300 font-semibold mb-1">Expected Answer:</p>
                              <p className="text-cyan-200/80">{q.expectedAnswer}</p>
                            </div>
                          )}
                          
                          {q.codeSnippet && (
                            <div className="ml-8 mt-2 p-3 bg-slate-800/50 border border-slate-600/30 rounded text-xs">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-slate-300 font-semibold">Expected Code:</p>
                                {q.codeLanguage && (
                                  <span className="px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded text-xs">
                                    {q.codeLanguage}
                                  </span>
                                )}
                              </div>
                              <pre className="text-slate-200 overflow-x-auto whitespace-pre-wrap">{q.codeSnippet}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regeneration Enhancement */}
            <div className="mt-6 p-4 bg-white/5 border border-purple-500/30 rounded-lg">
              <label className="block text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">
                Want to improve the template? Describe your changes:
              </label>
              <textarea
                value={regenerationEnhancement}
                onChange={(e) => setRegenerationEnhancement(e.target.value)}
                placeholder="e.g., Add more questions about system design, make coding questions harder, focus more on React performance optimization..."
                className="w-full px-4 py-3 rounded-lg border border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/5 text-white placeholder-purple-400/40 backdrop-blur-sm transition-all font-medium resize-none"
                rows={3}
              />
              <p className="text-xs text-purple-400/70 mt-2">Provide specific feedback about what you'd like to change, and click Regenerate to create an improved version.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-4 border-t border-purple-500/20 mt-4">
              <button
                onClick={handleSaveGeneratedTemplate}
                disabled={savingGenerated}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:shadow-none uppercase tracking-wide"
              >
                {savingGenerated ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Template
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setAIFormData({ position: '', duration: 60, experienceLevel: '2-5 years', interviewDifficulty: 'Medium', sections: [{ name: '', details: '', questionCount: 5 }] });
                  setGeneratedTemplate(null);
                }}
                className="px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Discard
              </button>
              <button
                onClick={(e) => handleGenerateTemplate(e, regenerationEnhancement || undefined)}
                disabled={aiGenerating}
                className="inline-flex items-center px-6 py-3 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                {aiGenerating ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                    {regenerationEnhancement ? 'Regenerating with enhancements...' : 'Regenerating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {regenerationEnhancement ? 'Regenerate with Enhancements' : 'Regenerate'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {templatesLoading && !templates ? (
          <div className="flex items-center justify-center py-24">
            <Loader message="Loading templates..." />
          </div>
        ) : null}

        {/* Templates Grid */}
        {templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {templates.map((template: any) => {
              const sectionsArray = objectToArray(template.sections) || [];
              const emptySections = sectionsArray.filter((s: any) => !objectToArray(s.questions)?.length);
              const hasIssues = emptySections.length > 0;
              
              return (
              <div key={template.id} className="group h-full relative">
                <div className="h-full bg-gradient-to-br from-white/8 to-white/3 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/40 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/30 backdrop-blur-2xl animate-slide-in flex flex-col">
                  {/* Header Section with Icon */}
                  <div className="p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent relative">
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 translate-x-full group-hover:translate-x-0"></div>
                    
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors leading-tight mb-3">
                          {template.name}
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                          <span className="inline-block px-3 py-1.5 text-xs font-bold text-cyan-300 bg-cyan-500/20 rounded-full border border-cyan-500/40 uppercase tracking-wide">
                            {sectionsArray?.length || 0} Sections
                          </span>
                          <span className="inline-block px-3 py-1.5 text-xs font-bold text-blue-300 bg-blue-500/20 rounded-full border border-blue-500/40 uppercase tracking-wide">
                            {sectionsArray?.reduce((sum: number, section: any) => sum + (objectToArray(section.questions)?.length || 0), 0) || 0} Q's
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 text-cyan-300 group-hover:from-cyan-500/40 group-hover:to-blue-500/30 transition-all flex-shrink-0 shadow-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="flex-1 p-6">
                    {template.description ? (
                      <div className="text-cyan-300">
                        <p className="text-xs font-bold text-cyan-400/70 uppercase tracking-wide mb-2">Description</p>
                        <RichTextDisplay content={template.description} className="text-sm line-clamp-3 text-cyan-300/90" />
                      </div>
                    ) : (
                      <p className="text-sm text-white/40 italic">No description provided</p>
                    )}
                  </div>

                  {/* Warning Badge for Empty Sections */}
                  {hasIssues && (
                    <div className="px-6 py-3 bg-amber-500/15 border-t border-amber-500/30 backdrop-blur-sm">
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                        </svg>
                        {emptySections.length} section{emptySections.length !== 1 ? 's' : ''} with no questions
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-6 border-t border-cyan-500/20 bg-gradient-to-r from-transparent to-cyan-500/5 flex gap-3">
                    <Link
                      href={`/templates/${template.id}`}
                      className="flex-1 px-4 py-2.5 text-center text-sm font-bold text-cyan-300 border-2 border-cyan-500/40 rounded-lg hover:border-cyan-400 hover:bg-cyan-500/15 hover:text-cyan-200 transition-all duration-200 active:scale-95 uppercase tracking-wide"
                    >
                      Edit
                    </Link>
                    {sectionsArray.length > 0 && objectToArray(template.sections)?.reduce((sum: number, section: any) => sum + (objectToArray(section.questions)?.length || 0), 0) > 0 && (
                      <Link
                        href={`/interviews/new?templateId=${template.id}`}
                        className="flex-1 px-4 py-2.5 text-center text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-200 active:scale-95 uppercase tracking-wide"
                      >
                        Start
                      </Link>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(template.id)}
                      disabled={deleting === template.id}
                      className="px-4 py-2.5 text-center text-sm font-bold text-red-300 border-2 border-red-500/40 rounded-lg hover:border-red-400 hover:bg-red-500/15 hover:text-red-200 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:hover:bg-transparent"
                      title="Delete template"
                    >
                      {deleting === template.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirm === template.id && (
                    <div className="p-4 bg-red-500/15 border-t border-red-500/30 text-red-300 text-sm backdrop-blur-sm">
                      <p className="mb-3 font-bold">Are you sure you want to delete this template?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/50 text-sm font-bold transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded border border-white/20 text-sm font-bold transition-colors text-white backdrop-blur-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white/8 to-white/3 rounded-2xl shadow-2xl p-16 text-center border border-cyan-500/20 backdrop-blur-2xl">
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
              <svg className="w-10 h-10 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No templates yet</h3>
            <p className="text-cyan-300/90 mb-8 text-lg">Create your first interview template to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/40 transition-all uppercase tracking-wide"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Your First Template</span>
            </button>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 bg-gradient-to-br from-white/8 via-white/5 to-cyan-500/10 rounded-2xl p-8 text-white shadow-2xl hover:shadow-cyan-500/30 transition-all backdrop-blur-2xl border border-cyan-500/20 hover:border-cyan-400/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready to conduct an interview?</h3>
              <p className="text-cyan-300/80 text-lg">View your past interviews and candidate evaluations</p>
            </div>
            <Link
              href="/interviews"
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-cyan-500/40 transition-all whitespace-nowrap uppercase tracking-wide"
            >
              <span>View Interviews</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
    </ProtectedPageWrapper>
  );
}
