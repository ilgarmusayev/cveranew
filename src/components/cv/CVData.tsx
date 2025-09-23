'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CVEditor from '@/components/cv/CVEditor';
import { ApiClient } from '@/lib/api';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { getLoadingMessages } from '@/components/ui/Loading';

const apiClient = new ApiClient();

interface CVDataProps {
    cvId: string;
    onSave: (cv: any) => void;
    onCancel: () => void;
    userTier: string;
}

export default function CVData({ cvId, onSave, onCancel, userTier }: CVDataProps) {
    const [cvData, setCvData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const { siteLanguage } = useSiteLanguage();
    const loadingMessages = getLoadingMessages(siteLanguage);

    const labels = {
        azerbaijani: {
            preparingData: 'Məlumatlar hazırlanır'
        },
        english: {
            preparingData: 'Preparing data'
        },
        russian: {
            preparingData: 'Подготовка данных'
        }
    };

    const content = labels[siteLanguage];

    useEffect(() => {
        loadCV();
    }, [cvId]);

    const loadCV = async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('🔄 Loading CV with ID:', cvId);
            
            const response = await apiClient.get(`/api/cv/${cvId}`);
            console.log('📥 Raw API response:', response);
            
            // apiClient returns { data, status } format
            const cvData = response.data;
            
            if (cvData && cvData.id) {
                console.log('👤 Personal Info from CV data:', cvData.data?.personalInfo);
                setCvData(cvData);
            } else {
                throw new Error('Invalid CV data format received');
            }
            
        } catch (error: any) {
            console.error('❌ Failed to load CV:', error);
            setError(error.message || 'CV yüklənmədi');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{loadingMessages.cvLoading}</h3>
                        <p className="text-gray-600">{content.preparingData}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Xəta baş verdi</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="flex space-x-3">
                            <button
                                onClick={loadCV}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Yenidən cəhd et
                            </button>
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Geri qayıt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <CVEditor
            cvId={cvId}
            onSave={onSave}
            onCancel={onCancel}
            initialData={cvData}
            userTier={userTier}
        />
    );
}
