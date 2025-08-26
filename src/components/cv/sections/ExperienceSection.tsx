'use client';

import { useState } from 'react';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface Experience {
  id: string;
  company: string;
  position: string;
  description: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

interface ExperienceSectionProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
  cvLanguage?: 'english' | 'azerbaijani';
}

export default function ExperienceSection({ data, onChange, cvLanguage = 'azerbaijani' }: ExperienceSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addExperience = () => {
    const newExperience: Experience = {
      id: crypto.randomUUID(),
      company: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      current: false
    };
    onChange([newExperience, ...data]);
    setExpandedId(newExperience.id);
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    const updated = data.map(exp =>
      exp.id === id ? { ...exp, ...updates } : exp
    );
    onChange([...updated]);
  };

  const removeExperience = (id: string) => {
    onChange(data.filter(exp => exp.id !== id));
  };

  const moveExperience = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(exp => exp.id === id);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {cvLanguage === 'english' ? 'Work Experience' : 'İş təcrübəsi'}
          </h3>
        </div>
        <button
          onClick={addExperience}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <span className="hidden sm:inline">
            {cvLanguage === 'english' ? '+ Add' : '+ Əlavə edin'}
          </span>
          <span className="sm:hidden">
            {cvLanguage === 'english' ? '+' : '+'}
          </span>
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2v0" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            {cvLanguage === 'english' 
              ? 'No work experience added yet' 
              : 'Hələ heç bir iş təcrübəsi əlavə etməmisiniz'
            }
          </p>
          <button
            onClick={addExperience}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {cvLanguage === 'english' 
              ? 'Add your first work experience' 
              : 'İlk iş təcrübənizi əlavə edin'
            }
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((experience, index) => (
            <div key={experience.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500">💼</span>
                  <h4 className="font-medium text-gray-900">
                    {experience.position || (cvLanguage === 'english' ? 'New work experience' : 'Yeni iş təcrübəsi')}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {experience.company || (cvLanguage === 'english' ? 'Company name' : 'Şirkət adı')}
                </p>
              </div>

              {/* Action links moved to bottom of card */}
              <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                {/* Move buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveExperience(experience.id, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded transition-colors ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={cvLanguage === 'english' ? 'Move up' : 'Yuxarı'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveExperience(experience.id, 'down')}
                    disabled={index === data.length - 1}
                    className={`p-1 rounded transition-colors ${
                      index === data.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={cvLanguage === 'english' ? 'Move down' : 'Aşağı'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Edit and remove buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setExpandedId(expandedId === experience.id ? null : experience.id)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                  >
                    {expandedId === experience.id 
                      ? (cvLanguage === 'english' ? 'Close' : 'Bağlayın')
                      : (cvLanguage === 'english' ? 'Edit' : 'Redaktə edin')
                    }
                  </button>
                  <button
                    onClick={() => removeExperience(experience.id)}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                  >
                    {cvLanguage === 'english' ? 'Delete' : 'Silin'}
                  </button>
                </div>
              </div>

              {expandedId === experience.id && (
                <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {cvLanguage === 'english' ? 'Position' : 'Vəzifə'}
                      </label>
                      <input
                        type="text"
                        value={experience.position}
                        onChange={(e) => updateExperience(experience.id, { position: e.target.value })}
                        placeholder={cvLanguage === 'english' ? 'e.g., Software Engineer' : 'Məsələn, Proqram təminatı mühəndisi'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {cvLanguage === 'english' ? 'Company' : 'Şirkət'}
                      </label>
                      <input
                        type="text"
                        value={experience.company}
                        onChange={(e) => updateExperience(experience.id, { company: e.target.value })}
                        placeholder={cvLanguage === 'english' ? 'e.g., Tech Solutions Inc.' : 'Məsələn, Tech Solutions Inc.'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Date Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {cvLanguage === 'english' ? 'Start Date' : 'Başlama tarixi'}
                      </label>
                      <input
                        type="month"
                        value={experience.startDate || ''}
                        onChange={(e) => updateExperience(experience.id, { startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {cvLanguage === 'english' ? 'End Date' : 'Bitirmə tarixi'}
                      </label>
                      <input
                        type="month"
                        value={experience.current ? '' : (experience.endDate || '')}
                        onChange={(e) => updateExperience(experience.id, { endDate: e.target.value })}
                        disabled={experience.current}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={Boolean(experience.current)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            updateExperience(experience.id, {
                              current: isChecked,
                              endDate: isChecked ? '' : experience.endDate,
                            });
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {cvLanguage === 'english' ? 'Currently working' : 'Davam edir'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {cvLanguage === 'english' ? 'Description (optional)' : 'Təsvir (ixtiyari)'}
                    </label>
                    <RichTextEditor
                      value={experience.description}
                      onChange={(value) => updateExperience(experience.id, { description: value })}
                      placeholder={cvLanguage === 'english' 
                        ? 'Provide information about your job responsibilities and achievements...' 
                        : 'Vəzifə öhdəlikləriniz və nailiyyətləriniz haqqında məlumat verin...'
                      }
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
            onClick={addExperience}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {cvLanguage === 'english' 
              ? '+ Add another work experience' 
              : '+ Başqa iş təcrübəsi əlavə edin'
            }
          </button>
        </div>
      )}
    </div>
  );
}
