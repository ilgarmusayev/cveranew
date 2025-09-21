'use client';

import { useState, useEffect } from 'react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import DateRangeInput from '@/components/cv/DateRangeInput';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  description?: string;
  url?: string;
  date?: string;
}

interface CertificationsSectionProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
  cvLanguage?: 'english' | 'azerbaijani';
}

// Translation helper function
const getTranslation = (siteLanguage: 'english' | 'azerbaijani', key: string): any => {
  const translations = {
    english: {
      sectionTitle: 'Certifications',
      addButton: '+ Add',
      addButtonMobile: '+',
      emptyStateTitle: 'No certifications added yet',
      emptyStateDescription: 'Add your professional certifications to showcase your expertise',
      addFirstButton: 'Add your first certification',
      newCertification: 'New certification',
      issuingOrganization: 'Issuing organization',
      moveUp: 'Move up',
      moveDown: 'Move down',
      edit: 'Edit',
      close: 'Close',
      delete: 'Delete',
      certificationName: 'Certification Name',
      issuingOrg: 'Issuing Organization',
      certificateUrl: 'Certificate URL',
      issueDate: 'Issue Date',
      description: 'Description',
      viewCertificate: 'View Certificate',
      addAnother: '+ Add another certification',
      placeholders: {
        certName: 'AWS Cloud Practitioner',
        orgName: 'Amazon Web Services',
        url: 'https://www.credly.com/badges/...',
        description: 'Description of the certification and skills gained...'
      }
    },
    azerbaijani: {
      sectionTitle: 'Sertifikatlar',
      addButton: '+ Əlavə edin',
      addButtonMobile: '+',
      emptyStateTitle: 'Hələ heç bir sertifikat əlavə etməmisiniz',
      emptyStateDescription: 'Peşəkar ekspertizanızı nümayiş etdirmək üçün sertifikatlarınızı əlavə edin',
      addFirstButton: 'İlk sertifikatınızı əlavə edin',
      newCertification: 'Yeni sertifikat',
      issuingOrganization: 'Verən təşkilat',
      moveUp: 'Yuxarı',
      moveDown: 'Aşağı',
      edit: 'Redaktə edin',
      close: 'Bağlayın',
      delete: 'Silin',
      certificationName: 'Sertifikat adı',
      issuingOrg: 'Verən təşkilat',
      certificateUrl: 'Sertifikat URL-i',
      issueDate: 'Verilmə tarixi',
      description: 'Təsvir',
      viewCertificate: 'Sertifikatı görüntüləyin',
      addAnother: '+ Başqa sertifikat əlavə edin',
      placeholders: {
        certName: 'AWS Cloud Practitioner',
        orgName: 'Amazon Web Services',
        url: 'https://www.credly.com/badges/...',
        description: 'Sertifikatın təsviri və əldə edilən bacarıqlar...'
      }
    }
  } as const;
  
  // Debug logging
  console.log('🔍 Translation request:', { siteLanguage, key });
  console.log('🔍 Available translations:', Object.keys(translations));
  console.log('🔍 Selected language exists?', siteLanguage in translations);
  const result = (translations[siteLanguage] as any)[key] || (translations['azerbaijani'] as any)[key];
  console.log('🔍 Translation result:', result);
  
  return result;
};

export default function CertificationsSection({ data, onChange, cvLanguage = 'azerbaijani' }: CertificationsSectionProps) {
  const { siteLanguage } = useSiteLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debug: Check what language is being used
  console.log('🔍 CertificationsSection language:', cvLanguage);
  console.log('🔍 CertificationsSection siteLanguage:', siteLanguage);
  console.log('🔍 Are they different?', cvLanguage !== siteLanguage);

  // Create a more robust unique ID generator
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const counterStr = Math.random().toString(36).substring(2, 9);
    return `cert-${timestamp}-${randomStr}-${counterStr}`;
  };

  // Fix duplicate IDs in existing data
  useEffect(() => {
    const seenIds = new Set();
    let hasDuplicates = false;

    const fixedData = data.map(cert => {
      if (seenIds.has(cert.id)) {
        hasDuplicates = true;
        return { ...cert, id: generateUniqueId() };
      }
      seenIds.add(cert.id);
      return cert;
    });

    if (hasDuplicates) {
      console.log('🔧 Fixed duplicate certification IDs');
      onChange(fixedData);
    }
  }, [data, onChange]);

  const addCertification = () => {
    const newCertification: Certification = {
      id: generateUniqueId(),
      name: '',
      issuer: '',
      description: '',
      url: '',
      date: ''
    };
    onChange([newCertification, ...data]);
    setExpandedId(newCertification.id);
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    const updated = data.map(cert => 
      cert.id === id ? { ...cert, [field]: value } : cert
    );
    onChange(updated);
  };

  const removeCertification = (id: string) => {
    onChange(data.filter(cert => cert.id !== id));
  };

  const moveCertification = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(cert => cert.id === id);
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {getTranslation(siteLanguage, 'sectionTitle')}
          </h3>
        </div>
        <button
          onClick={addCertification}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <span className="hidden sm:inline">
            {getTranslation(siteLanguage, 'addButton')}
          </span>
          <span className="sm:hidden">
            {getTranslation(siteLanguage, 'addButtonMobile')}
          </span>
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4 flex justify-center">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4 px-4">
            {getTranslation(siteLanguage, 'emptyStateDescription')}
          </p>
          <button
            onClick={addCertification}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {getTranslation(siteLanguage, 'addFirstButton')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((certification, index) => (
            <div key={`${certification.id}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500 flex-shrink-0">🏆</span>
                  <h4 className="font-medium text-gray-900 truncate">
                    {certification.name || getTranslation(siteLanguage, 'newCertification')}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {certification.issuer || getTranslation(siteLanguage, 'issuingOrganization')}
                </p>
              </div>

              {/* Action links moved to bottom of card */}
              <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100 flex-wrap gap-2">
                {/* Move buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => moveCertification(certification.id, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded transition-colors ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={getTranslation(siteLanguage, 'moveUp')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveCertification(certification.id, 'down')}
                    disabled={index === data.length - 1}
                    className={`p-1 rounded transition-colors ${
                      index === data.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={getTranslation(siteLanguage, 'moveDown')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Edit and remove buttons */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === certification.id ? null : certification.id)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                  >
                    {expandedId === certification.id 
                      ? getTranslation(siteLanguage, 'close')
                      : getTranslation(siteLanguage, 'edit')
                    }
                  </button>
                  <button
                    onClick={() => removeCertification(certification.id)}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                  >
                    {getTranslation(siteLanguage, 'delete')}
                  </button>
                </div>
              </div>

              {expandedId === certification.id && (
                <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getTranslation(siteLanguage, 'certificationName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={certification.name}
                        onChange={(e) => updateCertification(certification.id, 'name', e.target.value)}
                        placeholder={getTranslation(siteLanguage, 'placeholders').certName}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getTranslation(siteLanguage, 'issuingOrg')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={certification.issuer}
                        onChange={(e) => updateCertification(certification.id, 'issuer', e.target.value)}
                        placeholder={getTranslation(siteLanguage, 'placeholders').orgName}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getTranslation(siteLanguage, 'certificateUrl')}
                      </label>
                      <input
                        type="url"
                        value={certification.url || ''}
                        onChange={(e) => updateCertification(certification.id, 'url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={getTranslation(siteLanguage, 'placeholders').url}
                      />
                    </div>

                    {/* Issue Date using DateRangeInput in single date mode */}
                    <DateRangeInput
                      startDate={certification.date || ''}
                      endDate=""
                      current={false}
                      onStartDateChange={(date) => updateCertification(certification.id, 'date', date)}
                      onEndDateChange={() => {}}
                      onCurrentChange={() => {}}
                      startLabel={getTranslation(siteLanguage, 'issueDate')}
                      cvLanguage={cvLanguage}
                      singleDate={true}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {getTranslation(siteLanguage, 'description')}
                    </label>
                    <textarea
                      value={certification.description || ''}
                      onChange={(e) => updateCertification(certification.id, 'description', e.target.value)}
                      placeholder={getTranslation(siteLanguage, 'placeholders').description}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      {certification.url && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span>🔗</span>
                          <a 
                            href={certification.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {getTranslation(siteLanguage, 'viewCertificate')}
                          </a>
                        </div>
                      )}
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
            onClick={addCertification}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {getTranslation(siteLanguage, 'addAnother')}
          </button>
        </div>
      )}
    </div>
  );
}
