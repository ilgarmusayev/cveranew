'use client';

import { useState } from 'react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import DateRangeInput from '@/components/cv/DateRangeInput';

interface VolunteerExperience {
  id: string;
  organization: string;
  role: string;
  description?: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

interface VolunteerExperienceSectionProps {
  data: VolunteerExperience[];
  onChange: (data: VolunteerExperience[]) => void;
  cvLanguage?: 'english' | 'azerbaijani';
}

export default function VolunteerExperienceSection({ data, onChange, cvLanguage = 'azerbaijani' }: VolunteerExperienceSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addVolunteerExperience = () => {
    const newVolunteerExperience: VolunteerExperience = {
      id: generateId(),
      organization: '',
      role: '',
      description: '',
      cause: '',
      startDate: '',
      endDate: '',
      current: false
    };
    onChange([newVolunteerExperience, ...data]);
    setEditingIndex(0);
  };

  const updateVolunteerExperience = (index: number, updates: Partial<VolunteerExperience>) => {
    const updated = data.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    // DÜZƏLİŞ: React-in dəyişikliyi görməsi üçün yeni massiv referansı yaradırıq
    onChange([...updated]);
  };

  const removeVolunteerExperience = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
    setEditingIndex(null);
  };

  const moveVolunteerExperience = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.length) return;

    const updated = [...data];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {cvLanguage === 'english' ? 'Volunteer Experience' : 'Könüllü təcrübə'}
          </h3>
        </div>
        <button
          onClick={addVolunteerExperience}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            {cvLanguage === 'english' 
              ? 'No volunteer experience added yet' 
              : 'Hələ heç bir könüllü təcrübə əlavə etməmisiniz'
            }
          </p>
          <button
            onClick={addVolunteerExperience}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            {cvLanguage === 'english' 
              ? 'Add your first volunteer experience' 
              : 'İlk könüllü təcrübəni əlavə edin'
            }
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((volunteer, index) => (
            <div key={volunteer.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-500">❤️</span>
                  <h4 className="font-medium text-gray-900">
                    {volunteer.role || (cvLanguage === 'english' ? 'New volunteer experience' : 'Yeni könüllü təcrübə')}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {volunteer.organization || (cvLanguage === 'english' ? 'Organization name' : 'Təşkilat adı')}
                </p>
                {volunteer.cause && (
                  <p className="text-xs text-gray-500 mt-1">
                    {volunteer.cause}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                {/* Move buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveVolunteerExperience(index, 'up')}
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
                    onClick={() => moveVolunteerExperience(index, 'down')}
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
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                  >
                    {editingIndex === index 
                      ? (cvLanguage === 'english' ? 'Close' : 'Bağlayın')
                      : (cvLanguage === 'english' ? 'Edit' : 'Redaktə edin')
                    }
                  </button>
                  <button
                    onClick={() => removeVolunteerExperience(index)}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                  >
                    {cvLanguage === 'english' ? 'Delete' : 'Silin'}
                  </button>
                </div>
              </div>

              {editingIndex === index && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {cvLanguage === 'english' ? 'Position/Role' : 'Vəzifə/Rol'}
                      </label>
                      <input
                        type="text"
                        value={volunteer.role}
                        onChange={(e) => updateVolunteerExperience(index, { role: e.target.value })}
                        placeholder={cvLanguage === 'english' ? 'Volunteer Coordinator' : 'Könüllü koordinator'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {cvLanguage === 'english' ? 'Organization' : 'Təşkilat'}
                      </label>
                      <input
                        type="text"
                        value={volunteer.organization}
                        onChange={(e) => updateVolunteerExperience(index, { organization: e.target.value })}
                        placeholder={cvLanguage === 'english' ? 'Non-profit Organization' : 'Kinder MTM'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {cvLanguage === 'english' ? 'Cause/Purpose (optional)' : 'Sahə/Məqsəd (ixtiyari)'}
                    </label>
                    <input
                      type="text"
                      value={volunteer.cause || ''}
                      onChange={(e) => updateVolunteerExperience(index, { cause: e.target.value })}
                      placeholder={cvLanguage === 'english' 
                        ? 'Child education, environmental protection, social aid'
                        : 'Uşaq təhsili, ekoloji mühafizə, sosial yardım'
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* Date Range Input */}
                  <DateRangeInput
                    startDate={volunteer.startDate || ''}
                    endDate={volunteer.endDate}
                    current={volunteer.current || false}
                    onStartDateChange={(date) => updateVolunteerExperience(index, { startDate: date })}
                    onEndDateChange={(date) => updateVolunteerExperience(index, { endDate: date })}
                    onCurrentChange={(current) => updateVolunteerExperience(index, { 
                      current, 
                      endDate: current ? '' : volunteer.endDate 
                    })}
                    startLabel={cvLanguage === 'english' ? 'Start Date' : 'Başlama tarixi'}
                    endLabel={cvLanguage === 'english' ? 'End Date' : 'Bitirmə tarixi'}
                    currentLabel={cvLanguage === 'english' ? 'Currently volunteering' : 'Davam edir'}
                    cvLanguage={cvLanguage}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {cvLanguage === 'english' ? 'Description (optional)' : 'Təsvir (ixtiyari)'}
                    </label>
                    <RichTextEditor
                      value={volunteer.description || ''}
                      onChange={(value) => updateVolunteerExperience(index, { description: value })}
                      placeholder={cvLanguage === 'english' 
                        ? 'Provide brief information about your volunteer work...'
                        : 'Könüllü fəaliyyətiniz haqqında qısa məlumat verin...'
                      }
                      minHeight="100px"
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
            onClick={addVolunteerExperience}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">
              {cvLanguage === 'english' 
                ? '+ Add another volunteer experience' 
                : '+ Başqa könüllü təcrübə əlavə edin'
              }
            </span>
            <span className="sm:hidden">
              {cvLanguage === 'english' ? '+ Add' : '+ Əlavə'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}