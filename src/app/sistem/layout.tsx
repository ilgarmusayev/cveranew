'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAdminStatus = useCallback(async () => {
    // If we're on the login page, skip verification
    if (pathname === '/sistem/login') {
      setLoading(false);
      setIsAdmin(true); // Allow access to login page
      return;
    }

    try {
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        setIsAdmin(false);
        router.push('/sistem/login');
        return;
      }

      const response = await fetch('/api/admin/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        // Clear invalid token
        localStorage.removeItem('adminToken');
        router.push('/sistem/login');
      }
    } catch (error) {
      console.error('Admin verification failed:', error);
      setIsAdmin(false);
      localStorage.removeItem('adminToken');
      router.push('/sistem/login');
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If on login page, render it without admin check
  if (pathname === '/sistem/login') {
    return <>{children}</>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Giriş rədd edildi</h1>
          <p className="text-gray-600 mb-4">Bu səhifəyə giriş üçün admin icazəniz yoxdur</p>
          <Link href="/sistem/login" className="text-blue-600 hover:underline mr-4">
            Admin girişi
          </Link>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Dashboard-a qayıt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">🛡️ Admin Panel</h1>
            </div>
            <nav className="flex space-x-6">
              <Link 
                href="/sistem"
                className="hover:text-red-200 transition-colors"
              >
                Ana səhifə
              </Link>
              <Link 
                href="/sistem/users"
                className="hover:text-red-200 transition-colors"
              >
                İstifadəçilər
              </Link>
              <Link 
                href="/sistem/subscriptions"
                className="hover:text-red-200 transition-colors"
              >
                Abunəliklər
              </Link>
              <Link 
                href="/sistem/analytics"
                className="hover:text-red-200 transition-colors"
              >
                Analitika
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  router.push('/sistem/login');
                }}
                className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded transition-colors"
              >
                Çıxış
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
