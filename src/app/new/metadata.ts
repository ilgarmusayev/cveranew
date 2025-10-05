import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yeni CV Yarat | CVERA — Pulsuz Onlayn CV Yaratmaq',
  description: 'LinkedIn məlumatlarınızı idxal edərək və ya sıfırdan peşəkar CV yaradın. AI dəstəyi, 10+ şablon, pulsuz PDF yükləmə. Azərbaycan, İngilis və Rus dillərində CV yaratmaq artıq asan!',
  keywords: 'cv yaratmaq, yeni cv yarat, cv yaz, online cv, pulsuz cv, linkedin cv, ai cv yaratmaq, cv şablonları, azerbaycan cv, professional cv maker, resume builder, free cv creator, cv yaratmaq',
  openGraph: {
    title: 'Yeni CV Yarat | CVERA — Pulsuz Onlayn CV Yaratma',
    description: 'LinkedIn məlumatlarınızı idxal edərək və ya sıfırdan peşəkar CV yaradın. AI dəstəyi, 10+ şablon, pulsuz PDF yükləmə.',
    url: 'https://cvera.net/new',
    siteName: 'CVERA',
    locale: 'az_AZ',
    type: 'website',
    images: [
      {
        url: 'https://cvera.net/og-cv-create.jpg',
        width: 1200,
        height: 630,
        alt: 'CVERA - Pulsuz CV Yaratma Platforması',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yeni CV Yarat | CVERA — Pulsuz Onlayn CV Yaratmaq',
    description: 'LinkedIn məlumatlarınızı idxal edərək və ya sıfırdan peşəkar CV yaradın. AI dəstəyi, 10+ şablon, pulsuz PDF yükləmə.',
    images: ['https://cvera.net/twitter-cv-create.jpg'],
  },
  alternates: {
    canonical: 'https://cvera.net/new',
    languages: {
      'az': 'https://cvera.net/new',
      'en': 'https://cvera.net/en/new',
      'ru': 'https://cvera.net/ru/new',
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
