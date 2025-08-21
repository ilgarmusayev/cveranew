'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useNotification } from '@/components/ui/Toast';

interface ApiKey {
  id: string;
  name: string;
  key: string; // Masked
  service: string;
  host?: string | null; // RapidAPI host URL
  active: boolean;
  priority: number;
  usageCount: number;
  lastUsed: string | null;
  lastResult: string | null;
  deactivatedAt: string | null;
  createdAt: string;
}

export default function AdminApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; keyId: string; keyName: string }>({
    show: false,
    keyId: '',
    keyName: ''
  });
  const { showSuccess, showError, showWarning } = useNotification();
  const [newKey, setNewKey] = useState({
    name: '',
    key: '',
    service: 'linkedin',
    host: '',
    priority: 0,
    active: true
  });

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/system/api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('API açarlarını yükləmək mümkün olmadı');
      }

      const data = await response.json();
      setApiKeys(data.apiKeys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API açarlarını yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/system/api-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newKey),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add API key');
      }

      setShowAddForm(false);
      setNewKey({ name: '', key: '', service: 'linkedin', host: '', priority: 0, active: true });
      fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add API key');
    }
  };

  const handleUpdateKey = async (id: string, updates: Partial<ApiKey>) => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/system/api-keys', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update API key');
      }

      fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key');
    }
  };

  const deleteApiKey = async (id: string, name: string) => {
    setDeleteModal({
      show: true,
      keyId: id,
      keyName: name
    });
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/admin/api-keys/${deleteModal.keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteModal({ show: false, keyId: '', keyName: '' });
        fetchApiKeys();
        showSuccess('API key successfully deleted');
      } else {
        showError('Failed to delete API key');
        setDeleteModal({ show: false, keyId: '', keyName: '' });
      }
    } catch (error) {
      showError('Error occurred while deleting API key');
      setDeleteModal({ show: false, keyId: '', keyName: '' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getResultColor = (result: string | null) => {
    if (!result) return 'text-gray-500';
    if (result === 'success') return 'text-green-600';
    if (result.includes('deactivated')) return 'text-red-600';
    if (result === 'reactivated') return 'text-blue-600';
    return 'text-yellow-600';
  };

  const getResultText = (result: string | null) => {
    if (!result) return 'Not used';
    if (result === 'success') return 'Success';
    if (result === 'error') return 'Error';
    if (result === 'deactivated_auth_error') return 'Deactivated (Auth Error)';
    if (result === 'deactivated_server_error') return 'Deactivated (Server Error)';
    if (result === 'deactivated_network_error') return 'Deactivated (Network Error)';
    if (result === 'reactivated') return 'Reactivated';
    if (result === 'auto_reactivated_after_30_days') return 'Auto-reactivated (30 days)';
    return result;
  };

  const getDaysUntilReactivation = (deactivatedAt: string | null) => {
    if (!deactivatedAt) return null;
    const deactivationDate = new Date(deactivatedAt);
    const reactivationDate = new Date(deactivationDate);
    reactivationDate.setMonth(reactivationDate.getMonth() + 1);
    const today = new Date();
    const daysLeft = Math.ceil((reactivationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">API Açarları</h1>
            <p className="mt-2 text-sm text-gray-700">
              LinkedIn import API açarlarını və onların istifadəsini idarə edin.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Add API Key
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700">Error: {error}</div>
          </div>
        )}

        {/* Add Key Form */}
        {showAddForm && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New API Key</h3>
            <form onSubmit={handleAddKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., LinkedIn API Key 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key</label>
                <input
                  type="text"
                  required
                  value={newKey.key}
                  onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the full API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Service</span>
                  </span>
                </label>
                <select
                  value={newKey.service}
                  onChange={(e) => setNewKey({ ...newKey, service: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em'
                  }}
                >
                  <option value="linkedin">🔗 LinkedIn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <input
                  type="number"
                  value={newKey.priority}
                  onChange={(e) => setNewKey({ ...newKey, priority: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0 = highest priority"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Host (Optional)
                  <span className="text-xs text-gray-500 ml-1">- RapidAPI host URL (defaults to fresh-linkedin-profile-data.p.rapidapi.com)</span>
                </label>
                <input
                  type="text"
                  value={newKey.host}
                  onChange={(e) => setNewKey({ ...newKey, host: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="fresh-linkedin-profile-data.p.rapidapi.com"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Add Key
                </button>
              </div>
            </form>
          </div>
        )}

        {/* API Keys Table */}
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Host
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No API keys found
                  </td>
                </tr>
              ) : (
                apiKeys.map((apiKey) => (
                  <tr key={apiKey.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{apiKey.name}</div>
                      <div className="text-sm text-gray-500">{apiKey.service}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">{apiKey.key}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        apiKey.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apiKey.active ? 'Active' : 'Inactive'}
                      </span>
                      
                      {!apiKey.active && apiKey.deactivatedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {(() => {
                            const daysLeft = getDaysUntilReactivation(apiKey.deactivatedAt);
                            if (daysLeft === null) {
                              return 'Deactivated';
                            } else if (daysLeft === 0) {
                              return 'Eligible for reactivation';
                            } else if (daysLeft > 0) {
                              return `Reactivates in ${daysLeft} days`;
                            } else {
                              return 'Deactivated';
                            }
                          })()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={apiKey.priority}
                        onChange={(e) => handleUpdateKey(apiKey.id, { priority: parseInt(e.target.value) })}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={apiKey.host || ''}
                        onChange={(e) => handleUpdateKey(apiKey.id, { host: e.target.value || null })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="default host"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {apiKey.host || 'Using default host'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{apiKey.usageCount}</div>
                      <div className={`text-sm ${getResultColor(apiKey.lastResult)}`}>
                        {getResultText(apiKey.lastResult)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateKey(apiKey.id, { active: !apiKey.active })}
                          className={`px-3 py-1 rounded text-xs ${
                            apiKey.active
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {apiKey.active ? 'Disable' : 'Enable'}
                        </button>
                        
                        {!apiKey.active && apiKey.lastResult?.includes('deactivated') && (
                          <button
                            onClick={() => handleUpdateKey(apiKey.id, { active: true, lastResult: 'reactivated' })}
                            className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-xs"
                          >
                            Reactivate
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteApiKey(apiKey.id, apiKey.name)}
                          className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete the API key "<span className="font-medium">{deleteModal.keyName}</span>"?
                </p>
              </div>
              <div className="p-4 border-t flex justify-end space-x-2">
                <button
                  onClick={() => setDeleteModal({ show: false, keyId: '', keyName: '' })}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
