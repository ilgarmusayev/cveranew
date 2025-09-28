'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DocumentTextIcon, AcademicCapIcon, BriefcaseIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import MotivationLetterForm from '@/components/motivationletter/MotivationLetterForm';

export default function MotivationLetterPage() {
  const { siteLanguage } = useSiteLanguage();
  const [showForm, setShowForm] = useState(true);
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

  const content = {
    azerbaijani: {
      title: 'Motivasiya Məktubu',
      subtitle: 'Peşəkar motivasiya məktubunuzu yaradın',
      description: 'Universitetlərə müraciət, təqaüd proqramları və ya akademik imkanlar üçün güclü motivasiya məktubu hazırlayın.',
      features: [
        {
          icon: AcademicCapIcon,
          title: 'Akademik Müraciətlər',
          description: 'Universitetlər və təhsil proqramları üçün'
        },
        {
          icon: BriefcaseIcon,
          title: 'Təqaüd Proqramları',
          description: 'Beynəlxalq təqaüdlər və fond müraciətləri'
        },
        {
          icon: HeartIcon,
          title: 'Könüllü Fəaliyyət',
          description: 'QHT-lər və könüllü proqramlar üçün'
        },
        {
          icon: DocumentTextIcon,
          title: 'Peşəkar Formatlar',
          description: 'Standart və uniklik göstərən dizaynlar'
        }
      ],
      getStarted: 'Başlayaq',
      benefits: {
        title: 'Niyə Bizim Platformamızı Seçməlisiniz?',
        items: [
          'AI köməyi ilə peşəkar mətn yaratma',
          'Müxtəlif məqsədlər üçün şablonlar',
          'Real-time önizləmə və redaktə',
          'PDF formatında yüksək keyfiyyətli çıxarış',
          'Şəxsi məlumatların təhlükəsizliyi'
        ]
      }
    },
    english: {
      title: 'Motivation Letter',
      subtitle: 'Create your professional motivation letter',
      description: 'Prepare a powerful motivation letter for university applications, scholarship programs, or academic opportunities.',
      features: [
        {
          icon: AcademicCapIcon,
          title: 'Academic Applications',
          description: 'For universities and educational programs'
        },
        {
          icon: BriefcaseIcon,
          title: 'Scholarship Programs',
          description: 'International scholarships and fund applications'
        },
        {
          icon: HeartIcon,
          title: 'Volunteer Work',
          description: 'For NGOs and volunteer programs'
        },
        {
          icon: DocumentTextIcon,
          title: 'Professional Formats',
          description: 'Standard and uniqueness-showing designs'
        }
      ],
      getStarted: 'Get Started',
      benefits: {
        title: 'Why Choose Our Platform?',
        items: [
          'Professional text creation with AI assistance',
          'Templates for various purposes',
          'Real-time preview and editing',
          'High-quality PDF output',
          'Personal data security'
        ]
      }
    },
    russian: {
      title: 'Мотивационное письмо',
      subtitle: 'Создайте профессиональное мотивационное письмо',
      description: 'Подготовьте сильное мотивационное письмо для поступления в университеты, программы стипендий или академических возможностей.',
      features: [
        {
          icon: AcademicCapIcon,
          title: 'Академические заявки',
          description: 'Для университетов и образовательных программ'
        },
        {
          icon: BriefcaseIcon,
          title: 'Стипендиальные программы',
          description: 'Международные стипендии и заявки в фонды'
        },
        {
          icon: HeartIcon,
          title: 'Волонтерская деятельность',
          description: 'Для НПО и волонтерских программ'
        },
        {
          icon: DocumentTextIcon,
          title: 'Профессиональные форматы',
          description: 'Стандартные и уникальные дизайны'
        }
      ],
      getStarted: 'Начать',
      benefits: {
        title: 'Почему стоит выбрать нашу платформу?',
        items: [
          'Профессиональное создание текста с помощью ИИ',
          'Шаблоны для различных целей',
          'Предварительный просмотр и редактирование в реальном времени',
          'Высококачественный вывод в PDF',
          'Безопасность персональных данных'
        ]
      }
    }
  };

  const currentContent = content[siteLanguage] || content.azerbaijani;

  return (
    <div className="min-h-screen bg-gray-50">
      <StandardHeader />
      
      {!showForm ? (
        <main className="pt-20">
          {/* Hero Section - Blue background with white text */}
          <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                    {currentContent.title}
                  </h1>
                  <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
                    {currentContent.subtitle}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowForm(true)}
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    {currentContent.getStarted}
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {currentContent.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {currentContent.benefits.title}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentContent.benefits.items.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start"
                  >
                    <div className="flex-shrink-0 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </main>
      ) : (
        <div className="pt-20">
          <MotivationLetterForm 
            userProfile={userProfile}
            onBack={() => setShowForm(false)}
          />
        </div>
      )}

      <Footer />
    </div>
  );
}