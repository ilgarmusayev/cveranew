const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpecificUser(userId) {
    try {
        console.log('🔍 Checking user:', userId);
        
        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                id: true,
                email: true, 
                tier: true,
                createdAt: true
            }
        });

        if (!user) {
            console.log('❌ User tapılmadı!');
            return;
        }

        console.log('👤 User məlumatları:');
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Tier:', user.tier);
        console.log('  Yaradılma tarixi:', user.createdAt);

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('📅 Bugünün tarixi:', today.toISOString());

        // Check daily usage
        const dailyUsage = await prisma.dailyUsage.findUnique({
            where: {
                userId_date: {
                    userId: user.id,
                    date: today
                }
            }
        });

        console.log('📊 Günlük istifadə (bugün):');
        if (dailyUsage) {
            console.log('  CV yaradılıb:', dailyUsage.cvCreated);
            console.log('  PDF export:', dailyUsage.pdfExports);
            console.log('  DOCX export:', dailyUsage.docxExports);
            console.log('  Tarix:', dailyUsage.date);
        } else {
            console.log('  ❌ Günlük istifadə qeydi yoxdur');
        }

        // Get total CV count
        const totalCVs = await prisma.cV.count({
            where: { userId: user.id }
        });
        console.log('📄 Ümumi CV sayı:', totalCVs);

        // Get recent CVs
        const recentCVs = await prisma.cV.findMany({
            where: { userId: user.id },
            select: { id: true, title: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log('📋 Son CV-lər:');
        recentCVs.forEach((cv, index) => {
            console.log(`  ${index + 1}. ${cv.title} (${cv.createdAt.toISOString().split('T')[0]})`);
        });

        // Test tier detection logic
        const tier = user.tier.toLowerCase();
        console.log('🎯 Tier detection:');
        console.log('  Raw tier:', user.tier);
        console.log('  Lowercase tier:', tier);
        
        const isPopular = ['medium', 'orta', 'populyar', 'pro'].includes(tier);
        console.log('  Is Popular tier?:', isPopular);

        if (isPopular) {
            const canCreate = !dailyUsage || dailyUsage.cvCreated < 5;
            console.log('  Can create CV?:', canCreate);
            console.log('  Current count:', dailyUsage?.cvCreated || 0);
            console.log('  Limit: 5');
        }

    } catch (error) {
        console.error('❌ Xəta:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSpecificUser('51f35a4f-43fd-43d9-8fd0-a41a85eab566');
