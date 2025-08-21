'use client';

import { useState, useEffect, useCallback } from 'react';

interface CursorPosition {
  x: number;
  y: number;
}

export function useCustomCursor() {
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursorPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  useEffect(() => {
    // Only enable custom cursor on desktop (not mobile/tablet)
    if (typeof window === 'undefined') return;

    const isDesktop = window.innerWidth >= 1024; // lg breakpoint
    if (!isDesktop) return;

    // Add mouse move listener
    window.addEventListener('mousemove', handleMouseMove);

    // Add hover listeners to interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input, [role="button"], .clickable');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    // Hide default cursor completely
    document.body.style.cursor = 'none';

    // Create global style to hide cursor on most elements but allow normal cursor on form inputs
    const style = document.createElement('style');
    style.id = 'custom-cursor-style';
    style.textContent = `
      body, div, span, p, h1, h2, h3, h4, h5, h6 { 
        cursor: none !important; 
      }
      button, a, [role="button"], .clickable {
        cursor: none !important;
      }
      /* Allow normal cursor on form inputs for better UX */
      input[type="checkbox"], 
      input[type="checkbox"] *,
      input[type="radio"], 
      input[type="range"], 
      input[type="file"],
      select,
      textarea,
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="number"],
      input[type="month"],
      input[type="date"],
      label[for],
      label[htmlFor] {
        cursor: auto !important;
      }
      /* Specifically for checkbox labels and containers */
      label[for]:hover {
        cursor: pointer !important;
      }
      
      /* COMPLETELY DISABLE CUSTOM CURSOR ON CHECKBOX AREAS */
      .checkbox-wrapper,
      .checkbox-wrapper *,
      .checkbox-button,
      .checkbox-button *,
      .checkbox-label,
      .checkbox-label *,
      .checkbox-container,
      .checkbox-container *,
      .form-control,
      .form-control *,
      [role="checkbox"],
      [role="checkbox"] *,
      .bg-blue-50,
      .bg-blue-50 *,
      .bg-gray-50,
      .bg-gray-50 *,
      button[aria-checked],
      button[aria-checked] *,
      label[style*="cursor: default"],
      label[style*="cursor: default"] *,
      /* Force default cursor on all checkbox related elements */
      div:has(button[aria-checked]),
      div:has(button[aria-checked]) *,
      div:has(input[type="checkbox"]),
      div:has(input[type="checkbox"]) *,
      /* Override any cursor none for date range inputs */
      div:has([class*="DateRangeInput"]),
      div:has([class*="DateRangeInput"]) *,
      [class*="DateRangeInput"],
      [class*="DateRangeInput"] * {
        cursor: default !important;
      }`;

    // Remove existing style if any
    const existingStyle = document.getElementById('custom-cursor-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    document.head.appendChild(style);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });

      // Restore default cursor
      document.body.style.cursor = 'auto';

      // Remove custom style
      const styleToRemove = document.getElementById('custom-cursor-style');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave]);

  return { cursorPosition, isHovering };
}
