const { PrismaClient } = require('@prisma/client');

async function addCvLanguageColumn() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Adding cvLanguage column to CV table...');
    
    // Add the column
    await prisma.$executeRaw`ALTER TABLE "CV" ADD COLUMN IF NOT EXISTS "cvLanguage" TEXT DEFAULT 'az'`;
    
    console.log('Column added successfully.');
    
    // Update existing CVs with intelligent language detection
    console.log('Updating existing CVs with language detection...');
    
    const russianUpdateResult = await prisma.$executeRaw`
      UPDATE "CV" SET "cvLanguage" = 'ru' 
      WHERE cv_data::text ILIKE '%русский%' 
         OR cv_data::text ILIKE '%инженер%' 
         OR cv_data::text ILIKE '%москва%'
         OR cv_data::text ILIKE '%тщательный%'
         OR cv_data::text ILIKE '%качества%'
    `;
    
    const englishUpdateResult = await prisma.$executeRaw`
      UPDATE "CV" SET "cvLanguage" = 'en' 
      WHERE "cvLanguage" = 'az' 
        AND (cv_data::text ILIKE '%engineer%' 
          OR cv_data::text ILIKE '%manager%' 
          OR cv_data::text ILIKE '%developer%'
          OR cv_data::text ILIKE '%quality%'
          OR cv_data::text ILIKE '%experience%')
    `;
    
    console.log(`Updated ${russianUpdateResult} CVs to Russian`);
    console.log(`Updated ${englishUpdateResult} CVs to English`);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCvLanguageColumn();