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
          videoId?: string;
          url?: string;
          type?: string;
          status: string;
          title?: string;
          createdAt?: string;
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
          videoId: string;
          title: string;
          channelTitle: string;
          duration: number;
          url: string;
          type: string;
          status: string;
          createdAt: string;
        }>;
      }>('/api/content/jobs'),

    deleteJob: (id: string) =>
      apiRequest<{
        success: boolean;
        message: string;
      }>(`/api/content/jobs/${id}`, {
        method: 'DELETE',
      }),
  },

  /**
   * Chat functionality
   */
  chat: {
    sendMessage: (message: string, videoId?: string, conversationId?: string) =>
      apiRequest<{
        success: boolean;
        data: {
          conversationId: string;
          response: string;
          sources: Array<{
            timestamp: string;
            startTime: number;
            similarity: number;
          }>;
          timestamp: string;
        };
      }>('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message, videoId, conversationId }),
      }),

    getConversations: () =>
      apiRequest<{
        success: boolean;
        data: Array<{
          id: string;
          title: string;
          jobId: string | null;
          videoTitle: string | null;
          videoId: string | null;
          createdAt: string;
          updatedAt: string;
        }>;
      }>('/api/chat/conversations'),

    getMessages: (conversationId: string) =>
      apiRequest<{
        success: boolean;
        data: {
          conversationId: string;
          jobId: string | null;
          messages: Array<{
            id: string;
            role: string;
            content: string;
            sources: Array<{
              timestamp: string;
              startTime: number;
              similarity: number;
            }>;
            timestamp: string;
          }>;
        };
      }>(`/api/chat/conversations/${conversationId}/messages`),

    deleteConversation: (conversationId: string) =>
      apiRequest<{
        success: boolean;
        message: string;
      }>(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      }),

    getHistory: (contentId: string) =>
      apiRequest<{
        success: boolean;
        data: {
          contentId: string;
          conversationId?: string;
          messages: Array<{
            id: string;
            role: string;
            content: string;
            sources?: Array<{
              timestamp: string;
              startTime: number;
              similarity: number;
            }>;
            timestamp: string;
          }>;
        };
      }>(`/api/chat/history/${contentId}`),
  },

  /**
   * Projects (Domain Knowledge)
   */
  projects: {
    getAll: () =>
      apiRequest<{
        success: boolean;
        data: Array<{
          id: string;
          name: string;
          description: string | null;
          itemCount: number;
          createdAt: string;
          updatedAt: string;
        }>;
      }>('/api/projects'),

    create: (name: string, description?: string) =>
      apiRequest<{
        success: boolean;
        data: {
          id: string;
          name: string;
          description: string | null;
          itemCount: number;
          createdAt: string;
          updatedAt: string;
        };
      }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      }),

    get: (id: string) =>
      apiRequest<{
        success: boolean;
        data: {
          id: string;
          name: string;
          description: string | null;
          createdAt: string;
          updatedAt: string;
          items: Array<{
            id: string;
            videoId: string;
            title: string;
            channelTitle: string;
            duration: number;
            url: string;
            status: string;
            addedAt: string;
            createdAt: string;
          }>;
        };
      }>(`/api/projects/${id}`),

    update: (id: string, name: string, description?: string) =>
      apiRequest<{
        success: boolean;
        data: {
          id: string;
          name: string;
          description: string | null;
          createdAt: string;
          updatedAt: string;
        };
      }>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description }),
      }),

    delete: (id: string) =>
      apiRequest<{
        success: boolean;
        message: string;
      }>(`/api/projects/${id}`, {
        method: 'DELETE',
      }),

    addItem: (projectId: string, jobId: string) =>
      apiRequest<{
        success: boolean;
        message: string;
      }>(`/api/projects/${projectId}/items`, {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      }),

    removeItem: (projectId: string, jobId: string) =>
      apiRequest<{
        success: boolean;
        message: string;
      }>(`/api/projects/${projectId}/items/${jobId}`, {
        method: 'DELETE',
      }),
  },
};
