'use client';

import { useState, useEffect } from 'react';
import { getLabel } from '@/lib/cvLanguage';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  description?: string;
  url?: string;
}

interface CertificationsSectionProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
  
}

export default function CertificationsSection({ data, onChange }: CertificationsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {getLabel('certifications', 'azerbaijani')}
          </h3>
        </div>
        <button
          onClick={addCertification}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Əlavə edin
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            Hələ heç bir sertifikat əlavə etməmisiniz
          </p>
          <button
            onClick={addCertification}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk sertifikatınızı əlavə edin
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((certification, index) => (
            <div key={`${certification.id}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500">🏆</span>
                  <h4 className="font-medium text-gray-900">
                    {certification.name || 'Yeni sertifikat'}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  {certification.issuer || 'Verən təşkilat'}
                </p>
              </div>

              {/* Action links moved to bottom of card */}
              <div className="flex items-center justify-end gap-4 mt-4 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setExpandedId(expandedId === certification.id ? null : certification.id)}
                  className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                >
                  {expandedId === certification.id ? 'Bağlayın' : 'Redaktə edin'}
                </button>
                <button
                  onClick={() => removeCertification(certification.id)}
                  className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                >
                  Silin
                </button>
              </div>

              {expandedId === certification.id && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getLabel('name', 'azerbaijani')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={certification.name}
                        onChange={(e) => updateCertification(certification.id, 'name', e.target.value)}
                        placeholder="AWS Cloud Practitioner"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verən təşkilat <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={certification.issuer}
                        onChange={(e) => updateCertification(certification.id, 'issuer', e.target.value)}
                        placeholder="Amazon Web Services"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>



                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sertifikat URL-i
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
                      {getLabel('description', 'azerbaijani')}
                    </label>
                    <textarea
                      value={certification.description || ''}
                      onChange={(e) => updateCertification(certification.id, 'description', e.target.value)}
                      placeholder="Sertifikatın təsviri və əldə edilən bacarıqlar..."
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
                            Sertifikatı görüntüləyin
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
            + Başqa sertifikat əlavə edin
          </button>
        </div>
      )}
    </div>
  );
}
