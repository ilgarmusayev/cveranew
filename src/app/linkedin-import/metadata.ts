import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LinkedIn İdxal | CVERA — LinkedIn Profilindən CV Yaradın',
  description: 'LinkedIn profilinizi bir kliklə idxal edib avtomatik CV yaradın. İş təcrübəsi, təhsil, bacarıqlar və sertifikatlarınız avtomatik əlavə olunur. Tez və rahat!',
  keywords: 'linkedin cv, linkedin idxal, linkedin import, linkedin resume, linkedin profile cv, linkedin to cv, cv from linkedin, azerbaycan linkedin cv',
  openGraph: {
    title: 'LinkedIn İdxal | CVERA — LinkedIn Profilindən CV Yaradın',
    description: 'LinkedIn profilinizi bir kliklə idxal edib avtomatik CV yaradın. İş təcrübəsi, təhsil, bacarıqlar və sertifikatlarınız avtomatik əlavə olunur.',
    url: 'https://cvera.net/linkedin-import',
    siteName: 'CVERA',
    locale: 'az_AZ',
    type: 'website',
    images: [
      {
        url: 'https://cvera.net/og-linkedin.jpg',
        width: 1200,
        height: 630,
        alt: 'CVERA - LinkedIn İdxal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkedIn İdxal | CVERA — LinkedIn Profilindən CV Yaradın',
    description: 'LinkedIn profilinizi bir kliklə idxal edib avtomatik CV yaradın.',
    images: ['https://cvera.net/twitter-linkedin.jpg'],
  },
  alternates: {
    canonical: 'https://cvera.net/linkedin-import',
    languages: {
      'az': 'https://cvera.net/linkedin-import',
      'en': 'https://cvera.net/en/linkedin-import',
      'ru': 'https://cvera.net/ru/linkedin-import',
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
