'use client';

import { useState, useCallback } from 'react';
import { Status, RAGResponse } from '@/types';

interface QueryState {
  status: Status;
  results: RAGResponse;
  error: string | null;
}

export function useQuery() {
  const [state, setState] = useState<QueryState>({
    status: 'idle',
    results: {
      answer: '',
      sources: [],
      chunksUsed: 0,
    },
    error: null,
  });

  const resetState = useCallback(() => {
    setState({
      status: 'idle',
      results: {
        answer: '',
        sources: [],
        chunksUsed: 0,
      },
      error: null,
    });
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      error,
      results: {
        answer: '',
        sources: [],
        chunksUsed: 0,
      },
    }));
  }, []);

  const searchQuery = useCallback(async (query: string) => {
    try {
      resetState();
      setState(prev => ({ ...prev, status: 'loading' }));

      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search knowledge base');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        status: 'success',
        results: data.data || {
          answer: '',
          sources: [],
          chunksUsed: 0,
        },
        error: null,
      }));

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  }, [resetState, setError]);

  return {
    ...state,
    searchQuery,
    reset: resetState,
  };
}
