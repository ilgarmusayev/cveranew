'use client';

import { useState, useEffect } from 'react';
import StandardHeader from '@/components/ui/StandardHeader';
import { apiClient } from '@/lib/api';

// Interview mərhələləri
type InterviewStage = 'selection' | 'interview' | 'result';

// Level və Language tipləri
type LevelType = 'junior' | 'mid' | 'senior';
type ModeType = 'text' | 'voice';
type LanguageType = 'az' | 'en' | 'ru';

interface CV {
    id: string;
    title: string;
    personalInfo?: {
        fullName?: string;
        title?: string;
    };
}

interface InterviewConfig {
    cvId: string | null;
    jobDescription: string;
    level: LevelType | null;
    mode: ModeType;
    language: LanguageType;
}

interface Question {
    id: number;
    question: string;
    answer: string;
}

interface InterviewResult {
    overallScore: number;
    categoryScores: {
        technical: number;
        communication: number;
        confidence: number;
        problemSolving: number;
        relevance: number;
    };
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    generalFeedback: string;
}

const LEVELS = [
    { id: 'junior' as LevelType, name: 'Junior', description: 'Təcrübəsi 0-2 il' },
    { id: 'mid' as LevelType, name: 'Middle', description: 'Təcrübəsi 2-5 il' },
    { id: 'senior' as LevelType, name: 'Senior', description: 'Təcrübəsi 5+ il' },
];

const LANGUAGES = [
    { id: 'az' as LanguageType, name: 'Azərbaycan', flag: '🇦🇿', description: 'Suallar Azərbaycan dilində olacaq' },
    { id: 'en' as LanguageType, name: 'English', flag: '🇬🇧', description: 'Questions will be in English' },
    { id: 'ru' as LanguageType, name: 'Русский', flag: '🇷🇺', description: 'Вопросы будут на русском языке' },
];

export default function MockInterviewPage() {
    const [stage, setStage] = useState<InterviewStage>('selection');
    const [config, setConfig] = useState<InterviewConfig>({
        cvId: null,
        jobDescription: '',
        level: null,
        mode: 'text',
        language: 'az',
    });
    const [cvList, setCvList] = useState<CV[]>([]);
    const [loadingCVs, setLoadingCVs] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<InterviewResult | null>(null);

    // CV-ləri yüklə
    useEffect(() => {
        const fetchCVs = async () => {
            try {
                const { data } = await apiClient.get('/api/cv');
                
                console.log('📋 Mock Interview - CV API response:', data);
                console.log('📋 Mock Interview - CVs count:', data.cvs?.length || 0);
                
                if (data.success) {
                    setCvList(data.cvs || []);
                    console.log('✅ Mock Interview - CV list updated:', data.cvs?.length || 0);
                } else {
                    console.error('❌ Mock Interview - CV-lər yüklənə bilmədi:', data.error);
                }
            } catch (error) {
                console.error('❌ Mock Interview - CV-lər yüklənərkən xəta:', error);
                // Əgər 401 olarsa apiClient avtomatik login-ə redirect edəcək
            } finally {
                setLoadingCVs(false);
            }
        };
        fetchCVs();
    }, []);

    // Müsahibəni başlat
    const startInterview = async () => {
        if (!config.cvId || !config.jobDescription.trim() || !config.level) {
            alert('Zəhmət olmasa CV, vakansiya təsviri və səviyyə daxil edin');
            return;
        }

        setIsLoading(true);
        try {
            // Token al
            const token = localStorage.getItem('accessToken');
            
            const response = await fetch('/api/mock-interview/start', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cvId: config.cvId,
                    jobDescription: config.jobDescription,
                    level: config.level,
                    mode: config.mode,
                    language: config.language,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setQuestions(data.questions.map((q: string, index: number) => ({
                    id: index + 1,
                    question: q,
                    answer: '',
                })));
                setStage('interview');
            } else {
                alert(data.error || 'Xəta baş verdi');
            }
        } catch (error) {
            console.error('Müsahibə başladılarkən xəta:', error);
            alert('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
        } finally {
            setIsLoading(false);
        }
    };

    // Növbəti suala keç
    const handleNextQuestion = async () => {
        if (!currentAnswer.trim()) {
            alert('Zəhmət olmasa cavab yazın');
            return;
        }

        // Cavabı saxla
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex].answer = currentAnswer;
        setQuestions(updatedQuestions);
        setCurrentAnswer('');

        // Növbəti sual
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Müsahibə bitdi - analiz et
            await analyzeInterview(updatedQuestions);
        }
    };

    // Müsahibəni analiz et
    const analyzeInterview = async (allQuestions: Question[]) => {
        setIsLoading(true);
        try {
            // Token al
            const token = localStorage.getItem('accessToken');
            
            const response = await fetch('/api/mock-interview/analyze', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cvId: config.cvId,
                    jobDescription: config.jobDescription,
                    level: config.level,
                    questions: allQuestions,
                    language: config.language,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setResult(data.result);
                setStage('result');
            } else {
                alert(data.error || 'Analiz zamanı xəta');
            }
        } catch (error) {
            console.error('Analiz zamanı xəta:', error);
            alert('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
        } finally {
            setIsLoading(false);
        }
    };

    // Yenidən başla
    const resetInterview = () => {
        setStage('selection');
        setConfig({ cvId: null, jobDescription: '', level: null, mode: 'text', language: 'az' });
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setCurrentAnswer('');
        setResult(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <StandardHeader />
            
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        🎤 Müsahibəyə Hazırlıq
                    </h1>
                    <p className="text-lg text-gray-600">
                        AI köməkçisi ilə real müsahibə təcrübəsi əldə edin
                    </p>
                </div>

                {/* Progress Indicator */}
                {stage !== 'selection' && (
                    <div className="mb-8">
                        <div className="flex items-center justify-center space-x-4">
                            <div className={`flex items-center ${stage === 'interview' ? 'text-blue-600' : 'text-green-600'}`}>
                                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                                    ✓
                                </div>
                                <span className="ml-2 font-medium">Seçim</span>
                            </div>
                            <div className="w-16 h-1 bg-gray-300"></div>
                            <div className={`flex items-center ${stage === 'interview' ? 'text-blue-600' : stage === 'result' ? 'text-green-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full ${stage === 'interview' ? 'bg-blue-600' : stage === 'result' ? 'bg-green-600' : 'bg-gray-300'} text-white flex items-center justify-center font-bold`}>
                                    {stage === 'result' ? '✓' : '2'}
                                </div>
                                <span className="ml-2 font-medium">Müsahibə</span>
                            </div>
                            <div className="w-16 h-1 bg-gray-300"></div>
                            <div className={`flex items-center ${stage === 'result' ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full ${stage === 'result' ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center font-bold`}>
                                    3
                                </div>
                                <span className="ml-2 font-medium">Nəticə</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Selection Stage */}
                {stage === 'selection' && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        {/* CV Selection - Dropdown */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                1️⃣ CV-nizi seçin
                            </h2>
                            {loadingCVs ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">CV-lər yüklənir...</p>
                                </div>
                            ) : cvList.length === 0 ? (
                                <div className="text-center py-8 bg-yellow-50 rounded-xl border border-yellow-200">
                                    <p className="text-gray-700 mb-4">Heç bir CV tapılmadı.</p>
                                    <a href="/dashboard" className="text-blue-600 hover:underline font-medium">
                                        İlk öncə CV yaradın →
                                    </a>
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        value={config.cvId || ''}
                                        onChange={(e) => setConfig({ ...config, cvId: e.target.value })}
                                        className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none text-gray-900 bg-white text-lg appearance-none cursor-pointer hover:border-blue-400 transition-colors"
                                    >
                                        <option value="">CV seçin...</option>
                                        {cvList.map((cv) => (
                                            <option key={cv.id} value={cv.id}>
                                                📄 {cv.title || cv.personalInfo?.fullName || 'CV'} 
                                                {cv.personalInfo?.title ? ` - ${cv.personalInfo.title}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Position Selection - Dropdown */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                2️⃣ Vakansiya təsvirini daxil edin
                            </h2>
                            <textarea
                                value={config.jobDescription}
                                onChange={(e) => setConfig({ ...config, jobDescription: e.target.value })}
                                rows={6}
                                placeholder="Məsələn: Senior Frontend Developer vəzifəsi üçün müsahibə. React, TypeScript, Next.js bilməli. 5+ il təcrübə. Komanda ilə işləmə bacarığı. REST API və GraphQL bilməli..."
                                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none text-gray-900 bg-white resize-none"
                            />
                            <p className="text-sm text-gray-500 mt-2">💡 Vakansiya təsviri nə qədər ətraflı olsa, AI o qədər dəqiq suallar verəcək</p>
                        </div>

                        {/* Language Selection */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                3️⃣ Müsahibə dilini seçin
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">🌐 AI tərəfindən verilən suallar və nəticələr bu dildə olacaq</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.id}
                                        onClick={() => setConfig({ ...config, language: lang.id })}
                                        className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                                            config.language === lang.id
                                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className="text-4xl mb-2">{lang.flag}</div>
                                        <div className="text-lg font-bold text-gray-900 mb-1">
                                            {lang.name}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {lang.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Level Selection */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                4️⃣ Səviyyəni seçin
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{LEVELS.map((lvl) => (
                                    <button
                                        key={lvl.id}
                                        onClick={() => setConfig({ ...config, level: lvl.id })}
                                        className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                                            config.level === lvl.id
                                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className="text-xl font-bold text-gray-900 mb-2">
                                            {lvl.name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {lvl.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mode Selection */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                3️⃣ Müsahibə rejimini seçin
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setConfig({ ...config, mode: 'text' })}
                                    className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                                        config.mode === 'text'
                                            ? 'border-blue-600 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="text-3xl mb-2">✍️</div>
                                    <div className="text-xl font-bold text-gray-900 mb-2">
                                        Yazılı müsahibə
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Sualları oxuyub yazılı cavab verin
                                    </div>
                                </button>
                                <button
                                    onClick={() => setConfig({ ...config, mode: 'voice' })}
                                    disabled
                                    className="p-6 rounded-xl border-2 border-gray-200 opacity-50 cursor-not-allowed"
                                >
                                    <div className="text-3xl mb-2">🎙️</div>
                                    <div className="text-xl font-bold text-gray-900 mb-2">
                                        Səsli müsahibə
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Tezliklə aktivləşəcək
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Start Button */}
                        <div className="text-center">
                            <button
                                onClick={startInterview}
                                disabled={!config.jobDescription.trim() || !config.level || isLoading}
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                        Hazırlanır...
                                    </div>
                                ) : (
                                    '🚀 Müsahibəyə başla'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Interview Stage */}
                {stage === 'interview' && questions.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        {/* Progress */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Sual {currentQuestionIndex + 1} / {questions.length}</span>
                                <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% tamamlandı</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Question */}
                        <div className="mb-8">
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                                <div className="flex items-start">
                                    <div className="text-4xl mr-4">🤖</div>
                                    <div>
                                        <div className="text-sm text-gray-600 mb-2">AI Müsahibəçi soruşur:</div>
                                        <div className="text-xl font-medium text-gray-900">
                                            {questions[currentQuestionIndex].question}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Answer Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cavabınız:
                                </label>
                                <textarea
                                    value={currentAnswer}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Cavabınızı daxil edin..."
                                />
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between">
                            <button
                                onClick={resetInterview}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                            >
                                ← Ləğv et
                            </button>
                            <button
                                onClick={handleNextQuestion}
                                disabled={!currentAnswer.trim() || isLoading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                        Analiz edilir...
                                    </div>
                                ) : currentQuestionIndex < questions.length - 1 ? (
                                    'Növbəti sual →'
                                ) : (
                                    'Müsahibəni bitir →'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Result Stage */}
                {stage === 'result' && result && (
                    <div className="space-y-6">
                        {/* Overall Score */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white text-center">
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-3xl font-bold mb-2">Müsahibə tamamlandı!</h2>
                            <div className="text-5xl font-bold mb-2">{result.overallScore}/100</div>
                            <div className="text-xl opacity-90">Ümumi nəticə</div>
                        </div>

                        {/* Category Scores */}
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">📊 Kateqoriyalar üzrə qiymətlər</h3>
                            <div className="space-y-4">
                                {[
                                    { key: 'technical', label: 'Texniki Bilik', icon: '💻' },
                                    { key: 'communication', label: 'Kommunikasiya', icon: '💬' },
                                    { key: 'confidence', label: 'Özünəinam', icon: '💪' },
                                    { key: 'problemSolving', label: 'Problem həlli', icon: '🧩' },
                                    { key: 'relevance', label: 'Uyğunluq', icon: '🎯' },
                                ].map(({ key, label, icon }) => (
                                    <div key={key}>
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium text-gray-900">
                                                {icon} {label}
                                            </span>
                                            <span className="font-bold text-blue-600">
                                                {result.categoryScores[key as keyof typeof result.categoryScores]}/10
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                                                style={{ width: `${(result.categoryScores[key as keyof typeof result.categoryScores] / 10) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-xl p-8">
                                <h3 className="text-2xl font-bold text-green-600 mb-4">✅ Güclü tərəflər</h3>
                                <ul className="space-y-2">
                                    {result.strengths.map((strength, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="text-green-500 mr-2">•</span>
                                            <span className="text-gray-700">{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-white rounded-2xl shadow-xl p-8">
                                <h3 className="text-2xl font-bold text-orange-600 mb-4">⚠️ Zəif tərəflər</h3>
                                <ul className="space-y-2">
                                    {result.weaknesses.map((weakness, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="text-orange-500 mr-2">•</span>
                                            <span className="text-gray-700">{weakness}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h3 className="text-2xl font-bold text-blue-600 mb-4">💡 Təkmilləşdirmə tövsiyələri</h3>
                            <ul className="space-y-3">
                                {result.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-blue-500 mr-2 font-bold">{index + 1}.</span>
                                        <span className="text-gray-700">{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* General Feedback */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-xl p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">📝 Ümumi rəy</h3>
                            <p className="text-gray-700 leading-relaxed">{result.generalFeedback}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={resetInterview}
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                🔄 Yeni müsahibə
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all"
                            >
                                📄 PDF yüklə
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
