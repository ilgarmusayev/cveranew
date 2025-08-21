'use client'

import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Footer from "@/components/Footer"
import { ResponsiveContainer, ResponsiveGrid, ResponsiveText, ResponsiveLayout } from '@/components/ui/responsive'

export default function ResponsiveHomePage() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      easing: 'ease-out-cubic',
      mirror: true,
      anchorPlacement: 'top-bottom',
      offset: 120,
    })
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  return (
    <ResponsiveLayout
      footer={<Footer />}
      fullHeight={true}
    >
      {/* Hero Section */}
      <ResponsiveContainer maxWidth="xl" padding="lg">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center py-12 lg:py-20"
        >
          <motion.div variants={itemVariants} data-aos="fade-up">
            <ResponsiveText variant="h1" className="mb-6 text-blue-900">
              CVERA — Süni İntellekt və LinkedIn İnteqrasiyası ilə Peşəkar CV Yaratma Platforması
            </ResponsiveText>
          </motion.div>

          <motion.div variants={itemVariants} data-aos="fade-up" data-aos-delay="200">
            <ResponsiveText variant="body" className="mb-8 text-gray-600 max-w-3xl mx-auto">
              AI texnologiyası ilə dəstəklənən CVERA platforması, peşəkar CV-nizi tez və rahat hazırlamağa imkan verir.
              LinkedIn məlumatlarınızı idxal edin və zəngin şablonlar ilə CV-nizi fərdiləşdirin.
            </ResponsiveText>
          </motion.div>

          <motion.div variants={itemVariants} data-aos="fade-up" data-aos-delay="400">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/cv-yaratmaq"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors duration-200 text-center"
              >
                CV Yaratmağa Başla
              </Link>
              <Link
                href="/templates"
                className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold transition-colors duration-200 text-center"
              >
                Şablonları Gör
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </ResponsiveContainer>

      {/* Features Section */}
      <ResponsiveContainer maxWidth="xl" padding="lg" className="py-16 lg:py-20 bg-gray-50">
        <div className="text-center mb-12" data-aos="fade-up">
          <ResponsiveText variant="h2" className="mb-4 text-gray-900">
            Niyə CVERA seçməlisiniz?
          </ResponsiveText>
          <ResponsiveText variant="body" className="text-gray-600 max-w-2xl mx-auto">
            Peşəkar CV yaratmaq üçün lazım olan bütün alətlər bir yerdə
          </ResponsiveText>
        </div>

        <ResponsiveGrid
          cols={{ default: 1, md: 2, lg: 3 }}
          gap="lg"
          className="mb-16"
        >
          {[
            {
              title: "AI ilə Smart CV",
              description: "Süni intellekt sizin üçün ən uyğun CV məzmununu yaradır",
              icon: "🤖"
            },
            {
              title: "LinkedIn İnteqrasiyası",
              description: "LinkedIn profilinizi bir kliklə idxal edin",
              icon: "💼"
            },
            {
              title: "Peşəkar Şablonlar",
              description: "Müxtəlif sahələr üçün xüsusi dizayn edilmiş şablonlar",
              icon: "🎨"
            },
            {
              title: "PDF Export",
              description: "Yüksək keyfiyyətli PDF formatında yükləyin",
              icon: "📄"
            },
            {
              title: "Məlumat Təhlükəsizliyi",
              description: "Məlumatlarınız tam təhlükəsiz saxlanılır",
              icon: "🔒"
            },
            {
              title: "Çoxdilli Dəstək",
              description: "Azərbaycan və ingilis dillərində CV yaradın",
              icon: "🌐"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <ResponsiveText variant="h4" className="mb-3 text-gray-900">
                {feature.title}
              </ResponsiveText>
              <ResponsiveText variant="body" className="text-gray-600">
                {feature.description}
              </ResponsiveText>
            </motion.div>
          ))}
        </ResponsiveGrid>
      </ResponsiveContainer>

      {/* CTA Section */}
      <ResponsiveContainer maxWidth="xl" padding="lg" className="py-16 lg:py-20">
        <div className="bg-blue-600 rounded-2xl text-white text-center py-12 px-8" data-aos="fade-up">
          <ResponsiveText variant="h2" className="mb-6 text-white">
            Peşəkar CV-nizi indi yaradın
          </ResponsiveText>
          <ResponsiveText variant="body" className="mb-8 text-blue-100 max-w-2xl mx-auto">
            Minlərlə namizəd artıq CVERA ilə uğurlu iş tapdı. Siz də onlara qoşulun!
          </ResponsiveText>
          <Link
            href="/cv-yaratmaq"
            className="inline-block bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold transition-colors duration-200"
          >
            Pulsuz Başla
          </Link>
        </div>
      </ResponsiveContainer>
    </ResponsiveLayout>
  )
}
