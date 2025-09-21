'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Site dilləri (UI dili)
export type SiteLanguage = 'english' | 'azerbaijani' | 'russian';

interface SiteLanguageContextType {
  siteLanguage: SiteLanguage;
  setSiteLanguage: (language: SiteLanguage) => void;
  toggleSiteLanguage: () => void;
  getLanguageDisplay: (language: SiteLanguage) => { code: string; name: string; flag: string };
}

const SiteLanguageContext = createContext<SiteLanguageContextType | undefined>(undefined);

interface SiteLanguageProviderProps {
  children: ReactNode;
}

export function SiteLanguageProvider({ children }: SiteLanguageProviderProps) {
  const [siteLanguage, setSiteLanguageState] = useState<SiteLanguage>('azerbaijani');

  // Site dilini local storage-dan yüklə
  useEffect(() => {
    const savedLanguage = localStorage.getItem('siteLanguage') as SiteLanguage;
    if (savedLanguage && ['english', 'azerbaijani', 'russian'].includes(savedLanguage)) {
      setSiteLanguageState(savedLanguage);
    }
  }, []);

  // Site dilini dəyişdirən funksiya
  const setSiteLanguage = (language: SiteLanguage) => {
    setSiteLanguageState(language);
    localStorage.setItem('siteLanguage', language);
  };

  // Site dilini toggle edən funksiya
  const toggleSiteLanguage = () => {
    const languages: SiteLanguage[] = ['azerbaijani', 'english', 'russian'];
    const currentIndex = languages.indexOf(siteLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setSiteLanguage(languages[nextIndex]);
  };

  // Dil məlumatlarını qaytaran funksiya
  const getLanguageDisplay = (language: SiteLanguage) => {
    const languageData = {
      azerbaijani: { code: 'AZ', name: 'Azərbaycan', flag: '🇦🇿' },
      english: { code: 'EN', name: 'English', flag: '🇺🇸' },
      russian: { code: 'RU', name: 'Русский', flag: '🇷🇺' }
    };
    return languageData[language];
  };

  const value = {
    siteLanguage,
    setSiteLanguage,
    toggleSiteLanguage,
    getLanguageDisplay
  };

  return (
    <SiteLanguageContext.Provider value={value}>
      {children}
    </SiteLanguageContext.Provider>
  );
}

export function useSiteLanguage() {
  const context = useContext(SiteLanguageContext);
  if (context === undefined) {
    throw new Error('useSiteLanguage must be used within a SiteLanguageProvider');
  }
  return context;
}
