'use client';

import { useState, useCallback } from 'react';
import { Status } from '@/types';

interface IngestionState {
  status: Status;
  progress: number;
  error: string | null;
  isUpdate?: boolean;
}

export function useIngestion() {
  const [state, setState] = useState<IngestionState>({
    status: 'idle',
    progress: 0,
    error: null,
  });

  const resetState = useCallback(() => {
    setState({
      status: 'idle',
      progress: 0,
      error: null,
    });
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      error,
      progress: 0,
    }));
  }, []);

  const ingestUrl = useCallback(async (url: string) => {
    try {
      resetState();
      setState(prev => ({ ...prev, status: 'loading', progress: 0 }));

      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 500);

      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to ingest URL');
      }

      const responseData = await response.json();
      
      setState(prev => ({
        ...prev,
        status: 'success',
        progress: 100,
        error: null,
        isUpdate: responseData.data?.isUpdate || false,
      }));

      setTimeout(resetState, 5000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  }, [resetState, setError]);

  return {
    ...state,
    ingestUrl,
    reset: resetState,
  };
}
