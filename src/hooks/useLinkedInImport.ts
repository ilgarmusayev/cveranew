import { useState } from 'react';

export interface LinkedInImportResult {
  success: boolean;
  cvId?: string;
  profileData?: {
    name: string;
    headline: string;
    location: string;
    experienceCount?: number;
    educationCount?: number;
    skillsCount?: number;
  };
  error?: string;
  message?: string;
}

export const useLinkedInImport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importProfile = async (linkedinUrl: string): Promise<LinkedInImportResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Giriş tələb olunur');
      }

      const response = await fetch('/api/import/linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ linkedinUrl })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import zamanı xəta baş verdi');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Bilinməyən xəta baş verdi';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    importProfile,
    isLoading,
    error
  };
};
