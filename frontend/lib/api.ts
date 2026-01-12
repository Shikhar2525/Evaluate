import { useAuthStore } from './store';
import {
  firebaseAuthService,
  firebaseTemplatesService,
  firebaseInterviewsService,
} from './firebase-service';

// Auth API - Using Firebase
export const authAPI = {
  signUp: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const user = await firebaseAuthService.signUp(data.email, data.password, data.firstName, data.lastName);
    return { data: { user } };
  },

  signIn: async (data: { email: string; password: string }) => {
    const user = await firebaseAuthService.signIn(data.email, data.password);
    return { data: { user } };
  },

  getProfile: async () => {
    const user = await firebaseAuthService.getCurrentUser();
    return { data: { user } };
  },
};

// Templates API - Using Firebase
export const templatesAPI = {
  create: async (data: { name: string; description?: string }) => {
    const authStore = useAuthStore.getState();
    if (!authStore.user) throw new Error('User not authenticated');
    const template = await firebaseTemplatesService.create(authStore.user.id, data);
    return { data: template };
  },

  list: async () => {
    const authStore = useAuthStore.getState();
    if (!authStore.user) throw new Error('User not authenticated');
    const templates = await firebaseTemplatesService.list(authStore.user.id);
    return { data: templates };
  },

  get: async (id: string) => {
    const template = await firebaseTemplatesService.get(id);
    return { data: template };
  },

  update: async (id: string, data: { name?: string; description?: string }) => {
    const template = await firebaseTemplatesService.update(id, data);
    return { data: template };
  },

  delete: async (id: string) => {
    await firebaseTemplatesService.delete(id);
    return { data: { id } };
  },

  addSection: async (templateId: string, data: { title: string; order?: number }) => {
    const section = await firebaseTemplatesService.addSection(templateId, data);
    return { data: section };
  },

  updateSection: async (
    templateId: string,
    sectionId: string,
    data: { title: string; order?: number },
  ) => {
    const section = await firebaseTemplatesService.updateSection(templateId, sectionId, data);
    return { data: section };
  },

  deleteSection: async (templateId: string, sectionId: string) => {
    await firebaseTemplatesService.deleteSection(templateId, sectionId);
    return { data: { sectionId } };
  },

  addQuestion: async (
    templateId: string,
    sectionId: string,
    data: {
      text: string;
      codeSnippet?: string;
      codeLanguage?: string;
      difficulty?: string;
      expectedAnswer?: string;
      order?: number;
    },
  ) => {
    const question = await firebaseTemplatesService.addQuestion(
      templateId,
      sectionId,
      data,
    );
    return { data: question };
  },

  updateQuestion: async (
    templateId: string,
    sectionId: string,
    questionId: string,
    data: {
      text?: string;
      codeSnippet?: string;
      codeLanguage?: string;
      difficulty?: string;
      order?: number;
    },
  ) => {
    const question = await firebaseTemplatesService.updateQuestion(
      templateId,
      sectionId,
      questionId,
      data,
    );
    return { data: question };
  },

  deleteQuestion: async (
    templateId: string,
    sectionId: string,
    questionId: string,
  ) => {
    await firebaseTemplatesService.deleteQuestion(
      templateId,
      sectionId,
      questionId,
    );
    return { data: { questionId } };
  },
};

// Interviews API - Using Firebase
export const interviewsAPI = {
  create: async (data: {
    templateId: string;
    candidateName?: string;
    sectionOrder?: string[];
  }) => {
    const authStore = useAuthStore.getState();
    if (!authStore.user) throw new Error('User not authenticated');
    const interview = await firebaseInterviewsService.create(
      authStore.user.id,
      data,
    );
    return { data: interview };
  },

  list: async () => {
    const authStore = useAuthStore.getState();
    if (!authStore.user) throw new Error('User not authenticated');
    const interviews = await firebaseInterviewsService.list(authStore.user.id);
    return { data: interviews };
  },

  get: async (id: string) => {
    const interview = await firebaseInterviewsService.get(id);
    return { data: interview };
  },

  updateStatus: async (id: string, status: string) => {
    await firebaseInterviewsService.updateStatus(id, status);
    const interview = await firebaseInterviewsService.get(id);
    return { data: interview };
  },

  updateOverallNotes: async (id: string, notes: string) => {
    await firebaseInterviewsService.updateOverallNotes(id, notes);
    const interview = await firebaseInterviewsService.get(id);
    return { data: interview };
  },

  delete: async (id: string) => {
    await firebaseInterviewsService.delete(id);
    return { data: { id } };
  },

  getQuestion: async (
    interviewId: string,
    sectionId: string,
    questionId: string,
  ) => {
    const question = await firebaseInterviewsService.getQuestion(
      interviewId,
      sectionId,
      questionId,
    );
    return { data: question };
  },

  skipQuestion: async (
    interviewId: string,
    sectionId: string,
    questionId: string,
  ) => {
    await firebaseInterviewsService.skipQuestion(
      interviewId,
      sectionId,
      questionId,
    );
    return { data: { questionId } };
  },

  saveFeedback: async (
    interviewId: string,
    sectionId: string,
    questionId: string,
    data: { notes?: string; rating?: number },
  ) => {
    const feedback = await firebaseInterviewsService.saveFeedback(
      interviewId,
      sectionId,
      questionId,
      data,
    );
    return { data: feedback };
  },

  getFeedback: async (
    interviewId: string,
    sectionId: string,
    questionId: string,
  ) => {
    const feedback = await firebaseInterviewsService.getFeedback(
      interviewId,
      sectionId,
      questionId,
    );
    return { data: feedback };
  },

  deleteFeedback: async (
    interviewId: string,
    sectionId: string,
    questionId: string,
  ) => {
    await firebaseInterviewsService.deleteFeedback(
      interviewId,
      sectionId,
      questionId,
    );
    return { data: { questionId } };
  },
};
