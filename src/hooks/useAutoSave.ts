import { useEffect, useRef, useCallback } from 'react';
import { useNotification } from '@/components/ui/Toast';

interface UseAutoSaveProps {
  data: any;
  saveFunction: () => Promise<void>;
  delay?: number; // milliseconds
  enabled?: boolean;
}

export function useAutoSave({ 
  data, 
  saveFunction, 
  delay = 3000, // 3 saniyə gecikdirmə 
  enabled = true 
}: UseAutoSaveProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isSavingRef = useRef(false);
  const { showError } = useNotification();

  const debouncedSave = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    const currentDataString = JSON.stringify(data);
    
    // Əgər data dəyişməyibsə, save etməyək
    if (currentDataString === lastSavedDataRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      await saveFunction();
      lastSavedDataRef.current = currentDataString;
      
      // Discrete success notification (çox sıx olmamaq üçün)
      console.log('✅ Auto-saved successfully');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      showError('Avtomatik saxlama zamanı xəta baş verdi');
    } finally {
      isSavingRef.current = false;
    }
  }, [data, saveFunction, enabled, showError]);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto save
    timeoutRef.current = setTimeout(() => {
      debouncedSave();
    }, delay);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debouncedSave, delay, enabled]);

  // Manual save trigger
  const triggerSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    debouncedSave();
  }, [debouncedSave]);

  return {
    triggerSave,
    isSaving: isSavingRef.current
  };
}
