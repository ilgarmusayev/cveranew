import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tez-tez Verilən Suallar (FAQ) | CVERA — CV Haqqında Hər Şey',
  description: 'CVERA haqqında ən çox verilən sualların cavabları: CV necə yaradılır? LinkedIn idxalı necə işləyir? Şablonlar pulsuzmu? AI xüsusiyyətləri hansılardır? Premium nədir? və s.',
  keywords: 'cvera faq, cv sualları, cv haqqında, linkedin idxal sualları, cv şablonları sualları, ai cv sualları, cvera premium, cvera pulsuz',
  openGraph: {
    title: 'Tez-tez Verilən Suallar (FAQ) | CVERA — CV Haqqında Hər Şey',
    description: 'CVERA haqqında ən çox verilən sualların cavabları: CV necə yaradılır? LinkedIn idxalı necə işləyir? Şablonlar pulsuzmu?',
    url: 'https://cvera.net/faq',
    siteName: 'CVERA',
    locale: 'az_AZ',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Tez-tez Verilən Suallar (FAQ) | CVERA',
    description: 'CVERA haqqında ən çox verilən sualların cavabları.',
  },
  alternates: {
    canonical: 'https://cvera.net/faq',
    languages: {
      'az': 'https://cvera.net/faq',
      'en': 'https://cvera.net/en/faq',
      'ru': 'https://cvera.net/ru/faq',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
