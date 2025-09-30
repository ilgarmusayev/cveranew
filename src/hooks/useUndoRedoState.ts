import { useCallback, useRef, useState } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * Custom hook to manage undo/redo functionality for complex state changes
 * including drag & drop operations, additions, deletions, and reordering
 */
export const useUndoRedoState = <T>(initialState: T) => {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: []
  });
  
  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const saveState = useCallback((newState: T, action?: string) => {
    setState(prev => ({
      past: [...prev.past, prev.present].slice(-50), // Keep max 50 states
      present: newState,
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    if (canUndo) {
      setState(prev => {
        const newPast = [...prev.past];
        const newPresent = newPast.pop()!;
        return {
          past: newPast,
          present: newPresent,
          future: [prev.present, ...prev.future]
        };
      });
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setState(prev => {
        const newFuture = [...prev.future];
        const newPresent = newFuture.shift()!;
        return {
          past: [...prev.past, prev.present],
          present: newPresent,
          future: newFuture
        };
      });
    }
  }, [canRedo]);

  const reset = useCallback((newInitialState: T) => {
    setState({
      past: [],
      present: newInitialState,
      future: []
    });
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey)) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    }
  }, [undo, redo]);

  return {
    state: state.present,
    canUndo,
    canRedo,
    saveState,
    undo,
    redo,
    reset,
    handleKeyDown
  };
};