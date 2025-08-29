#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkTemplates() {
    try {
        console.log('🔍 Checking all templates in database...\n');

        const result = await pool.query(`
            SELECT id, name, tier, description, "createdAt" 
            FROM "Template" 
            ORDER BY "createdAt"
        `);

        console.log('📊 Available Templates:');
        console.log('='.repeat(80));
        
        result.rows.forEach((template, index) => {
            console.log(`${index + 1}. ID: ${template.id}`);
            console.log(`   Name: ${template.name}`);
            console.log(`   Tier: ${template.tier}`);
            console.log(`   Description: ${template.description}`);
            console.log(`   Created: ${template.createdAt.toLocaleDateString()}`);
            console.log('-'.repeat(60));
        });

        console.log(`\n✅ Total templates found: ${result.rows.length}`);
        
        // Check if Lumen is in the list
        const lumenTemplate = result.rows.find(t => t.id === 'lumen');
        if (lumenTemplate) {
            console.log('\n💡 Lumen template confirmed in database!');
            console.log(`   Description: ${lumenTemplate.description}`);
        } else {
            console.log('\n❌ Lumen template not found in database');
        }

    } catch (error) {
        console.error('❌ Error checking templates:', error);
    } finally {
        await pool.end();
    }
}

checkTemplates().catch(console.error);
