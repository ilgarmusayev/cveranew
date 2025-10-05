import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'İdarəetmə Paneli | CVERA — CV-lərinizi İdarə Edin',
  description: 'CV-lərinizi idarə edin, redaktə edin və yeni CV yaradın. LinkedIn idxalı, AI köməyi, motivasiya məktubu və cover letter yaratma. Bütün CV-ləriniz bir yerdə!',
  keywords: 'cv dashboard, cv idare, cv redakte, my cvs, mənim cvlərim, cv panel, cv yönetimi, cv management, resume dashboard',
  openGraph: {
    title: 'İdarəetmə Paneli | CVERA — CV-lərinizi İdarə Edin',
    description: 'CV-lərinizi idarə edin, redaktə edin və yeni CV yaradın. LinkedIn idxalı, AI köməyi, motivasiya məktubu və cover letter yaratma.',
    url: 'https://cvera.net/dashboard',
    siteName: 'CVERA',
    locale: 'az_AZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'İdarəetmə Paneli | CVERA — CV-lərinizi İdarə Edin',
    description: 'CV-lərinizi idarə edin, redaktə edin və yeni CV yaradın. LinkedIn idxalı, AI köməyi, motivasiya məktubu və cover letter yaratma.',
  },
  alternates: {
    canonical: 'https://cvera.net/dashboard',
  },
  robots: {
    index: false, // Dashboard indexlənməməlidir - private area
    follow: false,
    noarchive: true,
  },
};
