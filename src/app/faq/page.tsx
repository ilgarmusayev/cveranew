'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
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
    answer: 'Free planında 3 CV, Premium planında isə limitsiz CV yarada bilərsiniz. Hər plan öz xüsusiyyətləri ilə gəlir.'
  },
  {
    id: 4,
    category: 'CV Yaratma',
    question: 'LinkedIn profilimi necə import edə bilərəm?',
    answer: 'CV yaratma səhifəsində "LinkedIn-dən Import Et" düyməsini basın və LinkedIn hesabınıza daxil olun. Sistem avtomatik olaraq məlumatlarınızı çəkəcək.'
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
    question: 'AI özət generatoru necə işləyir?',
    answer: 'AI sistemimiz sizin iş təcrübənizə və bacarıqlarınıza əsaslanaraq professional özət mətn yaradır. Siz bu mətni öz ehtiyaclarınıza uyğun redaktə edə bilərsiniz.'
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
];

const categories = ['Hamısı', 'Ümumi', 'CV Yaratma', 'Şablonlar', 'AI Xüsusiyyətlər', 'Abunəlik', 'Texniki', 'Dəstək'];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('Hamısı');
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesCategory = activeCategory === 'Hamısı' || item.category === activeCategory;
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
                {categories.map((category, index) => (
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
                  <div className="text-sm text-gray-600">Tapılan sual</div>
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
                {filteredFAQs.map((faq, index) => (
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
                                  Faydalı
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex items-center hover:text-red-600 transition-colors"
                                >
                                  <span className="mr-1">👎</span>
                                  Faydasız
                                </motion.button>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                              >
                                Paylaş
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sual tapılmadı</h3>
                  <p className="text-gray-600 mb-6">Axtarış terminizi dəyişib yenidən cəhd edin</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchTerm('');
                      setActiveCategory('Hamısı');
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Axtarışı təmizlə
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
            Sualınızın cavabını tapa bilmədiniz?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 mb-8"
          >
            Dəstək komandamız sizə kömək etməyə hazırdır
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
              Email Göndər
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-4 bg-white bg-opacity-10 text-white rounded-xl font-semibold hover:bg-opacity-20 transition-all duration-300 backdrop-blur-sm border border-white border-opacity-20"
            >
              <span className="mr-2">💬</span>
              Canlı Söhbət
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>

  );
}
