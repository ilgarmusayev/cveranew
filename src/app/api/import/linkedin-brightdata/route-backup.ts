import { NextRequest, NextResponse } from 'next/server';
import { BrightDataLinkedInService } from '@/lib/services/brightdata-linkedin';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

interface ImportStats {
  personalInfoCount: number;
  experienceCount: number;
  educationCount: number;
  skillsCount: number;
  projectsCount: number;
  certificationsCount: number;
  awardsCount: number;
  languagesCount: number;
  volunteerExperienceCount: number;
  dataSource: string;
}

function transformBrightDataToCV(brightDataResult: any, normalizedUrl: string): any {
  console.log('🔄 BrightData → CV Data Transformation başlayır...');
  console.log('📊 RAW BrightData COMPLETE Structure:');
  console.log(JSON.stringify(brightDataResult, null, 2));

  // Snapshot-dan real field name-ləri yoxlayaq
  console.log('� REAL BrightData Fields Check:');
  console.log('- name:', brightDataResult.name);
  console.log('- first_name:', brightDataResult.first_name); 
  console.log('- last_name:', brightDataResult.last_name);
  console.log('- headline:', brightDataResult.headline);
  console.log('- position:', brightDataResult.position);
  console.log('- about:', brightDataResult.about);
  console.log('- summary:', brightDataResult.summary);
  console.log('- location:', brightDataResult.location);
  console.log('- city:', brightDataResult.city);
  console.log('- country:', brightDataResult.country);
  console.log('- profile_pic_url:', brightDataResult.profile_pic_url);
  console.log('- avatar:', brightDataResult.avatar);
  console.log('- experience count:', (brightDataResult.experience || []).length);
  console.log('- education count:', (brightDataResult.education || []).length);

  // Personal Information - Real BrightData field name-lərini istifadə edək
  const personalInfo = {
    fullName: brightDataResult.name || `${brightDataResult.first_name || ''} ${brightDataResult.last_name || ''}`.trim(),
    firstName: brightDataResult.first_name || brightDataResult.name?.split(' ')[0] || '',
    lastName: brightDataResult.last_name || brightDataResult.name?.split(' ').slice(1).join(' ') || '',
    title: brightDataResult.headline || brightDataResult.position || '',
    field: brightDataResult.headline || brightDataResult.position || '', 
    email: '', // Not available in BrightData
    phone: '', // Not available in BrightData  
    location: brightDataResult.location || brightDataResult.city || `${brightDataResult.city || ''}, ${brightDataResult.country || ''}`.trim(),
    website: '', // Not available in this format
    linkedin: normalizedUrl,
    summary: brightDataResult.about || brightDataResult.summary || '',
    profilePicture: brightDataResult.profile_pic_url || brightDataResult.avatar || ''
  };

  console.log('✅ PersonalInfo mapped:', personalInfo);

  // Work Experience - Real BrightData snapshot structure-ına uyğun
  const experience = (brightDataResult.experience || []).map((exp: any, index: number) => {
    console.log(`📊 RAW Experience ${index + 1} FULL:`, JSON.stringify(exp, null, 2));
    
    // BrightData real field name-lərini yoxlayaq
    console.log(`🔍 Experience ${index + 1} Field Check:`);
    console.log('- title:', exp.title);
    console.log('- position:', exp.position);
    console.log('- company:', exp.company);
    console.log('- company_name:', exp.company_name);
    console.log('- start_date:', exp.start_date);
    console.log('- end_date:', exp.end_date);
    console.log('- description:', exp.description);
    console.log('- location:', exp.location);
    
    // Tarix formatlarını düzəlt
    let startDate = exp.start_date || exp.startDate || '';
    let endDate = exp.end_date || exp.endDate || '';
    let current = false;
    
    // "Present", "Current" yoxla
    if (!endDate || endDate === 'Present' || endDate.toLowerCase().includes('present') || 
        endDate.toLowerCase().includes('current')) {
      current = true;
      endDate = '';
    }

    const mappedExp = {
      id: `exp-brightdata-${Date.now()}-${index}`,
      position: exp.title || exp.position || exp.job_title || '',
      company: exp.company || exp.company_name || '',
      startDate: startDate,
      endDate: endDate,
      current: current,
      description: exp.description || exp.description_html || '',
      location: exp.location || '',
      employmentType: exp.employment_type || '',
      duration: exp.duration || ''
    };
    
    console.log(`✅ Mapped Experience ${index + 1}:`, mappedExp);
    return mappedExp;
  });

  // Education - Real BrightData snapshot structure-ına uyğun
  const education = (brightDataResult.education || []).map((edu: any, index: number) => {
    console.log(`📊 RAW Education ${index + 1} FULL:`, JSON.stringify(edu, null, 2));
    
    // BrightData real field name-lərini yoxlayaq
    console.log(`🔍 Education ${index + 1} Field Check:`);
    console.log('- school:', edu.school);
    console.log('- title:', edu.title);
    console.log('- institution:', edu.institution);
    console.log('- degree:', edu.degree);
    console.log('- field_of_study:', edu.field_of_study);
    console.log('- start_year:', edu.start_year);
    console.log('- end_year:', edu.end_year);
    
    const mappedEdu = {
      id: `edu-brightdata-${Date.now()}-${index}`,
      institution: edu.school || edu.title || edu.institution || '',
      degree: edu.degree || '',
      fieldOfStudy: edu.field_of_study || edu.field || edu.fieldOfStudy || '',
      startDate: edu.start_year || edu.start_date || '',
      endDate: edu.end_year || edu.end_date || '',
      description: edu.description || '',
      grade: edu.grade || '',
      activities: edu.activities || ''
    };
    
    console.log(`✅ Mapped Education ${index + 1}:`, mappedEdu);
    return mappedEdu;
  });

  // Skills - BrightData snapshot-dan skills yoxlayaq
  console.log('🔍 Skills Field Check:', brightDataResult.skills);
  const skills: any[] = (brightDataResult.skills || []).map((skill: any, index: number) => ({
    id: `skill-brightdata-${Date.now()}-${index}`,
    name: typeof skill === 'string' ? skill : (skill.name || skill.skill || ''),
    level: typeof skill === 'object' ? (skill.level || skill.proficiency || '') : ''
  }));

  // Projects - Real BrightData snapshot structure
  const projects = (brightDataResult.projects || []).map((project: any, index: number) => {
    console.log(`📊 RAW Project ${index + 1}:`, JSON.stringify(project, null, 2));
    
    const mappedProject = {
      id: `project-brightdata-${Date.now()}-${index}`,
      name: project.name || project.title || `Project ${index + 1}`,
      description: project.description || '',
      url: project.url || '',
      startDate: project.start_date || '',
      endDate: project.end_date || '',
      skills: project.skills || '',
      duration: project.duration || ''
    };
    
    console.log(`✅ Mapped Project ${index + 1}:`, mappedProject);
    return mappedProject;
  });

  // Awards - Real BrightData snapshot structure
  const awards = (brightDataResult.honors_and_awards || brightDataResult.awards || []).map((award: any, index: number) => {
    console.log(`📊 RAW Award ${index + 1}:`, JSON.stringify(award, null, 2));
    
    const mappedAward = {
      id: `award-brightdata-${Date.now()}-${index}`,
      name: award.name || award.title || `Award ${index + 1}`,
      issuer: award.issuer || '',
      date: award.date || '',
      description: award.description || '',
      type: 'award'
    };
    
    console.log(`✅ Mapped Award ${index + 1}:`, mappedAward);
    return mappedAward;
  });

  // Honors - ScrapingDog model-inə uyğun fəxri adlar
  const honors = [...awards];

  // Certifications - Real BrightData snapshot structure
  const certifications = (brightDataResult.certifications || []).map((cert: any, index: number) => {
    console.log(`📊 RAW Certification ${index + 1}:`, JSON.stringify(cert, null, 2));
    
    const mappedCert = {
      id: `cert-brightdata-${Date.now()}-${index}`,
      name: cert.name || cert.title || `Certification ${index + 1}`,
      issuer: cert.issuer || cert.organization || '',
      issueDate: cert.date || cert.issueDate || '',
      expiryDate: cert.expiryDate || '',
      credentialId: cert.credentialId || '',
      url: cert.url || '',
      description: cert.description || '',
      skills: cert.skills || '',
      status: cert.status || 'permanent'
    };
    
    console.log(`✅ Mapped Certification ${index + 1}:`, mappedCert);
    return mappedCert;
  });

  // Languages - Real BrightData snapshot structure
  console.log('🔍 Languages Field Check:', brightDataResult.languages);
  const languages = (brightDataResult.languages || []).map((lang: any, index: number) => {
    console.log(`📊 RAW Language ${index + 1}:`, lang);
    
    const mappedLang = {
      id: `lang-brightdata-${Date.now()}-${index}`,
      language: typeof lang === 'string' ? lang : (lang.name || lang.language || ''),
      level: typeof lang === 'object' ? (lang.proficiency || lang.level || 'Orta') : 'Orta'
    };
    
    console.log(`✅ Mapped Language ${index + 1}:`, mappedLang);
    return mappedLang;
  });

  // Volunteer Experience - Real BrightData snapshot structure
  const volunteerExperience = (brightDataResult.volunteer_experience || brightDataResult.volunteering || []).map((vol: any, index: number) => {
    console.log(`📊 RAW Volunteer ${index + 1}:`, JSON.stringify(vol, null, 2));
    
    const mappedVol = {
      id: `vol-brightdata-${Date.now()}-${index}`,
      organization: vol.organization || vol.company || '',
      role: vol.position || vol.role || '',
      cause: vol.cause || vol.area || '',
      startDate: vol.start_date || vol.startDate || '',
      endDate: vol.end_date || vol.endDate || '',
      description: vol.description || '',
      current: vol.current || false,
      duration: vol.duration || ''
    };
    
    console.log(`✅ Mapped Volunteer ${index + 1}:`, mappedVol);
    return mappedVol;
  });

  const transformedData = {
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

  console.log('✅ BrightData transformation FINAL results:', {
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
  
  return transformedData;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 BrightData LinkedIn Import API çağırıldı');

    // Parse request body
    const body = await request.json();
    const { linkedinUrl } = body;

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL tələb olunur' },
        { status: 400 }
      );
    }

    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Giriş token-i tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Etibarsız token' },
        { status: 401 }
      );
    }

    // Normalize LinkedIn URL
    const normalizedUrl = linkedinUrl.replace(/\/$/, '');
    console.log('🔗 Normalized LinkedIn URL:', normalizedUrl);

    // Initialize BrightData service
    const brightDataService = new BrightDataLinkedInService();

    // Scrape LinkedIn profile
    console.log('📡 BrightData scraping başlayır...');
    console.log('🔗 LinkedIn URL:', normalizedUrl);
    
    let brightDataResult;
    let rawApiResponse;
    try {
      rawApiResponse = await brightDataService.scrapeLinkedInProfile(normalizedUrl);
      console.log('📊 BrightData API Response Structure:', {
        success: rawApiResponse?.success,
        hasData: !!rawApiResponse?.data,
        hasRawData: !!rawApiResponse?.rawData,
        provider: rawApiResponse?.provider,
        error: rawApiResponse?.error
      });
      
      // Extract actual profile data from the wrapper
      if (rawApiResponse?.success && rawApiResponse?.data) {
        brightDataResult = rawApiResponse.data;
        console.log('✅ Using transformed data from API wrapper');
      } else if (rawApiResponse?.rawData) {
        brightDataResult = rawApiResponse.rawData;
        console.log('✅ Using raw data from API wrapper');
      } else {
        throw new Error(`BrightData API failed: ${rawApiResponse?.error || 'No data returned'}`);
      }
      
      console.log('� BrightData profile data keys:', brightDataResult ? Object.keys(brightDataResult) : 'No keys');
      
    } catch (scrapeError) {
      console.error('❌ BrightData scraping xətası:', scrapeError);
      return NextResponse.json(
        { error: 'BrightData scraping xətası', details: scrapeError instanceof Error ? scrapeError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!brightDataResult || Object.keys(brightDataResult).length === 0) {
      console.log('⚠️ BrightData boş nəticə qaytardı');
      console.log('🔍 API Response Debug:', rawApiResponse);
      return NextResponse.json(
        { error: 'BrightData-dan məlumat alınmadı', debug: rawApiResponse },
        { status: 400 }
      );
    }

    // Transform data to CV format
    console.log('🔄 Starting CV data transformation...');
    const transformedData = transformBrightDataToCV(brightDataResult, normalizedUrl);
    console.log('✅ CV data transformation completed');
    console.log('📊 Transformed data structure check:');
    console.log('- personalInfo exists:', !!transformedData.personalInfo);
    console.log('- experience count:', transformedData.experience?.length || 0);
    console.log('- education count:', transformedData.education?.length || 0);

    // Generate import statistics
    const importStats: ImportStats = {
      personalInfoCount: transformedData.personalInfo ? 1 : 0,
      experienceCount: transformedData.experience?.length || 0,
      educationCount: transformedData.education?.length || 0,
      skillsCount: transformedData.skills?.length || 0,
      projectsCount: transformedData.projects?.length || 0,
      certificationsCount: transformedData.certifications?.length || 0,
      awardsCount: transformedData.awards?.length || 0,
      languagesCount: transformedData.languages?.length || 0,
      volunteerExperienceCount: transformedData.volunteerExperience?.length || 0,
      dataSource: 'brightdata'
    };

    console.log('📊 Import statistikaları:', importStats);

    // Generate CV name - BrightData actual field names
    const firstName = brightDataResult.first_name?.trim();
    const lastName = brightDataResult.last_name?.trim();
    const name = brightDataResult.name?.trim();
    
    let cvName = name || 
                   (firstName && lastName ? `${firstName} ${lastName}` : '') || 
                   (firstName ? firstName : '') ||
                   'BrightData LinkedIn CV';

    console.log('🏷️ CV name parts:', { name, firstName, lastName, final: cvName });

    console.log(`📝 CV yaradılır: "${cvName}" - Provider: BrightData`);
    console.log('👤 User ID:', decoded.userId);
    console.log('📊 Transformed data keys:', Object.keys(transformedData));
    console.log('📊 CV data size:', JSON.stringify(transformedData).length, 'characters');

    // Validate required data before saving
    if (!cvName || cvName.trim() === '') {
      console.error('❌ CV name is empty, using fallback');
      cvName = 'BrightData LinkedIn CV - ' + new Date().toISOString().split('T')[0];
    }

    if (!decoded.userId) {
      console.error('❌ User ID is missing');
      return NextResponse.json(
        { error: 'User ID məlumat tapılmadı' },
        { status: 400 }
      );
    }

    // Save CV to database with detailed logging
    let newCV;
    try {
      console.log('💾 CV database-ə yazmağa hazırlıq:');
      console.log('- CV Title:', cvName);
      console.log('- User ID:', decoded.userId);
      console.log('- Transformed data present:', !!transformedData);
      console.log('- Transformed data keys:', Object.keys(transformedData || {}));
      console.log('- PersonalInfo present:', !!transformedData?.personalInfo);
      console.log('- Experience count:', transformedData?.experience?.length || 0);
      console.log('- Education count:', transformedData?.education?.length || 0);
      
      newCV = await prisma.cV.create({
        data: {
          title: cvName,
          userId: decoded.userId,
          cv_data: transformedData,
          templateId: 'template1',
          cvLanguage: 'az'
        }
      });
      
      console.log('✅ CV uğurla yaradıldı - ID:', newCV.id);
      console.log('📝 CV məlumatları:', { 
        title: newCV.title, 
        userId: newCV.userId, 
        templateId: newCV.templateId,
        cvDataPresent: !!newCV.cv_data,
        cvDataKeys: Object.keys(newCV.cv_data || {})
      });
      
      // CV data-nın DB-də düzgün saxlanıb saxlanmadığını yoxla
      if (newCV.cv_data) {
        const cvData = newCV.cv_data as any;
        console.log('📋 Database-də saxlanan CV məlumatları:');
        console.log('- PersonalInfo in DB:', !!cvData.personalInfo);
        console.log('- Experience count in DB:', (cvData.experience || []).length);
        console.log('- Education count in DB:', (cvData.education || []).length);
        console.log('- PersonalInfo fullName in DB:', cvData.personalInfo?.fullName);
      }
      
    } catch (dbError) {
      console.error('❌ Database CV yaratma xətası:', dbError);
      return NextResponse.json(
        { error: 'CV məlumatı bazada saxlanılmadı', details: dbError instanceof Error ? dbError.message : 'Database error' },
        { status: 500 }
      );
    }

    console.log('✅ BrightData LinkedIn import tamamlandı:', newCV.id);
    console.log('📋 Final CV details:', {
      id: newCV.id,
      title: newCV.title,
      userId: newCV.userId,
      templateId: newCV.templateId,
      cvLanguage: newCV.cvLanguage,
      createdAt: newCV.createdAt
    });

    return NextResponse.json({
      success: true,
      message: 'LinkedIn profili BrightData ilə uğurla import edildi',
      data: {
        cvId: newCV.id,
        cvTitle: cvName,
        provider: 'brightdata',
        stats: importStats,
        transformedData
      }
    });

  } catch (error) {
    console.error('❌ BrightData LinkedIn import xətası:', error);

    const errorMessage = error instanceof Error ? error.message : 'Naməlum xəta';
    
    return NextResponse.json(
      { 
        error: 'BrightData LinkedIn import xətası',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}