const { PrismaClient } = require('@prisma/client');

async function reactivateGeminiKey() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Reactivating Gemini API key...');
    
    // Reactivate the failed key
    const result = await prisma.apiKey.updateMany({
      where: { 
        service: 'gemini',
        id: '518f0056-2db5-4df2-b09c-0867978bfc55'
      },
      data: {
        active: true,
        usageCount: 0,
        lastResult: 'Reactivated after model version fix',
        lastReset: new Date()
      }
    });
    
    console.log('✅ Updated API keys:', result.count);
    
    // Verify the key is active
    const verifyKey = await prisma.apiKey.findFirst({
      where: { 
        service: 'gemini',
        id: '518f0056-2db5-4df2-b09c-0867978bfc55' 
      }
    });
    
    if (verifyKey) {
      console.log('🎉 API key is now active!');
      console.log(`   - Status: ${verifyKey.active ? 'Active' : 'Inactive'}`);
      console.log(`   - Usage Count: ${verifyKey.usageCount}`);
      console.log(`   - Last Result: ${verifyKey.lastResult}`);
    }
    
  } catch (error) {
    console.error('❌ Error reactivating key:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reactivateGeminiKey();