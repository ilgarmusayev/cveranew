'use client';

import React from 'react';

interface AutoSaveStatusProps {
  isEnabled: boolean;
  lastSaved?: Date;
  isSaving?: boolean;
}

export function AutoSaveStatus({ isEnabled, lastSaved, isSaving }: AutoSaveStatusProps) {
  if (!isEnabled) return null;

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500">
      <div className="flex items-center space-x-1">
        {isSaving ? (
          <>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-spin"></div>
            <span>Saxlanılır...</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Avtomatik saxlama aktiv</span>
          </>
        )}
      </div>
      {lastSaved && !isSaving && (
        <span>
          Son saxlanma: {lastSaved.toLocaleTimeString('az-AZ', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
    </div>
  );
}
