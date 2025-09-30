'use client';

import { useRouter } from 'next/navigation';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

export default function CreatePage() {
  const router = useRouter();
  const { siteLanguage } = useSiteLanguage();

  const content = {
    azerbaijani: {
      title: "CV Yaratma Seçimi",
      subtitle: "CV yaratmaq üçün ən uyğun metodu seçin",
      linkedinTitle: "LinkedIn İdxal",
      linkedinSubtitle: "LinkedIn profilinizdən avtomatik doldurma",
      linkedinDescription: "LinkedIn hesabınızın linki ilə bütün məlumatlarınızı avtomatik olaraq CV-yə köçürün. ",
      linkedinFeatures: [
        "Vaxta qənaət"
      ],
      linkedinButton: "LinkedIn İdxal Edin",
      manualTitle: "Sıfırdan Yaradın",
      manualSubtitle: "Manual olaraq CV yaradın",
      manualDescription: "Bütün məlumatları özünüz daxil edərək peşəkar CV yaradın. Tam nəzarət və şəxsiləşdirmə imkanı.",
      manualFeatures: [
        "Sıfırdan bütün məlumatlar"
      ],
      manualButton: "Yaratmağa Başlayın",
      backToDashboard: "Dashboard-a Qayıt"
    },
    english: {
      title: "CV Creation Options",
      subtitle: "Choose the most suitable method to create your CV",
      linkedinTitle: "LinkedIn Import",
      linkedinSubtitle: "Auto-fill from your LinkedIn profile",
      linkedinDescription: "Connect your LinkedIn account to automatically transfer all your information to CV. Work experience, education, and skills will be filled automatically.",
      linkedinFeatures: [
        "Time saving"
      ],
      linkedinButton: "Import from LinkedIn",
      manualTitle: "Create from Scratch",
      manualSubtitle: "Create CV manually",
      manualDescription: "Create a professional CV by entering all information yourself. Full control and customization possibilities.",
      manualFeatures: [
        "All information from scratch"
      ],
      manualButton: "Start Creating",
      backToDashboard: "Back to Dashboard"
    },
    russian: {
      title: "Варианты создания CV",
      subtitle: "Выберите наиболее подходящий способ создания CV",
      linkedinTitle: "Импорт из LinkedIn",
      linkedinSubtitle: "Автозаполнение из профиля LinkedIn",
      linkedinDescription: "Подключите ваш аккаунт LinkedIn для автоматического переноса всей информации в CV. Опыт работы, образование и навыки будут заполнены автоматически.",
      linkedinFeatures: [
        "Экономия времени"
      ],
      linkedinButton: "Импорт из LinkedIn",
      manualTitle: "Создать с нуля",
      manualSubtitle: "Создать CV вручную",
      manualDescription: "Создайте профессиональное CV, вводя всю информацию самостоятельно. Полный контроль и возможности настройки.",
      manualFeatures: [
        "Вся информация с нуля"
      ],
      manualButton: "Начать создание",
      backToDashboard: "Назад к панели"
    }
  };

  const currentContent = content[siteLanguage as keyof typeof content] || content.azerbaijani;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <StandardHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {currentContent.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {currentContent.subtitle}
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* LinkedIn Import Option */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentContent.linkedinTitle}
              </h2>
              <p className="text-gray-600 mb-4">
                {currentContent.linkedinSubtitle}
              </p>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {currentContent.linkedinDescription}
            </p>

            <div className="space-y-3 mb-8">
              {currentContent.linkedinFeatures.map((feature, index) => (
                <div key={index} className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/linkedin-import')}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center">
                {currentContent.linkedinButton}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Manual Creation Option */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentContent.manualTitle}
              </h2>
              <p className="text-gray-600 mb-4">
                {currentContent.manualSubtitle}
              </p>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {currentContent.manualDescription}
            </p>

            <div className="space-y-3 mb-8">
              {currentContent.manualFeatures.map((feature, index) => (
                <div key={index} className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/new')}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center">
                {currentContent.manualButton}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}