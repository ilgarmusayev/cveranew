'use client';

import Link from 'next/link';
import SocialShare from './SocialShare';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Tawk.to chat widget'ını açan fonksiyon
  const openTawkToChat = (e: React.MouseEvent) => {
    e.preventDefault();

    // Tawk.to API'sini kontrol et ve chat'i aç
    if (typeof window !== 'undefined' && (window as any).Tawk_API) {
      (window as any).Tawk_API.toggle();
    } else {
      // Tawk.to yüklenmemişse, alternativ olaraq email'e yönlendir
      window.location.href = 'mailto:support@cvera.net';
    }
  };

  return (
      <div className="w-full bg-white">
        <footer className="bg-white text-gray-900 border-t border-gray-200" style={{ marginBottom: 0, paddingBottom: 0, marginTop: 0, paddingTop: '30px' }}>
          <div className="w-full mx-auto pt-8 pb-12 lg:pb-16 px-4 sm:px-6 md:px-8 lg:px-[100px] xl:px-[120px] 2xl:px-[140px] 3xl:px-[160px] max-w-[1800px]">

          {/* Mobile optimized layout */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-16 lg:gap-16">
              {/* Logo və məlumat */}
              <div className="w-full lg:w-1/2">
                <img
                    src="/cveralogoco.png"
                    alt="CVera Logo"
                    className="h-8 w-auto sm:h-10 mb-4 lg:mb-6"
                    style={{ width: '120px', height: 'auto' }}
                />

                <p className="text-gray-600 mb-4 lg:mb-6 max-w-md text-sm leading-relaxed">
                  LinkedIn və Süni İntellekt ilə fərdiləşdirilmiş və yüksək keyfiyyətli CV yaradın, karyera yolunda uğur qazanın.
                </p>

                {/* Sosial media ikonları */}
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600 text-xs sm:text-sm">Bizi izləyin:</span>

                  {/* LinkedIn */}
                  <a
                      href="https://www.linkedin.com/company/cv-look"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-600 transition-colors duration-200 transform hover:scale-110"
                      title="LinkedIn-də izləyin"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a
                      href="https://www.instagram.com/cveranet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-pink-500 transition-colors duration-200 transform hover:scale-110"
                      title="Instagram-da izləyin"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C8.396 0 7.989.013 7.041.048 4.928.097 3.105 1.92 3.056 4.032.013 7.989 0 8.396 0 12.017c0 3.624.013 4.09.048 5.014.097 2.112 1.92 3.935 4.032 3.984C7.989 23.987 8.396 24 12.017 24c3.624 0 4.09-.013 5.014-.048 2.112-.097 3.935-1.92 3.984-4.032C23.987 16.011 24 15.604 24 12.017c0-3.624-.013-4.09-.048-5.014C23.905 4.928 22.082 3.105 19.97 3.056 16.011.013 15.604 0 12.017 0zm0 2.171c3.556 0 3.98.015 5.382.087 1.3.06 2.006.276 2.476.458.622.242 1.067.532 1.534.999.466.466.756.911.998 1.534.182.47.398 1.176.458 2.476.072 1.402.087 1.826.087 5.382 0 3.556-.015 3.98-.087 5.382-.06 1.3-.276 2.006-.458 2.476-.242.622-.532 1.067-.999 1.534-.466.466-.911.756-1.534.998-.47.182-1.176.398-2.476.458-1.402.072-1.826.087-5.382.087-3.556 0-3.98-.015-5.382-.087-1.3-.06-2.006-.276-2.476-.458-.622-.242-1.067-.532-1.534-.999-.466-.466-.756-.911-.998-1.534-.182-.47-.398-1.176-.458-2.476-.072-1.402-.087-1.826-.087-5.382 0-3.556.015-3.98.087-5.382.06-1.3.276-2.006.458-2.476.242-.622.532-1.067.999-1.534.466-.466.911-.756 1.534-.998.47-.182 1.176-.398 2.476-.458 1.402-.072 1.826-.087 5.382-.087z" />
                      <path d="M12.017 5.838A6.179 6.179 0 1 0 18.196 12.017 6.179 6.179 0 0 0 12.017 5.838zm0 10.188a4.009 4.009 0 1 1 4.009-4.009 4.009 4.009 0 0 1-4.009 4.009z" />
                      <circle cx="18.406" cy="5.594" r="1.44" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Xidmətlər və Ümumi - Mobile optimized: yan yana */}
              <div className="w-full lg:w-1/2 grid grid-cols-2 gap-6 lg:flex lg:flex-row lg:justify-end lg:gap-10">
                {/* Xidmətlər */}
                <div className="text-left">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-6">Xidmətlər</h3>
                  <ul className="space-y-2 lg:space-y-4">
                    <li><Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-xs sm:text-sm lg:text-base">CV Yaratmaq</Link></li>
                    <li><Link href="/templates" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-xs sm:text-sm lg:text-base">CV Şablonları</Link></li>
                    <li><Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-xs sm:text-sm lg:text-base">Qiymətlər</Link></li>
                  </ul>
                </div>

                {/* Ümumi */}
                <div className="text-left">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-6">Ümumi</h3>
                  <ul className="space-y-2 lg:space-y-4">
                    <li><Link href="/faq" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-xs sm:text-sm lg:text-base">Tez-tez Verilən Suallar</Link></li>
                    <li><Link href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-xs sm:text-sm lg:text-base">İstifadə Şərtləri</Link></li>
                    <li><Link href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-xs sm:text-sm lg:text-base">Məxfilik Siyasəti</Link></li>
                    <li><Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-xs sm:text-sm lg:text-base">Əlaqə</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Alt yazı */}
            <div className="border-t border-gray-200 pt-10 mt-16">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-2">
                  © {new Date().getFullYear()} cvera.net | Bütün hüquqlar qorunur.
                </p>
                <p className="text-gray-400 text-xs">
                  LinkedIn və Süni İntellekt inteqrasiyalı CV yaratma platforması.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

  );
}