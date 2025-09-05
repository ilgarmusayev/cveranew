import React, { useState } from 'react';
import { useLinkedInImport } from '@/hooks/useLinkedInImport';

interface LinkedInImportComponentProps {
  onImportSuccess?: (cvId: string) => void;
  className?: string;
}

export function LinkedInImportComponent({ onImportSuccess, className = '' }: LinkedInImportComponentProps) {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [success, setSuccess] = useState('');
  const { importProfile, isLoading, error } = useLinkedInImport();

  const handleImport = async () => {
    if (!linkedinUrl.trim()) {
      return;
    }

    setSuccess('');

    const result = await importProfile(linkedinUrl.trim());

    if (result.success) {
      setSuccess('LinkedIn profili uğurla idxal edildi və CV yaradıldı!');
      if (result.cvId && onImportSuccess) {
        onImportSuccess(result.cvId);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLinkedinUrl(e.target.value);
    setSuccess('');
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn Import
        </h2>
        <p className="text-gray-600">
          LinkedIn profilinizi daxil edərək avtomatik CV yaradın
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profil URL
          </label>
          <input
            id="linkedin-url"
            type="text"
            placeholder="linkedin.com/in/username və ya www.linkedin.com/in/username"
            value={linkedinUrl}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-gray-400"
          />
          <p className="text-xs text-gray-500 mt-1">
            LinkedIn profil URL-ini və ya sadəcə username-i daxil edin
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={!linkedinUrl.trim() || isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium text-base"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>LinkedIn profili idxal edilir...</span>
            </div>
          ) : (
            'LinkedIn Profilinizi İdxal Edin'
          )}
        </button>
      </div>
    </div>
  );
}
