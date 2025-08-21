import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// RapidAPI LinkedIn Skills - paralel skills extraction
async function getRapidAPISkills(linkedinUrl: string) {
  const axios = require('axios');

  console.log(`🎯 RapidAPI skills extraction başladı: ${linkedinUrl}`);

  try {
    const options = {
      method: 'GET',
      url: 'https://linkedin-data-api.p.rapidapi.com/get-profile-data-by-url',
      params: {
        url: linkedinUrl
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'your-rapidapi-key',
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

// BrightData LinkedIn Import - optimizə edilmiş sürətli cavab
async function callBrightDataAPI(linkedinUrl: string) {
  const axios = require('axios');

  console.log(`🔄 BrightData LinkedIn scraping başladı (optimizə edilmiş): ${linkedinUrl}`);
  console.log(`⚡ Yalnız lazım olan məlumatlar üçün sürətli sorğu...`);

  try {
    // BrightData API konfigurasiyası
    const api_key = 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';
    const dataset_id = 'gd_l1viktl72bvl7bjuj0';

    console.log(`🔍 BrightData optimizə edilmiş request: ${linkedinUrl}`);
    console.log(`⚡ include_errors=false aktiv - sürətli cavab üçün`);

    // BrightData üçün düzgün request formatı
    const requestData = [{
      url: linkedinUrl
    }];

    // include_errors=false və format=json - sürətli cavab üçün
    const triggerUrl = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${dataset_id}&include_errors=false&format=json`;
    console.log(`📡 Trigger URL: ${triggerUrl}`);

    const response = await axios.post(
      triggerUrl,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000 // Azaldılmış timeout
      }
    );

    console.log('✅ BrightData sürətli trigger response:', response.data);

    if (response.status === 200 && response.data.snapshot_id) {
      const snapshotId = response.data.snapshot_id;
      console.log(`⚡ Snapshot yaradıldı (sürətli). Snapshot ID: ${snapshotId}`);

      // Optimizə edilmiş snapshot gözlə
      return await waitForBrightDataSnapshot(snapshotId, api_key);
    } else {
      console.log('Request failed with status code: ' + response.status);
      throw new Error(`BrightData API error: ${response.status}`);
    }

  } catch (error: any) {
    console.error('Error making the request: ' + error.message);
    throw new Error(`BrightData import uğursuz oldu: ${error.message}`);
  }
}

// BrightData snapshot cavabını gözlə - optimizə edilmiş
async function waitForBrightDataSnapshot(snapshotId: string, apiKey: string) {
  const axios = require('axios');
  let attempts = 0;
  const maxAttempts = 15; // Azaldılmış cəhd sayı
  const pollInterval = 8000; // 8 saniyə - daha sürətli yoxlama

  console.log(`⚡ BrightData snapshot sürətli cavab gözlənilir... Snapshot ID: ${snapshotId}`);

  while (attempts < maxAttempts) {
    try {
      const elapsedTime = Math.round((attempts * pollInterval) / 1000);
      console.log(`🔄 Sürətli snapshot yoxlama ${attempts + 1}/${maxAttempts} (${elapsedTime}s keçdi)...`);
      console.log(`⚡ include_errors=false aktiv - snapshot polling`);

      // include_errors=false və format=json - sürətli cavab
      const snapshotUrl = `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`;
      console.log(`📡 Snapshot URL: ${snapshotUrl}`);

      const response = await axios.get(
        snapshotUrl,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // Azaldılmış timeout
        }
      );

      console.log(`📊 Snapshot status: ${response.status}`);

      if (response.status === 200) {
        const data = response.data;

        if (data && Array.isArray(data) && data.length > 0) {
          const profileData = data[0];

          if (profileData && Object.keys(profileData).length > 0) {
            console.log('⚡ BrightData sürətli məlumat alındı!');
            console.log(`👤 Profile məlumatları hazır:`, {
              name: profileData.name || profileData.full_name,
              experience: profileData.experience?.length || 0,
              education: profileData.educations_details?.length || 0,
              skills: profileData.skills?.length || 0
            });

            return profileData;
          }
        }
      } else if (response.status === 202) {
        console.log('⏳ Snapshot işlənir (202)...');
      } else if (response.status === 404) {
        console.log('⏳ Snapshot hazırlanır (404)...');
      }

      console.log(`⏳ ${pollInterval / 1000}s gözləyirik (optimizə edilmiş)...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;

    } catch (error: any) {
      console.error(`❌ Snapshot xətası: ${error.message}`);

      if (error.response?.status === 404 || error.response?.status === 202) {
        console.log('⏳ Snapshot hələ hazırlanır...');
      }

      if (attempts === maxAttempts - 1) {
        throw new Error(`BrightData snapshot ${maxAttempts} cəhd sonra timeout`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }
  }

  throw new Error(`BrightData snapshot timeout: sürətli məlumat alınmadı`);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 LinkedIn import - BrightData + RapidAPI paralel');

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

    // Paralel olaraq BrightData və RapidAPI çağır
    console.log('📡 BrightData və RapidAPI paralel başlayır...');

    const [brightDataResponse, rapidApiResponse] = await Promise.allSettled([
      callBrightDataAPI(linkedinUrl),
      getRapidAPISkills(linkedinUrl)
    ]);

    // BrightData nəticəsini yoxla
    let brightDataResult = null;
    if (brightDataResponse.status === 'fulfilled' && brightDataResponse.value) {
      brightDataResult = brightDataResponse.value;
      console.log('✅ BrightData uğurludur!');
    } else {
      console.error('❌ BrightData xətası:', brightDataResponse.status === 'rejected' ? brightDataResponse.reason : 'No data');
      return NextResponse.json({
        success: false,
        error: `BrightData import uğursuz: ${brightDataResponse.status === 'rejected' ? brightDataResponse.reason.message : 'No data received'}`
      }, { status: 500 });
    }

    // RapidAPI nəticəsini yoxla (optional)
    let rapidApiResult = null;
    if (rapidApiResponse.status === 'fulfilled' && rapidApiResponse.value) {
      rapidApiResult = rapidApiResponse.value;
      console.log('✅ RapidAPI skills uğurludur!');
    } else {
      console.log('⚠️ RapidAPI skills alınmadı (optional):', rapidApiResponse.status === 'rejected' ? rapidApiResponse.reason : 'No data');
    }

    // BrightData məlumatlarını CV formatına çevir
    console.log('📍 BrightData məlumatları formatlanır...');
    const transformedData = transformBrightDataToCVFormat(brightDataResult);

    // RapidAPI skills-ləri əlavə et (əgər varsa)
    if (rapidApiResult) {
      console.log('🎯 RapidAPI skills birləşdirilir...');
      const rapidApiSkills = extractRapidAPISkills(rapidApiResult);
      if (rapidApiSkills.length > 0) {
        // Mövcud skills-lərlə birləşdir, duplikatları çıxar
        const existingSkills = transformedData.skills.map(s => s.name.toLowerCase());
        const newSkills = rapidApiSkills.filter(skill =>
          !existingSkills.includes(skill.name.toLowerCase())
        );
        transformedData.skills = [...transformedData.skills, ...newSkills];
        console.log(`✅ ${newSkills.length} yeni skill RapidAPI-dən əlavə edildi`);
      }
    }

    console.log('📋 Combined data preview:', {
      fullName: transformedData.personalInfo?.fullName,
      title: transformedData.personalInfo?.title,
      location: transformedData.personalInfo?.location,
      experienceCount: transformedData.experience?.length || 0,
      educationCount: transformedData.education?.length || 0,
      skillsCount: transformedData.skills?.length || 0,
      dataSource: 'brightdata + rapidapi'
    });

    // Ad-soyad yoxlanışı - mütləq şərt
    const fullName = transformedData.personalInfo?.fullName?.trim();
    const firstName = brightDataResult.first_name?.trim();
    const lastName = brightDataResult.last_name?.trim();
    const name = brightDataResult.name?.trim();

    // Müxtəlif ad formatlarını yoxla
    const hasValidName = fullName || name || (firstName && lastName);

    if (!hasValidName) {
      console.log('❌ Heç bir ad formatı tapılmadı:', {
        fullName,
        name,
        firstName,
        lastName
      });
      return NextResponse.json({
        success: false,
        error: 'Ad və soyad məlumatı tapılmadı. CV yaratmaq üçün ən azından ad-soyad lazımdır.'
      }, { status: 400 });
    }

    // Ən yaxşı adı seç
    const finalName = fullName || name || `${firstName} ${lastName}`.trim();
    console.log(`✅ Ad tapıldı: ${finalName}`);

    // Final adı yenidən təyin et
    if (!transformedData.personalInfo.fullName) {
      transformedData.personalInfo.fullName = finalName;
    }

    console.log('🎉 Bütün məlumatlar hazır:', {
      name: transformedData.personalInfo.fullName,
      experienceCount: transformedData.experience?.length || 0,
      educationCount: transformedData.education?.length || 0,
      skillsCount: transformedData.skills?.length || 0,
      languagesCount: transformedData.languages?.length || 0,
      certificationsCount: transformedData.certifications?.length || 0,
      projectsCount: transformedData.projects?.length || 0,
      volunteerCount: transformedData.volunteerExperience?.length || 0,
      dataSource: 'brightdata + rapidapi'
    });

    // CV yarad - bütün məlumatlarla
    console.log('💾 CV yaradılır (BrightData + RapidAPI)...');
    const cvData = {
      userId: decoded.userId,
      title: `${transformedData.personalInfo.fullName} - CV`,
      ...transformedData,
      templateId: 'basic' // İlk yaradılarkən basic template
    };

    const newCV = await prisma.cV.create({
      data: {
        userId: decoded.userId,
        title: cvData.title,
        cv_data: cvData,
        templateId: 'basic' // Database-də də basic template
      }
    });

    console.log('✅ CV uğurla yaradıldı (BrightData + RapidAPI):', newCV.id);

    return NextResponse.json({
      success: true,
      message: 'LinkedIn profili uğurla import edildi və CV yaradıldı (BrightData + RapidAPI)',
      cvId: newCV.id,
      profileData: {
        name: transformedData.personalInfo.fullName,
        headline: transformedData.personalInfo.title,
        location: transformedData.personalInfo.location,
        experienceCount: transformedData.experience?.length || 0,
        educationCount: transformedData.education?.length || 0,
        skillsCount: transformedData.skills?.length || 0,
        projectsCount: transformedData.projects?.length || 0,
        certificationsCount: transformedData.certifications?.length || 0,
        volunteerCount: transformedData.volunteerExperience?.length || 0,
        languagesCount: transformedData.languages?.length || 0,
        dataSource: 'brightdata + rapidapi'
      },
      transformedData: transformedData
    });

  } catch (error: any) {
    console.error('❌ LinkedIn import critical error:', error);

    return NextResponse.json({
      success: false,
      error: `LinkedIn import xətası: ${error.message}`
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// BrightData məlumatlarını CV formatına çevir
function transformBrightDataToCVFormat(rawData: any) {
  return {
    personalInfo: {
      fullName: rawData.name || rawData.full_name || '',
      title: rawData.headline || rawData.position || '',
      email: rawData.email || '',
      phone: rawData.phone || '',
      location: rawData.location || rawData.geo_location || rawData.city || '',
      linkedin: rawData.url || rawData.input_url || '',
      summary: rawData.summary || rawData.about || ''
    },
    experience: formatExperience(rawData.experience || []),
    education: formatEducation(rawData.educations_details || rawData.education || []),
    skills: formatSkills(rawData.skills || []),
    languages: formatLanguages(rawData.languages || []),
    certifications: [
      ...formatCertifications(rawData.certifications || []),
      ...formatCertifications(rawData.honors_and_awards || [])
    ],
    volunteerExperience: formatVolunteerExperience(rawData.volunteering || rawData.volunteer_experience || []),
    projects: formatProjects(rawData.projects || []),
    importSource: 'brightdata',
    importDate: new Date().toISOString()
  };
}

// Format functions for BrightData data
function formatExperience(experiences: any[]) {
  if (!Array.isArray(experiences)) return [];
  return experiences.map((exp, index) => ({
    id: `exp-brightdata-${Date.now()}-${index}`,
    position: exp.title || exp.position || '',
    company: exp.company || exp.company_name || '',
    location: exp.location || '',
    startDate: formatDate(exp.start_date || exp.startDate),
    endDate: formatDate(exp.end_date || exp.endDate),
    current: exp.current || exp.is_current || false,
    description: exp.description || ''
  })).filter(exp => exp.position || exp.company);
}

function formatEducation(education: any[]) {
  if (!Array.isArray(education)) return [];
  return education.map((edu, index) => ({
    id: `edu-brightdata-${Date.now()}-${index}`,
    degree: edu.degree || '',
    institution: edu.school || edu.institution || edu.university || '',
    field: edu.field || edu.field_of_study || '',
    startDate: formatDate(edu.start_date || edu.startDate),
    endDate: formatDate(edu.end_date || edu.endDate),
    current: edu.current || false,
    gpa: edu.gpa || ''
  })).filter(edu => edu.degree || edu.institution);
}

function formatSkills(skills: any[]) {
  if (!Array.isArray(skills)) return [];
  return skills.map((skill, index) => ({
    id: `skill-brightdata-${Date.now()}-${index}`,
    name: typeof skill === 'string' ? skill : (skill.name || skill.skill || ''),
    level: skill.level || ''
  })).filter(skill => skill.name);
}

function formatLanguages(languages: any[]) {
  if (!Array.isArray(languages)) return [];
  return languages.map((lang, index) => ({
    id: `lang-brightdata-${Date.now()}-${index}`,
    language: typeof lang === 'string' ? lang : (lang.name || lang.language || ''),
    proficiency: lang.proficiency || lang.level || ''
  })).filter(lang => lang.language);
}

function formatCertifications(certifications: any[]) {
  if (!Array.isArray(certifications)) return [];
  return certifications.map((cert, index) => ({
    id: `cert-brightdata-${Date.now()}-${index}`,
    name: cert.name || cert.title || '',
    issuer: cert.issuer || cert.organization || '',
    date: formatDate(cert.date || cert.issue_date),
    url: cert.url || ''
  })).filter(cert => cert.name);
}

function formatVolunteerExperience(volunteer: any[]) {
  if (!Array.isArray(volunteer)) return [];
  return volunteer.map((vol, index) => ({
    id: `vol-brightdata-${Date.now()}-${index}`,
    role: vol.role || vol.title || '',
    organization: vol.organization || vol.company || '',
    cause: vol.cause || '',
    startDate: formatDate(vol.start_date || vol.startDate),
    endDate: formatDate(vol.end_date || vol.endDate),
    current: vol.current || false,
    description: vol.description || ''
  })).filter(vol => vol.role || vol.organization);
}

function formatProjects(projects: any[]) {
  if (!Array.isArray(projects)) return [];
  return projects.map((project, index) => ({
    id: `proj-brightdata-${Date.now()}-${index}`,
    name: project.name || project.title || '',
    description: project.description || '',
    url: project.url || project.link || '',
    startDate: formatDate(project.start_date || project.startDate),
    endDate: formatDate(project.end_date || project.endDate),
    technologies: project.technologies || project.skills || []
  })).filter(project => project.name);
}

function formatDate(dateInput: any): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') return dateInput;
  if (typeof dateInput === 'object' && dateInput.year) {
    const month = dateInput.month ? String(dateInput.month).padStart(2, '0') : '01';
    return `${dateInput.year}-${month}`;
  }
  return String(dateInput);
}

// RapidAPI skills-ləri extract et
function extractRapidAPISkills(rapidApiData: any) {
  if (!rapidApiData) return [];

  try {
    // RapidAPI-dən skills-ləri çıxar
    const skills = rapidApiData.skills || rapidApiData.data?.skills || [];

    if (!Array.isArray(skills)) return [];

    return skills.map((skill, index) => ({
      id: `skill-rapidapi-${Date.now()}-${index}`,
      name: typeof skill === 'string' ? skill : (skill.name || skill.skill || ''),
      level: skill.level || skill.proficiency || ''
    })).filter(skill => skill.name && skill.name.trim().length > 0);

  } catch (error) {
    console.error('❌ RapidAPI skills extract xətası:', error);
    return [];
  }
}
