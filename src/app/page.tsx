'use client'

import {useEffect} from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import {motion} from 'framer-motion'
import Link from 'next/link'
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { generateStructuredData, organizationData, websiteData, serviceData, faqData } from '@/lib/structured-data'
import { useSiteLanguage } from '@/contexts/SiteLanguageContext'


export default function Index2() {
  const { siteLanguage } = useSiteLanguage();
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      easing: 'ease-out-cubic',
      mirror: true,
      anchorPlacement: 'top-bottom',
      offset: 120,
    })

    // Add structured data to document head
    const addStructuredData = (data: any, type: string) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.innerHTML = generateStructuredData({ type: type as any, data });
      script.id = `structured-data-${type.toLowerCase()}`;

      // Remove existing script if it exists
      const existing = document.getElementById(script.id);
      if (existing) {
        existing.remove();
      }

      document.head.appendChild(script);
    };

    // Add all structured data
    addStructuredData(organizationData, 'Organization');
    addStructuredData(websiteData, 'WebSite');
    addStructuredData(serviceData, 'Service');
    addStructuredData(faqData, 'FAQPage');

    // Cleanup function to remove structured data when component unmounts
    return () => {
      ['organization', 'website', 'service', 'faqpage'].forEach(type => {
        const script = document.getElementById(`structured-data-${type}`);
        if (script) script.remove();
      });
    };
  }, [])

  // Site language mətnləri
  const content = {
    azerbaijani: {
      // Hero section
      title: 'Peşəkar CV-nizi',
      subtitle: 'Süni intellektlə sürətli və fərdi CV hazırlayaraq karyeranızı zirvəyə daşıyın!',
      createCVButton: 'İndi CV yaradın',
      heroBadge: 'AI ƏSASLI PEŞƏKAR CV YARATMA PLATFORMASI',
      heroAction: 'CVERA ilə yaradın!',
      
      // Features
      featuresTitle: 'Niyə CVERA?',
      linkedinImport: 'LinkedIn İdxal',
      linkedinDesc: 'LinkedIn profilinizi bir kliklə idxal edin',
      professionalTemplates: 'Peşəkar Şablonlar',
      templatesDesc: '15+ müasir və professional CV şablonu',
      quickDownload: 'Sürətli Yükləmə',
      downloadDesc: 'PDF formatında yüksək keyfiyyətlə yükləyin',
      
      // Steps
      stepsTitle: 'CVERA ilə 3 addımda peşəkar CV yaradın:',
      step1: 'Məlumatlarınızı daxil edin',
      step1Desc: 'LinkedIn idxal edin və ya əl ilə yazın',
      step2: 'Şablon seçin',
      step2Desc: 'Ən çox bəyənilən dizaynlardan birini seçin',
      step3: 'CV-ni yükləyin',
      step3Desc: 'PDF formatında peşəkar CV-nizi alın',
      
      // CTA
      ctaTitle: 'Peşəkar CV-nizə bu gün başlayın!',
      ctaButton: 'Pulsuz CV Yaradın',
      templatesButton: 'Şablonlar',
      trustIndicator1: '100-lərlə məmnun müştəri',
      trustIndicator2: 'Təhlükəsiz və qorunan',
      trustIndicator3: '2 milyondan çox yaradılmış CV',
      
      // Features section
      featuresMainTitle: 'Sehrli Toxunuşlar',
      featuresMainSubtitle: 'Müasir texnologiyalar və süni intellektin gücü ilə karyeranızda ən yaxşı nəticələri əldə edin.',
      
      // Interface section
      interfaceTitle: 'Bizi Fərqləndirən Xüsusiyyətlər',
      interfaceSubtitle: 'Beynəlxalq standartlara uyğun CV yaratma platforması',
      
      // Features details
      aiTitle: 'Süni İntellekt Dəstəyi',
      aiDescription: 'Milyonlarla uğurlu CV-nin məlumatları ilə təkmilləşən süni intellekt, CV-nizi fərdi və ən optimal formada hazırlayır.',
      premiumTitle: 'Premium Şablon Kolleksiyası',
      premiumDescription: 'HR mütəxəssisləri və peşəkar dizaynerlər tərəfindən hazırlanmış, göz oxşayan və funksional şablonlar işə qəbul prosesində sizə üstünlük qazandırır.',
      linkedinTitle: 'LinkedIn-dən İdxal Sistemi',
      linkedinDescription: 'LinkedIn profil məlumatlarınız avtomatik əlavə edilərək CV-niz sürətlə hazırlanır.',
      
      // Features section cards
      feature1Title: 'Süni İntellekt',
      feature1Description: 'Daim inkişaf edən Sİ funksiyaları ilə daha ağıllı və fərdiləşdirilmiş təcrübə əldə edin.',
      feature2Title: 'Göz Oxşayan İnterfeys',
      feature2Description: 'Müasir dizayn prinsipləri əsasında hazırlanmış interfeys, rahat istifadə təcrübəsi təqdim edir.',
      feature3Title: 'Hiss Olunan Sürət',
      feature3Description: 'Cloud texnologiyası ilə saniyələr ərzində PDF formatında peşəkar CV əldə edin.',
      
      // Steps section
      howItWorksTitle: 'Necə İşləyir?',
      registrationTitle: 'Qeydiyyat',
      registrationDescription: 'E-poçt və ya LinkedIn hesabınızla qeydiyyatdan keçin',
      linkedinImportTitle: 'LinkedIn Profil İdxalı',
      linkedinImportDescription: 'LinkedIn profil linkinizi daxil edin və məlumatlarınızı cvnizə əlavə edin.',
      downloadTitle: 'CV-ni Yükləyin',
      downloadDescription: 'Şablon seçin və peşəkar CV-nizi PDF formatında yükləyin.',
      
      // Stats section
      thisYearCVs: 'Bu il yaradılmış CV-lər',
      successfulHiring: 'Uğurlu işə qəbul',
      liveSupportService: 'Canlı Dəstək Xidməti',
      templateSelection: 'Şablon seçimi',
    },
    english: {
      // Hero section
      title: 'Boost Your Career',
      subtitle: 'Create a fast, personalized AI CV and take your career to the top!',
      createCVButton: 'Create CV Now',
      heroBadge: 'AI-POWERED PROFESSIONAL CV CREATION PLATFORM',
      heroAction: 'with CVERA CVs!',
      
      // Features
      featuresTitle: 'Why CVERA?',
      linkedinImport: 'LinkedIn Import',
      linkedinDesc: 'Import your LinkedIn profile with one click',
      professionalTemplates: 'Professional Templates',
      templatesDesc: '15+ modern and professional CV templates',
      quickDownload: 'Quick Download',
      downloadDesc: 'Download in high quality PDF format',
      
      // Steps
      stepsTitle: 'Create professional CV with CVERA in 3 steps:',
      step1: 'Enter your information',
      step1Desc: 'Import from LinkedIn or write manually',
      step2: 'Choose template',
      step2Desc: 'Select one of the most liked designs',
      step3: 'Download CV',
      step3Desc: 'Get your professional CV in PDF format',
      
      // CTA
      ctaTitle: 'Start your professional CV today!',
      ctaButton: 'Create Free CV',
      templatesButton: 'Templates',
      trustIndicator1: 'Hundreds of satisfied customers',
      trustIndicator2: 'Safe and secure',
      trustIndicator3: 'Over 2 million CVs created',
      
      // Features section
      featuresMainTitle: 'Magic Touches',
      featuresMainSubtitle: 'Get the best results in your career with modern technologies and the power of artificial intelligence.',
      
      // Interface section
      interfaceTitle: 'Features That Set Us Apart',
      interfaceSubtitle: 'CV creation platform according to international standards',
      
      // Features details
      aiTitle: 'Artificial Intelligence Support',
      aiDescription: 'Artificial intelligence, improved with data from millions of successful CVs, prepares your CV in a personalized and optimal way.',
      premiumTitle: 'Premium Template Collection',
      premiumDescription: 'Eye-catching and functional templates prepared by HR specialists and professional designers give you an advantage in the recruitment process.',
      linkedinTitle: 'LinkedIn Import System',
      linkedinDescription: 'Your LinkedIn profile information is automatically added and your CV is prepared quickly.',
      
      // Features section cards
      feature1Title: 'Artificial Intelligence',
      feature1Description: 'Get a smarter and more personalized experience with constantly evolving AI functions.',
      feature2Title: 'Eye-catching Interface',
      feature2Description: 'Interface based on modern design principles provides a comfortable user experience.',
      feature3Title: 'Felt Speed',
      feature3Description: 'Get a professional CV in PDF format in seconds with cloud technology.',
      
      // Steps section
      howItWorksTitle: 'How Does It Work?',
      registrationTitle: 'Registration',
      registrationDescription: 'Register with your email or LinkedIn account',
      linkedinImportTitle: 'LinkedIn Profile Import',
      linkedinImportDescription: 'Enter your LinkedIn profile link and add your information to your CV.',
      downloadTitle: 'Download CV',
      downloadDescription: 'Choose a template and download your professional CV in PDF format.',
      
      // Stats section
      thisYearCVs: 'CVs created this year',
      successfulHiring: 'Successful hiring',
      liveSupportService: 'Live Support Service',
      templateSelection: 'Template selection',
    },
    russian: {
      // Hero section
      title: 'Карьерный старт',
      subtitle: 'Импортируйте данные из профиля LinkedIn напрямую или начните с нуля. Полностью бесплатно!',
      createCVButton: 'Создать резюме сейчас',
      heroBadge: 'ПЛАТФОРМА СОЗДАНИЯ ПРОФЕССИОНАЛЬНЫХ РЕЗЮМЕ НА ОСНОВЕ ИИ',
      heroAction: 'с резюме от CVERA!',
      
      // Features
      featuresTitle: 'Почему CVERA?',
      linkedinImport: 'Импорт LinkedIn',
      linkedinDesc: 'Импортируйте ваш профиль LinkedIn одним кликом',
      professionalTemplates: 'Профессиональные шаблоны',
      templatesDesc: '15+ современных и профессиональных шаблонов резюме',
      quickDownload: 'Быстрая загрузка',
      downloadDesc: 'Скачивайте в высоком качестве PDF формата',
      
      // Steps
      stepsTitle: 'Создайте профессиональное резюме с CVERA в 3 шага:',
      step1: 'Введите вашу информацию',
      step1Desc: 'Импортируйте из LinkedIn или напишите вручную',
      step2: 'Выберите шаблон',
      step2Desc: 'Выберите один из самых популярных дизайнов',
      step3: 'Скачайте резюме',
      step3Desc: 'Получите ваше профессиональное резюме в PDF формате',
      
      // CTA
      ctaTitle: 'Начните создавать профессиональное резюме сегодня!',
      ctaButton: 'Создать бесплатное резюме',
      templatesButton: 'Шаблоны',
      trustIndicator1: 'Сотни довольных клиентов',
      trustIndicator2: 'Безопасно и надежно',
      trustIndicator3: 'Создано более 2 миллионов резюме',
      
      // Features section
      featuresMainTitle: 'Волшебные прикосновения',
      featuresMainSubtitle: 'Достигайте лучших результатов в карьере с помощью современных технологий и силы искусственного интеллекта.',
      
      // Interface section
      interfaceTitle: 'Особенности, которые нас выделяют',
      interfaceSubtitle: 'Платформа создания резюме в соответствии с международными стандартами',
      
      // Features details
      aiTitle: 'Поддержка искусственного интеллекта',
      aiDescription: 'Искусственный интеллект, усовершенствованный данными миллионов успешных резюме, готовит ваше резюме в персонализированном и оптимальном виде.',
      premiumTitle: 'Коллекция премиум шаблонов',
      premiumDescription: 'Привлекательные и функциональные шаблоны, подготовленные HR-специалистами и профессиональными дизайнерами, дают вам преимущество в процессе найма.',
      linkedinTitle: 'Система импорта LinkedIn',
      linkedinDescription: 'Информация из вашего профиля LinkedIn автоматически добавляется, и ваше резюме быстро готовится.',
      
      // Features section cards
      feature1Title: 'Искусственный интеллект',
      feature1Description: 'Получите более умный и персонализированный опыт с постоянно развивающимися функциями ИИ.',
      feature2Title: 'Привлекательный интерфейс',
      feature2Description: 'Интерфейс, основанный на современных принципах дизайна, обеспечивает комфортный пользовательский опыт.',
      feature3Title: 'Ощутимая скорость',
      feature3Description: 'Получите профессиональное резюме в формате PDF за секунды с помощью облачных технологий.',
      
      // Steps section
      howItWorksTitle: 'Как это работает?',
      registrationTitle: 'Регистрация',
      registrationDescription: 'Зарегистрируйтесь с помощью электронной почты или учетной записи LinkedIn',
      linkedinImportTitle: 'Импорт профиля LinkedIn',
      linkedinImportDescription: 'Введите ссылку на ваш профиль LinkedIn и добавьте вашу информацию в резюме.',
      downloadTitle: 'Скачать резюме',
      downloadDescription: 'Выберите шаблон и скачайте ваше профессиональное резюме в формате PDF.',
      
      // Stats section
      thisYearCVs: 'Резюме, созданных в этом году',
      successfulHiring: 'Успешное трудоустройство',
      liveSupportService: 'Служба поддержки в реальном времени',
      templateSelection: 'Выбор шаблона',
    }
  }[siteLanguage];

  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: {y: 20, opacity: 0},
    visible: {
      y: 0,
      opacity: 1
    }
  }

  return (
      <>
        <div className="min-h-screen bg-white">
          <Header currentPage="home" />

          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100">
            {/* Geometric Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#2563eb" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)"/>
              </svg>
            </div>

            {/* Floating geometric elements */}
            <div className="absolute inset-0">
              <div
                  className="absolute top-20 left-16 w-32 h-32 border-2 border-blue-200 rounded-full animate-pulse"></div>
              <div className="absolute top-40 right-20 w-16 h-16 bg-blue-100 transform rotate-45 animate-bounce"></div>
              <div
                  className="absolute bottom-32 left-32 w-24 h-24 border border-blue-300 transform rotate-12 animate-pulse"></div>
              <div className="absolute top-64 right-40 w-8 h-8 bg-blue-200 rounded-full animate-ping"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 relative z-10">
              <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="text-center"
              >
                {/* Main Heading */}
                <motion.div
                    variants={itemVariants}
                    className="mb-12 sm:mb-16"
                    data-aos="fade-up"
                >
                  <div className="inline-block mb-4 sm:mb-6">
                  <span
                      className="px-4 sm:px-6 py-2 bg-blue-100 text-blue-800 font-semibold rounded-full text-xs sm:text-sm tracking-wide uppercase">
                    {content.heroBadge}
                  </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
                    <span className="block text-gray-900 mb-2">{content.title}</span>
                    <span className="block relative inline-block">
                    <span className="absolute inset-0 bg-blue-500 transform -skew-y-2 rounded-lg opacity-100"></span>
                    <motion.span
                        className="block relative inline-block"
                        initial={{opacity: 0, scale: 0.8, rotateY: -15}}
                        animate={{opacity: 1, scale: 1, rotateY: 0}}
                        transition={{duration: 0.8, delay: 0.4}}
                    >
                 <span className="relative text-white px-4 py-2 transform -skew-y-2 block rounded-lg drop-shadow-lg font-bold text-xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl" >
                        {content.heroAction}
                      </span>

                    </motion.span>
                  </span>
                  </h1>
                  <p className="text-base sm:text-base lg:text-lg text-gray-600 max-w-5xl mx-auto leading-relaxed px-4">
                    {content.subtitle}
                  </p>
                </motion.div>

                {/* Professional Window Interface */}
                <motion.div
                    variants={itemVariants}
                    data-aos="zoom-in"
                    data-aos-delay="400"
                    className="relative max-w-7xl mx-auto mb-16 sm:mb-20"
                >
                  {/* Main Interface Container */}
                  <div
                      className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-100 overflow-hidden mx-4 sm:mx-0">
                    {/* Interface Header */}
                    <div
                        className="bg-gradient-to-r from-blue-50 to-white px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 border-b border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex gap-1 sm:gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-300 rounded-full"></div>
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full"></div>
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center">

                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-blue-600">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"/>
                        </svg>
                        <span className="text-xs sm:text-sm font-medium hidden sm:inline"></span>
                      </div>
                    </div>

                    {/* Interface Content */}
                    <div className="p-6 sm:p-8 lg:p-12 xl:p-20">
                      <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
                        {/* Left Side - Features */}
                        <div className="space-y-8 sm:space-y-12">
                          <div className="text-center lg:text-left">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                              {content.interfaceTitle}
                            </h3>
                            <p className="text-gray-600 text-sm sm:text-base">
                              {content.interfaceSubtitle}
                            </p>
                          </div>

                          <div className="space-y-6 sm:space-y-8">
                            <div
                                className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group text-center sm:text-left"
                                data-aos="fade-right" data-aos-delay="600">
                              <div
                                  className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0 flex-shrink-0">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div
                                    className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 mb-3 justify-center sm:justify-start">
                                  <div className="flex flex-col order-2 sm:order-1">
                                    <div className="h-0.5 w-6 sm:w-8 bg-blue-600 mx-auto sm:mx-0"></div>
                                    <div className="h-0.5 w-8 sm:w-12 bg-blue-600 mt-1 mx-auto sm:mx-0"></div>
                                  </div>
                                  <h4 className="font-bold text-gray-900 text-base sm:text-lg order-1 sm:order-2">{content.aiTitle}</h4>
                                </div>
                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                  {content.aiDescription}
                                </p>
                              </div>
                            </div>

                            <div
                                className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group text-center sm:text-left"
                                data-aos="fade-right" data-aos-delay="700">
                              <div
                                  className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0 flex-shrink-0">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div
                                    className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 mb-3 justify-center sm:justify-start">
                                  <div className="flex flex-col order-2 sm:order-1">
                                    <div className="h-0.5 w-6 sm:w-8 bg-blue-600 mx-auto sm:mx-0"></div>
                                    <div className="h-0.5 w-8 sm:w-12 bg-blue-600 mt-1 mx-auto sm:mx-0"></div>
                                  </div>
                                  <h4 className="font-bold text-gray-900 text-base sm:text-lg order-1 sm:order-2">{content.premiumTitle}</h4>
                                </div>
                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                  {content.premiumDescription}
                                </p>
                              </div>
                            </div>

                            <div
                                className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group text-center sm:text-left"
                                data-aos="fade-right" data-aos-delay="800">
                              <div
                                  className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0 flex-shrink-0">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div
                                    className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 mb-3 justify-center sm:justify-start">
                                  <div className="flex flex-col order-2 sm:order-1">
                                    <div className="h-0.5 w-6 sm:w-8 bg-blue-600 mx-auto sm:mx-0"></div>
                                    <div className="h-0.5 w-8 sm:w-12 bg-blue-600 mt-1 mx-auto sm:mx-0"></div>
                                  </div>
                                  <h4 className="font-bold text-gray-900 text-base sm:text-lg order-1 sm:order-2">{content.linkedinTitle}</h4>
                                </div>
                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                  {content.linkedinDescription}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Preview */}
                        <div className="relative order-first lg:order-last" data-aos="fade-left" data-aos-delay="900">
                          <div
                              className="relative bg-gradient-to-br from-blue-50 to-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-dashed border-blue-200 shadow-inner">
                            {/* Background Pattern */}
                            <div className="absolute inset-4 opacity-5">
                              <div className="w-full h-full" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232563eb' fill-opacity='0.1'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                              }}/>
                            </div>

                            {/* Computer with CV Display */}
                            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                              {/* Computer Monitor */}
                              <div className="bg-gray-800 rounded-t-2xl p-3 sm:p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                </div>

                                {/* Screen Content - Wavy Paper CV */}
                                <div
                                    className="bg-gray-100 rounded-lg p-2 sm:p-4 aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] flex items-center justify-center overflow-hidden">
                                  {/* Wavy Paper CV */}
                                  <div className="relative w-full max-w-xs sm:max-w-sm h-40 sm:h-48 lg:h-56">
                                    {/* Paper with wavy edges */}
                                    <div className="relative bg-white h-full shadow-lg overflow-hidden"
                                         style={{
                                           clipPath: 'polygon(0% 5%, 3% 0%, 7% 3%, 12% 0%, 17% 4%, 22% 1%, 27% 5%, 32% 2%, 37% 6%, 42% 1%, 47% 4%, 52% 0%, 57% 5%, 62% 2%, 67% 6%, 72% 1%, 77% 4%, 82% 0%, 87% 5%, 92% 2%, 97% 6%, 100% 3%, 100% 95%, 97% 100%, 93% 97%, 88% 100%, 83% 96%, 78% 99%, 73% 95%, 68% 98%, 63% 94%, 58% 99%, 53% 96%, 48% 100%, 43% 95%, 38% 98%, 33% 94%, 28% 99%, 23% 96%, 18% 100%, 13% 95%, 8% 98%, 3% 94%, 0% 97%)'
                                         }}>
                                      <div className="p-3 sm:p-4 h-full flex flex-col">
                                        {/* CV Header */}
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                          <div
                                              className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none"
                                                 stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                            </svg>
                                          </div>
                                          <div className="flex-1">
                                            <div className="h-2 bg-gray-800 rounded mb-1 w-16 sm:w-20"></div>
                                            <div className="h-1.5 bg-blue-600 rounded w-12 sm:w-16"></div>
                                          </div>
                                        </div>

                                        {/* CV Sections */}
                                        <div className="space-y-2 sm:space-y-3 flex-1">
                                          {/* Experience Section */}
                                          <div>
                                            <div className="h-2 bg-blue-700 rounded mb-1 w-10 sm:w-12"></div>
                                            <div className="space-y-1">
                                              <div className="h-1 bg-gray-300 rounded w-full"></div>
                                              <div className="h-1 bg-gray-300 rounded w-4/5"></div>
                                              <div className="h-1 bg-gray-300 rounded w-3/5"></div>
                                            </div>
                                          </div>

                                          {/* Skills Section */}
                                          <div>
                                            <div className="h-2 bg-blue-700 rounded mb-1 w-8 sm:w-10"></div>
                                            <div className="flex gap-1">
                                              <div className="h-3 sm:h-4 bg-blue-100 rounded px-1 flex-1"></div>
                                              <div className="h-3 sm:h-4 bg-blue-100 rounded px-1 flex-1"></div>
                                            </div>
                                          </div>

                                          {/* Education Section */}
                                          <div>
                                            <div className="h-2 bg-blue-700 rounded mb-1 w-9 sm:w-11"></div>
                                            <div className="space-y-1">
                                              <div className="h-1 bg-gray-300 rounded w-full"></div>
                                              <div className="h-1 bg-gray-300 rounded w-3/4"></div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Paper texture lines */}
                                      <div className="absolute inset-0 pointer-events-none opacity-10">
                                        <div className="h-full w-full" style={{
                                          backgroundImage: 'repeating-linear-gradient(transparent, transparent 8px, #e5e7eb 8px, #e5e7eb 9px)',
                                        }}></div>
                                      </div>
                                    </div>

                                    {/* Paper shadow */}
                                    <div
                                        className="absolute inset-0 -z-10 transform translate-x-1 translate-y-1 bg-gray-300 opacity-30 h-full"
                                        style={{
                                          clipPath: 'polygon(0% 5%, 3% 0%, 7% 3%, 12% 0%, 17% 4%, 22% 1%, 27% 5%, 32% 2%, 37% 6%, 42% 1%, 47% 4%, 52% 0%, 57% 5%, 62% 2%, 67% 6%, 72% 1%, 77% 4%, 82% 0%, 87% 5%, 92% 2%, 97% 6%, 100% 3%, 100% 95%, 97% 100%, 93% 97%, 88% 100%, 83% 96%, 78% 99%, 73% 95%, 68% 98%, 63% 94%, 58% 99%, 53% 96%, 48% 100%, 43% 95%, 38% 98%, 33% 94%, 28% 99%, 23% 96%, 18% 100%, 13% 95%, 8% 98%, 3% 94%, 0% 97%)'
                                        }}>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Computer Base - Hidden on mobile */}
                              <div className="bg-gray-700 rounded-b-lg h-3 sm:h-4 relative">
                                <div
                                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 sm:w-8 h-1.5 sm:h-2 bg-gray-600 rounded-t"></div>
                              </div>

                              {/* Computer Stand - Hidden on very small screens */}
                              <div className="hidden sm:flex justify-center">
                                <div className="w-0.5 sm:w-1 h-4 sm:h-6 bg-gray-600"></div>
                              </div>
                              <div
                                  className="bg-gray-600 rounded-lg h-2 sm:h-3 w-16 sm:w-20 mx-auto hidden sm:block"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* CTA Buttons - Responsive */}
                <motion.div
                    variants={itemVariants}
                    data-aos="fade-up"
                    data-aos-delay="1000"
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 justify-center items-center mb-12 sm:mb-16 px-4"
                >
                  <Link href="/auth/register">
                    <button
                        className="group relative w-full sm:w-auto px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 bg-blue-600 text-white font-bold rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-3 hover:scale-105 transition-all duration-300 overflow-hidden text-base sm:text-lg">
                      <div
                          className="absolute inset-0 bg-blue-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                      <span className="relative flex items-center justify-center gap-3 sm:gap-4">
                      {content.createCVButton}
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-3 transition-transform" fill="none"
                           stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                      </svg>
                    </span>
                    </button>
                  </Link>

                  <Link href="/sablonlar">
                    <button
                        className="group w-full sm:w-auto px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 bg-white text-blue-600 font-bold rounded-xl sm:rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-base sm:text-lg">
                    <span className="flex items-center justify-center gap-2 sm:gap-3">
                      {content.templatesButton}
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" fill="none"
                           stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </span>
                    </button>
                  </Link>
                </motion.div>

                {/* Trust Indicators - Responsive */}
                <motion.div
                    variants={itemVariants}
                    data-aos="fade-up"
                    data-aos-delay="1200"
                    className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-gray-600 px-4"
                >
                  <div
                      className="flex items-center gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 shadow-lg border border-blue-100">
                    <div
                        className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"/>
                    </svg>
                    </div>
                    <span className="font-semibold text-sm sm:text-base">{content.trustIndicator1}</span>
                  </div>
                  <div
                      className="flex items-center gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 shadow-lg border border-blue-100">
                    <div
                        className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"/>
                    </svg>
                    </div>
                    <span className="font-semibold text-sm sm:text-base">{content.trustIndicator2}</span>
                  </div>
                  <div
                      className="flex items-center gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 shadow-lg border border-blue-100">
                    <div
                        className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd"
                              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                              clipRule="evenodd"/>
                    </svg>
                    </div>
                    <span className="font-semibold text-sm sm:text-base">{content.trustIndicator3}</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Features Section - Responsive */}
          <section className="py-16 sm:py-24 lg:py-32 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 lg:mb-24" data-aos="fade-up">

                <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
                  {content.featuresMainTitle.split(' ')[0]} <span className="text-blue-600">{content.featuresMainTitle.split(' ')[1]}</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
                  {content.featuresMainSubtitle}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
                {/* Feature 1 */}
                <div
                    className="group text-center hover:bg-blue-50 p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-4 border border-transparent hover:border-blue-100"
                    data-aos="fade-up" data-aos-delay="200">
                  <div
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor"
                         viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{content.feature1Title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    {content.feature1Description}
                  </p>
                </div>

                {/* Feature 2 */}
                <div
                    className="group text-center hover:bg-blue-50 p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-4 border border-transparent hover:border-blue-100"
                    data-aos="fade-up" data-aos-delay="400">
                  <div
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor"
                         viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{content.feature2Title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    {content.feature2Description}
                  </p>
                </div>

                {/* Feature 3 */}
                <div
                    className="group text-center hover:bg-blue-50 p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-4 border border-transparent hover:border-blue-100 sm:col-span-2 lg:col-span-1"
                    data-aos="fade-up" data-aos-delay="600">
                  <div
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor"
                         viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{content.feature3Title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    {content.feature3Description}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <div className="container mx-auto px-4 mb-20">
            <div id="how-it-works" className="scroll-mt-20">
              <div className="text-center mb-16" data-aos="fade-up">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
                    {content.howItWorksTitle}
                  </span>
                </h2>
                <p className="text-base text-gray-600 max-w-3xl mx-auto">
                  {content.stepsTitle}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center relative" data-aos="slide-up" data-aos-delay="100">
                  <div
                      className="bg-gradient-to-br from-blue-500 to-brown-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{content.registrationTitle}</h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">
                    {content.registrationDescription}
                  </p>

                  {/* Arrow to next step */}
                  <div className="hidden md:block absolute top-10 -right-4 text-gray-300 z-0">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd"
                            d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"></path></svg>
                  </div>
                </div>

                <div className="text-center relative" data-aos="slide-up" data-aos-delay="200">
                  <div
                      className="bg-gradient-to-br from-blue-500 to-brown-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{content.linkedinImportTitle}</h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">
                    {content.linkedinImportDescription}
                  </p>

                  {/* Arrow to next step */}
                  <div className="hidden md:block absolute top-10 -right-4 text-gray-300 z-0">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd"
                            d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"></path></svg>
                  </div>
                </div>

                <div className="text-center" data-aos="slide-up" data-aos-delay="300">
                  <div
                      className="bg-gradient-to-br from-blue-500 to-brown-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{content.downloadTitle}</h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">
                    {content.downloadDescription}
                  </p>

                </div>
              </div>
            </div>
          </div>


          {/* Stats Section - Responsive */}
          <section
              className="py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" >
              <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="stats-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="white"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#stats-pattern)"/>
              </svg>
            </div>

            {/* Geometric Elements - Responsive */}
            <div className="absolute inset-0">
              <div
                  className="absolute top-10 sm:top-20 left-10 sm:left-20 w-20 h-20 sm:w-32 sm:h-32 lg:w-40 lg:h-40 border border-white/20 rounded-full hidden sm:block animate-pulse"></div>
              <div
                  className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white/10 transform rotate-45 hidden sm:block animate-bounce"></div>
              <div
                  className="absolute top-1/2 left-1/4 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 border-2 border-white/20 transform rotate-12 hidden lg:block animate-spin"
                  style={{animationDuration: '8s'}}></div>
              <div
                  className="absolute top-1/4 right-1/3 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white/10 rounded-full animate-ping"></div>
              <div
                  className="absolute bottom-1/3 left-1/3 w-6 h-6 sm:w-10 sm:h-10 lg:w-14 lg:h-14 border border-white/30 transform rotate-45 animate-bounce"
                  style={{animationDelay: '1s'}}></div>
              <div
                  className="absolute top-2/3 right-1/4 w-4 h-4 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-white/20 rounded-full animate-pulse"
                  style={{animationDelay: '2s'}}></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">


              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
                <div data-aos="fade-up" data-aos-delay="200"
                     className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4">150+</div>
                  <div className="text-blue-100 text-sm sm:text-base font-semibold">{content.thisYearCVs}</div>
                </div>
                <div data-aos="fade-up" data-aos-delay="400"
                     className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4">98%</div>
                  <div className="text-blue-100 text-sm sm:text-base font-semibold">{content.successfulHiring}</div>
                </div>
                <div data-aos="fade-up" data-aos-delay="600"
                     className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4">24/7</div>
                  <div className="text-blue-100 text-sm sm:text-base font-semibold">
                    {content.liveSupportService}
                  </div>
                </div>
                <div data-aos="fade-up" data-aos-delay="800"
                     className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4">10+</div>
                  <div className="text-blue-100 text-sm sm:text-base font-semibold">{content.templateSelection}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <Footer/>
        </div>
      </>
  )
}

