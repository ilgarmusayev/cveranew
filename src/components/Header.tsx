'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
  showAuthButtons?: boolean;
  currentPage?: 'home' | 'login' | 'register';
}

export default function Header({ showAuthButtons = true, currentPage }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 sticky top-0 z-40 shadow-lg">
      {/* Enhanced responsive container with better edge spacing */}
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex justify-between items-center h-16 sm:h-18 md:h-20">
          {/* Logo - Simplified approach for guaranteed display */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <img
                src="/cveralogo-2.png"
                alt="CVERA Logo"
                className="h-10 w-auto object-contain"
                style={{ maxWidth: '140px', height: 'auto' }}

              />
              <span
                className="text-2xl font-bold text-white ml-2"
                style={{ display: 'none' }}
              >
                CVERA
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4 xl:space-x-6 flex-shrink-0">
            {user ? (
              // Authenticated user buttons
              <>
                <Link
                  href="/dashboard"
                  className="text-white hover:text-blue-200 transition-colors duration-200 px-3 lg:px-4 py-2 text-sm lg:text-base font-medium"
                >
                  İdarəetmə Paneli
                </Link>
                <span className="text-blue-100 text-sm">
                  Xoş gəlmisiniz, {user.name}
                </span>
                <button
                    onClick={() => {
                      console.log('🔴 LOGOUT BUTTON CLICKED - TEST');
                      handleLogout();
                    }}
                    className="px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Çıxış
                </button>

              </>
            ) : (
              // Guest user buttons
              showAuthButtons && (
                <>
                  {currentPage !== 'login' && (
                    <Link
                      href="/auth/login"
                      className="text-white hover:text-blue-900 hover:bg-white rounded-lg transition-colors duration-200 px-3 lg:px-4 py-2 text-sm lg:text-base font-medium"
                    >
                      Giriş
                    </Link>
                  )}
                  {currentPage !== 'register' && (
                    <Link
                      href="/auth/register"
                      className="bg-white text-blue-600 hover:bg-blue-500 hover:text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg font-semibold transition-colors duration-200 text-sm lg:text-base"
                    >
                      Qeydiyyat
                    </Link>
                  )}
                </>
              )
            )}
          </div>

          {/* Mobile menu button - Better sizing */}
          <div className="md:hidden flex-shrink-0">
            <button
              onClick={toggleMobileMenu}
              className="text-white hover:text-blue-200 p-2"
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Improved */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-500 w-full">
            <div className="flex flex-col space-y-3">
              {user ? (
                // Authenticated user mobile menu
                <div className="space-y-3">
                  <div className="px-4 py-2 text-blue-100 text-sm">
                    Xoş gəlmisiniz, {user.name}
                  </div>
                  <Link
                    href="/dashboard"
                    className="block bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-3 rounded-lg transition-colors duration-200 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg  transition-colors duration-200 text-center"
                  >
                    Çıxış
                  </button>
                </div>
              ) : (
                // Guest user mobile menu
                showAuthButtons && (
                  <div className="space-y-3">
                    {currentPage !== 'login' && (
                      <Link
                        href="/auth/login"
                        className="block bg-blue-500 hover:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Giriş
                      </Link>
                    )}
                    {currentPage !== 'register' && (
                      <Link
                        href="/auth/register"
                        className="block bg-white text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg font-semibold transition-colors duration-200 text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Qeydiyyat
                      </Link>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
