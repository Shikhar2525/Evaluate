import axios from 'axios';
import { useAuthStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set token in headers when available
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signUp: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post('/auth/sign-up', data),
  signIn: (data: { email: string; password: string }) => apiClient.post('/auth/sign-in', data),
  getProfile: () => apiClient.get('/auth/me'),
};

export const templatesAPI = {
  create: (data: { name: string; description?: string }) => apiClient.post('/templates', data),
  list: () => apiClient.get('/templates'),
  get: (id: string) => apiClient.get(`/templates/${id}`),
  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.put(`/templates/${id}`, data),
  delete: (id: string) => apiClient.delete(`/templates/${id}`),

  addSection: (templateId: string, data: { title: string; order?: number }) =>
    apiClient.post(`/templates/${templateId}/sections`, data),
  updateSection: (sectionId: string, data: { title: string; order?: number }) =>
    apiClient.put(`/templates/sections/${sectionId}`, data),
  deleteSection: (sectionId: string) => apiClient.delete(`/templates/sections/${sectionId}`),

  addQuestion: (
    sectionId: string,
    data: {
      text: string;
      codeSnippet?: string;
      codeLanguage?: string;
      difficulty?: string;
      expectedAnswer?: string;
      order?: number;
    },
  ) => apiClient.post(`/templates/sections/${sectionId}/questions`, data),
  updateQuestion: (
    questionId: string,
    data: {
      text: string;
      codeSnippet?: string;
      codeLanguage?: string;
      difficulty?: string;
      order?: number;
    },
  ) => apiClient.put(`/templates/questions/${questionId}`, data),
  deleteQuestion: (questionId: string) => apiClient.delete(`/templates/questions/${questionId}`),
};

export const interviewsAPI = {
  create: (data: { templateId: string; candidateName?: string; sectionOrder?: string[] }) =>
    apiClient.post('/interviews', data),
  list: () => apiClient.get('/interviews'),
  get: (id: string) => apiClient.get(`/interviews/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.put(`/interviews/${id}/status`, { status }),
  updateOverallNotes: (id: string, notes: string) =>
    apiClient.put(`/interviews/${id}/overall-notes`, { overallNotes: notes }),
  delete: (id: string) => apiClient.delete(`/interviews/${id}`),

  getQuestion: (interviewId: string, index: number) =>
    apiClient.get(`/interviews/${interviewId}/questions/${index}`),
  skipQuestion: (interviewId: string, questionId: string) =>
    apiClient.put(`/interviews/${interviewId}/questions/${questionId}/skip`),

  saveFeedback: (questionId: string, data: { notes?: string; rating?: number }) =>
    apiClient.post(`/interviews/questions/${questionId}/feedback`, data),
  getFeedback: (questionId: string) => apiClient.get(`/interviews/questions/${questionId}/feedback`),
  deleteFeedback: (feedbackId: string) => apiClient.delete(`/interviews/feedback/${feedbackId}`),
};
