const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFullCVCreationFlow(userId) {
    try {
        console.log('🧪 FULL CV CREATION FLOW TEST');
        console.log('User ID:', userId);
        console.log('=====================================');

        // Step 1: Check user tier
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                email: true, 
                tier: true 
            }
        });

        console.log('👤 User Info:');
        console.log('  Email:', user.email);
        console.log('  Tier:', user.tier);

        // Step 2: Import CV limits function  
        const { checkCVCreationLimit, incrementCVUsage } = require('./src/lib/cvLimits.ts');

        // Step 3: Check if user can create CV
        console.log('\n1️⃣ CHECKING CV CREATION LIMITS...');
        const limits = await checkCVCreationLimit(userId);
        
        console.log('📊 Limit Check Result:');
        console.log('  ✅ Can create CV:', limits.canCreate);
        console.log('  🚫 Limit reached:', limits.limitReached);
        console.log('  📈 Current count:', limits.currentCount);
        console.log('  🎯 Daily limit:', limits.limit);
        console.log('  🏷️ Tier name:', limits.tierName);
        
        if (limits.resetTime) {
            console.log('  🔄 Reset time:', limits.resetTime.toLocaleString());
        }

        if (!limits.canCreate) {
            console.log('\n❌ CANNOT CREATE CV - LIMIT REACHED!');
            console.log('Reason: Daily limit of', limits.limit, 'reached');
            return;
        }

        console.log('\n✅ USER CAN CREATE CV!');

        // Step 4: Simulate CV creation API call
        console.log('\n2️⃣ SIMULATING CV CREATION...');
        
        try {
            // This is what happens in /api/cv route
            const newCV = await prisma.cV.create({
                data: {
                    userId: userId,
                    title: `Test CV - ${new Date().toISOString()}`,
                    cv_data: JSON.stringify({
                        personalInfo: {
                            fullName: "Test User",
                            email: user.email,
                            phone: "+994 50 123 45 67"
                        },
                        experience: [],
                        education: [],
                        skills: []
                    }),
                    templateId: 'basic'
                }
            });

            console.log('✅ CV created successfully!');
            console.log('  CV ID:', newCV.id);
            console.log('  Title:', newCV.title);

            // Step 5: Increment usage counter
            console.log('\n3️⃣ INCREMENTING USAGE COUNTER...');
            await incrementCVUsage(userId);
            console.log('✅ Usage counter incremented');

            // Step 6: Check limits after creation
            console.log('\n4️⃣ CHECKING LIMITS AFTER CREATION...');
            const limitsAfter = await checkCVCreationLimit(userId);
            
            console.log('📊 Limits After Creation:');
            console.log('  ✅ Can create more:', limitsAfter.canCreate);
            console.log('  📈 Current count:', limitsAfter.currentCount);
            console.log('  🎯 Limit:', limitsAfter.limit);
            console.log('  📊 Remaining:', limitsAfter.limit - limitsAfter.currentCount);

            console.log('\n🎉 CV CREATION FLOW COMPLETED SUCCESSFULLY!');
            console.log('📄 User now has access to create', (limitsAfter.limit - limitsAfter.currentCount), 'more CVs today');

        } catch (createError) {
            console.error('❌ CV Creation Error:', createError);
        }

    } catch (error) {
        console.error('❌ Test Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Test specific user
testFullCVCreationFlow('51f35a4f-43fd-43d9-8fd0-a41a85eab566');
