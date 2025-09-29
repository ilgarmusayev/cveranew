'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import ElevatorPitchForm from '@/components/elevatorpitch/ElevatorPitchForm';

export default function ElevatorPitchPage() {
  const { siteLanguage } = useSiteLanguage();
  const router = useRouter();
  const [showForm, setShowForm] = useState(true); // Start with form directly

  const content = {
    azerbaijani: {
      title: '30 Saniyəlik Elevator Pitch',
      subtitle: 'Özünüzü 30 saniyədə təqdim edin',
      description: 'CV məlumatlarınıza əsaslanan güclü və qısa təqdimat hazırlayın.',
      startButton: 'Başlayın'
    },
    english: {
      title: '30-Second Elevator Pitch',
      subtitle: 'Present yourself in 30 seconds',
      description: 'Create a powerful and concise presentation based on your CV data.',
      startButton: 'Get Started'
    },
    russian: {
      title: '30-секундная презентация',
      subtitle: 'Представьте себя за 30 секунд',
      description: 'Создайте мощную и краткую презентацию на основе данных вашего CV.',
      startButton: 'Начать'
    }
  };

  const currentContent = content[siteLanguage] || content.azerbaijani;

  return (
    <div className="min-h-screen bg-gray-50">
      <StandardHeader />
      
      <main className="pt-16">
        {showForm ? (
          <ElevatorPitchForm 
            onBack={() => router.push('/dashboard')}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {currentContent.title}
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                {currentContent.subtitle}
              </p>
              <p className="text-gray-500">
                {currentContent.description}
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {currentContent.startButton}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}