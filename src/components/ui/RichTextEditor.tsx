'use client';

import { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Məzmunu daxil edin...",
  className = "",
  minHeight = "120px"
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Clean HTML content for proper display
  const cleanHtmlContent = (htmlContent: string): string => {
    if (!htmlContent) return '';

    let cleaned = htmlContent;

    // Replace &nbsp; with regular spaces
    cleaned = cleaned.replace(/&nbsp;/g, ' ');

    // Replace div tags with p tags
    cleaned = cleaned.replace(/<div>/g, '<p>');
    cleaned = cleaned.replace(/<\/div>/g, '</p>');

    // Remove empty paragraphs and clean up spacing
    cleaned = cleaned.replace(/<p><\/p>/g, '');
    cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
    cleaned = cleaned.replace(/<p><br><\/p>/g, '<p></p>');

    // Clean up multiple consecutive spaces
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Ensure proper paragraph wrapping for plain text
    if (cleaned && !cleaned.includes('<') && cleaned.trim()) {
      cleaned = `<p>${cleaned.trim()}</p>`;
    }

    // Fix malformed HTML
    cleaned = cleaned.replace(/<p>\s*<p>/g, '<p>');
    cleaned = cleaned.replace(/<\/p>\s*<\/p>/g, '</p>');

    return cleaned.trim();
  };

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = cleanHtmlContent(value);
    }
  }, [value]);

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Rich Text Editor Toolbar */}
      <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => document.execCommand('bold', false)}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Bold"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('italic', false)}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Italic"
        >
          <span className="italic">I</span>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('underline', false)}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Underline"
        >
          <span className="underline">U</span>
        </button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => document.execCommand('insertUnorderedList', false)}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('insertOrderedList', false)}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Numbered List"
        >
          1.
        </button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => document.execCommand('justifyLeft', false)}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align Left"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('justifyCenter', false)}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align Center"
        >
          ↔
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('justifyRight', false)}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align Right"
        >
          →
        </button>
      </div>

      {/* Rich Text Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning={true}
        className="w-full px-3 py-2 border border-t-0 border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none prose prose-sm max-w-none"
        style={{
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'inherit',
          minHeight: minHeight
        }}
        onInput={(e) => {
          const target = e.target as HTMLDivElement;
          const content = target.innerHTML;

          // Immediately clean and save content
          const cleanedContent = cleanHtmlContent(content);
          onChange(cleanedContent);
        }}
        onBlur={(e) => {
          const target = e.target as HTMLDivElement;
          const content = target.innerHTML;

          // Final cleanup on blur
          const cleanedContent = cleanHtmlContent(content);
          onChange(cleanedContent);
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
        onKeyDown={(e) => {
          // Handle Enter key properly - single line break
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.execCommand('insertHTML', false, '<br>');
          }
        }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] {
          background: white;
        }
        [contenteditable]:focus {
          background: white;
        }
        [contenteditable] p {
          margin: 0.5rem 0;
          line-height: 1.5;
        }
        [contenteditable] p:first-child {
          margin-top: 0;
        }
        [contenteditable] p:last-child {
          margin-bottom: 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}
