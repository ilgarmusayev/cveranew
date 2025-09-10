const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking database tables...');

        // Check all tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log('📋 Tables in database:');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Check if templates table exists with different name
        const templateTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%template%'
            ORDER BY table_name;
        `);

        console.log('\n🎨 Template-related tables:');
        templateTables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        if (templateTables.rows.length > 0) {
            // Show structure of template table
            const templateTable = templateTables.rows[0].table_name;
            console.log(`\n📐 Structure of ${templateTable}:`);
            
            const columnsResult = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '${templateTable}'
                ORDER BY ordinal_position;
            `);

            columnsResult.rows.forEach(col => {
                console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
            });

            // Show existing templates
            const templatesResult = await client.query(`SELECT * FROM ${templateTable} ORDER BY id`);
            console.log(`\n📚 Existing templates in ${templateTable}:`);
            templatesResult.rows.forEach(template => {
                console.log(`  ${template.id} - ${template.name || 'Unnamed'}`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking tables:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

checkTables();
