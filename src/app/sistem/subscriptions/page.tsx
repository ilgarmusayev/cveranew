'use client';

import { useState, useEffect } from 'react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Subscription {
  id: string;
  userId: string;
  tier: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  user?: User;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);
  const { siteLanguage } = useSiteLanguage();

  const getAdminLabels = () => {
    const labels = {
      azerbaijani: {
        loadingSubscriptions: 'Abunəliklər yüklənir...'
      },
      english: {
        loadingSubscriptions: 'Loading subscriptions...'
      },
      russian: {
        loadingSubscriptions: 'Загрузка подписок...'
      }
    };
    return labels[siteLanguage] || labels.azerbaijani;
  };

  const adminLabels = getAdminLabels();

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      const headers: Record<string, string> = {};
      
      // Only add authorization header if token exists
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch('/api/sistem/subscriptions', {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      } else {
        console.error('Failed to fetch subscriptions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionStatus = async (id: string) => {
    try {
      // Find current subscription to determine next status
      const currentSubscription = subscriptions.find(sub => sub.id === id);
      if (!currentSubscription) return;

      // Cycle through statuses: active -> suspended -> expired -> cancelled -> active
      const statusCycle = {
        'active': 'suspended',
        'suspended': 'expired', 
        'expired': 'cancelled',
        'cancelled': 'active'
      };

      const nextStatus = statusCycle[currentSubscription.status as keyof typeof statusCycle] || 'active';

      const adminToken = localStorage.getItem('adminToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Only add authorization header if token exists
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const response = await fetch(`/api/sistem/subscriptions/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: nextStatus }),
      });
      
      if (response.ok) {
        fetchSubscriptions();
      } else {
        console.error('Failed to update subscription status:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const extendSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      console.log('Extending subscription:', selectedSubscription.id, 'for', extendMonths, 'months');
      
      const adminToken = localStorage.getItem('adminToken');
      console.log('Admin token:', adminToken ? 'exists' : 'missing');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const response = await fetch(`/api/sistem/subscriptions/${selectedSubscription.id}/extend`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ months: extendMonths }),
      });
      
      console.log('Extend response status:', response.status);
      console.log('Extend response headers:', response.headers.get('content-type'));
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('Extend response data:', data);
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        alert('Server xətası: JSON cavab alınmadı');
        return;
      }
      
      if (response.ok && data.success) {
        alert('Abunəlik uğurla uzadıldı!');
        setShowExtendModal(false);
        setSelectedSubscription(null);
        setExtendMonths(1);
        fetchSubscriptions();
      } else {
        console.error('Failed to extend subscription:', data.message || 'Unknown error');
        alert('Xəta: ' + (data.message || 'Naməlum xəta'));
      }
    } catch (error) {
      console.error('Error extending subscription:', error);
      alert('Xəta baş verdi: ' + (error instanceof Error ? error.message : 'Naməlum xəta'));
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesStatus = filterStatus === 'all' || subscription.status === filterStatus;
    const matchesTier = filterTier === 'all' || subscription.tier === filterTier;
    return matchesStatus && matchesTier;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-gradient-to-br from-teal-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Modern Header with Glass Morphism */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 md:p-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                      Abunəlik İdarəçiliyi
                    </h1>
                    <p className="text-blue-100 text-lg">
                      İstifadəçi abunəliklərini idarə edin və nəzarət edin
                    </p>
                  </div>
                </div>
                
                {/* Statistics in Header */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                  <div className="text-white text-center">
                    <div className="text-lg font-bold text-green-300">
                      {subscriptions.filter(s => s.status === 'active').length}
                    </div>
                    <div className="text-xs text-blue-100">Aktiv</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Cards */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-700">
                      {subscriptions.filter(s => s.status === 'active').length}
                    </div>
                    <div className="text-xs text-green-600">Aktiv</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4 border border-red-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-700">
                      {subscriptions.filter(s => s.status === 'expired').length}
                    </div>
                    <div className="text-xs text-red-600">Vaxtı keçib</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 border border-yellow-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-yellow-700">
                      {subscriptions.filter(s => s.status === 'suspended').length}
                    </div>
                    <div className="text-xs text-yellow-600">Dayandırılıb</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-700">
                      {subscriptions.filter(s => s.tier === 'Premium').length}
                    </div>
                    <div className="text-xs text-purple-600">Premium</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Smart Filtrələr
              </h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Status</span>
                  </span>
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="all">🔍 Bütün statuslar</option>
                  <option value="active">✅ Aktiv</option>
                  <option value="expired">⏰ Vaxtı keçib</option>
                  <option value="cancelled">❌ Ləğv edilib</option>
                  <option value="suspended">⏸️ Dayandırılıb</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>Plan</span>
                  </span>
                </label>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="all">📦 Bütün planlar</option>
                  <option value="Free">🆓 Pulsuz</option>
                  <option value="Medium">🎯 Orta</option>
                  <option value="Premium">💎 Premium</option>
                  <option value="Pro">🚀 Pro</option>
                  <option value="Populyar">⭐ Populyar</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Əməliyyat</span>
                  </span>
                </label>
                <button
                  onClick={fetchSubscriptions}
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Yenilə</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Subscription Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-5 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Abunəlik Məlumatları
                  </h3>
                  <p className="text-sm text-gray-600">
                    {filteredSubscriptions.length} nəticə tapıldı
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">
                    📊 Cəmi: {filteredSubscriptions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-600 font-medium">{adminLabels.loadingSubscriptions}</p>
              </div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Abunəlik tapılmadı</h3>
              <p className="text-gray-600">Seçilmiş filtrələrə uyğun abunəlik mövcud deyil.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden">
                <div className="p-4 space-y-4">
                  {filteredSubscriptions.map((subscription) => (
                    <div key={subscription.id} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {subscription.user?.email || 'N/A'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {subscription.user?.name || 'İsim məlumatı yoxdur'}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(subscription.status)}`}>
                          {getStatusText(subscription.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="block text-gray-500 font-medium">Plan</span>
                          <span className={`font-semibold ${getTierDisplay(subscription.tier).color}`}>
                            {getTierDisplay(subscription.tier).text}
                          </span>
                        </div>

                        <div>
                          <span className="block text-gray-500 font-medium">Başlama</span>
                          <span className="text-gray-900">
                            {subscription.startedAt ? new Date(subscription.startedAt).toLocaleDateString('az-AZ') : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-gray-500 font-medium">Bitmə</span>
                          <span className="text-gray-900">
                            {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString('az-AZ') : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => updateSubscriptionStatus(subscription.id)}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                        >
                          Status Dəyiş
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>İstifadəçi</span>
                        </span>
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span>Plan</span>
                        </span>
                      </th>

                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Başlama</span>
                        </span>
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Bitmə</span>
                        </span>
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Status</span>
                        </span>
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Əməliyyat</span>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSubscriptions.map((subscription, index) => (
                      <tr key={subscription.id} className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white font-semibold text-sm">
                                {subscription.user?.name?.[0] || subscription.user?.email?.[0] || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {subscription.user?.email || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {subscription.user?.name || 'İsim məlumatı yoxdur'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            subscription.tier === 'Premium' 
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200'
                              : subscription.tier === 'Pro'
                              ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200'
                              : subscription.tier === 'Populyar'
                              ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                              : subscription.tier === 'Medium'
                              ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200'
                              : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                          }`}>
                            {getTierDisplay(subscription.tier).text}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {subscription.startedAt ? (
                            <span className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{new Date(subscription.startedAt).toLocaleDateString('az-AZ')}</span>
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {subscription.expiresAt ? (
                            <span className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{new Date(subscription.expiresAt).toLocaleDateString('az-AZ')}</span>
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(subscription.status)}`}>
                            {getStatusText(subscription.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateSubscriptionStatus(subscription.id)}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                              title="Status dəyiş"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.5 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setShowExtendModal(true);
                              }}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                              title="Abunəlik uzat"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Extend Subscription Modal */}
        {showExtendModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-300 scale-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Abunəlik Uzat</h3>
                <p className="text-gray-600">
                  <span className="font-semibold">{selectedSubscription.user?.name || selectedSubscription.user?.email}</span> üçün 
                  <span className={`ml-1 font-semibold ${getTierDisplay(selectedSubscription.tier).color}`}>
                    {getTierDisplay(selectedSubscription.tier).text}
                  </span> abunəliyini uzadın
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Uzatma müddəti (ay)
                </label>
                <select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                >
                  {[1, 2, 3, 6, 12].map(month => (
                    <option key={month} value={month}>
                      {month} ay {month === 12 ? '(1 il)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowExtendModal(false);
                    setSelectedSubscription(null);
                    setExtendMonths(1);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                >
                  Ləğv et
                </button>
                <button
                  onClick={extendSubscription}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Uzat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get price based on tier


// Helper function to get tier display info
function getTierDisplay(tier: string) {
  switch (tier) {
    case 'Premium':
      return { text: '💎 Premium', color: 'text-purple-600' };
    case 'Pro':
      return { text: '🚀 Pro', color: 'text-orange-600' };
    case 'Populyar':
      return { text: '⭐ Populyar', color: 'text-yellow-600' };
    case 'Medium':
      return { text: '🎯 Orta', color: 'text-blue-600' };
    case 'Free':
      return { text: '🆓 Pulsuz', color: 'text-gray-600' };
    default:
      return { text: tier, color: 'text-gray-600' };
  }
}

// Helper function to get status text
function getStatusText(status: string) {
  switch (status) {
    case 'active':
      return '✅ Aktiv';
    case 'expired':
      return '⏰ Vaxtı keçib';
    case 'cancelled':
      return '❌ Ləğv edilib';
    case 'suspended':
      return '⏸️ Dayandırılıb';
    default:
      return status;
  }
}

// Helper function to get status color
function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200';
    case 'expired':
      return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200';
    case 'cancelled':
      return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200';
    case 'suspended':
      return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
}
