'use client';

import { useState, useRef, useEffect } from 'react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function FloatingChatbot() {
  const { siteLanguage } = useSiteLanguage();
  const [isOpen, setIsOpen] = useState(false);
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
      chatWithUs: {
        azerbaijani: 'CVERA AI Mentor',
        english: 'CVERA AI Mentor',
        russian: 'CVERA AI Mentor'
      },
      aiAssistant: {
        azerbaijani: 'AI Mentor',
        english: 'AI Mentor',
        russian: 'AI Mentor'
      },
      online: {
        azerbaijani: 'Onlayn',
        english: 'Online',
        russian: 'Онлайн'
      },
      placeholder: {
        azerbaijani: 'Mesajınızı yazın...',
        english: 'Type your message...',
        russian: 'Напишите сообщение...'
      },
      thinking: {
        azerbaijani: 'Yazır...',
        english: 'Typing...',
        russian: 'Печатает...'
      },
      welcome: {
        azerbaijani: 'Salam! Mən CVERA AI Mentor-am. CV və karyera inkişafınızda sizə necə kömək edə bilərəm?',
        english: 'Hello! I\'m CVERA AI Mentor. How can I help you with your CV and career development?',
        russian: 'Здравствуйте! Я CVERA AI Mentor. Чем могу помочь с резюме и развитием карьеры?'
      }
    };

    return translations[key]?.[siteLanguage] || translations[key]?.azerbaijani || '';
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat opens for the first time
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: getTranslation('welcome'),
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, siteLanguage]);

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
          history: messages.slice(-10)
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
      {/* Chat Button - When Closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#2057e0] text-white rounded-full p-4 shadow-2xl hover:bg-[#1a4ab8] transition-all duration-300 hover:scale-110 group"
          aria-label={getTranslation('chatWithUs')}
        >
          <div className="relative">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {/* Online indicator */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse"></span>
          </div>
          {/* Tooltip */}
          <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {getTranslation('chatWithUs')}
          </span>
        </button>
      )}

      {/* Chat Window - When Open */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-50 w-full md:w-[380px] h-full md:h-[600px] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2057e0] to-[#1a4ab8] text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#2057e0]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">CVERA {getTranslation('aiAssistant')}</h3>
                <p className="text-xs text-blue-100">{getTranslation('online')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 md:px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-[#2057e0] text-white rounded-br-sm'
                      : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <div 
                    className="text-sm break-words prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={renderMessageContent(message.content)}
                  />
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
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
                <div className="bg-white text-gray-900 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#2057e0] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#2057e0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#2057e0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{getTranslation('thinking')}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-3 md:p-4 bg-white safe-bottom">
            <div className="flex items-end space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getTranslation('placeholder')}
                rows={1}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2057e0] focus:border-transparent resize-none text-sm"
                style={{ minHeight: '40px', maxHeight: '80px' }}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-[#2057e0] text-white rounded-xl p-2 hover:bg-[#1a4ab8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                style={{ minWidth: '40px', height: '40px' }}
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
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
