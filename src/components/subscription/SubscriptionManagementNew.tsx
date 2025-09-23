'use client';

import React, { useState } from 'react';
import { useNotification } from '@/components/ui/Toast';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  provider: string;
  expiresAt: string;
  startedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  subscriptions?: Subscription[];
}

interface SubscriptionManagementProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const TIER_FEATURES = {
  Free: {
    name: 'Pulsuz',
    price: '0₼',
    features: [
      'Sadə şablon',
      'PDF yükləmə',
      'Əsas məlumatlar',
    ],
    limitations: [
      'Yalnız 1 şablon',
      'Şəkil yükləmə yoxdur',
      'Məhdud dizayn',
    ],
    color: 'gray',
  },
  Medium: {
    name: 'Orta',
    price: '9.99₼',
    features: [
      'Orta səviyyə şablonlar',
      'Şəkil yükləmə',
      'Rəng seçimi',
      'PDF və DOCX',
    ],
    limitations: [
      'Məhdud premium şablonlar',
    ],
    color: 'blue',
  },
  Premium: {
    name: 'Premium',
    price: '19.99₼',
    features: [
      'Bütün şablonlar',
      'Premium dizayn',
      'Sınırsız yükləmə',
      'Prioritet dəstək',
      'LinkedIn import',
    ],
    limitations: [],
    color: 'purple',
  },
};

export default function SubscriptionManagement({ user, onUserUpdate }: SubscriptionManagementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfirmation, setCancelConfirmation] = useState('');
  const { showSuccess, showError, showWarning } = useNotification();
  const { siteLanguage } = useSiteLanguage();

  const getSubscriptionLabels = () => {
    const labels = {
      azerbaijani: {
        updating: 'Yenilənir...'
      },
      english: {
        updating: 'Updating...'
      },
      russian: {
        updating: 'Обновляется...'
      }
    };
    return labels[siteLanguage] || labels.azerbaijani;
  };

  const subscriptionLabels = getSubscriptionLabels();

  const currentSubscription = user.subscriptions?.find(sub => sub.status === 'active');
  const currentTier = currentSubscription?.tier || 'Free';

  // Get current tier features for warning
  const getCurrentTierFeatures = () => {
    const tierFeatures = {
      'Premium': [
        '📄 Bütün şablonlar',
        '🎨 Premium dizayn',
        '📊 Sınırsız yükləmə',
        '⚡ Prioritet dəstək',
        '💼 LinkedIn import'
      ],
      'Medium': [
        '📄 Orta səviyyə şablonlar',
        '🎨 Şəkil yükləmə',
        '🎨 Rəng seçimi',
        '📊 PDF və DOCX'
      ]
    };
    return tierFeatures[currentTier as keyof typeof tierFeatures] || [];
  };

  const handleUpgrade = async (newTier: string) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: newTier }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Abunəlik yenilənmədi');
      }

      const result = await response.json();
      
      // Redirect to payment if needed
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        // Update user data
        const updatedUser = { ...user };
        if (updatedUser.subscriptions) {
          updatedUser.subscriptions = updatedUser.subscriptions.map(sub => 
            sub.status === 'active' ? { ...sub, tier: newTier } : sub
          );
        }
        onUserUpdate(updatedUser);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (cancelConfirmation !== 'LEGV ET') {
      setError('Təsdiqləmək üçün "LEGV ET" yazın');
      return;
    }

    setLoading(true);
    setError('');
    setShowCancelModal(false);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Abunəlik ləğv edilmədi');
      }

      const result = await response.json();

      // Show detailed warning about lost features
      const lostFeatures = getCurrentTierFeatures();
      let warningMessage = `Abunəlik uğurla ləğv edildi!\n\n${result.warningMessage}`;

      if (lostFeatures.length > 0) {
        warningMessage += `\n\nİtirilən xüsusiyyətlər:\n${lostFeatures.join('\n')}`;
      }

      showSuccess(warningMessage);

      // Update user data
      const updatedUser = { ...user, tier: 'Free' };
      if (updatedUser.subscriptions) {
        updatedUser.subscriptions = updatedUser.subscriptions.map(sub => 
          sub.status === 'active' ? { ...sub, status: 'cancelled' } : sub
        );
      }
      onUserUpdate(updatedUser);

    } catch (err) {
      showError(err instanceof Error ? err.message : 'Xəta baş verdi');
    } finally {
      setLoading(false);
      setCancelConfirmation('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Abunəlik İdarəsi</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Subscription Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hazırkı Abunəlik</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentTier === 'Free' ? 'bg-gray-100 text-gray-800' :
                  currentTier === 'Medium' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {TIER_FEATURES[currentTier as keyof typeof TIER_FEATURES].name}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentSubscription?.status === 'active' ? 'bg-green-100 text-green-800' :
                  currentSubscription?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentSubscription?.status === 'active' ? 'Aktiv' : 
                   currentSubscription?.status === 'cancelled' ? 'Ləğv edilib' : 'Passiv'}
                </span>
              </div>
              
              {currentSubscription && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Başlama tarixi: {new Date(currentSubscription.startedAt).toLocaleDateString('az-AZ')}</p>
                  <p>Bitmə tarixi: {new Date(currentSubscription.expiresAt).toLocaleDateString('az-AZ')}</p>
                </div>
              )}
            </div>
            
            {currentSubscription && currentSubscription.status === 'active' && currentTier !== 'Free' && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
              >
                {loading ? 'Ləğv edilir...' : 'Abunəliyi Ləğv Et'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(TIER_FEATURES).map(([tier, info]) => (
          <div
            key={tier}
            className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
              currentTier === tier ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{info.name}</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">{info.price}</div>
              <div className="text-sm text-gray-600">aylıq</div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Xüsusiyyətlər:</h4>
                <ul className="space-y-1">
                  {info.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {info.limitations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Məhdudiyyətlər:</h4>
                  <ul className="space-y-1">
                    {info.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="text-center">
              {currentTier === tier ? (
                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md font-medium">
                  Hazırkı Planınız
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={loading}
                  className={`w-full px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${
                    tier === 'Free' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' :
                    tier === 'Medium' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                    'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {loading ? subscriptionLabels.updating : 
                   tier === 'Free' ? 'Pulsuz Plana Keç' :
                   currentTier === 'Free' ? 'Yükselt' : 
                   'Planı Dəyiş'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 rounded-t-xl">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-900">Abunəliyi Ləğv Et</h3>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="mb-6">
                <p className="text-gray-700 text-base mb-4 leading-relaxed">
                  <strong className="text-red-600">{TIER_FEATURES[currentTier as keyof typeof TIER_FEATURES].name}</strong> paketinizi ləğv etmək istədiyinizdən əminsiniz?
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  Bu əməliyyat geri alınmaz və sizin bütün premium xüsusiyyətlərinizi itirəcəksiniz.
                </p>
              </div>

              {/* Lost Features Section */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="text-red-800 font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  İtiriləcək Xüsusiyyətlər:
                </h4>
                <ul className="space-y-2">
                  {getCurrentTierFeatures().map((feature, idx) => (
                    <li key={idx} className="flex items-center text-red-700 text-sm">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3 flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Remaining Features Section */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="text-green-800 font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Pulsuz Paketdə Qalacaq:
                </h4>
                <ul className="space-y-2">
                  {TIER_FEATURES.Free.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-green-700 text-sm">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confirmation Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Təsdiqləmək üçün <span className="text-red-600 font-bold">"LEGV ET"</span> yazın:
                </label>
                <input
                  type="text"
                  value={cancelConfirmation}
                  onChange={(e) => setCancelConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center font-mono text-lg"
                  placeholder="LEGV ET"
                />
                {error && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelConfirmation('');
                  setError('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                İmtina Et
              </button>
              <button
                onClick={confirmCancel}
                disabled={loading || cancelConfirmation !== 'LEGV ET'}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Ləğv edilir...
                  </>
                ) : (
                  'Bəli, Ləğv Et'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
