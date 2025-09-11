const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addGeminiApiKey() {
  try {
    console.log('🔑 Adding Gemini API key...');
    
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiKey) {
      console.log('❌ GEMINI_API_KEY environment variable not found');
      return;
    }
    
    // Check if Gemini key already exists
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        service: 'gemini',
        apiKey: geminiKey
      }
    });
    
    if (existingKey) {
      console.log('ℹ️ Gemini API key already exists in database');
      console.log(`   ID: ${existingKey.id}`);
      console.log(`   Active: ${existingKey.active}`);
      console.log(`   Usage: ${existingKey.usageCount}`);
      return;
    }
    
    // Add new Gemini API key
    const newKey = await prisma.apiKey.create({
      data: {
        service: 'gemini',
        apiKey: geminiKey,
        priority: 1,
        dailyLimit: 1000,
        active: true,
        usageCount: 0,
        dailyUsage: 0,
        lastReset: new Date()
      }
    });
    
    console.log('✅ Gemini API key added successfully!');
    console.log(`   ID: ${newKey.id}`);
    console.log(`   Service: ${newKey.service}`);
    console.log(`   Priority: ${newKey.priority}`);
    console.log(`   Daily Limit: ${newKey.dailyLimit}`);
    
  } catch (error) {
    console.error('❌ Error adding Gemini API key:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addGeminiApiKey();
