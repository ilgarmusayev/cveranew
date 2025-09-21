'use client';

import { useState } from 'react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import RichTextEditor from '@/components/ui/RichTextEditor';
import DateRangeInput from '@/components/cv/DateRangeInput';

interface Organization {
  id: string;
  name: string;
  position: string;
  role?: string; // For compatibility with CVPreview
  description?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  website?: string;
  url?: string; // For compatibility with CVPreview
}

interface OrganizationsSectionProps {
  data: Organization[];
  onChange: (data: Organization[]) => void;
  cvLanguage?: 'english' | 'azerbaijani' | 'russian';
}

export default function OrganizationsSection({ data, onChange, cvLanguage = 'azerbaijani' }: OrganizationsSectionProps) {
  const { siteLanguage } = useSiteLanguage();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addOrganization = () => {
    const newOrganization: Organization = {
      id: generateId(),
      name: '',
      position: '',
      role: '', // Set both for compatibility
      description: '',
      startDate: '',
      endDate: '',
      current: false,
      website: '',
      url: '' // Set both for compatibility
    };
    onChange([newOrganization, ...data]);
    setEditingIndex(0);
  };

  const updateOrganization = (index: number, updates: Partial<Organization>) => {
    const updated = data.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, ...updates };
        // Ensure compatibility between position/role and website/url
        if (updates.position) {
          updatedItem.role = updates.position;
        }
        if (updates.website) {
          updatedItem.url = updates.website;
        }
        return updatedItem;
      }
      return item;
    });
    // DÜZƏLİŞ: React-in dəyişikliyi görməsi üçün yeni massiv referansı yaradırıq
    onChange([...updated]);
  };

  const removeOrganization = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
    setEditingIndex(null);
  };

  const toggleEdit = (index: number) => {
    setEditingIndex(editingIndex === index ? null : index);
  };

  // Translation labels
  const labels = {
    azerbaijani: {
      title: 'Təşkilatlar',
      addButton: 'Təşkilat Əlavə Et',
      organizationName: 'Təşkilat Adı',
      position: 'Vəzifə/Rol',
      description: 'Təsvir',
      website: 'Veb Sayt',
      dates: 'Müddət',
      current: 'Hazırda aktiv',
      edit: 'Düzəliş Et',
      delete: 'Sil',
      save: 'Yadda Saxla',
      cancel: 'Ləğv Et',
      present: 'Hazırda',
      emptyState: 'Hələ heç bir təşkilat əlavə edilməyib',
      addFirst: 'İlk təşkilatınızı əlavə edin',
      placeholders: {
        name: 'IEEE, ACM, Rotary Club',
        position: 'Üzv, Sədr, Vitse-sədr',
        website: 'https://www.təşkilat.com',
        description: 'Təşkilatdakı rolunuz və fəaliyyətiniz...'
      }
    },
    english: {
      title: 'Organizations',
      addButton: 'Add Organization',
      organizationName: 'Organization Name',
      position: 'Position/Role',
      description: 'Description',
      website: 'Website',
      dates: 'Duration',
      current: 'Currently active',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      present: 'Present',
      emptyState: 'No organizations added yet',
      addFirst: 'Add your first organization',
      placeholders: {
        name: 'IEEE, ACM, Rotary Club',
        position: 'Member, President, Vice President',
        website: 'https://www.organization.com',
        description: 'Your role and activities in the organization...'
      }
    },
    russian: {
      title: 'Организации',
      addButton: 'Добавить организацию',
      organizationName: 'Название организации',
      position: 'Должность/Роль',
      description: 'Описание',
      website: 'Веб-сайт',
      dates: 'Продолжительность',
      current: 'В настоящее время активен',
      edit: 'Редактировать',
      delete: 'Удалить',
      save: 'Сохранить',
      cancel: 'Отмена',
      present: 'Настоящее время',
      emptyState: 'Организации еще не добавлены',
      addFirst: 'Добавить первую организацию',
      placeholders: {
        name: 'IEEE, ACM, Ротари клуб',
        position: 'Член, Президент, Вице-президент',
        website: 'https://www.organization.com',
        description: 'Ваша роль и деятельность в организации...'
      }
    }
  };

  const content = labels[siteLanguage] || labels.azerbaijani;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
        <button
          onClick={addOrganization}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          {content.addButton}
        </button>
      </div>

      <div className="space-y-4">
        {data.map((org, index) => (
          <div key={org.id} className="border border-gray-200 rounded-lg p-4 bg-white">
            {editingIndex === index ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {content.organizationName}
                    </label>
                    <input
                      type="text"
                      value={org.name}
                      onChange={(e) => updateOrganization(index, { name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={content.placeholders.name}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {content.position}
                    </label>
                    <input
                      type="text"
                      value={org.position}
                      onChange={(e) => updateOrganization(index, { position: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={content.placeholders.position}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.website}
                  </label>
                  <input
                    type="url"
                    value={org.website || ''}
                    onChange={(e) => updateOrganization(index, { website: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={content.placeholders.website}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.dates}
                  </label>
                  <DateRangeInput
                    startDate={org.startDate || ''}
                    endDate={org.endDate || ''}
                    current={org.current || false}
                    onStartDateChange={(date) => updateOrganization(index, { startDate: date })}
                    onEndDateChange={(date) => updateOrganization(index, { endDate: date })}
                    onCurrentChange={(current) => updateOrganization(index, { current })}
                    currentLabel={content.current}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {content.description}
                  </label>
                  <RichTextEditor
                    value={org.description || ''}
                    onChange={(value) => updateOrganization(index, { description: value })}
                    placeholder={content.placeholders.description}
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                  >
                    {content.save}
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    {content.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{org.name}</h4>
                    <p className="text-blue-600 font-medium">{org.position}</p>
                    {org.startDate && (
                      <p className="text-sm text-gray-600">
                        {org.startDate} - {org.current ? content.present : org.endDate}
                      </p>
                    )}
                    {org.website && (
                      <p className="text-sm text-blue-600">
                        <a href={org.website} target="_blank" rel="noopener noreferrer">
                          {org.website}
                        </a>
                      </p>
                    )}
                    {org.description && (
                      <div 
                        className="text-sm text-gray-700 mt-2"
                        dangerouslySetInnerHTML={{ __html: org.description }}
                      />
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => toggleEdit(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {content.edit}
                    </button>
                    <button
                      onClick={() => removeOrganization(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {content.delete}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>{content.emptyState}</p>
            <p className="text-sm mt-1">
              {content.addFirst}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
