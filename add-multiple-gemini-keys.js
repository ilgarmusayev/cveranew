const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Gemini API keys to add (replace with your actual keys)
const GEMINI_API_KEYS = [
  {
    name: 'Gemini Primary API Key',
    apiKey: 'AIzaSyA...your-first-key-here',
    priority: 1,
    dailyLimit: 1000
  },
  {
    name: 'Gemini Secondary API Key',
    apiKey: 'AIzaSyB...your-second-key-here', 
    priority: 2,
    dailyLimit: 1000
  },
  {
    name: 'Gemini Tertiary API Key',
    apiKey: 'AIzaSyC...your-third-key-here',
    priority: 3,
    dailyLimit: 1000
  },
  {
    name: 'Gemini Backup API Key',
    apiKey: 'AIzaSyD...your-fourth-key-here',
    priority: 4,
    dailyLimit: 800
  }
];

async function addMultipleGeminiKeys() {
  console.log('🔑 Adding multiple Gemini API keys to database...');
  
  try {
    // First, check existing keys to avoid duplicates
    const existingKeys = await prisma.apiKey.findMany({
      where: { service: 'gemini' },
      select: { apiKey: true }
    });
    
    const existingApiKeys = existingKeys.map(k => k.apiKey);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const keyData of GEMINI_API_KEYS) {
      if (existingApiKeys.includes(keyData.apiKey)) {
        console.log(`⚠️  Key already exists: ${keyData.name} (${keyData.apiKey.substring(0, 15)}...)`);
        skippedCount++;
        continue;
      }
      
      await prisma.apiKey.create({
        data: {
          service: 'gemini',
          name: keyData.name,
          apiKey: keyData.apiKey,
          active: true,
          priority: keyData.priority,
          dailyLimit: keyData.dailyLimit,
          usageCount: 0,
          dailyUsage: 0,
          createdAt: new Date(),
          lastReset: new Date()
        }
      });
      
      console.log(`✅ Added: ${keyData.name} (Priority: ${keyData.priority}, Limit: ${keyData.dailyLimit})`);
      addedCount++;
    }
    
    console.log(`\n🎉 Summary:`);
    console.log(`   - Added: ${addedCount} new API keys`);
    console.log(`   - Skipped: ${skippedCount} duplicate keys`);
    console.log(`   - Total Gemini keys: ${existingKeys.length + addedCount}`);
    
    // Display all Gemini keys
    const allGeminiKeys = await prisma.apiKey.findMany({
      where: { service: 'gemini' },
      orderBy: { priority: 'asc' },
      select: {
        id: true,
        name: true,
        apiKey: true,
        priority: true,
        dailyLimit: true,
        active: true,
        usageCount: true,
        dailyUsage: true
      }
    });
    
    console.log(`\n📋 All Gemini API Keys:`);
    allGeminiKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key.name}`);
      console.log(`      ID: ${key.id}`);
      console.log(`      Key: ${key.apiKey.substring(0, 15)}...`);
      console.log(`      Priority: ${key.priority}, Limit: ${key.dailyLimit}`);
      console.log(`      Active: ${key.active}, Usage: ${key.usageCount}, Daily: ${key.dailyUsage}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error adding API keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addMultipleGeminiKeys();