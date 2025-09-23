'use client';

import React from 'react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

// Localized loading messages
export const getLoadingMessages = (siteLanguage: string) => {
  const messages = {
    azerbaijani: {
      loading: 'Yüklənir...',
      cvLoading: 'CV yüklənir...',
      pleaseWait: 'Zəhmət olmasa gözləyin',
      redirecting: 'Yönləndirilib...',
      processing: 'İşlənir...',
      importing: 'İdxal edilir...',
      saving: 'Saxlanılır...',
      updating: 'Yenilənir...',
      loggingIn: 'Giriş edilir...',
      autoSaveActive: 'Avtomatik saxlama aktiv',
      verifying: 'Təsdiqlənir...'
    },
    english: {
      loading: 'Loading...',
      cvLoading: 'Loading CV...',
      pleaseWait: 'Please wait',
      redirecting: 'Redirecting...',
      processing: 'Processing...',
      importing: 'Importing...',
      saving: 'Saving...',
      updating: 'Updating...',
      loggingIn: 'Logging in...',
      autoSaveActive: 'Auto-save active',
      verifying: 'Verifying...'
    },
    russian: {
      loading: 'Загрузка...',
      cvLoading: 'Загрузка резюме...',
      pleaseWait: 'Пожалуйста, подождите',
      redirecting: 'Перенаправление...',
      processing: 'Обработка...',
      importing: 'Импорт...',
      saving: 'Сохранение...',
      updating: 'Обновление...',
      loggingIn: 'Вход в систему...',
      autoSaveActive: 'Автосохранение активно',
      verifying: 'Проверка...'
    }
  };
  
  return messages[siteLanguage as keyof typeof messages] || messages.azerbaijani;
};

// Custom hook for loading messages
export const useLoadingMessages = () => {
  const { siteLanguage } = useSiteLanguage();
  return getLoadingMessages(siteLanguage);
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-500'
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message,
  className = ''
}) => {
  const { siteLanguage } = useSiteLanguage();
  const loadingMessages = getLoadingMessages(siteLanguage);
  const displayMessage = message || loadingMessages.loading;
  
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">{displayMessage}</p>
        </div>
      </div>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  message
}) => {
  const { siteLanguage } = useSiteLanguage();
  const loadingMessages = getLoadingMessages(siteLanguage);
  const displayMessage = message || loadingMessages.loading;
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 text-lg">{displayMessage}</p>
      </div>
    </div>
  );
};

// OPTIMIZED: Faster loading component with reduced animation
export const QuickLoading: React.FC<{ message?: string }> = ({
  message
}) => {
  const { siteLanguage } = useSiteLanguage();
  const loadingMessages = getLoadingMessages(siteLanguage);
  const displayMessage = message || loadingMessages.loading;
  
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
        <p className="mt-2 text-gray-700 text-sm font-medium">{displayMessage}</p>
      </div>
    </div>
  );
};

export const CVEditorLoading: React.FC = () => {
  const { siteLanguage } = useSiteLanguage();
  const loadingMessages = getLoadingMessages(siteLanguage);
  
  return (
    <div className="min-h-[600px] bg-gray-50 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{loadingMessages.cvLoading}</p>
      </div>
    </div>
  );
};

export const DashboardLoading: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      {/* CVs grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TemplateGalleryLoading: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  isLoading,
  children,
  className = '',
  disabled = false
}) => {
  return (
    <button
      className={`relative ${className} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
      disabled={disabled || isLoading}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" color="white" />
        </div>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

export const InlineLoading: React.FC<{ message?: string }> = ({ 
  message
}) => {
  const { siteLanguage } = useSiteLanguage();
  const loadingMessages = getLoadingMessages(siteLanguage);
  const displayMessage = message || loadingMessages.loading;
  
  return (
    <div className="flex items-center space-x-2 py-2">
      <LoadingSpinner size="sm" />
      <span className="text-gray-600">{displayMessage}</span>
    </div>
  );
};
