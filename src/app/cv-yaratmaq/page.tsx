'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'

// Server component wrapper
export default function CVYaratmaqPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Mouse tracking for cursor effect
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // JSON-LD Schema markup
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "CV Yaratmaq - Professional Resume Builder",
    "description": "AI dəstəyi ilə professional CV yaratmaq platforması. LinkedIn inteqrasiyası, 50+ şablon və ATS optimizasiyası.",
    "url": "https://cvera.net/cv-yaratmaq",
    "inLanguage": "az",
    "mainEntity": {
      "@type": "Service",
      "name": "CV Yaratmaq Xidməti",
      "description": "Süni intellekt texnologiyası ilə professional CV hazırlama xidməti",
      "provider": {
        "@type": "Organization",
        "name": "CVERA",
        "url": "https://cvera.net"
      },
      "areaServed": "Azerbaijan",
      "availableLanguage": "az"
    }
  }

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="app-background relative">
        {/* Mouse cursor effect */}
        <div
          className="fixed w-6 h-6 bg-blue-500/20 rounded-full pointer-events-none z-50 transition-all duration-200 ease-out"
          style={{
            left: mousePosition.x - 12,
            top: mousePosition.y - 12,
          }}
        />

        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CV</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CVERA</span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/templates" className="text-gray-600 hover:text-blue-600 transition-colors">Şablonlar</Link>
                <Link href="/auth/login" className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">Giriş</Link>
                <Link href="/auth/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Qeydiyyat</Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li><Link href="/" className="hover:text-blue-600">Ana səhifə</Link></li>
                <li>/</li>
                <li className="text-gray-900">CV Yaratmaq</li>
              </ol>
            </nav>

            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Professional <span className="text-blue-600">CV Yaratmaq</span> Platforması
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                CVERA ilə <strong>cv yaratmaq</strong> prosesi həm asan, həm də sürətlidir. AI dəstəyi ilə professional CV hazırlayın və karyera yolunuzda uğur qazanın. Pulsuz online CV builder ilə dəqiqələrdə hazır nəticə əldə edin.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                İndi CV Yarat
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="p-6 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Dəstəyi</h3>
                <p className="text-gray-600">Süni intellekt texnologiyası ilə cv yaratmaq artıq daha asan və effektivdir.</p>
              </div>

              <div className="p-6 bg-emerald-50 rounded-xl">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Sürətli Proses</h3>
                <p className="text-gray-600">5 dəqiqədə professional CV hazırlayın və PDF formatında yükləyin.</p>
              </div>

              <div className="p-6 bg-purple-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Nəticə</h3>
                <p className="text-gray-600">HR mütəxəssisləri tərəfindən təsdiqlənmiş şablonlar və formatlar.</p>
              </div>
            </div>

            {/* Content Sections */}
            <article className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">CV Yaratmaq Niyə Vacibdir?</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Müasir iş dünyasında <strong>cv yaratmaq</strong> və professional CV-yə sahib olmaq karyera uğurunun əsas şərtlərindən biridir. Yaxşı hazırlanmış CV sizin bacarıqlarınızı, təcrübənizi və potensialınızı işəgötürənlərə düzgün şəkildə çatdırır.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">CVERA ilə CV Yaratmaq Üstünlükləri:</h3>
              <ul className="list-disc pl-6 mb-8 text-gray-600 space-y-2">
                <li><strong>AI dəstəyi</strong> - Süni intellekt sizin üçün ən uyğun məzmun təklif edir</li>
                <li><strong>LinkedIn inteqrasiyası</strong> - Mövcud profilinizi avtomatik idxal edin</li>
                <li><strong>Professional şablonlar</strong> - 50+ müxtəlif dizayn seçimi</li>
                <li><strong>ATS uyğunluğu</strong> - Applicant Tracking Systems üçün optimizasiya</li>
                <li><strong>Çoxlu format</strong> - PDF, DOCX və digər formatlar</li>
                <li><strong>Azerbaycan bazarı</strong> - Yerli iş bazarı tələblərinə uyğun</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">CV Yaratmaq Addımları:</h3>
              <ol className="list-decimal pl-6 mb-8 text-gray-600 space-y-3">
                <li><strong>Qeydiyyat:</strong> CVERA platformasında pulsuz hesab yaradın</li>
                <li><strong>Şablon seçimi:</strong> Sahənizə uyğun professional şablon seçin</li>
                <li><strong>Məlumat daxili:</strong> Şəxsi məlumatları və iş təcrübəsini əlavə edin</li>
                <li><strong>AI optimallaşdırma:</strong> Süni intellekt məzmunu təkmilləşdirir</li>
                <li><strong>Nəzərdən keçirmə:</strong> Hazır CV-ni yoxlayın və redaktə edin</li>
                <li><strong>Yükləmə:</strong> Tamamlanmış CV-ni istədiyiniz formatda yükləyin</li>
              </ol>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Hansı Məlumatlar Daxil Edilməlidir?</h3>
              <p className="text-gray-600 mb-4">
                Effektiv <strong>cv yaratmaq</strong> üçün aşağıdakı bölmələri daxil etməyi unutmayın:
              </p>
              <ul className="list-disc pl-6 mb-8 text-gray-600 space-y-2">
                <li>Şəxsi məlumatlar və əlaqə vasitələri</li>
                <li>Professional xülasə və məqsədlər</li>
                <li>İş təcrübəsi və nailiyyətlər</li>
                <li>Təhsil və sertifikatlar</li>
                <li>Bacarıqlar və kompetensiyalar</li>
                <li>Dil bilikləri</li>
                <li>Hobbi və maraqlar (opsional)</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Tez-tez Verilən Suallar</h3>
              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">CVERA pulsuzmu?</h4>
                  <p className="text-gray-600">Bəli! Əsas CV yaratmaq xidmətləri tamamilə pulsuzdur. Premium paketlərdə əlavə şablonlar və xüsusiyyətlər mövcuddur.</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">LinkedIn məlumatlarımı necə idxal edə bilərəm?</h4>
                  <p className="text-gray-600">CV yaratmaq zamanı "LinkedIn-dən İdxal" düyməsini basın və hesabınızla daxil olun. Məlumatlarınız avtomatik doldurulacaq.</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Hazırladığım CV-ni necə yükləyə bilərəm?</h4>
                  <p className="text-gray-600">CV tamamlandıqdan sonra "Yüklə" düyməsi ilə PDF, DOCX və ya digər formatda kompüterinizə yükləyə bilərsiniz.</p>
                </div>
              </div>
            </article>

            {/* CTA Section */}
            <div className="text-center py-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">İndi CV Yaratmağa Başlayın!</h2>
              <p className="text-xl text-gray-600 mb-8">Professional karyeranıza ilk addımı atın</p>
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
              >
                Pulsuz CV Yarat
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}
