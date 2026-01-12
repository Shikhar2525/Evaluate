'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { useAsyncData } from '@/lib/hooks';
import { templatesAPI } from '@/lib/api';
import Link from 'next/link';
import ProtectedPageWrapper from '@/lib/components/protected-page-wrapper';
import RichTextEditor from '@/lib/components/rich-text-editor';
import RichTextDisplay from '@/lib/components/rich-text-display';

export default function TemplatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const { data: templates } = useAsyncData<any[]>(
    () => templatesAPI.list(),
    [user],
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
      window.location.reload();
    } catch (err) {
      console.error('Failed to create template');
    } finally {
      setFormLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
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

        {/* Templates Grid */}
        {templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {templates.map((template: any) => (
              <div key={template.id} className="bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-[#3F9AAE]/20 transition-all duration-200 border border-[#3F9AAE]/30 overflow-hidden group animate-slide-in backdrop-blur-sm">
                <div className="p-6">
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-[#FFE2AF] transition-colors">
                        {template.name}
                      </h3>
                    </div>
                    <div className="ml-3 p-3 rounded-lg bg-[#3F9AAE]/20 text-[#79C9C5]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>

                  {/* Description */}
                  {template.description && (
                    <div className="mb-4 pb-4 border-b border-[#3F9AAE]/20 text-[#79C9C5]">
                      <RichTextDisplay content={template.description} className="text-sm line-clamp-3" />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center space-x-4 mb-6 pt-4 border-t border-[#3F9AAE]/20">
                    <div className="flex items-center space-x-2 text-sm text-[#79C9C5]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>{template.sections?.length || 0} sections</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-[#79C9C5]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{template.sections?.reduce((sum: number, section: any) => sum + (section.questions?.length || 0), 0) || 0} questions</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      href={`/templates/${template.id}`}
                      className="flex-1 px-4 py-2 border border-[#3F9AAE]/50 text-[#79C9C5] font-medium rounded-lg hover:bg-[#3F9AAE]/10 hover:border-[#3F9AAE] transition-colors text-center text-sm"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/interviews/new?templateId=${template.id}`}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-[#3F9AAE] to-[#79C9C5] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#3F9AAE]/50 transition-all text-center text-sm"
                    >
                      Start
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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
