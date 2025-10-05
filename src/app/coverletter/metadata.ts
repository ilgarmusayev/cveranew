import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cover Letter Yarat | CVERA — AI ilə Peşəkar Məktub',
  description: 'AI dəstəyi ilə peşəkar cover letter yaradın. CV-nizdən avtomatik məlumat çəkərək iş müraciəti üçün güclü məktub hazırlayın. Pulsuz DOCX yükləmə!',
  keywords: 'cover letter, motivasiya məktubu, motivation letter, iş müraciəti, ai cover letter, cover letter yaratmaq, motivasiya məktubu nümunəsi, cover letter generator',
  openGraph: {
    title: 'Cover Letter Yarat | CVERA — AI ilə Peşəkar Məktub',
    description: 'AI dəstəyi ilə peşəkar cover letter yaradın. CV-nizdən avtomatik məlumat çəkərək iş müraciəti üçün güclü məktub hazırlayın.',
    url: 'https://cvera.net/coverletter',
    siteName: 'CVERA',
    locale: 'az_AZ',
    type: 'website',
    images: [
      {
        url: 'https://cvera.net/og-coverletter.jpg',
        width: 1200,
        height: 630,
        alt: 'CVERA - AI Cover Letter Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cover Letter Yarat | CVERA — AI ilə Peşəkar Məktub',
    description: 'AI dəstəyi ilə peşəkar cover letter yaradın.',
    images: ['https://cvera.net/twitter-coverletter.jpg'],
  },
  alternates: {
    canonical: 'https://cvera.net/coverletter',
    languages: {
      'az': 'https://cvera.net/coverletter',
      'en': 'https://cvera.net/en/coverletter',
      'ru': 'https://cvera.net/ru/coverletter',
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
