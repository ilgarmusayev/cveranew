import React from 'react';
import { useSimpleFontSettings } from '@/hooks/useSimpleFontSettings';
import SimpleFontManager from './SimpleFontManager';

export default function DynamicFontTestPage() {
  const testCvId = 'dynamic-font-test';
  const { fontSettings, fontSizes } = useSimpleFontSettings(testCvId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ✨ Dinamik Font Ölçüləri Sistemi
          </h1>
          <p className="text-xl text-gray-600">
            CV-də bütün mətn elementləri indi ölçü dəyişikliyindən təsirlənir!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Font Control Panel */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🎛️ Font İdarəsi</h2>
            <SimpleFontManager cvId={testCvId} />
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Cari Ayarlar:</h3>
              <div className="text-sm text-blue-700">
                <p>Font: <code className="bg-blue-200 px-2 py-1 rounded">{fontSettings.fontFamily}</code></p>
                <p>Base Ölçü: <code className="bg-blue-200 px-2 py-1 rounded">{fontSettings.fontSize}px</code></p>
              </div>
            </div>
          </div>

          {/* Font Sizes Demo */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📏 Dinamik Ölçülər</h2>
            
            <div 
              className="space-y-6" 
              style={{ fontFamily: fontSettings.fontFamily }}
            >
              <div className="border-l-4 border-purple-400 pl-4">
                <h3 
                  className="font-bold text-gray-900"
                  style={{ fontSize: fontSizes['4xl'] }}
                >
                  Böyük Başlıq (4xl)
                </h3>
                <p className="text-gray-500 text-sm mt-1">Bu CV-də əsas ad üçün istifadə olunur</p>
              </div>

              <div className="border-l-4 border-blue-400 pl-4">
                <h4 
                  className="font-semibold text-gray-800"
                  style={{ fontSize: fontSizes.xl }}
                >
                  Orta Başlıq (xl)
                </h4>
                <p className="text-gray-500 text-sm mt-1">Peşə başlığı üçün istifadə olunur</p>
              </div>

              <div className="border-l-4 border-green-400 pl-4">
                <h5 
                  className="font-medium text-gray-700"
                  style={{ fontSize: fontSizes.lg }}
                >
                  Kiçik Başlıq (lg)
                </h5>
                <p className="text-gray-500 text-sm mt-1">Təhsil, iş təcrübəsi başlıqları</p>
              </div>

              <div className="border-l-4 border-yellow-400 pl-4">
                <p 
                  className="text-gray-600"
                  style={{ fontSize: fontSizes.base }}
                >
                  Əsas Mətn (base): Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                  Bu ölçü əsas açıqlamalar, təsvir mətnləri üçün istifadə edilir.
                </p>
              </div>

              <div className="border-l-4 border-red-400 pl-4">
                <p 
                  className="text-gray-500"
                  style={{ fontSize: fontSizes.sm }}
                >
                  Kiçik Mətn (sm): Tarixlər, əlavə məlumatlar, kiçik detallar üçün.
                </p>
              </div>

              <div className="border-l-4 border-gray-400 pl-4">
                <p 
                  className="text-gray-400"
                  style={{ fontSize: fontSizes.xs }}
                >
                  Ən Kiçik Mətn (xs): Footer, copyright və s.
                </p>
              </div>
            </div>

            {/* Dynamic Sizes Table */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Hesablanmış Ölçülər:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>xs: <code className="bg-gray-200 px-1 rounded">{fontSizes.xs}</code></div>
                <div>sm: <code className="bg-gray-200 px-1 rounded">{fontSizes.sm}</code></div>
                <div>base: <code className="bg-gray-200 px-1 rounded">{fontSizes.base}</code></div>
                <div>lg: <code className="bg-gray-200 px-1 rounded">{fontSizes.lg}</code></div>
                <div>xl: <code className="bg-gray-200 px-1 rounded">{fontSizes.xl}</code></div>
                <div>4xl: <code className="bg-gray-200 px-1 rounded">{fontSizes['4xl']}</code></div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-full">
            <span className="text-xl font-bold">🎉 Dinamik Font Sistemi Hazır!</span>
          </div>
          <p className="mt-4 text-gray-600">
            İndi font ölçüsü dəyişdikdə CV-dəki <strong>bütün mətn elementləri</strong> mütənasib şəkildə dəyişəcək!
          </p>
        </div>
      </div>
    </div>
  );
}
