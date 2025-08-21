'use client';

import React from 'react';
import { useSimpleFontSettings } from '@/hooks/useSimpleFontSettings';
import SimpleFontManager from './SimpleFontManager';

export default function FontTestPage() {
  const testCvId = 'font-test-123';
  const { fontSettings } = useSimpleFontSettings(testCvId);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🎨 Yeni Font Manager Testi</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Font Manager Panel */}
          <div>
            <SimpleFontManager cvId={testCvId} />
          </div>
          
          {/* CV Preview Test */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">CV Önizləməsi</h2>
            </div>
            
            <div 
              className="p-6"
              style={{
                fontFamily: fontSettings.fontFamily,
                fontSize: `${fontSettings.fontSize}px`
              }}
            >
              <h1 className="text-2xl font-bold mb-2">Adınız Soyadınız</h1>
              <h2 className="text-lg text-gray-600 mb-4">Peşəkar Vəzifə</h2>
              
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">İş Təcrübəsi</h3>
                <div className="mb-3">
                  <h4 className="font-semibold">Yazılım Mühəndisi</h4>
                  <p className="text-gray-600">ABC Şirkəti | 2020-2024</p>
                  <p className="mt-1">Web aplikasiyaları və mobil tətbiqlər üzərində işləmişəm. React, Node.js və TypeScript texnologiyalarından istifadə edərək müxtəlif layihələr həyata keçirmişəm.</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Təhsil</h3>
                <div>
                  <h4 className="font-semibold">Kompüter Mühəndisliyi</h4>
                  <p className="text-gray-600">Bakı Dövlət Universiteti | 2016-2020</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Bacarıqlar</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">JavaScript</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">React</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Node.js</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">TypeScript</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status */}
        <div className="mt-8 p-4 bg-green-100 border border-green-300 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-2">✅</span>
            <div>
              <h3 className="font-semibold text-green-800">Yeni Font Manager hazırdır!</h3>
              <p className="text-green-700">
                Aktiv font: <code className="bg-green-200 px-2 py-1 rounded">{fontSettings.fontFamily}</code> | 
                Ölçü: <code className="bg-green-200 px-2 py-1 rounded">{fontSettings.fontSize}px</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
