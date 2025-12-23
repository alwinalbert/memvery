import { getAuthToken } from '@/lib/auth';

/**
 * API client configuration
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

/**
 * API Client
 * Provides typed methods for all API endpoints
 */
export const api = {
  /**
   * Health check
   */
  health: {
    check: () => apiRequest<{ status: string; message: string }>('/api/health'),
  },

  /**
   * Content management
   */
  content: {
    submit: (url: string, type: 'video' | 'channel' = 'video') =>
      apiRequest<{
        success: boolean;
        message: string;
        data: {
          id: string;
          url: string;
          type: string;
          status: string;
        };
      }>('/api/content/submit', {
        method: 'POST',
        body: JSON.stringify({ url, type }),
      }),

    getJobs: () =>
      apiRequest<{
        success: boolean;
        data: Array<{
          id: string;
          url: string;
          type: string;
          status: string;
          createdAt: string;
        }>;
      }>('/api/content/jobs'),
  },

  /**
   * Chat functionality
   */
  chat: {
    sendMessage: (message: string, contentId?: string) =>
      apiRequest<{
        success: boolean;
        data: {
          id: string;
          message: string;
          timestamp: string;
        };
      }>('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message, contentId }),
      }),

    getHistory: (contentId: string) =>
      apiRequest<{
        success: boolean;
        data: {
          contentId: string;
          messages: Array<{
            id: string;
            role: string;
            content: string;
            timestamp: string;
          }>;
        };
      }>(`/api/chat/history/${contentId}`),
  },
};
