'use client';

import { useCallback, useEffect, useState } from 'react';
import { authAPI } from './api';
import { useAuthStore } from './store';
import { firebaseAuthService } from './firebase-service';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export const useAuth = () => {
  const { user, setAuth, clearAuth, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    // Set initial loading state based on whether we have a saved user
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      setLoading(false);
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is logged in, fetch their data
          const currentUser = await firebaseAuthService.getCurrentUser();
          if (currentUser) {
            setAuth({
              id: currentUser.uid,
              email: currentUser.email || '',
              firstName: currentUser.firstName || '',
              lastName: currentUser.lastName || '',
              photoURL: currentUser.photoURL,
            });
          }
        } else {
          // User is logged out
          clearAuth();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setAuth, clearAuth, setLoading]);

  const signUp = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const user = await authAPI.signUp({ email, password, firstName, lastName });
      setAuth({
        id: user.data.user.uid,
        email: user.data.user.email || '',
        firstName: user.data.user.firstName || '',
        lastName: user.data.user.lastName || '',
        photoURL: user.data.user.photoURL,
      });
      setLoading(false);
      return user.data;
    },
    [setAuth, setLoading],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const user = await authAPI.signIn({ email, password });
      setAuth({
        id: user.data.user.uid,
        email: user.data.user.email || '',
        firstName: user.data.user.firstName || '',
        lastName: user.data.user.lastName || '',
        photoURL: user.data.user.photoURL,
      });
      setLoading(false);
      return user.data;
    },
    [setAuth, setLoading],
  );

  const signInWithGoogle = useCallback(async () => {
    const user = await firebaseAuthService.signInWithGoogle();
    setAuth({
      id: user.uid,
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      photoURL: user.photoURL,
    });
    setLoading(false);
    return user;
  }, [setAuth, setLoading]);

  const logout = useCallback(async () => {
    await firebaseAuthService.signOut();
    clearAuth();
  }, [clearAuth]);

  return { user, loading: isLoading, signUp, signIn, signInWithGoogle, logout };
};

export const useAsyncData = <T,>(
  fetchFn: () => Promise<any>,
  dependencies: any[] = [],
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchFn();
        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only fetch if all dependencies are truthy (not null/undefined)
    const shouldFetch = dependencies.length === 0 || dependencies.every(dep => dep);
    
    if (shouldFetch) {
      fetchData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, dependencies);

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

  return { data, loading, error, refetch };
};
