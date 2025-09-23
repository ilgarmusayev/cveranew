'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CVPreview from '@/components/cv/CVPreview';
import { apiClient } from '@/lib/api';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { getLoadingMessages } from '@/components/ui/Loading';

interface CVData {
    personalInfo: any;
    experience?: any[];
    education?: any[];
    skills?: any[];
    languages?: any[];
    projects?: any[];
    certifications?: any[];
    volunteerExperience?: any[];
    cvLanguage?: string;
}

interface CV {
    id: string;
    title: string;
    templateId: string;
    data: CVData;
    createdAt: string;
    updatedAt: string;
}

export default function CVExportPage() {
    const params = useParams();
    const router = useRouter();
    const cvId = params.id as string;
    const { siteLanguage } = useSiteLanguage();
    const loadingMessages = getLoadingMessages(siteLanguage);

    const labels = {
        azerbaijani: {
            cvNotFound: 'CV məlumatları tapılmadı',
            cvLoadError: 'CV yükləmə xətası baş verdi',
            cvNotFoundTitle: 'CV Tapılmadı',
            cvDataNotAvailable: 'CV məlumatları mövcud deyil',
            backToDashboard: 'Dashboard-a Qayıt',
            export: 'Export',
            print: 'Print',
            pdfExport: 'PDF Export',
            exporting: 'Export edilir...',
            pdfExportError: 'PDF export zamanı xəta baş verdi'
        },
        english: {
            cvNotFound: 'CV data not found',
            cvLoadError: 'CV loading error occurred',
            cvNotFoundTitle: 'CV Not Found',
            cvDataNotAvailable: 'CV data not available',
            backToDashboard: 'Back to Dashboard',
            export: 'Export',
            print: 'Print',
            pdfExport: 'PDF Export',
            exporting: 'Exporting...',
            pdfExportError: 'Error occurred during PDF export'
        },
        russian: {
            cvNotFound: 'Данные резюме не найдены',
            cvLoadError: 'Произошла ошибка загрузки резюме',
            cvNotFoundTitle: 'Резюме не найдено',
            cvDataNotAvailable: 'Данные резюме недоступны',
            backToDashboard: 'Вернуться к панели управления',
            export: 'Экспорт',
            print: 'Печать',
            pdfExport: 'Экспорт PDF',
            exporting: 'Экспорт...',
            pdfExportError: 'Ошибка при экспорте PDF'
        }
    };

    const content = labels[siteLanguage];
    
    const [cv, setCV] = useState<CV | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [showFontPanel, setShowFontPanel] = useState(false);
    
    // Font settings state (default values matching CVEditor, excluding fontFamily)
    const [fontSettings, setFontSettings] = useState({
        nameSize: 24,
        titleSize: 20,
        headingSize: 18,
        subheadingSize: 16,
        bodySize: 14,
        smallSize: 12,
        headingWeight: 700,
        subheadingWeight: 600,
        bodyWeight: 400,
        smallWeight: 400,
        sectionSpacing: 8
    });

    useEffect(() => {
        const fetchCV = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/api/cv/${cvId}`);
                
                if (response.status === 200 && response.data) {
                    setCV(response.data);
                } else {
                    setError(content.cvNotFound);
                }
            } catch (err) {
                console.error('CV yükləmə xətası:', err);
                setError(content.cvLoadError);
            } finally {
                setLoading(false);
            }
        };

        if (cvId) {
            fetchCV();
        }
    }, [cvId]);

    const handleExportPDF = async () => {
        if (!cv) return;

        try {
            setExporting(true);
            
            // CVPreview elementini render olması üçün bir az gözlə
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // CVPreview elementini tap və HTML-ini al
            const cvPreviewElement = document.querySelector('.cv-preview');
            if (!cvPreviewElement) {
                console.warn('CV preview elementi tapılmadı, fallback method istifadə ediləcək');
                
                // Fallback: sadəcə font settings göndər
                const token = localStorage.getItem('accessToken');
                const response = await fetch(`/api/cv/export/${cvId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    body: JSON.stringify({
                        format: 'pdf',
                        templateId: cv.templateId,
                        data: cv.data,
                        fontSettings: fontSettings
                    })
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('PDF export server xətası:', response.status, errorData);
                    throw new Error(`PDF export xətası: ${response.status}`);
                }

                // PDF faylını download et
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${cv.title || 'CV'}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                return;
            }

            // CVPreview-in tam HTML content-ini və style-larını al
            const cvHTML = cvPreviewElement.outerHTML;
            
            // CSS-ləri də al
            const styles = Array.from(document.styleSheets)
                .map(sheet => {
                    try {
                        return Array.from(sheet.cssRules)
                            .map(rule => rule.cssText)
                            .join('\n');
                    } catch (e) {
                        return '';
                    }
                })
                .join('\n');
                
            // CV fonts CSS-ini də əlavə et
            const cvFontsCSS = `
                .cv-preview { font-family: var(--cv-font-family, Arial, sans-serif) !important; }
                .cv-preview * { font-family: var(--cv-font-family, Arial, sans-serif) !important; }
                .cv-preview h1 { 
                    font-size: var(--cv-heading-size) !important; 
                    font-weight: var(--cv-heading-weight) !important;
                    line-height: 1.2 !important; 
                }
                .cv-preview h2 { 
                    font-size: var(--cv-subheading-size) !important; 
                    font-weight: var(--cv-subheading-weight) !important;
                    line-height: 1.3 !important; 
                }
                .cv-preview h3 { 
                    font-size: var(--cv-subheading-size) !important; 
                    font-weight: var(--cv-subheading-weight) !important;
                    line-height: 1.3 !important; 
                }
                .cv-preview p, .cv-preview span, .cv-preview div { 
                    font-size: var(--cv-body-size) !important; 
                    font-weight: var(--cv-body-weight) !important;
                    line-height: 1.5 !important; 
                }
                .cv-preview .text-xs { 
                    font-size: var(--cv-small-size) !important; 
                    font-weight: var(--cv-small-weight) !important;
                }
                .cv-preview .text-sm { 
                    font-size: var(--cv-body-size) !important; 
                    font-weight: var(--cv-body-weight) !important;
                }
                .cv-preview .text-base { 
                    font-size: var(--cv-subheading-size) !important; 
                    font-weight: var(--cv-subheading-weight) !important;
                }
                .cv-preview .text-lg { 
                    font-size: var(--cv-subheading-size) !important; 
                    font-weight: var(--cv-subheading-weight) !important;
                }
                .cv-preview .text-xl, .cv-preview .text-2xl { font-size: var(--cv-heading-size) !important; }
            `;
            
            const combinedStyles = styles + '\n' + cvFontsCSS;

            // PDF export API çağırısı
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/cv/export/${cvId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    format: 'pdf',
                    templateId: cv.templateId,
                    data: cv.data,
                    fontSettings: fontSettings,
                    htmlContent: cvHTML,
                    cssContent: combinedStyles
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('PDF export server xətası:', response.status, errorData);
                throw new Error(`PDF export xətası: ${response.status}`);
            }

            // PDF faylını download et
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${cv.title || 'CV'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            console.error('PDF export xətası:', err);
            const errorMessage = err instanceof Error ? err.message : 'Naməlum xəta';
            alert(`${content.pdfExportError}: ${errorMessage}`);
        } finally {
            setExporting(false);
        }
    };



    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{loadingMessages.cvLoading}</p>
                </div>
            </div>
        );
    }

    if (error || !cv) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{content.cvNotFoundTitle}</h1>
                    <p className="text-gray-600 mb-6">{error || content.cvDataNotAvailable}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {content.backToDashboard}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                           
                            <h1 className="text-xl font-semibold text-gray-800">
                                {cv.title} - Export
                            </h1>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                     
                            <button
                                onClick={handlePrint}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                🖨️ {content.print}
                            </button>
                            
                            <button
                                onClick={handleExportPDF}
                                disabled={exporting}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exporting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        {content.exporting}
                                    </>
                                ) : (
                                    <>
                                        📄 {content.pdfExport}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CV Preview - Centered without background */}
            <div className="flex justify-center py-8">
                <CVPreview 
                    cv={{
                        id: cv.id,
                        templateId: cv.templateId,
                        data: cv.data as any
                    }}
                    template={cv.templateId}
                    fontSettings={fontSettings}
                />
            </div>


            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        font-size: 12pt !important;
                        line-height: 1.4 !important;
                    }
                    
                    /* Add 15mm margins to CV preview */
                    .cv-preview {
                        margin: 15mm !important;
                        box-sizing: border-box !important;
                    }
                    
                    .print\\:hidden {
                        display: none !important;
                    }
                    
                    /* Remove all margins and padding from containers */
                    .min-h-screen,
                    .max-w-7xl,
                    .mx-auto,
                    .py-8,
                    .px-4,
                    .sm\\:px-6,
                    .lg\\:px-8 {
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                    }
                    
                    /* Remove background and styling */
                    .bg-gray-100,
                    .bg-white,
                    .rounded-lg,
                    .shadow-lg {
                        background: white !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    
                    /* Remove padding from main container */
                    .p-8 {
                        padding: 0 !important;
                    }
                    
                    /* Enhanced print optimizations for professional look */
                    .cv-preview .p-6,
                    .cv-preview .p-8,
                    .cv-preview .px-6,
                    .cv-preview .px-8,
                    .cv-preview .py-6,
                    .cv-preview .py-8 {
                        padding: 8px !important;
                    }
                    
                    .cv-preview .mx-4,
                    .cv-preview .mx-6,
                    .cv-preview .mx-8 {
                        margin-left: 4px !important;
                        margin-right: 4px !important;
                    }
                    
                    /* MULTI-PAGE SUPPORT STYLES */
                    
                    /* Hide page break indicators on print */
                    .page-break-indicator,
                    .page-number-indicator {
                        display: none !important;
                    }
                    
                    /* AUTOMATIC PAGE BREAK SYSTEM - PREVIEW VE PDF EXPORT */
                    
                    /* A4 page setup with 20mm margins (2.0cm all sides) */
                    @page {
                        size: A4 portrait;
                        margin: 20mm; /* 2.0cm bütün tərəflərdə */
                    }
                    
                    /* CV Container - Auto page break when content exceeds A4 */
                    .cv-preview {
                        width: 100% !important;
                        max-width: 170mm !important; /* A4 width (210mm) - 20mm margins (40mm total) */
                        min-height: 257mm !important; /* A4 height (297mm) - 20mm margins (40mm total) */
                        height: auto !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        transform: none !important;
                        scale: 1 !important;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        page-break-inside: auto !important; /* Allow content to break across pages */
                        
                        /* CSS Grid for automatic page breaks */
                        display: block !important;
                        overflow: visible !important;
                    }
                    
                    /* Automatic page creation when content overflows */
                    .cv-template {
                        min-height: 257mm !important; /* A4 content area height */
                        height: auto !important;
                        break-inside: auto !important;
                        page-break-inside: auto !important;
                    }
                    
                    /* SMART PAGE BREAK CONTROLS */
                    
                    /* Section-level breaks - keep sections together when possible */
                    .cv-section, 
                    .aurora-template .mb-4, .vertex-template .mb-4, .horizon-template .mb-4,
                    .lumen-template .mb-4, .modern-template .mb-4, .exclusive-template .mb-4,
                    .atlas-template .mb-4, .basic-template .mb-4, .traditional-template .mb-4 {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin-bottom: 12px !important;
                    }
                    
                    /* Larger sections - allow breaks if necessary */
                    .cv-section.large-section,
                    .aurora-template .mb-6, .vertex-template .mb-6, .horizon-template .mb-6,
                    .lumen-template .mb-6, .modern-template .mb-6, .exclusive-template .mb-6,
                    .atlas-template .mb-6, .basic-template .mb-6, .traditional-template .mb-6 {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                        margin-bottom: 16px !important;
                    }
                    
                    /* Headers - never break after headers */
                    .cv-section h1, .cv-section h2, .cv-section h3,
                    .aurora-template h1, .vertex-template h1, .horizon-template h1,
                    .lumen-template h1, .modern-template h1, .exclusive-template h1,
                    .atlas-template h1, .basic-template h1, .traditional-template h1,
                    .aurora-template h2, .vertex-template h2, .horizon-template h2,
                    .lumen-template h2, .modern-template h2, .exclusive-template h2,
                    .atlas-template h2, .basic-template h2, .traditional-template h2 {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        orphans: 3 !important; /* Minimum 3 lines before page break */
                        widows: 3 !important; /* Minimum 3 lines after page break */
                    }
                    
                    /* Individual items - try to keep together */
                    .experience-item, .education-item, .project-item,
                    .aurora-template .space-y-2 > div, .vertex-template .space-y-2 > div,
                    .lumen-template .space-y-2 > div, .modern-template .space-y-2 > div,
                    .exclusive-template .space-y-2 > div, .atlas-template .space-y-2 > div,
                    .basic-template .space-y-2 > div, .traditional-template .space-y-2 > div {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    
                    /* Force page breaks when explicitly needed */
                    .page-break {
                        page-break-before: always !important;
                        break-before: page !important;
                    }
                    
                    .avoid-break {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    
                    /* Personal info section - always keep together */
                    .personal-info-section,
                    .aurora-template .mb-6:first-child, .vertex-template .mb-6:first-child,
                    .lumen-template .mb-6:first-child, .modern-template .mb-6:first-child,
                    .exclusive-template .mb-6:first-child, .atlas-template .mb-6:first-child,
                    .basic-template .mb-6:first-child, .traditional-template .mb-6:first-child {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                    
                    /* Ensure fonts are preserved */
                    * {
                        font-family: var(--cv-font-family, Arial, sans-serif) !important;
                    }
                }
            `}</style>
        </div>
    );
}
