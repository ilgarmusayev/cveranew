import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Motivasiya Məktubu | CVERA — Universitet və Təqaüd Müraciəti',
  description: 'Universitet qəbulu, təqaüd proqramları və akademik müraciətlər üçün güclü motivasiya məktubu yaradın. AI köməyi ilə professional məktub hazırlayın. Pulsuz DOCX yükləmə!',
  keywords: 'motivasiya məktubu, motivation letter, universitet müraciəti, təqaüd müraciəti, akademik məktub, scholarship application, university application, motivation letter nümunəsi',
  openGraph: {
    title: 'Motivasiya Məktubu | CVERA — Universitet və Təqaüd Müraciəti',
    description: 'Universitet qəbulu, təqaüd proqramları və akademik müraciətlər üçün güclü motivasiya məktubu yaradın. AI köməyi ilə professional məktub hazırlayın.',
    url: 'https://cvera.net/motivationletter',
    siteName: 'CVERA',
    locale: 'az_AZ',
    type: 'website',
    images: [
      {
        url: 'https://cvera.net/og-motivation.jpg',
        width: 1200,
        height: 630,
        alt: 'CVERA - Motivasiya Məktubu Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Motivasiya Məktubu | CVERA — Universitet və Təqaüd Müraciəti',
    description: 'Universitet qəbulu, təqaüd proqramları və akademik müraciətlər üçün güclü motivasiya məktubu yaradın.',
    images: ['https://cvera.net/twitter-motivation.jpg'],
  },
  alternates: {
    canonical: 'https://cvera.net/motivationletter',
    languages: {
      'az': 'https://cvera.net/motivationletter',
      'en': 'https://cvera.net/en/motivationletter',
      'ru': 'https://cvera.net/ru/motivationletter',
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
