import { create } from 'zustand';
import { firebaseAuthService } from './firebase-service';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setAuth: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  clearAuth: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  initializeAuth: async () => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Get user data from database
          const user = await firebaseAuthService.getCurrentUser();
          if (user) {
            set({
              user: {
                id: user.uid,
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
              },
              isLoading: false,
            });
          }
        } else {
          set({ user: null, isLoading: false });
        }
        unsubscribe();
        resolve();
      });
    });
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
