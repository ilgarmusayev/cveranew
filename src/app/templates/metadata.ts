import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CV Şablonları | CVERA — 10+ Professional CV Template',
  description: '10+ peşəkar CV şablonundan seçim edin. Modern, ATS-friendly, klassik və yaradıcı dizaynlar. Pulsuz və premium CV şablonları. Aurora, Clarity, Essence, Vertex və daha çox!',
  keywords: 'cv şablonları, cv templates, professional cv, modern cv template, ats friendly cv, cv dizaynı, resume templates, free cv templates, premium cv şablonları, azerbaycan cv şablonları',
  openGraph: {
    title: 'CV Şablonları | CVERA — 10+ Professional CV Template',
    description: '10+ peşəkar CV şablonundan seçim edin. Modern, ATS-friendly, klassik və yaradıcı dizaynlar. Pulsuz və premium CV şablonları.',
    url: 'https://cvera.net/templates',
    siteName: 'CVERA',
    locale: 'az_AZ',
    type: 'website',
    images: [
      {
        url: 'https://cvera.net/og-templates.jpg',
        width: 1200,
        height: 630,
        alt: 'CVERA - Professional CV Şablonları',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CV Şablonları | CVERA — 10+ Professional CV Template',
    description: '10+ peşəkar CV şablonundan seçim edin. Modern, ATS-friendly, klassik və yaradıcı dizaynlar.',
    images: ['https://cvera.net/twitter-templates.jpg'],
  },
  alternates: {
    canonical: 'https://cvera.net/templates',
    languages: {
      'az': 'https://cvera.net/templates',
      'en': 'https://cvera.net/en/templates',
      'ru': 'https://cvera.net/ru/templates',
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
