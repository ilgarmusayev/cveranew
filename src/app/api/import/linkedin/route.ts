import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { PrismaClient } from '@prisma/client';
import { ScrapingDogLinkedInService } from '@/lib/services/scrapingdog-linkedin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const prisma = new PrismaClient();

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
    
    Aşağıdakı LinkedIn profil məlumatlarını analiz edərək DƏQIQ 2 hard skill və 2 soft skill təklif et:

    PROFİL MƏLUMATLARI:
    - Ad: ${profileData.personalInfo?.fullName || 'Bilinmir'}
    - Başlıq: ${profileData.personalInfo?.title || 'Bilinmir'}
    - Yer: ${profileData.personalInfo?.location || 'Bilinmir'}
    - Xülasə: ${profileData.personalInfo?.summary || 'Bilinmir'}
    - İş təcrübəsi sayı: ${profileData.experience?.length || 0}
    - Təhsil sayı: ${profileData.education?.length || 0}
    - Mövcud bacarıqlar: ${existingSkillNames.join(', ') || 'Heç biri'}

    İŞ TƏCRÜBƏSİ:
    ${profileData.experience?.map((exp: any, i: number) => 
      `${i+1}. ${exp.position} @ ${exp.company} (${exp.description?.substring(0, 100) || ''})`
    ).join('\n') || 'Məlumat yoxdur'}

    TƏHSİL:
    ${profileData.education?.map((edu: any, i: number) => 
      `${i+1}. ${edu.degree} - ${edu.institution} (${edu.fieldOfStudy || ''})`
    ).join('\n') || 'Məlumat yoxdur'}

    TƏLƏBLƏR:
    1. DƏQIQ 2 hard skill (texniki bacarıqlar)
    2. DƏQIQ 2 soft skill (şəxsi bacarıqlar)
    3. Mövcud bacarıqları təkrar etmə
    4. Profil məlumatlarına uyğun olsun
    5. İş bazarında axtarılan bacarıqlar olsun

    Nəticəni JSON formatında ver:
    {
      "hardSkills": [
        {"name": "Hard Skill 1", "level": "Başlanğıc|Orta|Təcrübəli"},
        {"name": "Hard Skill 2", "level": "Başlanğıc|Orta|Təcrübəli"}
      ],
      "softSkills": [
        {"name": "Soft Skill 1", "level": "Başlanğıc|Orta|Təcrübəli"},
        {"name": "Soft Skill 2", "level": "Başlanğıc|Orta|Təcrübəli"}
      ]
    }
    `;

    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text().trim();

    console.log('🔍 AI Skills Response:', aiResponse);

    // JSON parse et
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response-da JSON tapılmadı');
    }

    const aiSkills = JSON.parse(jsonMatch[0]);
    
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

  } catch (error) {
    console.error('❌ AI skills yaradılması xətası:', error);
    return [];
  }
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

// Transform ScrapingDog data to CV format with complete data mapping
function transformScrapingDogToCVFormat(scrapingDogData: any) {
  console.log('🔄 ScrapingDog məlumatları tam CV formatına çevrilir...');
  
  // Personal Information - daha ətraflı məlumat dolduruluşu
  const personalInfo = {
    fullName: scrapingDogData.name || `${scrapingDogData.firstName || ''} ${scrapingDogData.lastName || ''}`.trim(),
    firstName: scrapingDogData.firstName || scrapingDogData.name?.split(' ')[0] || '',
    lastName: scrapingDogData.lastName || scrapingDogData.name?.split(' ').slice(1).join(' ') || '',
    title: scrapingDogData.headline || '',
    email: scrapingDogData.email || '',
    phone: scrapingDogData.phone || '',
    location: scrapingDogData.location || '',
    website: scrapingDogData.website || '',
    linkedin: scrapingDogData.linkedinUrl || scrapingDogData.profileUrl || '',
    summary: scrapingDogData.summary || scrapingDogData.about || '',
    profilePicture: scrapingDogData.profilePicture || ''
  };

  // Work Experience - tam təcrübə məlumatları
  const experience = (scrapingDogData.experience || []).map((exp: any, index: number) => {
    // Tarix formatlarını düzəlt
    let startDate = exp.startDate || exp.starts_at || '';
    let endDate = exp.endDate || exp.ends_at || '';
    let current = false;
    
    // "Present", "Current", "Hal-hazırda" və ya boş endDate-i yoxla
    if (!endDate || endDate.toLowerCase().includes('present') || 
        endDate.toLowerCase().includes('current') || 
        endDate.toLowerCase().includes('hal-hazırda')) {
      current = true;
      endDate = '';
    }

    return {
      id: `exp-scrapingdog-${Date.now()}-${index}`,
      position: exp.title || exp.position || '',
      company: exp.company || exp.company_name || '',
      startDate: startDate,
      endDate: endDate,
      current: current,
      description: exp.description || exp.summary || '',
      location: exp.location || '',
      employmentType: exp.employmentType || exp.type || '',
      duration: exp.duration || (startDate && endDate ? `${startDate} - ${endDate}` : '')
    };
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

  // Projects - layihələr
  const projects = (scrapingDogData.projects || []).map((project: any, index: number) => ({
    id: `project-scrapingdog-${Date.now()}-${index}`,
    name: project.title || project.name || '',
    description: project.description || project.summary || '',
    url: project.link || project.url || project.website || '',
    startDate: project.startDate || project.start_date || '',
    endDate: project.endDate || project.end_date || '',
    skills: project.skills || project.technologies || '',
    duration: project.duration || ''
  }));

  // Awards & Honors - mükafatlar və şərəflər
  const awards = (scrapingDogData.awards || []).map((award: any, index: number) => ({
    id: `award-scrapingdog-${Date.now()}-${index}`,
    name: award.name || award.title || '',
    issuer: award.organization || award.issuer || award.authority || '',
    date: award.date || award.duration || award.year || award.time || '',
    description: award.description || award.summary || '',
    type: 'award' // Award tipini təyin edirik
  }));

  // Honors - şərəf mükafatları (akademik və peşəkar)
  const honors = (scrapingDogData.honors || scrapingDogData.achievements || []).map((honor: any, index: number) => ({
    id: `honor-scrapingdog-${Date.now()}-${index}`,
    name: honor.name || honor.title || '',
    issuer: honor.organization || honor.issuer || honor.institution || '',
    date: honor.date || honor.duration || honor.year || '',
    description: honor.description || honor.summary || '',
    type: 'honor' // Honor tipini təyin edirik
  }));

  // Certifications - professional sertifikatlar
  const certifications = (scrapingDogData.certifications || scrapingDogData.certificates || []).map((cert: any, index: number) => ({
    id: `cert-scrapingdog-${Date.now()}-${index}`,
    name: cert.name || cert.title || cert.certification || '',
    issuer: cert.organization || cert.issuer || cert.authority || cert.provider || '',
    issueDate: cert.date || cert.issueDate || cert.startDate || cert.year || '',
    expiryDate: cert.expiryDate || cert.expires || cert.endDate || '',
    credentialId: cert.credentialId || cert.id || cert.certificate_id || '',
    url: cert.url || cert.link || cert.verificationUrl || '',
    description: cert.description || cert.summary || '',
    skills: cert.skills || cert.relatedSkills || '',
    status: cert.status || (cert.expiryDate ? 'active' : 'permanent')
  }));

  // Languages - dillər
  const languages = (scrapingDogData.languages || []).map((lang: any, index: number) => ({
    id: `lang-scrapingdog-${Date.now()}-${index}`,
    name: typeof lang === 'string' ? lang : (lang.name || lang.language || ''),
    proficiency: typeof lang === 'object' ? (lang.proficiency || lang.level || '') : ''
  }));

  // Volunteer Experience - könüllü təcrübə
  const volunteering = (scrapingDogData.volunteering || []).map((vol: any, index: number) => ({
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
    volunteeringCount: volunteering.length
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
    volunteering
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

    console.log('📝 LinkedIn URL:', linkedinUrl);
    console.log('👤 User ID:', decoded.userId);

    // Parallel execution of ScrapingDog and RapidAPI
    console.log('📡 ScrapingDog və RapidAPI paralel başlayır...');

    const [scrapingDogResponse, rapidApiResponse] = await Promise.allSettled([
      scrapingDogService.scrapeLinkedInProfile(linkedinUrl),
      getRapidAPISkills(linkedinUrl)
    ]);

    // Check ScrapingDog result
    let scrapingDogResult = null;
    if (scrapingDogResponse.status === 'fulfilled' && scrapingDogResponse.value) {
      scrapingDogResult = scrapingDogResponse.value;
      console.log('✅ ScrapingDog uğurludur!');
    } else {
      console.error('❌ ScrapingDog xətası:', scrapingDogResponse.status === 'rejected' ? scrapingDogResponse.reason : 'No data');
      return NextResponse.json({
        success: false,
        error: `ScrapingDog import uğursuz: ${scrapingDogResponse.status === 'rejected' ? scrapingDogResponse.reason.message : 'No data received'}`
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

    // Transform ScrapingDog data to CV format
    console.log('📍 ScrapingDog məlumatları formatlanır...');
    const transformedData = transformScrapingDogToCVFormat(scrapingDogResult);

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

    // Generate AI-suggested skills (2 hard + 2 soft)
    console.log('🤖 AI skills yaradılır...');
    const aiSkills = await generateLinkedInAISkills(transformedData, transformedData.skills);
    if (aiSkills.length > 0) {
      transformedData.skills = [...transformedData.skills, ...aiSkills];
      console.log(`✅ ${aiSkills.length} AI skill əlavə edildi (2 hard + 2 soft)`);
    }

    console.log('📋 Combined data preview:', {
      fullName: transformedData.personalInfo?.fullName,
      title: transformedData.personalInfo?.title,
      location: transformedData.personalInfo?.location,
      experienceCount: transformedData.experience?.length || 0,
      educationCount: transformedData.education?.length || 0,
      skillsCount: transformedData.skills?.length || 0,
      aiSkillsAdded: aiSkills.length,
      projectsCount: transformedData.projects?.length || 0,
      awardsCount: transformedData.awards?.length || 0,
      honorsCount: transformedData.honors?.length || 0,
      certificationsCount: transformedData.certifications?.length || 0,
      languagesCount: transformedData.languages?.length || 0,
      volunteeringCount: transformedData.volunteering?.length || 0,
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
          volunteering: transformedData.volunteering,
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
          profileUrl: linkedinUrl,
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
            volunteeringCount: transformedData.volunteering.length
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
        aiSkillsAdded: aiSkills.length,
        projectsCount: transformedData.projects.length,
        awardsCount: transformedData.awards.length,
        honorsCount: transformedData.honors.length,
        certificationsCount: transformedData.certifications.length,
        languagesCount: transformedData.languages.length,
        volunteeringCount: transformedData.volunteering.length,
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
