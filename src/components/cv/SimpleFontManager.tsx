'use client';

import React from 'react';
import { useSimpleFontSettings } from '@/hooks/useSimpleFontSettings';

interface SimpleFontManagerProps {
  cvId?: string;
  className?: string;
}

const FONT_OPTIONS = [
  { value: 'Inter, system-ui, -apple-system, sans-serif', label: 'Inter (Modern)' },
  { value: 'Times New Roman, Times, serif', label: 'Times New Roman (Classic)' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial (Clean)' },
  { value: 'Georgia, serif', label: 'Georgia (Elegant)' },
  { value: 'Roboto, sans-serif', label: 'Roboto (Professional)' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans (Friendly)' }
];

const FONT_SIZES = [
  { value: 10, label: 'Çox kiçik (10px)' },
  { value: 12, label: 'Kiçik (12px)' },
  { value: 14, label: 'Normal (14px)' },
  { value: 16, label: 'Böyük (16px)' },
  { value: 18, label: 'Çox böyük (18px)' }
];

export default function SimpleFontManager({ cvId, className = '' }: SimpleFontManagerProps) {
  const { fontSettings, updateFontSettings } = useSimpleFontSettings(cvId);

  return (
    <div className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🎨 Font Ayarları</h3>
      
      {/* Font Family */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Tipi
        </label>
        <select
          value={fontSettings.fontFamily}
          onChange={(e) => updateFontSettings({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Ölçüsü
        </label>
        <select
          value={fontSettings.fontSize}
          onChange={(e) => updateFontSettings({ fontSize: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {FONT_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </div>

      {/* Preview */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-sm text-gray-600 mb-2">Önizləmə:</p>
        <p 
          style={{ 
            fontFamily: fontSettings.fontFamily, 
            fontSize: `${fontSettings.fontSize}px` 
          }}
          className="text-gray-800"
        >
          Bu mətn seçilmiş font və ölçü ilə göstərilir.
        </p>
      </div>
    </div>
  );
}
