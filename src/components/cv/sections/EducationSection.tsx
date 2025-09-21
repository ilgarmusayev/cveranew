'use client';

import { useState } from 'react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
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
  cvLanguage?: 'english' | 'azerbaijani' | 'russian';
}

export default function EducationSection({ data, onChange, cvLanguage = 'azerbaijani' }: EducationSectionProps) {
  const { siteLanguage } = useSiteLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Education labels
  const labels = {
    azerbaijani: {
      title: 'Təhsil',
      add: '+ Əlavə edin',
      addShort: '+',
      newEducation: 'Yeni təhsil məlumatı',
      institutionName: 'Təhsil müəssisəsi adı',
      moveUp: 'Yuxarı',
      moveDown: 'Aşağı',
      close: 'Bağlayın',
      edit: 'Redaktə edin',
      delete: 'Silin',
      institution: 'Təhsil müəssisəsi',
      institutionPlaceholder: 'Məsələn, Bakı Dövlət Universiteti',
      degree: 'Dərəcə',
      degreePlaceholder: 'Məsələn, Bakalavr',
      field: 'İxtisas sahəsi',
      fieldPlaceholder: 'Məsələn, Kompüter elmləri',
      gpa: 'GPA/Orta bal',
      gpaPlaceholder: 'Məsələn, 3.8 və ya 85%',
      startDate: 'Başlama tarixi',
      endDate: 'Bitirmə tarixi',
      currentStudying: 'Davam edir',
      description: 'Təsvir (ixtiyari)',
      descriptionPlaceholder: 'Əldə etdiyiniz nailiyyətlər, kurslar və ya fəaliyyətlər haqqında məlumat verin...',
      optional: 'ixtiyari',
      selectDegree: '🎓 Dərəcə seçin',
      bachelor: 'Bakalavr',
      master: 'Magistr',
      phd: 'Doktorantura',
      diploma: 'Diploma',
      certificate: 'Sertifikat',
      other: 'Digər',
      noEducation: 'Hələ heç bir təhsil məlumatı əlavə etməmisiniz',
      addFirst: 'İlk təhsil məlumatınızı əlavə edin',
      addAnother: '+ Başqa təhsil məlumatı əlavə edin'
    },
    english: {
      title: 'Education',
      add: '+ Add',
      addShort: '+',
      newEducation: 'New education entry',
      institutionName: 'Institution name',
      moveUp: 'Move up',
      moveDown: 'Move down',
      close: 'Close',
      edit: 'Edit',
      delete: 'Delete',
      institution: 'Institution',
      institutionPlaceholder: 'e.g., Harvard University',
      degree: 'Degree',
      degreePlaceholder: 'e.g., Bachelor of Science',
      field: 'Field of Study',
      fieldPlaceholder: 'e.g., Computer Science',
      gpa: 'GPA/Grade',
      gpaPlaceholder: 'e.g., 3.8 or 85%',
      startDate: 'Start Date',
      endDate: 'End Date',
      currentStudying: 'Currently studying',
      description: 'Description (optional)',
      descriptionPlaceholder: 'Provide information about achievements, courses, or activities...',
      optional: 'optional',
      selectDegree: '🎓 Select degree',
      bachelor: 'Bachelor',
      master: 'Master',
      phd: 'PhD',
      diploma: 'Diploma',
      certificate: 'Certificate',
      other: 'Other',
      noEducation: 'No education information added yet',
      addFirst: 'Add your first education entry',
      addAnother: '+ Add another education entry'
    },
    russian: {
      title: 'Образование',
      add: '+ Добавить',
      addShort: '+',
      newEducation: 'Новая запись об образовании',
      institutionName: 'Название учебного заведения',
      moveUp: 'Переместить вверх',
      moveDown: 'Переместить вниз',
      close: 'Закрыть',
      edit: 'Редактировать',
      delete: 'Удалить',
      institution: 'Учебное заведение',
      institutionPlaceholder: 'например, МГУ им. Ломоносова',
      degree: 'Степень',
      degreePlaceholder: 'например, Бакалавр',
      field: 'Область обучения',
      fieldPlaceholder: 'например, Компьютерные науки',
      gpa: 'Средний балл',
      gpaPlaceholder: 'например, 4.5 или 85%',
      startDate: 'Дата начала',
      endDate: 'Дата окончания',
      currentStudying: 'В настоящее время учусь',
      description: 'Описание (необязательно)',
      descriptionPlaceholder: 'Предоставьте информацию о достижениях, курсах или деятельности...',
      optional: 'необязательно',
      selectDegree: '🎓 Выберите степень',
      bachelor: 'Бакалавр',
      master: 'Магистр',
      phd: 'Кандидат наук',
      diploma: 'Диплом',
      certificate: 'Сертификат',
      other: 'Другое',
      noEducation: 'Информация об образовании еще не добавлена',
      addFirst: 'Добавьте вашу первую запись об образовании',
      addAnother: '+ Добавить еще одну запись об образовании'
    }
  };

  const content = labels[siteLanguage];

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
            {content.title}
          </h3>
        </div>
        <button
          onClick={addEducation}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            {content.noEducation}
          </p>
          <button
            onClick={addEducation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {content.addFirst}
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
                    {education.degree || content.newEducation}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {education.institution || content.institutionName}
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
                    title={content.moveUp}
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
                    onClick={() => setExpandedId(expandedId === education.id ? null : education.id)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                  >
                    {expandedId === education.id 
                      ? content.close
                      : content.edit
                    }
                  </button>
                  <button
                    onClick={() => removeEducation(education.id)}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                  >
                    {content.delete}
                  </button>
                </div>
              </div>

              {expandedId === education.id && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {content.institution} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={education.institution || ''}
                        onChange={(e) => updateEducation(education.id, { institution: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={content.institutionPlaceholder}
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
                            {content.degree} <span className="text-gray-400 text-xs">({content.optional})</span>
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
                          {content.selectDegree}
                        </option>
                        <option value={content.bachelor}>
                          🎓 {content.bachelor}
                        </option>
                        <option value={content.master}>
                          🎓 {content.master}
                        </option>
                        <option value={content.phd}>
                          🎓 {content.phd}
                        </option>
                        <option value={content.diploma}>
                          📜 {content.diploma}
                        </option>
                        <option value={content.certificate}>
                          📋 {content.certificate}
                        </option>
                        <option value={content.other}>
                          📚 {content.other}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {content.field} <span className="text-gray-400 text-xs">({content.optional})</span>
                      </label>
                      <input
                        type="text"
                        value={education.field || ''}
                        onChange={(e) => updateEducation(education.id, { field: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={content.fieldPlaceholder}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {content.gpa} <span className="text-gray-400 text-xs">({content.optional})</span>
                      </label>
                      <input
                        type="text"
                        value={education.gpa || ''}
                        onChange={(e) => updateEducation(education.id, { gpa: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={content.gpaPlaceholder}
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
                    startLabel={content.startDate}
                    endLabel={content.endDate}
                    currentLabel={content.currentStudying}
                    cvLanguage={cvLanguage as 'english' | 'azerbaijani'}
                  />

               

               <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {content.description}
                    </label>
                    <RichTextEditor
                      value={education.description ?? ''}
                      onChange={(value) => updateEducation(education.id, { description: value })}
                      placeholder={content.descriptionPlaceholder}
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
            {content.addAnother}
          </button>
        </div>
      )}
    </div>
  );
}
