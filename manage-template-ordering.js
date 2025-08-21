const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function manageTemplateOrdering() {
  try {
    console.log('🔧 Template sıralama idarəetmə sistemi');
    console.log('====================================\n');

    // Show current templates
    const templates = await prisma.template.findMany({
      orderBy: { order: 'asc' }
    });

    console.log('📋 Mövcud template sırası:');
    templates.forEach(template => {
      console.log(`${template.order}. ${template.name} (${template.tier}) - ${template.isActive ? 'Aktiv' : 'Deaktiv'}`);
    });

    return templates;
  } catch (error) {
    console.error('❌ Xəta:', error);
  }
}

// Reorder templates function
async function reorderTemplates(newOrder) {
  try {
    console.log('\n🔄 Template-lar yenidən sıralanır...');

    for (const item of newOrder) {
      await prisma.template.update({
        where: { id: item.id },
        data: { order: item.order }
      });
      console.log(`✅ ${item.name} → sıra ${item.order}`);
    }

    console.log('\n📋 Yeni sıralama:');
    const updatedTemplates = await prisma.template.findMany({
      orderBy: { order: 'asc' }
    });

    updatedTemplates.forEach(template => {
      console.log(`${template.order}. ${template.name} (${template.tier})`);
    });

    console.log('\n🎉 Template sıralaması uğurla yeniləndi!');

  } catch (error) {
    console.error('❌ Xəta:', error);
  }
}

// Toggle template active status
async function toggleTemplateStatus(templateId, isActive) {
  try {
    const template = await prisma.template.update({
      where: { id: templateId },
      data: { isActive: isActive }
    });

    console.log(`✅ ${template.name} ${isActive ? 'aktivləşdirildi' : 'deaktivləşdirildi'}`);
    return template;
  } catch (error) {
    console.error('❌ Xəta:', error);
  }
}

// Example usage functions
async function exampleReordering() {
  console.log('\n🔄 Nümunə sıralama...');

  // Get current templates
  const templates = await prisma.template.findMany({
    orderBy: { order: 'asc' }
  });

  // Example: Move the last template to first position
  const newOrder = [
    { id: templates[3].id, name: templates[3].name, order: 1 },
    { id: templates[0].id, name: templates[0].name, order: 2 },
    { id: templates[1].id, name: templates[1].name, order: 3 },
    { id: templates[2].id, name: templates[2].name, order: 4 }
  ];

  await reorderTemplates(newOrder);
}

// Interactive reordering (you can call this with specific order)
async function setCustomOrder(orderArray) {
  // orderArray should be like: [templateId1, templateId2, templateId3, templateId4]
  try {
    const templates = await prisma.template.findMany();
    const newOrder = [];

    for (let i = 0; i < orderArray.length; i++) {
      const template = templates.find(t => t.id === orderArray[i]);
      if (template) {
        newOrder.push({
          id: template.id,
          name: template.name,
          order: i + 1
        });
      }
    }

    await reorderTemplates(newOrder);
  } catch (error) {
    console.error('❌ Xəta:', error);
  }
}

// Main execution
async function main() {
  await manageTemplateOrdering();

  // Uncomment to test reordering
  // await exampleReordering();

  await prisma.$disconnect();
}

// Export functions for use in other scripts
module.exports = {
  manageTemplateOrdering,
  reorderTemplates,
  toggleTemplateStatus,
  setCustomOrder
};

// Run if called directly
if (require.main === module) {
  main();
}
