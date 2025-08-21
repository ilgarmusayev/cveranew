import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import TawkToWidget from "@/components/TawkToWidget";
import CustomCursor from "@/components/CustomCursor";
import AOSProvider from "@/components/providers/AOSProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "CVERA — AI və LinkedIn ilə Peşəkar CV Yaratma",
  description: "AI texnologiyası ilə dəstəklənən CVERA platforması, peşəkar CV-nizi tez və rahat hazırlamağa imkan verir., LinkedIn məlumatlarınızı idxal edin və zəngin şablonlar ilə CV-nizi fərdiləşdirin.Peşəkar dizaynlı şablonlar və süni intellekt dəstəyi ilə CV yaratmaq indi daha asandır!",
  keywords: "CVERA, CVera, cvera, cveranet, CVERA.NET, cvera.net, cv yaratmaq, cv yarat, cv yaz, ai ilə cv, ai ilə cv yaratmaq, cvera, resume yarat, azerbaycanca cv, cv yazmaq proqramı, online cv yaratmaq, canva cv, cv şablonları, professional cv, professional cv yaratmaq, professional cv yazmaq, professional cv yarat, professional cv yazmaq proqramı, professional cv online, professional cv azerbaycanca, professional cv canva, cv yaratma, cv yazma, cv yazmaq, cv yaratma proqramı, cv yazmaq proqramı, cv yaratma online, cv yazma online, cv yaratma azerbaycanca, cv yazma azerbaycanca, cv yaratma canva, professional resume, professional resume create, professional resume write, professional resume create program, professional resume online, professional resume azerbaijani, professional resume canva",
  applicationName: "CVERA",
  robots: "index, follow",
  authors: [{ name: "CVERA Team" }],
  creator: "CVERA",
  publisher: "CVERA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cvera.net'),
  alternates: {
    canonical: '/',
    languages: {
      'x-default': '/',
      'az': '/',
      'az-AZ': '/',
      'en': '/en',
      'en-US': '/en',
    },
  },
  openGraph: {
    title: "CVERA — Süni İntellekt və LinkedIn İnteqrasiyası ilə Peşəkar CV Yaratma Platforması",
    description: "AI texnologiyası ilə dəstəklənən CVERA platforması, peşəkar CV-nizi tez və rahat hazırlamağa imkan verir., LinkedIn məlumatlarınızı idxal edin və zəngin şablonlar ilə CV-nizi fərdiləşdirin.Peşəkar dizaynlı şablonlar və süni intellekt dəstəyi ilə CV yaratmaq indi daha asandır!",
    url: 'https://cvera.net',
    siteName: 'CVERA',
    locale: 'az_AZ',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CVERA - Süni İntellektlə və LinkedIn İnteqrasiyası ilə Peşəkar CV Yaratma Platforması',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "CVERA — Süni İntellekt və LinkedIn İnteqrasiyası ilə Peşəkar CV Yaratma Platforması",
    description: "AI texnologiyası ilə dəstəklənən CVERA platforması, peşəkar CV-nizi tez və rahat hazırlamağa imkan verir., LinkedIn məlumatlarınızı idxal edin və zəngin şablonlar ilə CV-nizi fərdiləşdirin.Peşəkar dizaynlı şablonlar və süni intellekt dəstəyi ilə CV yaratmaq indi daha asandır!",
    images: ['/twitter-image.jpg'],
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className="scroll-smooth">
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased overflow-x-hidden`}
      >
        <ToastProvider>
          <AuthProvider>
            <AOSProvider>
              <main className="page-content min-h-screen">
                {children}
              </main>
            </AOSProvider>
          </AuthProvider>
        </ToastProvider>
        <SpeedInsights />
        <GoogleAnalytics />
        <TawkToWidget />
        <CustomCursor />
      </body>
    </html>
  );
}
