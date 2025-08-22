'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CVPreview from '@/components/cv/CVPreview';
import { apiClient } from '@/lib/api';

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
    
    const [cv, setCV] = useState<CV | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [showFontPanel, setShowFontPanel] = useState(false);
    
    // Font settings state (default values matching CVEditor)
    const [fontSettings, setFontSettings] = useState({
        fontFamily: 'Arial, sans-serif',
        headingSize: 18,
        subheadingSize: 16,
        bodySize: 14,
        smallSize: 12
    });

    useEffect(() => {
        const fetchCV = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/api/cv/${cvId}`);
                
                if (response.status === 200 && response.data) {
                    setCV(response.data);
                } else {
                    setError('CV məlumatları tapılmadı');
                }
            } catch (err) {
                console.error('CV yükləmə xətası:', err);
                setError('CV yükləmə xətası baş verdi');
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
                .cv-preview h1 { font-size: var(--cv-heading-size) !important; line-height: 1.2 !important; }
                .cv-preview h2 { font-size: var(--cv-subheading-size) !important; line-height: 1.3 !important; }
                .cv-preview h3 { font-size: var(--cv-subheading-size) !important; line-height: 1.3 !important; }
                .cv-preview p, .cv-preview span, .cv-preview div { font-size: var(--cv-body-size) !important; line-height: 1.5 !important; }
                .cv-preview .text-xs { font-size: var(--cv-small-size) !important; }
                .cv-preview .text-sm { font-size: var(--cv-body-size) !important; }
                .cv-preview .text-base { font-size: var(--cv-subheading-size) !important; }
                .cv-preview .text-lg { font-size: var(--cv-subheading-size) !important; }
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
            alert(`PDF export zamanı xəta baş verdi: ${errorMessage}`);
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
                    <p className="mt-4 text-gray-600">CV yüklənir...</p>
                </div>
            </div>
        );
    }

    if (error || !cv) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">CV Tapılmadı</h1>
                    <p className="text-gray-600 mb-6">{error || 'CV məlumatları mövcud deyil'}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Dashboard-a Qayıt
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => router.back()}
                                className="text-gray-500 hover:text-gray-700 mr-4"
                            >
                                ← Geri
                            </button>
                            <h1 className="text-xl font-semibold text-gray-800">
                                {cv.title} - Export
                            </h1>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowFontPanel(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                🔤 Font Tənzimləmələri
                            </button>
                            
                            <button
                                onClick={handlePrint}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                🖨️ Print
                            </button>
                            
                            <button
                                onClick={handleExportPDF}
                                disabled={exporting}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exporting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Export edilir...
                                    </>
                                ) : (
                                    <>
                                        📄 PDF Export
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CV Preview */}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <CVPreview 
                        cv={{
                            id: cv.id,
                            templateId: cv.templateId,
                            data: cv.data
                        }}
                        template={cv.templateId}
                        fontSettings={fontSettings}
                    />
                </div>
            </div>

            {/* Font Panel Modal */}
            {showFontPanel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Font Tənzimləmələri</h2>
                                <button
                                    onClick={() => setShowFontPanel(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Font Family */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Font Ailəsi
                                    </label>
                                    <select
                                        value={fontSettings.fontFamily}
                                        onChange={(e) => setFontSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Arial, sans-serif">Arial (Sadə)</option>
                                        <option value="Georgia, serif">Georgia (Klassik)</option>
                                        <option value="Verdana, sans-serif">Verdana (Aydın)</option>
                                        <option value="Times New Roman, serif">Times New Roman (Rəsmi)</option>
                                    </select>
                                </div>

                                {/* Heading Size */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Başlıq Ölçüsü: {fontSettings.headingSize}px
                                    </label>
                                    <input
                                        type="range"
                                        min="16"
                                        max="24"
                                        value={fontSettings.headingSize}
                                        onChange={(e) => setFontSettings(prev => ({ ...prev, headingSize: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Subheading Size */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alt Başlıq Ölçüsü: {fontSettings.subheadingSize}px
                                    </label>
                                    <input
                                        type="range"
                                        min="14"
                                        max="20"
                                        value={fontSettings.subheadingSize}
                                        onChange={(e) => setFontSettings(prev => ({ ...prev, subheadingSize: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Body Size */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Əsas Mətn Ölçüsü: {fontSettings.bodySize}px
                                    </label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="18"
                                        value={fontSettings.bodySize}
                                        onChange={(e) => setFontSettings(prev => ({ ...prev, bodySize: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Small Size */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kiçik Mətn Ölçüsü: {fontSettings.smallSize}px
                                    </label>
                                    <input
                                        type="range"
                                        min="8"
                                        max="14"
                                        value={fontSettings.smallSize}
                                        onChange={(e) => setFontSettings(prev => ({ ...prev, smallSize: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Preview */}
                                <div className="p-4 border rounded-lg bg-gray-50">
                                    <div style={{ fontFamily: fontSettings.fontFamily }}>
                                        <h1 style={{ fontSize: `${fontSettings.headingSize}px`, fontWeight: 'bold', marginBottom: '8px' }}>
                                            Başlıq Nümunəsi
                                        </h1>
                                        <h2 style={{ fontSize: `${fontSettings.subheadingSize}px`, fontWeight: '600', marginBottom: '8px' }}>
                                            Alt başlıq nümunəsi
                                        </h2>
                                        <p style={{ fontSize: `${fontSettings.bodySize}px`, marginBottom: '8px' }}>
                                            Bu əsas mətn nümunəsidir. CV-nizdə bu ölçüdə mətnlər göstəriləcək.
                                        </p>
                                        <small style={{ fontSize: `${fontSettings.smallSize}px`, color: '#666' }}>
                                            Bu kiçik mətn nümunəsidir (tarixlər, əlavə məlumatlar).
                                        </small>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setFontSettings({
                                                fontFamily: 'Arial, sans-serif',
                                                headingSize: 18,
                                                subheadingSize: 16,
                                                bodySize: 14,
                                                smallSize: 12
                                            });
                                        }}
                                        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Sıfırla
                                    </button>
                                    <button
                                        onClick={() => setShowFontPanel(false)}
                                        className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                    >
                                        Tətbiq Et
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                    
                    /* A4 page setup with maximum minimal margins for maximum content */
                    @page {
                        size: A4 portrait;
                        margin: 8mm 6mm; /* Maximum minimal CV margins: üst/alt 8mm, sol/sağ 6mm */
                    }
                    
                    /* Page break controls */
                    .cv-section {
                        page-break-inside: avoid;
                        margin-bottom: 20px;
                    }
                    
                    .cv-section h2, .cv-section h3 {
                        page-break-after: avoid;
                    }
                    
                    .avoid-break {
                        page-break-inside: avoid;
                    }
                    
                    .page-break {
                        page-break-before: always;
                    }
                    
                    /* Ensure CV container fits within maximum minimal A4 margins */
                    .cv-preview {
                        width: 100% !important;
                        max-width: 198mm !important; /* A4 width (210mm) - maximum minimal margins (12mm total) */
                        height: auto !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        transform: none !important;
                        scale: 1 !important;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        page-break-inside: auto; /* Allow content to break across pages */
                    }
                    
                    /* Ensure fonts are preserved */
                    * {
                        font-family: var(--cv-font-family, Arial, sans-serif) !important;
                    }
                }
                }
            `}</style>
        </div>
    );
}
