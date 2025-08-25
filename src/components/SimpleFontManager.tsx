'use client';

import React from 'react';
import { useSimpleFontSettings } from '@/hooks/useSimpleFontSettings';

interface SimpleFontManagerProps {
  cvId?: string;
  className?: string;
}

const FONT_OPTIONS = [
  { value: 'Inter, system-ui, -apple-system, sans-serif', label: 'Inter (Default)' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' }
];

const FONT_SIZE_OPTIONS = [10, 11, 12, 13, 14, 15, 16];

export const SimpleFontManager: React.FC<SimpleFontManagerProps> = ({ cvId, className = '' }) => {
  const { fontSettings, updateFontSettings } = useSimpleFontSettings(cvId);

  const handleFontFamilyChange = (value: string) => {
    updateFontSettings({ fontFamily: value });
  };

  const handleBaseFontSizeChange = (value: number) => {
    updateFontSettings({ fontSize: value });
  };

  // Individual size handlers
  const handleTitleSizeChange = (value: number) => {
    updateFontSettings({ titleSize: value });
  };

  const handleSubtitleSizeChange = (value: number) => {
    updateFontSettings({ subtitleSize: value });
  };

  const handleHeadingSizeChange = (value: number) => {
    updateFontSettings({ headingSize: value });
  };

  const handleBodySizeChange = (value: number) => {
    updateFontSettings({ bodySize: value });
  };

  const handleSmallSizeChange = (value: number) => {
    updateFontSettings({ smallSize: value });
  };

  const handleXsSizeChange = (value: number) => {
    updateFontSettings({ xsSize: value });
  };

  return (
    <div className={`font-manager-panel space-y-4 p-4 bg-white border rounded-lg shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📝 Font İdarəetmə Sistemi
      </h3>
      
      {/* Font Family Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          🔤 Font Ailəsi
        </label>
        <select
          value={fontSettings.fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {FONT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Base Font Size (Backward Compatibility) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          📏 Əsas Ölçü (Backward Compatibility)
        </label>
        <select
          value={fontSettings.fontSize}
          onChange={(e) => handleBaseFontSizeChange(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {FONT_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
      </div>

      <hr className="border-gray-200" />
      
      {/* Individual Font Size Controls */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800">
          🎛️ Fərdi Ölçü İdarəetməsi
        </h4>
        
        {/* Title Size */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>📢 Əsas Başlıq (Title)</span>
            <span className="text-xs text-gray-500">{fontSettings.titleSize}px</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTitleSizeChange(Math.max(24, fontSettings.titleSize - 2))}
              disabled={fontSettings.titleSize <= 24}
              className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium">{fontSettings.titleSize}px</span>
            </div>
            <button
              onClick={() => handleTitleSizeChange(Math.min(48, fontSettings.titleSize + 2))}
              disabled={fontSettings.titleSize >= 48}
              className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>24px</span>
            <span>48px</span>
          </div>
        </div>

        {/* Subtitle Size */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>📋 Alt Başlıq (Subtitle)</span>
            <span className="text-xs text-gray-500">{fontSettings.subtitleSize}px</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubtitleSizeChange(Math.max(16, fontSettings.subtitleSize - 1))}
              disabled={fontSettings.subtitleSize <= 16}
              className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium">{fontSettings.subtitleSize}px</span>
            </div>
            <button
              onClick={() => handleSubtitleSizeChange(Math.min(32, fontSettings.subtitleSize + 1))}
              disabled={fontSettings.subtitleSize >= 32}
              className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>16px</span>
            <span>32px</span>
          </div>
        </div>

        {/* Heading Size */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>🏷️ Bölmə Başlıqları (Heading)</span>
            <span className="text-xs text-gray-500">{fontSettings.headingSize}px</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleHeadingSizeChange(Math.max(14, fontSettings.headingSize - 1))}
              disabled={fontSettings.headingSize <= 14}
              className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium">{fontSettings.headingSize}px</span>
            </div>
            <button
              onClick={() => handleHeadingSizeChange(Math.min(24, fontSettings.headingSize + 1))}
              disabled={fontSettings.headingSize >= 24}
              className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>14px</span>
            <span>24px</span>
          </div>
        </div>

        {/* Body Size */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>📄 Əsas Mətn (Body)</span>
            <span className="text-xs text-gray-500">{fontSettings.bodySize}px</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBodySizeChange(Math.max(10, fontSettings.bodySize - 1))}
              disabled={fontSettings.bodySize <= 10}
              className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium">{fontSettings.bodySize}px</span>
            </div>
            <button
              onClick={() => handleBodySizeChange(Math.min(18, fontSettings.bodySize + 1))}
              disabled={fontSettings.bodySize >= 18}
              className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>10px</span>
            <span>18px</span>
          </div>
        </div>

        {/* Small Size */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>📝 Kiçik Mətn (Small)</span>
            <span className="text-xs text-gray-500">{fontSettings.smallSize}px</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSmallSizeChange(Math.max(8, fontSettings.smallSize - 1))}
              disabled={fontSettings.smallSize <= 8}
              className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center hover:bg-teal-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium">{fontSettings.smallSize}px</span>
            </div>
            <button
              onClick={() => handleSmallSizeChange(Math.min(14, fontSettings.smallSize + 1))}
              disabled={fontSettings.smallSize >= 14}
              className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center hover:bg-teal-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>8px</span>
            <span>14px</span>
          </div>
        </div>

        {/* XS Size */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>🔍 Ən Kiçik Mətn (XS)</span>
            <span className="text-xs text-gray-500">{fontSettings.xsSize}px</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleXsSizeChange(Math.max(6, fontSettings.xsSize - 1))}
              disabled={fontSettings.xsSize <= 6}
              className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium">{fontSettings.xsSize}px</span>
            </div>
            <button
              onClick={() => handleXsSizeChange(Math.min(12, fontSettings.xsSize + 1))}
              disabled={fontSettings.xsSize >= 12}
              className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>6px</span>
            <span>12px</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">🔍 Önizləmə</h4>
        <div style={{ fontFamily: fontSettings.fontFamily }} className="space-y-2">
          <div style={{ fontSize: `${fontSettings.titleSize}px` }} className="font-bold">
            Əsas Başlıq - {fontSettings.titleSize}px
          </div>
          <div style={{ fontSize: `${fontSettings.subtitleSize}px` }} className="font-semibold">
            Alt Başlıq - {fontSettings.subtitleSize}px
          </div>
          <div style={{ fontSize: `${fontSettings.headingSize}px` }} className="font-medium">
            Bölmə Başlığı - {fontSettings.headingSize}px
          </div>
          <div style={{ fontSize: `${fontSettings.bodySize}px` }}>
            Əsas mətn nümunəsi - {fontSettings.bodySize}px
          </div>
          <div style={{ fontSize: `${fontSettings.smallSize}px` }} className="text-gray-600">
            Kiçik mətn nümunəsi - {fontSettings.smallSize}px
          </div>
          <div style={{ fontSize: `${fontSettings.xsSize}px` }} className="text-gray-500">
            Ən kiçik mətn - {fontSettings.xsSize}px
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-xs text-gray-500 mt-4 p-2 bg-blue-50 rounded">
        🔧 Status: CV ID: {cvId || 'N/A'} | Font: {fontSettings.fontFamily.split(',')[0]} | 
        Base: {fontSettings.fontSize}px | Title: {fontSettings.titleSize}px
      </div>
    </div>
  );
};
