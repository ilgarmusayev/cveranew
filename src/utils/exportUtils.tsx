import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Export to PDF with exact preview matching
export const exportToPDF = async (
  elementId: string,
  filename: string = 'CV',
  showToast?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    const errorMessage = 'CV elementi tapılmadı. Səhifəni yeniləyin və yenidən cəhd edin.';
    if (showToast) {
      showToast('error', errorMessage);
    } else {
      console.error(errorMessage);
      // Fallback for when toast is not available
      const event = new CustomEvent('cvExportError', { detail: errorMessage });
      window.dispatchEvent(event);
    }
    return;
  }

  try {
    // Remove all interactive elements before export
    const interactiveElements = element.querySelectorAll(
      '.hover\\:bg-gray-50, .hover\\:bg-blue-50, .cursor-pointer, .cursor-move, .drag-handle, .section-drag-indicator, button, .edit-button, .delete-button, .add-button'
    );

    interactiveElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });

    // Apply exact styling to match preview - preserve template padding
    const style = document.createElement('style');
    style.textContent = 
      '#' + elementId + ' { background: white !important; margin: 0 !important; box-shadow: none !important; border: none !important; transform: none !important; width: 794px !important; min-height: 1123px !important; font-family: -apple-system, BlinkMacSystemFont, sans-serif !important; }' +
      '#' + elementId + ' * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box !important; }' +
      '#' + elementId + ' .hover\\:bg-gray-50:hover, #' + elementId + ' .hover\\:bg-blue-50:hover, #' + elementId + ' .hover\\:bg-gray-100:hover, #' + elementId + ' .hover\\:bg-blue-100:hover, #' + elementId + ' .hover\\:shadow-md:hover, #' + elementId + ' .hover\\:shadow-lg:hover { background-color: transparent !important; box-shadow: none !important; transform: none !important; }' +
      '#' + elementId + ' .drag-handle, #' + elementId + ' .section-drag-indicator, #' + elementId + ' .cursor-move, #' + elementId + ' .cursor-pointer, #' + elementId + ' .group, #' + elementId + ' .relative.group { cursor: default !important; transform: none !important; background-color: transparent !important; box-shadow: none !important; }' +
    document.head.appendChild(style);

    // Wait for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      onclone: (clonedDoc) => {
        // Remove any remaining interactive elements from the clone
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          const interactiveElems = clonedElement.querySelectorAll(
            '.hover\\:bg-gray-50, .hover\\:bg-blue-50, .cursor-pointer, .cursor-move, .drag-handle, .section-drag-indicator, button'
          );
          interactiveElems.forEach(el => el.remove());
        }
      }
    });

    // Create PDF with exact A4 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // If content is longer than one page, add additional pages
    let position = imgHeight;
    const pageHeight = 297; // A4 height in mm

    while (position >= pageHeight) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -position + pageHeight, imgWidth, imgHeight);
      position -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);

    // Cleanup
    document.head.removeChild(style);
    interactiveElements.forEach(el => {
      (el as HTMLElement).style.display = '';
    });

    // Success notification
    if (showToast) {
      showToast('success', 'PDF uğurla yükləndi!');
    } else {
      const event = new CustomEvent('cvExportSuccess', { detail: 'PDF uğurla yükləndi!' });
      window.dispatchEvent(event);
    }

  } catch (error) {
    console.error('PDF export error:', error);
    const errorMessage = 'PDF ixrac zamanı xəta baş verdi. Yenidən cəhd edin.';
    if (showToast) {
      showToast('error', errorMessage);
    } else {
      const event = new CustomEvent('cvExportError', { detail: errorMessage });
      window.dispatchEvent(event);
    }
  }
};

// Export to DOCX with proper structure
export const exportToDocx = async (
  cvData: any,
  filename: string = 'CV',
  showToast?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void
) => {
  try {
    const documentSections: Paragraph[] = [];

    // Get section order from CV data
    const sectionOrder: Array<{ id: string; isVisible: boolean }> = cvData.data?.sectionOrder || [
      { id: 'personalInfo', isVisible: true },
      { id: 'summary', isVisible: true },
      { id: 'experience', isVisible: true },
      { id: 'education', isVisible: true },
      { id: 'skills', isVisible: true },
      { id: 'projects', isVisible: true },
      { id: 'certifications', isVisible: true },
      { id: 'languages', isVisible: true },
      { id: 'volunteerExperience', isVisible: true }
    ];

    // Process sections in the correct order
    sectionOrder.forEach((section: { id: string; isVisible: boolean }) => {
      if (!section.isVisible) return;

      switch (section.id) {
        case 'personalInfo':
          if (cvData.data.personalInfo) {
            const info = cvData.data.personalInfo;

            // Name as title
            if (info.fullName) {
              documentSections.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: info.fullName,
                      bold: true,
                      size: 32,
                    }),
                  ],
                  heading: HeadingLevel.TITLE,
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 },
                })
              );
            }

            // Contact information
            const contactInfo = [
              info.email && `Email: ${info.email}`,
              info.phone && `Telefon: ${info.phone}`,
              info.address && `Ünvan: ${info.address}`,
              info.linkedinUrl && `LinkedIn: ${info.linkedinUrl}`,
              info.website && `Website: ${info.website}`
            ].filter(Boolean).join(' | ');

            if (contactInfo) {
              documentSections.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: contactInfo,
                      size: 22,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 300 },
                })
              );
            }
          }
          break;

        case 'summary':
          if (cvData.data.summary) {
            documentSections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'XÜLASƏ / SUMMARY',
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: cvData.data.summary,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              })
            );
          }
          break;

        case 'experience':
          if (cvData.data.experience && cvData.data.experience.length > 0) {
            documentSections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'İŞ TƏCRÜBƏSI / WORK EXPERIENCE',
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              })
            );

            cvData.data.experience.forEach((exp: any) => {
              documentSections.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: exp.position || '',
                      bold: true,
                      size: 22,
                    }),
                  ],
                  spacing: { before: 100, after: 50 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${exp.company || ''} | ${exp.startDate} - ${exp.current ? 'Hazırda' : exp.endDate}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 50 },
                })
              );

              if (exp.description) {
                documentSections.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: exp.description,
                        size: 20,
                      }),
                    ],
                    spacing: { after: 200 },
                  })
                );
              }
            });
          }
          break;

        case 'education':
          if (cvData.data.education && cvData.data.education.length > 0) {
            documentSections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'TƏHSİL / EDUCATION',
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              })
            );

            cvData.data.education.forEach((edu: any) => {
              documentSections.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: edu.degree || '',
                      bold: true,
                      size: 22,
                    }),
                  ],
                  spacing: { before: 100, after: 50 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${edu.institution || ''} | ${edu.startDate} - ${edu.current ? 'Hazırda' : edu.endDate}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 50 },
                })
              );

              if (edu.description) {
                documentSections.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: edu.description,
                        size: 20,
                      }),
                    ],
                    spacing: { after: 200 },
                  })
                );
              }
            });
          }
          break;

        case 'skills':
          if (cvData.data.skills && cvData.data.skills.length > 0) {
            documentSections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'BACARIQLAR / SKILLS',
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              })
            );

            const skillsText = cvData.data.skills.map((skill: any) => skill.name || skill).join(', ');
            documentSections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: skillsText,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              })
            );
          }
          break;

        case 'projects':
          if (cvData.data.projects && cvData.data.projects.length > 0) {
            documentSections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'LAYİHƏLƏR / PROJECTS',
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              })
            );

            cvData.data.projects.forEach((project: any) => {
              documentSections.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: project.name || '',
                      bold: true,
                      size: 22,
                    }),
                  ],
                  spacing: { before: 100, after: 50 },
                })
              );

              if (project.description) {
                documentSections.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: project.description,
                        size: 20,
                      }),
                    ],
                    spacing: { after: 50 },
                  })
                );
              }

              if (project.technologies && project.technologies.length > 0) {
                documentSections.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Texnologiyalar: ${project.technologies.join(', ')}`,
                        size: 20,
                        italics: true,
                      }),
                    ],
                    spacing: { after: 200 },
                  })
                );
              }
            });
          }
          break;

        case 'certifications':
          if (cvData.data.certifications && cvData.data.certifications.length > 0) {
            documentSections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'SERTİFİKATLAR / CERTIFICATIONS',
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              })
            );

            cvData.data.certifications.forEach((cert: any) => {
              documentSections.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cert.name || '',
                      bold: true,
                      size: 22,
                    }),
                  ],
                  spacing: { before: 100, after: 50 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${cert.issuer || ''} | ${cert.issueDate || cert.date || ''}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 200 },
                })
              );
            });
          }
          break;

        case 'languages':
          if (cvData.data.languages && cvData.data.languages.length > 0) {
            documentSections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'DİLLƏR / LANGUAGES',
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              })
            );

            cvData.data.languages.forEach((lang: any) => {
              documentSections.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${lang.name} - ${lang.level || ''}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 100 },
                })
              );
            });
          }
          break;

        case 'volunteerExperience':
          if (cvData.data.volunteerExperience && cvData.data.volunteerExperience.length > 0) {
            documentSections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'KÖNÜLLÜ TƏCRÜBƏ / VOLUNTEER EXPERIENCE',
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              })
            );

            cvData.data.volunteerExperience.forEach((vol: any) => {
              documentSections.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: vol.role || '',
                      bold: true,
                      size: 22,
                    }),
                  ],
                  spacing: { before: 100, after: 50 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${vol.organization || ''} | ${vol.startDate} - ${vol.current ? 'Hazırda' : vol.endDate}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 50 },
                })
              );

              if (vol.description) {
                documentSections.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: vol.description,
                        size: 20,
                      }),
                    ],
                    spacing: { after: 200 },
                  })
                );
              }
            });
          }
          break;
      }
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: documentSections,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    view.set(buffer);
    const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.docx`;
    link.click();

    URL.revokeObjectURL(link.href);

    // Success notification
    if (showToast) {
      showToast('success', 'DOCX uğurla yükləndi!');
    } else {
      const event = new CustomEvent('cvExportSuccess', { detail: 'DOCX uğurla yükləndi!' });
      window.dispatchEvent(event);
    }

  } catch (error) {
    console.error('DOCX export error:', error);
    const errorMessage = 'DOCX ixrac zamanı xəta baş verdi. Yenidən cəhd edin.';
    if (showToast) {
      showToast('error', errorMessage);
    } else {
      const event = new CustomEvent('cvExportError', { detail: errorMessage });
      window.dispatchEvent(event);
    }
  }
};
