'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import DashboardV2 from '@/components/dashboard/DashboardV2';

export default function DashboardPage() {
  const { user, loading, isInitialized } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log('🎛️ Dashboard useEffect triggered:', {
      user: !!user,
      userEmail: user?.email,
      loading,
      isInitialized,
      isRedirecting
    });

    // FIXED: More strict conditions to prevent redirect loops
    if (isInitialized && !loading) {
      if (!user && !isRedirecting) {
        console.log('🔄 No user found, redirecting to login...');
        setIsRedirecting(true);
        setTimeout(() => {
          router.replace('/auth/login');
        }, 100); // Small delay to prevent race conditions
      } else if (user) {
        // IMPORTANT: Clear redirecting flag when user is found
        if (isRedirecting) {
          console.log('🛑 Clearing redirect flag, user found');
          setIsRedirecting(false);
        }
        console.log('✅ User authenticated in dashboard:', user.email);
      }
    }
  }, [user, loading, isInitialized, router, isRedirecting]);

  // Show dashboard immediately when user exists - no loading screens
  if (user && isInitialized) {
    console.log('🎯 Rendering dashboard for user:', user.email);

    const handleEditCV = (cvId: string) => {
      router.push(`/cv/edit/${cvId}`);
    };

    return (
      <DashboardV2
        user={user}
        onEditCV={handleEditCV}
      />
    );
  }

  // Only show null while auth is initializing or redirecting
  console.log('⏳ Dashboard waiting...', { user: !!user, loading, isInitialized, isRedirecting });
  return null;
}
