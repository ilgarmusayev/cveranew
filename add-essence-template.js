const { Pool } = require('pg');

// PostgreSQL connection using DATABASE_URL
const pool = new Pool({
    connectionString: "postgres://admincvera:ilqarilqar1M%40@cvera.postgres.database.azure.com:5432/cvera?sslmode=require",
    ssl: {
        rejectUnauthorized: false
    }
});

async function addEssenceTemplate() {
    const client = await pool.connect();
    
    try {
        console.log('🎨 Adding Essence Template to database...');
        
        // Check if Essence template already exists
        const checkResult = await client.query(
            'SELECT id FROM "Template" WHERE name = $1',
            ['Essence']
        );
        
        if (checkResult.rows.length > 0) {
            console.log('✅ Essence template already exists!');
            return;
        }
        
        // Insert Essence template
        const result = await client.query(`
            INSERT INTO "Template" (
                id,
                name, 
                tier,
                "previewUrl",
                description, 
                "createdAt", 
                "updatedAt"
            ) VALUES (
                gen_random_uuid(),
                'Essence', 
                'Free',
                '/templates/essence-preview.jpg', 
                'Modern minimalist design with white and gray block system. Perfect for entry-level positions with professional clean layout.',
                NOW(), 
                NOW()
            ) RETURNING id, name, description
        `);
        
        const template = result.rows[0];
        console.log('✅ Essence Template added successfully!');
        console.log(`📋 Template ID: ${template.id}`);
        console.log(`📋 Name: ${template.name}`);
        console.log(`📋 Description: ${template.description}`);
        
        // Check total templates
        const countResult = await client.query('SELECT COUNT(*) as total FROM "Template"');
        console.log(`📊 Total templates in database: ${countResult.rows[0].total}`);
        
    } catch (error) {
        console.error('❌ Error adding Essence template:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
addEssenceTemplate();
