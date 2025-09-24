import { NextRequest, NextResponse } from 'next/server';

// PDF parsing
import pdf from 'pdf-parse';
// DOCX parsing  
import mammoth from 'mammoth';

interface ATSAnalysis {
  score: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  analysis: {
    keywords: number;
    formatting: number;
    structure: number;
    contact: number;
    skills: number;
  };
}

// Common ATS keywords for different languages
const ATS_KEYWORDS = {
  azerbaijani: {
    technical: ['proqramlaşdırma', 'kodlaşdırma', 'verilənlər bazası', 'sistem', 'şəbəkə', 'təhlükəsizlik', 'analiz', 'dizayn', 'test', 'debug', 'optimallaşdırma'],
    soft: ['komanda', 'liderlik', 'kommunikasiya', 'problemləri həll etmə', 'vaxt idarəsi', 'yaradıcılıq', 'adaptasiya', 'təşkilatçılıq'],
    experience: ['təcrübə', 'iş', 'layihə', 'məsul', 'idarə', 'inkişaf', 'tətbiq', 'həyata keçirmə', 'nəticə', 'uğur']
  },
  english: {
    technical: ['programming', 'coding', 'database', 'system', 'network', 'security', 'analysis', 'design', 'testing', 'debugging', 'optimization'],
    soft: ['teamwork', 'leadership', 'communication', 'problem-solving', 'time management', 'creativity', 'adaptability', 'organization'],
    experience: ['experience', 'work', 'project', 'responsible', 'manage', 'develop', 'implement', 'achieve', 'result', 'success']
  }
};

// Section headers for structure analysis
const SECTION_HEADERS = {
  azerbaijani: {
    contact: ['əlaqə', 'telefon', 'email', 'ünvan', 'məlumat'],
    experience: ['təcrübə', 'iş təcrübəsi', 'peşə təcrübəsi', 'karyera'],
    education: ['təhsil', 'ali təhsil', 'məktəb', 'universitet', 'kurs'],
    skills: ['bacarıqlar', 'bilik', 'texniki bacarıqlar', 'proqram'],
    summary: ['xülasə', 'haqqımda', 'profil', 'məqsəd']
  },
  english: {
    contact: ['contact', 'phone', 'email', 'address', 'information'],
    experience: ['experience', 'work experience', 'professional experience', 'career', 'employment'],
    education: ['education', 'academic', 'school', 'university', 'degree', 'course'],
    skills: ['skills', 'technical skills', 'competencies', 'abilities', 'software'],
    summary: ['summary', 'profile', 'objective', 'about', 'overview']
  }
};

function detectLanguage(text: string): 'azerbaijani' | 'english' {
  const azerbaijaniWords = ['təcrübə', 'bacarıqlar', 'təhsil', 'iş', 'layihə', 'məsul', 'və', 'üçün'];
  const englishWords = ['experience', 'skills', 'education', 'work', 'project', 'responsible', 'and', 'for'];
  
  let azCount = 0;
  let enCount = 0;
  
  const words = text.toLowerCase().split(/\s+/);
  
  words.forEach(word => {
    if (azerbaijaniWords.includes(word)) azCount++;
    if (englishWords.includes(word)) enCount++;
  });
  
  return azCount > enCount ? 'azerbaijani' : 'english';
}

function analyzeKeywords(text: string, jobDescription: string, language: 'azerbaijani' | 'english'): number {
  const keywords = ATS_KEYWORDS[language];
  const allKeywords = [...keywords.technical, ...keywords.soft, ...keywords.experience];
  
  let score = 0;
  const textLower = text.toLowerCase();
  const jobLower = jobDescription.toLowerCase();
  
  // Check for presence of general ATS keywords
  allKeywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      score += 2; // Base points for each keyword
    }
  });
  
  // Bonus points if job description keywords are found
  if (jobDescription) {
    const jobWords = jobLower.split(/\s+/).filter(word => word.length > 3);
    const uniqueJobWords = [...new Set(jobWords)];
    
    uniqueJobWords.forEach(word => {
      if (textLower.includes(word)) {
        score += 3; // Higher points for job-specific keywords
      }
    });
  }
  
  return Math.min(100, score); // Cap at 100
}

function analyzeFormatting(text: string): number {
  let score = 100;
  
  // Check for formatting issues
  if (text.includes('�') || text.includes('')) {
    score -= 20; // Encoding issues
  }
  
  // Check for consistent spacing
  if (text.includes('  ')) {
    score -= 10; // Multiple spaces
  }
  
  // Check for proper capitalization
  const lines = text.split('\n').filter(line => line.trim());
  let properCapitalization = 0;
  
  lines.forEach(line => {
    if (line.trim() && line[0] === line[0].toUpperCase()) {
      properCapitalization++;
    }
  });
  
  if (properCapitalization / lines.length < 0.5) {
    score -= 15; // Poor capitalization
  }
  
  return Math.max(0, score);
}

function analyzeStructure(text: string, language: 'azerbaijani' | 'english'): number {
  const headers = SECTION_HEADERS[language];
  const textLower = text.toLowerCase();
  
  let foundSections = 0;
  const totalSections = Object.keys(headers).length;
  
  Object.values(headers).forEach(sectionKeywords => {
    const hasSection = sectionKeywords.some(keyword => textLower.includes(keyword));
    if (hasSection) foundSections++;
  });
  
  return Math.round((foundSections / totalSections) * 100);
}

function analyzeContact(text: string): number {
  let score = 0;
  
  // Check for email
  if (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
    score += 25;
  }
  
  // Check for phone number
  if (text.match(/[\+]?[\d\s\-\(\)]{7,15}/)) {
    score += 25;
  }
  
  // Check for LinkedIn or other social profiles
  if (text.toLowerCase().includes('linkedin') || text.includes('github')) {
    score += 25;
  }
  
  // Check for location/address
  if (text.match(/\b(?:Bakı|Baku|Azerbaijan|Azərbaycan|şəhər|city|ünvan|address)\b/i)) {
    score += 25;
  }
  
  return score;
}

function analyzeSkills(text: string, language: 'azerbaijani' | 'english'): number {
  const keywords = ATS_KEYWORDS[language];
  const technicalKeywords = keywords.technical;
  
  let skillsFound = 0;
  const textLower = text.toLowerCase();
  
  technicalKeywords.forEach(skill => {
    if (textLower.includes(skill)) {
      skillsFound++;
    }
  });
  
  // Additional technical skills to check
  const commonTechSkills = [
    'javascript', 'python', 'java', 'html', 'css', 'sql', 'react', 'node',
    'git', 'docker', 'kubernetes', 'aws', 'azure', 'mongodb', 'postgresql'
  ];
  
  commonTechSkills.forEach(skill => {
    if (textLower.includes(skill)) {
      skillsFound++;
    }
  });
  
  return Math.min(100, skillsFound * 5); // 5 points per skill, max 100
}

function generateFeedback(analysis: ATSAnalysis['analysis'], language: 'azerbaijani' | 'english'): ATSAnalysis['feedback'] {
  const feedback = {
    strengths: [] as string[],
    weaknesses: [] as string[],
    suggestions: [] as string[]
  };
  
  const isAz = language === 'azerbaijani';
  
  // Analyze each category
  if (analysis.keywords >= 70) {
    feedback.strengths.push(isAz ? 
      'Açar sözlər yaxşı istifadə edilib və ATS sistemləri tərəfindən asanlıqla tanınacaq' :
      'Keywords are well utilized and will be easily recognized by ATS systems'
    );
  } else {
    feedback.weaknesses.push(isAz ?
      'CV-də kifayət qədər açar söz yoxdur' :
      'CV lacks sufficient relevant keywords'
    );
    feedback.suggestions.push(isAz ?
      'İş elanında göstərilən açar sözləri CV-nizdə istifadə edin' :
      'Include keywords mentioned in the job posting in your CV'
    );
  }
  
  if (analysis.formatting >= 80) {
    feedback.strengths.push(isAz ?
      'CV formatı təmiz və peşəkar görünür' :
      'CV formatting is clean and professional'
    );
  } else {
    feedback.weaknesses.push(isAz ?
      'Formatlaşdırma problemləri mövcuddur' :
      'There are formatting issues present'
    );
    feedback.suggestions.push(isAz ?
      'CV-ni sadə formatda saxlayın və xüsusi simvollardan çəkinin' :
      'Keep CV in simple format and avoid special characters'
    );
  }
  
  if (analysis.structure >= 70) {
    feedback.strengths.push(isAz ?
      'CV strukturu yaxşı təşkil edilib və bütün əsas bölmələr mövcuddur' :
      'CV structure is well organized with all essential sections present'
    );
  } else {
    feedback.weaknesses.push(isAz ?
      'CV strukturunda bəzi əsas bölmələr çatışmır' :
      'CV structure is missing some essential sections'
    );
    feedback.suggestions.push(isAz ?
      'Əlaqə məlumatları, təcrübə, təhsil və bacarıqlar bölmələrini əlavə edin' :
      'Add contact information, experience, education, and skills sections'
    );
  }
  
  if (analysis.contact >= 75) {
    feedback.strengths.push(isAz ?
      'Əlaqə məlumatları tam və düzgün göstərilib' :
      'Contact information is complete and properly displayed'
    );
  } else {
    feedback.weaknesses.push(isAz ?
      'Əlaqə məlumatları natamam və ya düzgün formatda deyil' :
      'Contact information is incomplete or not properly formatted'
    );
    feedback.suggestions.push(isAz ?
      'Email, telefon nömrəsi və LinkedIn profilini əlavə edin' :
      'Add email, phone number, and LinkedIn profile'
    );
  }
  
  if (analysis.skills >= 60) {
    feedback.strengths.push(isAz ?
      'Texniki bacarıqlar yaxşı təqdim edilib' :
      'Technical skills are well presented'
    );
  } else {
    feedback.weaknesses.push(isAz ?
      'Texniki bacarıqlar kifayət qədər əks olunmayıb' :
      'Technical skills are not adequately represented'
    );
    feedback.suggestions.push(isAz ?
      'Sahənizdə tələb olunan texniki bacarıqları əlavə edin' :
      'Add technical skills relevant to your field'
    );
  }
  
  return feedback;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File;
    const jobDescription = formData.get('jobDescription') as string || '';
    const language = formData.get('language') as string || 'azerbaijani';
    
    if (!file) {
      return NextResponse.json(
        { error: 'CV faylı tələb olunur' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';
    
    // Extract text based on file type
    if (file.type === 'application/pdf') {
      try {
        const pdfData = await pdf(buffer);
        extractedText = pdfData.text;
      } catch (error) {
        console.error('PDF parsing error:', error);
        return NextResponse.json(
          { error: 'PDF faylı oxunarkən xəta baş verdi' },
          { status: 400 }
        );
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const docxData = await mammoth.extractRawText({ buffer });
        extractedText = docxData.value;
      } catch (error) {
        console.error('DOCX parsing error:', error);
        return NextResponse.json(
          { error: 'DOCX faylı oxunarkən xəta baş verdi' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Dəstəklənməyən fayl formatı' },
        { status: 400 }
      );
    }
    
    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'Fayldan mətn çıxarıla bilmədi' },
        { status: 400 }
      );
    }
    
    // Detect language if not specified or auto-detect
    const detectedLanguage = language === 'auto' ? detectLanguage(extractedText) : 
                            (language as 'azerbaijani' | 'english');
    
    // Perform ATS analysis
    const analysis = {
      keywords: analyzeKeywords(extractedText, jobDescription, detectedLanguage),
      formatting: analyzeFormatting(extractedText),
      structure: analyzeStructure(extractedText, detectedLanguage),
      contact: analyzeContact(extractedText),
      skills: analyzeSkills(extractedText, detectedLanguage)
    };
    
    // Calculate overall score
    const weights = {
      keywords: 0.3,
      formatting: 0.15,
      structure: 0.25,
      contact: 0.15,
      skills: 0.15
    };
    
    const overallScore = Math.round(
      analysis.keywords * weights.keywords +
      analysis.formatting * weights.formatting +
      analysis.structure * weights.structure +
      analysis.contact * weights.contact +
      analysis.skills * weights.skills
    );
    
    const result: ATSAnalysis = {
      score: overallScore,
      analysis,
      feedback: generateFeedback(analysis, detectedLanguage)
    };
    
    return NextResponse.json({
      success: true,
      result,
      detectedLanguage
    });
    
  } catch (error) {
    console.error('ATS check error:', error);
    return NextResponse.json(
      { error: 'Daxili server xətası' },
      { status: 500 }
    );
  }
}