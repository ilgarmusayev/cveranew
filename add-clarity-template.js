const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cvapp',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addClarityTemplate() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Adding Clarity Template to database...');

        // Check if template already exists
        const existingCheck = await client.query(
            'SELECT id FROM cv_templates WHERE id = $1',
            ['clarity']
        );

        if (existingCheck.rows.length > 0) {
            console.log('⚠️ Clarity template already exists, updating...');
            
            await client.query(`
                UPDATE cv_templates 
                SET 
                    name = $1,
                    preview_url = $2,
                    thumbnail_url = $3,
                    category = $4,
                    tags = $5,
                    is_premium = $6,
                    updated_at = NOW(),
                    description = $7,
                    is_active = $8
                WHERE id = $9
            `, [
                'Clarity',
                '/images/templates/clarity-preview.jpg',
                '/images/templates/clarity-thumb.jpg',
                'professional',
                ['simple', 'clean', 'ats-friendly', 'modern', 'orange', 'white'],
                false,
                'Clarity - Sade və ATS-dostu dizayn. Ağ arxa plan, tünd narıncı vurğular və təmiz görünüş. Peşəkar və oxunaqlı template.',
                true,
                'clarity'
            ]);
            
            console.log('✅ Clarity template updated successfully!');
        } else {
            // Get next ordering number
            const orderingResult = await client.query(
                'SELECT COALESCE(MAX(ordering), 0) + 1 AS next_ordering FROM cv_templates'
            );
            const nextOrdering = orderingResult.rows[0].next_ordering;

            // Insert new template
            await client.query(`
                INSERT INTO cv_templates (
                    id,
                    name,
                    preview_url,
                    thumbnail_url,
                    category,
                    tags,
                    is_premium,
                    created_at,
                    updated_at,
                    ordering,
                    is_active,
                    description
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, $10)
            `, [
                'clarity',
                'Clarity',
                '/images/templates/clarity-preview.jpg',
                '/images/templates/clarity-thumb.jpg',
                'professional',
                ['simple', 'clean', 'ats-friendly', 'modern', 'orange', 'white'],
                false,
                nextOrdering,
                true,
                'Clarity - Sade və ATS-dostu dizayn. Ağ arxa plan, tünd narıncı vurğular və təmiz görünüş. Peşəkar və oxunaqlı template.'
            ]);
            
            console.log('✅ Clarity template added successfully!');
        }

        // Verify the template
        const result = await client.query(
            'SELECT * FROM cv_templates WHERE id = $1',
            ['clarity']
        );

        if (result.rows.length > 0) {
            const template = result.rows[0];
            console.log('📋 Template Details:');
            console.log(`   ID: ${template.id}`);
            console.log(`   Name: ${template.name}`);
            console.log(`   Category: ${template.category}`);
            console.log(`   Tags: ${template.tags}`);
            console.log(`   Premium: ${template.is_premium}`);
            console.log(`   Active: ${template.is_active}`);
            console.log(`   Ordering: ${template.ordering}`);
            console.log(`   Description: ${template.description}`);
        }

        // Show all templates
        const allTemplates = await client.query(
            'SELECT id, name, category, is_premium, is_active, ordering FROM cv_templates ORDER BY ordering'
        );
        
        console.log('\n📚 All Templates:');
        allTemplates.rows.forEach(template => {
            console.log(`   ${template.ordering}. ${template.name} (${template.id}) - ${template.category} ${template.is_premium ? '[PREMIUM]' : ''} ${template.is_active ? '[ACTIVE]' : '[INACTIVE]'}`);
        });

    } catch (error) {
        console.error('❌ Error adding Clarity template:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
addClarityTemplate()
    .then(() => {
        console.log('\n🎉 Clarity template setup completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Setup failed:', error);
        process.exit(1);
    });
