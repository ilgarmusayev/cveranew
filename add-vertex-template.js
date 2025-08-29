const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function addVertexTemplate() {
    const client = await pool.connect();
    try {
        console.log('⚡ Adding Vertex template...');
        
        // Insert Vertex template
        const insertResult = await client.query(`
            INSERT INTO "Template" (id, name, tier, "previewUrl", "createdAt", "updatedAt")
            VALUES (
              'vertex',
              'Vertex',
              'Free',
              '/templates/vertex-preview.jpg',
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
        
        console.log('✅ Vertex template added:', insertResult.rows[0]);
        
        // Show all templates
        const templates = await client.query(`SELECT id, name, tier FROM "Template" ORDER BY tier, name`);
        console.log('📋 All templates:');
        templates.rows.forEach(template => {
            console.log(`  - ${template.name} (${template.id}) - ${template.tier}`);
        });
        
        console.log('\n⚡ Vertex Template Features:');
        console.log('  ✅ Technology & Innovation Focused');
        console.log('  ✅ ATS-Friendly Design');
        console.log('  ✅ Professional Symmetrical Layout');
        console.log('  ✅ Grid-Based Structure');
        console.log('  ✅ Monospace Font Elements');
        console.log('  ✅ Clean Borders & Spacing');
        console.log('  ✅ Technical Skills Grid Display');
        console.log('  ✅ Timeline Format for Experience');
        console.log('  ✅ Free Tier Access');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the function
addVertexTemplate().catch(console.error);
