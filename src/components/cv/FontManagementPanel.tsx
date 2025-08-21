import React, { useState } from 'react';
import { SimpleFontManager } from '../SimpleFontManager';
import { useSimpleFontSettings } from '@/hooks/useSimpleFontSettings';

interface FontManagementPanelProps {
  cvId?: string;
  isPremium?: boolean;
  onClose?: () => void;
}

const FontManagementPanel: React.FC<FontManagementPanelProps> = ({
  cvId,
  isPremium = false,
  onClose
}) => {
  const { fontSettings } = useSimpleFontSettings(cvId || 'default');
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Font Management Button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Şrift İdarəsi
      </button>

      {/* Font Management Sidebar Panel */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Left Sidebar Panel */}
          <div className={`fixed left-0 top-0 bottom-0 w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Header - Fixed at top */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">🎨 Şrift İdarəsi (Yeni Sistem)</h2>
                <p className="text-sm text-gray-600">CV şriftlərini asanlıqla tənzimləyin</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Simple Font Manager Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-6">
                <SimpleFontManager cvId={cvId || 'default'} />
                
                {/* Current Font Status */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Aktiv Şrift Ayarları</h3>
                  <div className="text-sm text-green-700">
                    <p>Font: <code className="bg-green-200 px-2 py-1 rounded">{fontSettings.fontFamily}</code></p>
                    <p>Ölçü: <code className="bg-green-200 px-2 py-1 rounded">{fontSettings.fontSize}px</code></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  ✅ Dəyişikliklər avtomatik saxlanır • Yeni sistem fəal
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Bağla
                  </button>
                  {onClose && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onClose?.();
                      }}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      ✓ Tətbiq Et
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FontManagementPanel;
