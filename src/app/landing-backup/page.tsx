'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    AOS.init({
      duration: 800,
      offset: 100,
      easing: 'ease-out-cubic',
      once: true,
      anchorPlacement: 'top-bottom'
    });
  }, []);

  return (
    <div id="top" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden" style={{scrollBehavior: 'smooth'}}>
      {/* Ultra Creative Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Animated Floating Spheres */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/40 to-indigo-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-48 w-80 h-80 bg-gradient-to-tr from-purple-300/30 to-pink-300/25 rounded-full blur-3xl animate-bounce" style={{animationDuration: '6s'}}></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-bl from-emerald-300/30 to-teal-300/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-gradient-to-tr from-amber-300/25 to-orange-300/20 rounded-full blur-3xl animate-bounce" style={{animationDuration: '8s', animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/3 -right-32 w-88 h-88 bg-gradient-to-bl from-rose-300/30 to-pink-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-lg rotate-45 animate-spin" style={{animationDuration: '20s'}}></div>
        <div className="absolute top-60 right-20 w-12 h-12 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-40 left-40 w-20 h-20 bg-gradient-to-r from-green-400/20 to-emerald-400/20 transform rotate-12 animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Flowing Wave Pattern */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-r from-blue-100/30 via-purple-100/20 to-pink-100/30 opacity-60" style={{clipPath: 'polygon(0 20px, 100% 0, 100% 100%, 0 100%)'}}>
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
        </div>
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'float 20s ease-in-out infinite'
          }}></div>
        </div>
        
        {/* Floating CV Icons */}
        <div className="absolute top-32 right-1/3 text-4xl opacity-10 animate-bounce" style={{animationDuration: '3s', animationDelay: '2s'}}>📄</div>
        <div className="absolute bottom-32 left-1/4 text-3xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}>💼</div>
        <div className="absolute top-2/3 left-1/6 text-5xl opacity-10 animate-bounce" style={{animationDuration: '4s', animationDelay: '3s'}}>🚀</div>
        <div className="absolute top-1/2 right-1/5 text-3xl opacity-10 animate-ping" style={{animationDelay: '2s'}}>✨</div>
        
        {/* Particle Effect */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
          <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '4s'}}></div>
          <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{animationDelay: '5s'}}></div>
        </div>
      </div>
      
      {/* CSS Keyframes for custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes gentle-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <header className="relative z-10 bg-white/90 backdrop-blur-xl border-b border-blue-200/30 shadow-lg shadow-blue-100/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img src="/cveralogo.png" alt="CVERA Logo" className="h-40 w-auto" />
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-6">
                <a href="#features" className="text-gray-600 font-medium">
                  Xüsusiyyətlər
                </a>
                <a href="#why-us" className="text-gray-600 font-medium">
                  Niyə Biz?
                </a>
                <a href="#how-it-works" className="text-gray-600 font-medium">
                  Necə İşləyir?
                </a>
                <a href="#common-mistakes" className="text-gray-600 font-medium">
                  CV Səhvləri
                </a>
              </nav>
              
              <Link href="/auth/login" className="hidden md:block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30">
                Daxil Ol
              </Link>
              
              {/* Mobile menu button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-blue-200/30 shadow-lg">
          <nav className="px-4 py-6 space-y-4">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 font-medium py-2">
              Xüsusiyyətlər
            </a>
            <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 font-medium py-2">
              Niyə Biz?
            </a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 font-medium py-2">
              Necə İşləyir?
            </a>
            <a href="#common-mistakes" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 font-medium py-2">
              CV Səhvləri
            </a>
            <Link href="/auth/login" className="block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg mt-4">
              Daxil Ol
            </Link>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-16" data-aos="fade-up" data-aos-duration="1000">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Professional CV
                </span>
                <br />
                <span className="text-gray-800">
                  Hazırlayın
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
                LinkedIn profilinizi avtomatik import edin və professional CV-nizi dəqiqələr içində yaradın
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20" data-aos="fade-up" data-aos-delay="200">
              <Link href="/auth/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-2xl font-semibold text-lg shadow-2xl shadow-blue-500/30">
                <span className="flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Pulsuz Başlayın</span>
                </span>
              </Link>
              
              <a href="#features" className="bg-white/90 backdrop-blur-xl text-gray-800 px-10 py-5 rounded-2xl font-semibold text-lg shadow-xl shadow-blue-100/30 border border-blue-200/40">
                <span className="flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>Daha Ətraflı</span>
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 mb-20">
          <div id="features" className="scroll-mt-20">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  CVERA Xüsusiyyətləri
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Professional CV yaratmaq üçün ehtiyacınız olan bütün alətlər bir yerdə
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/30" data-aos="fade-up">
                <div className="text-5xl mb-6 text-center">🚀</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Sürətli Yaradılış</h3>
                <p className="text-gray-600 text-center mb-4">LinkedIn profilinizi import edib dəqiqələr içində CV hazırlayın</p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Avtomatik məlumat çəkməsi
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    1-dəqiqəlik qeydiyyat
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Real vaxt önizləmə
                  </li>
                </ul>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/30" data-aos="fade-up" data-aos-delay="100">
                <div className="text-5xl mb-6 text-center">🎨</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Professional Şablonlar</h3>
                <p className="text-gray-600 text-center mb-4">Modern və cəlbedici CV şablonları arasından seçim edin</p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    10+ unikal dizayn
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    ATS uyğun formatlar
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Sektor xüsusi dizaynlar
                  </li>
                </ul>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/30" data-aos="fade-up" data-aos-delay="200">
                <div className="text-5xl mb-6 text-center">📄</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Çoxlu Format</h3>
                <p className="text-gray-600 text-center mb-4">PDF və DOCX formatlarında CV-nizi ixrac edin</p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Yüksək keyfiyyət PDF
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Redaktə oluna bilən DOCX
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Ani yükləmə
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="container mx-auto px-4 mb-20">
          <div id="why-us" className="scroll-mt-20">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Niyə CVERA Seçməlisiniz?
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Minlərlə istifadəçi artıq CVERA ilə dream job-larını tapdılar
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center" data-aos="slide-up" data-aos-delay="100">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">LinkedIn İnteqrasiyası</h3>
                <p className="text-gray-600">Profilinizi bir kliklə import edin</p>
              </div>

              <div className="text-center" data-aos="slide-up" data-aos-delay="200">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ATS Uyğun</h3>
                <p className="text-gray-600">Avtomatik sistəmlər tərəfindən oxuna bilir</p>
              </div>

              <div className="text-center" data-aos="slide-up" data-aos-delay="300">
                <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">İstifadəçi Dostu</h3>
                <p className="text-gray-600">Sadə və intuitiv interfeys</p>
              </div>

              <div className="text-center" data-aos="slide-up" data-aos-delay="400">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sərfəli Qiymət</h3>
                <p className="text-gray-600">Ən yaxşı qiymət/keyfiyyət nisbəti</p>
              </div>
            </div>

            
          </div>
        </div>

        {/* How It Works Section */}
        <div className="container mx-auto px-4 mb-20">
          <div id="how-it-works" className="scroll-mt-20">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Necə İşləyir?
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                3 addımda professional CV-nizi hazırlayın
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center relative" data-aos="slide-up" data-aos-delay="100">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Qeydiyyatdan Keçin</h3>
                <p className="text-gray-600 mb-4">
                  Email və şifrə ilə qeydiyyatdan keçin və ya LinkedIn hesabınızla daxil olun
                </p>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/40">
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Tez qeydiyyat
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Təhlükəsiz giriş
                    </div>
                  </div>
                </div>
                {/* Arrow to next step */}
                <div className="hidden md:block absolute top-10 -right-4 text-gray-300 z-0">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>

              <div className="text-center relative" data-aos="slide-up" data-aos-delay="200">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">LinkedIn Import</h3>
                <p className="text-gray-600 mb-4">
                  LinkedIn profilinizi avtomatik olaraq import edin və məlumatlarınızı tamamlayın
                </p>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-purple-200/40">
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Avtomatik məlumat çəkmə
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Düzəliş imkanı
                    </div>
                  </div>
                </div>
                {/* Arrow to next step */}
                <div className="hidden md:block absolute top-10 -right-4 text-gray-300 z-0">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>

              <div className="text-center" data-aos="slide-up" data-aos-delay="300">
                <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">CV-ni Ixrac Edin</h3>
                <p className="text-gray-600 mb-4">
                  Şablon seçin və professional CV-nizi PDF və ya DOCX formatında yükləyin
                </p>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-green-200/40">
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Çoxlu şablon seçimi
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Ani yükləmə
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Mistakes Section */}
        <div className="container mx-auto px-4 mb-20">
          <div id="common-mistakes" className="scroll-mt-20">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Ən Çox Edilən CV Səhvlər
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Bu səhvləri aradan qaldıraraq CV-nizin effektivliyini artırın
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 rounded-2xl p-6" data-aos="slide-left" data-aos-delay="100">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-red-800 mb-2">Uzun və Qarışıq CV</h3>
                    <p className="text-red-700 text-sm">
                      3 səhifədən artıq CV yazmaq. İş verənlər uzun CV-ləri oxumağa vaxt ayırmırlar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50/80 backdrop-blur-sm border-l-4 border-green-500 rounded-2xl p-6" data-aos="slide-right" data-aos-delay="100">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-green-800 mb-2">CVERA Həlli</h3>
                    <p className="text-green-700 text-sm">
                      Şablonlarımız 1-2 səhifəlik optimal uzunluq təmin edir və yalnız vacib məlumatları vurğulayır.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 rounded-2xl p-6" data-aos="slide-left" data-aos-delay="200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-red-800 mb-2">Standart Dizayn</h3>
                    <p className="text-red-700 text-sm">
                      Köhnə və standart CV şablonları istifadə etmək. Bu, CV-nizin diqqət çəkməməsinə səbəb olur.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50/80 backdrop-blur-sm border-l-4 border-green-500 rounded-2xl p-6" data-aos="slide-right" data-aos-delay="200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-green-800 mb-2">CVERA Həlli</h3>
                    <p className="text-green-700 text-sm">
                      Modern və ATS-uyğun şablonlarımız sizi digərlərindən fərqləndirir və professional görünüş təmin edir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 rounded-2xl p-6" data-aos="slide-left" data-aos-delay="300">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-red-800 mb-2">Məlumat Uçmazlığı</h3>
                    <p className="text-red-700 text-sm">
                      İş tarixçəsində boşluqlar, kontakt məlumatlarının olmaması və ya düzgün olmayan formatlaşdırma.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50/80 backdrop-blur-sm border-l-4 border-green-500 rounded-2xl p-6" data-aos="slide-right" data-aos-delay="300">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-green-800 mb-2">CVERA Həlli</h3>
                    <p className="text-green-700 text-sm">
                      LinkedIn importu ilə bütün məlumatlarınız avtomatik doldurulur və heç bir vacib detal qaçmır.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="container mx-auto px-4 mb-20">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center text-white relative overflow-hidden" data-aos="zoom-in">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700/50 to-indigo-700/50"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Professional CV-nizi Hazırlamağa Başlayın!
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Minlərlə insanın seçdiyi CVERA ilə siz də dream job-unuzu tapın. 
                LinkedIn import etməkdən tutmuş professional export-a qədər hər şey daxil!
              </p>
              <Link href="/auth/register" className="inline-flex items-center space-x-3 bg-white text-blue-600 px-10 py-4 rounded-2xl font-semibold text-lg shadow-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>İndi Başlayın - Pulsuzdur!</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white/90 backdrop-blur-xl border-t border-blue-200/30 mt-20 shadow-lg shadow-blue-100/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo and description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/cveralogo.svg" alt="CVERA Logo" className="w-8 h-8" />
              </div>
              <p className="text-gray-600 mb-4 font-medium max-w-md">
                Professional CV Platform - LinkedIn integration ilə dəqiqələr içində peşəkar CV hazırlayın.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sürətli Keçidlər</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-600">Xüsusiyyətlər</a></li>
                <li><a href="#why-us" className="text-gray-600">Niyə Biz?</a></li>
                <li><a href="#how-it-works" className="text-gray-600">Necə İşləyir?</a></li>
                <li><Link href="/auth/register" className="text-gray-600">Qeydiyyat</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dəstək</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@cvera.az" className="text-gray-600">Email Dəstəyi</a></li>
                <li><a href="#" className="text-gray-600">FAQ</a></li>
                <li><a href="#" className="text-gray-600">Məxfilik Siyasəti</a></li>
                <li><a href="#" className="text-gray-600">İstifadə Şərtləri</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-500">© 2025 CVERA. Bütün hüquqlar qorunur.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
