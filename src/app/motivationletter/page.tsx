'use client';

import React, { useState, useEffect } from 'react';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import MotivationLetterForm from '@/components/motivationletter/MotivationLetterForm';

export default function MotivationLetterPage() {
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUserProfile(userData.user);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <StandardHeader />
      
      <div className="pt-20">
        <MotivationLetterForm 
          userProfile={userProfile}
          onBack={() => window.history.back()}
        />
      </div>

      <Footer />
    </div>
  );
}