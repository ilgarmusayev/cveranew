// API client utilities for frontend
export class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    // Use dynamic base URL detection for Vercel deployment
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      this.baseUrl = window.location.origin;
    } else {
      // Server-side: use environment variable or default
      this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000';
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearSession() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.clear();
      sessionStorage.clear();
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    // Handle absolute URLs
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Get token from localStorage if not already set
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      console.log('Making API request to:', url);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-JSON responses (like redirects)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('Non-JSON response:', response.status, response.statusText);
        if (!response.ok) {
          // Try to get text response for better error info
          const text = await response.text();
          console.log('Error response text:', text);
          throw new Error(`HTTP xətası! status: ${response.status} - ${response.statusText}`);
        }
        return { data: null, status: response.status };
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          this.clearSession();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          throw new Error('Autentifikasiya tələb olunur');
        }

        throw new Error(data.error || `HTTP xətası! status: ${response.status}`);
      }

      return { data, status: response.status };
    } catch (error) {
      console.error('API sorğusu uğursuz oldu:', error);
      throw error;
    }
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async patch(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
