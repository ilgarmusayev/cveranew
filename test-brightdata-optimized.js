const BrightDataLinkedInScraper = require('./brightdata-linkedin-scraper');

/**
 * BrightData LinkedIn Test - Optimized for CV Data
 * Bu test yalnız CV üçün lazım olan məlumatları alır
 */

// BrightData API key - .env faylınızda BRIGHTDATA_API_KEY kimi əlavə edin
const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY || 'your-brightdata-api-key-here';

async function testOptimizedLinkedInScraping() {
  console.log('🚀 BrightData LinkedIn Scraper Test');
  console.log('====================================');

  const scraper = new BrightDataLinkedInScraper(BRIGHTDATA_API_KEY);

  try {
    // İlk öncə account statusunu yoxlayaq
    console.log('📊 Account status yoxlanılır...');
    const accountStats = await scraper.getAccountStats();

    if (accountStats) {
      console.log('Account Info:');
      console.log(`- İstifadə edilən: ${accountStats.requests_used}`);
      console.log(`- Limit: ${accountStats.requests_limit}`);
      console.log(`- Qalan: ${accountStats.remaining_requests}`);
      console.log('');
    }

    // Optimized scraping options - yalnız CV üçün lazım olan data
    const scrapingOptions = {
      includeSkills: true,        // Bacarıqlar (CV üçün vacib)
      includeExperience: true,    // İş təcrübəsi (CV üçün vacib)
      includeEducation: true,     // Təhsil (CV üçün vacib)
      includeSummary: true,       // Şəxsi məlumat (CV üçün vacib)
      includeLanguages: true,     // Dillər (CV üçün faydalı)
      includeCertifications: true, // Sertifikatlar (CV üçün faydalı)
      includeVolunteering: false, // Könüllü işlər (CV üçün az vacib)

      // Data limitləri - daha sürətli və ucuz
      maxExperiences: 5,          // Son 5 iş yeri
      maxEducation: 3,            // Son 3 təhsil
      maxSkills: 15               // Ən vacib 15 bacarıq
    };

    console.log('🔍 LinkedIn profili scrape edilir...');
    console.log('Konfigurasiya:');
    console.log(`- Maksimum iş təcrübəsi: ${scrapingOptions.maxExperiences}`);
    console.log(`- Maksimum təhsil: ${scrapingOptions.maxEducation}`);
    console.log(`- Maksimum bacarıq: ${scrapingOptions.maxSkills}`);
    console.log('');

    // Test 1: Username ilə
    const linkedinUsername = 'musayevcreate';
    console.log(`🔄 Test 1: Username (@${linkedinUsername}) ilə scraping...`);

    const profileData = await scraper.scrapeProfile(linkedinUsername, scrapingOptions);

    console.log('✅ Məlumatlar alındı!');
    console.log('===================');

    // Basic info
    if (profileData.basic_info) {
      console.log('👤 Əsas məlumatlar:');
      console.log(`   Ad: ${profileData.basic_info.name || 'N/A'}`);
      console.log(`   Başlıq: ${profileData.basic_info.headline || 'N/A'}`);
      console.log(`   Yer: ${profileData.basic_info.location || 'N/A'}`);
      console.log('');
    }

    // Summary
    if (profileData.summary) {
      console.log('📝 Haqqında:');
      console.log(`   ${profileData.summary.substring(0, 100)}...`);
      console.log('');
    }

    // Experience
    if (profileData.experience && profileData.experience.length > 0) {
      console.log('💼 İş təcrübəsi:');
      profileData.experience.forEach((exp, index) => {
        console.log(`   ${index + 1}. ${exp.title} - ${exp.company}`);
        console.log(`      Müddət: ${exp.duration || 'N/A'}`);
      });
      console.log('');
    }

    // Education
    if (profileData.education && profileData.education.length > 0) {
      console.log('🎓 Təhsil:');
      profileData.education.forEach((edu, index) => {
        console.log(`   ${index + 1}. ${edu.degree} - ${edu.school}`);
        if (edu.field_of_study) {
          console.log(`      Sahə: ${edu.field_of_study}`);
        }
      });
      console.log('');
    }

    // Skills
    if (profileData.skills && profileData.skills.length > 0) {
      console.log('🛠 Bacarıqlar:');
      console.log(`   ${profileData.skills.slice(0, 10).join(', ')}`);
      if (profileData.skills.length > 10) {
        console.log(`   ... və daha ${profileData.skills.length - 10} bacarıq`);
      }
      console.log('');
    }

    // Languages
    if (profileData.languages && profileData.languages.length > 0) {
      console.log('🌐 Dillər:');
      console.log(`   ${profileData.languages.join(', ')}`);
      console.log('');
    }

    // CV üçün hazır format
    console.log('📄 CV formatında məlumatlar:');
    console.log('============================');
    const cvData = formatForCV(profileData);
    console.log(JSON.stringify(cvData, null, 2));

    return profileData;

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);

    if (error.message.includes('authentication')) {
      console.log('💡 Həll yolu: .env faylında BRIGHTDATA_API_KEY düzgün qeyd edin');
    } else if (error.message.includes('quota')) {
      console.log('💡 Həll yolu: BrightData account limit bitib, yeni paket alın');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Həll yolu: Şəbəkə bağlantısını yoxlayın və yenidən cəhd edin');
    }

    throw error;
  }
}

/**
 * CV formatında məlumatları hazırla
 */
function formatForCV(profileData) {
  return {
    personal_info: {
      full_name: profileData.basic_info?.name,
      professional_title: profileData.basic_info?.headline,
      location: profileData.basic_info?.location,
      profile_image_url: profileData.basic_info?.profile_image
    },
    professional_summary: profileData.summary,
    work_experience: profileData.experience?.map(exp => ({
      position: exp.title,
      company: exp.company,
      duration: exp.duration,
      description: exp.description,
      is_current_position: exp.is_current
    })) || [],
    education: profileData.education?.map(edu => ({
      degree: edu.degree,
      institution: edu.school,
      field_of_study: edu.field_of_study,
      duration: edu.duration
    })) || [],
    skills: profileData.skills || [],
    languages: profileData.languages || [],
    certifications: profileData.certifications || [],
    metadata: {
      scraped_from: 'linkedin',
      scraped_at: profileData.scraping_metadata?.scraped_at,
      data_source: 'brightdata'
    }
  };
}

/**
 * Multiple profiles test
 */
async function testMultipleProfiles() {
  console.log('🔄 Multiple profiles test...');

  const profiles = [
    'musayevcreate',
    'https://linkedin.com/in/another-profile'
  ];

  const scraper = new BrightDataLinkedInScraper(BRIGHTDATA_API_KEY);
  const results = [];

  for (const profile of profiles) {
    try {
      console.log(`Scraping: ${profile}`);
      const data = await scraper.scrapeProfile(profile, {
        maxExperiences: 3, // Daha sürətli üçün az data
        maxEducation: 2,
        maxSkills: 10
      });
      results.push({ profile, data, status: 'success' });
    } catch (error) {
      results.push({ profile, error: error.message, status: 'failed' });
    }

    // Rate limiting üçün pause
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

// Test run
if (require.main === module) {
  testOptimizedLinkedInScraping()
    .then(() => {
      console.log('✅ Test tamamlandı!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test uğursuz oldu:', error.message);
      process.exit(1);
    });
}

module.exports = {
  testOptimizedLinkedInScraping,
  testMultipleProfiles,
  formatForCV
};
