const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createApiKeyTable() {
  console.log('🗄️ API Key cədvəli yaradılır...');

  try {
    // Create ApiKey table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ApiKey" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        "service" TEXT NOT NULL,
        "apiKey" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "priority" INTEGER NOT NULL DEFAULT 1,
        "usageCount" INTEGER NOT NULL DEFAULT 0,
        "lastUsed" DATETIME,
        "lastResult" TEXT,
        "dailyLimit" INTEGER NOT NULL DEFAULT 1000,
        "dailyUsage" INTEGER NOT NULL DEFAULT 0,
        "lastReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ApiKey_service_active_priority_idx" ON "ApiKey"("service", "active", "priority");
    `;

    console.log('✅ ApiKey cədvəli yaradıldı');

    // Add initial ScrapingDog API key (the broken one for reference)
    const existingKeys = await prisma.apiKey.findMany();

    if (existingKeys.length === 0) {
      console.log('📝 İlk API key-lər əlavə edilir...');

      await prisma.apiKey.create({
        data: {
          service: 'scrapingdog',
          apiKey: '6882894b855f5678d36484c8',
          active: false, // Deactivated because limit exceeded
          priority: 2,
          usageCount: 7050,
          dailyLimit: 1000,
          dailyUsage: 7050,
          lastResult: 'LIMIT_EXCEEDED'
        }
      });

      console.log('✅ Köhnə ScrapingDog key əlavə edildi (deaktiv)');
      console.log('');
      console.log('🔑 Yeni API key əlavə etmək üçün:');
      console.log('1. https://www.scrapingdog.com/ saytından yeni key alın');
      console.log('2. /sistem/api-keys səhifəsində əlavə edin');
      console.log('3. Service: scrapingdog');
      console.log('4. Priority: 1 (ən yüksək)');
      console.log('5. Daily Limit: 1000');
    } else {
      console.log('✅ API key-lər artıq mövcuddur:', existingKeys.length);
    }

  } catch (error) {
    console.error('❌ Xəta:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createApiKeyTable();
