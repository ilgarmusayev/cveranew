const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkTemplateTable() {
    const client = await pool.connect();
    try {
        console.log('🔍 Checking Template table structure...');
        
        // Check Template table columns
        const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'Template' 
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Template table columns:');
        columnsResult.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check existing templates
        const existingTemplates = await client.query(`SELECT * FROM "Template"`);
        console.log('\n🎨 Existing templates:');
        existingTemplates.rows.forEach(template => {
            console.log(`  - ${template.name} (${template.id}) - ${template.tier}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTemplateTable();
