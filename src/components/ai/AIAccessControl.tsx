'use client';

import React, { useState } from 'react';
import { hasAIAccess, getUpgradeSuggestions, getTierDisplayName } from '@/lib/tier-permissions';

interface AIAccessControlProps {
  userTier: string;
  onUpgrade: () => void;
  children: React.ReactNode;
  feature: 'summary' | 'improvement' | 'suggestions' | 'optimization';
  fallbackContent?: React.ReactNode;
}

export default function AIAccessControl({
  userTier,
  onUpgrade,
  children,
  feature,
  fallbackContent
}: AIAccessControlProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const hasAccess = hasAIAccess(userTier);

  const getFeatureName = (feature: string) => {
    switch (feature) {
      case 'summary': return 'AI Xülasə Yaratma';
      case 'improvement': return 'AI CV Təkmilləşdirmə';
      case 'suggestions': return 'AI Təklifləri';
      case 'optimization': return 'AI Optimallaşdırma';
      default: return 'AI Xüsusiyyəti';
    }
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  const suggestion = getUpgradeSuggestions(userTier, 'ai');

  return (
    <div className="relative">
      {/* Blurred/Disabled Content */}
      <div className="relative">
        <div className="filter blur-sm pointer-events-none opacity-50">
          {fallbackContent || children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent flex items-center justify-center">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200 max-w-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {getFeatureName(feature)}
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              {suggestion.message}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  onUpgrade();
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Paketləri Görün
              </button>

              <div className="text-xs text-gray-500">
                Cari paketiniz: <span className="font-medium">{getTierDisplayName(userTier)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Summary Generator Component with Access Control
interface AISummaryGeneratorProps {
  userTier: string;
  cvData: any;
  onSummaryGenerated: (summary: string) => void;
  onUpgrade: () => void;
}

export function AISummaryGenerator({
  userTier,
  cvData,
  onSummaryGenerated,
  onUpgrade
}: AISummaryGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSummary = async () => {
    if (!hasAIAccess(userTier)) {
      onUpgrade();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cvData })
      });

      if (!response.ok) {
        throw new Error('AI xülasə yaradıla bilmədi');
      }

      const data = await response.json();
      onSummaryGenerated(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const summaryContent = (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Xülasə Yaradıcı</h3>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            AI Powered
          </span>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        CV məlumatlarınız əsasında peşəkar xülasə yaradın. AI sizin təcrübə və bacarıqlarınızı analiz edərək
        işəgötürənləri cəlb edəcək xülasə yaradacaq.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        onClick={generateSummary}
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            AI xülasə yaradılır...
          </div>
        ) : (
          'AI ilə Xülasə Yaradın'
        )}
      </button>
    </div>
  );

  return (
    <AIAccessControl
      userTier={userTier}
      onUpgrade={onUpgrade}
      feature="summary"
      fallbackContent={
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-400">AI Xülasə Yaradıcı</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              Premium Xüsusiyyət
            </span>
          </div>
          <p className="text-gray-400 mb-6">
            Bu xüsusiyyət yalnız Orta və Premium istifadəçiləri üçün əlçatandır.
          </p>
          <div className="w-full bg-gray-200 px-4 py-3 rounded-lg">
            <span className="text-gray-400">AI ilə Xülasə Yaradın</span>
          </div>
        </div>
      }
    >
      {summaryContent}
    </AIAccessControl>
  );
}
