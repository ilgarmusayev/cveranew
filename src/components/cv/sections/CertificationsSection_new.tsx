'use client';

import { useState } from 'react';
import { getLabel, CVLanguage } from '@/lib/cvLanguage';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  description?: string;
  url?: string;
}

interface CertificationsSectionProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
  language?: CVLanguage;
}

export default function CertificationsSection({ data, onChange, language = 'azerbaijani' }: CertificationsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addCertification = () => {
    const newCertification: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      date: '',
      description: '',
      url: ''
    };
    onChange([...data, newCertification]);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + '-01');
    return date.toLocaleDateString('az-AZ', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <h2 className="text-xl font-semibold text-gray-900">
            {getLabel('certifications', language)}
          </h2>
        </div>
        <button
          onClick={addCertification}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="text-lg">+</span>
          {getLabel('add', language)}
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <span className="text-4xl mb-4 block">🏆</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'azerbaijani' ? 'Hələ sertifikat əlavə edilməyib' : 'No certifications added yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {language === 'azerbaijani' ? 
              'Peşəkar inkişafınızı göstərmək üçün sertifikatlarınızı əlavə edin' : 
              'Add your certifications to showcase your professional development'
            }
          </p>
          <button
            onClick={addCertification}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="text-lg">+</span>
            {language === 'azerbaijani' ? 'İlk sertifikatı əlavə et' : 'Add first certification'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((certification, index) => (
            <div key={certification.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">🏆</span>
                    <h3 className="font-medium text-gray-900">
                      {certification.name || (language === 'azerbaijani' ? 'Sertifikat adı' : 'Certification name')}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-2 mb-1">
                      <span>🏢</span>
                      <span>{certification.issuer || (language === 'azerbaijani' ? 'Verən təşkilat' : 'Issuing organization')}</span>
                    </div>
                    {certification.date && (
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{formatDate(certification.date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveCertification(certification.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={language === 'azerbaijani' ? 'Yuxarı köçür' : 'Move up'}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveCertification(certification.id, 'down')}
                    disabled={index === data.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={language === 'azerbaijani' ? 'Aşağı köçür' : 'Move down'}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === certification.id ? null : certification.id)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title={language === 'azerbaijani' ? 'Redaktə et' : 'Edit'}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => removeCertification(certification.id)}
                    className="p-2 text-red-500 hover:text-red-700"
                    title={language === 'azerbaijani' ? 'Sil' : 'Delete'}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {expandedId === certification.id && (
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getLabel('name', language)} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={certification.name}
                        onChange={(e) => updateCertification(certification.id, 'name', e.target.value)}
                        placeholder={language === 'azerbaijani' ? 'AWS Cloud Practitioner' : 'AWS Cloud Practitioner'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'azerbaijani' ? 'Verən təşkilat' : 'Issuing organization'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={certification.issuer}
                        onChange={(e) => updateCertification(certification.id, 'issuer', e.target.value)}
                        placeholder={language === 'azerbaijani' ? 'Amazon Web Services' : 'Amazon Web Services'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getLabel('date', language)} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="month"
                        value={certification.date}
                        onChange={(e) => updateCertification(certification.id, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'azerbaijani' ? 'Sertifikat URL-i' : 'Certification URL'}
                      </label>
                      <input
                        type="url"
                        value={certification.url || ''}
                        onChange={(e) => updateCertification(certification.id, 'url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="https://www.credly.com/badges/..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {getLabel('description', language)}
                    </label>
                    <RichTextEditor
                      value={certification.description || ''}
                      onChange={(value) => updateCertification(certification.id, 'description', value)}
                      placeholder="Sertifikatın əhatə etdiyi mövzular və əhəmiyyəti haqqında qısa məlumat..."
                      minHeight="100px"
                    />
                  </div>

                  {certification.date && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📅</span>
                        <span>{formatDate(certification.date)}</span>
                      </div>
                      {certification.url && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span>🔗</span>
                          <a 
                            href={certification.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {language === 'azerbaijani' ? 'Sertifikatı görüntülə' : 'View certificate'}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">+</span>
            {language === 'azerbaijani' ? 'Başqa sertifikat əlavə et' : 'Add another certification'}
          </button>
        </div>
      )}
    </div>
  );
}
