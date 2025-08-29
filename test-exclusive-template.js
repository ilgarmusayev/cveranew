const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testExclusiveTemplate() {
    const client = await pool.connect();
    try {
        console.log('🎯 Testing Exclusive template in database...');
        
        // Check if Exclusive template exists
        const template = await client.query(`SELECT * FROM "Template" WHERE id = 'exclusive'`);
        
        if (template.rows.length > 0) {
            console.log('✅ Exclusive template found:');
            console.log('   ID:', template.rows[0].id);
            console.log('   Name:', template.rows[0].name);
            console.log('   Tier:', template.rows[0].tier);
            console.log('   Preview URL:', template.rows[0].previewUrl);
            console.log('   Created:', template.rows[0].createdAt);
        } else {
            console.log('❌ Exclusive template not found');
        }
        
        // Check all templates to see the final list
        const allTemplates = await client.query(`SELECT id, name, tier FROM "Template"`);
        console.log('\n📋 All available templates:');
        allTemplates.rows.forEach((template, index) => {
            console.log(`  ${index + 1}. ${template.name} (${template.id}) - ${template.tier}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

testExclusiveTemplate();
