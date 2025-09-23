'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalizedMessages } from '@/utils/errorMessages';

export default function LinkedInCallbackPage() {
  const router = useRouter();
  const { getErrorMessage } = useLocalizedMessages();
  const [status, setStatus] = useState('İnkişaf edir...');

  useEffect(() => {
    const processLinkedInCallback = async () => {
      try {
        setStatus('LinkedIn girişi tamamlanır...');

        // Get token from cookies - daha güclü yoxlama
        const response = await fetch('/api/auth/token', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const data = await response.json();

          if (data.accessToken) {
            // Store token in localStorage
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('loginMethod', 'linkedin');

            // User məlumatlarını da saxla
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
            }

            setStatus('Uğurlu! Dashboard-a yönləndirilirsiz...');

            // LinkedIn login üçün məcburi dashboard yönləndirməsi
            console.log('LinkedIn login uğurlu - dashboard-a yönləndirilir');

            // Daha etibarlı yönləndirmə
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 500);

          } else {
            throw new Error(getErrorMessage('loginError'));
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Token response error:', errorData);
          throw new Error('Token yoxlanması uğursuz: ' + (errorData.error || 'Naməlum xəta'));
        }
      } catch (error) {
        console.error('LinkedIn callback error:', error);
        setStatus('Xəta baş verdi. Yenidən cəhd edin.');
        setTimeout(() => {
          router.replace('/auth/login?error=linkedin_callback_failed');
        }, 2000);
      }
    };

    // Callback prosesini başlat
    processLinkedInCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">LinkedIn Girişi</h2>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
