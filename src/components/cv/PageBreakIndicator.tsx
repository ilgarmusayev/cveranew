'use client';

import React, { useEffect, useState } from 'react';

interface PageBreakIndicatorProps {
    children: React.ReactNode;
    className?: string;
    showIndicators?: boolean;
    pageHeight?: number; // in mm
    pageWidth?: number; // in mm
    marginTop?: number; // in mm
    marginBottom?: number; // in mm
    marginLeft?: number; // in mm
    marginRight?: number; // in mm
}

const PageBreakIndicator: React.FC<PageBreakIndicatorProps> = ({
    children,
    className = '',
    showIndicators = true,
    pageHeight = 297, // A4 height in mm
    pageWidth = 210, // A4 width in mm
    marginTop = 20,
    marginBottom = 20,
    marginLeft = 20,
    marginRight = 20
}) => {
    const [pageBreaks, setPageBreaks] = useState<number[]>([]);
    const [sectionPositions, setSectionPositions] = useState<{ element: HTMLElement; top: number; bottom: number; height: number }[]>([]);
    
    // Calculate content area
    const contentHeight = pageHeight - marginTop - marginBottom; // 257mm for A4 with 20mm margins
    const contentWidth = pageWidth - marginLeft - marginRight; // 170mm for A4 with 20mm margins
    
    useEffect(() => {
        if (!showIndicators) return;
        
        // Calculate page breaks and check section positioning
        const calculatePageBreaksAndSections = () => {
            const container = document.querySelector('.cv-content-with-breaks') || document.querySelector('.cv-template');
            if (!container) return;
            
            const containerHeight = container.scrollHeight;
            // More accurate mm to px conversion for A4
            const mmToPx = 3.7795275591; // 96 DPI conversion
            const contentHeightPx = contentHeight * mmToPx; // 257mm in pixels (297 - 40mm margins)
            const marginTopPx = marginTop * mmToPx; // 20mm in pixels
            const marginBottomPx = marginBottom * mmToPx; // 20mm in pixels
            
            const breaks: number[] = [];
            let currentPosition = contentHeightPx + marginTopPx; // First break at end of content area + top margin
            
            while (currentPosition < containerHeight + marginTopPx) {
                breaks.push(currentPosition);
                currentPosition += contentHeightPx; // Add content height for next break (not including margins)
            }
            
            setPageBreaks(breaks);
            
            // Now detect sections that fall into problematic areas and reposition them
            detectAndRepositionSections(container, breaks, mmToPx, marginTopPx, marginBottomPx);
        };
        
        // Function to detect sections in padding areas and reposition them
        const detectAndRepositionSections = (container: Element, breaks: number[], mmToPx: number, marginTopPx: number, marginBottomPx: number) => {
            // Find all sections/major content blocks
            const sections = container.querySelectorAll('.cv-section, section, .section-item, [class*="section"], [class*="experience-item"], [class*="education-item"], [class*="project-item"]');
            const problematicSections: HTMLElement[] = [];
            const sectionData: { element: HTMLElement; top: number; bottom: number; height: number }[] = [];
            
            sections.forEach((section) => {
                if (!(section instanceof HTMLElement)) return;
                
                const rect = section.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // Calculate relative position within the container
                const relativeTop = rect.top - containerRect.top;
                const relativeBottom = relativeTop + rect.height;
                const sectionHeight = rect.height;
                
                sectionData.push({
                    element: section,
                    top: relativeTop,
                    bottom: relativeBottom,
                    height: sectionHeight
                });
                
                // Check if section falls into problematic areas for each page
                for (let i = 0; i < breaks.length; i++) {
                    const pageStartY = i === 0 ? 0 : breaks[i - 1] + marginTopPx;
                    const pageEndY = breaks[i];
                    const pageTopPaddingEnd = pageStartY + marginTopPx;
                    const pageBottomPaddingStart = pageEndY - marginBottomPx;
                    
                    // Check if section starts in top padding area
                    if (relativeTop >= pageStartY && relativeTop <= pageTopPaddingEnd) {
                        console.log(`🚨 Section in TOP padding area on page ${i + 1}:`, section.className, { relativeTop, pageTopPaddingEnd });
                        problematicSections.push(section);
                        section.setAttribute('data-needs-reposition', 'top-padding');
                        section.setAttribute('data-page-conflict', (i + 1).toString());
                    }
                    
                    // Check if section ends in bottom padding area
                    if (relativeBottom >= pageBottomPaddingStart && relativeBottom <= pageEndY) {
                        console.log(`🚨 Section in BOTTOM padding area on page ${i + 1}:`, section.className, { relativeBottom, pageBottomPaddingStart });
                        problematicSections.push(section);
                        section.setAttribute('data-needs-reposition', 'bottom-padding');
                        section.setAttribute('data-page-conflict', (i + 1).toString());
                    }
                    
                    // Check if section spans across page break (starts before and ends after)
                    if (relativeTop < pageEndY && relativeBottom > pageEndY) {
                        console.log(`🚨 Section SPANS page break ${i + 1}:`, section.className, { relativeTop, relativeBottom, pageEndY });
                        problematicSections.push(section);
                        section.setAttribute('data-needs-reposition', 'page-span');
                        section.setAttribute('data-page-conflict', (i + 1).toString());
                    }
                }
            });
            
            setSectionPositions(sectionData);
            
            // Apply repositioning styles to problematic sections
            repositionProblematicSections(problematicSections, breaks, mmToPx, marginTopPx);
        };
        
        // Function to reposition sections that fall into padding areas
        const repositionProblematicSections = (sections: HTMLElement[], breaks: number[], mmToPx: number, marginTopPx: number) => {
            sections.forEach((section, index) => {
                const repositionType = section.getAttribute('data-needs-reposition');
                const pageConflict = parseInt(section.getAttribute('data-page-conflict') || '1');
                
                if (repositionType === 'top-padding') {
                    // Move section down to start after top padding
                    const targetPage = pageConflict - 1;
                    const pageStart = targetPage === 0 ? 0 : breaks[targetPage - 1];
                    const newTopPosition = pageStart + marginTopPx + 10; // 10px extra buffer
                    
                    section.style.transform = `translateY(${newTopPosition}px)`;
                    section.style.position = 'relative';
                    section.style.zIndex = '10';
                    
                    console.log(`📝 Moved section DOWN from top padding on page ${pageConflict}:`, section.className);
                    
                } else if (repositionType === 'bottom-padding') {
                    // Move section to next page
                    const nextPageStart = breaks[pageConflict - 1] + marginTopPx + 10; // Next page start + top margin + buffer
                    
                    section.style.transform = `translateY(${nextPageStart}px)`;
                    section.style.position = 'relative';
                    section.style.zIndex = '10';
                    
                    console.log(`📝 Moved section to NEXT PAGE from bottom padding on page ${pageConflict}:`, section.className);
                    
                } else if (repositionType === 'page-span') {
                    // Move entire section to next page
                    const nextPageStart = breaks[pageConflict - 1] + marginTopPx + 10;
                    
                    section.style.transform = `translateY(${nextPageStart}px)`;
                    section.style.position = 'relative';
                    section.style.zIndex = '10';
                    
                    console.log(`📝 Moved SPANNING section to next page ${pageConflict + 1}:`, section.className);
                }
                
                // Add visual indicator for repositioned sections
                section.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.5)';
                section.style.background = 'rgba(34, 197, 94, 0.05)';
                
                // Remove indicators after a delay to show the change
                setTimeout(() => {
                    if (section.style.boxShadow.includes('34, 197, 94')) {
                        section.style.boxShadow = '';
                        section.style.background = '';
                    }
                }, 3000);
            });
        };
        
        // Calculate breaks on mount and when content changes
        const timer = setTimeout(calculatePageBreaksAndSections, 100); // Small delay for DOM to settle
        
        // Recalculate on window resize
        window.addEventListener('resize', calculatePageBreaksAndSections);
        
        // Use a ResizeObserver to detect content changes
        const observer = new ResizeObserver(() => {
            // Debounce the calculation
            clearTimeout(timer);
            setTimeout(calculatePageBreaksAndSections, 100);
        });
        
        const container = document.querySelector('.cv-content-with-breaks') || document.querySelector('.cv-template');
        if (container) {
            observer.observe(container);
        }
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculatePageBreaksAndSections);
            observer.disconnect();
        };
    }, [showIndicators, pageHeight, marginTop]);
    
    return (
        <div className={`relative ${className}`}>
            {/* CV Content */}
            <div 
                className="cv-content-with-breaks"
                style={{
                    minHeight: `${pageHeight}mm`,
                    width: `${pageWidth}mm`,
                    maxWidth: `${pageWidth}mm`,
                }}
            >
                {children}
            </div>
            
            {/* Page Break Indicators */}
            {showIndicators && pageBreaks.map((breakPosition, index) => (
                <React.Fragment key={`page-break-${index}`}>
                    {/* Bottom padding of current page - white space */}
                    <div
                        className="page-bottom-padding"
                        style={{
                            position: 'absolute',
                            top: `${breakPosition - (marginBottom * 3.7795275591)}px`, // 20mm bottom padding
                            left: 0,
                            right: 0,
                            height: `${marginBottom * 3.7795275591}px`, // 20mm in pixels
                            background: 'white',
                            border: '1px dashed rgba(59, 130, 246, 0.3)',
                            borderBottom: '2px solid #3b82f6',
                            zIndex: 998,
                            opacity: 0.9,
                            pointerEvents: 'none',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                            }}
                        >
                            Səhifə {index + 1} alt boşluğu (20mm)
                        </div>
                    </div>
                    
                    {/* Page break line */}
                    <div
                        className="page-break-line"
                        style={{
                            position: 'absolute',
                            top: `${breakPosition}px`,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)',
                            zIndex: 1000,
                            opacity: 0.8,
                            pointerEvents: 'none',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '-15px',
                                transform: 'translateX(-50%)',
                                background: '#ef4444',
                                color: 'white',
                                padding: '1px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                        >
                            SƏHIFƏ SONU ➤ SƏHIFƏ {index + 2} BAŞI
                        </div>
                    </div>
                    
                    {/* Top padding of next page - white space */}
                    <div
                        className="page-top-padding"
                        style={{
                            position: 'absolute',
                            top: `${breakPosition + 3}px`, // Just after the page break line
                            left: 0,
                            right: 0,
                            height: `${marginTop * 3.7795275591}px`, // 20mm in pixels
                            background: 'white',
                            border: '1px dashed rgba(16, 185, 129, 0.3)',
                            borderTop: '2px solid #10b981',
                            zIndex: 998,
                            opacity: 0.9,
                            pointerEvents: 'none',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                        >
                            Səhifə {index + 2} üst boşluğu (20mm)
                        </div>
                    </div>
                </React.Fragment>
            ))}            {/* Page Number Indicators */}
            {showIndicators && (
                <div
                    className="page-number-indicator"
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#10b981',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        zIndex: 1000,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                >
                    Səhifə 1
                </div>
            )}
            
            {/* CSS for page break styling */}
            <style jsx>{`
                .cv-content-with-breaks {
                    position: relative;
                }
                
                /* CRITICAL: Hide content that falls into padding areas */
                .cv-content-with-breaks {
                    /* Create page breaks and hide overflow content */
                    overflow: hidden;
                }
                
                /* Content area must respect page boundaries */
                .cv-content-with-breaks > * {
                    /* Apply proper page break rules */
                    page-break-inside: auto;
                    break-inside: auto;
                }
                
                /* Sections that fall into bottom padding area get pushed to next page */
                ${showIndicators && pageBreaks.map((breakPosition, index) => {
                    const bottomPaddingStart = breakPosition - (marginBottom * 3.7795275591);
                    const topPaddingEnd = breakPosition + 3 + (marginTop * 3.7795275591);
                    
                    return `
                        /* Hide content in bottom padding area of page ${index + 1} */
                        .cv-content-with-breaks > *:not(.page-bottom-padding):not(.page-break-line):not(.page-top-padding):not(.page-number-indicator) {
                            clip-path: polygon(
                                0% 0%, 
                                100% 0%, 
                                100% ${bottomPaddingStart}px, 
                                0% ${bottomPaddingStart}px
                            );
                        }
                        
                        /* Content that would appear in top padding gets offset */
                        .cv-content-with-breaks > *[data-page="${index + 2}"] {
                            margin-top: ${marginTop * 3.7795275591}px;
                        }
                    `;
                }).join('')}
                
                /* Styling for repositioned sections */
                .cv-content-with-breaks [data-needs-reposition] {
                    transition: transform 0.3s ease-out, box-shadow 0.3s ease-out, background-color 0.3s ease-out;
                }
                
                .cv-content-with-breaks [data-needs-reposition="top-padding"] {
                    border-left: 3px solid #22c55e;
                }
                
                .cv-content-with-breaks [data-needs-reposition="bottom-padding"] {
                    border-left: 3px solid #ef4444;
                }
                
                .cv-content-with-breaks [data-needs-reposition="page-span"] {
                    border-left: 3px solid #f59e0b;
                }
                
                /* Visual indicator for sections being moved */
                .section-repositioned {
                    animation: section-move 1s ease-out;
                    transform-origin: center;
                }
                
                @keyframes section-move {
                    0% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                    }
                    50% {
                        transform: scale(1.02);
                        box-shadow: 0 0 0 10px rgba(34, 197, 94, 0.3);
                    }
                    100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
                    }
                }
                
                @media print {
                    .page-bottom-padding,
                    .page-top-padding,
                    .page-break-line,
                    .page-number-indicator {
                        display: none !important;
                    }
                    
                    /* In print, use proper page break rules */
                    .cv-content-with-breaks > * {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
                
                /* Padding area animations */
                .page-bottom-padding {
                    animation: padding-highlight 3s infinite ease-in-out;
                }
                
                .page-top-padding {
                    animation: padding-highlight-alt 3s infinite ease-in-out;
                }
                
                .page-break-line {
                    animation: break-pulse 2s infinite ease-in-out;
                }
                
                @keyframes padding-highlight {
                    0%, 100% { 
                        opacity: 0.7;
                        border-color: rgba(59, 130, 246, 0.3);
                    }
                    50% { 
                        opacity: 0.9;
                        border-color: rgba(59, 130, 246, 0.6);
                    }
                }
                
                @keyframes padding-highlight-alt {
                    0%, 100% { 
                        opacity: 0.7;
                        border-color: rgba(16, 185, 129, 0.3);
                    }
                    50% { 
                        opacity: 0.9;
                        border-color: rgba(16, 185, 129, 0.6);
                    }
                }
                
                @keyframes break-pulse {
                    0%, 100% { 
                        opacity: 0.8;
                        transform: scaleY(1);
                    }
                    50% { 
                        opacity: 1;
                        transform: scaleY(1.5);
                    }
                }
                
                /* Page number styling improvements */
                .page-number-indicator {
                    animation: gentle-pulse 2s infinite ease-in-out;
                }
                
                @keyframes gentle-pulse {
                    0%, 100% { 
                        transform: scale(1);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    50% { 
                        transform: scale(1.05);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    }
                }
                
                /* Enhanced visual representation */
                .page-bottom-padding::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background: repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 10px,
                        rgba(59, 130, 246, 0.05) 10px,
                        rgba(59, 130, 246, 0.05) 20px
                    );
                    pointer-events: none;
                }
                
                .page-top-padding::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background: repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 10px,
                        rgba(16, 185, 129, 0.05) 10px,
                        rgba(16, 185, 129, 0.05) 20px
                    );
                    pointer-events: none;
                }
                
                /* Responsive styling */
                @media (max-width: 768px) {
                    .page-bottom-padding div,
                    .page-top-padding div,
                    .page-break-line div {
                        font-size: 9px !important;
                        padding: 1px 4px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PageBreakIndicator;

// Hook for programmatic page break detection
export const usePageBreaks = (contentRef: React.RefObject<HTMLElement>, options: {
    pageHeight?: number;
    marginTop?: number;
    marginBottom?: number;
}) => {
    const [pageCount, setPageCount] = useState(1);
    const [pageBreaks, setPageBreaks] = useState<number[]>([]);
    
    const { pageHeight = 297, marginTop = 20, marginBottom = 20 } = options;
    const contentHeight = pageHeight - marginTop - marginBottom;
    
    useEffect(() => {
        const calculatePageBreaks = () => {
            if (!contentRef.current) return;
            
            const containerHeight = contentRef.current.scrollHeight;
            const contentHeightPx = contentHeight * 3.779; // mm to px conversion
            
            const breaks: number[] = [];
            let currentPosition = contentHeightPx;
            
            while (currentPosition < containerHeight) {
                breaks.push(currentPosition);
                currentPosition += contentHeightPx;
            }
            
            setPageBreaks(breaks);
            setPageCount(breaks.length + 1);
        };
        
        calculatePageBreaks();
        
        const observer = new ResizeObserver(calculatePageBreaks);
        if (contentRef.current) {
            observer.observe(contentRef.current);
        }
        
        return () => observer.disconnect();
    }, [contentRef, contentHeight]);
    
    return { pageCount, pageBreaks };
};
