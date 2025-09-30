import { useCallback } from 'react';

/**
 * Custom hook to preserve native browser undo/redo functionality in form inputs
 * Use this on any input, textarea, or form element to enable Ctrl+Z and Ctrl+Y
 */
export const useUndoRedo = () => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Allow native undo/redo operations (Ctrl+Z, Ctrl+Y, Cmd+Z, Cmd+Y)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y')) {
      // Don't preventDefault - let browser handle input field undo/redo naturally
      return;
    }
  }, []);

  return { handleKeyDown };
};

/**
 * Custom hook for components that need both input field undo/redo AND custom state undo/redo
 * Use this when you have a component with both input fields and drag/drop or complex operations
 */
export const useHybridUndoRedo = (customUndoHandler?: () => void, customRedoHandler?: () => void) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey)) {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
      
      if (!isInputField && (customUndoHandler || customRedoHandler)) {
        // We're not in an input field, use custom handlers
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          customUndoHandler?.();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          customRedoHandler?.();
        }
      }
      // If we're in an input field, let browser handle it naturally
    }
  }, [customUndoHandler, customRedoHandler]);

  return { handleKeyDown };
};