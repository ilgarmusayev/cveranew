'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

interface Template {
  id: string;
  name: string;
  tier: string;
  hasAccess?: boolean;
}

export default function NewCVPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    templateId: '', // Will be set when templates load
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      summary: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [error, setError] = useState('');

  // Load templates and LinkedIn data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        loadTemplates(),
        loadLinkedInData()
      ]);
    };

    if (user) {
      loadInitialData();
    }
  }, [user]);

  // Load available templates
  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);

        // Set default template to first accessible one
        const accessibleTemplate = data.templates.find((t: Template) => t.hasAccess !== false);
        if (accessibleTemplate && !formData.templateId) {
          setFormData(prev => ({
            ...prev,
            templateId: accessibleTemplate.id
          }));
        }
      }
    } catch (error) {
      console.error('Templates yüklənərkən xəta:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Load LinkedIn data if available
  const loadLinkedInData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/linkedin-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const linkedinData = await response.json();
        console.log('📥 LinkedIn məlumatları yükləndi:', linkedinData);

        // Auto-populate form with LinkedIn data
        if (linkedinData.profile) {
          const profile = linkedinData.profile;

          setFormData(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              firstName: profile.firstName || prev.personalInfo.firstName,
              lastName: profile.lastName || prev.personalInfo.lastName,
              email: profile.emailAddress || prev.personalInfo.email,
              summary: profile.summary || prev.personalInfo.summary,
              // LinkedIn phone and address might be in different format
              phone: profile.phoneNumbers?.[0]?.number || prev.personalInfo.phone,
              address: profile.location?.name || prev.personalInfo.address
            }
          }));

          console.log('✅ LinkedIn məlumatları avtomatik dolduruldu');
        }
      } else {
        console.log('LinkedIn məlumatları tapılmadı və ya yüklənmədi');
      }
    } catch (error) {
      console.error('LinkedIn məlumatları yüklənərkən xəta:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'title' || field === 'templateId') {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: value
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('CV başlığı tələb olunur');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Giriş tələb olunur');
        setLoading(false);
        return;
      }

      console.log('📤 Göndərilən məlumatlar:', formData);

      // Properly structure the CV data with fullName field
      const cvData = {
        personalInfo: {
          fullName: `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`.trim() || 'Adsız İstifadəçi',
          firstName: formData.personalInfo.firstName,
          lastName: formData.personalInfo.lastName,
          email: formData.personalInfo.email,
          phone: formData.personalInfo.phone,
          website: '',
          linkedin: '',
          summary: formData.personalInfo.summary
        },
        experience: [],
        education: [],
        skills: [],
        languages: [],
        projects: [],
        certifications: [],
        volunteerExperience: []
      };

      console.log('📤 Strukturlanmış CV məlumatları:', cvData);

      const response = await fetch('/api/cv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          templateId: formData.templateId,
          cv_data: cvData
        })
      });

      const result = await response.json();
      console.log('📥 API cavabı:', result);

      if (!response.ok) {
        setError(result.error || 'CV yaradılmadı');
        return;
      }

      if (result.success && result.cvId) {
        console.log('✅ Yeni CV yaradıldı:', result.cvId);

        // Redirect to edit the created CV
        router.push(`/cv/edit/${result.cvId}`);
      } else {
        setError(result.error || 'CV yaradılmadı');
      }

    } catch (error) {
      console.error('❌ CV yaratma xətası:', error);
      setError(`CV yaradılanda xəta: ${error instanceof Error ? error.message : 'Naməlum xəta'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
          <p className="text-gray-600 text-center">Giriş tələb olunur...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StandardHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            {/* Title Section */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Yeni CV Yaradın</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Əsas məlumatları daxil edib CV yaratdıqdan sonra yaradılan CV-nizi tam redaktə edə bilərsiniz
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
              {/* CV Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  CV Başlığı *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="məsələn: Frontend Developer CV"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                  required
                />
              </div>

              {/* Template Selection */}
              <div>
                <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>CV Şablonu</span>
                  </span>
                </label>
                <select
                  id="templateId"
                  value={formData.templateId}
                  onChange={(e) => handleInputChange('templateId', e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em'
                  }}
                  disabled={loading || templatesLoading}
                >
                  {templatesLoading ? (
                    <option value="">⏳ Yüklənir...</option>
                  ) : (
                    templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        📄 {template.name} ({template.tier})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Personal Info Section */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Şəxsi Məlumatlar</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Ad
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.personalInfo.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Adınız"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Soyad
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.personalInfo.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Soyadınız"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.personalInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="numune@cvera.net"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.personalInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+994 XX XXX XX XX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                </div>


                <div className="mt-4">
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                    Qısa Məlumat
                  </label>
                  <textarea
                    id="summary"
                    value={formData.personalInfo.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    placeholder="Özünüz haqqında qısa məlumat..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  Ləğv et
                </Link>

                <button
                  type="submit"
                  disabled={loading || !formData.title.trim()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-medium text-lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Yaradılır...
                    </div>
                  ) : (
                    'CV yaradın və redaktəyə başlayın'
                  )}
                </button>
              </div>
            </form>

            {/* Info Section */}
            <div className="mt-12 bg-blue-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Növbəti addımlar</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>CV yaradıldıqdan sonra redaktə səhifəsinə yönləndiriləcəksiniz</li>
                <li>İş təcrübəsi, təhsil və bacarıqlarınızı əlavə edə bilərsiniz</li>
                <li>Template-i istədiyiniz zaman dəyişə bilərsiniz</li>
                <li>CV-ni PDF formatında yükləyə bilərsiniz</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
