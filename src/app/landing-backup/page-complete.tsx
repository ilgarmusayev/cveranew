'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Footer from '@/components/Footer';

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
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Simple background effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-48 w-80 h-80 bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-bl from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/90 backdrop-blur-xl border-b border-blue-200/30 shadow-lg shadow-blue-100/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">CVera</span>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-6">
                <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 hover:scale-105 transform">Xüsusiyyətlər</a>
                <a href="#why-us" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 hover:scale-105 transform">Niyə Biz?</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 hover:scale-105 transform">Necə İşləyir?</a>
              </nav>
              
              <Link href="/auth/login" className="hidden md:block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5">
                Daxil Ol
              </Link>
              
              {/* Mobile menu button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-300">
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
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 py-2">
              Xüsusiyyətlər
            </a>
            <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 py-2">
              Niyə Biz?
            </a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 py-2">
              Necə İşləyir?
            </a>
            <Link href="/auth/login" className="block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-300 mt-4">
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
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight transform transition-all duration-700 hover:scale-105">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                  Professional CV
                </span>
                <br />
                <span className="text-gray-800 transition-colors duration-500 hover:text-gray-700">
                  Hazırlayın
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed transition-all duration-500 hover:text-gray-700 transform hover:scale-105">
                LinkedIn profilinizi avtomatik import edin və professional CV-nizi dəqiqələr içində yaradın
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20" data-aos="fade-up" data-aos-delay="200">
              <Link href="/auth/register" className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-2xl font-semibold text-lg shadow-2xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <span className="relative flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Pulsuz Başlayın</span>
                </span>
                
                <div className="absolute top-0 -inset-full h-full w-1/2 z-[5] block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:animate-pulse group-hover:opacity-100"></div>
              </Link>
              
              <a href="#features" className="group relative bg-white/90 backdrop-blur-xl text-gray-800 px-10 py-5 rounded-2xl font-semibold text-lg shadow-xl shadow-blue-100/30 hover:shadow-2xl hover:shadow-blue-200/40 transform hover:-translate-y-2 transition-all duration-300 border border-blue-200/40 hover:border-blue-300/60 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <span className="relative flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>Daha Ətraflı</span>
                </span>
                
                <div className="absolute top-0 -inset-full h-full w-1/2 z-[5] block transform -skew-x-12 bg-gradient-to-r from-transparent to-blue-100/30 opacity-0 group-hover:animate-pulse group-hover:opacity-100"></div>
              </a>
            </div>
          </div>
        </div>

        {/* Simple Features Section */}
        <div className="container mx-auto px-4 mb-20">
          <div id="features" className="grid md:grid-cols-3 gap-8 scroll-mt-20">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-white/30" data-aos="fade-up">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sürətli Yaradılış</h3>
              <p className="text-gray-600">LinkedIn profilinizi import edib dəqiqələr içində CV hazırlayın</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-white/30" data-aos="fade-up" data-aos-delay="100">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Professional Şablonlar</h3>
              <p className="text-gray-600">Modern və cəlbedici CV şablonları arasından seçim edin</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-white/30" data-aos="fade-up" data-aos-delay="200">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Çoxlu Format</h3>
              <p className="text-gray-600">PDF və DOCX formatlarında CV-nizi ixrac edin</p>
            </div>
          </div>
        </div>
      </main>

      {/* Scroll to top button */}
      <div className="fixed bottom-8 right-8 z-50">
        <a href="#top" className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-2 hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/20" aria-label="Yuxarı qayıt">
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </a>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
