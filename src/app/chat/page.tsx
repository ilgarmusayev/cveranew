'use client';

import { useState, useRef, useEffect } from 'react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import StandardHeader from '@/components/ui/StandardHeader';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { siteLanguage } = useSiteLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTranslation = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: {
        azerbaijani: 'CVERA AI Mentor',
        english: 'CVERA AI Mentor',
        russian: 'CVERA AI Mentor'
      },
      subtitle: {
        azerbaijani: 'CV hazırlığı və karyera inkişafı üçün süni intellekt mentorunuz',
        english: 'Your AI mentor for CV preparation and career development',
        russian: 'Ваш AI-наставник по подготовке резюме и развитию карьеры'
      },
      placeholder: {
        azerbaijani: 'Mesajınızı yazın...',
        english: 'Type your message...',
        russian: 'Напишите ваше сообщение...'
      },
      send: {
        azerbaijani: 'Göndər',
        english: 'Send',
        russian: 'Отправить'
      },
      thinking: {
        azerbaijani: 'Düşünür...',
        english: 'Thinking...',
        russian: 'Думаю...'
      },
      welcome: {
        azerbaijani: 'Salam! Mən CVERA AI Mentor-am. CV hazırlığı və karyera inkişafınızda sizə necə kömək edə bilərəm?',
        english: 'Hello! I\'m CVERA AI Mentor. How can I help you with your CV preparation and career development?',
        russian: 'Здравствуйте! Я CVERA AI Mentor. Чем могу помочь с подготовкой резюме и развитием карьеры?'
      }
    };

    return translations[key]?.[siteLanguage] || translations[key]?.azerbaijani || '';
  };

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: getTranslation('welcome'),
        timestamp: new Date()
      }
    ]);
  }, [siteLanguage]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          language: siteLanguage,
          history: messages.slice(-10) // Send last 10 messages for context
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: siteLanguage === 'azerbaijani' 
          ? 'Üzr istəyirik, xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'
          : siteLanguage === 'english'
          ? 'Sorry, an error occurred. Please try again.'
          : 'Извините, произошла ошибка. Пожалуйста, попробуйте снова.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Function to render message with HTML formatting
  const renderMessageContent = (content: string) => {
    // Convert **text** to <strong>text</strong>
    let formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert numbered lists: 1. text -> <li>text</li>
    formattedContent = formattedContent.replace(/(\d+)\.\s+(.*?)(?=\n|$)/g, '<li>$2</li>');
    if (formattedContent.includes('<li>')) {
      formattedContent = formattedContent.replace(/(<li>[\s\S]*<\/li>)/g, '<ol class="list-decimal ml-4 space-y-1">$1</ol>');
    }
    
    // Convert line breaks to <br>
    formattedContent = formattedContent.replace(/\n/g, '<br>');
    
    return { __html: formattedContent };
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <StandardHeader />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            {getTranslation('title')}
          </h1>
          <p className="text-gray-600 text-sm">
            {getTranslation('subtitle')}
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mx-auto max-w-6xl" style={{ height: 'calc(100vh - 260px)' }}>
          {/* Messages Area */}
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-[#2057e0] text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div 
                      className="text-sm leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={renderMessageContent(message.content)}
                    />
                    <p
                      className={`text-xs mt-1.5 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#2057e0] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#2057e0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-[#2057e0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-600">{getTranslation('thinking')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative">
              {/* Animated Blue gradient shadow effect */}
              <div className="absolute top-0 left-0 right-0 h-4 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-[#2057e0]/10 to-transparent animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2057e0]/20 to-transparent animate-shimmer"></div>
              </div>
              
              <div className="border-t border-gray-200 p-3 bg-white shadow-[0_-4px_12px_rgba(32,87,224,0.08)]">
                <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={getTranslation('placeholder')}
                    rows={1}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2057e0] focus:border-transparent resize-none text-sm"
                    style={{ minHeight: '44px', maxHeight: '100px' }}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="px-5 py-2.5 bg-[#2057e0] text-white rounded-xl hover:bg-[#1a4ab8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  style={{ minWidth: '70px', height: '44px' }}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <style jsx>{`
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
      
      .animate-shimmer {
        animation: shimmer 3s ease-in-out infinite;
      }
    `}</style>
    </>
  );
}

