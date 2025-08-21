'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/components/ui/Toast';

interface APIKey {
  id: string;
  serviceName: string;
  apiKey: string;
  apiUrl: string;
  isActive: boolean;
  dailyLimit: number | null;
  currentUsage: number;
  lastResetDate: string;
  notes: string | null;
}

interface APIStats {
  serviceName: string;
  usagePercent: number;
  currentUsage: number;
  dailyLimit: number | null;
  isActive: boolean;
  lastReset: string;
}

export default function APIKeyManagement() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [stats, setStats] = useState<APIStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; keyId: string; keyName: string }>({
    show: false,
    keyId: '',
    keyName: ''
  });
  const { showSuccess, showError, showWarning } = useNotification();
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);
  const [newKeyForm, setNewKeyForm] = useState({
    serviceName: '',
    apiKey: '',
    apiUrl: '',
    dailyLimit: '',
    notes: '',
    isActive: true
  });

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys);
        setStats(data.stats);
      } else {
        console.error('API keys yüklənmədi');
      }
    } catch (error) {
      console.error('API keys fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newKeyForm,
          dailyLimit: newKeyForm.dailyLimit ? parseInt(newKeyForm.dailyLimit) : null
        })
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewKeyForm({
          serviceName: '',
          apiKey: '',
          apiUrl: '',
          dailyLimit: '',
          notes: '',
          isActive: true
        });
        fetchAPIKeys();
      }
    } catch (error) {
      console.error('API key əlavə etmə xətası:', error);
    }
  };

  const handleUpdateKey = async (id: string, updates: Partial<APIKey>) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setEditingKey(null);
        fetchAPIKeys();
      }
    } catch (error) {
      console.error('API key yeniləmə xətası:', error);
    }
  };

  const handleDeleteKey = async (id: string) => {
    const keyToDelete = apiKeys.find(key => key.id === id);
    if (!keyToDelete) return;

    setDeleteModal({
      show: true,
      keyId: id,
      keyName: keyToDelete.serviceName
    });
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/api-keys/${deleteModal.keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDeleteModal({ show: false, keyId: '', keyName: '' });
        fetchAPIKeys();
        showSuccess('API key uğurla silindi');
      } else {
        showError('API key silinə bilmədi');
      }
    } catch (error) {
      console.error('API key silmə xətası:', error);
      showError('API key silmə zamanı xəta baş verdi');
      setDeleteModal({ show: false, keyId: '', keyName: '' });
    }
  };

  const getStatusColor = (isActive: boolean, usagePercent: number) => {
    if (!isActive) return 'text-red-500 bg-red-100';
    if (usagePercent >= 90) return 'text-orange-500 bg-orange-100';
    if (usagePercent >= 70) return 'text-yellow-500 bg-yellow-100';
    return 'text-green-500 bg-green-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Key İdarəetməsi</h1>
            <p className="text-gray-600 mt-2">ScrapingDog və RapidAPI key-lərini idarə edin</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            + Yeni API Key
          </motion.button>
        </div>
      </div>

      {/* İstatistikalar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.serviceName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {stat.serviceName.replace('_', ' ')}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(stat.isActive, stat.usagePercent)}`}>
                {stat.isActive ? 'Aktiv' : 'Deaktiv'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">İstifadə:</span>
                <span className="font-medium">{stat.currentUsage} / {stat.dailyLimit || '∞'}</span>
              </div>
              {stat.dailyLimit && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(stat.usagePercent, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* API Keys List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">API Key-lər</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Günlük Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Əməliyyatlar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiKeys.map((apiKey) => (
                <motion.tr
                  key={apiKey.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 capitalize">
                      {apiKey.serviceName.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {apiKey.apiKey.substring(0, 8)}...{apiKey.apiKey.substring(apiKey.apiKey.length - 4)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {apiKey.apiUrl}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      apiKey.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {apiKey.isActive ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {apiKey.dailyLimit || 'Limitsiz'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingKey(apiKey)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      Redaktə
                    </button>
                    <button
                      onClick={() => handleDeleteKey(apiKey.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      Sil
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add API Key Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni API Key Əlavə Et</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servis Adı</label>
                  <select
                    value={newKeyForm.serviceName}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, serviceName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seçin</option>
                    <option value="scrapingdog_linkedin">ScrapingDog LinkedIn</option>
                    <option value="rapidapi_linkedin">RapidAPI LinkedIn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="text"
                    value={newKeyForm.apiKey}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, apiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="API key daxil edin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
                  <input
                    type="url"
                    value={newKeyForm.apiUrl}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, apiUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://api.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Günlük Limit</label>
                  <input
                    type="number"
                    value={newKeyForm.dailyLimit}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, dailyLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Boş buraxın (limitsiz)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qeydlər</label>
                  <textarea
                    value={newKeyForm.notes}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="İstəyə görə qeydlər"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  onClick={handleAddKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Əlavə et
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setDeleteModal({ show: false, keyId: '', keyName: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Silme Təsdiqi</h3>
              <p className="text-gray-700 text-sm mb-4">
                {deleteModal.keyName} adlı API key-i silmək istədiyinizə əminsiniz?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModal({ show: false, keyId: '', keyName: '' })}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İmtina et
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
