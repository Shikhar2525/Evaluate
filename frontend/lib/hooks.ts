'use client';

import { useCallback, useEffect, useState } from 'react';
import { authAPI } from './api';
import { useAuthStore } from './store';

export const useAuth = () => {
  const { user, token, setAuth, clearAuth, restoreFromStorage } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore from localStorage on mount
    restoreFromStorage();
    setLoading(false);
  }, [restoreFromStorage]);

  const signUp = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const response = await authAPI.signUp({ email, password, firstName, lastName });
      setAuth(response.data.user, response.data.accessToken);
      return response.data;
    },
    [setAuth],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await authAPI.signIn({ email, password });
      setAuth(response.data.user, response.data.accessToken);
      return response.data;
    },
    [setAuth],
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  return { user, token, loading, signUp, signIn, logout };
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
