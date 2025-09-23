'use client';

import { useState } from 'react';
import { useNotification } from '@/components/ui/Toast';
import { useLocalizedMessages } from '@/utils/errorMessages';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CVExportButtonsProps {
  cvData: any;
  cvElementId: string;
  fileName: string;
  templateId?: string;
}

export default function CVExportButtons({ cvData, cvElementId, fileName }: CVExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { getErrorMessage, getSuccessMessage } = useLocalizedMessages();

  const exportToPDF = async () => {
    setIsExporting(true);

    try {
      // Get the CV preview element
      const element = document.getElementById(cvElementId);
      if (!element) {
        showError(getErrorMessage('cvExportError'));
        setIsExporting(false);
        return;
      }

      // Create a clone of the element to modify for PDF export
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Remove any height restrictions and scrollbars for PDF export
      clonedElement.style.maxHeight = 'none';
      clonedElement.style.overflow = 'visible';
      clonedElement.style.height = 'auto';

      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.fontFamily = 'Arial, sans-serif';

      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      // Wait a bit for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate canvas from the cloned element
      const canvas = await html2canvas(clonedElement, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: clonedElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: clonedElement.scrollHeight
      });

      // Clean up temporary container
      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [794, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 794, canvas.height);

      // Save the PDF
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'CV';
      pdf.save(`${cleanFileName}.pdf`);

      showSuccess(getSuccessMessage('genericSuccess'));

    } catch (error) {
      console.error('PDF export error:', error);
      showError(getErrorMessage('pdfExportError'));
    } finally {
      setIsExporting(false);
    }
  };

  const exportToWord = () => {
    // Create a simplified HTML version for Word export
    const element = document.getElementById(cvElementId);
    if (!element) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${fileName} - CV</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.4; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          h1 { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          h2 { font-size: 18px; font-weight: 600; margin: 20px 0 10px 0; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          h3 { font-size: 14px; font-weight: 500; margin: 10px 0 5px 0; }
          p, div { font-size: 12px; margin: 5px 0; }
          .section { margin-bottom: 20px; }
          .experience-item, .education-item, .project-item { margin-bottom: 15px; padding-left: 10px; border-left: 2px solid #ddd; }
          .date { font-size: 10px; color: #666; }
          .tech-tag { background: #f0f0f0; padding: 2px 6px; margin-right: 5px; font-size: 10px; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToPDF}
        disabled={isExporting}
        className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
          isExporting 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            İxrac edilir...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            PDF Yüklə
          </>
        )}
      </button>

      <button
        onClick={exportToWord}
        className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Word Yüklə
      </button>
    </div>
  );
}
