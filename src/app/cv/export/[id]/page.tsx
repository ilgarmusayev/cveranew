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
                    data: cv.data
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
                    />
                </div>
            </div>

            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        background: white !important;
                    }
                    
                    .print\\:hidden {
                        display: none !important;
                    }
                    
                    .max-w-7xl {
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .bg-white {
                        background: white !important;
                    }
                    
                    .rounded-lg {
                        border-radius: 0 !important;
                    }
                    
                    .shadow-lg {
                        box-shadow: none !important;
                    }
                    
                    .p-8 {
                        padding: 0 !important;
                    }
                    
                    /* A4 page setup */
                    @page {
                        size: A4;
                        margin: 0;
                    }
                }
            `}</style>
        </div>
    );
}
