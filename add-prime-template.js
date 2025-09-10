const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPrimeTemplate() {
    console.log('🚀 Adding Prime Template to database...');
    
    try {
        const newTemplate = {
            id: 'prime',
            name: 'Prime',
            tier: 'Premium',
            previewUrl: '/templates/prime-preview.jpg',
            description: 'Professional executive-style CV template with modern design, gradient accents, and clean card-based layout. Perfect for senior professionals and executives.'
        };

        const existing = await prisma.template.findUnique({
            where: { id: newTemplate.id }
        });

        if (existing) {
            console.log(`⚠️  Template ${newTemplate.name} already exists, updating...`);
            await prisma.template.update({
                where: { id: newTemplate.id },
                data: newTemplate
            });
        } else {
            console.log(`✅ Creating template: ${newTemplate.name}`);
            await prisma.template.create({
                data: newTemplate
            });
        }

        console.log('✅ Prime Template added successfully!');
        
        // Verify by fetching all templates
        const allTemplates = await prisma.template.findMany({
            orderBy: { createdAt: 'asc' }
        });
        
        console.log('\n📋 All templates in database:');
        allTemplates.forEach(template => {
            console.log(`  - ${template.name} (${template.tier}) - ${template.id}`);
        });
        
    } catch (error) {
        console.error('❌ Error adding Prime Template:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the function
addPrimeTemplate();
