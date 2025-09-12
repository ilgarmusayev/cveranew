import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { PrismaClient } from '@prisma/client';
import { ScrapingDogLinkedInService } from '@/lib/services/scrapingdog-linkedin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const prisma = new PrismaClient();

// Helper function to extract and normalize LinkedIn username from various URL formats
function extractLinkedInUsername(input: string): { username: string; normalizedUrl: string } | null {
  if (!input?.trim()) return null;
  
  const cleanInput = input.trim();
  
  // Handle various LinkedIn URL formats:
  // - https://www.linkedin.com/in/username
  // - https://linkedin.com/in/username  
  // - www.linkedin.com/in/username
  // - linkedin.com/in/username
  // - just username
  
  // If it contains linkedin.com/in/, extract username
  if (cleanInput.includes('linkedin.com/in/')) {
    const match = cleanInput.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^\/\?\s]+)/);
    if (match) {
      const username = match[1];
      return {
        username: username,
        normalizedUrl: `https://www.linkedin.com/in/${username}`
      };
    }
  }
  
  // If it's just a username (no linkedin.com), treat as username
  if (!cleanInput.includes('linkedin.com') && !cleanInput.includes('http')) {
    const cleanUsername = cleanInput.replace('@', '').replace(/[^\w.-]/g, '');
    if (cleanUsername) {
      return {
        username: cleanUsername,
        normalizedUrl: `https://www.linkedin.com/in/${cleanUsername}`
      };
    }
  }
  
  return null;
}

// ScrapingDog LinkedIn Service instance
const scrapingDogService = new ScrapingDogLinkedInService();

// Gemini AI for skill generation
const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Generate AI-suggested skills for LinkedIn import
async function generateLinkedInAISkills(profileData: any, existingSkills: any[]) {
  try {
    console.log('🤖 AI skills yaradılır LinkedIn import üçün...');

    const existingSkillNames = existingSkills.map(skill => 
      typeof skill === 'string' ? skill : skill.name
    ).filter(Boolean);

    const prompt = `
    LinkedIn Profil Analizi və Bacarıq Təklifləri
    ============================================
    
    Aşağıdakı LinkedIn profil məlumatlarını ƏTRAFLY analiz edərək DƏQIQ 3 hard skill və 3 soft skill təklif et:

    PROFİL MƏLUMATLARI:
    - Ad: ${profileData.personalInfo?.fullName || 'Bilinmir'}
    - Başlıq/Vəzifə: ${profileData.personalInfo?.title || profileData.personalInfo?.headline || 'Bilinmir'}
    - Yer: ${profileData.personalInfo?.location || 'Bilinmir'}
    - Xülasə: ${profileData.personalInfo?.summary || 'Məlumat yoxdur - təhsil və təcrübəyə əsaslanın'}
    
    DETAYLI İŞ TƏCRÜBƏSİ (${profileData.experience?.length || 0} məlumat):
    ${profileData.experience?.map((exp: any, i: number) => 
      `${i+1}. Vəzifə: ${exp.position || exp.title || 'Bilinmir'}
         Şirkət: ${exp.company || 'Bilinmir'}
         Müddət: ${exp.duration || exp.startDate + ' - ' + (exp.endDate || 'İndi') || 'Bilinmir'}
         Təsvir: ${exp.description?.substring(0, 200) || 'Təsvir yoxdur'}
         Sahə: ${exp.industry || 'Bilinmir'}`
    ).join('\n\n') || 'İş təcrübəsi məlumatı yoxdur'}

    DETAYLI TƏHSİL (${profileData.education?.length || 0} məlumat):
    ${profileData.education?.map((edu: any, i: number) => 
      `${i+1}. Dərəcə: ${edu.degree || edu.title || 'Bilinmir'}
         Universitet: ${edu.institution || edu.school || 'Bilinmir'}
         Sahə: ${edu.fieldOfStudy || edu.field || 'Bilinmir'}
         Tarix: ${edu.startDate + ' - ' + (edu.endDate || 'İndi') || 'Bilinmir'}
         Təsvir: ${edu.description?.substring(0, 100) || 'Təsvir yoxdur'}`
    ).join('\n\n') || 'Təhsil məlumatı yoxdur'}

    DİGER BÖLMƏLƏR:
    - Layihələr: ${profileData.projects?.length || 0} məlumat
    - Sertifikatlar: ${profileData.certifications?.length || 0} məlumat  
    - Könüllü təcrübə: ${profileData.volunteerExperience?.length || 0} məlumat
    - Dillər: ${profileData.languages?.join(', ') || 'Məlumat yoxdur'}
    - Mövcud bacarıqlar: ${existingSkillNames.join(', ') || 'Heç biri'}

    ANALIZ QAYDASI:
    1. Əgər summary varsa, əsas məlumat kimi istifadə et
    2. Əgər summary yoxdursa:
       - İş təcrübəsindən vəzifə və təsvirləri analiz et
       - Təhsil sahəsini və dərəcəsini nəzərə al
       - Layihələr və sertifikatları qiymətləndir
    3. Sahəyə uyğun ən populyar hard skills təklif et
    4. İş mühitində lazım olan soft skills seç

    TƏLƏBLƏR:
    1. DƏQIQ 3 hard skill (texniki/peşəkar bacarıqlar)
    2. DƏQIQ 3 soft skill (şəxsi/liderlik bacarıqlar)
    3. Mövcud bacarıqları təkrar etmə
    4. Profil məlumatlarına uyğun və real olsun
    5. İş bazarında axtarılan və tələb olunan bacarıqlar
    6. Level düzgün təyin et (Başlanğıc/Orta/Təcrübəli)

    Nəticəni JSON formatında ver:
    {
      "hardSkills": [
        {"name": "Hard Skill 1", "level": "Başlanğıc|Orta|Təcrübəli"},
        {"name": "Hard Skill 2", "level": "Başlanğıc|Orta|Təcrübəli"},
        {"name": "Hard Skill 3", "level": "Başlanğıc|Orta|Təcrübəli"}
      ],
      "softSkills": [
        {"name": "Soft Skill 1", "level": "Başlanğıc|Orta|Təcrübəli"},
        {"name": "Soft Skill 2", "level": "Başlanğıc|Orta|Təcrübəli"},
        {"name": "Soft Skill 3", "level": "Başlanğıc|Orta|Təcrübəli"}
      ]
    }
    `;

    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    try {
      console.log('🔄 AI skills çağırışı...');
      
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text().trim();

      console.log('🔍 AI Skills Response:', aiResponse);

      // JSON parse et
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI response-da JSON tapılmadı');
      }

      const aiSkills = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (!aiSkills.hardSkills || !aiSkills.softSkills) {
        throw new Error('AI response formatı düzgün deyil');
      }
      
      // Skills-ləri format et
      const formattedSkills = [
        ...aiSkills.hardSkills.map((skill: any, index: number) => ({
          id: `ai-hard-skill-${Date.now()}-${index}`,
          name: skill.name,
          level: skill.level,
          type: 'hard',
          source: 'ai'
        })),
        ...aiSkills.softSkills.map((skill: any, index: number) => ({
          id: `ai-soft-skill-${Date.now()}-${index}`,
          name: skill.name,
          level: skill.level,
          type: 'soft',
          source: 'ai'
        }))
      ];

      console.log(`✅ AI tərəfindən ${formattedSkills.length} skill yaradıldı:`, 
        formattedSkills.map(s => `${s.name} (${s.type})`));

      return formattedSkills;
      
    } catch (error: any) {
      console.error('❌ AI skills yaradılması xətası:', error.message);
      // If AI fails, generate fallback skills
      console.log('🔄 AI uğursuz oldu, fallback skills yaradılır...');
      return generateFallbackSkills(profileData, existingSkillNames);
    }

  } catch (error) {
    console.error('❌ AI skills yaradılması ümumi xətası:', error);
    return generateFallbackSkills(profileData, existingSkills.map(s => typeof s === 'string' ? s : s.name));
  }
}

// Fallback skills generation when AI fails
function generateFallbackSkills(profileData: any, existingSkillNames: string[]) {
  console.log('🔄 Fallback AI skills yaradılır...');
  
  const title = profileData.personalInfo?.title?.toLowerCase() || '';
  const headline = profileData.personalInfo?.headline?.toLowerCase() || '';
  const summary = profileData.personalInfo?.summary?.toLowerCase() || '';
  const experience = profileData.experience || [];
  const education = profileData.education || [];
  
  // Combine all text for analysis including detailed education
  const experienceText = experience.map((e: any) => 
    `${e.position || ''} ${e.company || ''} ${e.description || ''} ${e.industry || ''}`
  ).join(' ').toLowerCase();
  
  const educationText = education.map((e: any) => 
    `${e.degree || ''} ${e.fieldOfStudy || ''} ${e.field || ''} ${e.institution || ''} ${e.description || ''}`
  ).join(' ').toLowerCase();
  
  const allText = `${title} ${headline} ${summary} ${experienceText} ${educationText}`.toLowerCase();
  
  // Enhanced hard skills mapping by field/education
  const hardSkillsMap: {[key: string]: string[]} = {
    // Programming & Development
    'java': ['Java', 'Spring Framework'],
    'javascript': ['JavaScript', 'React'],
    'python': ['Python', 'Django'],
    'programming': ['Programming', 'Software Development'],
    'development': ['Web Development', 'Software Testing'],
    'software': ['Software Engineering', 'Code Review'],
    
    // Engineering disciplines
    'engineering': ['Technical Analysis', 'Problem Solving'],
    'engineer': ['Engineering Design', 'Technical Documentation'],
    'electrical': ['Electrical Engineering', 'Circuit Design'],
    'mechanical': ['Mechanical Engineering', 'CAD Design'],
    'civil': ['Civil Engineering', 'Project Planning'],
    'computer': ['Computer Science', 'System Design'],
    
    // Business & Management
    'management': ['Project Management', 'Team Leadership'],
    'business': ['Business Analysis', 'Strategic Planning'],
    'finance': ['Financial Analysis', 'Budget Management'],
    'accounting': ['Financial Reporting', 'Accounting Software'],
    'economics': ['Economic Analysis', 'Market Research'],
    
    // Design & Creative
    'design': ['UI/UX Design', 'Adobe Creative Suite'],
    'graphic': ['Graphic Design', 'Visual Communication'],
    'architecture': ['Architectural Design', 'AutoCAD'],
    'art': ['Creative Design', 'Visual Arts'],
    
    // Marketing & Sales
    'marketing': ['Digital Marketing', 'Google Analytics'],
    'sales': ['Sales Strategy', 'Customer Relations'],
    'social media': ['Social Media Marketing', 'Content Creation'],
    
    // Data & Analytics
    'data': ['Data Analysis', 'SQL'],
    'analytics': ['Data Analytics', 'Statistical Analysis'],
    'statistics': ['Statistical Modeling', 'Data Visualization'],
    'research': ['Research Methodology', 'Data Collection'],
    
    // Healthcare & Science
    'medical': ['Medical Knowledge', 'Healthcare Management'],
    'nursing': ['Patient Care', 'Medical Procedures'],
    'biology': ['Laboratory Skills', 'Research Methods'],
    'chemistry': ['Chemical Analysis', 'Laboratory Techniques'],
    
    // Education
    'education': ['Curriculum Development', 'Educational Technology'],
    'teaching': ['Instructional Design', 'Student Assessment'],
    'training': ['Training Development', 'Learning Management'],
    
    // Operations & Logistics
    'operations': ['Operations Management', 'Process Improvement'],
    'logistics': ['Supply Chain Management', 'Inventory Management'],
    'quality': ['Quality Assurance', 'Quality Control'],
    
    // Default/General
    'default': ['Microsoft Office', 'Communication Tools']
  };
  
  // Enhanced soft skills with more variety
  const softSkillsOptions = [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving',
    'Critical Thinking', 'Adaptability', 'Time Management', 'Creativity',
    'Analytical Thinking', 'Collaboration', 'Decision Making', 'Initiative',
    'Emotional Intelligence', 'Negotiation', 'Public Speaking', 'Mentoring',
    'Conflict Resolution', 'Strategic Thinking', 'Innovation', 'Flexibility',
    'Customer Service', 'Interpersonal Skills', 'Project Coordination', 'Organization'
  ];
  
  // Find relevant hard skills based on text analysis
  let selectedHardSkills: string[] = [];
  
  // Check each keyword category
  for (const [keyword, skills] of Object.entries(hardSkillsMap)) {
    if (keyword !== 'default' && allText.includes(keyword) && selectedHardSkills.length < 2) {
      const remainingSlots = 2 - selectedHardSkills.length;
      selectedHardSkills.push(...skills.slice(0, remainingSlots));
    }
  }
  
  // If still need more skills, try education-specific matching
  if (selectedHardSkills.length < 2) {
    const educationKeywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college'];
    const hasEducation = educationKeywords.some(keyword => allText.includes(keyword));
    
    if (hasEducation) {
      if (allText.includes('computer') || allText.includes('it') || allText.includes('information')) {
        selectedHardSkills.push('Computer Skills', 'Technical Analysis');
      } else if (allText.includes('business') || allText.includes('management')) {
        selectedHardSkills.push('Business Analysis', 'Project Management');
      } else if (allText.includes('engineer')) {
        selectedHardSkills.push('Technical Skills', 'Engineering Analysis');
      }
    }
  }
  
  // Fill with default if still not enough
  if (selectedHardSkills.length < 3) {
    const defaultSkills = ['Microsoft Office', 'Communication Tools', 'Data Analysis', 'Project Coordination', 'Technical Writing', 'Research Skills'];
    const needed = 3 - selectedHardSkills.length;
    selectedHardSkills.push(...defaultSkills.slice(0, needed));
  }
  
  // Ensure we have exactly 3 hard skills
  selectedHardSkills = selectedHardSkills.slice(0, 3);
  
  // Select appropriate soft skills avoiding duplicates
  const availableSoftSkills = softSkillsOptions.filter(skill => 
    !existingSkillNames.some(existing => 
      existing.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(existing.toLowerCase())
    )
  );
  
  const selectedSoftSkills = availableSoftSkills
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  
  // If not enough unique soft skills, use defaults
  if (selectedSoftSkills.length < 3) {
    const defaultSoftSkills = ['Communication', 'Problem Solving', 'Teamwork', 'Leadership', 'Critical Thinking', 'Adaptability'];
    const needed = 3 - selectedSoftSkills.length;
    selectedSoftSkills.push(...defaultSoftSkills.filter(skill => 
      !selectedSoftSkills.includes(skill)
    ).slice(0, needed));
  }
  
  // Format skills with appropriate levels based on experience
  const hasExperience = experience.length > 0;
  const hasEducation = education.length > 0;
  const defaultLevel = hasExperience && hasEducation ? 'Təcrübəli' : hasExperience || hasEducation ? 'Orta' : 'Başlanğıc';
  
  const formattedSkills = [
    ...selectedHardSkills.map((skill, index) => ({
      id: `fallback-hard-skill-${Date.now()}-${index}`,
      name: skill,
      level: defaultLevel,
      type: 'hard',
      source: 'fallback'
    })),
    ...selectedSoftSkills.map((skill, index) => ({
      id: `fallback-soft-skill-${Date.now()}-${index}`,
      name: skill,
      level: defaultLevel, 
      type: 'soft',
      source: 'fallback'
    }))
  ];
  
  console.log(`✅ Fallback skills yaradıldı (${defaultLevel} səviyyə): ${formattedSkills.map(s => s.name).join(', ')}`);
  return formattedSkills;
}

// RapidAPI LinkedIn Skills - parallel skills extraction
async function getRapidAPISkills(linkedinUrl: string) {
  console.log(`🎯 RapidAPI skills extraction başladı: ${linkedinUrl}`);

  try {
    const options = {
      method: 'GET',
      url: 'https://linkedin-data-api.p.rapidapi.com/get-profile-data-by-url',
      params: {
        url: linkedinUrl
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'e69773e8c2msh50ce2f81e481a35p1888abjsn83f1b967cbe4',
        'X-RapidAPI-Host': 'linkedin-data-api.p.rapidapi.com'
      },
      timeout: 20000
    };

    const response = await axios.request(options);

    if (response.status === 200 && response.data) {
      console.log('✅ RapidAPI skills məlumatları alındı');
      return response.data;
    }

    throw new Error(`RapidAPI error: ${response.status}`);

  } catch (error: any) {
    console.error('❌ RapidAPI skills xətası:', error.message);
    return null; // Skills optional olduğu üçün null qaytarırıq
  }
}

// Transform ScrapingDog data to our format
function transformScrapingDogData(scrapingDogData: any, normalizedUrl: string) {
  console.log('🔄 ScrapingDog data transform edilir...');
  console.log('📊 RAW ScrapingDog Data Keys:', Object.keys(scrapingDogData));
  console.log('📊 Raw projects data:', scrapingDogData.projects);
  console.log('📊 Raw certifications data:', scrapingDogData.certifications || scrapingDogData.certificates);
  console.log('📊 Raw awards data:', scrapingDogData.awards);
  console.log('📊 Raw experience data:', scrapingDogData.experience);

  // Personal Information - şəxsi məlumatlar
  const personalInfo = {
    fullName: scrapingDogData.name || `${scrapingDogData.firstName || ''} ${scrapingDogData.lastName || ''}`.trim(),
    firstName: scrapingDogData.firstName || scrapingDogData.name?.split(' ')[0] || '',
    lastName: scrapingDogData.lastName || scrapingDogData.name?.split(' ').slice(1).join(' ') || '',
    title: scrapingDogData.headline || '',
    email: scrapingDogData.email || '',
    phone: scrapingDogData.phone || '',
    location: scrapingDogData.location || '',
    website: scrapingDogData.website || '',
    linkedin: normalizedUrl, // Use the normalized URL instead of scraped data
    summary: scrapingDogData.summary || scrapingDogData.about || '',
    profilePicture: scrapingDogData.profilePicture || ''
  };  // Work Experience - tam təcrübə məlumatları
  const experience = (scrapingDogData.experience || []).map((exp: any, index: number) => {
    console.log(`📊 RAW Experience ${index + 1}:`, exp);
    
    // Tarix formatlarını düzəlt
    let startDate = exp.startDate || exp.starts_at || exp.start_date || '';
    let endDate = exp.endDate || exp.ends_at || exp.end_date || '';
    let current = false;
    
    // "Present", "Current", "Hal-hazırda" və ya boş endDate-i yoxla
    if (!endDate || endDate.toLowerCase().includes('present') || 
        endDate.toLowerCase().includes('current') || 
        endDate.toLowerCase().includes('hal-hazırda')) {
      current = true;
      endDate = '';
    }

    const mappedExp = {
      id: `exp-scrapingdog-${Date.now()}-${index}`,
      position: exp.title || exp.position || exp.job_title || exp.role || '',
      company: exp.company || exp.company_name || exp.companyName || exp.organization || '',
      startDate: startDate,
      endDate: endDate,
      current: current,
      description: exp.description || exp.summary || exp.details || '',
      location: exp.location || exp.geo_location || '',
      employmentType: exp.employmentType || exp.type || exp.employment_type || '',
      duration: exp.duration || (startDate && endDate ? `${startDate} - ${endDate}` : '')
    };
    
    console.log(`✅ Mapped Experience ${index + 1}:`, mappedExp);
    return mappedExp;
  });

  // Education - tam təhsil məlumatları
  const education = (scrapingDogData.education || []).map((edu: any, index: number) => ({
    id: `edu-scrapingdog-${Date.now()}-${index}`,
    institution: edu.school || edu.college_name || edu.institution || '',
    degree: edu.degree || edu.college_degree || '',
    fieldOfStudy: edu.field || edu.college_degree_field || edu.fieldOfStudy || '',
    startDate: edu.startDate || edu.start_date || '',
    endDate: edu.endDate || edu.end_date || '',
    description: edu.description || edu.activities || '',
    grade: edu.grade || edu.gpa || '',
    activities: edu.activities || edu.description || '',
    duration: edu.duration || edu.college_duration || ''
  }));

  // Skills - bacarıqlar (RapidAPI-dən əlavə olunacaq)
  const skills = (scrapingDogData.skills || []).map((skill: any, index: number) => ({
    id: `skill-scrapingdog-${Date.now()}-${index}`,
    name: typeof skill === 'string' ? skill : (skill.name || skill.skill || ''),
    level: typeof skill === 'object' ? (skill.level || skill.proficiency || '') : ''
  }));

  // Projects - layihələr - Enhanced Mapping
  const projects = (scrapingDogData.projects || []).map((project: any, index: number) => {
    console.log(`📊 RAW Project ${index + 1}:`, project);
    
    const mappedProject = {
      id: `project-scrapingdog-${Date.now()}-${index}`,
      name: project.title || project.name || project.project_name || project.projectName || `Project ${index + 1}`,
      description: project.description || project.summary || project.details || project.about || '',
      url: project.link || project.url || project.website || project.project_url || '',
      startDate: project.startDate || project.start_date || project.started_at || '',
      endDate: project.endDate || project.end_date || project.ended_at || '',
      skills: project.skills || project.technologies || project.tech_stack || '',
      duration: project.duration || ''
    };
    
    console.log(`✅ Mapped Project ${index + 1}:`, mappedProject);
    return mappedProject;
  });

  // Awards & Honors - mükafatlar və şərəflər - Enhanced Mapping
  const awards = (scrapingDogData.awards || []).map((award: any, index: number) => {
    console.log(`📊 RAW Award ${index + 1}:`, award);
    
    const mappedAward = {
      id: `award-scrapingdog-${Date.now()}-${index}`,
      name: award.name || award.title || award.award_name || `Award ${index + 1}`,
      issuer: award.organization || award.issuer || award.authority || award.provider || award.company || '',
      date: award.date || award.duration || award.year || award.time || award.awarded_at || '',
      description: award.description || award.summary || award.details || '',
      type: 'award' // Award tipini təyin edirik
    };
    
    console.log(`✅ Mapped Award ${index + 1}:`, mappedAward);
    return mappedAward;
  });

  // Honors - şərəf mükafatları (akademik və peşəkar) - Enhanced Mapping
  const honors = (scrapingDogData.honors || scrapingDogData.achievements || []).map((honor: any, index: number) => {
    console.log(`📊 RAW Honor ${index + 1}:`, honor);
    
    const mappedHonor = {
      id: `honor-scrapingdog-${Date.now()}-${index}`,
      name: honor.name || honor.title || honor.honor_name || `Honor ${index + 1}`,
      issuer: honor.organization || honor.issuer || honor.institution || honor.authority || '',
      date: honor.date || honor.duration || honor.year || honor.awarded_at || '',
      description: honor.description || honor.summary || honor.details || '',
      type: 'honor' // Honor tipini təyin edirik
    };
    
    console.log(`✅ Mapped Honor ${index + 1}:`, mappedHonor);
    return mappedHonor;
  });

  // Certifications - professional sertifikatlar - Enhanced Mapping
  const certifications = (scrapingDogData.certifications || scrapingDogData.certificates || []).map((cert: any, index: number) => {
    console.log(`📊 RAW Certification ${index + 1}:`, cert);
    
    const mappedCert = {
      id: `cert-scrapingdog-${Date.now()}-${index}`,
      name: cert.name || cert.title || cert.certification || cert.certificate_name || `Certification ${index + 1}`,
      issuer: cert.organization || cert.issuer || cert.authority || cert.provider || cert.company || '',
      issueDate: cert.date || cert.issueDate || cert.startDate || cert.year || cert.issued_at || '',
      expiryDate: cert.expiryDate || cert.expires || cert.endDate || cert.expires_at || '',
      credentialId: cert.credentialId || cert.id || cert.certificate_id || cert.credential_id || '',
      url: cert.url || cert.link || cert.verificationUrl || cert.verification_url || '',
      description: cert.description || cert.summary || cert.details || '',
      skills: cert.skills || cert.relatedSkills || cert.related_skills || '',
      status: cert.status || (cert.expiryDate ? 'active' : 'permanent')
    };
    
    console.log(`✅ Mapped Certification ${index + 1}:`, mappedCert);
    return mappedCert;
  });

  // Languages - dillər  
  const languages = (scrapingDogData.languages || []).map((lang: any, index: number) => ({
    id: `lang-scrapingdog-${Date.now()}-${index}`,
    language: typeof lang === 'string' ? lang : (lang.name || lang.language || ''),
    level: typeof lang === 'object' ? (lang.proficiency || lang.level || 'Orta') : 'Orta'
  }));

  // Volunteer Experience - könüllü təcrübə
  const volunteerExperience = (scrapingDogData.volunteering || []).map((vol: any, index: number) => ({
    id: `vol-scrapingdog-${Date.now()}-${index}`,
    organization: vol.organization || vol.company || '',
    role: vol.role || vol.position || '',
    cause: vol.cause || vol.field || '',
    startDate: vol.startDate || vol.start_date || '',
    endDate: vol.endDate || vol.end_date || '',
    description: vol.description || vol.summary || '',
    current: vol.current || false,
    duration: vol.duration || ''
  }));

  console.log('✅ ScrapingDog məlumatları tam formata çevrildi:', {
    personalInfo: personalInfo.fullName,
    experienceCount: experience.length,
    educationCount: education.length,
    skillsCount: skills.length,
    projectsCount: projects.length,
    awardsCount: awards.length,
    honorsCount: honors.length,
    certificationsCount: certifications.length,
    languagesCount: languages.length,
    volunteerExperienceCount: volunteerExperience.length
  });

  return {
    personalInfo,
    experience,
    education,
    skills,
    projects,
    awards,
    honors,
    certifications,
    languages,
    volunteerExperience
  };
}

// Extract enhanced skills and additional data from RapidAPI response
function extractRapidAPISkills(rapidApiData: any) {
  if (!rapidApiData) return [];

  try {
    // RapidAPI skills can be in different locations
    let skills = rapidApiData.skills || 
                 rapidApiData.data?.skills || 
                 rapidApiData.profile?.skills || 
                 [];

    if (!Array.isArray(skills)) {
      // Sometimes skills come as object with different structure
      if (typeof skills === 'object') {
        skills = Object.values(skills) || [];
      } else {
        return [];
      }
    }

    const enhancedSkills = skills
      .filter((skill: any) => skill && (typeof skill === 'string' || skill.name || skill.skill))
      .map((skill: any, index: number) => {
        if (typeof skill === 'string') {
          return {
            id: `skill-rapidapi-${Date.now()}-${index}`,
            name: skill.trim(),
            level: ''
          };
        }

        return {
          id: `skill-rapidapi-${Date.now()}-${index}`,
          name: (skill.name || skill.skill || skill.title || '').trim(),
          level: skill.level || skill.proficiency || skill.rating || ''
        };
      })
      .filter((skill: any) => skill.name.length > 0);

    console.log(`✅ RapidAPI-dən ${enhancedSkills.length} bacarıq əlavə edildi`);
    return enhancedSkills;

  } catch (error) {
    console.error('❌ RapidAPI skills extraction xətası:', error);
    return [];
  }
}

// ScrapingDog LinkedIn Profile Scraping - Primary Service
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 LinkedIn import - ScrapingDog + RapidAPI paralel');

    // Verify JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    if (!decoded?.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get LinkedIn URL from request
    const { linkedinUrl } = await request.json();
    if (!linkedinUrl?.trim()) {
      return NextResponse.json(
        { error: 'LinkedIn URL tələb olunur' },
        { status: 400 }
      );
    }

    // Extract and normalize LinkedIn URL
    const linkedinData = extractLinkedInUsername(linkedinUrl);
    if (!linkedinData) {
      return NextResponse.json(
        { error: 'Düzgün LinkedIn URL və ya username daxil edin (məs: musayevcreate və ya https://linkedin.com/in/musayevcreate)' },
        { status: 400 }
      );
    }

    const { username, normalizedUrl } = linkedinData;
    console.log('📝 Original input:', linkedinUrl);
    console.log('👤 Extracted username:', username);
    console.log('🔗 Normalized URL:', normalizedUrl);
    console.log('👤 User ID:', decoded.userId);

    // Parallel execution of ScrapingDog and RapidAPI
    console.log('📡 ScrapingDog və RapidAPI paralel başlayır...');

    const [scrapingDogResponse, rapidApiResponse] = await Promise.allSettled([
      scrapingDogService.scrapeLinkedInProfile(normalizedUrl),
      getRapidAPISkills(normalizedUrl)
    ]);

    // Check ScrapingDog result
    let scrapingDogResult = null;
    if (scrapingDogResponse.status === 'fulfilled' && scrapingDogResponse.value) {
      scrapingDogResult = scrapingDogResponse.value;
      console.log('✅ ScrapingDog uğurludur!');
    } else {
      const errorMessage = scrapingDogResponse.status === 'rejected' 
        ? (scrapingDogResponse.reason?.message || scrapingDogResponse.reason || 'Unknown error')
        : 'No data';
      console.error('❌ ScrapingDog xətası:', errorMessage);
      return NextResponse.json({
        success: false,
        error: `ScrapingDog import uğursuz: ${errorMessage}`
      }, { status: 500 });
    }

    // Check RapidAPI result (optional)
    let rapidApiResult = null;
    if (rapidApiResponse.status === 'fulfilled' && rapidApiResponse.value) {
      rapidApiResult = rapidApiResponse.value;
      console.log('✅ RapidAPI skills uğurludur!');
    } else {
      console.log('⚠️ RapidAPI skills alınmadı (optional):', rapidApiResponse.status === 'rejected' ? rapidApiResponse.reason : 'No data');
    }

    // Transform ScrapingDog data to CV format using comprehensive transformation
    console.log('📍 ScrapingDog məlumatları formatlanır...');
    const transformedData = transformScrapingDogData(scrapingDogResult, normalizedUrl);

    // Add RapidAPI skills if available
    if (rapidApiResult) {
      console.log('🎯 RapidAPI skills birləşdirilir...');
      const rapidApiSkills = extractRapidAPISkills(rapidApiResult);
      if (rapidApiSkills.length > 0) {
        // Merge with existing skills, remove duplicates
        const existingSkills = transformedData.skills.map((s: any) => s.name.toLowerCase());
        const newSkills = rapidApiSkills.filter((skill: any) =>
          !existingSkills.includes(skill.name.toLowerCase())
        );
        transformedData.skills = [...transformedData.skills, ...newSkills];
        console.log(`✅ ${newSkills.length} yeni skill RapidAPI-dən əlavə edildi`);
      }
    }

    // Generate AI-suggested skills (3 hard + 3 soft)
    console.log('🤖 AI skills yaradılır...');
    const aiSkills = await generateLinkedInAISkills(transformedData, transformedData.skills);
    if (aiSkills && aiSkills.length > 0) {
      transformedData.skills = [...transformedData.skills, ...aiSkills];
      console.log(`✅ ${aiSkills.length} AI skill əlavə edildi (3 hard + 3 soft)`);
    }

    console.log('📋 Combined data preview:', {
      fullName: transformedData.personalInfo?.fullName,
      title: transformedData.personalInfo?.title,
      location: transformedData.personalInfo?.location,
      experienceCount: transformedData.experience?.length || 0,
      educationCount: transformedData.education?.length || 0,
      skillsCount: transformedData.skills?.length || 0,
      aiSkillsAdded: aiSkills?.length || 0,
      projectsCount: transformedData.projects?.length || 0,
      awardsCount: transformedData.awards?.length || 0,
      honorsCount: transformedData.honors?.length || 0,
      certificationsCount: transformedData.certifications?.length || 0,
      languagesCount: transformedData.languages?.length || 0,
      volunteerExperienceCount: transformedData.volunteerExperience?.length || 0,
      dataSource: 'scrapingdog + rapidapi + ai'
    });

    // Generate a unique CV name
    const firstName = scrapingDogResult.firstName?.trim();
    const lastName = scrapingDogResult.lastName?.trim();
    const name = scrapingDogResult.name?.trim();
    
    const cvName = name || 
                   (firstName && lastName ? `${firstName} ${lastName}` : '') || 
                   'LinkedIn CV';

    console.log(`📝 CV yaradılır: "${cvName}" - Dil: İngilis`);

    // Save CV to database with all imported data
    const newCV = await prisma.cV.create({
      data: {
        title: cvName,
        userId: decoded.userId,
        cv_data: {
          personalInfo: transformedData.personalInfo,
          experience: transformedData.experience,
          education: transformedData.education,
          skills: transformedData.skills,
          projects: transformedData.projects,
          awards: transformedData.awards,
          honors: transformedData.honors,
          certifications: transformedData.certifications,
          languages: transformedData.languages,
          volunteerExperience: transformedData.volunteerExperience,
          language: 'en' // CV dili ingilis dili olaraq təyin edilir
        }
      }
    });

    // Log successful import with detailed statistics
    await prisma.importSession.create({
      data: {
        userId: decoded.userId,
        type: 'linkedin_success',
        data: JSON.stringify({
          cvId: newCV.id,
          profileUrl: normalizedUrl, // Use normalized URL instead of original input
          cvLanguage: 'en',
          importStats: {
            experienceCount: transformedData.experience.length,
            educationCount: transformedData.education.length,
            skillsCount: transformedData.skills.length,
            projectsCount: transformedData.projects.length,
            awardsCount: transformedData.awards.length,
            honorsCount: transformedData.honors.length,
            certificationsCount: transformedData.certifications.length,
            languagesCount: transformedData.languages.length,
            volunteerExperienceCount: transformedData.volunteerExperience.length
          },
          dataSource: 'scrapingdog + rapidapi'
        }),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    console.log('✅ LinkedIn import və CV yaradılması uğurla tamamlandı!');
    console.log('📋 Yaradılan CV ID:', newCV.id);

    return NextResponse.json({
      success: true,
      cvId: newCV.id,
      message: 'LinkedIn profili uğurla import edildi və CV yaradıldı - bütün məlumatlar + AI skills dolduruldu (İngilis dilində)',
      summary: {
        name: cvName,
        language: 'en',
        experienceCount: transformedData.experience.length,
        educationCount: transformedData.education.length,
        skillsCount: transformedData.skills.length,
        aiSkillsAdded: aiSkills?.length || 0,
        projectsCount: transformedData.projects.length,
        awardsCount: transformedData.awards.length,
        honorsCount: transformedData.honors.length,
        certificationsCount: transformedData.certifications.length,
        languagesCount: transformedData.languages.length,
        volunteerExperienceCount: transformedData.volunteerExperience.length,
        source: 'ScrapingDog + RapidAPI + AI Skills',
        totalSections: 9
      }
    });

  } catch (error: any) {
    console.error('❌ LinkedIn import general error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'LinkedIn import zamanı xəta baş verdi'
    }, { status: 500 });
  }
}
