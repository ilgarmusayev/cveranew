'use client';

import { useState } from 'react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface ATSAnalysis {
  overall_score: number;
  category_scores: {
    format: number;
    content: number;
    keywords: number;
    structure: number;
  };
  suggestions: string[];
  detailed_analysis: any;
}

interface AnalysisResult {
  success: boolean;
  filename: string;
  filesize: number;
  filetype: string;
  text_length: number;
  analysis: ATSAnalysis;
}

export default function ATSYoxlaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const { siteLanguage } = useSiteLanguage();

  const getLabels = () => {
    const labels = {
      azerbaijani: {
        title: 'ATS Uyğunluq Yoxlanılması',
        subtitle: 'CV-nizi ATS (Applicant Tracking System) sistemləri üçün analiz edin',
        uploadTitle: 'CV Faylını Yükləyin',
        uploadDescription: 'PDF və ya DOCX formatında CV faylınızı seçin',
        selectFile: 'Fayl Seç',
        analyzeButton: 'Analiz Et',
        analyzing: 'Analiz edilir...',
        overallScore: 'Ümumi Bal',
        categoryScores: 'Kateqoriya Balları',
        suggestions: 'Təkliflər',
        detailedAnalysis: 'Ətraflı Analiz',
        format: 'Format',
        content: 'Məzmun',
        keywords: 'Açar Sözlər',
        structure: 'Struktur',
        fileInfo: 'Fayl Məlumatları',
        filename: 'Fayl adı',
        filesize: 'Fayl ölçüsü',
        textLength: 'Mətn uzunluğu',
        newAnalysis: 'Yeni Analiz',
        excellent: 'Əla',
        good: 'Yaxşı',
        average: 'Orta',
        poor: 'Zəif'
      },
      english: {
        title: 'ATS Compatibility Check',
        subtitle: 'Analyze your CV for ATS (Applicant Tracking System) compatibility',
        uploadTitle: 'Upload CV File',
        uploadDescription: 'Select your CV file in PDF or DOCX format',
        selectFile: 'Select File',
        analyzeButton: 'Analyze',
        analyzing: 'Analyzing...',
        overallScore: 'Overall Score',
        categoryScores: 'Category Scores',
        suggestions: 'Suggestions',
        detailedAnalysis: 'Detailed Analysis',
        format: 'Format',
        content: 'Content',
        keywords: 'Keywords',
        structure: 'Structure',
        fileInfo: 'File Information',
        filename: 'Filename',
        filesize: 'File size',
        textLength: 'Text length',
        newAnalysis: 'New Analysis',
        excellent: 'Excellent',
        good: 'Good',
        average: 'Average',
        poor: 'Poor'
      },
      russian: {
        title: 'ATS Uyğunluq Yoxlanılması',
        subtitle: 'CV-nizi ATS (Applicant Tracking System) sistemləri üçün analiz edin',
        uploadTitle: 'CV Faylını Yükləyin',
        uploadDescription: 'PDF və ya DOCX formatında CV faylınızı seçin',
        selectFile: 'Fayl Seç',
        analyzeButton: 'Analiz Et',
        analyzing: 'Analiz edilir...',
        overallScore: 'Ümumi Bal',
        categoryScores: 'Kateqoriya Balları',
        suggestions: 'Təkliflər',
        detailedAnalysis: 'Ətraflı Analiz',
        format: 'Format',
        content: 'Məzmun',
        keywords: 'Açar Sözlər',
        structure: 'Struktur',
        fileInfo: 'Fayl Məlumatları',
        filename: 'Fayl adı',
        filesize: 'Fayl ölçüsü',
        textLength: 'Mətn uzunluğu',
        newAnalysis: 'Yeni Analiz',
        excellent: 'Əla',
        good: 'Yaxşı',
        average: 'Orta',
        poor: 'Zəif'
      }
    };
    return labels[siteLanguage as keyof typeof labels] || labels.azerbaijani;
  };

  const labels = getLabels();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Fayl formatını yoxla
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.docx')) {
        setFile(selectedFile);
        setError('');
        setResults(null);
      } else {
        setError('Yalnız PDF və DOCX faylları dəstəklənir');
        setFile(null);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Xahiş olunur fayl seçin');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/atsyoxla', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Analiz zamanı xəta baş verdi');
      }
    } catch (err) {
      console.error('Analiz xətası:', err);
      setError('Server ilə əlaqə zamanı xəta baş verdi');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return labels.excellent;
    if (score >= 60) return labels.good;
    if (score >= 40) return labels.average;
    return labels.poor;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-gradient-to-br from-teal-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 md:p-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {labels.title}
                  </h1>
                  <p className="text-blue-100 text-lg">
                    {labels.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {!results && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{labels.uploadTitle}</h2>
              <p className="text-gray-600 mb-8">{labels.uploadDescription}</p>

              <div className="max-w-md mx-auto space-y-4">
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label
                    htmlFor="cv-upload"
                    className="block w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold cursor-pointer transform hover:scale-105 active:scale-95"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>{labels.selectFile}</span>
                    </span>
                  </label>
                </div>

                {file && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-semibold text-green-800">{file.name}</p>
                        <p className="text-sm text-green-600">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{labels.analyzing}</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span>{labels.analyzeButton}</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-8">
            {/* Overall Score */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{labels.overallScore}</h2>
                <div className="flex items-center justify-center space-x-8">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={results.analysis.overall_score >= 80 ? '#10b981' : results.analysis.overall_score >= 60 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="2"
                        strokeDasharray={`${results.analysis.overall_score}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{results.analysis.overall_score}</div>
                        <div className="text-sm text-gray-600">/ 100</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className={`text-2xl font-bold mb-2 px-4 py-2 rounded-2xl ${getScoreColor(results.analysis.overall_score)}`}>
                      {getScoreLabel(results.analysis.overall_score)}
                    </div>
                    <p className="text-gray-600 max-w-md">
                      CV-niz ATS sistemləri tərəfindən {results.analysis.overall_score}% uyğunluq göstərir
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Scores */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{labels.categoryScores}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(results.analysis.category_scores).map(([category, score]) => (
                  <div key={category} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="3"
                          strokeDasharray={`${score}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold">{score}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {labels[category as keyof typeof labels] || category}
                    </h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{labels.suggestions}</h2>
              <div className="space-y-4">
                {results.analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-blue-900">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* File Info */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{labels.fileInfo}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                  <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-semibold text-gray-900">{labels.filename}</p>
                  <p className="text-sm text-gray-600">{results.filename}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                  <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <p className="font-semibold text-gray-900">{labels.filesize}</p>
                  <p className="text-sm text-gray-600">{formatFileSize(results.filesize)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                  <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-semibold text-gray-900">{labels.textLength}</p>
                  <p className="text-sm text-gray-600">{results.text_length.toLocaleString()} simvol</p>
                </div>
              </div>
            </div>

            {/* New Analysis Button */}
            <div className="text-center">
              <button
                onClick={() => {
                  setResults(null);
                  setFile(null);
                  setError('');
                }}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105 active:scale-95"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{labels.newAnalysis}</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}