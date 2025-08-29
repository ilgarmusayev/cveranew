#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function addLumenTemplate() {
    try {
        console.log('💡 Adding Lumen template...');

        // Insert Lumen template
        const insertResult = await pool.query(`
            INSERT INTO "Template" (
                id, 
                name, 
                tier, 
                "previewUrl", 
                description,
                "createdAt",
                "updatedAt"
            ) VALUES (
                'lumen',
                'Lumen',
                'free',
                '/templates/lumen-preview.jpg',
                'Aydın, oxunaqlı və təmiz vizuallı şablon. ATS dizaynı əsasında ağ sol panel ilə.',
                NOW(),
                NOW()
            )
            ON CONFLICT (id) 
            DO UPDATE SET 
                description = EXCLUDED.description,
                "updatedAt" = NOW()
            RETURNING *;
        `);

        console.log('✅ Lumen template added:', insertResult.rows[0]);

        // Verify the template was added
        const verifyResult = await pool.query('SELECT * FROM "Template" WHERE id = $1', ['lumen']);
        console.log('🔍 Verification:', verifyResult.rows[0]);

        console.log('\n💡 Lumen Template Features:');
        console.log('   ✨ Clean, Bright & Clear Visual Design');
        console.log('   🤍 White Left Panel Background');
        console.log('   📏 Dividing Line Between Panels');
        console.log('   📝 ATS-Friendly Structure (same as ATS template)');
        console.log('   🎨 Same Layout as Resume ATS Template');
        console.log('   📱 Responsive Two-Column Design');
        console.log('   🔧 Drag & Drop Sections (Both Panels)');
        console.log('   👤 Profile Image Support');
        console.log('   📞 Contact Information Section');
        console.log('   💼 Skills Section (Draggable in Left Panel)');
        console.log('   🌍 Languages Section (Draggable in Left Panel)');
        console.log('   🏆 Certifications Section (Draggable in Left Panel)');
        console.log('   📊 Work Experience (Right Panel)');
        console.log('   🎓 Education Timeline (Right Panel)');
        console.log('   💻 Projects Showcase (Right Panel)');
        console.log('   🤝 Volunteer Experience (Right Panel)');
        console.log('   📝 Custom Sections Support (Right Panel)');
        console.log('   🌍 Multi-language Support (AZ/EN/TR)');
        console.log('   📋 Professional Summary Section');
        console.log('   ⚡ Mobile Touch Support');
        console.log('   🎯 Readable Typography');
        console.log('   🔄 Section Reordering');

        console.log('\n🎨 Design Differences from ATS Template:');
        console.log('   • Left Panel: WHITE background (instead of blue)');
        console.log('   • Text Colors: Dark gray on white background');
        console.log('   • Border: Gray dividing line between panels');
        console.log('   • Style: Bright and clean appearance');
        console.log('   • Functionality: Identical to ATS template');

    } catch (error) {
        console.error('❌ Error adding Lumen template:', error);
    } finally {
        await pool.end();
    }
}

addLumenTemplate().catch(console.error);
