'use client';

import { useState } from 'react';
import RichTextEditor from '@/components/ui/RichTextEditor';

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
}

export default function VolunteerExperienceSection({ data, onChange }: VolunteerExperienceSectionProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Könüllü təcrübə</h3>
        </div>
        <button
          onClick={addVolunteerExperience}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Əlavə edin
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">Hələ heç bir könüllü təcrübə əlavə etməmisiniz</p>
          <button
            onClick={addVolunteerExperience}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk könüllü təcrübəni əlavə edin
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
                    {volunteer.role || 'Yeni könüllü təcrübə'}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {volunteer.organization || 'Təşkilat adı'}
                </p>
                {volunteer.cause && (
                  <p className="text-xs text-gray-500 mt-1">
                    {volunteer.cause}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 mt-4 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                >
                  {editingIndex === index ? 'Bağlayın' : 'Redaktə edin'}
                </button>
                <button
                  onClick={() => removeVolunteerExperience(index)}
                  className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                >
                  Silin
                </button>
              </div>

              {editingIndex === index && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vəzifə/Rol
                      </label>
                      <input
                        type="text"
                        value={volunteer.role}
                        onChange={(e) => updateVolunteerExperience(index, { role: e.target.value })}
                        placeholder="Könüllü koordinator"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Təşkilat
                      </label>
                      <input
                        type="text"
                        value={volunteer.organization}
                        onChange={(e) => updateVolunteerExperience(index, { organization: e.target.value })}
                        placeholder="Kinder MTM"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sahə/Məqsəd (ixtiyari)
                    </label>
                    <input
                      type="text"
                      value={volunteer.cause || ''}
                      onChange={(e) => updateVolunteerExperience(index, { cause: e.target.value })}
                      placeholder="Uşaq təhsili, ekoloji mühafizə, sosial yardım"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Başlama tarixi
                      </label>
                      <input
                        type="month"
                        value={volunteer.startDate || ''}
                        onChange={(e) => updateVolunteerExperience(index, { startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bitirmə tarixi
                      </label>
                      <input
                        type="month"
                        value={volunteer.current ? '' : (volunteer.endDate || '')}
                        onChange={(e) => updateVolunteerExperience(index, { endDate: e.target.value })}
                        disabled={Boolean(volunteer.current)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={Boolean(volunteer.current)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            updateVolunteerExperience(index, {
                              current: isChecked,
                              endDate: isChecked ? '' : volunteer.endDate,
                            });
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Davam edir</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Təsvir (ixtiyari)
                    </label>
                    <RichTextEditor
                      value={volunteer.description || ''}
                      onChange={(value) => updateVolunteerExperience(index, { description: value })}
                      placeholder="Könüllü fəaliyyətiniz haqqında qısa məlumat verin..."
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
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            + Başqa könüllü təcrübə əlavə edin
          </button>
        </div>
      )}
    </div>
  );
}