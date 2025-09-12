// LinkedIn Data Transfer Debug Tool
// Bu script LinkedIn import edilmiş CV-ləri yoxlayır

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugLinkedInDataTransfer() {
    try {
        console.log('🔍 LinkedIn Data Transfer Debug başladı...');
        
        // LinkedIn import sessions-ları tap
        const linkedinSessions = await prisma.importSession.findMany({
            where: {
                type: 'linkedin_success'
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5 // Son 5 import
        });
        
        console.log(`📊 ${linkedinSessions.length} LinkedIn import session tapıldı`);
        
        for (const session of linkedinSessions) {
            const sessionData = JSON.parse(session.data);
            const cvId = sessionData.cvId;
            
            console.log(`\n📋 CV ID: ${cvId}`);
            console.log(`📅 Import tarixi: ${session.createdAt}`);
            console.log(`👤 User ID: ${session.userId}`);
            
            // CV data-sını oxu
            const cv = await prisma.cV.findFirst({
                where: {
                    id: cvId,
                    userId: session.userId
                }
            });
            
            if (!cv) {
                console.log('❌ CV tapılmadı!');
                continue;
            }
            
            console.log(`📝 CV Title: ${cv.title}`);
            console.log(`🎨 Template ID: ${cv.templateId}`);
            
            // CV data strukturunu yoxla
            if (cv.cv_data && typeof cv.cv_data === 'object') {
                const cvData = cv.cv_data;
                
                console.log('📊 CV Data Struktur Analizi:');
                console.log('  personalInfo:', !!cvData.personalInfo);
                console.log('  experience:', Array.isArray(cvData.experience) ? cvData.experience.length : 'YOX');
                console.log('  education:', Array.isArray(cvData.education) ? cvData.education.length : 'YOX');
                console.log('  skills:', Array.isArray(cvData.skills) ? cvData.skills.length : 'YOX');
                console.log('  projects:', Array.isArray(cvData.projects) ? cvData.projects.length : 'YOX');
                console.log('  certifications:', Array.isArray(cvData.certifications) ? cvData.certifications.length : 'YOX');
                console.log('  awards:', Array.isArray(cvData.awards) ? cvData.awards.length : 'YOX');
                console.log('  honors:', Array.isArray(cvData.honors) ? cvData.honors.length : 'YOX');
                console.log('  volunteerExperience:', Array.isArray(cvData.volunteerExperience) ? cvData.volunteerExperience.length : 'YOX');
                console.log('  languages:', Array.isArray(cvData.languages) ? cvData.languages.length : 'YOX');
                
                // Projects detail yoxla
                if (cvData.projects && cvData.projects.length > 0) {
                    console.log('\n🏗️ Projects detayları:');
                    cvData.projects.slice(0, 2).forEach((project, index) => {
                        console.log(`  Project ${index + 1}:`);
                        console.log(`    Name: ${project.name || 'YOX'}`);
                        console.log(`    Description: ${project.description ? 'VAR' : 'YOX'}`);
                        console.log(`    URL: ${project.url || 'YOX'}`);
                    });
                }
                
                // Certifications detail yoxla
                if (cvData.certifications && cvData.certifications.length > 0) {
                    console.log('\n🏆 Certifications detayları:');
                    cvData.certifications.slice(0, 2).forEach((cert, index) => {
                        console.log(`  Certification ${index + 1}:`);
                        console.log(`    Name: ${cert.name || 'YOX'}`);
                        console.log(`    Issuer: ${cert.issuer || 'YOX'}`);
                        console.log(`    Date: ${cert.date || 'YOX'}`);
                    });
                }
                
                // Experience detail yoxla  
                if (cvData.experience && cvData.experience.length > 0) {
                    console.log('\n💼 Experience detayları:');
                    cvData.experience.slice(0, 1).forEach((exp, index) => {
                        console.log(`  Experience ${index + 1}:`);
                        console.log(`    Position: ${exp.position || 'YOX'}`);
                        console.log(`    Company: ${exp.company || 'YOX'}`);
                        console.log(`    Description: ${exp.description ? 'VAR' : 'YOX'}`);
                        console.log(`    Start Date: ${exp.startDate || 'YOX'}`);
                        console.log(`    End Date: ${exp.endDate || 'YOX'}`);
                    });
                }
                
            } else {
                console.log('❌ CV data strukturu düzgün deyil!');
            }
        }
        
        console.log('\n✅ LinkedIn Data Transfer Debug tamamlandı');
        
    } catch (error) {
        console.error('❌ Debug xətası:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run debug
debugLinkedInDataTransfer();
