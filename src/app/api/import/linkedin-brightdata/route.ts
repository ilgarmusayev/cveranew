import { NextRequest, NextResponse } from 'next/server';
import { BrightDataLinkedInService } from '@/lib/services/brightdata-linkedin';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getBestApiKey, recordApiUsage, markApiKeyFailed } from '@/lib/api-service';
import { GeminiV1Client } from '@/lib/gemini-v1-client';

// Gemini AI for skill generation
const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Generate AI-suggested skills for BrightData LinkedIn import
async function generateBrightDataAISkills(profileData: any, existingSkills: any[]) {
  try {
    console.log('🤖 AI skills yaradılır BrightData import üçün...');

    const existingSkillNames = existingSkills.map(skill => 
      typeof skill === 'string' ? skill : skill.name
    ).filter(Boolean);

    const prompt = `
    BrightData LinkedIn Profil Analizi və Bacarıq Təklifləri
    =======================================================
    
    Aşağıdakı BrightData LinkedIn profil məlumatlarını ƏTRAFLY analiz edərək DƏQIQ 3 hard skill və 3 soft skill təklif et:

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

    // Get API key info for v1 API usage
    const apiKeyInfo = await getBestApiKey('gemini');
    const apiKey = apiKeyInfo?.apiKey;
    const apiKeyId = apiKeyInfo?.id;
    
    if (!apiKey) {
      throw new Error('No valid API key available');
    }
    
    let aiResponse = '';
    
    try {
      console.log('🔄 BrightData AI skills çağırışı v1 API ilə...');
      
      // Use v1 API with gemini-2.5-flash model (sərfəli və sürətli)
      const geminiV1 = new GeminiV1Client(apiKey);
      aiResponse = await geminiV1.generateContent('gemini-2.5-flash', prompt);
      
      // Record successful API usage
      if (apiKeyId) {
        await recordApiUsage(apiKeyId, true, 'BrightData AI skills generated (v1 gemini-2.5-flash)');
      }
      
      console.log('✅ BrightData AI skills generated successfully with v1 API');
    } catch (error: any) {
      console.log(`❌ Gemini v1 API failed:`, error.message);
      
      // Fallback to v1 API with gemini-2.0-flash
      try {
        console.log('🔄 Trying fallback to gemini-2.0-flash...');
        const geminiV1Fallback = new GeminiV1Client(apiKey);
        aiResponse = await geminiV1Fallback.generateContent('gemini-2.0-flash', prompt);
        
        // Record successful API usage
        if (apiKeyId) {
          await recordApiUsage(apiKeyId, true, 'BrightData AI skills generated (v1 gemini-2.0-flash fallback)');
        }
        
        console.log('✅ BrightData AI skills generated with fallback gemini-2.0-flash');
      } catch (fallbackError: any) {
        console.log(`❌ All Gemini v1 attempts failed:`, fallbackError.message);
        
        // Record API failure
        if (apiKeyId) {
          await markApiKeyFailed(apiKeyId, fallbackError.message);
        }
        
        throw fallbackError; // Re-throw the final error
      }
    }

    try {
      console.log('🔍 BrightData AI Skills Response:', aiResponse);

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
          id: `ai-hard-skill-brightdata-${Date.now()}-${index}`,
          name: skill.name,
          level: skill.level,
          type: 'hard',
          source: 'ai-brightdata'
        })),
        ...aiSkills.softSkills.map((skill: any, index: number) => ({
          id: `ai-soft-skill-brightdata-${Date.now()}-${index}`,
          name: skill.name,
          level: skill.level,
          type: 'soft',
          source: 'ai-brightdata'
        }))
      ];

      console.log(`✅ BrightData AI tərəfindən ${formattedSkills.length} skill yaradıldı:`, 
        formattedSkills.map(s => `${s.name} (${s.type})`));

      return formattedSkills;
      
    } catch (error: any) {
      console.error('❌ BrightData AI skills yaradılması xətası:', error.message);
      console.log('🔄 AI uğursuz oldu, fallback skills yaradılır...');
      return generateBrightDataFallbackSkills(profileData, existingSkillNames);
    }

  } catch (error) {
    console.error('❌ BrightData AI skills yaradılması ümumi xətası:', error);
    return generateBrightDataFallbackSkills(profileData, existingSkills.map(s => typeof s === 'string' ? s : s.name));
  }
}

// Fallback skills generation when AI fails for BrightData
function generateBrightDataFallbackSkills(profileData: any, existingSkillNames: string[]) {
  console.log('🔄 BrightData Fallback AI skills yaradılır...');
  
  const title = profileData.personalInfo?.title?.toLowerCase() || '';
  const summary = profileData.personalInfo?.summary?.toLowerCase() || '';
  const experience = profileData.experience || [];
  
  // Combine text for analysis
  const experienceText = experience.map((e: any) => 
    `${e.position || ''} ${e.company || ''} ${e.description || ''}`
  ).join(' ').toLowerCase();
  
  const allText = `${title} ${summary} ${experienceText}`;
  
  // Technology skills
  const techSkills = [
    'Microsoft Office', 'Excel', 'PowerPoint', 'Google Workspace', 'Data Analysis',
    'Project Management', 'Communication', 'Leadership', 'Problem Solving', 'Teamwork'
  ];
  
  const relevantSkills = techSkills.filter(skill => 
    !existingSkillNames.some(existing => 
      existing.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  return relevantSkills.slice(0, 6).map((skill, index) => ({
    id: `fallback-skill-brightdata-${Date.now()}-${index}`,
    name: skill,
    level: index < 3 ? 'Orta' : 'Başlanğıc',
    type: index < 3 ? 'hard' : 'soft',
    source: 'fallback-brightdata'
  }));
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 REAL BrightData LinkedIn Import API çağırıldı');

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

    // Initialize REAL BrightData service
    const brightDataService = new BrightDataLinkedInService();

    // Call REAL BrightData API
    console.log('📡 REAL BrightData API call başlayır...');
    let realProfileData;
    
    try {
      realProfileData = await brightDataService.scrapeLinkedInProfile(normalizedUrl);
      console.log('✅ REAL API call tamamlandı');
      console.log('📊 REAL data keys:', Object.keys(realProfileData || {}));
      console.log('📊 REAL data preview:', {
        name: realProfileData?.name,
        first_name: realProfileData?.first_name,
        last_name: realProfileData?.last_name,
        position: realProfileData?.position,
        about: realProfileData?.about,
        experience_count: realProfileData?.experience?.length || 0,
        education_count: realProfileData?.education?.length || 0
      });
      
    } catch (apiError) {
      console.error('❌ REAL BrightData API xətası:', apiError);
      return NextResponse.json(
        { error: 'REAL BrightData API xətası', details: apiError instanceof Error ? apiError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!realProfileData || Object.keys(realProfileData).length === 0) {
      console.log('⚠️ REAL BrightData API boş cavab qaytardı');
      return NextResponse.json(
        { error: 'REAL BrightData API-dən məlumat alınmadı' },
        { status: 400 }
      );
    }

    // Generate CV name from REAL data
    const firstName = realProfileData.first_name?.trim();
    const lastName = realProfileData.last_name?.trim();
    const name = realProfileData.name?.trim();
    
    let cvName = name || 
                 (firstName && lastName ? `${firstName} ${lastName}` : '') || 
                 (firstName ? firstName : '') ||
                 'BrightData LinkedIn CV';

    console.log('🏷️ REAL CV name from API data:', { name, firstName, lastName, final: cvName });

    console.log('🔍 REAL BrightData profile data strukturu:', {
      mainFields: Object.keys(realProfileData),
      hasVolunteerExperience: !!(realProfileData.volunteer_experience || realProfileData.volunteering || realProfileData.volunteer),
      hasProjects: !!(realProfileData.projects || realProfileData.featured),
      hasAwards: !!(realProfileData.awards || realProfileData.honors_awards),
      hasHonors: !!(realProfileData.honors || realProfileData.honors_awards),
      volunteerFields: realProfileData.volunteer_experience ? Object.keys(realProfileData.volunteer_experience[0] || {}) : [],
      projectFields: realProfileData.projects ? Object.keys(realProfileData.projects[0] || {}) : []
    });

    // Transform REAL data to CV format (minimal transformation to preserve data)
    const cvData = {
      personalInfo: {
        fullName: cvName,
        firstName: firstName || '',
        lastName: lastName || '',
        title: realProfileData.position || realProfileData.headline || '',
        field: realProfileData.position || realProfileData.headline || '',
        email: '',
        phone: '',
        location: realProfileData.location || realProfileData.city || '',
        website: '',
        linkedin: normalizedUrl,
        summary: realProfileData.about || realProfileData.summary || '',
        profilePicture: realProfileData.avatar || realProfileData.profile_pic_url || ''
      },
      experience: (realProfileData.experience || []).map((exp: any, index: number) => ({
        id: `exp-real-${Date.now()}-${index}`,
        position: exp.title || exp.position || '',
        company: exp.company || exp.company_name || '',
        startDate: exp.start_date || exp.startDate || '',
        endDate: exp.end_date || exp.endDate || '',
        current: (!exp.end_date || exp.end_date === 'Present') || false,
        description: exp.description || exp.description_html || '',
        location: exp.location || ''
      })),
      education: (realProfileData.education || []).map((edu: any, index: number) => ({
        id: `edu-real-${Date.now()}-${index}`,
        institution: edu.school || edu.title || edu.institution || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.field_of_study || edu.field || '',
        startDate: edu.start_year || edu.start_date || '',
        endDate: edu.end_year || edu.end_date || '',
        description: edu.description || ''
      })),
      skills: (realProfileData.skills || []).map((skill: any, index: number) => ({
        id: `skill-real-${Date.now()}-${index}`,
        name: typeof skill === 'string' ? skill : (skill.name || skill.skill || ''),
        level: typeof skill === 'object' ? (skill.level || '') : ''
      })),
      languages: (realProfileData.languages || []).map((lang: any, index: number) => ({
        id: `lang-real-${Date.now()}-${index}`,
        language: typeof lang === 'string' ? lang : (lang.title || lang.name || ''),
        level: typeof lang === 'object' ? (lang.subtitle || lang.level || 'Orta') : 'Orta'
      })),
      certifications: (realProfileData.certifications || []).map((cert: any, index: number) => ({
        id: `cert-real-${Date.now()}-${index}`,
        name: cert.title || cert.name || '',
        issuer: cert.subtitle || cert.issuer || '',
        issueDate: cert.date || cert.issueDate || '',
        credentialId: cert.credential_id || '',
        url: cert.credential_url || ''
      })),
      projects: (realProfileData.projects || realProfileData.featured || []).map((proj: any, index: number) => ({
        id: `proj-real-${Date.now()}-${index}`,
        name: proj.title || proj.name || '',
        description: proj.description || proj.summary || '',
        technologies: proj.technologies || proj.skills || [],
        url: proj.url || proj.link || '',
        startDate: proj.start_date || proj.startDate || '',
        endDate: proj.end_date || proj.endDate || '',
        current: (!proj.end_date || proj.end_date === 'Present') || false
      })),
      awards: (realProfileData.awards || realProfileData.honors_awards || []).map((award: any, index: number) => ({
        id: `award-real-${Date.now()}-${index}`,
        title: award.title || award.name || '',
        issuer: award.issuer || award.organization || award.subtitle || '',
        date: award.date || award.issued_date || '',
        description: award.description || award.summary || ''
      })),
      honors: (realProfileData.honors || realProfileData.honors_awards || []).map((honor: any, index: number) => ({
        id: `honor-real-${Date.now()}-${index}`,
        title: honor.title || honor.name || '',
        issuer: honor.issuer || honor.organization || honor.subtitle || '',
        date: honor.date || honor.issued_date || '',
        description: honor.description || honor.summary || ''
      })),
      volunteerExperience: (realProfileData.volunteer_experience || realProfileData.volunteering || realProfileData.volunteer || []).map((vol: any, index: number) => ({
        id: `vol-real-${Date.now()}-${index}`,
        organization: vol.organization || vol.company || vol.institution || vol.title || '',
        role: vol.position || vol.role || vol.subtitle || vol.description || '',
        cause: vol.cause || vol.area || vol.field || vol.category || '',
        startDate: vol.start_date || vol.startDate || vol.date || '',
        endDate: vol.end_date || vol.endDate || '',
        current: (!vol.end_date || vol.end_date === 'Present' || vol.current) || false,
        description: vol.description || vol.summary || vol.details || '',
        duration: vol.duration || vol.time_period || ''
      }))
    };

    // Generate AI skills for BrightData import
    console.log('🤖 BrightData üçün AI skills yaradılır...');
    try {
      const aiSkills = await generateBrightDataAISkills(cvData, cvData.skills);
      
      // Add AI skills to existing skills
      cvData.skills = [...cvData.skills, ...aiSkills];
      
      console.log(`✅ BrightData AI tərəfindən ${aiSkills.length} əlavə skill əlavə edildi`);
    } catch (aiError) {
      console.error('❌ BrightData AI skills xətası:', aiError);
      console.log('🔄 AI skills olmadan davam edilir...');
    }

    console.log('📊 REAL CV data preview:', {
      personalInfo: cvData.personalInfo.fullName,
      experienceCount: cvData.experience.length,
      educationCount: cvData.education.length,
      skillsCount: cvData.skills.length,
      languagesCount: cvData.languages.length,
      certificationsCount: cvData.certifications.length,
      projectsCount: cvData.projects.length,
      awardsCount: cvData.awards.length,
      honorsCount: cvData.honors.length,
      volunteerExperienceCount: cvData.volunteerExperience.length
    });

    // Save REAL CV to database
    console.log(`📝 REAL CV yaradılır: "${cvName}" - Real BrightData data`);
    console.log('👤 User ID:', decoded.userId);

    let newCV;
    try {
      newCV = await prisma.cV.create({
        data: {
          title: cvName,
          userId: decoded.userId,
          cv_data: cvData,
          templateId: 'template1',
          cvLanguage: 'az'
        }
      });
      
      console.log('✅ REAL CV uğurla yaradıldı - ID:', newCV.id);
      console.log('📋 REAL CV məlumatları:', { 
        title: newCV.title, 
        userId: newCV.userId,
        hasPersonalInfo: !!(newCV.cv_data as any)?.personalInfo,
        fullNameInDB: (newCV.cv_data as any)?.personalInfo?.fullName
      });
      
    } catch (dbError) {
      console.error('❌ Database CV yaratma xətası:', dbError);
      return NextResponse.json(
        { error: 'REAL CV məlumatı bazada saxlanılmadı', details: dbError instanceof Error ? dbError.message : 'Database error' },
        { status: 500 }
      );
    }

    console.log('✅ REAL BrightData LinkedIn import tamamlandı:', newCV.id);

    return NextResponse.json({
      success: true,
      message: 'LinkedIn profili REAL BrightData API ilə uğurla import edildi',
      data: {
        cvId: newCV.id,
        cvTitle: cvName,
        provider: 'brightdata-real',
        stats: {
          personalInfoCount: 1,
          experienceCount: cvData.experience.length,
          educationCount: cvData.education.length,
          skillsCount: cvData.skills.length,
          aiSkillsCount: cvData.skills.filter((s: any) => s.source?.includes('ai')).length,
          languagesCount: cvData.languages.length,
          certificationsCount: cvData.certifications.length,
          projectsCount: cvData.projects.length,
          awardsCount: cvData.awards.length,
          honorsCount: cvData.honors.length,
          volunteerExperienceCount: cvData.volunteerExperience.length,
          dataSource: 'brightdata-real'
        }
      }
    });

  } catch (error) {
    console.error('❌ REAL BrightData LinkedIn import xətası:', error);

    const errorMessage = error instanceof Error ? error.message : 'Naməlum xəta';
    
    return NextResponse.json(
      { 
        error: 'REAL BrightData LinkedIn import xətası',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}