import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  restoreFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  clearAuth: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  restoreFromStorage: () => {
    try {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (user && token) {
        set({ 
          user: JSON.parse(user), 
          token 
        });
      }
    } catch (error) {
      console.error('Failed to restore auth from storage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  },
}));

interface InterviewStore {
  currentInterviewId: string | null;
  currentQuestionIndex: number;
  setCurrentInterview: (id: string) => void;
  setCurrentQuestion: (index: number) => void;
  resetInterview: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  currentInterviewId: null,
  currentQuestionIndex: 0,
  setCurrentInterview: (id) => set({ currentInterviewId: id, currentQuestionIndex: 0 }),
  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),
  resetInterview: () => set({ currentInterviewId: null, currentQuestionIndex: 0 }),
}));
