'use client';

import { useState, useEffect } from 'react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
// Temporarily disable drag and drop for build
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Template {
  id: string;
  name: string;
  tier: string;
  previewUrl: string;
  description: string;
  order: number;
  isActive: boolean;
}

export default function TemplateManagement() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { siteLanguage } = useSiteLanguage();

  const getTemplateManagementLabels = () => {
    const labels = {
      azerbaijani: {
        saving: 'Saxlanılır...'
      },
      english: {
        saving: 'Saving...'
      },
      russian: {
        saving: 'Сохраняется...'
      }
    };
    return labels[siteLanguage] || labels.azerbaijani;
  };

  const templateLabels = getTemplateManagementLabels();

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        setMessage({ type: 'error', text: 'Template-lar yüklənərkən xəta baş verdi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Şəbəkə xətası' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Handle drag end - temporarily disabled
  /* const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const newTemplates = Array.from(templates);
    const [reorderedItem] = newTemplates.splice(result.source.index, 1);
    newTemplates.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedTemplates = newTemplates.map((template, index) => ({
      ...template,
      order: index + 1
    }));

    setTemplates(updatedTemplates);
    saveOrder(updatedTemplates);
  }; */

  // Save new order to database
  const saveOrder = async (updatedTemplates: Template[]) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templates: updatedTemplates })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Template sıralaması yadda saxlandı' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Sıralama saxlanılarkən xəta baş verdi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Şəbəkə xətası' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle template active status
  const toggleActive = async (templateId: string, isActive: boolean) => {
    const updatedTemplates = templates.map(template =>
      template.id === templateId ? { ...template, isActive } : template
    );
    setTemplates(updatedTemplates);
    saveOrder(updatedTemplates);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Template İdarəetməsi</h2>
        <p className="text-gray-600">Template-ları sürükləyib buraxmaqla sıralayın</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {saving && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
          {templateLabels.saving}
        </div>
      )}

      {/* Temporarily disabled drag and drop for build */}
      <div className="space-y-4">
        {templates.map((template, index) => (
          <div 
            key={template.id} 
            className={`bg-white p-4 rounded-lg border shadow-sm transition-shadow hover:shadow-md ${!template.isActive ? 'opacity-60' : ''}`}
          >

            <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl font-bold text-gray-400 w-8">
                            {template.order}
                          </div>
                          <div className="flex-shrink-0">
                            <img
                              src={template.previewUrl}
                              alt={template.name}
                              className="w-16 h-20 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/templates/placeholder.png';
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {template.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {template.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                template.tier === 'Free' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {template.tier}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                template.isActive 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {template.isActive ? 'Aktiv' : 'Deaktiv'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleActive(template.id, !template.isActive)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              template.isActive
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {template.isActive ? 'Deaktiv et' : 'Aktiv et'}
                          </button>
                          <div className="text-gray-400 cursor-move">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">İstifadə qaydaları:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Template-ları sürükləyib buraxmaqla yenidən sıralayın</li>
          <li>• Sıralama avtomatik olaraq yadda saxlanır</li>
          <li>• "Aktiv et / Deaktiv et" düyməsi ilə template-ların görünürlüyünü idarə edin</li>
          <li>• İstifadəçilər template-ları bu sıra ilə görəcəklər</li>
        </ul>
      </div>
    </div>
  );
}
