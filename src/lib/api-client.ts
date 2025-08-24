// API client with automatic token refresh

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export class ApiClient {
  private static instance: ApiClient;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  private async processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  public async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('accessToken');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      // If token expired, try to refresh
      if (response.status === 401 && token) {
        if (this.isRefreshing) {
          // If already refreshing, wait for it to complete
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retry the original request with new token
            const newToken = localStorage.getItem('accessToken');
            if (newToken) {
              headers['Authorization'] = `Bearer ${newToken}`;
              return fetch(url, { ...options, headers, credentials: 'include' });
            }
            throw new Error('No token after refresh');
          }).then(async (retryResponse) => {
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              return { data, success: true };
            } else {
              const errorData = await retryResponse.json();
              return { error: errorData.error || 'Request failed', success: false };
            }
          });
        }

        this.isRefreshing = true;

        try {
          const newToken = await this.refreshToken();
          
          if (newToken) {
            this.processQueue(null, newToken);
            
            // Retry the original request with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
              credentials: 'include',
            });

            if (retryResponse.ok) {
              const data = await retryResponse.json();
              return { data, success: true };
            } else {
              const errorData = await retryResponse.json();
              return { error: errorData.error || 'Request failed', success: false };
            }
          } else {
            // Refresh failed, redirect to login
            this.processQueue(new Error('Token refresh failed'), null);
            localStorage.removeItem('accessToken');
            console.log('Token expired, redirecting to login');
            window.location.href = '/login';
            return { error: 'Token expired', success: false };
          }
        } catch (error) {
          this.processQueue(error, null);
          localStorage.removeItem('accessToken');
          console.log('Token refresh failed, redirecting to login');
          window.location.href = '/login';
          return { error: 'Token refresh failed', success: false };
        } finally {
          this.isRefreshing = false;
        }
      }

      if (response.ok) {
        const data = await response.json();
        return { data, success: true };
      } else {
        const errorData = await response.json();
        return { error: errorData.error || 'Request failed', success: false };
      }
    } catch (error) {
      console.error('API request error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Network error', 
        success: false 
      };
    }
  }

  // Convenience methods
  public async get<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' });
  }

  public async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Export convenience function
export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  return apiClient.request<T>(url, options);
}
