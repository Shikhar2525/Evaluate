'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { useAsyncData } from '@/lib/hooks';
import { templatesAPI, objectToArray } from '@/lib/api';
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

  if (!user) {
    return <Loader message="Loading templates..." fullScreen />;
  }

  return (
    <ProtectedPageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Page Header */}
      <div className="border-b border-[#3F9AAE]/30 bg-slate-900/50 shadow-lg backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#79C9C5] to-[#FFE2AF] bg-clip-text text-transparent mb-2">Interview Templates</h1>
              <p className="text-[#79C9C5]">Create and manage interview templates for consistent evaluations</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-slate-800 rounded-xl shadow-lg p-8 mb-8 border border-[#3F9AAE]/30 backdrop-blur-sm animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#FFE2AF]">Create New Template</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-[#3F9AAE]/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-[#79C9C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#FFE2AF] mb-2">Template Name *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Senior Frontend Engineer"
                  className="w-full px-4 py-3 rounded-lg border border-[#3F9AAE]/50 focus:outline-none focus:ring-2 focus:ring-[#3F9AAE] focus:border-transparent bg-slate-700/50 text-white placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#FFE2AF] mb-2">Description</label>
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
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all disabled:opacity-50"
                >
                  {formLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Template'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-slate-700 text-slate-200 font-medium rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
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
                <div className="h-full bg-gradient-to-b from-slate-700/40 via-slate-800/50 to-slate-900/60 rounded-2xl border border-[#3F9AAE]/25 hover:border-[#79C9C5]/40 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#3F9AAE]/20 backdrop-blur-md animate-slide-in flex flex-col">
                  {/* Header Section with Icon */}
                  <div className="p-5 border-b border-[#3F9AAE]/15 bg-gradient-to-r from-[#3F9AAE]/10 to-transparent">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-[#FFE2AF] transition-colors leading-tight mb-2">
                          {template.name}
                        </h3>
                        <div className="flex gap-2">
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold text-[#79C9C5] bg-[#3F9AAE]/20 rounded-full border border-[#3F9AAE]/30">
                            {sectionsArray?.length || 0} Sections
                          </span>
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold text-[#FFE2AF] bg-[#F96E5B]/20 rounded-full border border-[#F96E5B]/30">
                            {sectionsArray?.reduce((sum: number, section: any) => sum + (objectToArray(section.questions)?.length || 0), 0) || 0} Q's
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-[#3F9AAE]/20 to-[#79C9C5]/10 text-[#79C9C5] group-hover:from-[#3F9AAE]/30 group-hover:to-[#79C9C5]/20 transition-all flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="flex-1 p-5">
                    {template.description ? (
                      <div className="text-[#79C9C5]">
                        <p className="text-xs font-semibold text-[#FFE2AF]/70 uppercase tracking-wide mb-2">Description</p>
                        <RichTextDisplay content={template.description} className="text-sm line-clamp-3 text-[#79C9C5]" />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No description provided</p>
                    )}
                  </div>

                  {/* Warning Badge for Empty Sections */}
                  {hasIssues && (
                    <div className="px-5 py-3 bg-yellow-500/15 border-t border-yellow-500/30">
                      <p className="text-xs font-semibold text-yellow-400 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                        </svg>
                        {emptySections.length} section{emptySections.length !== 1 ? 's' : ''} with no questions
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-5 border-t border-[#3F9AAE]/15 bg-gradient-to-r from-transparent to-[#3F9AAE]/5 flex gap-3">
                    <Link
                      href={`/templates/${template.id}`}
                      className="flex-1 px-4 py-2 text-center text-sm font-semibold text-[#79C9C5] border-2 border-[#3F9AAE]/50 rounded-lg hover:border-[#79C9C5] hover:bg-[#3F9AAE]/20 hover:text-[#FFE2AF] transition-all duration-200 active:scale-95"
                    >
                      Edit
                    </Link>
                    {sectionsArray.length > 0 && objectToArray(template.sections)?.reduce((sum: number, section: any) => sum + (objectToArray(section.questions)?.length || 0), 0) > 0 && (
                      <Link
                        href={`/interviews/new?templateId=${template.id}`}
                        className="flex-1 px-4 py-2 text-center text-sm font-semibold text-white bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 hover:scale-105 transition-all duration-200 active:scale-95"
                      >
                        Start
                      </Link>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(template.id)}
                      disabled={deleting === template.id}
                      className="px-4 py-2 text-center text-sm font-semibold text-red-400 border-2 border-red-400/60 rounded-lg hover:border-red-400 hover:bg-red-400/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:hover:bg-transparent"
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
                    <div className="p-4 bg-red-500/10 border-t border-red-500/30 text-red-400 text-sm">
                      <p className="mb-3 font-medium">Are you sure you want to delete this template?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/50 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600/50 text-sm font-medium transition-colors text-slate-200"
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
          <div className="bg-slate-800 rounded-xl shadow-lg p-16 text-center border border-[#3F9AAE]/30 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-[#3F9AAE]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#79C9C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#FFE2AF] mb-2">No templates yet</h3>
            <p className="text-[#79C9C5] mb-8">Create your first interview template to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Your First Template</span>
            </button>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] rounded-xl p-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Ready to conduct an interview?</h3>
              <p className="text-[#FFE2AF]/80">View your past interviews and candidate evaluations</p>
            </div>
            <Link
              href="/interviews"
              className="flex items-center space-x-2 px-6 py-3 bg-white text-[#3F9AAE] rounded-lg font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap"
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
