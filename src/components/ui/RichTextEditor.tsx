'use client';

import { useRef, useEffect, useCallback } from 'react';

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
  const valueRef = useRef(value);

  // Update value ref when value changes
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Only update editor content on initial load or when completely empty
  useEffect(() => {
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      
      // Only update if editor is empty and we have value, or on initial load
      if ((!currentContent || currentContent === '<br>' || currentContent === '') && value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, []);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    let content = target.innerHTML;
    
    // Store cursor position before cleaning
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const cursorOffset = range?.startOffset;
    
    // Convert &nbsp; to regular spaces immediately during input
    content = content.replace(/&nbsp;/g, ' ');
    
    // Preserve trailing spaces by converting them to &nbsp; only at the very end
    if (content.endsWith(' ')) {
      // Count trailing spaces
      const trailingSpaces = content.match(/ +$/)?.[0].length || 0;
      if (trailingSpaces > 0) {
        // Replace only the last trailing space with &nbsp; to preserve it
        content = content.slice(0, -1) + '&nbsp;';
      }
    }
    
    // Update the content if it changed
    if (content !== target.innerHTML) {
      target.innerHTML = content;
      
      // Restore cursor position
      if (selection && range && cursorOffset !== undefined) {
        try {
          const textNode = target.lastChild || target;
          if (textNode.nodeType === Node.TEXT_NODE) {
            range.setStart(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0));
            range.setEnd(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0));
          } else {
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
          }
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // Ignore cursor restoration errors
        }
      }
    }
    
    onChange(content);
  }, [onChange]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const content = target.innerHTML;
    
    // Clean content only on blur to avoid cursor issues
    let cleaned = content;
    
    // Basic cleaning without affecting cursor - but preserve trailing spaces
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/<div>/g, '<p>');
    cleaned = cleaned.replace(/<\/div>/g, '</p>');
    cleaned = cleaned.replace(/<p><\/p>/g, '');
    cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
    
    // Preserve trailing spaces by converting final space to &nbsp;
    if (cleaned.endsWith(' ')) {
      cleaned = cleaned.slice(0, -1) + '&nbsp;';
    }
    
    if (cleaned !== content) {
      target.innerHTML = cleaned;
      onChange(cleaned);
    }
  }, [onChange]);

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
        onInput={handleInput}
        onBlur={handleBlur}
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
          // Handle spacebar - ensure trailing spaces are preserved
          if (e.key === ' ') {
            const selection = window.getSelection();
            const range = selection?.getRangeAt(0);
            
            // Check if we're at the end of content
            if (range && editorRef.current) {
              const isAtEnd = range.endOffset === (range.endContainer.textContent?.length || 0) &&
                             range.endContainer === editorRef.current.lastChild;
              
              if (isAtEnd) {
                // Insert non-breaking space at the end to preserve it
                e.preventDefault();
                document.execCommand('insertHTML', false, '&nbsp;');
              }
            }
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
          white-space: pre-wrap;
        }
        [contenteditable]:focus {
          background: white;
        }
        [contenteditable] p {
          margin: 0.5rem 0;
          line-height: 1.5;
          white-space: pre-wrap;
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
