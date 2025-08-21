import { useState, useEffect, useCallback } from 'react';
import { FontSettings, DEFAULT_FONT_SETTINGS, FontManager } from '../lib/fontManager';

interface UseFontSettingsReturn {
  fontSettings: FontSettings;
  updateFontSettings: (settings: FontSettings) => void;
  resetFontSettings: () => void;
  isLoading: boolean;
  error: string | null;
}

export const useFontSettings = (cvId?: string): UseFontSettingsReturn => {
  const [fontSettings, setFontSettings] = useState<FontSettings>(DEFAULT_FONT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fontManager = FontManager.getInstance();

  // Load font settings from localStorage or API
  const loadFontSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let loadedSettings = DEFAULT_FONT_SETTINGS;

      // First try to load from localStorage
      const localSettings = localStorage.getItem('cvFontSettings');
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        loadedSettings = { ...DEFAULT_FONT_SETTINGS, ...parsedSettings };
      }

      // If CV ID is provided, try to load specific settings for this CV
      if (cvId) {
        const cvSpecificKey = `cvFontSettings_${cvId}`;
        const cvSpecificSettings = localStorage.getItem(cvSpecificKey);
        if (cvSpecificSettings) {
          const parsedSettings = JSON.parse(cvSpecificSettings);
          loadedSettings = { ...DEFAULT_FONT_SETTINGS, ...parsedSettings };
        }
      }

      // Ensure fontSizes and fontWeight are properly initialized
      const finalSettings: FontSettings = {
        ...loadedSettings,
        fontSizes: loadedSettings.fontSizes ? {
          ...DEFAULT_FONT_SETTINGS.fontSizes,
          ...loadedSettings.fontSizes
        } : DEFAULT_FONT_SETTINGS.fontSizes,
        fontWeight: loadedSettings.fontWeight ? {
          ...DEFAULT_FONT_SETTINGS.fontWeight,
          ...loadedSettings.fontWeight
        } : DEFAULT_FONT_SETTINGS.fontWeight
      };

      // Set the settings in state
      setFontSettings(finalSettings);

      // IMPORTANT: Apply the loaded settings to the DOM immediately
      await fontManager.applyFontSettings(finalSettings);

      console.log('Font settings loaded and applied:', finalSettings);

    } catch (err) {
      console.error('Error loading font settings:', err);
      setError('Şrift tənzimləri yüklənərkən xəta baş verdi');
    } finally {
      setIsLoading(false);
    }
  }, [cvId, fontManager]);

  // Save font settings to localStorage and apply to DOM
  const updateFontSettings = useCallback(async (newSettings: FontSettings) => {
    setIsLoading(true);
    setError(null);

    try {
      // Ensure fontSizes and fontWeight are properly initialized
      const validatedSettings: FontSettings = {
        ...DEFAULT_FONT_SETTINGS,
        ...newSettings,
        // Preserve the new fontSizes if provided
        fontSizes: newSettings.fontSizes ? {
          ...DEFAULT_FONT_SETTINGS.fontSizes,
          ...newSettings.fontSizes
        } : DEFAULT_FONT_SETTINGS.fontSizes,
        // Preserve fontWeight if provided
        fontWeight: newSettings.fontWeight ? {
          ...DEFAULT_FONT_SETTINGS.fontWeight,
          ...newSettings.fontWeight
        } : DEFAULT_FONT_SETTINGS.fontWeight,
        // Keep original fontSize for backward compatibility
        fontSize: Math.max(8, Math.min(18, newSettings.fontSize)),
        lineHeight: Math.max(1.0, Math.min(2.0, newSettings.lineHeight)),
        letterSpacing: Math.max(-2, Math.min(5, newSettings.letterSpacing))
      };

      // Update state immediately
      setFontSettings(validatedSettings);

      // Apply font settings to DOM
      await fontManager.applyFontSettings(validatedSettings);

      // Save to localStorage
      localStorage.setItem('cvFontSettings', JSON.stringify(validatedSettings));

      // If CV ID is provided, save CV-specific settings
      if (cvId) {
        const cvSpecificKey = `cvFontSettings_${cvId}`;
        localStorage.setItem(cvSpecificKey, JSON.stringify(validatedSettings));
      }

      console.log('Font settings saved successfully:', validatedSettings);

    } catch (err) {
      console.error('Error updating font settings:', err);
      setError('Şrift tənzimləri yadda saxlanarkən xəta baş verdi');
      // Revert to previous settings on error
      setFontSettings(fontSettings);
    } finally {
      setIsLoading(false);
    }
  }, [cvId, fontManager, fontSettings]);

  // Reset to default settings
  const resetFontSettings = useCallback(() => {
    updateFontSettings(DEFAULT_FONT_SETTINGS);
  }, [updateFontSettings]);

  // Load settings on mount
  useEffect(() => {
    loadFontSettings();
  }, [loadFontSettings]);

  return {
    fontSettings,
    updateFontSettings,
    resetFontSettings,
    isLoading,
    error
  };
};

export default useFontSettings;
