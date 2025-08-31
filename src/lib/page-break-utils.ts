/**
 * Utility functions for automatic page break management in CV templates
 */

import React from 'react';

// A4 dimensions in mm and pixels
export const A4_DIMENSIONS = {
  width: 210, // mm
  height: 297, // mm
  widthPx: 794, // pixels at 96 DPI
  heightPx: 1123, // pixels at 96 DPI
  marginDefault: 20, // mm
};

// Calculate content area dimensions
export const getContentDimensions = (margins = { top: 20, bottom: 20, left: 20, right: 20 }) => ({
  width: A4_DIMENSIONS.width - margins.left - margins.right,
  height: A4_DIMENSIONS.height - margins.top - margins.bottom,
  widthPx: A4_DIMENSIONS.widthPx - (margins.left + margins.right) * 3.779, // mm to px
  heightPx: A4_DIMENSIONS.heightPx - (margins.top + margins.bottom) * 3.779,
});

// Estimate content height based on content type
export const estimateContentHeight = (content: any, type: string): number => {
  if (!content) return 0;
  
  const baseHeights = {
    personalInfo: 120,
    summary: 80,
    experience: 60, // per item
    education: 50, // per item
    skills: 40,
    languages: 35,
    projects: 70, // per item
    certifications: 45, // per item
    volunteer: 55, // per item
    customSection: 50, // per item
  };
  
  if (Array.isArray(content)) {
    return content.length * (baseHeights[type as keyof typeof baseHeights] || 50);
  }
  
  return baseHeights[type as keyof typeof baseHeights] || 40;
};

// Determine if content should break across pages
export const shouldBreakPage = (
  currentHeight: number,
  newContentHeight: number,
  maxPageHeight: number,
  breakThreshold = 0.8 // 80% of page height
): boolean => {
  const totalHeight = currentHeight + newContentHeight;
  return totalHeight > maxPageHeight * breakThreshold;
};

// Split CV sections into pages
export const splitContentIntoPages = (
  sections: any[],
  pageHeight = getContentDimensions().heightPx
): any[][] => {
  const pages: any[][] = [];
  let currentPage: any[] = [];
  let currentPageHeight = 0;
  
  for (const section of sections) {
    const sectionHeight = estimateContentHeight(section.content, section.type);
    
    // If adding this section would exceed page height, start new page
    if (currentPageHeight + sectionHeight > pageHeight && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [section];
      currentPageHeight = sectionHeight;
    } else {
      currentPage.push(section);
      currentPageHeight += sectionHeight;
    }
  }
  
  // Add the last page if it has content
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  
  return pages.length > 0 ? pages : [[]];
};

// Generate page break markers for preview
export const generatePageBreakMarkers = (
  contentHeight: number,
  pageHeight = getContentDimensions().heightPx
): number[] => {
  const markers: number[] = [];
  let currentPosition = pageHeight;
  
  while (currentPosition < contentHeight) {
    markers.push(currentPosition);
    currentPosition += pageHeight;
  }
  
  return markers;
};

// CSS class helpers for page breaks
export const pageBreakClasses = {
  avoid: 'page-break-inside: avoid !important; break-inside: avoid !important;',
  allow: 'page-break-inside: auto !important; break-inside: auto !important;',
  force: 'page-break-before: always !important; break-before: page !important;',
  avoidAfter: 'page-break-after: avoid !important; break-after: avoid !important;',
};

// Generate inline styles for page break control
export const getPageBreakStyles = (type: 'avoid' | 'allow' | 'force' | 'avoidAfter') => ({
  pageBreakInside: type === 'avoid' ? 'avoid' : type === 'allow' ? 'auto' : undefined,
  pageBreakBefore: type === 'force' ? 'always' : undefined,
  pageBreakAfter: type === 'avoidAfter' ? 'avoid' : undefined,
  breakInside: type === 'avoid' ? 'avoid' : type === 'allow' ? 'auto' : undefined,
  breakBefore: type === 'force' ? 'page' : undefined,
  breakAfter: type === 'avoidAfter' ? 'avoid' : undefined,
});

// React hook for automatic page break management
export const useAutoPageBreaks = (contentRef: React.RefObject<HTMLElement>) => {
  const [pageCount, setPageCount] = React.useState(1);
  const [pageBreaks, setPageBreaks] = React.useState<number[]>([]);
  
  React.useEffect(() => {
    const updatePageBreaks = () => {
      if (!contentRef.current) return;
      
      const contentHeight = contentRef.current.scrollHeight;
      const pageHeight = getContentDimensions().heightPx;
      
      const breaks = generatePageBreakMarkers(contentHeight, pageHeight);
      setPageBreaks(breaks);
      setPageCount(breaks.length + 1);
    };
    
    updatePageBreaks();
    
    // Update on resize
    const resizeObserver = new ResizeObserver(updatePageBreaks);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [contentRef]);
  
  return { pageCount, pageBreaks };
};

// Helper data for page break indicators (to be used in JSX components)
export const createPageBreakIndicatorData = (pageBreaks: number[]) => {
  return pageBreaks.map((breakPosition, index) => ({
    id: `page-break-${index}`,
    position: breakPosition,
    pageNumber: index + 2,
    style: {
      position: 'absolute' as const,
      top: `${breakPosition}px`,
      left: 0,
      right: 0,
      zIndex: 1000,
    }
  }));
};

export default {
  A4_DIMENSIONS,
  getContentDimensions,
  estimateContentHeight,
  shouldBreakPage,
  splitContentIntoPages,
  generatePageBreakMarkers,
  pageBreakClasses,
  getPageBreakStyles,
  useAutoPageBreaks,
  createPageBreakIndicatorData,
};
