'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/sistem/login');
          return;
        }

        // Düzgün API endpoint istifadə edirik
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          localStorage.removeItem('adminToken');
          router.push('/sistem/login');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setAdmin(data.user || {
            id: 'admin',
            name: 'Administrator',
            email: 'admin@cvera.com',
            role: 'SUPER_ADMIN'
          });
        } else {
          localStorage.removeItem('adminToken');
          router.push('/sistem/login');
        }
      } catch (error) {
        console.error('Admin verification error:', error);
        localStorage.removeItem('adminToken');
        router.push('/sistem/login');
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/system/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      router.push('/sistem/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58b4e4]"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/sistem" className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                <img src="/cveralogo.png" alt="CVERA Logo" className="w-8 h-8" />
                <span>CVERA İdarə Paneli</span>
              </Link>
              <div className="ml-6 flex space-x-4">
                <Link
                  href="/sistem"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/sistem/users"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  İstifadəçilər
                </Link>
                <Link
                  href="/sistem/subscriptions"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Abunəliklər
                </Link>
                <Link
                  href="/sistem/api-keys"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700"
                >
                  API Keys
                </Link>
                <Link
                  href="/sistem/analytics"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Analitika
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {admin.name} ({admin.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Çıxış
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
