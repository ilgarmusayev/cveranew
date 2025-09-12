const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCVCreationAPI(userId) {
    try {
        console.log('🧪 Testing CV creation API for user:', userId);
        
        // Import the CV limits function
        const { checkCVCreationLimit, incrementCVUsage } = require('./src/lib/cvLimits.ts');
        
        // Test limit check
        console.log('1️⃣ Checking CV creation limits...');
        const limits = await checkCVCreationLimit(userId);
        
        console.log('📊 Limit check result:');
        console.log('  Can create:', limits.canCreate);
        console.log('  Limit reached:', limits.limitReached);
        console.log('  Current count:', limits.currentCount);
        console.log('  Limit:', limits.limit);
        console.log('  Tier name:', limits.tierName);

        if (!limits.canCreate) {
            console.log('❌ Cannot create CV - limit reached!');
            return;
        }

        console.log('✅ User can create CV!');
        
        // Test increment usage
        console.log('2️⃣ Testing usage increment...');
        await incrementCVUsage(userId);
        console.log('✅ Usage incremented successfully');
        
        // Check limits again
        console.log('3️⃣ Checking limits after increment...');
        const limitsAfter = await checkCVCreationLimit(userId);
        
        console.log('📊 Limits after increment:');
        console.log('  Can create:', limitsAfter.canCreate);
        console.log('  Current count:', limitsAfter.currentCount);
        console.log('  Limit:', limitsAfter.limit);

    } catch (error) {
        console.error('❌ Test xətası:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testCVCreationAPI('51f35a4f-43fd-43d9-8fd0-a41a85eab566');
