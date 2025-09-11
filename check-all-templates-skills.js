const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllTemplatesSkillsCompatibility() {
  try {
    console.log('🔍 SQL-də olan bütün template-lər və AI skills uyğunluğu yoxlanılır...\n');

    // 1. Bütün template-ləri əldə et
    const allTemplates = await prisma.template.findMany({
      orderBy: { id: 'asc' }
    });

    console.log(`📊 SQL-də ümumi template sayı: ${allTemplates.length}`);
    
    // 2. Aktiv template-lər
    const activeTemplates = allTemplates.filter(t => t.isActive);
    console.log(`✅ Aktiv template sayı: ${activeTemplates.length}`);
    
    // 3. Kategoriyalara ayır
    const categories = [...new Set(allTemplates.map(t => t.category))];
    console.log(`🎨 Template kategoriyaları: ${categories.join(', ')}\n`);

    // 4. Hər kategoriyada template-ləri göstər
    for (const category of categories) {
      const categoryTemplates = allTemplates.filter(t => t.category === category);
      const activeCategoryTemplates = categoryTemplates.filter(t => t.isActive);
      
      console.log(`📁 ${category.toUpperCase()} Kategoriyası (${categoryTemplates.length} template, ${activeCategoryTemplates.length} aktiv):`);
      
      categoryTemplates.forEach(template => {
        const status = template.isActive ? '✅' : '❌';
        console.log(`   ${status} ${template.name} (ID: ${template.id})`);
      });
      console.log('');
    }

    // 5. Skills-li CV-ləri yoxla
    console.log('🧠 Skills-li CV-lər analizi...');
    
    const skillsCvs = await prisma.cv.findMany({
      where: {
        skills: {
          not: null
        }
      },
      include: {
        user: {
          select: {
            fullName: true
          }
        }
      },
      take: 20
    });

    console.log(`📊 Skills-li CV sayı: ${skillsCvs.length}`);

    if (skillsCvs.length > 0) {
      // Template istifadə statistikası
      const templateUsage = skillsCvs.reduce((acc, cv) => {
        const templateId = cv.templateId;
        if (!acc[templateId]) {
          const template = allTemplates.find(t => t.id === templateId);
          acc[templateId] = {
            templateName: template?.name || 'Bilinmir',
            category: template?.category || 'Bilinmir',
            count: 0,
            totalSkills: 0
          };
        }
        acc[templateId].count++;
        acc[templateId].totalSkills += Array.isArray(cv.skills) ? cv.skills.length : 0;
        return acc;
      }, {});

      console.log('\n📈 Skills-li CV-lərdə template istifadə statistikası:');
      Object.entries(templateUsage).forEach(([templateId, usage]) => {
        const avgSkills = Math.round(usage.totalSkills / usage.count);
        console.log(`   🎨 ${usage.templateName} (${usage.category}): ${usage.count} CV, ortalama ${avgSkills} skills`);
      });

      // AI skills analizi
      const aiSkillsCvs = skillsCvs.filter(cv => 
        Array.isArray(cv.skills) && cv.skills.some(s => s.source === 'ai')
      );

      console.log(`\n🤖 AI skills-li CV sayı: ${aiSkillsCvs.length}`);

      if (aiSkillsCvs.length > 0) {
        console.log('\n🔍 AI Skills nümunələri:');
        aiSkillsCvs.slice(0, 5).forEach((cv, index) => {
          const aiSkills = cv.skills.filter(s => s.source === 'ai');
          const template = allTemplates.find(t => t.id === cv.templateId);
          console.log(`   ${index + 1}. CV ${cv.id} - ${template?.name} - AI Skills: ${aiSkills.length}`);
          
          aiSkills.forEach(skill => {
            console.log(`      • ${skill.name} (${skill.type}) - ${skill.level}`);
          });
        });
      }

      // Skills type analizi
      const allSkills = skillsCvs.flatMap(cv => cv.skills || []);
      const hardSkills = allSkills.filter(s => s.type === 'hard');
      const softSkills = allSkills.filter(s => s.type === 'soft');
      const otherSkills = allSkills.filter(s => !s.type || (s.type !== 'hard' && s.type !== 'soft'));

      console.log('\n📊 Skills type distribution:');
      console.log(`   💪 Hard Skills: ${hardSkills.length}`);
      console.log(`   🧠 Soft Skills: ${softSkills.length}`);
      console.log(`   🔧 Digər Skills: ${otherSkills.length}`);
    }

    // 6. Template compatibility test
    console.log('\n🧪 Template Skills Compatibility Test...');
    
    // Hər kategoriyada ən azı 1 aktiv template olub-olmadığını yoxla
    const compatibilityResults = {};
    
    for (const category of categories) {
      const categoryActiveTemplates = activeTemplates.filter(t => t.category === category);
      const categorySkillsCvs = skillsCvs.filter(cv => {
        const template = allTemplates.find(t => t.id === cv.templateId);
        return template?.category === category;
      });

      compatibilityResults[category] = {
        activeTemplates: categoryActiveTemplates.length,
        skillsCvs: categorySkillsCvs.length,
        compatible: categoryActiveTemplates.length > 0 && categorySkillsCvs.length > 0
      };
    }

    console.log('\n🎯 Kateqoriya üzrə uyğunluq:');
    Object.entries(compatibilityResults).forEach(([category, result]) => {
      const status = result.compatible ? '✅' : (result.activeTemplates > 0 ? '⚠️' : '❌');
      console.log(`   ${status} ${category}: ${result.activeTemplates} aktiv template, ${result.skillsCvs} skills-li CV`);
    });

    // 7. Final qiymətləndirmə
    const totalCompatible = Object.values(compatibilityResults).filter(r => r.compatible).length;
    const totalCategories = categories.length;
    
    console.log('\n🏆 FINAL QİYMƏTLƏNDİRMƏ:');
    console.log(`✅ Uyğun kategoriyalar: ${totalCompatible}/${totalCategories}`);
    console.log(`📊 Uyğunluq faizi: ${Math.round((totalCompatible / totalCategories) * 100)}%`);
    
    if (totalCompatible === totalCategories) {
      console.log('🎉 Mükəmməl! Bütün template kategoriyalarında AI skills problemsiz işləyir!');
    } else {
      console.log('⚠️  Bəzi kategoriyalarda test məlumatı azlığı var');
    }

  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTemplatesSkillsCompatibility();
