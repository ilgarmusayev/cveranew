import React from 'react';
import { useSimpleFontSettings } from '@/hooks/useSimpleFontSettings';

interface FontDebugPanelProps {
  cvId?: string;
}

const FontDebugPanel: React.FC<FontDebugPanelProps> = ({ cvId }) => {
  const { fontSettings, fontSizes, updateFontSettings } = useSimpleFontSettings(cvId);
  
  // localStorage-də nə var?
  const checkLocalStorage = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('font')) {
        keys.push({
          key,
          value: localStorage.getItem(key)
        });
      }
    }
    return keys;
  };

  const fontKeys = checkLocalStorage();

  const testFontChange = () => {
    updateFontSettings({
      fontFamily: 'Times New Roman, serif',
      fontSize: 18
    });
  };

  const resetFont = () => {
    updateFontSettings({
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: 14
    });
  };

  return (
    <div className="fixed top-4 right-4 bg-white shadow-lg border rounded-lg p-4 z-50 max-w-sm">
      <h3 className="font-bold text-red-600 mb-3">🐛 Font Debug Panel</h3>
      
      {/* CV ID Info */}
      <div className="mb-3 p-2 bg-blue-50 rounded">
        <strong>CV ID:</strong> {cvId || 'undefined'}
      </div>

      {/* Current Font Settings */}
      <div className="mb-3 p-2 bg-green-50 rounded">
        <strong>Current Font:</strong><br/>
        <code className="text-xs">
          {fontSettings.fontFamily}<br/>
          {fontSettings.fontSize}px
        </code>
      </div>

      {/* Font Sizes Preview */}
      <div className="mb-3">
        <strong>Dynamic Font Sizes:</strong>
        <div className="text-xs space-y-1 mt-1 bg-yellow-50 p-2 rounded">
          <div>xs: <span style={{ fontSize: fontSizes.xs }}>Sample Text</span> ({fontSizes.xs})</div>
          <div>sm: <span style={{ fontSize: fontSizes.sm }}>Sample Text</span> ({fontSizes.sm})</div>
          <div>base: <span style={{ fontSize: fontSizes.base }}>Sample Text</span> ({fontSizes.base})</div>
          <div>lg: <span style={{ fontSize: fontSizes.lg }}>Sample Text</span> ({fontSizes.lg})</div>
          <div>xl: <span style={{ fontSize: fontSizes.xl }}>Sample Text</span> ({fontSizes.xl})</div>
        </div>
      </div>

      {/* LocalStorage Keys */}
      <div className="mb-3">
        <strong>Font keys in localStorage:</strong>
        {fontKeys.length === 0 ? (
          <div className="text-red-500 text-sm">No font keys found!</div>
        ) : (
          <div className="text-xs space-y-1 mt-1">
            {fontKeys.map((item, i) => (
              <div key={i} className="bg-gray-100 p-1 rounded">
                <strong>{item.key}:</strong><br/>
                <code>{item.value}</code>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Button */}
      <button
        onClick={testFontChange}
        className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 mb-2"
      >
        Test Font Change (Times 18px)
      </button>
      
      {/* Reset Button */}
      <button
        onClick={resetFont}
        className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
      >
        Reset to Default
      </button>
    </div>
  );
};

export default FontDebugPanel;
