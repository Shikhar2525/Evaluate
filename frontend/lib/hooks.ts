'use client';

import { useCallback, useEffect, useState } from 'react';
import { authAPI } from './api';
import { useAuthStore } from './store';
import { firebaseAuthService } from './firebase-service';

export const useAuth = () => {
  const { user, setAuth, clearAuth, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth from Firebase
    const initAuth = async () => {
      try {
        const currentUser = await firebaseAuthService.getCurrentUser();
        if (currentUser) {
          setAuth({
            id: currentUser.uid,
            email: currentUser.email || '',
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || '',
          });
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setAuth]);

  const signUp = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const user = await authAPI.signUp({ email, password, firstName, lastName });
      setAuth({
        id: user.data.user.uid,
        email: user.data.user.email || '',
        firstName: user.data.user.firstName || '',
        lastName: user.data.user.lastName || '',
      });
      return user.data;
    },
    [setAuth],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const user = await authAPI.signIn({ email, password });
      setAuth({
        id: user.data.user.uid,
        email: user.data.user.email || '',
        firstName: user.data.user.firstName || '',
        lastName: user.data.user.lastName || '',
      });
      return user.data;
    },
    [setAuth],
  );

  const logout = useCallback(async () => {
    await firebaseAuthService.signOut();
    clearAuth();
  }, [clearAuth]);

  return { user, loading, signUp, signIn, logout };
};

export const useAsyncData = <T,>(
  fetchFn: () => Promise<any>,
  dependencies: any[] = [],
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchFn();
      setData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
};
