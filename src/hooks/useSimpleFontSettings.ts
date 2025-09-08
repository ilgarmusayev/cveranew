'use client';

import { useState, useEffect } from 'react';

export interface SimpleFontSettings {
  fontFamily: string;
  fontSize: number;
  // Individual font sizes
  titleSize: number;      // Əsas başlıq (h1)
  subtitleSize: number;   // Alt başlıq (h2) 
  headingSize: number;    // Bölmə başlıqları (h3)
  bodySize: number;       // Əsas mətn
  smallSize: number;      // Kiçik mətn
  xsSize: number;         // Ən kiçik mətn
}

interface FontSizeScale {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
}

const DEFAULT_SETTINGS: SimpleFontSettings = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: 14,
  // Individual sizes (in px)
  titleSize: 32,      // 4xl equivalent
  subtitleSize: 20,   // xl equivalent  
  headingSize: 18,    // lg equivalent
  bodySize: 14,       // base equivalent
  smallSize: 12,      // sm equivalent
  xsSize: 10          // xs equivalent
};

// Function to generate dynamic font sizes based on base size (NO SCALE FACTORS)
const generateFontSizes = (baseSize: number): FontSizeScale => {
  return {
    xs: `${baseSize}px`,
    sm: `${baseSize}px`,
    base: `${baseSize}px`,
    lg: `${baseSize}px`,
    xl: `${baseSize}px`,
    '2xl': `${baseSize}px`,
    '3xl': `${baseSize}px`,
    '4xl': `${baseSize}px`,
    '5xl': `${baseSize}px`
  };
};

export const useSimpleFontSettings = (cvId?: string) => {
  const [fontSettings, setFontSettings] = useState<SimpleFontSettings>(DEFAULT_SETTINGS);
  const [, forceUpdate] = useState(0);

  // Force re-render function
  const triggerUpdate = () => forceUpdate(prev => prev + 1);

  // Load settings from localStorage
  useEffect(() => {
    if (cvId) {
      try {
        const key = `simple-font-${cvId}`;
        const saved = localStorage.getItem(key);
        console.log(`🎨 Font Hook Debug - Loading for cvId: ${cvId}, key: ${key}, saved:`, saved);
        
        if (saved) {
          const parsed = JSON.parse(saved);
          const newSettings = {
            fontFamily: parsed.fontFamily || DEFAULT_SETTINGS.fontFamily,
            fontSize: parsed.fontSize || DEFAULT_SETTINGS.fontSize,
            titleSize: parsed.titleSize || DEFAULT_SETTINGS.titleSize,
            subtitleSize: parsed.subtitleSize || DEFAULT_SETTINGS.subtitleSize,
            headingSize: parsed.headingSize || DEFAULT_SETTINGS.headingSize,
            bodySize: parsed.bodySize || DEFAULT_SETTINGS.bodySize,
            smallSize: parsed.smallSize || DEFAULT_SETTINGS.smallSize,
            xsSize: parsed.xsSize || DEFAULT_SETTINGS.xsSize
          };
          console.log('🎨 Font Hook Debug - Parsed settings:', newSettings);
          setFontSettings(newSettings);
        } else {
          console.log('🎨 Font Hook Debug - No saved settings, using defaults:', DEFAULT_SETTINGS);
        }
      } catch (error) {
        console.warn('🎨 Font Hook Debug - Error loading:', error);
      }
    }
  }, [cvId]);

  // Listen for storage changes from other components
  useEffect(() => {
    if (!cvId) return;

    const handleStorageChange = (e: StorageEvent) => {
      const key = `simple-font-${cvId}`;
      if (e.key === key && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          console.log('🎨 Font Hook Debug - Storage changed externally:', parsed);
          setFontSettings({
            fontFamily: parsed.fontFamily || DEFAULT_SETTINGS.fontFamily,
            fontSize: parsed.fontSize || DEFAULT_SETTINGS.fontSize,
            titleSize: parsed.titleSize || DEFAULT_SETTINGS.titleSize,
            subtitleSize: parsed.subtitleSize || DEFAULT_SETTINGS.subtitleSize,
            headingSize: parsed.headingSize || DEFAULT_SETTINGS.headingSize,
            bodySize: parsed.bodySize || DEFAULT_SETTINGS.bodySize,
            smallSize: parsed.smallSize || DEFAULT_SETTINGS.smallSize,
            xsSize: parsed.xsSize || DEFAULT_SETTINGS.xsSize
          });
        } catch (error) {
          console.warn('🎨 Font Hook Debug - Error parsing storage change:', error);
        }
      }
    };

    // Listen for localStorage changes from other tabs/components
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event listener for same-tab changes
    const handleCustomFontChange = (e: CustomEvent) => {
      if (e.detail.cvId === cvId) {
        console.log('🎨 Font Hook Debug - Custom event received:', e.detail.settings);
        setFontSettings(e.detail.settings);
      }
    };

    window.addEventListener('fontSettingsChanged', handleCustomFontChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fontSettingsChanged', handleCustomFontChange as EventListener);
    };
  }, [cvId]);

  // Update settings
  const updateFontSettings = (newSettings: Partial<SimpleFontSettings>) => {
    const updated = { ...fontSettings, ...newSettings };
    console.log(`🎨 Font Hook Debug - Updating for cvId: ${cvId}, new settings:`, updated);
    
    setFontSettings(updated);
    
    if (cvId) {
      try {
        const key = `simple-font-${cvId}`;
        localStorage.setItem(key, JSON.stringify(updated));
        console.log(`🎨 Font Hook Debug - Saved to localStorage with key: ${key}`);
        
        // Export page üçün də sinxronizasiya et
        const exportFormatSettings = {
          fontFamily: updated.fontFamily,
          nameSize: updated.titleSize,
          titleSize: updated.subtitleSize,
          headingSize: updated.headingSize,
          subheadingSize: updated.headingSize,
          bodySize: updated.bodySize,
          smallSize: updated.smallSize,
          headingWeight: 700,
          subheadingWeight: 600,
          bodyWeight: 400,
          smallWeight: 400,
          sectionSpacing: 8
        };
        
        localStorage.setItem('exportFontSettings', JSON.stringify(exportFormatSettings));
        localStorage.setItem('currentFontSettings', JSON.stringify(exportFormatSettings));
        console.log('🚀 Font Hook: Export page üçün font settings sinxronizasiya edildi');
        
        // Dispatch custom event to notify other components
        const event = new CustomEvent('fontSettingsChanged', {
          detail: { cvId, settings: updated }
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.warn('🎨 Font Hook Debug - Error saving:', error);
      }
    }
  };

  return {
    fontSettings,
    fontSizes: generateFontSizes(fontSettings.fontSize), // Backward compatibility
    individualSizes: {
      title: `${fontSettings.titleSize}px`,
      subtitle: `${fontSettings.subtitleSize}px`,
      heading: `${fontSettings.headingSize}px`,
      body: `${fontSettings.bodySize}px`,
      small: `${fontSettings.smallSize}px`,
      xs: `${fontSettings.xsSize}px`
    },
    updateFontSettings,
    triggerUpdate
  };
};

export default useSimpleFontSettings;
