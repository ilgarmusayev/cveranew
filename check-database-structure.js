const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkDatabase() {
    const client = await pool.connect();
    try {
        console.log('🔍 Checking database structure...');
        
        // List all tables
        const tablesResult = await client.query(`
            SELECT schemaname, tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);
        
        console.log('📋 Tables in database:');
        tablesResult.rows.forEach(table => {
            console.log(`  - ${table.tablename}`);
        });
        
        // Check if there's a table that might contain templates
        const possibleTemplatesTables = tablesResult.rows.filter(table => 
            table.tablename.toLowerCase().includes('template') ||
            table.tablename.toLowerCase().includes('design') ||
            table.tablename.toLowerCase().includes('layout')
        );
        
        console.log('\n🎨 Potential template-related tables:');
        possibleTemplatesTables.forEach(table => {
            console.log(`  - ${table.tablename}`);
        });
        
        // Check columns of CV table if it exists
        const cvTableExists = tablesResult.rows.find(table => table.tablename === 'cvs');
        if (cvTableExists) {
            console.log('\n📄 CVs table columns:');
            const columnsResult = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'cvs' 
                ORDER BY ordinal_position;
            `);
            columnsResult.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkDatabase();
