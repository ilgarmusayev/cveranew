'use client';

import React, { useState, useEffect } from 'react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/ui/Toast';

interface CVData {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  templateId?: string;
}

export default function CoverLetterPage() {
  const { siteLanguage } = useSiteLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  const [cvList, setCVList] = useState<CVData[]>([]);
  const [selectedCV, setSelectedCV] = useState<string>('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tone, setTone] = useState<'formal' | 'creative'>('formal');
  const [coverLetterLanguage, setCoverLetterLanguage] = useState<'azerbaijani' | 'english' | 'russian'>('azerbaijani');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  // Content based on site language
  const content = {
    azerbaijani: {
      title: 'Cover Letter Yaradın',
      subtitle: 'CV məlumatlarınıza əsasən peşəkar cover letter yaradın',
      dataSection: 'Məlumatlar',
      selectCV: 'CV seçin',
      selectCVPlaceholder: 'Cover letter üçün CV seçin',
      jobTitle: 'Vəzifə adı',
      jobTitlePlaceholder: 'Müraciət etdiyiniz vəzifə',
      companyName: 'Şirkət adı',
      companyNamePlaceholder: 'Şirkətin adı',
      jobDescription: 'Vakansiya təsviri',
      jobDescriptionPlaceholder: 'Vakansiya təsvirini və tələbləri buraya daxil edin...',
      tone: 'Ton',
      tones: {
        formal: 'Rəsmi',
        creative: 'Kreativ'
      },
      coverLetterLanguage: 'Cover Letter Dili',
      coverLetterLanguages: {
        azerbaijani: 'Azərbaycan dili',
        english: 'İngilis dili',
        russian: 'Rus dili'
      },
      length: 'Uzunluq',
      lengths: {
        short: 'Qısa',
        medium: 'Orta',
        long: 'Uzun'
      },
      generateButton: 'Cover Letter Yaradın',
      generating: 'Yaradılır...',
      result: 'Nəticə',
      downloadDOCX: 'DOCX Yüklə',
      copyText: 'Mətni Kopyala',
      editText: 'Redaktə Et',
      saveEdit: 'Yadda Saxla',
      cancelEdit: 'Ləğv Et',
      docxInfo: 'DOCX faylını yükləməklə Microsoft Word və ya Google Docs-da əlavə düzəlişlər edə bilərsiniz.',
      emptyStateTitle: 'Cover letter burada görünəcək',
      emptyStateDesc: 'Məlumatları doldurun və "Cover Letter Yaradın" düyməsini basın',
      loginRequired: 'Cover letter yaratmaq üçün daxil olun',
      noCV: 'Heç bir CV tapılmadı. Əvvəlcə CV yaradın.',
      fillAllFields: 'Bütün sahələri doldurun',
      generationError: 'Cover letter yaradılarkən xəta baş verdi',
      copySuccess: 'Mətn panoya kopyalandı!',
      loadingCVs: 'CV-lər yüklənir...'
    },
    english: {
      title: 'Create Cover Letter',
      subtitle: 'Generate professional cover letters based on your CV data',
      dataSection: 'Information',
      selectCV: 'Select CV',
      selectCVPlaceholder: 'Choose CV for cover letter',
      jobTitle: 'Job Title',
      jobTitlePlaceholder: 'Position you are applying for',
      companyName: 'Company Name',
      companyNamePlaceholder: 'Name of the company',
      jobDescription: 'Job Description',
      jobDescriptionPlaceholder: 'Enter job description and requirements here...',
      tone: 'Tone',
      tones: {
        formal: 'Formal',
        creative: 'Creative'
      },
      coverLetterLanguage: 'Cover Letter Language',
      coverLetterLanguages: {
        azerbaijani: 'Azerbaijani',
        english: 'English',
        russian: 'Russian'
      },
      length: 'Length',
      lengths: {
        short: 'Short',
        medium: 'Medium',
        long: 'Long'
      },
      generateButton: 'Generate Cover Letter',
      generating: 'Generating...',
      result: 'Result',
      downloadDOCX: 'Download DOCX',
      copyText: 'Copy Text',
      editText: 'Edit Text',
      saveEdit: 'Save',
      cancelEdit: 'Cancel',
      docxInfo: 'Download as DOCX to make additional edits in Microsoft Word or Google Docs.',
      emptyStateTitle: 'Cover letter will appear here',
      emptyStateDesc: 'Fill in the information and click "Generate Cover Letter" button',
      loginRequired: 'Please login to create cover letters',
      noCV: 'No CVs found. Please create a CV first.',
      fillAllFields: 'Please fill all fields',
      generationError: 'Error occurred while generating cover letter',
      copySuccess: 'Text copied to clipboard!',
      loadingCVs: 'Loading CVs...'
    },
    russian: {
      title: 'Создать сопроводительное письмо',
      subtitle: 'Создавайте профессиональные сопроводительные письма на основе данных резюме',
      dataSection: 'Информация',
      selectCV: 'Выберите резюме',
      selectCVPlaceholder: 'Выберите резюме для сопроводительного письма',
      jobTitle: 'Название должности',
      jobTitlePlaceholder: 'Должность, на которую вы претендуете',
      companyName: 'Название компании',
      companyNamePlaceholder: 'Название компании',
      jobDescription: 'Описание вакансии',
      jobDescriptionPlaceholder: 'Введите описание вакансии и требования здесь...',
      tone: 'Тон',
      tones: {
        formal: 'Формальный',
        creative: 'Креативный'
      },
      coverLetterLanguage: 'Язык письма',
      coverLetterLanguages: {
        azerbaijani: 'Азербайджанский',
        english: 'Английский',
        russian: 'Русский'
      },
      length: 'Длина',
      lengths: {
        short: 'Короткое',
        medium: 'Среднее',
        long: 'Длинное'
      },
      generateButton: 'Создать сопроводительное письмо',
      generating: 'Создается...',
      result: 'Результат',
      downloadDOCX: 'Скачать DOCX',
      copyText: 'Копировать текст',
      editText: 'Редактировать',
      saveEdit: 'Сохранить',
      cancelEdit: 'Отмена',
      docxInfo: 'Скачайте как DOCX для дополнительного редактирования в Microsoft Word или Google Docs.',
      emptyStateTitle: 'Сопроводительное письмо появится здесь',
      emptyStateDesc: 'Заполните информацию и нажмите кнопку "Создать сопроводительное письмо"',
      loginRequired: 'Войдите для создания сопроводительных писем',
      noCV: 'Резюме не найдены. Сначала создайте резюме.',
      fillAllFields: 'Заполните все поля',
      generationError: 'Произошла ошибка при создании сопроводительного письма',
      copySuccess: 'Текст скопирован в буфер обмена!',
      loadingCVs: 'Загрузка резюме...'
    }
  };

  const labels = content[siteLanguage];

  // Load user's CVs
  useEffect(() => {
    const loadCVs = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/cv', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCVList(data.cvs || []);
        }
      } catch (error) {
        console.error('Error loading CVs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadCVs();
    }
  }, [user, authLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const generateCoverLetter = async () => {
    if (!selectedCV || !jobTitle || !jobDescription || !companyName) {
      showError(labels.fillAllFields);
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const response = await fetch('/api/coverletter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cvId: selectedCV,
          jobTitle,
          jobDescription,
          companyName,
          tone,
          length,
          coverLetterLanguage,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setCoverLetter(data.coverLetter);
      } else {
        showError(data.error || labels.generationError);
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      showError(labels.generationError);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter);
      showSuccess(labels.copySuccess);
    } catch (error) {
      console.error('Error copying text:', error);
    }
  };

  const downloadAsPDF = async () => {
    if (!coverLetter) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/coverletter/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coverLetter,
          format: 'pdf',
          jobTitle,
          companyName
        })
      });

      if (!response.ok) {
        throw new Error('PDF export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Cover-Letter-${jobTitle || companyName || 'Default'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('PDF yükləndi!');
    } catch (error) {
      console.error('PDF export error:', error);
      showError('PDF yaradılarkən xəta baş verdi');
    }
  };

  const downloadAsDOC = async () => {
    if (!coverLetter) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/coverletter/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coverLetter,
          format: 'docx',
          jobTitle,
          companyName
        })
      });

      if (!response.ok) {
        throw new Error('DOCX export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Cover-Letter-${jobTitle || companyName || 'Default'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess(`DOCX yükləndi! ${labels.docxInfo}`);
    } catch (error) {
      console.error('DOCX export error:', error);
      showError('DOCX yaradılarkən xəta baş verdi');
    }
  };

  const startEditing = () => {
    setEditedText(coverLetter);
    setIsEditing(true);
  };

  const saveEdit = () => {
    setCoverLetter(editedText);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditedText('');
    setIsEditing(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StandardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{labels.loadingCVs}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StandardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{labels.loginRequired}</h1>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StandardHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{labels.title}</h1>
          <p className="text-gray-600">{labels.subtitle}</p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{labels.dataSection}</h2>
              </div>
              
              {/* CV Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {labels.selectCV} *
                </label>
                <select
                  value={selectedCV}
                  onChange={(e) => setSelectedCV(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{labels.selectCVPlaceholder}</option>
                  {cvList.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {labels.jobTitle} *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={labels.jobTitlePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Company Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {labels.companyName} *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={labels.companyNamePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Job Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {labels.jobDescription} *
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={labels.jobDescriptionPlaceholder}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Tone Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {labels.tone}
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="formal"
                      checked={tone === 'formal'}
                      onChange={(e) => setTone(e.target.value as 'formal' | 'creative')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    {labels.tones.formal}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="creative"
                      checked={tone === 'creative'}
                      onChange={(e) => setTone(e.target.value as 'formal' | 'creative')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    {labels.tones.creative}
                  </label>
                </div>
              </div>

              {/* Cover Letter Language Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {labels.coverLetterLanguage}
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="azerbaijani"
                      checked={coverLetterLanguage === 'azerbaijani'}
                      onChange={(e) => setCoverLetterLanguage(e.target.value as 'azerbaijani' | 'english' | 'russian')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    {labels.coverLetterLanguages.azerbaijani}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="english"
                      checked={coverLetterLanguage === 'english'}
                      onChange={(e) => setCoverLetterLanguage(e.target.value as 'azerbaijani' | 'english' | 'russian')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    {labels.coverLetterLanguages.english}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="russian"
                      checked={coverLetterLanguage === 'russian'}
                      onChange={(e) => setCoverLetterLanguage(e.target.value as 'azerbaijani' | 'english' | 'russian')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    {labels.coverLetterLanguages.russian}
                  </label>
                </div>
              </div>

              {/* Length Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {labels.length}
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="short"
                      checked={length === 'short'}
                      onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    {labels.lengths.short}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="medium"
                      checked={length === 'medium'}
                      onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    {labels.lengths.medium}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="long"
                      checked={length === 'long'}
                      onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    {labels.lengths.long}
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateCoverLetter}
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? labels.generating : labels.generateButton}
              </button>
            </div>

            {/* Result Area */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{labels.result}</h2>
                </div>
                {coverLetter && (
                  <div className="flex space-x-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      {labels.copyText}
                    </button>
                    {!isEditing && (
                      <button
                        onClick={startEditing}
                        className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        {labels.editText}
                      </button>
                    )}
                    <button
                      onClick={downloadAsDOC}
                      className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      {labels.downloadDOCX}
                    </button>
                  </div>
                )}
              </div>

              {coverLetter ? (
                <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
                  {/* Header with letterhead style */}
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-600">Cover Letter</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {jobTitle} - {companyName}
                    </p>
                  </div>
                  
                  {/* Letter content */}
                  {isEditing ? (
                    <div className="mb-4">
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full h-96 px-3 py-2 text-gray-800 font-serif leading-relaxed text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Cover letter mətnini redaktə edin..."
                      />
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={saveEdit}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          {labels.saveEdit}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          {labels.cancelEdit}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-800 font-serif leading-relaxed text-sm">
                      {coverLetter}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500 border-2 border-dashed border-gray-200">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-600 mb-2">{labels.emptyStateTitle}</p>
                  <p className="text-sm text-gray-500">{labels.emptyStateDesc}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}