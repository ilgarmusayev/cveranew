const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function checkLinkedInDataMapping() {
  try {
    console.log('🔍 LinkedIn Data Mapping Yoxlanılır...');
    
    // Get API key
    const scrapingDogKey = await prisma.apiKey.findFirst({
      where: {
        service: 'scrapingdog',
        active: true
      }
    });
    
    if (!scrapingDogKey) {
      console.error('❌ No ScrapingDog API key found');
      return;
    }
    
    // Get your LinkedIn data
    const response = await axios.get('https://api.scrapingdog.com/linkedin', {
      params: {
        api_key: scrapingDogKey.apiKey,
        type: 'profile',
        linkId: 'musayevcreate',
        premium: 'false'
      },
      timeout: 30000
    });
    
    const data = response.data;
    console.log('📊 LinkedIn Data Structure Analysis:');
    
    if (Array.isArray(data) && data.length > 0) {
      const profile = data[0];
      
      console.log('\n🔍 Əsas məlumatlar:');
      console.log('- Full Name:', profile.fullName || profile.name);
      console.log('- First Name:', profile.first_name);
      console.log('- Last Name:', profile.last_name);
      console.log('- Headline:', profile.headline);
      console.log('- Location:', profile.location);
      console.log('- About:', profile.about?.substring(0, 100) + '...');
      console.log('- Profile Photo:', profile.profile_photo ? 'Var' : 'Yox');
      console.log('- Background Image:', profile.background_cover_image_url ? 'Var' : 'Yox');
      
      console.log('\n💼 İş təcrübəsi:');
      if (profile.experience && Array.isArray(profile.experience)) {
        console.log(`- Təcrübə sayı: ${profile.experience.length}`);
        profile.experience.forEach((exp, index) => {
          console.log(`  ${index + 1}. ${exp.position || exp.title} @ ${exp.company || exp.company_name}`);
          console.log(`     Tarix: ${exp.starts_at || exp.startDate} - ${exp.ends_at || exp.endDate || 'Present'}`);
          console.log(`     Yer: ${exp.location || 'N/A'}`);
          console.log(`     Təsvir: ${exp.summary?.substring(0, 100) || 'N/A'}...`);
        });
      } else {
        console.log('- Təcrübə məlumatı yox');
      }
      
      console.log('\n🎓 Təhsil:');
      if (profile.education && Array.isArray(profile.education)) {
        console.log(`- Təhsil sayı: ${profile.education.length}`);
        profile.education.forEach((edu, index) => {
          console.log(`  ${index + 1}. ${edu.college_degree || edu.degree} @ ${edu.college_name || edu.school}`);
          console.log(`     Sahə: ${edu.college_degree_field || edu.field || 'N/A'}`);
          console.log(`     Müddət: ${edu.college_duration || edu.duration || 'N/A'}`);
        });
      } else {
        console.log('- Təhsil məlumatı yox');
      }
      
      console.log('\n🏆 Layihələr:');
      if (profile.projects && Array.isArray(profile.projects)) {
        console.log(`- Layihə sayı: ${profile.projects.length}`);
        profile.projects.forEach((proj, index) => {
          console.log(`  ${index + 1}. ${proj.title || proj.name}`);
          console.log(`     Link: ${proj.link || proj.url || 'N/A'}`);
          console.log(`     Müddət: ${proj.duration || 'N/A'}`);
        });
      } else {
        console.log('- Layihə məlumatı yox');
      }
      
      console.log('\n🥇 Mükafatlar:');
      if (profile.awards && Array.isArray(profile.awards)) {
        console.log(`- Mükafat sayı: ${profile.awards.length}`);
        profile.awards.forEach((award, index) => {
          console.log(`  ${index + 1}. ${award.name || award.title}`);
          console.log(`     Təşkilat: ${award.organization || award.issuer || 'N/A'}`);
          console.log(`     Tarix: ${award.duration || award.date || 'N/A'}`);
        });
      } else {
        console.log('- Mükafat məlumatı yox');
      }
      
      console.log('\n🗣️ Dillər:');
      if (profile.languages && Array.isArray(profile.languages)) {
        console.log(`- Dil sayı: ${profile.languages.length}`);
        profile.languages.forEach((lang, index) => {
          console.log(`  ${index + 1}. ${typeof lang === 'string' ? lang : lang.name || lang.language}`);
        });
      } else {
        console.log('- Dil məlumatı yox');
      }
      
      console.log('\n💡 Fəaliyyətlər:');
      if (profile.activities && Array.isArray(profile.activities)) {
        console.log(`- Fəaliyyət sayı: ${profile.activities.length}`);
        console.log('- Son 3 fəaliyyət:');
        profile.activities.slice(0, 3).forEach((activity, index) => {
          console.log(`  ${index + 1}. ${activity.title?.substring(0, 80)}...`);
          console.log(`     Tip: ${activity.activity || 'N/A'}`);
        });
      } else {
        console.log('- Fəaliyyət məlumatı yox');
      }
      
      console.log('\n📋 Bütün mövcud sahələr:');
      console.log(Object.keys(profile).join(', '));
      
    } else {
      console.log('❌ Data array formatında deyil və ya boşdur');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLinkedInDataMapping();
