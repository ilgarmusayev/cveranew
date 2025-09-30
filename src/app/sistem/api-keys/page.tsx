'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/ui/Toast';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface ApiKey {
  id: string;
  service: string;
  apiKey: string;
  active: boolean;
  priority: number;
  usageCount: number;
  lastUsed: string | null;
  lastResult: string | null;
  dailyLimit: number;
  dailyUsage: number;
  lastReset: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState('all');
  const [authenticated, setAuthenticated] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; keyId: string; keyName: string }>({
    show: false,
    keyId: '',
    keyName: ''
  });
  const { showSuccess, showError, showWarning } = useNotification();
  const router = useRouter();
  const { siteLanguage } = useSiteLanguage();

  const getApiKeysLabels = () => {
    const labels = {
      azerbaijani: {
        loading: 'Yüklənir...'
      },
      english: {
        loading: 'Loading...'
      },
      russian: {
        loading: 'Загружается...'
      }
    };
    return labels[siteLanguage] || labels.azerbaijani;
  };

  const apiLabels = getApiKeysLabels();

  // Add API Key Form State
  const [newApiKey, setNewApiKey] = useState({
    service: 'scrapingdog',
    apiKey: '',
    priority: 1,
    dailyLimit: 1000
  });

  const services = [
    { value: 'scrapingdog', label: 'ScrapingDog' },
    { value: 'rapidapi', label: 'RapidAPI' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'brightdata', label: 'BrightData' }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchApiKeys();
    }
  }, [selectedService, authenticated]);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/sistem/login');
      return;
    }

    // Simple token validation - check if it looks like a JWT
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
      }

      // Check if user is admin
      if (payload.role === 'admin' || payload.role === 'ADMIN' || payload.isAdmin || payload.adminId) {
        setAuthenticated(true);
      } else {
        throw new Error('Not an admin');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('adminToken');
      router.push('/sistem/login');
    }
  };

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        router.push('/sistem/login');
        return;
      }

      const url = selectedService === 'all'
        ? '/api/sistem/api-keys'
        : `/api/sistem/api-keys?service=${selectedService}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/sistem/login');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setApiKeys(data.data || []);
      } else {
        setError(data.error || 'API keys yüklənə bilmədi');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Serverlə əlaqə xətası');
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newApiKey.apiKey.trim()) {
      setError('API key daxil edin');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/sistem/api-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newApiKey)
      });

      const data = await response.json();

      if (data.success) {
        setShowAddForm(false);
        setNewApiKey({
          service: 'scrapingdog',
          apiKey: '',
          priority: 1,
          dailyLimit: 1000
        });
        fetchApiKeys();
        setError('');
      } else {
        setError(data.error || 'API key əlavə edilə bilmədi');
      }
    } catch (error) {
      setError('Server xətası');
    }
  };

  const handleTestApiKey = async (id: string, service: string, apiKey: string) => {
    setTestingKey(id);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/sistem/api-keys/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey, service })
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(); // Will use default success message from notificationMessages
      } else {
        showError(); // Will use default error message from notificationMessages
      }
    } catch (error) {
  showError(); // Will use default error message from notificationMessages
    } finally {
      setTestingKey(null);
    }
  };

  const toggleApiKeyStatus = async (id: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/sistem/api-keys', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, active: !currentActive })
      });

      const data = await response.json();

      if (data.success) {
        fetchApiKeys();
      } else {
        setError(data.error || 'Status dəyişdirilə bilmədi');
      }
    } catch (error) {
      setError('Server xətası');
    }
  };

  const deleteApiKey = async (id: string) => {
    const keyToDelete = apiKeys.find(key => key.id === id);
    if (!keyToDelete) return;

    setDeleteModal({
      show: true,
      keyId: id,
      keyName: keyToDelete.service
    });
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/sistem/api-keys?id=${deleteModal.keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setDeleteModal({ show: false, keyId: '', keyName: '' });
        fetchApiKeys();
        showSuccess(); // Will use default success message from notificationMessages
      } else {
        showError(); // Will use default error message from notificationMessages
        setDeleteModal({ show: false, keyId: '', keyName: '' });
      }
    } catch (error) {
  showError(); // Will use default error message from notificationMessages
  setDeleteModal({ show: false, keyId: '', keyName: '' });
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Keys İdarəetməsi</h1>
              <p className="mt-2 text-gray-600">LinkedIn import və digər xidmətlər üçün API key-ləri idarə edin</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/sistem')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Geri
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + API Key Əlavə Et
              </button>
            </div>
          </div>
        </div>

        {/* Service Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Filter:
          </label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="all">Bütün Servislər</option>
            {services.map(service => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-500 underline"
            >
              Bağla
            </button>
          </div>
        )}

        {/* Add API Key Form */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Yeni API Key Əlavə Et</h2>
            <form onSubmit={handleAddApiKey}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service
                  </label>
                  <select
                    value={newApiKey.service}
                    onChange={(e) => setNewApiKey({...newApiKey, service: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {services.map(service => (
                      <option key={service.value} value={service.value}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority (1 = yüksək)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newApiKey.priority}
                    onChange={(e) => setNewApiKey({...newApiKey, priority: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    placeholder="API key-inizi daxil edin"
                    value={newApiKey.apiKey}
                    onChange={(e) => setNewApiKey({...newApiKey, apiKey: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newApiKey.dailyLimit}
                    onChange={(e) => setNewApiKey({...newApiKey, dailyLimit: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Əlavə et
                </button>
              </div>
            </form>
          </div>
        )}

        {/* API Keys List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              API Keys ({apiKeys.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">{apiLabels.loading}</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Heç bir API key tapılmadı. İlk API key-inizi əlavə edin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiKeys.map((apiKey) => (
                    <tr key={apiKey.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {apiKey.service}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {apiKey.apiKey}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          apiKey.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {apiKey.active ? 'Aktiv' : 'Deaktiv'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {apiKey.priority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {apiKey.dailyUsage}/{apiKey.dailyLimit}
                        <div className="text-xs text-gray-500">
                          Total: {apiKey.usageCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleTestApiKey(apiKey.id, apiKey.service, apiKey.apiKey)}
                          disabled={testingKey === apiKey.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          {testingKey === apiKey.id ? 'Test...' : 'Test'}
                        </button>
                        <button
                          onClick={() => toggleApiKeyStatus(apiKey.id, apiKey.active)}
                          className={`${
                            apiKey.active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {apiKey.active ? 'Deaktiv et' : 'Aktiv et'}
                        </button>
                        <button
                          onClick={() => deleteApiKey(apiKey.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold mb-4">
                API Key Silinməsi Təsdiqi
              </h3>
              <p className="text-gray-700 mb-4">
                {deleteModal.keyName} adlı API key-i silmək istədiyinizə əminsiniz?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteModal({ show: false, keyId: '', keyName: '' })}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İmtina et
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Bəli, sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
