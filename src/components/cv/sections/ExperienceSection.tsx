'use client';

import { useState, useEffect } from 'react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import DateRangeInput from '@/components/cv/DateRangeInput';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { useUndoRedo, useHybridUndoRedo } from '@/hooks/useUndoRedo';
import { useUndoRedoState } from '@/hooks/useUndoRedoState';

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
  cvLanguage?: 'english' | 'azerbaijani' | 'russian';
}

export default function ExperienceSection({ data, onChange, cvLanguage = 'azerbaijani' }: ExperienceSectionProps) {
  const { siteLanguage } = useSiteLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Use undo/redo system for drag & drop and other operations
  const { 
    state: experienceData, 
    saveState, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    reset
  } = useUndoRedoState<Experience[]>(data);

  // Use hybrid undo/redo that handles both input fields and custom operations
  const { handleKeyDown: handleHybridKeyDown } = useHybridUndoRedo(undo, redo);
  
  // Use input-only undo/redo for input fields
  const { handleKeyDown } = useUndoRedo();

  // Sync external data changes with internal state
  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(experienceData)) {
      reset(data);
    }
  }, [data, experienceData, reset]);

  // Experience labels
  const labels = {
    azerbaijani: {
      title: 'İş təcrübəsi',
      add: '+ Əlavə edin',
      addShort: '+',
      newExperience: 'Yeni iş təcrübəsi',
      companyName: 'Şirkət adı',
      moveUp: 'Yuxarı',
      moveDown: 'Aşağı',
      close: 'Bağlayın',
      edit: 'Redaktə edin',
      delete: 'Silin',
      position: 'Vəzifə',
      positionPlaceholder: 'Məsələn, Proqram təminatı mühəndisi',
      company: 'Şirkət',
      companyPlaceholder: 'Məsələn, Tech Solutions Inc.',
      startDate: 'Başlama tarixi',
      endDate: 'Bitirmə tarixi',
      currentWorking: 'Davam edir',
      description: 'Təsvir (ixtiyari)',
      descriptionPlaceholder: 'Vəzifə öhdəlikləriniz və nailiyyətləriniz haqqında məlumat verin...',
      noExperience: 'Hələ heç bir iş təcrübəsi əlavə etməmisiniz',
      addFirst: 'İlk iş təcrübənizi əlavə edin',
      addAnother: '+ Digər iş təcrübəsi əlavə edin'
    },
    english: {
      title: 'Work Experience',
      add: '+ Add',
      addShort: '+',
      newExperience: 'New work experience',
      companyName: 'Company name',
      moveUp: 'Move up',
      moveDown: 'Move down',
      close: 'Close',
      edit: 'Edit',
      delete: 'Delete',
      position: 'Position',
      positionPlaceholder: 'e.g., Software Engineer',
      company: 'Company',
      companyPlaceholder: 'e.g., Tech Solutions Inc.',
      startDate: 'Start Date',
      endDate: 'End Date',
      currentWorking: 'Currently working',
      description: 'Description (optional)',
      descriptionPlaceholder: 'Provide information about your job responsibilities and achievements...',
      noExperience: 'No work experience added yet',
      addFirst: 'Add your first work experience',
      addAnother: '+ Add another work experience'
    },
    russian: {
      title: 'Опыт работы',
      add: '+ Добавить',
      addShort: '+',
      newExperience: 'Новый опыт работы',
      companyName: 'Название компании',
      moveUp: 'Переместить вверх',
      moveDown: 'Переместить вниз',
      close: 'Закрыть',
      edit: 'Редактировать',
      delete: 'Удалить',
      position: 'Должность',
      positionPlaceholder: 'например, Программист',
      company: 'Компания',
      companyPlaceholder: 'например, Tech Solutions Inc.',
      startDate: 'Дата начала',
      endDate: 'Дата окончания',
      currentWorking: 'В настоящее время работаю',
      description: 'Описание (необязательно)',
      descriptionPlaceholder: 'Предоставьте информацию о ваших рабочих обязанностях и достижениях...',
      noExperience: 'Опыт работы еще не добавлен',
      addFirst: 'Добавьте ваш первый опыт работы',
      addAnother: '+ Добавить еще один опыт работы'
    }
  };

  const content = labels[siteLanguage];

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
    const newData = [newExperience, ...experienceData];
    saveState(newData);
    onChange(newData);
    setExpandedId(newExperience.id);
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    const updated = experienceData.map(exp =>
      exp.id === id ? { ...exp, ...updates } : exp
    );
    onChange([...updated]);
    // Don't save state for every keystroke, only for significant changes
  };

  const removeExperience = (id: string) => {
    const newData = experienceData.filter(exp => exp.id !== id);
    saveState(newData);
    onChange(newData);
  };

  const moveExperience = (id: string, direction: 'up' | 'down') => {
    const index = experienceData.findIndex(exp => exp.id === id);
    if (direction === 'up' && index > 0) {
      const updated = [...experienceData];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      saveState(updated);
      onChange(updated);
    } else if (direction === 'down' && index < experienceData.length - 1) {
      const updated = [...experienceData];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      saveState(updated);
      onChange(updated);
    }
  };

  return (
    <div className="space-y-6" onKeyDown={handleHybridKeyDown} tabIndex={-1}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {content.title}
          </h3>
        </div>
        <button
          onClick={addExperience}
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

      {experienceData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2v0" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            {content.noExperience}
          </p>
          <button
            onClick={addExperience}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors break-words leading-tight max-w-48 mx-auto block"
          >
            {content.addFirst}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {experienceData.map((experience, index) => (
            <div key={experience.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500">💼</span>
                  <h4 className="font-medium text-gray-900">
                    {experience.position || content.newExperience}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {experience.company || content.companyName}
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
                    title={content.moveUp}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveExperience(experience.id, 'down')}
                    disabled={index === experienceData.length - 1}
                    className={`p-1 rounded transition-colors ${
                      index === experienceData.length - 1
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
                    onClick={() => setExpandedId(expandedId === experience.id ? null : experience.id)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                  >
                    {expandedId === experience.id 
                      ? content.close
                      : content.edit
                    }
                  </button>
                  <button
                    onClick={() => removeExperience(experience.id)}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                  >
                    {content.delete}
                  </button>
                </div>
              </div>

              {expandedId === experience.id && (
                <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {content.position}
                      </label>
                      <input
                        type="text"
                        value={experience.position}
                        onChange={(e) => updateExperience(experience.id, { position: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder={content.positionPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {content.company}
                      </label>
                      <input
                        type="text"
                        value={experience.company}
                        onChange={(e) => updateExperience(experience.id, { company: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder={content.companyPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Date Range Input */}
                  <DateRangeInput
                    startDate={experience.startDate || ''}
                    endDate={experience.endDate}
                    current={experience.current || false}
                    onStartDateChange={(date) => updateExperience(experience.id, { startDate: date })}
                    onEndDateChange={(date) => updateExperience(experience.id, { endDate: date })}
                    onCurrentChange={(current) => updateExperience(experience.id, { 
                      current, 
                      endDate: current ? '' : experience.endDate 
                    })}
                    startLabel={content.startDate}
                    endLabel={content.endDate}
                    currentLabel={content.currentWorking}
                    siteLanguage={siteLanguage}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {content.description}
                    </label>
                    <RichTextEditor
                      value={experience.description}
                      onChange={(value) => updateExperience(experience.id, { description: value })}
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

      {experienceData.length > 0 && (
        <div className="text-center">
          <button
            onClick={addExperience}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {content.addAnother}
          </button>
        </div>
      )}
    </div>
  );
}
