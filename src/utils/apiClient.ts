// Utility for making API calls with language headers
import { SiteLanguage } from '@/contexts/SiteLanguageContext';

interface ApiRequestOptions extends RequestInit {
  siteLanguage?: SiteLanguage;
}

export async function apiRequest(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { siteLanguage, ...fetchOptions } = options;
  
  // Get current language from localStorage if not provided
  const currentLanguage = siteLanguage || (typeof window !== 'undefined' ? 
    (localStorage.getItem('siteLanguage') as SiteLanguage) || 'azerbaijani' : 'azerbaijani');

  // Get auth token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers = {
    'Content-Type': 'application/json',
    'x-site-language': currentLanguage,
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  };

  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}

// Helper function to make POST requests with language header
export async function apiPost(url: string, data: any, siteLanguage?: SiteLanguage): Promise<Response> {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
    siteLanguage,
  });
}

// Helper function to make GET requests with language header
export async function apiGet(url: string, siteLanguage?: SiteLanguage): Promise<Response> {
  return apiRequest(url, {
    method: 'GET',
    siteLanguage,
  });
}

// Helper function to make PUT requests with language header
export async function apiPut(url: string, data: any, siteLanguage?: SiteLanguage): Promise<Response> {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    siteLanguage,
  });
}

// Helper function to make DELETE requests with language header
export async function apiDelete(url: string, siteLanguage?: SiteLanguage): Promise<Response> {
  return apiRequest(url, {
    method: 'DELETE',
    siteLanguage,
  });
}