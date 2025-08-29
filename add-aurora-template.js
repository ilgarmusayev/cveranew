const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function addAuroraTemplate() {
    const client = await pool.connect();
    try {
        console.log('🌅 Adding Aurora template...');
        
        // Insert Aurora template
        const insertResult = await client.query(`
            INSERT INTO "Template" (id, name, tier, "previewUrl", "createdAt", "updatedAt")
            VALUES (
              'aurora',
              'Aurora',
              'Free',
              '/templates/aurora-preview.jpg',
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
        
        console.log('✅ Aurora template added:', insertResult.rows[0]);
        
        // Show all templates
        const templates = await client.query(`SELECT id, name, tier FROM "Template" ORDER BY tier, name`);
        console.log('📋 All templates:');
        templates.rows.forEach(template => {
            console.log(`  - ${template.name} (${template.id}) - ${template.tier}`);
        });
        
        console.log('\n🎨 Aurora Template Features:');
        console.log('  ✅ Modern Minimal Design');
        console.log('  ✅ ATS-Friendly (No colors)');
        console.log('  ✅ Clean Layout');
        console.log('  ✅ Professional Structure');
        console.log('  ✅ Responsive Design');
        console.log('  ✅ Free Tier Access');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the function
addAuroraTemplate().catch(console.error);
