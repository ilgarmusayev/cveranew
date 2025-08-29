const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function addExclusiveTemplate() {
    const client = await pool.connect();
    try {
        console.log('🎯 Adding Exclusive template...');
        
        // Insert Exclusive template
        const insertResult = await client.query(`
            INSERT INTO "Template" (id, name, tier, "previewUrl", "createdAt", "updatedAt")
            VALUES (
              'exclusive',
              'Exclusive',
              'Premium',
              '/templates/exclusive-preview.jpg',
              NOW(),
              NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              tier = EXCLUDED.tier,
              "previewUrl" = EXCLUDED."previewUrl",
              "updatedAt" = NOW()
            RETURNING *;
        `);
        
        console.log('✅ Exclusive template added:', insertResult.rows[0]);
        
        // Show all templates
        const templates = await client.query(`SELECT id, name, tier FROM "Template"`);
        console.log('📋 All templates:');
        templates.rows.forEach(template => {
            console.log(`  - ${template.name} (${template.id}) - ${template.tier}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

addExclusiveTemplate();
