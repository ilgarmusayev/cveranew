'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

  const faqContent = {
    azerbaijani: {
      title: 'Tez-tez Verilən Suallar',
      subtitle: 'CVEra platforması haqqında ən çox verilən sualların cavabları',
      searchPlaceholder: 'Sualları axtarın...',
      categories: ['Hamısı', 'Ümumi', 'CV Yaratma', 'Şablonlar', 'AI Xüsusiyyətlər', 'Abunəlik', 'Texniki', 'Dəstək'],
      noResultsTitle: 'Sual tapılmadı',
      noResultsDescription: 'Axtarış terminizi dəyişib yenidən cəhd edin',
      clearSearchButton: 'Axtarışı təmizlə',
      contactSectionTitle: 'Sualınızın cavabını tapa bilmədiniz?',
      contactSectionDescription: 'Dəstək komandamız sizə kömək etməyə hazırdır',
      emailButton: 'Email Göndər',
      liveChatButton: 'Canlı Söhbət',
      helpful: '',
      notHelpful: '',
      share: 'Paylaş',
      foundQuestionsText: 'Tapılan sual',
    faqData: [
      {
        id: 1,
        category: 'Ümumi',
        question: 'CVEra nədir və necə işləyir?',
        answer: 'CVEra professional CV yaratmaq üçün AI dəstəkli platformadır. LinkedIn profilinizi import edə bilər, müxtəlif şablonlar təklif edir və PDF formatında yüksək keyfiyyətli CV-lər yaradır.'
      },
      {
        id: 2,
        category: 'Ümumi',
        question: 'CVEra-dan istifadə etmək üçün qeydiyyatdan keçmək lazımdır?',
        answer: 'Bəli, platformamızdan tam faydalanmaq üçün qeydiyyatdan keçməlisiniz. Qeydiyyat prosesi sadə və sürətlidir.'
      },
      {
        id: 3,
        category: 'CV Yaratma',
        question: 'Neçə CV yarada bilərəm?',
        answer: 'Free planında 2 CV, Premium planında isə limitsiz CV yarada bilərsiniz. Hər plan öz xüsusiyyətləri ilə gəlir.'
      },
      {
        id: 4,
        category: 'CV Yaratma',
        question: 'LinkedIn profilimi necə idxal edə bilərəm?',
        answer: 'CV yaratma səhifəsində "LinkedIn-dən Idxal Et" düyməsini basın və LinkedIn hesabınıza daxil olun. Sistem avtomatik olaraq məlumatlarınızı çəkəcək.'
      },
      {
        id: 5,
        category: 'CV Yaratma',
        question: 'CV bölmələrini yenidən sıralaya bilərəm?',
        answer: 'Bəli! Drag & drop funksiyası ilə CV bölmələrinizi istədiyiniz kimi sıralaya bilərsiniz. Dəyişikliklər avtomatik olaraq saxlanılır.'
      },
      {
        id: 6,
        category: 'Şablonlar',
        question: 'Neçə şablon mövcuddur?',
        answer: 'Platformamızda müxtəlif sektorlar üçün 10+ professional şablon mövcuddur. Premium üzvlər bütün şablonlara çıxış əldə edir.'
      },
      {
        id: 7,
        category: 'Şablonlar',
        question: 'Şablonları fərdiləşdirə bilərəm?',
        answer: 'Hə, şablonların rənglərini, şriftlərini və bölmə ardıcıllığını öz zövqünüzə uyğun dəyişə bilərsiniz.'
      },
      {
        id: 8,
        category: 'AI Xüsusiyyətlər',
        question: 'AI xülasə generatoru necə işləyir?',
        answer: 'AI sistemimiz sizin iş təcrübənizə və bacarıqlarınıza əsaslanaraq peşəkar xülasə mətn yaradır. Siz bu mətni öz ehtiyaclarınıza uyğun redaktə edə bilərsiniz.'
      },
      {
        id: 9,
        category: 'AI Xüsusiyyətlər',
        question: 'AI xüsusiyyətləri pulsuzmu?',
        answer: 'AI xüsusiyyətlər Premium və Pro planlarında mövcuddur. Free planda məhdud AI xüsusiyyətləri var.'
      },
      {
        id: 10,
        category: 'Abunəlik',
        question: 'Premium planın üstünlükləri nələrdir?',
        answer: 'Premium planında limitsiz CV yaratma, bütün şablonlara çıxış, AI xüsusiyyətlər, prioritet dəstək və reklamsız təcrübə daxildir.'
      },
      {
        id: 11,
        category: 'Abunəlik',
        question: 'Abunəliyimi necə ləğv edə bilərəm?',
        answer: 'Hesab parametrlərinə daxil olub "Abunəlik" bölməsindən abunəliyinizi istənilən vaxt ləğv edə bilərsiniz.'
      },
      {
        id: 12,
        category: 'Texniki',
        question: 'CV-mi necə PDF formatında yükləyə bilərəm?',
        answer: 'CV redaktəsində "PDF Export" düyməsini basın. Sistem yüksək keyfiyyətli PDF faylı yaradacaq.'
      },
      {
        id: 13,
        category: 'Texniki',
        question: 'Məlumatlarım təhlükəsizdirmi?',
        answer: 'Bəli, bütün məlumatlarınız şifrələnmiş şəkildə saxlanılır və 3-cü tərəflərlə paylaşılmır. GDPR standartlarına uyğunluq təmin edirik.'
      },
      {
        id: 14,
        category: 'Dəstək',
        question: 'Texniki problem yaşadığımda kimə müraciət edə bilərəm?',
        answer: 'Dəstək komandamız 24/7 xidmətinizdədir. info@cvera.az ünvanından və ya canlı söhbət vasitəsilə bizimlə əlaqə saxlaya bilərsiniz.'
      },
      {
        id: 15,
        category: 'Dəstək',
        question: 'Promo kodlarımı necə istifadə edə bilərəm?',
        answer: 'Ödəniş səhifəsində "Promo Kod" bölməsinə kodunuzu daxil edin və endiriminizdən faydalanın.'
      }
    ]
  },
  english: {
    title: 'Frequently Asked Questions',
    subtitle: 'Answers to the most common questions about CVEra platform',
    searchPlaceholder: 'Search questions...',
    categories: ['All', 'General', 'CV Creation', 'Templates', 'AI Features', 'Subscription', 'Technical', 'Support'],
    noResultsTitle: 'No questions found',
    noResultsDescription: 'Try changing your search terms',
    clearSearchButton: 'Clear search',
    contactSectionTitle: 'Didn\'t find the answer to your question?',
    contactSectionDescription: 'Our support team is ready to help you',
    emailButton: 'Send Email',
    liveChatButton: 'Live Chat',
    helpful: '',
    notHelpful: '',
    share: 'Share',
    foundQuestionsText: 'Questions found',
    faqData: [
      {
        id: 1,
        category: 'General',
        question: 'What is CVEra and how does it work?',
        answer: 'CVEra is an AI-powered platform for creating professional CVs. You can import your LinkedIn profile, choose from various templates, and generate high-quality PDFs.'
      },
      {
        id: 2,
        category: 'General',
        question: 'Do I need to register to use CVEra?',
        answer: 'Yes, you need to register to fully utilize our platform. The registration process is simple and quick.'
      },
      {
        id: 3,
        category: 'CV Creation',
        question: 'How many CVs can I create?',
        answer: 'You can create 2 CVs on the Free plan and unlimited CVs on the Premium plan. Each plan comes with its own features.'
      },
      {
        id: 4,
        category: 'CV Creation',
        question: 'How can I import my LinkedIn profile?',
        answer: 'Click the "Import from LinkedIn" button on the CV creation page and log into your LinkedIn account. The system will automatically fetch your information.'
      },
      {
        id: 5,
        category: 'CV Creation',
        question: 'Can I reorder CV sections?',
        answer: 'Yes! You can reorder your CV sections as you like using the drag & drop functionality. Changes are automatically saved.'
      },
      {
        id: 6,
        category: 'Templates',
        question: 'How many templates are available?',
        answer: 'Our platform offers 10+ professional templates for various industries. Premium members get access to all templates.'
      },
      {
        id: 7,
        category: 'Templates',
        question: 'Can I customize templates?',
        answer: 'Yes, you can change template colors, fonts, and section order according to your preferences.'
      },
      {
        id: 8,
        category: 'AI Features',
        question: 'How does the AI summary generator work?',
        answer: 'Our AI system creates professional summary text based on your work experience and skills. You can edit this text according to your needs.'
      },
      {
        id: 9,
        category: 'AI Features',
        question: 'Are AI features free?',
        answer: 'AI features are available in Premium and Pro plans. The Free plan has limited AI features.'
      },
      {
        id: 10,
        category: 'Subscription',
        question: 'What are the benefits of the Premium plan?',
        answer: 'Premium plan includes unlimited CV creation, access to all templates, AI features, priority support, and ad-free experience.'
      },
      {
        id: 11,
        category: 'Subscription',
        question: 'How can I cancel my subscription?',
        answer: 'You can cancel your subscription anytime by going to account settings and the "Subscription" section.'
      },
      {
        id: 12,
        category: 'Technical',
        question: 'How can I download my CV in PDF format?',
        answer: 'Click the "PDF Export" button in the CV editor. The system will generate a high-quality PDF file.'
      },
      {
        id: 13,
        category: 'Technical',
        question: 'Is my data secure?',
        answer: 'Yes, all your data is stored encrypted and not shared with third parties. We ensure GDPR compliance.'
      },
      {
        id: 14,
        category: 'Support',
        question: 'Who can I contact when I experience technical problems?',
        answer: 'Our support team is available 24/7. You can contact us at info@cvera.az or through live chat.'
      },
      {
        id: 15,
        category: 'Support',
        question: 'How can I use my promo codes?',
        answer: 'Enter your code in the "Promo Code" section on the payment page and enjoy your discount.'
      }
    ]
  },
  russian: {
    title: 'Часто задаваемые вопросы',
    subtitle: 'Ответы на самые популярные вопросы о платформе CVEra',
    searchPlaceholder: 'Поиск вопросов...',
    categories: ['Все', 'Общие', 'Создание CV', 'Шаблоны', 'AI функции', 'Подписка', 'Техническое', 'Поддержка'],
    noResultsTitle: 'Вопросы не найдены',
    noResultsDescription: 'Попробуйте изменить условия поиска',
    clearSearchButton: 'Очистить поиск',
    contactSectionTitle: 'Не нашли ответ на свой вопрос?',
    contactSectionDescription: 'Наша команда поддержки готова вам помочь',
    emailButton: 'Отправить письмо',
    liveChatButton: 'Живой чат',
    helpful: '',
    notHelpful: '',
    share: 'Поделиться',
    foundQuestionsText: 'Найдено вопросов',
    faqData: [
      {
        id: 1,
        category: 'Общие',
        question: 'Что такое CVEra и как это работает?',
        answer: 'CVEra - это платформа с поддержкой ИИ для создания профессиональных резюме. Вы можете импортировать свой профиль LinkedIn, выбрать из различных шаблонов и создать высококачественные PDF-файлы.'
      },
      {
        id: 2,
        category: 'Общие',
        question: 'Нужно ли регистрироваться для использования CVEra?',
        answer: 'Да, вам нужно зарегистрироваться, чтобы полностью использовать нашу платформу. Процесс регистрации простой и быстрый.'
      },
      {
        id: 3,
        category: 'Создание CV',
        question: 'Сколько резюме я могу создать?',
        answer: 'Вы можете создать 2 резюме в бесплатном плане и неограниченное количество резюме в Premium плане. Каждый план имеет свои особенности.'
      },
      {
        id: 4,
        category: 'Создание CV',
        question: 'Как импортировать мой профиль LinkedIn?',
        answer: 'Нажмите кнопку "Импорт из LinkedIn" на странице создания резюме и войдите в свой аккаунт LinkedIn. Система автоматически получит вашу информацию.'
      },
      {
        id: 5,
        category: 'Создание CV',
        question: 'Могу ли я изменить порядок разделов резюме?',
        answer: 'Да! Вы можете изменить порядок разделов резюме по своему усмотрению, используя функцию drag & drop. Изменения автоматически сохраняются.'
      },
      {
        id: 6,
        category: 'Шаблоны',
        question: 'Сколько шаблонов доступно?',
        answer: 'Наша платформа предлагает 10+ профессиональных шаблонов для различных отраслей. Premium участники получают доступ ко всем шаблонам.'
      },
      {
        id: 7,
        category: 'Шаблоны',
        question: 'Могу ли я настроить шаблоны?',
        answer: 'Да, вы можете изменить цвета шаблонов, шрифты и порядок разделов по своим предпочтениям.'
      },
      {
        id: 8,
        category: 'AI функции',
        question: 'Как работает генератор AI резюме?',
        answer: 'Наша AI система создает профессиональный текст резюме на основе вашего опыта работы и навыков. Вы можете редактировать этот текст в соответствии с вашими потребностями.'
      },
      {
        id: 9,
        category: 'AI функции',
        question: 'Бесплатны ли функции AI?',
        answer: 'AI функции доступны в планах Premium и Pro. В бесплатном плане есть ограниченные AI функции.'
      },
      {
        id: 10,
        category: 'Подписка',
        question: 'Каковы преимущества Premium плана?',
        answer: 'Premium план включает неограниченное создание резюме, доступ ко всем шаблонам, AI функции, приоритетную поддержку и опыт без рекламы.'
      },
      {
        id: 11,
        category: 'Подписка',
        question: 'Как отменить подписку?',
        answer: 'Вы можете отменить подписку в любое время, перейдя в настройки аккаунта и раздел "Подписка".'
      },
      {
        id: 12,
        category: 'Техническое',
        question: 'Как скачать резюме в формате PDF?',
        answer: 'Нажмите кнопку "Экспорт PDF" в редакторе резюме. Система создаст высококачественный PDF файл.'
      },
      {
        id: 13,
        category: 'Техническое',
        question: 'Безопасны ли мои данные?',
        answer: 'Да, все ваши данные хранятся в зашифрованном виде и не передаются третьим лицам. Мы обеспечиваем соответствие GDPR.'
      },
      {
        id: 14,
        category: 'Поддержка',
        question: 'К кому обратиться при технических проблемах?',
        answer: 'Наша команда поддержки доступна 24/7. Вы можете связаться с нами по адресу info@cvera.az или через живой чат.'
      },
      {
        id: 15,
        category: 'Поддержка',
        question: 'Как использовать промо-коды?',
        answer: 'Введите ваш код в разделе "Промо-код" на странице оплаты и наслаждайтесь скидкой.'
      }
    ]
  }
};

export default function FAQPage() {
  const { siteLanguage } = useSiteLanguage();
  const content = faqContent[siteLanguage];
  
  const [activeCategory, setActiveCategory] = useState(content.categories[0]);
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Dil dəyişəndə kateqoriya və axtarışı sıfırla
  useEffect(() => {
    setActiveCategory(content.categories[0]);
    setSearchTerm('');
    setOpenItems([]);
  }, [siteLanguage, content.categories]);

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQs = content.faqData.filter((item: FAQItem) => {
    const matchesCategory = activeCategory === content.categories[0] || item.category === activeCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const categoryVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <StandardHeader />



      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

          {/* Categories Sidebar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">📋</span>
                Kateqoriyalar
              </h3>
              <div className="space-y-2">
                {content.categories.map((category: string, index: number) => (
                  <motion.button
                    key={category}
                    variants={categoryVariants}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveCategory(category)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                      activeCategory === category
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      {category}
                      {activeCategory === category && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-white"
                        >
                          ✓
                        </motion.span>
                      )}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredFAQs.length}</div>
                  <div className="text-sm text-gray-600">{content.foundQuestionsText}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* FAQ Items */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="lg:col-span-3"
          >
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {filteredFAQs.map((faq: FAQItem, index: number) => (
                  <motion.div
                    key={faq.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <motion.button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full px-8 py-6 text-left focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.02)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mr-3">
                              {faq.category}
                            </span>
                            <span className="text-sm text-gray-500">#{faq.id}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                            {faq.question}
                          </h3>
                        </div>
                        <motion.div
                          animate={{ rotate: openItems.includes(faq.id) ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="ml-4 flex-shrink-0"
                        >
                          <ChevronDownIcon className="w-6 h-6 text-gray-400" />
                        </motion.div>
                      </div>
                    </motion.button>

                    <AnimatePresence>
                      {openItems.includes(faq.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-8 pb-6 pt-2 border-t border-gray-50">
                            <motion.p
                              initial={{ y: -10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="text-gray-700 leading-relaxed text-base"
                            >
                              {faq.answer}
                            </motion.p>

                            {/* Action buttons */}
                            <motion.div
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100"
                            >
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex items-center hover:text-green-600 transition-colors"
                                >
                                  <span className="mr-1">👍</span>
                                  {content.helpful}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex items-center hover:text-red-600 transition-colors"
                                >
                                  <span className="mr-1">👎</span>
                                  {content.notHelpful}
                                </motion.button>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                              >
                                {content.share}
                              </motion.button>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredFAQs.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{content.noResultsTitle}</h3>
                  <p className="text-gray-600 mb-6">{content.noResultsDescription}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchTerm('');
                      setActiveCategory(content.categories[0]);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    {content.clearSearchButton}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 py-16"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-6"
          >
            {content.contactSectionTitle}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 mb-8"
          >
            {content.contactSectionDescription}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a
              href="mailto:info@cvera.az"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg"
            >
              <span className="mr-2">📧</span>
              {content.emailButton}
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-4 bg-white bg-opacity-10 text-white rounded-xl font-semibold hover:bg-opacity-20 transition-all duration-300 backdrop-blur-sm border border-white border-opacity-20"
            >
              <span className="mr-2">💬</span>
              {content.liveChatButton}
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>

  );
}
