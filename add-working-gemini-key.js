const { PrismaClient } = require('@prisma/client');

async function addWorkingGeminiKey() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking existing Gemini API keys...');
    
    // Check current Gemini keys
    const existingKeys = await prisma.apiKey.findMany({
      where: { service: 'gemini' }
    });
    
    console.log('📊 Existing Gemini keys:', existingKeys.length);
    existingKeys.forEach(key => {
      console.log(`  - ID: ${key.id}, Key: ${key.apiKey?.substring(0, 10)}..., Active: ${key.active}`);
    });
    
    // Add the working key - create a new record
    const workingKey = 'AIzaSyC2ibKvEuDyilAwgMKUBIRiwkAdz1ROGdM';
    
    // First delete any existing gemini keys to avoid conflicts
    await prisma.apiKey.deleteMany({
      where: { service: 'gemini' }
    });
    
    console.log('🗑️ Deleted existing gemini keys');
    
    const createResult = await prisma.apiKey.create({
      data: {
        service: 'gemini',
        apiKey: workingKey,
        active: true,
        priority: 1,
        dailyLimit: 1000,
        dailyUsage: 0,
        lastReset: new Date(),
        usageCount: 0
      }
    });
    
    console.log('✅ Successfully added working Gemini API key:', createResult.id);
    
    // Verify the key is there
    const verifyKey = await prisma.apiKey.findFirst({
      where: { service: 'gemini', active: true }
    });
    
    if (verifyKey) {
      console.log('🎉 Verification successful! Working key is now active in database');
      console.log(`   - Key ID: ${verifyKey.id}`);
      console.log(`   - Key Preview: ${verifyKey.apiKey?.substring(0, 15)}...`);
      console.log(`   - Status: ${verifyKey.active ? 'Active' : 'Inactive'}`);
      console.log(`   - Priority: ${verifyKey.priority}`);
      console.log(`   - Daily Limit: ${verifyKey.dailyLimit}`);
    }
    
  } catch (error) {
    console.error('❌ Error adding working Gemini key:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWorkingGeminiKey();