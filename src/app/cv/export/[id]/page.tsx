'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CVPreview from '@/components/cv/CVPreview';
import { apiClient } from '@/lib/api';
import { FONT_OPTIONS, FontSettings } from '@/lib/fontManager';

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
            
            // Dynamic font settings CSS-ini yarat - TAM DINAMIK SISTEM
            const dynamicFontCSS = `
                /* CSS Variables - Font Manager Dynamic Integration */
                :root {
                    --cv-font-family: ${fontSettings.fontFamily} !important;
                    --cv-name-size: ${fontSettings.nameSize}px !important;
                    --cv-title-size: ${fontSettings.titleSize}px !important;
                    --cv-heading-size: ${fontSettings.headingSize}px !important;
                    --cv-subheading-size: ${fontSettings.subheadingSize}px !important;
                    --cv-body-size: ${fontSettings.bodySize}px !important;
                    --cv-small-size: ${fontSettings.smallSize}px !important;
                    --cv-heading-weight: ${fontSettings.headingWeight} !important;
                    --cv-subheading-weight: ${fontSettings.subheadingWeight} !important;
                    --cv-body-weight: ${fontSettings.bodyWeight} !important;
                    --cv-small-weight: ${fontSettings.smallWeight} !important;
                    --cv-section-spacing: ${fontSettings.sectionSpacing}px !important;
                }
                
                /* UNIVERSAL FONT FAMILY OVERRIDE */
                * {
                    font-family: ${fontSettings.fontFamily} !important;
                }
                
                /* TEMPLATE-SPECIFIC DYNAMIC OVERRIDES */
                
                /* Name/Title (H1) - Çox böyük mətnlər */
                h1, .text-5xl, .text-4xl, .name-style,
                .aurora-template h1, .vertex-template h1, .horizon-template h1,
                .lumen-template h1, .modern-template h1, .exclusive-template h1,
                .ats-template h1, .basic-template h1, .traditional-template h1,
                .classic-template h1,
                .aurora-template .text-5xl, .vertex-template .text-5xl, .horizon-template .text-5xl,
                .lumen-template .text-5xl, .modern-template .text-5xl, .exclusive-template .text-5xl,
                .ats-template .text-5xl, .basic-template .text-5xl, .traditional-template .text-5xl,
                .classic-template .text-5xl {
                    font-size: ${fontSettings.nameSize}px !important;
                    font-weight: ${fontSettings.headingWeight} !important;
                    font-family: ${fontSettings.fontFamily} !important;
                    line-height: 1.2 !important;
                }
                
                /* Main Headings (H2) - Section başlıqları */
                h2, .text-3xl, .text-2xl, .heading-style,
                .aurora-template h2, .vertex-template h2, .horizon-template h2,
                .lumen-template h2, .modern-template h2, .exclusive-template h2,
                .ats-template h2, .basic-template h2, .traditional-template h2,
                .classic-template h2,
                .aurora-template .text-3xl, .vertex-template .text-3xl, .horizon-template .text-3xl,
                .lumen-template .text-3xl, .modern-template .text-3xl, .exclusive-template .text-3xl,
                .ats-template .text-3xl, .basic-template .text-3xl, .traditional-template .text-3xl,
                .classic-template .text-3xl,
                .aurora-template .text-2xl, .vertex-template .text-2xl, .horizon-template .text-2xl,
                .lumen-template .text-2xl, .modern-template .text-2xl, .exclusive-template .text-2xl,
                .ats-template .text-2xl, .basic-template .text-2xl, .traditional-template .text-2xl,
                .classic-template .text-2xl {
                    font-size: ${fontSettings.headingSize}px !important;
                    font-weight: ${fontSettings.headingWeight} !important;
                    font-family: ${fontSettings.fontFamily} !important;
                    line-height: 1.3 !important;
                }
                
                /* Sub Headings (H3) - Alt başlıqlar */
                h3, .text-xl, .text-lg, .subheading-style,
                .aurora-template h3, .vertex-template h3, .horizon-template h3,
                .lumen-template h3, .modern-template h3, .exclusive-template h3,
                .ats-template h3, .basic-template h3, .traditional-template h3,
                .classic-template h3,
                .aurora-template .text-xl, .vertex-template .text-xl, .horizon-template .text-xl,
                .lumen-template .text-xl, .modern-template .text-xl, .exclusive-template .text-xl,
                .ats-template .text-xl, .basic-template .text-xl, .traditional-template .text-xl,
                .classic-template .text-xl,
                .aurora-template .text-lg, .vertex-template .text-lg, .horizon-template .text-lg,
                .lumen-template .text-lg, .modern-template .text-lg, .exclusive-template .text-lg,
                .ats-template .text-lg, .basic-template .text-lg, .traditional-template .text-lg,
                .classic-template .text-lg {
                    font-size: ${fontSettings.subheadingSize}px !important;
                    font-weight: ${fontSettings.subheadingWeight} !important;
                    font-family: ${fontSettings.fontFamily} !important;
                    line-height: 1.4 !important;
                }
                
                /* Body Text - Normal mətnlər */
                p, span, div, li, .text-base, .text-sm,
                .aurora-template p, .vertex-template p, .horizon-template p,
                .lumen-template p, .modern-template p, .exclusive-template p,
                .ats-template p, .basic-template p, .traditional-template p,
                .classic-template p,
                .aurora-template span, .vertex-template span, .horizon-template span,
                .lumen-template span, .modern-template span, .exclusive-template span,
                .ats-template span, .basic-template span, .traditional-template span,
                .classic-template span,
                .aurora-template div, .vertex-template div, .horizon-template div,
                .lumen-template div, .modern-template div, .exclusive-template div,
                .ats-template div, .basic-template div, .traditional-template div,
                .classic-template div,
                .aurora-template li, .vertex-template li, .horizon-template li,
                .lumen-template li, .modern-template li, .exclusive-template li,
                .ats-template li, .basic-template li, .traditional-template li,
                .classic-template li,
                .aurora-template .text-base, .vertex-template .text-base, .horizon-template .text-base,
                .lumen-template .text-base, .modern-template .text-base, .exclusive-template .text-base,
                .ats-template .text-base, .basic-template .text-base, .traditional-template .text-base,
                .classic-template .text-base,
                .aurora-template .text-sm, .vertex-template .text-sm, .horizon-template .text-sm,
                .lumen-template .text-sm, .modern-template .text-sm, .exclusive-template .text-sm,
                .ats-template .text-sm, .basic-template .text-sm, .traditional-template .text-sm,
                .classic-template .text-sm {
                    font-size: ${fontSettings.bodySize}px !important;
                    font-weight: ${fontSettings.bodyWeight} !important;
                    font-family: ${fontSettings.fontFamily} !important;
                    line-height: 1.5 !important;
                }
                
                /* Small Text - Kiçik mətnlər */
                .text-xs, .small-text,
                .aurora-template .text-xs, .vertex-template .text-xs, .horizon-template .text-xs,
                .lumen-template .text-xs, .modern-template .text-xs, .exclusive-template .text-xs,
                .ats-template .text-xs, .basic-template .text-xs, .traditional-template .text-xs,
                .classic-template .text-xs {
                    font-size: ${fontSettings.smallSize}px !important;
                    font-weight: ${fontSettings.smallWeight} !important;
                    font-family: ${fontSettings.fontFamily} !important;
                    line-height: 1.3 !important;
                }
                
                /* Section Spacing */
                .mb-6, .section-spacing,
                .aurora-template .mb-6, .vertex-template .mb-6, .horizon-template .mb-6,
                .lumen-template .mb-6, .modern-template .mb-6, .exclusive-template .mb-6,
                .ats-template .mb-6, .basic-template .mb-6, .traditional-template .mb-6,
                .classic-template .mb-6 {
                    margin-bottom: ${fontSettings.sectionSpacing}px !important;
                }
                
                /* Font Weight Classes */
                .font-bold {
                    font-weight: ${fontSettings.headingWeight} !important;
                }
                
                .font-semibold {
                    font-weight: ${fontSettings.subheadingWeight} !important;
                }
                
                .font-medium {
                    font-weight: ${fontSettings.bodyWeight} !important;
                }
                
                .font-normal {
                    font-weight: ${fontSettings.bodyWeight} !important;
                }
                
                /* FORCE EXPORT CONTAINER STYLES */
                .cv-preview-container * {
                    font-family: ${fontSettings.fontFamily} !important;
                }
                
                /* Override any inline styles with !important */
                .cv-preview-container h1[style*="font-size"],
                .cv-preview-container h2[style*="font-size"],
                .cv-preview-container h3[style*="font-size"],
                .cv-preview-container p[style*="font-size"],
                .cv-preview-container span[style*="font-size"],
                .cv-preview-container div[style*="font-size"] {
                    font-size: unset !important;
                }
                
                .cv-preview-container h1[style*="font-weight"],
                .cv-preview-container h2[style*="font-weight"],
                .cv-preview-container h3[style*="font-weight"],
                .cv-preview-container p[style*="font-weight"],
                .cv-preview-container span[style*="font-weight"],
                .cv-preview-container div[style*="font-weight"] {
                    font-weight: unset !important;
                }
                
                .cv-preview-container h1[style*="font-family"],
                .cv-preview-container h2[style*="font-family"],
                .cv-preview-container h3[style*="font-family"],
                .cv-preview-container p[style*="font-family"],
                .cv-preview-container span[style*="font-family"],
                .cv-preview-container div[style*="font-family"] {
                    font-family: ${fontSettings.fontFamily} !important;
                }
                
                @page {
                    size: A4;
                    margin: 0;
                }
                
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: white !important;
                    font-family: ${fontSettings.fontFamily} !important;
                    font-size: ${fontSettings.bodySize}px !important;
                    line-height: 1.4 !important;
                }
                
                .cv-preview { 
                    font-family: ${fontSettings.fontFamily} !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    box-sizing: border-box !important;
                }
                
                .cv-preview * { 
                    font-family: ${fontSettings.fontFamily} !important; 
                }
                
                .cv-preview h1, .cv-preview .name-style { 
                    font-size: ${fontSettings.nameSize}px !important; 
                    font-weight: ${fontSettings.headingWeight} !important;
                    line-height: 1.2 !important; 
                }
                
                .cv-preview h2, .cv-preview .heading-style { 
                    font-size: ${fontSettings.headingSize}px !important; 
                    font-weight: ${fontSettings.headingWeight} !important;
                    line-height: 1.3 !important; 
                }
                
                .cv-preview h3, .cv-preview .subheading-style { 
                    font-size: ${fontSettings.subheadingSize}px !important; 
                    font-weight: ${fontSettings.subheadingWeight} !important;
                    line-height: 1.3 !important; 
                }
                
                .cv-preview p, .cv-preview span, .cv-preview div, .cv-preview li { 
                    font-size: ${fontSettings.bodySize}px !important; 
                    font-weight: ${fontSettings.bodyWeight} !important;
                    line-height: 1.5 !important; 
                }
                
                .cv-preview .text-xs, .cv-preview .small-text { 
                    font-size: ${fontSettings.smallSize}px !important; 
                    font-weight: ${fontSettings.smallWeight} !important;
                }
                
                .cv-preview .text-sm { 
                    font-size: ${fontSettings.bodySize}px !important; 
                    font-weight: ${fontSettings.bodyWeight} !important;
                }
                
                .cv-preview .text-base { 
                    font-size: ${fontSettings.subheadingSize}px !important; 
                    font-weight: ${fontSettings.subheadingWeight} !important;
                }
                
                .cv-preview .text-lg { 
                    font-size: ${fontSettings.subheadingSize}px !important; 
                    font-weight: ${fontSettings.subheadingWeight} !important;
                }
                
                .cv-preview .text-xl, .cv-preview .text-2xl { 
                    font-size: ${fontSettings.headingSize}px !important; 
                    font-weight: ${fontSettings.headingWeight} !important;
                }
                
                .cv-preview .mb-6, .cv-preview .section-spacing {
                    margin-bottom: ${fontSettings.sectionSpacing}px !important;
                }
            `;
            
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
                
            const combinedStyles = styles + '\n' + dynamicFontCSS;

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
                                onClick={() => setShowFontPanel(!showFontPanel)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                            >
                                🎨 Font Ayarları
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

            {/* CV Preview - A4 Container with exact viewport matching */}
            <div className="flex justify-center py-8 bg-gray-100 print:bg-white print:py-0">
                <div 
                    className="cv-preview-container bg-white shadow-lg print:shadow-none"
                    style={{
                        width: '210mm',      // A4 width exactly  
                        minHeight: '297mm',  // A4 height exactly
                        maxWidth: '210mm',   // Lock to A4 width
                        padding: '0',        // Zero padding to match export
                        margin: '0 auto',    // Center the container
                        boxSizing: 'border-box',
                        position: 'relative'
                    }}
                >
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
            </div>

            {/* Font Panel - Sliding from right */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 print:hidden ${
                showFontPanel ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="h-full flex flex-col">
                    {/* Panel Header */}
                    <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">🎨 Font Ayarları</h3>
                        <button
                            onClick={() => setShowFontPanel(false)}
                            className="text-white hover:bg-purple-700 p-1 rounded"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Panel Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Font Family */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Font Ailesi
                            </label>
                            <select
                                value={fontSettings.fontFamily}
                                onChange={(e) => setFontSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            >
                                {FONT_OPTIONS.map(font => (
                                    <option key={font.id} value={font.fontFamily}>
                                        {font.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Font Sizes */}
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-800">Font Ölçüləri</h4>
                            
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Ad Ölçüsü: {fontSettings.nameSize}px</label>
                                <input
                                    type="range"
                                    min="20"
                                    max="32"
                                    value={fontSettings.nameSize}
                                    onChange={(e) => setFontSettings(prev => ({ ...prev, nameSize: parseInt(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Başlıq Ölçüsü: {fontSettings.headingSize}px</label>
                                <input
                                    type="range"
                                    min="14"
                                    max="24"
                                    value={fontSettings.headingSize}
                                    onChange={(e) => setFontSettings(prev => ({ ...prev, headingSize: parseInt(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Alt Başlıq Ölçüsü: {fontSettings.subheadingSize}px</label>
                                <input
                                    type="range"
                                    min="12"
                                    max="20"
                                    value={fontSettings.subheadingSize}
                                    onChange={(e) => setFontSettings(prev => ({ ...prev, subheadingSize: parseInt(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Mətn Ölçüsü: {fontSettings.bodySize}px</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="18"
                                    value={fontSettings.bodySize}
                                    onChange={(e) => setFontSettings(prev => ({ ...prev, bodySize: parseInt(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Kiçik Mətn Ölçüsü: {fontSettings.smallSize}px</label>
                                <input
                                    type="range"
                                    min="8"
                                    max="14"
                                    value={fontSettings.smallSize}
                                    onChange={(e) => setFontSettings(prev => ({ ...prev, smallSize: parseInt(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>
                        </div>

                        {/* Font Weights */}
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-800">Font Çəkisi</h4>
                            
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Başlıq Çəkisi: {fontSettings.headingWeight}</label>
                                <input
                                    type="range"
                                    min="400"
                                    max="900"
                                    step="100"
                                    value={fontSettings.headingWeight}
                                    onChange={(e) => setFontSettings(prev => ({ ...prev, headingWeight: parseInt(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Alt Başlıq Çəkisi: {fontSettings.subheadingWeight}</label>
                                <input
                                    type="range"
                                    min="400"
                                    max="800"
                                    step="100"
                                    value={fontSettings.subheadingWeight}
                                    onChange={(e) => setFontSettings(prev => ({ ...prev, subheadingWeight: parseInt(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>
                        </div>

                        {/* Section Spacing */}
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-800">Bölmə Arası Məsafə</h4>
                            
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Bölmə Məsafəsi: {fontSettings.sectionSpacing}px</label>
                                <input
                                    type="range"
                                    min="4"
                                    max="24"
                                    value={fontSettings.sectionSpacing}
                                    onChange={(e) => setFontSettings(prev => ({ ...prev, sectionSpacing: parseInt(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>
                        </div>

                        {/* Reset Button */}
                        <div className="pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setFontSettings({
                                    fontFamily: 'Arial, sans-serif',
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
                                })}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                🔄 Sıfırla
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay when font panel is open */}
            {showFontPanel && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 print:hidden"
                    onClick={() => setShowFontPanel(false)}
                />
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
                    .ats-template .mb-4, .basic-template .mb-4, .traditional-template .mb-4 {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin-bottom: 12px !important;
                    }
                    
                    /* Larger sections - allow breaks if necessary */
                    .cv-section.large-section,
                    .aurora-template .mb-6, .vertex-template .mb-6, .horizon-template .mb-6,
                    .lumen-template .mb-6, .modern-template .mb-6, .exclusive-template .mb-6,
                    .ats-template .mb-6, .basic-template .mb-6, .traditional-template .mb-6 {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                        margin-bottom: 16px !important;
                    }
                    
                    /* Headers - never break after headers */
                    .cv-section h1, .cv-section h2, .cv-section h3,
                    .aurora-template h1, .vertex-template h1, .horizon-template h1,
                    .lumen-template h1, .modern-template h1, .exclusive-template h1,
                    .ats-template h1, .basic-template h1, .traditional-template h1,
                    .aurora-template h2, .vertex-template h2, .horizon-template h2,
                    .lumen-template h2, .modern-template h2, .exclusive-template h2,
                    .ats-template h2, .basic-template h2, .traditional-template h2 {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        orphans: 3 !important; /* Minimum 3 lines before page break */
                        widows: 3 !important; /* Minimum 3 lines after page break */
                    }
                    
                    /* Individual items - try to keep together */
                    .experience-item, .education-item, .project-item,
                    .aurora-template .space-y-2 > div, .vertex-template .space-y-2 > div,
                    .lumen-template .space-y-2 > div, .modern-template .space-y-2 > div,
                    .exclusive-template .space-y-2 > div, .ats-template .space-y-2 > div,
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
                    .exclusive-template .mb-6:first-child, .ats-template .mb-6:first-child,
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
