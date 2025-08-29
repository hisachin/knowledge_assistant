'use client';

import { useState, useCallback, useRef } from 'react';
import { Status, RAGResponse } from '@/types';

interface StreamingQueryState {
  status: Status;
  results: RAGResponse;
  error: string | null;
  isStreaming: boolean;
  progress: string;
}

export function useStreamingQuery() {
  const [state, setState] = useState<StreamingQueryState>({
    status: 'idle',
    results: {
      answer: '',
      sources: [],
      chunksUsed: 0,
    },
    error: null,
    isStreaming: false,
    progress: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const resetState = useCallback(() => {
    setState({
      status: 'idle',
      results: {
        answer: '',
        sources: [],
        chunksUsed: 0,
      },
      error: null,
      isStreaming: false,
      progress: '',
    });
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      error,
      isStreaming: false,
      progress: '',
    }));
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isStreaming: false,
      progress: '',
    }));
  }, []);

  const searchQuery = useCallback(async (query: string) => {
    try {
      resetState();
      setState(prev => ({ 
        ...prev, 
        status: 'loading', 
        isStreaming: true,
        progress: 'Starting query processing...'
      }));

      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/query/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search knowledge base');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                switch (data.type) {
                  case 'status':
                    console.log('Status update:', data.message);
                    setState(prev => ({
                      ...prev,
                      progress: data.message,
                    }));
                    break;

                  case 'partial':
                    console.log('Received partial update:', data.data.answer.length, 'characters');
                    setState(prev => ({
                      ...prev,
                      results: {
                        ...data.data,
                        answer: data.data.answer,
                      },
                      progress: 'Generating answer...',
                      isStreaming: true,
                    }));
                    break;

                  case 'complete':
                    console.log('Streaming completed');
                    setState(prev => ({
                      ...prev,
                      status: 'success',
                      results: data.data,
                      isStreaming: false,
                      progress: '',
                    }));
                    return;

                  case 'error':
                    console.error('Streaming error:', data.error);
                    throw new Error(data.error);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request cancelled by user');
        setState(prev => ({
          ...prev,
          status: 'idle',
          isStreaming: false,
          progress: '',
        }));
        return;
      }
      
      console.error('Streaming query error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  }, [resetState, setError]);

  return {
    ...state,
    searchQuery,
    reset: resetState,
    stopStreaming,
  };
}
