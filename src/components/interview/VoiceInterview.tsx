'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceInterviewProps {
    position: string;
    level: string;
    cvId: string;
    onComplete: (transcript: { question: string; answer: string }[]) => void;
    onCancel: () => void;
}

export default function VoiceInterview({ 
    position, 
    level, 
    cvId, 
    onComplete, 
    onCancel 
}: VoiceInterviewProps) {
    const [isListening, setIsListening] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [transcript, setTranscript] = useState<{ question: string; answer: string }[]>([]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const [voicesLoaded, setVoicesLoaded] = useState(false);

    // Web Speech API - Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Speech Synthesis - səsləri yüklə
            synthRef.current = window.speechSynthesis;
            
            // Səslərin yüklənməsini gözlə
            const loadVoices = () => {
                const voices = synthRef.current?.getVoices() || [];
                if (voices.length > 0) {
                    setVoicesLoaded(true);
                    console.log('🔊 Available voices:', voices.length);
                    console.log('🗣️ Azerbaijani voices (az-Latn-AZ):', voices.filter(v => v.lang === 'az-Latn-AZ').map(v => v.name));
                    console.log('🗣️ Azerbaijani voices (az-AZ):', voices.filter(v => v.lang === 'az-AZ').map(v => v.name));
                    console.log('🗣️ All Azerbaijani voices:', voices.filter(v => v.lang.startsWith('az')).map(v => `${v.name} (${v.lang})`));
                    console.log('🗣️ Turkish voices:', voices.filter(v => v.lang === 'tr-TR').map(v => v.name));
                }
            };

            // Səslər asenkron yüklənə bilər
            if (synthRef.current) {
                loadVoices();
                synthRef.current.onvoiceschanged = loadVoices;
            }

            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'az-Latn-AZ'; // Azərbaycan dili (Latin əlifbası)

                recognitionRef.current.onresult = (event: any) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript + ' ';
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    if (finalTranscript) {
                        setCurrentAnswer(prev => prev + finalTranscript);
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    if (isListening) {
                        recognitionRef.current.start(); // Restart if should be listening
                    }
                };
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, [isListening]);

    // İlk sualı al və oxu
    useEffect(() => {
        if (questionIndex === 0 && voicesLoaded) {
            fetchAndSpeakQuestion();
        }
    }, [voicesLoaded]);

    // Sualı Gemini-dən al və səslə oxu
    const fetchAndSpeakQuestion = async () => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('accessToken');
            
            const response = await fetch('/api/mock-interview/voice/question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cvId,
                    position,
                    level,
                    questionIndex,
                    previousQA: transcript,
                }),
            });

            const data = await response.json();
            
            if (data.success && data.question) {
                setCurrentQuestion(data.question);
                speakText(data.question);
            }
        } catch (error) {
            console.error('Sual alınarkən xəta:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Mətni səslə oxu (TTS)
    const speakText = (text: string) => {
        if (!synthRef.current || !voicesLoaded) {
            console.warn('⚠️ Speech synthesis not ready');
            return;
        }

        synthRef.current.cancel(); // Əvvəlki danışığı dayandır

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Mövcud səsləri al
        const voices = synthRef.current.getVoices();
        console.log('🔊 Total voices available:', voices.length);
        
        // Bütün mövcud səsləri göstər
        voices.forEach((voice, index) => {
            console.log(`  ${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
        });
        
        // Azərbaycan dili səsini tap (az-Latn-AZ prioritet, sonra az-AZ, sonra az)
        let selectedVoice = voices.find(voice => 
            voice.lang === 'az-Latn-AZ'
        );
        
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.lang === 'az-AZ'
            );
        }
        
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.lang.toLowerCase().startsWith('az')
            );
        }
        
        console.log('🗣️ Azerbaijani voice:', selectedVoice?.name || 'Not found');
        
        // Əgər Azərbaycan dili yoxdursa, Türk dilini (tr-TR, tr) istifadə et
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.lang.toLowerCase().startsWith('tr')
            );
            console.log('🗣️ Fallback to Turkish voice:', selectedVoice?.name || 'Not found');
        }
        
        // Rus dilini sına (bəzi hallar üçün)
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.lang.toLowerCase().startsWith('ru')
            );
            console.log('🗣️ Fallback to Russian voice:', selectedVoice?.name || 'Not found');
        }
        
        // Əgər heç biri yoxdursa, ingilis dilində qadın səsi
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.lang.toLowerCase().startsWith('en') && 
                (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
            );
            console.log('🗣️ Fallback to English female voice:', selectedVoice?.name || 'Not found');
        }
        
        // Ən yaxşı səsi seç (istənilən ingilis)
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.lang.toLowerCase().startsWith('en')
            );
            console.log('🗣️ Fallback to any English voice:', selectedVoice?.name || 'Not found');
        }
        
        // Heç bir şey tapılmadısa, ilk mövcud səsi götür
        if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
            console.log('🗣️ Fallback to first available voice:', selectedVoice.name);
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang; // Səsin dilinə uyğunlaşdır
            console.log('✅ Selected voice:', selectedVoice.name, '(' + selectedVoice.lang + ')');
        } else {
            console.error('❌ No voices available!');
            utterance.lang = 'tr-TR'; // Ehtiyat dil
        }
        
        utterance.rate = 0.85; // Danışıq sürəti (0.1-10) - bir az yavaş aydınlıq üçün
        utterance.pitch = 1.0; // Səs tonu (0-2)
        utterance.volume = 1.0; // Səs həcmi (0-1)

        utterance.onstart = () => {
            setIsSpeaking(true);
            console.log('🎤 Started speaking:', text.substring(0, 50) + '...');
        };
        
        utterance.onend = () => {
            setIsSpeaking(false);
            console.log('✔️ Finished speaking');
            // Sual oxunandan sonra dinləməyə başla
            startListening();
        };
        
        utterance.onerror = (event) => {
            console.error('❌ Speech synthesis error:', event.error, event);
            setIsSpeaking(false);
            // Error olsa da dinləməyə başla
            startListening();
        };

        console.log('🔊 Speaking with settings:', {
            voice: utterance.voice?.name,
            lang: utterance.lang,
            rate: utterance.rate,
            pitch: utterance.pitch,
            volume: utterance.volume
        });

        synthRef.current.speak(utterance);
    };

    // Mikrofonu başlat
    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setCurrentAnswer('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    // Mikrofonu dayandır
    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    // Cavabı təsdiqlə və növbəti suala keç
    const submitAnswer = async () => {
        if (!currentAnswer.trim()) {
            alert('Zəhmət olmasa cavab verin');
            return;
        }

        stopListening();

        // Transkripta əlavə et
        const newTranscript = [...transcript, { question: currentQuestion, answer: currentAnswer }];
        setTranscript(newTranscript);

        // Əgər 5 sual tamamdırsa
        if (questionIndex >= 4) {
            onComplete(newTranscript);
        } else {
            // Növbəti sual
            setQuestionIndex(questionIndex + 1);
            setCurrentAnswer('');
            fetchAndSpeakQuestion();
        }
    };

    // Səsli müsahibəni ləğv et
    const handleCancel = () => {
        stopListening();
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        onCancel();
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎙️</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Səsli Müsahibə
                </h2>
                <p className="text-gray-600">
                    Sual {questionIndex + 1} / 5
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                        style={{ width: `${((questionIndex + 1) / 5) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Current Question */}
            <div className="mb-8">
                <div className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 ${
                    isSpeaking ? 'border-blue-500 animate-pulse' : 'border-blue-200'
                }`}>
                    <div className="flex items-start">
                        <div className="text-4xl mr-4">
                            {isSpeaking ? '🔊' : '🤖'}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm text-gray-600 mb-2">
                                {isSpeaking ? 'AI oxuyur...' : 'AI Müsahibəçi:'}
                            </div>
                            <div className="text-xl font-medium text-gray-900">
                                {currentQuestion || 'Sual hazırlanır...'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Voice Input Status */}
            <div className="mb-8">
                <div className={`rounded-xl p-6 border-2 transition-all ${
                    isListening 
                        ? 'bg-red-50 border-red-500' 
                        : 'bg-gray-50 border-gray-200'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-3 ${
                                isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                            }`}></div>
                            <span className="font-medium text-gray-900">
                                {isListening ? '🎤 Dinləyirəm...' : '🔇 Dinləmə dayandırılıb'}
                            </span>
                        </div>
                        
                        {!isSpeaking && (
                            <button
                                onClick={isListening ? stopListening : startListening}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    isListening
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {isListening ? '⏸️ Dayandır' : '▶️ Başlat'}
                            </button>
                        )}
                    </div>

                    {/* Transcript */}
                    <div className="bg-white rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                        <div className="text-sm text-gray-600 mb-2">Sizin cavabınız:</div>
                        <div className="text-gray-900">
                            {currentAnswer || 'Cavabınızı səslə deyin...'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-4">
                <button
                    onClick={handleCancel}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                    ❌ Ləğv et
                </button>

                <div className="flex gap-3">
                    {isListening && (
                        <button
                            onClick={stopListening}
                            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all"
                        >
                            ⏸️ Dayandır
                        </button>
                    )}
                    
                    <button
                        onClick={submitAnswer}
                        disabled={!currentAnswer.trim() || isSpeaking || isProcessing}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {questionIndex >= 4 ? '✅ Bitir' : '➡️ Növbəti sual'}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="mt-6 text-center text-sm text-gray-500">
                💡 Səsinizi yaxşı eşitmək üçün sakit bir mühit seçin
            </div>
        </div>
    );
}
