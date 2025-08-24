// React hook for API calls with automatic token refresh
'use client';

import { useState, useCallback } from 'react';
import { apiClient, ApiResponse } from '../lib/api-client';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const request = useCallback(async (
    url: string,
    requestOptions?: RequestInit
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.request<T>(url, requestOptions);
      
      if (response.success && response.data) {
        setData(response.data);
        options.onSuccess?.(response.data);
      } else {
        setError(response.error || 'Unknown error');
        options.onError?.(response.error || 'Unknown error');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return { error: errorMessage, success: false };
    } finally {
      setLoading(false);
    }
  }, [options]);

  const get = useCallback((url: string) => {
    return request(url, { method: 'GET' });
  }, [request]);

  const post = useCallback((url: string, body?: any) => {
    return request(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }, [request]);

  const put = useCallback((url: string, body?: any) => {
    return request(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }, [request]);

  const del = useCallback((url: string) => {
    return request(url, { method: 'DELETE' });
  }, [request]);

  return {
    loading,
    error,
    data,
    request,
    get,
    post,
    put,
    delete: del,
    clearError: () => setError(null),
  };
}

// Hook specifically for AI API calls
export function useAiApi() {
  return useApi({
    onError: (error) => {
      console.error('AI API Error:', error);
      if (error.includes('jwt expired') || error.includes('JWT verification failed')) {
        console.log('JWT expired in AI API, token refresh should handle this automatically');
      }
    }
  });
}
