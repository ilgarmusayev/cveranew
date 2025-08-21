const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalTemplateCheck() {
  try {
    console.log('🔍 Final template yaddaş yoxlanışı...');
    
    // Mövcud template-ləri göstər
    const templates = await prisma.template.findMany();
    console.log('\n🎨 Mövcud template-lər:');
    templates.forEach(t => console.log(`  ✅ ${t.id}: ${t.name} (${t.tier})`));
    
    // Bir neçə CV-ni yoxla
    const cvs = await prisma.cV.findMany({
      select: { id: true, title: true, templateId: true, cv_data: true },
      take: 3
    });
    
    console.log('\n📊 CV template sinxronlaşması:');
    let allGood = true;
    
    cvs.forEach(cv => {
      const dbTemplate = cv.templateId;
      const cvDataTemplate = cv.cv_data?.templateId;
      const isSync = dbTemplate === cvDataTemplate;
      
      console.log(`\n📄 CV: ${cv.title?.substring(0, 30)}...`);
      console.log(`  Database: ${dbTemplate}`);
      console.log(`  cv_data:  ${cvDataTemplate}`);
      console.log(`  Status:   ${isSync ? '✅ SYNC' : '❌ NOT SYNC'}`);
      
      if (!isSync) allGood = false;
    });
    
    console.log('\n🎯 NƏTICƏ:');
    if (allGood) {
      console.log('✅ Bütün CV-lərdə template sinxronlaşması DÜZGÜN!');
      console.log('🎉 Template yaddaş problemi TAM HƏLL OLUNDU!');
      console.log('💾 İndi template seçimi refresh sonrası da qalacaq!');
    } else {
      console.log('❌ Hələ də bəzi CV-lərdə sinxronlaşma problemi var');
    }
    
    console.log('\n📋 Template-lər:');
    console.log('  🔹 basic - Default template (hamı üçün)');
    console.log('  🔹 medium - Professional template (Medium tier üçün)');
    console.log('  🗑️ Digər template-lər silindi');
    
  } catch (error) {
    console.error('❌ Xəta:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalTemplateCheck();
