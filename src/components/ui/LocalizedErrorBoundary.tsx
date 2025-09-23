'use client';

import React from 'react';
import { useLocalizedMessages } from '@/utils/errorMessages';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface LocalizedErrorDisplayProps {
  error?: Error;
  retry: () => void;
}

function LocalizedErrorDisplay({ error, retry }: LocalizedErrorDisplayProps) {
  const { getErrorMessage } = useLocalizedMessages();
  const { siteLanguage } = useSiteLanguage();

  const labels = {
    azerbaijani: {
      title: 'Ups! Nəsə səhv oldu',
      description: 'Təəssüf ki, gözlənilməz bir şey baş verdi. Zəhmət olmasa yenidən cəhd edin.',
      tryAgain: 'Yenidən cəhd et',
      reloadPage: 'Səhifəni yenilə'
    },
    english: {
      title: 'Oops! Something went wrong',
      description: 'We\'re sorry, but something unexpected happened. Please try again.',
      tryAgain: 'Try Again',
      reloadPage: 'Reload Page'
    },
    russian: {
      title: 'Упс! Что-то пошло не так',
      description: 'Извините, произошла неожиданная ошибка. Пожалуйста, попробуйте снова.',
      tryAgain: 'Попробовать снова',
      reloadPage: 'Перезагрузить страницу'
    }
  };

  const content = labels[siteLanguage] || labels.azerbaijani;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {content.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {content.description}
          </p>
          <div className="space-y-2">
            <button
              onClick={retry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              {content.tryAgain}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              {content.reloadPage}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return <LocalizedErrorDisplay error={this.state.error || undefined} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// CV Editor specific error boundary
export function CVEditorErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <LocalizedCVErrorDisplay error={error} retry={retry} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

function LocalizedCVErrorDisplay({ error, retry }: { error?: Error; retry: () => void }) {
  const { getErrorMessage } = useLocalizedMessages();
  const { siteLanguage } = useSiteLanguage();

  const labels = {
    azerbaijani: {
      title: 'CV editoru yüklənərkən xəta baş verdi',
      description: 'CV editoru yüklənərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
      tryAgain: 'Yenidən cəhd et',
      goToDashboard: 'Dashboard-a qayıt'
    },
    english: {
      title: 'Error loading CV editor',
      description: 'There was an error loading the CV editor. Please try again.',
      tryAgain: 'Try Again',
      goToDashboard: 'Go to Dashboard'
    },
    russian: {
      title: 'Ошибка загрузки редактора резюме',
      description: 'Произошла ошибка при загрузке редактора резюме. Пожалуйста, попробуйте снова.',
      tryAgain: 'Попробовать снова',
      goToDashboard: 'Перейти на панель'
    }
  };

  const content = labels[siteLanguage] || labels.azerbaijani;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {content.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {content.description}
          </p>
          <div className="space-y-2">
            <button
              onClick={retry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              {content.tryAgain}
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              {content.goToDashboard}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard specific error boundary  
export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <LocalizedDashboardErrorDisplay error={error} retry={retry} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

function LocalizedDashboardErrorDisplay({ error, retry }: { error?: Error; retry: () => void }) {
  const { getErrorMessage } = useLocalizedMessages();
  const { siteLanguage } = useSiteLanguage();

  const labels = {
    azerbaijani: {
      title: 'Dashboard yüklənmir',
      description: 'Dashboard yüklənərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
      tryAgain: 'Yenidən cəhd et',
      goToHome: 'Ana səhifəyə qayıt'
    },
    english: {
      title: 'Unable to load dashboard',
      description: 'Unable to load your dashboard. Please try again.',
      tryAgain: 'Try Again',
      goToHome: 'Go to Home'
    },
    russian: {
      title: 'Не удается загрузить панель',
      description: 'Не удается загрузить вашу панель. Пожалуйста, попробуйте снова.',
      tryAgain: 'Попробовать снова',
      goToHome: 'Перейти на главную'
    }
  };

  const content = labels[siteLanguage] || labels.azerbaijani;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {content.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {content.description}
          </p>
          <div className="space-y-2">
            <button
              onClick={retry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              {content.tryAgain}
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              {content.goToHome}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;