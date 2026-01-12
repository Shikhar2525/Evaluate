import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  ref,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  Query,
  onValue,
} from 'firebase/database';
import { auth, database } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
}

export interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  createdAt: number;
}

// Auth Service
export const firebaseAuthService = {
  async signUp(email: string, password: string, firstName: string, lastName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Save user data to database
    await set(ref(database, `users/${userId}`), {
      email,
      firstName,
      lastName,
      createdAt: Date.now(),
    });

    return {
      uid: userId,
      email,
      firstName,
      lastName,
    };
  },

  async signIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    const userData = await get(ref(database, `users/${userId}`));
    const data = userData.val();

    return {
      uid: userId,
      email: userCredential.user.email,
      firstName: data?.firstName,
      lastName: data?.lastName,
    };
  },

  async signOut() {
    await signOut(auth);
  },

  getCurrentUser(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userData = await get(ref(database, `users/${user.uid}`));
          const data = userData.val();
          resolve({
            uid: user.uid,
            email: user.email,
            firstName: data?.firstName,
            lastName: data?.lastName,
          });
        } else {
          resolve(null);
        }
        unsubscribe();
      });
    });
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await get(ref(database, `users/${user.uid}`));
        const data = userData.val();
        callback({
          uid: user.uid,
          email: user.email,
          firstName: data?.firstName,
          lastName: data?.lastName,
        });
      } else {
        callback(null);
      }
    });
  },
};

// Templates Service
export const firebaseTemplatesService = {
  async create(userId: string, data: { name: string; description?: string }) {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const templateData = {
      id: templateId,
      userId,
      name: data.name,
      description: data.description || '',
      sections: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await set(ref(database, `templates/${templateId}`), templateData);
    return templateData;
  },

  async list(userId: string) {
    const templates = await get(ref(database, 'templates'));
    const allTemplates = templates.val() || {};

    return Object.values(allTemplates).filter(
      (t: any) => t.userId === userId,
    );
  },

  async get(templateId: string) {
    const template = await get(ref(database, `templates/${templateId}`));
    return template.val();
  },

  async update(templateId: string, data: { name?: string; description?: string }) {
    const updates: any = { updatedAt: Date.now() };
    if (data.name) updates.name = data.name;
    if (data.description) updates.description = data.description;

    await update(ref(database, `templates/${templateId}`), updates);
    const template = await get(ref(database, `templates/${templateId}`));
    return template.val();
  },

  async delete(templateId: string) {
    await remove(ref(database, `templates/${templateId}`));
  },

  async addSection(
    templateId: string,
    data: { title: string; order?: number },
  ) {
    const sectionId = `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const template = await get(ref(database, `templates/${templateId}`));
    const templateData = template.val();

    const sections = templateData.sections || {};
    sections[sectionId] = {
      id: sectionId,
      title: data.title,
      order: data.order || Object.keys(sections).length,
      questions: {},
      createdAt: Date.now(),
    };

    await update(ref(database, `templates/${templateId}`), {
      sections,
      updatedAt: Date.now(),
    });

    return sections[sectionId];
  },

  async updateSection(
    templateId: string,
    sectionId: string,
    data: { title: string; order?: number },
  ) {
    const updates: any = {};
    if (data.title) updates[`sections/${sectionId}/title`] = data.title;
    if (data.order !== undefined) updates[`sections/${sectionId}/order`] = data.order;

    await update(ref(database, `templates/${templateId}`), updates);
    const section = await get(
      ref(database, `templates/${templateId}/sections/${sectionId}`),
    );
    return section.val();
  },

  async deleteSection(templateId: string, sectionId: string) {
    await remove(ref(database, `templates/${templateId}/sections/${sectionId}`));
  },

  async addQuestion(
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
  ) {
    const questionId = `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const questionData = {
      id: questionId,
      text: data.text,
      codeSnippet: data.codeSnippet || '',
      codeLanguage: data.codeLanguage || '',
      difficulty: data.difficulty || 'medium',
      expectedAnswer: data.expectedAnswer || '',
      order: data.order || 0,
      createdAt: Date.now(),
    };

    await set(
      ref(database, `templates/${templateId}/sections/${sectionId}/questions/${questionId}`),
      questionData,
    );

    await update(ref(database, `templates/${templateId}`), { updatedAt: Date.now() });

    return questionData;
  },

  async updateQuestion(
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
  ) {
    const updates: any = {};
    if (data.text) updates.text = data.text;
    if (data.codeSnippet !== undefined) updates.codeSnippet = data.codeSnippet;
    if (data.codeLanguage !== undefined) updates.codeLanguage = data.codeLanguage;
    if (data.difficulty) updates.difficulty = data.difficulty;
    if (data.order !== undefined) updates.order = data.order;

    await update(
      ref(database, `templates/${templateId}/sections/${sectionId}/questions/${questionId}`),
      updates,
    );

    const question = await get(
      ref(database, `templates/${templateId}/sections/${sectionId}/questions/${questionId}`),
    );
    return question.val();
  },

  async deleteQuestion(templateId: string, sectionId: string, questionId: string) {
    await remove(
      ref(database, `templates/${templateId}/sections/${sectionId}/questions/${questionId}`),
    );
    await update(ref(database, `templates/${templateId}`), { updatedAt: Date.now() });
  },
};

// Interviews Service
export const firebaseInterviewsService = {
  async create(
    userId: string,
    data: {
      templateId: string;
      candidateName?: string;
      sectionOrder?: string[];
    },
  ) {
    const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const template = await get(ref(database, `templates/${data.templateId}`));
    const templateData = template.val();

    const interviewData: any = {
      id: interviewId,
      userId,
      templateId: data.templateId,
      candidateName: data.candidateName || 'Candidate',
      status: 'in_progress',
      sections: {},
      feedback: {},
      overallNotes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Copy template structure to interview
    if (templateData.sections) {
      for (const [sectionId, section] of Object.entries(templateData.sections)) {
        interviewData.sections[sectionId as string] = {
          id: sectionId,
          title: (section as any).title,
          order: (section as any).order,
          questions: {},
        };

        if ((section as any).questions) {
          for (const [qId, question] of Object.entries((section as any).questions)) {
            interviewData.sections[sectionId as string].questions[qId as string] = {
              ...(question as any),
              skipped: false,
              feedbackId: null,
            };
          }
        }
      }
    }

    await set(ref(database, `interviews/${interviewId}`), interviewData);
    return interviewData;
  },

  async list(userId: string) {
    const interviews = await get(ref(database, 'interviews'));
    const allInterviews = interviews.val() || {};

    return Object.values(allInterviews)
      .filter((i: any) => i.userId === userId)
      .sort((a: any, b: any) => b.createdAt - a.createdAt);
  },

  async get(interviewId: string) {
    const interview = await get(ref(database, `interviews/${interviewId}`));
    return interview.val();
  },

  async updateStatus(interviewId: string, status: string) {
    await update(ref(database, `interviews/${interviewId}`), {
      status,
      updatedAt: Date.now(),
    });
  },

  async updateOverallNotes(interviewId: string, notes: string) {
    await update(ref(database, `interviews/${interviewId}`), {
      overallNotes: notes,
      updatedAt: Date.now(),
    });
  },

  async delete(interviewId: string) {
    await remove(ref(database, `interviews/${interviewId}`));
  },

  async getQuestion(interviewId: string, sectionId: string, questionId: string) {
    const question = await get(
      ref(database, `interviews/${interviewId}/sections/${sectionId}/questions/${questionId}`),
    );
    return question.val();
  },

  async skipQuestion(interviewId: string, sectionId: string, questionId: string) {
    await update(
      ref(
        database,
        `interviews/${interviewId}/sections/${sectionId}/questions/${questionId}`,
      ),
      {
        skipped: true,
      },
    );
  },

  async saveFeedback(
    interviewId: string,
    sectionId: string,
    questionId: string,
    data: { notes?: string; rating?: number },
  ) {
    const feedbackId = `feedback_${Date.now()}`;
    const feedbackData = {
      id: feedbackId,
      notes: data.notes || '',
      rating: data.rating || 0,
      createdAt: Date.now(),
    };

    await set(
      ref(
        database,
        `interviews/${interviewId}/sections/${sectionId}/questions/${questionId}/feedback`,
      ),
      feedbackData,
    );

    await update(
      ref(
        database,
        `interviews/${interviewId}/sections/${sectionId}/questions/${questionId}`,
      ),
      {
        feedbackId,
      },
    );

    return feedbackData;
  },

  async getFeedback(interviewId: string, sectionId: string, questionId: string) {
    const feedback = await get(
      ref(
        database,
        `interviews/${interviewId}/sections/${sectionId}/questions/${questionId}/feedback`,
      ),
    );
    return feedback.val();
  },

  async deleteFeedback(
    interviewId: string,
    sectionId: string,
    questionId: string,
  ) {
    await remove(
      ref(
        database,
        `interviews/${interviewId}/sections/${sectionId}/questions/${questionId}/feedback`,
      ),
    );
    await update(
      ref(
        database,
        `interviews/${interviewId}/sections/${sectionId}/questions/${questionId}`,
      ),
      {
        feedbackId: null,
      },
    );
  },
};
