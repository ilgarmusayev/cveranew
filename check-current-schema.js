const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentSchema() {
  try {
    console.log('🔍 Mövcud ApiKey schema-nı yoxlayıram...');

    const apiKeys = await prisma.apiKey.findMany();
    console.log(`📊 Cəmi ${apiKeys.length} API key tapıldı`);

    if (apiKeys.length > 0) {
      console.log('📋 Mövcud sahələr:', Object.keys(apiKeys[0]));
      console.log('🔑 İlk API key:', apiKeys[0]);
    }

  } catch (error) {
    console.error('❌ Schema yoxlanılarkən xəta:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentSchema();
