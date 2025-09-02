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
    
    // Calculate content area
    const contentHeight = pageHeight - marginTop - marginBottom; // 257mm for A4 with 20mm margins
    const contentWidth = pageWidth - marginLeft - marginRight; // 170mm for A4 with 20mm margins
    
    useEffect(() => {
        if (!showIndicators) return;
        
        // Calculate page breaks based on content height
        // This is a simplified calculation - in real scenarios you'd need more sophisticated logic
        const calculatePageBreaks = () => {
            const container = document.querySelector('.cv-preview');
            if (!container) return;
            
            const containerHeight = container.scrollHeight;
            const pixelsPerMm = window.devicePixelRatio || 1;
            const contentHeightPx = contentHeight * 3.779; // mm to px conversion (rough)
            
            const breaks: number[] = [];
            let currentPosition = contentHeightPx;
            
            while (currentPosition < containerHeight) {
                breaks.push(currentPosition);
                currentPosition += contentHeightPx;
            }
            
            setPageBreaks(breaks);
        };
        
        // Calculate breaks on mount and when content changes
        calculatePageBreaks();
        
        // Recalculate on window resize
        window.addEventListener('resize', calculatePageBreaks);
        
        // Use a ResizeObserver to detect content changes
        const observer = new ResizeObserver(calculatePageBreaks);
        const container = document.querySelector('.cv-preview');
        if (container) {
            observer.observe(container);
        }
        
        return () => {
            window.removeEventListener('resize', calculatePageBreaks);
            observer.disconnect();
        };
    }, [showIndicators, contentHeight]);
    
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
                <div
                    key={`page-break-${index}`}
                    className="page-break-indicator"
                    style={{
                        position: 'absolute',
                        top: `${breakPosition}px`,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
                        zIndex: 1000,
                        opacity: 0.7,
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        className="page-break-label"
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '-20px',
                            background: '#3b82f6',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                    >
                        Səhifə {index + 2}
                    </div>
                </div>
            ))}
            
            {/* Page Number Indicators */}
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
                
                @media print {
                    .page-break-indicator,
                    .page-number-indicator {
                        display: none !important;
                    }
                }
                
                /* Animation for page break indicators */
                .page-break-indicator {
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }
                
                /* Enhanced visual styling */
                .page-break-indicator::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: -5px;
                    width: 100%;
                    height: 12px;
                    background: linear-gradient(
                        to bottom,
                        transparent,
                        rgba(59, 130, 246, 0.1),
                        transparent
                    );
                    pointer-events: none;
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
