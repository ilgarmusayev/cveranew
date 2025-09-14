const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://musayev:xyUL5jdtJCUEBPBLKTKT3d55LZ3VSSdn@dpg-crbf7pdds78s73av7qk0-a.oregon-postgres.render.com/cveralasted',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkCVTableStructure() {
  try {
    console.log('🔍 Checking CV table structure...');
    
    // CV table columns
    const cvTableQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cvs' 
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(cvTableQuery);
    
    console.log('\n📋 CV Table Columns:');
    console.log('========================');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });
    
    // Check if 'data' column exists and what type it is
    const dataColumn = result.rows.find(row => row.column_name === 'data');
    if (dataColumn) {
      console.log(`\n✅ 'data' column found: ${dataColumn.data_type}`);
      
      // Sample CV data to check structure
      const sampleQuery = `
        SELECT id, title, data 
        FROM cvs 
        WHERE data IS NOT NULL 
        LIMIT 1;
      `;
      
      const sampleResult = await pool.query(sampleQuery);
      if (sampleResult.rows.length > 0) {
        const sample = sampleResult.rows[0];
        console.log('\n📄 Sample CV Data Structure:');
        console.log('ID:', sample.id);
        console.log('Title:', sample.title);
        
        if (typeof sample.data === 'object') {
          console.log('Data keys:', Object.keys(sample.data));
          console.log('Has publications?', 'publications' in sample.data);
          console.log('Publications data:', sample.data.publications || 'NOT FOUND');
        } else {
          console.log('Data type:', typeof sample.data);
          console.log('Data content:', sample.data);
        }
      } else {
        console.log('\n⚠️ No CV data found in database');
      }
    } else {
      console.log('\n❌ "data" column not found in CVs table!');
    }
    
  } catch (error) {
    console.error('❌ Database check error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCVTableStructure();
