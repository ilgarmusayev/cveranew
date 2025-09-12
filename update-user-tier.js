const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserTier(userId, newTier) {
    try {
        console.log(`🔄 Updating user ${userId} tier to: ${newTier}`);
        
        // First check current user data
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                id: true,
                email: true, 
                tier: true 
            }
        });

        if (!currentUser) {
            console.log('❌ User tapılmadı!');
            return;
        }

        console.log('📋 Hazırki məlumatlar:');
        console.log('  Email:', currentUser.email);
        console.log('  Hazırki tier:', currentUser.tier);

        // Update the tier
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { tier: newTier },
            select: { 
                id: true,
                email: true, 
                tier: true 
            }
        });

        console.log('✅ Tier yeniləndi:');
        console.log('  Email:', updatedUser.email);
        console.log('  Yeni tier:', updatedUser.tier);

        // Clear daily usage for fresh start
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.dailyUsage.deleteMany({
            where: {
                userId: userId,
                date: today
            }
        });

        console.log('🗑️ Günlük istifadə qeydi təmizləndi');

        // Test the limits with new tier
        const { checkCVCreationLimit } = require('./src/lib/cvLimits.ts');
        const limits = await checkCVCreationLimit(userId);
        
        console.log('🔒 Yeni CV Limitləri:');
        console.log('  Yarada bilər?:', limits.canCreate);
        console.log('  Limit dolmuş?:', limits.limitReached);
        console.log('  İndiki say:', limits.currentCount);
        console.log('  Limit:', limits.limit);
        console.log('  Tier adı:', limits.tierName);

    } catch (error) {
        console.error('❌ Xəta:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Update specific user to Populyar tier
updateUserTier('51f35a4f-43fd-43d9-8fd0-a41a85eab566', 'Populyar');
