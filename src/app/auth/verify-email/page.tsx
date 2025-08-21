'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Təsdiqləmə tokeni tapılmadı. Linkini yoxlayın.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyVerified) {
          setStatus('already_verified');
        } else {
          setStatus('success');
        }
        setMessage(data.message);
        setUserInfo(data.user);

        // Redirect to login after 3 seconds if successful
        if (!data.alreadyVerified) {
          setTimeout(() => {
            router.push('/auth/login?verified=true');
          }, 3000);
        }
      } else {
        setStatus('error');
        setMessage(data.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage('E-poçt təsdiqi zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">E-poçt Təsdiqlənir...</h2>
            <p className="text-gray-600">Zəhmət olmasa gözləyin...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">E-poçt Uğurla Təsdiqləndi!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            {userInfo && (
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <p className="text-green-800">
                  <strong>Salam {userInfo.name}!</strong><br />
                  {userInfo.email} ünvanı təsdiqləndi.
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-6">
              3 saniyə sonra giriş səhifəsinə yönləndiriləcəksiniz...
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              İndi Giriş Et
            </Link>
          </div>
        );

      case 'already_verified':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Hesab Artıq Təsdiqlənib</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            {userInfo && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-blue-800">
                  <strong>{userInfo.name}</strong><br />
                  {userInfo.email} ünvanı artıq təsdiqlənib.
                </p>
              </div>
            )}
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Hesaba Daxil Ol
            </Link>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Təsdiqləmə Uğursuz</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/auth/forgot-password"
                className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Yeni Təsdiqləmə E-poçtu Tələb Et
              </Link>
              <Link
                href="/auth/register"
                className="block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Yenidən Qeydiyyatdan Keç
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header showAuthButtons={false} currentPage="login" />

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg"
        >
          <div className="text-center">
            <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
              CVera
            </Link>
            <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
                E-poçt Təsdiqi
            </h1>
            <p className="mt-2 text-sm text-gray-600">
                E-poçt ünvanınız təsdiqlənir
            </p>
          </div>

          {renderContent()}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
