const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLatestCV() {
  try {
    console.log('🔍 Ən son yaradılan CV məlumatları yoxlanılır...');
    
    // Get latest CV
    const latestCV = await prisma.cV.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        title: {
          contains: 'Nizamali' // Az əvvəl yaradılan CV
        }
      }
    });
    
    if (!latestCV) {
      console.error('❌ Heç bir CV tapılmadı');
      return;
    }
    
    console.log('✅ CV tapıldı:', latestCV.id);
    console.log('📋 CV başlığı:', latestCV.title);
    console.log('📅 Yaradılma tarixi:', latestCV.createdAt);
    
    const cvData = latestCV.cv_data;
    
    if (!cvData) {
      console.error('❌ CV data sahəsi boşdur');
      return;
    }
    
    console.log('\n📊 CV məlumatları analizi:');
    
    // Personal Info
    if (cvData.personalInfo) {
      console.log('\n👤 Şəxsi məlumatlar:');
      console.log('- Ad Soyad:', cvData.personalInfo.fullName);
      console.log('- Ad:', cvData.personalInfo.firstName);
      console.log('- Soyad:', cvData.personalInfo.lastName);
      console.log('- Başlıq:', cvData.personalInfo.title);
      console.log('- Email:', cvData.personalInfo.email || 'Yox');
      console.log('- Telefon:', cvData.personalInfo.phone || 'Yox');
      console.log('- Yer:', cvData.personalInfo.location);
      console.log('- LinkedIn:', cvData.personalInfo.linkedin);
      console.log('- Şəkil:', cvData.personalInfo.profilePicture ? 'Var' : 'Yox');
      console.log('- Xülasə:', cvData.personalInfo.summary ? cvData.personalInfo.summary.substring(0, 100) + '...' : 'Yox');
    }
    
    // Experience
    if (cvData.experience && Array.isArray(cvData.experience)) {
      console.log(`\n💼 İş təcrübəsi (${cvData.experience.length} məlumat):`);
      cvData.experience.forEach((exp, index) => {
        console.log(`  ${index + 1}. ${exp.position} @ ${exp.company}`);
        console.log(`     Tarix: ${exp.startDate} - ${exp.endDate || (exp.current ? 'Present' : 'N/A')}`);
        console.log(`     Yer: ${exp.location || 'N/A'}`);
        console.log(`     Təsvir: ${exp.description ? exp.description.substring(0, 100) + '...' : 'N/A'}`);
      });
    } else {
      console.log('\n💼 İş təcrübəsi: Yox və ya boş');
    }
    
    // Education
    if (cvData.education && Array.isArray(cvData.education)) {
      console.log(`\n🎓 Təhsil (${cvData.education.length} məlumat):`);
      cvData.education.forEach((edu, index) => {
        console.log(`  ${index + 1}. ${edu.degree} @ ${edu.institution}`);
        console.log(`     Sahə: ${edu.fieldOfStudy || 'N/A'}`);
        console.log(`     Tarix: ${edu.startDate} - ${edu.endDate || 'N/A'}`);
        console.log(`     Qiymət: ${edu.grade || 'N/A'}`);
      });
    } else {
      console.log('\n🎓 Təhsil: Yox və ya boş');
    }
    
    // Skills
    if (cvData.skills && Array.isArray(cvData.skills)) {
      console.log(`\n💡 Bacarıqlar (${cvData.skills.length} məlumat):`);
      cvData.skills.forEach((skill, index) => {
        console.log(`  ${index + 1}. ${skill.name} (${skill.level || 'No level'})`);
      });
    } else {
      console.log('\n💡 Bacarıqlar: Yox və ya boş');
    }
    
    // Projects
    if (cvData.projects && Array.isArray(cvData.projects)) {
      console.log(`\n🏆 Layihələr (${cvData.projects.length} məlumat):`);
      cvData.projects.forEach((proj, index) => {
        console.log(`  ${index + 1}. ${proj.name}`);
        console.log(`     URL: ${proj.url || 'N/A'}`);
        console.log(`     Təsvir: ${proj.description ? proj.description.substring(0, 100) + '...' : 'N/A'}`);
      });
    } else {
      console.log('\n🏆 Layihələr: Yox və ya boş');
    }
    
    // Awards
    if (cvData.awards && Array.isArray(cvData.awards)) {
      console.log(`\n🥇 Mükafatlar (${cvData.awards.length} məlumat):`);
      cvData.awards.forEach((award, index) => {
        console.log(`  ${index + 1}. ${award.name}`);
        console.log(`     Verən: ${award.issuer || 'N/A'}`);
        console.log(`     Tarix: ${award.date || 'N/A'}`);
      });
    } else {
      console.log('\n🥇 Mükafatlar: Yox və ya boş');
    }
    
    // Languages
    if (cvData.languages && Array.isArray(cvData.languages)) {
      console.log(`\n🗣️ Dillər (${cvData.languages.length} məlumat):`);
      cvData.languages.forEach((lang, index) => {
        console.log(`  ${index + 1}. ${lang.name} (${lang.proficiency || 'No level'})`);
      });
    } else {
      console.log('\n🗣️ Dillər: Yox və ya boş');
    }
    
    // Volunteering
    if (cvData.volunteering && Array.isArray(cvData.volunteering)) {
      console.log(`\n🤝 Könüllü işlər (${cvData.volunteering.length} məlumat):`);
      cvData.volunteering.forEach((vol, index) => {
        console.log(`  ${index + 1}. ${vol.role} @ ${vol.organization}`);
        console.log(`     Səbəb: ${vol.cause || 'N/A'}`);
        console.log(`     Tarix: ${vol.startDate} - ${vol.endDate || (vol.current ? 'Present' : 'N/A')}`);
      });
    } else {
      console.log('\n🤝 Könüllü işlər: Yox və ya boş');
    }
    
    console.log('\n✅ CV məlumatları analizi tamamlandı');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestCV();
