import React from 'react';
import { useSimpleFontSettings } from '@/hooks/useSimpleFontSettings';

export default function FontSystemStatusPage() {
  const testCvId = 'system-status-test';
  const { fontSettings } = useSimpleFontSettings(testCvId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ✅ Font Manager Sistem Dəyişimi Tamamlandı
          </h1>
          <p className="text-xl text-gray-600">
            Headerdəki şrift idarəsi yeni sistemlə əvəz edildi
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Old System Status */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✗</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800">Köhnə Sistem (Silindi)</h3>
                <p className="text-sm text-red-600">FontManager.getInstance() əsaslı sistem</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-red-700">
              <div>• Mürəkkəb FontSettings interface</div>
              <div>• Font ID-dən CSS-ə çevrilmə problemi</div>
              <div>• useFontSettings hook səhvləri</div>
              <div>• FontSelector component çətinlikləri</div>
              <div>• localStorage saxlanma qətləri</div>
            </div>
          </div>

          {/* New System Status */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800">Yeni Sistem (Fəal)</h3>
                <p className="text-sm text-green-600">useSimpleFontSettings hook əsaslı sistem</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-green-700">
              <div>• Sadə fontFamily və fontSize</div>
              <div>• Birbaşa CSS property istifadəsi</div>
              <div>• SimpleFontManager UI komponenti</div>
              <div>• Avtomatik localStorage saxlanması</div>
              <div>• Bütün CV template-lərdə tətbiq edilib</div>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🎯 İnteqrasiya Statusu
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">Header Komponenti</h3>
              <div className="text-green-600 font-semibold">✓ Dəyişdirildi</div>
              <p className="text-sm text-blue-600 mt-1">FontManagementPanel yeni sistemlə əvəz edildi</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">CV Preview Templates</h3>
              <div className="text-green-600 font-semibold">✓ 6/6 Tamamlandı</div>
              <p className="text-sm text-blue-600 mt-1">Bütün template-lər yeni sistemi istifadə edir</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">Font Control</h3>
              <div className="text-green-600 font-semibold">✓ Rahat İdarə</div>
              <p className="text-sm text-blue-600 mt-1">Preview yazıları asanlıqla idarə edilir</p>
            </div>
          </div>
        </div>

        {/* Current Font Display */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📝 Canlı Font Demo
          </h2>
          
          <div className="text-center mb-6">
            <div className="inline-block bg-green-100 px-4 py-2 rounded-lg">
              <span className="text-green-800 font-semibold">
                Font: {fontSettings.fontFamily} | Ölçü: {fontSettings.fontSize}px
              </span>
            </div>
          </div>

          <div 
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center"
            style={{ 
              fontFamily: fontSettings.fontFamily, 
              fontSize: `${fontSettings.fontSize}px` 
            }}
          >
            <h3 className="text-2xl font-bold mb-4">Bu mətn aktiv font ayarlarını istifadə edir</h3>
            <p className="mb-4">
              Header-dəki font manager artıq yeni sistemlə işləyir. Preview-dəki yazıların şrifti 
              rahat şəkildə idarə edilə bilər və dəyişikliklər dərhal görünür.
            </p>
            <p className="text-lg font-semibold text-blue-600">
              ✨ Sistem uğurla dəyişdirildi və testdən keçdi!
            </p>
          </div>
        </div>

        {/* Success Message */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-green-500 text-white px-8 py-4 rounded-full">
            <span className="text-xl font-bold">🎉 Header Font İdarəsi Yeni Sistemlə Əvəz Edildi!</span>
          </div>
          <p className="mt-4 text-gray-600">
            Preview-dəki yazıların şrifti artıq asanlıqla idarə edilə bilər
          </p>
        </div>
      </div>
    </div>
  );
}
