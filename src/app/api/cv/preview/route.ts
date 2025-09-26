import { NextRequest, NextResponse } from 'next/server';
import { MONTH_NAMES } from '@/lib/cvLanguage';

// Type definitions for CV data structures
interface PersonalInfo {
  fullName?: string;
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
  profileImage?: string;
}

interface Experience {
  position?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

interface Education {
  degree?: string;
  institution?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  gpa?: string;
}

interface CVData {
  personalInfo?: PersonalInfo;
  experience?: Experience[];
  education?: Education[];
  skills?: (string | { name: string; level?: string })[];
  languages?: (string | { language?: string; name?: string; level?: string; proficiency?: string })[];
  projects?: any[];
  certifications?: any[];
  volunteerExperience?: any[];
  publications?: any[];
  sectionOrder?: any[];
  cvLanguage?: string; // Add CV language field
}

// Function to translate dates in CV data for preview
function translateDatesForPreview(cvData: CVData): CVData {
  if (!cvData.cvLanguage) return cvData;
  
  // Map language codes to MONTH_NAMES keys
  const languageMap: Record<string, string> = {
    'russian': 'russian',
    'ru': 'russian',
    'english': 'english',
    'en': 'english',
    'azerbaijani': 'azerbaijani',
    'az': 'azerbaijani'
  };
  
  const targetLang = languageMap[cvData.cvLanguage];
  if (!targetLang || !MONTH_NAMES[targetLang as keyof typeof MONTH_NAMES]) {
    return cvData;
  }
  
  const monthNames = MONTH_NAMES[targetLang as keyof typeof MONTH_NAMES];
  const englishMonths = MONTH_NAMES.english;
  const azMonths = MONTH_NAMES.azerbaijani;
  
  function translateDateString(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    let translatedText = text;
    
    // Replace English month names
    englishMonths.forEach((englishMonth, index) => {
      const regex = new RegExp(`\\b${englishMonth}\\b`, 'gi');
      translatedText = translatedText.replace(regex, monthNames[index]);
    });
    
    // Replace Azerbaijani month names
    azMonths.forEach((azMonth, index) => {
      const regex = new RegExp(`\\b${azMonth}\\b`, 'gi');
      translatedText = translatedText.replace(regex, monthNames[index]);
    });
    
    return translatedText;
  }
  
  // Create a deep copy and translate dates
  const translatedData = JSON.parse(JSON.stringify(cvData));
  
  // Translate experience dates
  if (translatedData.experience) {
    translatedData.experience.forEach((exp: Experience) => {
      if (exp.startDate) exp.startDate = translateDateString(exp.startDate);
      if (exp.endDate) exp.endDate = translateDateString(exp.endDate);
    });
  }
  
  // Translate education dates
  if (translatedData.education) {
    translatedData.education.forEach((edu: Education) => {
      if (edu.startDate) edu.startDate = translateDateString(edu.startDate);
      if (edu.endDate) edu.endDate = translateDateString(edu.endDate);
    });
  }
  
  return translatedData;
}

// CV Preview API endpoint for PDF generation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cvDataParam = searchParams.get('cvData');
    const templateId = searchParams.get('templateId') || 'professional';

    console.log('CV Preview API called:', { templateId, hasData: !!cvDataParam });

    if (!cvDataParam) {
      console.error('No CV data provided');
      return new NextResponse(
        `<!DOCTYPE html><html><body><h1>Error: No CV data provided</h1></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    let cvData;
    try {
      cvData = JSON.parse(decodeURIComponent(cvDataParam));
      console.log('CV data parsed successfully', { 
        hasPersonalInfo: !!cvData.personalInfo,
        hasExperience: !!(cvData.experience && cvData.experience.length > 0)
      });
    } catch (error) {
      console.error('Invalid CV data format:', error);
      return new NextResponse(
        `<!DOCTYPE html><html><body><h1>Error: Invalid CV data format</h1></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Translate dates if needed
    cvData = translateDatesForPreview(cvData);
    console.log('CV dates translated for language:', cvData.cvLanguage);

    // Generate HTML that matches the preview component exactly
    const html = generatePreviewHTML(cvData, templateId);

    console.log('Generated HTML length:', html.length);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('CV preview API error:', error);
    const errorHTML = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Error generating CV preview</h1>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      </body>
      </html>
    `;
    return new NextResponse(errorHTML, { 
      headers: { 'Content-Type': 'text/html' }, 
      status: 500 
    });
  }
}

function generatePreviewHTML(cvData: any, templateId: string): string {
  const { personalInfo, experience, education, skills, languages, projects, certifications, volunteerExperience, publications, sectionOrder, cvLanguage } = cvData;

  // Check if it's Traditional CV template
  if (templateId === 'traditional' || templateId === 'Ənənəvi CV') {
    return generateTraditionalPreviewHTML(cvData);
  }

  // Get sections in the order specified by sectionOrder, or default order
  const defaultSections = [
    { id: 'personal', type: 'personal', isVisible: true },
    { id: 'summary', type: 'summary', isVisible: true },
    { id: 'experience', type: 'experience', isVisible: true },
    { id: 'education', type: 'education', isVisible: true },
    { id: 'skills', type: 'skills', isVisible: true },
    { id: 'languages', type: 'languages', isVisible: true },
    { id: 'projects', type: 'projects', isVisible: true },
    { id: 'certifications', type: 'certifications', isVisible: true },
    { id: 'volunteerExperience', type: 'volunteerExperience', isVisible: true },
    { id: 'publications', type: 'publications', isVisible: true }
  ];

  const orderedSections = sectionOrder && sectionOrder.length > 0
    ? sectionOrder.filter((section: any) => section.isVisible !== false)
    : defaultSections;

  // Generate sections HTML based on the order
  const sectionsHTML = orderedSections.map((section: any) => {
    const sectionType = section.type || section.id;

    switch (sectionType) {
      case 'personal':
        return generatePersonalSection(personalInfo);
      case 'summary':
        return personalInfo?.summary ? generateSummarySection(personalInfo.summary) : '';
      case 'experience':
        return experience && experience.length > 0 ? generateExperienceSection(experience) : '';
      case 'education':
        return education && education.length > 0 ? generateEducationSection(education, cvLanguage) : '';
      case 'skills':
        return skills && skills.length > 0 ? generateSkillsSection(skills) : '';
      case 'languages':
        return languages && languages.length > 0 ? generateLanguagesSection(languages) : '';
      case 'projects':
        return projects && projects.length > 0 ? generateProjectsSection(projects) : '';
      case 'certifications':
        return certifications && certifications.length > 0 ? generateCertificationsSection(certifications) : '';
      case 'volunteerExperience':
        return volunteerExperience && volunteerExperience.length > 0 ? generateVolunteerSection(volunteerExperience) : '';
      case 'publications':
        return publications && publications.length > 0 ? generatePublicationsSection(publications) : '';
      default:
        return '';
    }
  }).filter(Boolean).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Preview - ${personalInfo?.fullName || 'CV'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            width: 794px;  /* A4 width exactly */
            height: auto;  /* Allow height to grow */
            padding: 40px;
            margin: 0;     /* Remove auto centering */
            overflow-x: visible;
            overflow-y: visible;
        }

        @media print {
            body {
                width: 794px !important;
                margin: 0 !important;
                padding: 40px !important;
            }
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }

        .name {
            font-size: 2.5em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .contact-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }

        .contact-item {
            font-size: 0.9em;
            color: #666;
        }

        .section {
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 1.4em;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }

        .experience-item, .education-item, .project-item {
            margin-bottom: 20px;
            padding-left: 20px;
            border-left: 3px solid #3498db;
        }

        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }

        .item-title {
            font-weight: bold;
            font-size: 1.1em;
            color: #2c3e50;
        }

        .item-company {
            color: #7f8c8d;
            font-size: 0.95em;
        }

        .item-date {
            color: #95a5a6;
            font-size: 0.85em;
            white-space: nowrap;
        }

        .item-description {
            margin-top: 8px;
            color: #555;
            line-height: 1.5;
        }

        .skills-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .skill-item {
            background: #ecf0f1;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.9em;
            color: #2c3e50;
        }

        .languages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .language-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }

        .language-name {
            font-weight: 500;
        }

        .language-level {
            color: #7f8c8d;
            font-style: italic;
        }

        @media print {
            body {
                padding: 20px;
                max-width: none;
            }
        }
    </style>
</head>
<body>
    ${sectionsHTML}
</body>
</html>
  `;
}

function generatePersonalSection(personalInfo: any): string {
  if (!personalInfo) return '';

  return `
    <div class="cv-section">
        <div class="text-center mb-8">
            <h1>${personalInfo.fullName || ''}</h1>
            <div class="cv-contact-info">
                ${personalInfo.email ? `
                    <div class="cv-contact-item">
                        <span>${personalInfo.email}</span>
                    </div>
                ` : ''}
                ${personalInfo.phone ? `
                    <div class="cv-contact-item">
                        <span>${personalInfo.phone}</span>
                    </div>
                ` : ''}
                ${personalInfo.location ? `
                    <div class="cv-contact-item">
                        <span>${personalInfo.location}</span>
                    </div>
                ` : ''}
                ${personalInfo.linkedin ? `
                    <div class="cv-contact-item">
                        <span>LinkedIn: ${personalInfo.linkedin}</span>
                    </div>
                ` : ''}
                ${personalInfo.website ? `
                    <div class="cv-contact-item">
                        <span>Website: ${personalInfo.website}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    </div>
  `;
}

function generateSummarySection(summary: string): string {
  return `
    <div class="cv-section">
        <div class="cv-section-header">
            <h2 class="cv-section-title">Summary</h2>
        </div>
        <p>${summary}</p>
    </div>
  `;
}

function generateExperienceSection(experience: any[]): string {
  return `
    <div class="cv-section">
        <div class="cv-section-header">
            <h2 class="cv-section-title">Work Experience</h2>
        </div>
        ${experience.map(exp => `
            <div class="cv-experience-item">
                <div class="cv-experience-header">
                    <div>
                        <div class="cv-experience-title">${exp.position || ''}</div>
                        <div class="cv-experience-company">${exp.company || ''}</div>
                        ${exp.location ? `<div class="cv-experience-location">${exp.location}</div>` : ''}
                    </div>
                    <div class="cv-experience-date">
                        ${exp.startDate || ''} - ${exp.endDate ? exp.endDate : (exp.current ? 'Present' : '')}
                    </div>
                </div>
                ${exp.description ? `<div class="cv-experience-description">${exp.description}</div>` : ''}
            </div>
        `).join('')}
    </div>
  `;
}

function generateEducationSection(education: any[], cvLanguage?: string): string {
  const gpaLabel = cvLanguage === 'english' ? 'GPA' : 'ÜOMG';
  
  return `
    <div class="cv-section">
        <div class="cv-section-header">
            <h2 class="cv-section-title">Education</h2>
        </div>
        ${education.map(edu => `
            <div class="cv-education-item">
                <div class="cv-education-degree">${edu.degree || ''}</div>
                <div class="cv-education-institution">${edu.institution || ''}</div>
                <div class="cv-experience-date">
                    ${edu.startDate || ''} - ${edu.endDate ? edu.endDate : (edu.current ? 'Present' : '')}
                </div>
                ${edu.gpa ? `<div class="cv-experience-location">${gpaLabel}: ${edu.gpa}</div>` : ''}
            </div>
        `).join('')}
    </div>
  `;
}

function generateSkillsSection(skills: any[]): string {
  return `
    <div class="cv-section">
        <div class="cv-section-header">
            <h2 class="cv-section-title">Skills</h2>
        </div>
        <div class="cv-skills-grid">
            ${skills.map(skill => `
                <div class="cv-skill-item">
                    <span class="cv-skill-name">${skill.name || skill.skill || ''}</span>
                    ${skill.level ? `<span class="cv-skill-level">${skill.level}</span>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
  `;
}

function generateLanguagesSection(languages: any[]): string {
  return `
    <div class="cv-section">
        <div class="cv-section-header">
            <h2 class="cv-section-title">Dillər</h2>
        </div>
        <div class="cv-languages-grid">
            ${languages.map(lang => {
              const languageName = lang.language || lang.name || '';
              const languageLevel = lang.level || lang.proficiency || '';
              
              // Translate levels to Azerbaijani
              const levelTranslations: Record<string, string> = {
                'Basic': 'Əsas',
                'Conversational': 'Danışıq',
                'Professional': 'Professional', 
                'Native': 'Ana dili'
              };
              
              const translatedLevel = levelTranslations[languageLevel as string] || languageLevel;
              
              return `
                <div class="cv-language-item">
                    <span class="cv-language-name">${languageName}</span>
                    <span class="cv-language-level">${translatedLevel}</span>
                </div>
              `;
            }).join('')}
        </div>
    </div>
  `;
}

function generateProjectsSection(projects: any[]): string {
  return `
    <div class="cv-section">
        <div class="cv-section-header">
            <h2 class="cv-section-title">Projects</h2>
        </div>
        ${projects.map(project => `
            <div class="cv-project-item">
                <div class="cv-project-title">${project.name || ''}</div>
                ${project.description ? `<div class="cv-project-description">${project.description}</div>` : ''}
                ${project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 ? 
                    `<div class="cv-project-tech">Technologies: ${project.technologies.join(', ')}</div>` : ''}
                ${project.url ? `<div class="cv-project-url"><a href="${project.url}" target="_blank">Project Link</a></div>` : ''}
            </div>
        `).join('')}
    </div>
  `;
}

function generateCertificationsSection(certifications: any[]): string {
  return `
    <div class="cv-section">
        <div class="cv-section-header">
            <h2 class="cv-section-title">Certifications</h2>
        </div>
        ${certifications.map(cert => `
            <div class="cv-certification-item">
                <div class="cv-certification-name">${cert.name || ''}</div>
                <div class="cv-certification-issuer">${cert.issuer || ''}</div>
                ${cert.date || cert.issueDate ? `<div class="cv-certification-date">${cert.date || cert.issueDate}</div>` : ''}
                ${cert.credentialId ? `<div class="cv-certification-id">Credential ID: ${cert.credentialId}</div>` : ''}
            </div>
        `).join('')}
    </div>
  `;
}

function generateVolunteerSection(volunteerExperience: any[]): string {
  return `
    <div class="cv-section">
        <div class="cv-section-header">
            <h2 class="cv-section-title">Volunteer Experience</h2>
        </div>
        ${volunteerExperience.map(vol => `
            <div class="cv-volunteer-item">
                <div class="cv-volunteer-header">
                    <div>
                        <div class="cv-volunteer-role">${vol.role || ''}</div>
                        <div class="cv-volunteer-organization">${vol.organization || ''}</div>
                    </div>
                    <div class="cv-volunteer-date">
                        ${vol.startDate || ''} - ${vol.endDate ? vol.endDate : (vol.current ? 'Present' : '')}
                    </div>
                </div>
                ${vol.description ? `<div class="cv-volunteer-description">${vol.description}</div>` : ''}
                ${vol.cause ? `<div class="cv-volunteer-cause">Cause: ${vol.cause}</div>` : ''}
            </div>
        `).join('')}
    </div>
  `;
}

function generatePublicationsSection(publications: any[]): string {
  return `
    <div class="cv-section">
        <div class="cv-section-header">
            <h2 class="cv-section-title">Publications</h2>
        </div>
        ${publications.map(pub => `
            <div class="cv-publication-item">
                <div class="cv-publication-title">${pub.title || ''}</div>
                ${pub.publisher ? `<div class="cv-publication-publisher">${pub.publisher}</div>` : ''}
                ${pub.date ? `<div class="cv-publication-date">${pub.date}</div>` : ''}
                ${pub.description ? `<div class="cv-publication-description">${pub.description}</div>` : ''}
                ${pub.url ? `<div class="cv-publication-url"><a href="${pub.url}" target="_blank">Read Publication</a></div>` : ''}
            </div>
        `).join('')}
    </div>
  `;
}

function generateTraditionalPreviewHTML(cvData: any): string {
  const { personalInfo, experience, education, skills, languages, projects, certifications, volunteerExperience, publications, cvLanguage } = cvData;
  const gpaLabel = cvLanguage === 'english' ? 'GPA' : 'ÜOMG';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Preview - ${personalInfo?.fullName || 'CV'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }

        h1, h2, h3 {
            font-weight: normal;
            color: #2c3e50;
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 0.5em;
        }

        h2 {
            font-size: 1.8em;
            margin-bottom: 0.4em;
        }

        h3 {
            font-size: 1.2em;
            margin-bottom: 0.3em;
        }

        p {
            margin-bottom: 1em;
            color: #555;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .contact-info {
            margin-bottom: 20px;
        }

        .contact-item {
            display: inline-block;
            margin-right: 15px;
            font-size: 0.9em;
            color: #666;
        }

        .section {
            margin-bottom: 40px;
        }

        .section-title {
            font-size: 1.4em;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
            margin-bottom: 20px;
        }

        .experience-item, .education-item, .project-item {
            margin-bottom: 25px;
            padding-left: 20px;
            border-left: 3px solid #3498db;
        }

        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .item-title {
            font-weight: bold;
            font-size: 1.1em;
            color: #2c3e50;
        }

        .item-company {
            color: #7f8c8d;
            font-size: 0.95em;
        }

        .item-date {
            color: #95a5a6;
            font-size: 0.85em;
            white-space: nowrap;
        }

        .item-description {
            margin-top: 8px;
            color: #555;
            line-height: 1.5;
        }

        .skills-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .skill-item {
            background: #ecf0f1;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.9em;
            color: #2c3e50;
        }

        .languages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .language-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }

        .language-name {
            font-weight: 500;
        }

        .language-level {
            color: #7f8c8d;
            font-style: italic;
        }

        @media print {
            body {
                padding: 20px;
                max-width: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${personalInfo?.fullName || ''}</h1>
        <div class="contact-info">
            ${personalInfo.email ? `
                <div class="contact-item">
                    <span>${personalInfo.email}</span>
                </div>
            ` : ''}
            ${personalInfo.phone ? `
                <div class="contact-item">
                    <span>${personalInfo.phone}</span>
                </div>
            ` : ''}
            ${personalInfo.location ? `
                <div class="contact-item">
                    <span>${personalInfo.location}</span>
                </div>
            ` : ''}
            ${personalInfo.linkedin ? `
                <div class="contact-item">
                    <span>LinkedIn: ${personalInfo.linkedin}</span>
                </div>
            ` : ''}
            ${personalInfo.website ? `
                <div class="contact-item">
                    <span>Website: ${personalInfo.website}</span>
                </div>
            ` : ''}
        </div>
    </div>

    ${experience && experience.length > 0 ? `
        <div class="section">
            <div class="section-title">Work Experience</div>
            ${experience.map((exp: Experience) => `
                <div class="experience-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${exp.position || ''}</div>
                            <div class="item-company">${exp.company || ''}</div>
                            ${exp.location ? `<div class="item-location">${exp.location}</div>` : ''}
                        </div>
                        <div class="item-date">
                            ${exp.startDate || ''} - ${exp.endDate ? exp.endDate : (exp.current ? 'Present' : '')}
                        </div>
                    </div>
                    ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                </div>
            `).join('')}
        </div>
    ` : ''}

    ${education && education.length > 0 ? `
        <div class="section">
            <div class="section-title">Education</div>
            ${education.map((edu: Education) => `
                <div class="education-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${edu.degree || ''}</div>
                            <div class="item-company">${edu.institution || ''}</div>
                        </div>
                        <div class="item-date">
                            ${edu.startDate || ''} - ${edu.endDate ? edu.endDate : (edu.current ? 'Present' : '')}
                        </div>
                    </div>
                    ${edu.gpa ? `<div class="item-description">${gpaLabel}: ${edu.gpa}</div>` : ''}
                </div>
            `).join('')}
        </div>
    ` : ''}

    ${skills && skills.length > 0 ? `
        <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-grid">
                ${skills.map((skill: any) => `
                    <div class="skill-item">
                        <span class="cv-skill-name">${skill.name || skill.skill || ''}</span>
                        ${skill.level ? `<span class="cv-skill-level">${skill.level}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    ` : ''}

    ${languages && languages.length > 0 ? `
        <div class="section">
            <div class="section-title">Languages</div>
            <div class="languages-grid">
                ${languages.map((lang: any) => {
                  const languageName = lang.language || lang.name || '';
                  const languageLevel = lang.level || lang.proficiency || '';
                  
                  // Translate levels to Azerbaijani
                  const levelTranslations: Record<string, string> = {
                    'Basic': 'Əsas',
                    'Conversational': 'Danışıq',
                    'Professional': 'Professional', 
                    'Native': 'Ana dili'
                  };
                  
                  const translatedLevel = levelTranslations[languageLevel as string] || languageLevel;
                  
                  return `
                    <div class="language-item">
                        <span class="language-name">${languageName}</span>
                        <span class="language-level">${translatedLevel}</span>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
    ` : ''}

    ${projects && projects.length > 0 ? `
        <div class="section">
            <div class="section-title">Projects</div>
            ${projects.map((project: any) => `
                <div class="project-item">
                    <div class="item-title">${project.name || ''}</div>
                    ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
                    ${project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 ? 
                        `<div class="item-description">Technologies: ${project.technologies.join(', ')}</div>` : ''}
                    ${project.url ? `<div class="item-description"><a href="${project.url}" target="_blank">Project Link</a></div>` : ''}
                </div>
            `).join('')}
        </div>
    ` : ''}

    ${certifications && certifications.length > 0 ? `
        <div class="section">
            <div class="section-title">Certifications</div>
            ${certifications.map((cert: any) => `
                <div class="certification-item">
                    <div class="item-title">${cert.name || ''}</div>
                    <div class="item-company">${cert.issuer || ''}</div>
                    ${cert.date || cert.issueDate ? `<div class="item-date">${cert.date || cert.issueDate}</div>` : ''}
                    ${cert.credentialId ? `<div class="item-description">Credential ID: ${cert.credentialId}</div>` : ''}
                </div>
            `).join('')}
        </div>
    ` : ''}

    ${volunteerExperience && volunteerExperience.length > 0 ? `
        <div class="section">
            <div class="section-title">Volunteer Experience</div>
            ${volunteerExperience.map((vol: any) => `
                <div class="volunteer-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${vol.role || ''}</div>
                            <div class="item-company">${vol.organization || ''}</div>
                        </div>
                        <div class="item-date">
                            ${vol.startDate || ''} - ${vol.endDate ? vol.endDate : (vol.current ? 'Present' : '')}
                        </div>
                    </div>
                    ${vol.description ? `<div class="item-description">${vol.description}</div>` : ''}
                    ${vol.cause ? `<div class="item-description">Cause: ${vol.cause}</div>` : ''}
                </div>
            `).join('')}
        </div>
    ` : ''}

    ${publications && publications.length > 0 ? `
        <div class="section">
            <div class="section-title">Publications</div>
            ${publications.map((pub: any) => `
                <div class="publication-item">
                    <div class="item-title">${pub.title || ''}</div>
                    ${pub.publisher ? `<div class="item-description">${pub.publisher}</div>` : ''}
                    ${pub.date ? `<div class="item-date">${pub.date}</div>` : ''}
                    ${pub.description ? `<div class="item-description">${pub.description}</div>` : ''}
                    ${pub.url ? `<div class="item-description"><a href="${pub.url}" target="_blank">Read Publication</a></div>` : ''}
                </div>
            `).join('')}
        </div>
    ` : ''}
</body>
</html>
  `;
}
