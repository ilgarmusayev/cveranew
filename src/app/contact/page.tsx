'use client';

import { useState } from 'react';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

export default function ContactPage() {
  const { siteLanguage } = useSiteLanguage();
  
  const contactContent = {
    azerbaijani: {
      title: 'Bizimlə Əlaqə',
      subtitle: 'Suallarınız, təklifləriniz və ya dəstək üçün bizimlə əlaqə saxlayın',
      contactInfo: {
        title: 'Əlaqə Məlumatları',
        email: 'E-poçt',
        support: 'Dəstək',
        socialMedia: 'Sosial Şəbəkələr',
        businessHours: 'İş Saatları',
        monday_friday: 'Bazar ert. - Cümə',
        saturday: 'Şənbə',
        sunday: 'Bazar',
        supportNote: 'Dəstək xətti üçün qeyd olunub*'
      },
      form: {
        title: 'Mesaj Göndərin',
        nameLabel: 'Ad Soyad *',
        namePlaceholder: 'Adınızı və soyadınızı daxil edin',
        emailLabel: 'E-poçt ünvanı *',
        emailPlaceholder: 'numune@cvera.net',
        subjectLabel: 'Mövzu *',
        subjectPlaceholder: 'Mesajınızın mövzusunu daxil edin',
        messageLabel: 'Mesaj *',
        messagePlaceholder: 'Mesajınızı buraya yazın...',
        submitButton: 'Mesaj Göndərin',
        submitting: 'Göndərilir...',
        successMessage: 'Mesajınız uğurla göndərildi! Tezliklə sizə cavab verəcəyik.',
        errorMessage: 'Mesaj göndərilərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'
      }
    },
    english: {
      title: 'Contact Us',
      subtitle: 'Get in touch with us for questions, suggestions, or support',
      contactInfo: {
        title: 'Contact Information',
        email: 'Email',
        support: 'Support',
        socialMedia: 'Social Networks',
        businessHours: 'Business Hours',
        monday_friday: 'Monday - Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',
        supportNote: 'Note for support line*'
      },
      form: {
        title: 'Send Message',
        nameLabel: 'Full Name *',
        namePlaceholder: 'Enter your first and last name',
        emailLabel: 'Email Address *',
        emailPlaceholder: 'example@cvera.net',
        subjectLabel: 'Subject *',
        subjectPlaceholder: 'Enter your message subject',
        messageLabel: 'Message *',
        messagePlaceholder: 'Write your message here...',
        submitButton: 'Send Message',
        submitting: 'Sending...',
        successMessage: 'Your message has been sent successfully! We will reply to you soon.',
        errorMessage: 'An error occurred while sending the message. Please try again.'
      }
    },
    russian: {
      title: 'Свяжитесь с нами',
      subtitle: 'Обратитесь к нам с вопросами, предложениями или за поддержкой',
      contactInfo: {
        title: 'Контактная информация',
        email: 'Email',
        support: 'Поддержка',
        socialMedia: 'Социальные сети',
        businessHours: 'Рабочие часы',
        monday_friday: 'Пон. - Пятн.',
        saturday: 'Суббота',
        sunday: 'Воскресенье',
        supportNote: 'Примечание для линии поддержки*'
      },
      form: {
        title: 'Отправить сообщение',
        nameLabel: 'Полное имя *',
        namePlaceholder: 'Введите ваше имя и фамилию',
        emailLabel: 'Адрес электронной почты *',
        emailPlaceholder: 'example@cvera.net',
        subjectLabel: 'Тема *',
        subjectPlaceholder: 'Введите тему вашего сообщения',
        messageLabel: 'Сообщение *',
        messagePlaceholder: 'Напишите ваше сообщение здесь...',
        submitButton: 'Отправить сообщение',
        submitting: 'Отправка...',
        successMessage: 'Ваше сообщение успешно отправлено! Мы скоро ответим вам.',
        errorMessage: 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте снова.'
      }
    }
  };

  const content = contactContent[siteLanguage] || contactContent.azerbaijani;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <StandardHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Enhanced Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-48 w-80 h-80 bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-bl from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {content.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl  border-2 border-blue-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">{content.contactInfo.title}</h2>

              {/* Email */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{content.contactInfo.email}</h3>
                  <a href="mailto:info@cvera.net" className="text-blue-600 hover:text-blue-700 transition-colors">
                    info@cvera.net
                  </a>
                </div>
              </div>

              {/* Support Email */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{content.contactInfo.support}</h3>
                  <a href="mailto:support@cvera.net" className="text-blue-600 hover:text-blue-700 transition-colors">
                    support@cvera.net
                  </a>
                </div>
              </div>

      {/* Support Email */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{content.contactInfo.support}</h3>
                  <a href="tel:+9941024242410" className="text-blue-600 hover:text-blue-700 transition-colors">
                    +994 (10) 424 24 10
                  </a>
                </div>
              </div>
              {/* Social Media */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">{content.contactInfo.socialMedia}</h3>
                <div className="flex space-x-4">
                  {/* LinkedIn */}
                  <a
                    href="https://www.linkedin.com/company/cv-look"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                    title="LinkedIn"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/cveranet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-colors"
                    title="Instagram"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C8.396 0 7.989.013 7.041.048 4.928.097 3.105 1.92 3.056 4.032.013 7.989 0 8.396 0 12.017c0 3.624.013 4.09.048 5.014.097 2.112 1.92 3.935 4.032 3.984C7.989 23.987 8.396 24 12.017 24c3.624 0 4.09-.013 5.014-.048 2.112-.097 3.935-1.92 3.984-4.032C23.987 16.011 24 15.604 24 12.017c0-3.624-.013-4.09-.048-5.014C23.905 4.928 22.082 3.105 19.97 3.056 16.011.013 15.604 0 12.017 0zm0 2.171c3.556 0 3.98.015 5.382.087 1.3.06 2.006.276 2.476.458.622.242 1.067.532 1.534.999.466.466.756.911.998 1.534.182.47.398 1.176.458 2.476.072 1.402.087 1.826.087 5.382 0 3.556-.015 3.98-.087 5.382-.06 1.3-.276 2.006-.458 2.476-.242.622-.532 1.067-.999 1.534-.466.466-.911.756-1.534.998-.47.182-1.176.398-2.476.458-1.402.072-1.826.087-5.382.087-3.556 0-3.98-.015-5.382-.087-1.3-.06-2.006-.276-2.476-.458-.622-.242-1.067-.532-1.534-.999-.466-.466-.756-.911-.998-1.534-.182-.47-.398-1.176-.458-2.476-.072-1.402-.087-1.826-.087-5.382 0-3.556.015-3.98.087-5.382.06-1.3.276-2.006.458-2.476.242-.622.532-1.067.999-1.534.466-.466.911-.756 1.534-.998.47-.182 1.176-.398 2.476-.458 1.402-.072 1.826-.087 5.382-.087z" />
                      <path d="M12.017 5.838A6.179 6.179 0 1 0 18.196 12.017 6.179 6.179 0 0 0 12.017 5.838zm0 10.188a4.009 4.009 0 1 1 4.009-4.009 4.009 4.009 0 0 1-4.009 4.009z" />
                      <circle cx="18.406" cy="5.594" r="1.44" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Business Hours */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">{content.contactInfo.businessHours}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{content.contactInfo.monday_friday}</span>
                    <span className="text-gray-900">09:00 - 22:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{content.contactInfo.saturday}</span>
                    <span className="text-gray-900">10:00 - 21:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{content.contactInfo.sunday}</span>
                    <span className="text-gray-900">10:00 - 21:00</span>
                  </div>
                  <br/>
                  <span className="text-gray-600/50">{content.contactInfo.supportNote}</span>

                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl  border-2 border-blue-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">{content.form.title}</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {content.form.nameLabel}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder={content.form.namePlaceholder}
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {content.form.emailLabel}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder={content.form.emailPlaceholder}
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {content.form.subjectLabel}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder={content.form.subjectPlaceholder}
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {content.form.messageLabel}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-vertical"
                    placeholder={content.form.messagePlaceholder}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {content.form.submitting}
                    </div>
                  ) : (
                    content.form.submitButton
                  )}
                </button>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-green-700">{content.form.successMessage}</p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-700">{content.form.errorMessage}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>



        </div>
      </div>
      <Footer />
    </>
  );
}
