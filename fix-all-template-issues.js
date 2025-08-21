
      if (cv.cv_data && typeof cv.cv_data === 'object') {
        const cvData = { ...cv.cv_data };
        
        if (!cvData.templateId || cvData.templateId !== newTemplateId) {
          cvData.templateId = newTemplateId;
          newCvData = cvData;
          needsUpdate = true;
          console.log(`🔄 CV ${cv.id}: cv_data templateId düzəldildi -> "${newTemplateId}"`);
        }
      }

      // Update et
      if (needsUpdate) {
        await prisma.cV.update({
          where: { id: cv.id },
          data: {
            templateId: newTemplateId,
            cv_data: newCvData
          }
        });
        fixedCount++;
        console.log(`✅ CV ${cv.id} düzəldildi`);
      }
    }

    console.log(`\n🎉 ${fixedCount} CV düzəldildi!`);

    // 3. Son yoxlama
    console.log('\n🔍 Son yoxlama...');
    
    const problemCVs = await prisma.cV.findMany({
      where: {
        OR: [
          { templateId: null },
          { templateId: '' }
        ]
      }
    });

    console.log(`❌ Hələ də problemli CV-lər: ${problemCVs.length}`);

    // 4. Template sinxronlaşmasını yoxla
    const testCV = await prisma.cV.findFirst({
      select: {
        id: true,
        templateId: true,
        cv_data: true
      }
    });

    if (testCV) {
      console.log('\n✅ Test CV:');
      console.log(`Database templateId: ${testCV.templateId}`);
      console.log(`cv_data templateId: ${testCV.cv_data?.templateId}`);
      
      if (testCV.templateId === testCV.cv_data?.templateId) {
        console.log('🎉 Template sinxronlaşması DÜZGÜNDÜR!');
      } else {
        console.log('❌ Template sinxronlaşması hələ də problemlidir');
      }
    }

  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllTemplateIssues();
