'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Site dilləri (UI dili)
export type SiteLanguage = 'english' | 'azerbaijani';

interface SiteLanguageContextType {
  siteLanguage: SiteLanguage;
  setSiteLanguage: (language: SiteLanguage) => void;
  toggleSiteLanguage: () => void;
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
    if (savedLanguage && ['english', 'azerbaijani'].includes(savedLanguage)) {
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
    const newLanguage = siteLanguage === 'english' ? 'azerbaijani' : 'english';
    setSiteLanguage(newLanguage);
  };

  const value = {
    siteLanguage,
    setSiteLanguage,
    toggleSiteLanguage
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
