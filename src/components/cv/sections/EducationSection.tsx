'use client';

import { useState } from 'react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import DateRangeInput from '@/components/cv/DateRangeInput';

interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  gpa?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

interface EducationSectionProps {
  data: Education[];
  onChange: (data: Education[]) => void;
  cvLanguage?: 'english' | 'azerbaijani'; // Updated CV language prop
}

export default function EducationSection({ data, onChange, cvLanguage = 'azerbaijani' }: EducationSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      gpa: '',
      description: '',
      startDate: '',
      endDate: '',
      current: false
    };
    onChange([newEducation, ...data]);
    setExpandedId(newEducation.id);
  };

  const updateEducation = (id: string, updates: Partial<Education>) => {
    const updated = data.map(edu =>
      edu.id === id ? { ...edu, ...updates } : edu
    );
    onChange([...updated]);
  };

  const removeEducation = (id: string) => {
    onChange(data.filter(edu => edu.id !== id));
  };

  const moveEducation = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(edu => edu.id === id);
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
            {cvLanguage === 'english' ? 'Education' : 'Təhsil'}
          </h3>
        </div>
        <button
          onClick={addEducation}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            {cvLanguage === 'english' 
              ? 'No education information added yet' 
              : 'Hələ heç bir təhsil məlumatı əlavə etməmisiniz'
            }
          </p>
          <button
            onClick={addEducation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {cvLanguage === 'english' 
              ? 'Add your first education' 
              : 'İlk təhsilinizi əlavə edin'
            }
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((education, index) => (
            <div key={education.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500">🎓</span>
                  <h4 className="font-medium text-gray-900">
                    {education.degree || (cvLanguage === 'english' ? 'New education' : 'Yeni təhsil')}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {education.institution || (cvLanguage === 'english' ? 'Educational institution' : 'Təhsil müəssisəsi')}
                </p>
                {(education.field || education.gpa) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {[education.field, education.gpa].filter(Boolean).join(' - ')}
                  </p>
                )}
              </div>

              {/* Action links moved to bottom of card */}
              <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                {/* Move buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveEducation(education.id, 'up')}
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
                    onClick={() => moveEducation(education.id, 'down')}
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
                    onClick={() => setExpandedId(expandedId === education.id ? null : education.id)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                  >
                    {expandedId === education.id 
                      ? (cvLanguage === 'english' ? 'Close' : 'Bağlayın')
                      : (cvLanguage === 'english' ? 'Edit' : 'Redaktə edin')
                    }
                  </button>
                  <button
                    onClick={() => removeEducation(education.id)}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                  >
                    {cvLanguage === 'english' ? 'Delete' : 'Silin'}
                  </button>
                </div>
              </div>

              {expandedId === education.id && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {cvLanguage === 'english' ? 'Educational Institution' : 'Təhsil müəssisəsi'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={education.institution || ''}
                        onChange={(e) => updateEducation(education.id, { institution: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={cvLanguage === 'english' ? 'University name' : 'Universitet adı'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                          <span>
                            {cvLanguage === 'english' ? 'Degree' : 'Dərəcə'} <span className="text-gray-400 text-xs">({cvLanguage === 'english' ? 'optional' : 'ixtiyari'})</span>
                          </span>
                        </span>
                      </label>
                      <select
                        value={education.degree || ''}
                        onChange={(e) => updateEducation(education.id, { degree: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="">
                          {cvLanguage === 'english' ? '🎓 Select degree' : '🎓 Dərəcə seçin'}
                        </option>
                        <option value={cvLanguage === 'english' ? 'Bachelor' : 'Bakalavr'}>
                          🎓 {cvLanguage === 'english' ? 'Bachelor' : 'Bakalavr'}
                        </option>
                        <option value={cvLanguage === 'english' ? 'Master' : 'Magistr'}>
                          🎓 {cvLanguage === 'english' ? 'Master' : 'Magistr'}
                        </option>
                        <option value={cvLanguage === 'english' ? 'PhD' : 'Doktorantura'}>
                          🎓 {cvLanguage === 'english' ? 'PhD' : 'Doktorantura'}
                        </option>
                        <option value={cvLanguage === 'english' ? 'Diploma' : 'Diploma'}>
                          📜 {cvLanguage === 'english' ? 'Diploma' : 'Diploma'}
                        </option>
                        <option value={cvLanguage === 'english' ? 'Certificate' : 'Sertifikat'}>
                          📋 {cvLanguage === 'english' ? 'Certificate' : 'Sertifikat'}
                        </option>
                        <option value={cvLanguage === 'english' ? 'Other' : 'Digər'}>
                          📚 {cvLanguage === 'english' ? 'Other' : 'Digər'}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {cvLanguage === 'english' ? 'Field of Study' : 'Sahə'} <span className="text-gray-400 text-xs">({cvLanguage === 'english' ? 'optional' : 'ixtiyari'})</span>
                      </label>
                      <input
                        type="text"
                        value={education.field || ''}
                        onChange={(e) => updateEducation(education.id, { field: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={cvLanguage === 'english' 
                          ? 'Computer Science, Business Administration, etc.'
                          : 'Kompüter Elmi, Biznes İdarəetməsi, və s.'
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {cvLanguage === 'english' ? 'GPA / Grade' : 'ÜOMG / Qiymət'} <span className="text-gray-400 text-xs">(ixtiyari)</span>
                      </label>
                      <input
                        type="text"
                        value={education.gpa || ''}
                        onChange={(e) => updateEducation(education.id, { gpa: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={cvLanguage === 'english' ? '3.8/4.0, High, etc.' : '3.8/4.0, Yüksək, və s.'}
                      />
                    </div>
                  </div>

                  {/* Date Range Input */}
                  <DateRangeInput
                    startDate={education.startDate || ''}
                    endDate={education.endDate}
                    current={education.current || false}
                    onStartDateChange={(date) => updateEducation(education.id, { startDate: date })}
                    onEndDateChange={(date) => updateEducation(education.id, { endDate: date })}
                    onCurrentChange={(current) => updateEducation(education.id, { 
                      current, 
                      endDate: current ? '' : education.endDate 
                    })}
                    startLabel={cvLanguage === 'english' ? 'Start Date' : 'Başlama tarixi'}
                    endLabel={cvLanguage === 'english' ? 'End Date' : 'Bitirmə tarixi'}
                    currentLabel={cvLanguage === 'english' ? 'Currently studying' : 'Davam edir'}
                    cvLanguage={cvLanguage}
                  />

                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(education.current)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          updateEducation(education.id, {
                            current: isChecked,
                            endDate: isChecked ? '' : education.endDate,
                          });
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {cvLanguage === 'english' ? 'Currently studying' : 'Davam edir'}
                      </span>
                    </label>
                  </div>

               <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {cvLanguage === 'english' ? 'Description (optional)' : 'Təsvir (ixtiyari)'}
                    </label>
                    <RichTextEditor
                      value={education.description ?? ''}
                      onChange={(value) => updateEducation(education.id, { description: value })}
                      placeholder={cvLanguage === 'english' 
                        ? 'Provide information about your education...'
                        : 'Təhsiliniz haqqında məlumat verin...'
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
            onClick={addEducation}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {cvLanguage === 'english' 
              ? '+ Add another education' 
              : '+ Başqa təhsil əlavə edin'
            }
          </button>
        </div>
      )}
    </div>
  );
}
