'use client';

import { useState, useEffect } from 'react';
import DateRangeInput from '@/components/cv/DateRangeInput';

interface Publication {
  id: string;
  title: string;
  publisher: string;
  description?: string;
  url?: string;
  authors?: string;
  date?: string;
}

interface PublicationsSectionProps {
  data: Publication[];
  onChange: (data: Publication[]) => void;
  cvLanguage?: 'english' | 'azerbaijani' | 'russian';
}

// Translation helper function
const getTranslation = (cvLanguage: 'english' | 'azerbaijani' | 'russian', key: string): any => {
  const translations: Record<string, Record<string, any>> = {
    english: {
      sectionTitle: 'Publications',
      addButton: '+ Add',
      addButtonMobile: '+',
      emptyStateTitle: 'No publications added yet',
      emptyStateDescription: 'Add your research papers, articles, or published works',
      addFirstButton: 'Add your first publication',
      newPublication: 'New publication',
      publisher: 'Publisher',
      moveUp: 'Move up',
      moveDown: 'Move down',
      edit: 'Edit',
      close: 'Close',
      delete: 'Delete',
      publicationTitle: 'Publication Title',
      publisherName: 'Publisher/Journal',
      publicationUrl: 'Publication URL',
      publicationDate: 'Publication Date',
      authors: 'Authors',
      description: 'Description',
      viewPublication: 'View Publication',
      addAnother: '+ Add another publication',
      placeholders: {
        title: 'Machine Learning in Healthcare Applications',
        publisher: 'IEEE Transactions on Biomedical Engineering',
        url: 'https://doi.org/10.1109/...',
        authors: 'John Doe, Jane Smith, et al.',
        description: 'Description of the publication and key findings...'
      }
    },
    azerbaijani: {
      sectionTitle: 'Nəşrlər',
      addButton: '+ Əlavə et',
      addButtonMobile: '+',
      emptyStateTitle: 'Hələ nəşr əlavə edilməyib',
      emptyStateDescription: 'Tədqiqat məqalələrinizi, yazılarınızı və ya nəşr olunan işlərinizi əlavə edin',
      addFirstButton: 'İlk nəşrinizi əlavə edin',
      newPublication: 'Yeni nəşr',
      publisher: 'Nəşriyyat',
      moveUp: 'Yuxarı',
      moveDown: 'Aşağı',
      edit: 'Redaktə et',
      close: 'Bağla',
      delete: 'Sil',
      publicationTitle: 'Nəşr Başlığı',
      publisherName: 'Nəşriyyat/Jurnal',
      publicationUrl: 'Nəşr URL-si',
      publicationDate: 'Nəşr Tarixi',
      authors: 'Müəlliflər',
      description: 'Təsvir',
      viewPublication: 'Nəşrə Bax',
      addAnother: '+ Başqa nəşr əlavə et',
      placeholders: {
        title: 'Səhiyyədə Maşın Öyrənməsi Tətbiqləri',
        publisher: 'IEEE Biomedikal Mühəndislik Jurnalı',
        url: 'https://doi.org/10.1109/...',
        authors: 'Cəmil Əliyev, Ayşə Həsənova və s.',
        description: 'Nəşrin təsviri və əsas tapıntılar...'
      }
    },
    russian: {
      sectionTitle: 'Публикации',
      addButton: '+ Добавить',
      addButtonMobile: '+',
      emptyStateTitle: 'Публикации еще не добавлены',
      emptyStateDescription: 'Добавьте свои исследовательские работы, статьи или опубликованные труды',
      addFirstButton: 'Добавить первую публикацию',
      newPublication: 'Новая публикация',
      publisher: 'Издательство',
      moveUp: 'Переместить вверх',
      moveDown: 'Переместить вниз',
      edit: 'Редактировать',
      close: 'Закрыть',
      delete: 'Удалить',
      publicationTitle: 'Название публикации',
      publisherName: 'Издательство/Журнал',
      publicationUrl: 'URL публикации',
      publicationDate: 'Дата публикации',
      authors: 'Авторы',
      description: 'Описание',
      viewPublication: 'Посмотреть публикацию',
      addAnother: '+ Добавить еще публикацию',
      placeholders: {
        title: 'Машинное обучение в медицинских приложениях',
        publisher: 'IEEE Transactions on Biomedical Engineering',
        url: 'https://doi.org/10.1109/...',
        authors: 'Иван Иванов, Анна Петрова и др.',
        description: 'Описание публикации и ключевые выводы...'
      }
    }
  };

  return translations[cvLanguage || 'azerbaijani'][key];
};

export default function PublicationsSection({ data, onChange, cvLanguage = 'azerbaijani' }: PublicationsSectionProps) {
  const [publications, setPublications] = useState<Publication[]>(data || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

  useEffect(() => {
    setPublications(data || []);
  }, [data]);

  const addPublication = () => {
    const newPublication: Publication = {
      id: `pub_${Date.now()}`,
      title: '',
      publisher: '',
      description: '',
      url: '',
      authors: '',
      date: ''
    };

    const updatedPublications = [...publications, newPublication];
    console.log('📚 Adding new publication:', newPublication);
    console.log('📚 Updated publications array:', updatedPublications);
    
    setPublications(updatedPublications);
    onChange(updatedPublications);
    setEditingIndex(updatedPublications.length - 1);
  };

  const updatePublication = (index: number, field: keyof Publication, value: string) => {
    const updatedPublications = publications.map((pub, i) => 
      i === index ? { ...pub, [field]: value } : pub
    );
    
    console.log('📚 Updating publication:', { index, field, value });
    console.log('📚 Updated publications:', updatedPublications);
    
    setPublications(updatedPublications);
    onChange(updatedPublications);
  };

  const movePublication = (fromIndex: number, toIndex: number) => {
    const updatedPublications = [...publications];
    const [movedItem] = updatedPublications.splice(fromIndex, 1);
    updatedPublications.splice(toIndex, 0, movedItem);
    
    setPublications(updatedPublications);
    onChange(updatedPublications);
    setOpenDropdownIndex(null);
  };

  const deletePublication = (index: number) => {
    const updatedPublications = publications.filter((_, i) => i !== index);
    setPublications(updatedPublications);
    onChange(updatedPublications);
    setEditingIndex(null);
    setOpenDropdownIndex(null);
  };

  if (publications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {getTranslation(cvLanguage, 'sectionTitle')}
          </h3>
          <button
            onClick={addPublication}
            className="hidden md:flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📚 {getTranslation(cvLanguage, 'addButton')}
          </button>
          <button
            onClick={addPublication}
            className="md:hidden w-10 h-10 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-xl"
          >
            {getTranslation(cvLanguage, 'addButtonMobile')}
          </button>
        </div>

        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <h4 className="text-xl font-semibold text-gray-700 mb-2">
            {getTranslation(cvLanguage, 'emptyStateTitle')}
          </h4>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {getTranslation(cvLanguage, 'emptyStateDescription')}
          </p>
          <button
            onClick={addPublication}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {getTranslation(cvLanguage, 'addFirstButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {getTranslation(cvLanguage, 'sectionTitle')}
        </h3>
        <button
          onClick={addPublication}
          className="hidden md:flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          📚 {getTranslation(cvLanguage, 'addButton')}
        </button>
        <button
          onClick={addPublication}
          className="md:hidden w-10 h-10 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-xl"
        >
          {getTranslation(cvLanguage, 'addButtonMobile')}
        </button>
      </div>

      <div className="space-y-4">
        {publications.map((publication, index) => (
          <div
            key={publication.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            {editingIndex === index ? (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">
                    {publication.title || getTranslation(cvLanguage, 'newPublication')}
                  </h4>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getTranslation(cvLanguage, 'publicationTitle')}
                    </label>
                    <input
                      type="text"
                      value={publication.title}
                      onChange={(e) => updatePublication(index, 'title', e.target.value)}
                      placeholder={getTranslation(cvLanguage, 'placeholders').title}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getTranslation(cvLanguage, 'publisherName')}
                    </label>
                    <input
                      type="text"
                      value={publication.publisher}
                      onChange={(e) => updatePublication(index, 'publisher', e.target.value)}
                      placeholder={getTranslation(cvLanguage, 'placeholders').publisher}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getTranslation(cvLanguage, 'authors')}
                    </label>
                    <input
                      type="text"
                      value={publication.authors}
                      onChange={(e) => updatePublication(index, 'authors', e.target.value)}
                      placeholder={getTranslation(cvLanguage, 'placeholders').authors}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getTranslation(cvLanguage, 'publicationDate')}
                    </label>
                    <DateRangeInput
                      startDate={publication.date || ''}
                      onStartDateChange={(date) => updatePublication(index, 'date', date)}
                      endDate=""
                      onEndDateChange={() => {}}
                      current={false}
                      onCurrentChange={() => {}}
                      singleDate={true}
                      cvLanguage={cvLanguage as 'english' | 'azerbaijani'}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getTranslation(cvLanguage, 'publicationUrl')}
                    </label>
                    <input
                      type="url"
                      value={publication.url}
                      onChange={(e) => updatePublication(index, 'url', e.target.value)}
                      placeholder={getTranslation(cvLanguage, 'placeholders').url}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getTranslation(cvLanguage, 'description')}
                    </label>
                    <textarea
                      value={publication.description}
                      onChange={(e) => updatePublication(index, 'description', e.target.value)}
                      placeholder={getTranslation(cvLanguage, 'placeholders').description}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="cursor-grab hover:cursor-grabbing text-gray-400">
                        ⋮⋮
                      </div>
                      <h4 className="font-semibold text-gray-800">
                        {publication.title || getTranslation(cvLanguage, 'newPublication')}
                      </h4>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1 ml-8">
                      {publication.publisher && (
                        <p><strong>{getTranslation(cvLanguage, 'publisher')}:</strong> {publication.publisher}</p>
                      )}
                      {publication.authors && (
                        <p><strong>{getTranslation(cvLanguage, 'authors')}:</strong> {publication.authors}</p>
                      )}
                      {publication.date && (
                        <p><strong>{getTranslation(cvLanguage, 'publicationDate')}:</strong> {publication.date}</p>
                      )}
                      {publication.description && (
                        <p className="text-gray-700 mt-2">{publication.description}</p>
                      )}
                      {publication.url && (
                        <p>
                          <a 
                            href={publication.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 underline"
                          >
                            {getTranslation(cvLanguage, 'viewPublication')}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      ⋯
                    </button>

                    {openDropdownIndex === index && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                        <button
                          onClick={() => {
                            setEditingIndex(index);
                            setOpenDropdownIndex(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          ✏️ {getTranslation(cvLanguage, 'edit')}
                        </button>
                        
                        {index > 0 && (
                          <button
                            onClick={() => movePublication(index, index - 1)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            ↑ {getTranslation(cvLanguage, 'moveUp')}
                          </button>
                        )}
                        
                        {index < publications.length - 1 && (
                          <button
                            onClick={() => movePublication(index, index + 1)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            ↓ {getTranslation(cvLanguage, 'moveDown')}
                          </button>
                        )}
                        
                        <div className="border-t border-gray-100">
                          <button
                            onClick={() => deletePublication(index)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            🗑️ {getTranslation(cvLanguage, 'delete')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addPublication}
        className="w-full py-3 border-2 border-dashed border-purple-300 text-purple-600 rounded-lg hover:border-purple-400 hover:text-purple-700 transition-colors"
      >
        {getTranslation(cvLanguage, 'addAnother')}
      </button>
    </div>
  );
}
