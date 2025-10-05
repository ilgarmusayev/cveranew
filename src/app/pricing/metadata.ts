import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Qiymətlər | CVERA — Pulsuz, Populyar və Premium Planlar',
  description: 'CVERA qiymətləri: Pulsuz plan (2 CV, əsas şablonlar), Populyar plan (5 CV/gün, AI dəstəyi, 5 AZN/ay), Premium plan (limitsiz CV, bütün şablonlar, 10 AZN/ay). İndi başlayın!',
  keywords: 'cvera qiymətləri, cv pricing, pulsuz cv, premium cv, cv abonelik, cv paketi, cv plans, azerbaycan cv qiymətləri, professional cv price',
  openGraph: {
    title: 'Qiymətlər | CVERA — Pulsuz, Populyar və Premium Planlar',
    description: 'Pulsuz plan (2 CV, əsas şablonlar), Populyar plan (5 CV/gün, AI dəstəyi, 5 AZN/ay), Premium plan (limitsiz CV, bütün şablonlar, 10 AZN/ay).',
    url: 'https://cvera.net/pricing',
    siteName: 'CVERA',
    locale: 'az_AZ',
    type: 'website',
    images: [
      {
        url: 'https://cvera.net/og-pricing.jpg',
        width: 1200,
        height: 630,
        alt: 'CVERA - Qiymətlər və Planlar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qiymətlər | CVERA — Pulsuz, Populyar və Premium Planlar',
    description: 'Pulsuz plan (2 CV), Populyar plan (5 AZN/ay), Premium plan (10 AZN/ay). İndi başlayın!',
    images: ['https://cvera.net/twitter-pricing.jpg'],
  },
  alternates: {
    canonical: 'https://cvera.net/pricing',
    languages: {
      'az': 'https://cvera.net/pricing',
      'en': 'https://cvera.net/en/pricing',
      'ru': 'https://cvera.net/ru/pricing',
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
