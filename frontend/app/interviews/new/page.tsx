'use client';

import { Suspense, useState, useEffect, useLayoutEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { templatesAPI, interviewsAPI, objectToArray } from '@/lib/api';
import Link from 'next/link';
import RichTextDisplay from '@/lib/components/rich-text-display';

function NewInterviewContent() {
  useLayoutEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const [template, setTemplate] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(true); // Always start with loading true
  const [creating, setCreating] = useState(false);
  const [draggedSection, setDraggedSection] = useState<any>(null);
  const [sections, setSections] = useState<any>({});

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (!templateId) {
      // If no template ID provided, fetch all templates for selection
      const fetchTemplates = async () => {
        try {
          const response = await templatesAPI.list();
          setTemplates(response.data || []);
        } catch (err) {
          console.error('Failed to fetch templates');
        } finally {
          setLoading(false);
        }
      };
      fetchTemplates();
      return;
    }

    // If we have a templateId, fetch it
    const fetchTemplate = async () => {
      try {
        const response = await templatesAPI.get(templateId);
        setTemplate(response.data);
        setSections(response.data.sections || {});
      } catch (error) {
        console.error('Failed to fetch template:', error);
        // Don't redirect, just let the error state show
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [user, templateId, router]);

  const handleDragStart = (e: React.DragEvent, section: any) => {
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSection: any) => {
    e.preventDefault();
    if (!draggedSection || draggedSection.id === targetSection.id) {
      setDraggedSection(null);
      return;
    }

    const sectionsArray = objectToArray(sections);
    const draggedIndex = sectionsArray.findIndex(s => s.id === draggedSection.id);
    const targetIndex = sectionsArray.findIndex(s => s.id === targetSection.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedSection(null);
      return;
    }

    const newSectionsArray = [...sectionsArray];
    newSectionsArray.splice(draggedIndex, 1);
    newSectionsArray.splice(targetIndex, 0, draggedSection);

    // Convert back to object format for Firebase
    const newSectionsObj: any = {};
    newSectionsArray.forEach(s => {
      newSectionsObj[s.id] = s;
    });
    setSections(newSectionsObj);
    setDraggedSection(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Make candidate name mandatory
    if (!candidateName.trim()) {
      alert('Candidate name is required to start an interview');
      return;
    }
    
    setCreating(true);

    try {
      const response = await interviewsAPI.create({
        templateId: templateId!,
        candidateName: candidateName,
        sectionOrder: objectToArray(sections).map(s => s.id),
      });

      router.push(`/interviews/${response.data.id}/conduct`);
    } catch (error) {
      console.error('Failed to start interview:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#79C9C5]/30 border-t-[#3F9AAE] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#79C9C5]/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!templateId && templates.length === 0) {
    return (
      <div className="bg-slate-950 min-h-screen">
        <div className="border-b border-[#3F9AAE]/30 bg-slate-900/50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] bg-clip-text text-transparent mb-2">Start Interview</h1>
              <p className="text-[#79C9C5]">Select a template to begin a new interview</p>
            </div>
          </div>
        </div>
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-slate-800 rounded-xl p-16 text-center border border-[#3F9AAE]/30">
            <div className="w-16 h-16 rounded-full bg-[#3F9AAE]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#79C9C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No templates available</h3>
            <p className="text-[#79C9C5] mb-8">Create a template first to start conducting interviews</p>
            <Link
              href="/templates"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Create Template</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!templateId && templates.length > 0) {
    return (
      <div className="bg-slate-950 min-h-screen">
        <div className="border-b border-[#3F9AAE]/30 bg-slate-900/50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] bg-clip-text text-transparent mb-2">Start Interview</h1>
              <p className="text-[#79C9C5]">Select a template to begin a new interview</p>
            </div>
          </div>
        </div>
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((t: any) => (
              <Link
                key={t.id}
                href={`/interviews/new?templateId=${t.id}`}
                className="bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-[#3F9AAE]/20 transition-all duration-200 border border-[#3F9AAE]/30 overflow-hidden group animate-slide-in backdrop-blur-sm p-6"
              >
                <div className="p-3 rounded-lg bg-[#3F9AAE]/20 text-[#79C9C5] w-fit mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#FFE2AF] transition-colors mb-2">{t.name}</h3>
                <div className="text-[#79C9C5] text-sm line-clamp-2 mb-4">
                  <RichTextDisplay content={t.description} className="text-sm" />
                </div>
                <div className="flex items-center space-x-4 text-xs text-[#79C9C5]">
                  <span>📋 {objectToArray(t.sections)?.length || 0} sections</span>
                  <span>❓ {objectToArray(t.sections)?.reduce((sum: number, s: any) => sum + (objectToArray(s.questions)?.length || 0), 0) || 0} questions</span>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // If we have a templateId but haven't loaded the template yet, show loader
  if (templateId && !template) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#79C9C5]/30 border-t-[#3F9AAE] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#79C9C5]">Loading template...</p>
        </div>
      </div>
    );
  }

  // If we have a template, render the form
  if (template && templateId) {
    const totalQuestions = objectToArray(template.sections)?.reduce(
      (sum: number, section: any) => sum + (objectToArray(section.questions)?.length || 0),
      0,
    ) || 0;

    return (
      <div className="min-h-screen bg-slate-950">
        {/* Page Header */}
        <div className="border-b border-[#3F9AAE]/30 bg-slate-900 shadow-sm">
          <div className="max-w-2xl mx-auto px-6 py-8">
            <Link
              href="/templates"
              className="inline-flex items-center space-x-1 text-[#79C9C5] hover:text-[#79C9C5]/80 font-medium mb-4 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Templates</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">Start Interview</h1>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-slate-900 rounded-xl shadow-lg p-8 border border-[#3F9AAE]/30 animate-slide-in">
            {/* Template Info Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-3 rounded-lg bg-[#3F9AAE]/20 text-[#79C9C5]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{template.name}</h2>
                    {template.description && (
                      <div className="text-[#79C9C5] text-sm mt-1">
                        <RichTextDisplay content={template.description} className="text-sm" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Template Details Card */}
            <div className="bg-gradient-to-r from-[#3F9AAE]/10 to-[#79C9C5]/10 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-[#79C9C5] mb-2">{objectToArray(template.sections).length || 0}</p>
                  <p className="text-sm text-[#79C9C5]/70 font-medium">Sections</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-[#79C9C5] mb-2">{totalQuestions}</p>
                  <p className="text-sm text-[#79C9C5]/70 font-medium">Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-[#79C9C5] mb-2">~{Math.round(totalQuestions * 3)}</p>
                  <p className="text-sm text-[#79C9C5]/70 font-medium">Min</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleStartInterview} className="space-y-6">
              {/* Candidate Name */}
              <div>
                <label htmlFor="candidateName" className="block text-sm font-semibold text-[#79C9C5] mb-2">
                  Candidate Name <span className="text-red-400 font-normal">*</span>
                </label>
                <input
                  type="text"
                  id="candidateName"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g., John Doe"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-[#3F9AAE]/30 bg-slate-800/50 text-white placeholder-[#79C9C5]/40 focus:outline-none focus:ring-2 focus:ring-[#3F9AAE] focus:border-transparent"
                />
                <p className="text-xs text-[#79C9C5]/50 mt-1.5">This name will be used to track the interview results</p>
              </div>

              {/* Sections Preview - Draggable */}
              <div>
                <label className="block text-sm font-semibold text-[#79C9C5] mb-3 flex items-center gap-2">
                  Interview Sections
                  <span className="text-xs font-normal text-[#79C9C5]/50 bg-[#3F9AAE]/20 px-2 py-1 rounded">Drag to reorder</span>
                </label>
                <div className="space-y-2">
                  {objectToArray(sections).map((section: any, index: number) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, section)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, section)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-move group ${
                        draggedSection?.id === section.id
                          ? 'bg-[#3F9AAE]/20 border-[#3F9AAE] opacity-50'
                          : 'bg-slate-800/50 border-[#3F9AAE]/30 hover:border-[#3F9AAE]/60 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-md bg-[#3F9AAE]/20 text-[#79C9C5] group-hover:bg-[#3F9AAE]/40 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-1 text-[#79C9C5]/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 3h2v18H9V3zm4 0h2v18h-2V3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white flex items-center gap-2">
                          {section.title}
                          <span className="text-xs font-normal text-[#79C9C5]/40 bg-[#3F9AAE]/10 px-2 py-0.5 rounded">#{index + 1}</span>
                        </p>
                        <p className="text-xs text-[#79C9C5]/50">{objectToArray(section.questions).length || 0} questions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#3F9AAE]/30 flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {creating ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-[#3F9AAE] rounded-full animate-spin"></span>
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2 1m2-1L12 3m2 1v2.5" />
                      </svg>
                      <span>Start Interview</span>
                    </>
                  )}
                </button>
                <Link
                  href="/templates"
                  className="flex-1 px-6 py-3 border border-[#3F9AAE]/30 text-[#79C9C5] font-semibold rounded-lg hover:bg-slate-800/50 transition-colors text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>

            {/* Info Banner */}
            <div className="mt-8 p-4 bg-[#FFE2AF]/10 border border-[#FFE2AF]/30 rounded-lg">
              <div className="flex space-x-3">
                <svg className="w-5 h-5 text-[#FFE2AF] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-[#FFE2AF]/90">
                  <p className="font-semibold">Tip:</p>
                  <p>You can save your progress and come back to this interview later. It will be marked as "In Progress".</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If we reach here with a templateId, it's still loading or there was an error
  return null;
}

export default function NewInterviewPage() {
  return (
    <Suspense fallback={<div />}>
      <NewInterviewContent />
    </Suspense>
  );
}
