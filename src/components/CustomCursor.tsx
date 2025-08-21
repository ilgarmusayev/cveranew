'use client';

import React from 'react';
import { useCustomCursor } from '@/hooks/useCustomCursor';

export default function CustomCursor() {
  const { cursorPosition, isHovering } = useCustomCursor();

  // Only render on desktop
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-100 ease-out"
      style={{
        transform: `translate(${cursorPosition.x}px, ${cursorPosition.y}px)`,
      }}
    >
      {/* Custom cursor dot */}
      <div
        className={`relative -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
          isHovering 
            ? 'w-8 h-8 bg-blue-500/30 border-2 border-blue-500' 
            : 'w-4 h-4 bg-blue-600'
        } rounded-full`}
      />

      {/* Cursor trail effect for hovering */}
      {isHovering && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-blue-500/10 rounded-full animate-ping" />
      )}
    </div>
  );
}
