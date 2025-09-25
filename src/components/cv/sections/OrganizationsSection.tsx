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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    setExpandedId(newOrganization.id);
  };

  const updateOrganization = (id: string, updates: Partial<Organization>) => {
    const updated = data.map(item => {
      if (item.id === id) {
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

  const removeOrganization = (id: string) => {
    const updated = data.filter(item => item.id !== id);
    onChange(updated);
  };

  const moveOrganization = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(org => org.id === id);
    if (direction === 'up' && index > 0) {
      const updated = [...data];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      onChange(updated);
    } else if (direction === 'down' && index < data.length - 1) {
      const updated = [...data];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      onChange(updated);
    }
  };

  // Translation labels
  const labels = {
    azerbaijani: {
      title: 'Təşkilatlar',
      add: '+ Əlavə edin',
      addShort: '+',
      addButton: 'Təşkilat Əlavə Et',
      newOrganization: 'Yeni təşkilat məlumatı',
      organizationName: 'Təşkilat Adı',
      position: 'Vəzifə/Rol',
      description: 'Təsvir',
      website: 'Veb Sayt',
      dates: 'Müddət',
      current: 'Hazırda aktiv',
      moveUp: 'Yuxarı',
      moveDown: 'Aşağı',
      close: 'Bağlayın',
      edit: 'Redaktə edin',
      delete: 'Silin',
      save: 'Yadda Saxla',
      cancel: 'Ləğv Et',
      present: 'Hazırda',
      emptyState: 'Hələ heç bir təşkilat əlavə edilməyib',
      addFirst: 'İlk təşkilatınızı əlavə edin',
      addAnother: '+ Başqa təşkilat əlavə edin',
      placeholders: {
        name: 'IEEE, ACM, Rotary Club',
        position: 'Üzv, Sədr, Vitse-sədr',
        website: 'https://www.təşkilat.com',
        description: 'Təşkilatdakı rolunuz və fəaliyyətiniz...'
      }
    },
    english: {
      title: 'Organizations',
      add: '+ Add',
      addShort: '+',
      addButton: '+',
      newOrganization: 'New organization entry',
      organizationName: 'Organization Name',
      position: 'Position/Role',
      description: 'Description',
      website: 'Website',
      dates: 'Duration',
      current: 'Currently active',
      moveUp: 'Move up',
      moveDown: 'Move down',
      close: 'Close',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      present: 'Present',
      emptyState: 'No organizations added yet',
      addFirst: 'Add your first organization',
      addAnother: '+ Add another organization',
      placeholders: {
        name: 'IEEE, ACM, Rotary Club',
        position: 'Member, President, Vice President',
        website: 'https://www.organization.com',
        description: 'Your role and activities in the organization...'
      }
    },
    russian: {
      title: 'Организации',
      add: '+ Добавить',
      addShort: '+',
      addButton: 'Добавить организацию',
      newOrganization: 'Новая запись об организации',
      organizationName: 'Название организации',
      position: 'Должность/Роль',
      description: 'Описание',
      website: 'Веб-сайт',
      dates: 'Продолжительность',
      current: 'В настоящее время активен',
      moveUp: 'Переместить вверх',
      moveDown: 'Переместить вниз',
      close: 'Закрыть',
      edit: 'Редактировать',
      delete: 'Удалить',
      save: 'Сохранить',
      cancel: 'Отмена',
      present: 'Настоящее время',
      emptyState: 'Организации еще не добавлены',
      addFirst: 'Добавить первую организацию',
      addAnother: '+ Добавить еще одну организацию',
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {content.title}
          </h3>
        </div>
        <button
          onClick={addOrganization}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <span className="hidden sm:inline">
            {content.add}
          </span>
          <span className="sm:hidden">
            {content.addShort}
          </span>
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            {content.emptyState}
          </p>
          <button
            onClick={addOrganization}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors break-words leading-tight max-w-48 mx-auto block"
          >
            {content.addFirst}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((organization, index) => (
            <div key={organization.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500">🏢</span>
                  <h4 className="font-medium text-gray-900">
                    {organization.name || content.newOrganization}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {organization.position || content.organizationName}
                </p>
                {(organization.website || organization.startDate) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {[organization.website, organization.startDate && `${organization.startDate} - ${organization.current ? content.present : organization.endDate || ''}`].filter(Boolean).join(' | ')}
                  </p>
                )}
              </div>

              {/* Action links moved to bottom of card */}
              <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                {/* Move buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveOrganization(organization.id, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded transition-colors ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={content.moveUp}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveOrganization(organization.id, 'down')}
                    disabled={index === data.length - 1}
                    className={`p-1 rounded transition-colors ${
                      index === data.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={content.moveDown}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Edit and remove buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setExpandedId(expandedId === organization.id ? null : organization.id)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                  >
                    {expandedId === organization.id 
                      ? content.close
                      : content.edit
                    }
                  </button>
                  <button
                    onClick={() => removeOrganization(organization.id)}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                  >
                    {content.delete}
                  </button>
                </div>
              </div>

              {expandedId === organization.id && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {content.organizationName} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={organization.name || ''}
                        onChange={(e) => updateOrganization(organization.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={content.placeholders.name}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {content.position}
                      </label>
                      <input
                        type="text"
                        value={organization.position || ''}
                        onChange={(e) => updateOrganization(organization.id, { position: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={content.placeholders.position}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {content.website}
                    </label>
                    <input
                      type="url"
                      value={organization.website || ''}
                      onChange={(e) => updateOrganization(organization.id, { website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder={content.placeholders.website}
                    />
                  </div>

                  {/* Date Range Input */}
                  <DateRangeInput
                    startDate={organization.startDate || ''}
                    endDate={organization.endDate}
                    current={organization.current || false}
                    onStartDateChange={(date) => updateOrganization(organization.id, { startDate: date })}
                    onEndDateChange={(date) => updateOrganization(organization.id, { endDate: date })}
                    onCurrentChange={(current) => updateOrganization(organization.id, { 
                      current, 
                      endDate: current ? '' : organization.endDate 
                    })}
                    startLabel={content.dates}
                    endLabel={content.dates}
                    currentLabel={content.current}
                    siteLanguage={siteLanguage}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {content.description}
                    </label>
                    <RichTextEditor
                      value={organization.description ?? ''}
                      onChange={(value) => updateOrganization(organization.id, { description: value })}
                      placeholder={content.placeholders.description}
                      minHeight="120px"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.length > 0 && (
        <div className="text-center">
          <button
            onClick={addOrganization}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {content.addAnother}
          </button>
        </div>
      )}
    </div>
  );
}
