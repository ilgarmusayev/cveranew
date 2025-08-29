#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function addHorizonTemplate() {
    try {
        console.log('🌅 Adding Horizon template...');

        // Insert Horizon template
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
                'horizon',
                'Horizon',
                'free',
                '/templates/horizon-preview.jpg',
                'Geniş və açıq üslub - kreativ sahələrə uyğun. Professional və minimal dizayn.',
                NOW(),
                NOW()
            )
            ON CONFLICT (id) 
            DO UPDATE SET 
                description = EXCLUDED.description,
                "updatedAt" = NOW()
            RETURNING *;
        `);

        console.log('✅ Horizon template added:', insertResult.rows[0]);

        // Verify the template was added
        const verifyResult = await pool.query('SELECT * FROM "Template" WHERE id = $1', ['horizon']);
        console.log('🔍 Verification:', verifyResult.rows[0]);

        console.log('\n🎨 Horizon Template Features:');
        console.log('   ✨ Wide, Open Design Style');
        console.log('   🎨 Perfect for Creative Fields');
        console.log('   📝 ATS-Friendly Structure');
        console.log('   📱 Responsive Layout');
        console.log('   🔧 Drag & Drop Sections');
        console.log('   ⚡ Professional Typography');
        console.log('   🎯 Single Column Layout');
        console.log('   🌟 Clean Contact Section');
        console.log('   📊 Skills Grid Layout');
        console.log('   💼 Project Showcase');
        console.log('   🎓 Education Timeline');
        console.log('   🏆 Certification Display');
        console.log('   🤝 Volunteer Experience');
        console.log('   📝 Custom Sections Support');
        console.log('   🌍 Multi-language Support');

    } catch (error) {
        console.error('❌ Error adding Horizon template:', error);
    } finally {
        await pool.end();
    }
}

addHorizonTemplate().catch(console.error);
