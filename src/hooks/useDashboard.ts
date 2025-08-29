'use client';

import { useState, useCallback } from 'react';
import { Source } from '@/types';

interface DashboardState {
  sources: (Source & { chunkCount?: number; contentLength?: number })[];
  loading: boolean;
  error: string | null;
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    sources: [],
    loading: false,
    error: null,
  });

  const refreshSources = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/sources');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch sources');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        sources: data.sources || [],
        loading: false,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        loading: false,
      }));
    }
  }, []);

  const deleteSource = useCallback(async (sourceId: number) => {
    try {
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete source');
      }

      setState(prev => ({
        ...prev,
        sources: prev.sources.filter(source => source.id !== sourceId),
      }));

    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete source');
    }
  }, []);

  return {
    ...state,
    refreshSources,
    deleteSource,
  };
}
