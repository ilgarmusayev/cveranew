'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

interface MotivationLetterFormProps {
  userProfile?: any;
  onBack: () => void;
}

export default function MotivationLetterForm({ userProfile, onBack }: MotivationLetterFormProps) {
  const { siteLanguage } = useSiteLanguage();
  const [step, setStep] = useState(1);
  const [cvs, setCvs] = useState<any[]>([]);
  const [loadingCVs, setLoadingCVs] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  
  // Toast notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  const [formData, setFormData] = useState({
    // CV Selection
    selectedCvId: '',
    letterLanguage: 'azerbaijani', // Language for the motivation letter
    // Recipient Info
    recipientName: '',
    recipientTitle: '',
    organization: '',
    position: '',
    program: '',
    // Content
    motivation: '',
    goals: '',
    qualifications: '',
    conclusion: '',
    template: 'academic'
  });

  // Load user's CVs
  useEffect(() => {
    const loadCVs = async () => {
      setLoadingCVs(true);
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/cv', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const cvList = data.cvs || [];
          
          // Hər CV üçün data məlumatlarını al
          const detailedCvs = await Promise.all(
            cvList.map(async (cv: any) => {
              try {
                const cvResponse = await fetch(`/api/cv/${cv.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (cvResponse.ok) {
                  const cvData = await cvResponse.json();
                  return {
                    ...cv,
                    data: cvData.data // cv_data-nı əlavə et
                  };
                }
              } catch (error) {
                console.error(`CV ${cv.id} data load error:`, error);
              }
              return cv; // Əgər data yüklənməzsə, əsas CV məlumatlarını qaytar
            })
          );

          const sortedCvs = detailedCvs.sort((a: any, b: any) => {
            // Sort by updated date first, then creation date (newest first)
            const dateA = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0);
            const dateB = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0);
            return dateB.getTime() - dateA.getTime();
          });
          setCvs(sortedCvs);
        }
      } catch (error) {
        console.error('Error loading CVs:', error);
      } finally {
        setLoadingCVs(false);
      }
    };

    loadCVs();
  }, []);

  // Auto-scroll to top when step changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [step]);

  const content = {
    azerbaijani: {
      title: 'Motivasiya Məktubu Yaradın',
      backButton: 'Geri',
      steps: {
        1: {
          title: 'Əsas Məlumatlar',
          note: '💡 Tövsiyə: Əsas məlumatları doldurmaq tövsiyə olunur, lakin hamısını doldurmaq məcburi deyil.',
          // CV Selection
          selectCV: 'CV Seçin',
          selectCVPlaceholder: 'Motivasiya məktubu üçün CV seçin',
          loadingCVs: 'CV-lər yüklənir...',
          noCV: 'CV tapılmadı. Əvvəlcə CV yaradın.',
          untitledCV: 'Adsız CV',
          noJobTitle: 'Vəzifə yoxdur',
          // Recipient Info
          recipientInfo: 'Alıcı Məlumatları',
          recipientName: 'Alıcının adı',
          recipientNamePlaceholder: 'Dr. Nizamali Shahbazli',
          recipientTitle: 'Alıcının vəzifəsi',
          recipientTitlePlaceholder: 'Qəbul Komitəsi Sədri',
          organization: 'Təşkilat/Universitet',
          organizationPlaceholder: 'Harvard Universiteti',
          position: 'Vəzifə/Proqram',
          positionPlaceholder: 'Magistratura Proqramı',
          program: 'Xüsusi proqram',
          programPlaceholder: 'Kompüter Elmləri',
          // Letter Language
          letterLanguage: 'Məktub Dili'
        },
        2: {
          title: 'Məzmun Yaratma',
          motivation: 'Motivasiya',
          motivationPlaceholder: 'Bu proqrama niyə müraciət edirsiniz?',
          goals: 'Məqsədlər',
          goalsPlaceholder: 'Gələcək planlarınız və məqsədləriniz',
          qualifications: 'Keyfiyyətlər',
          qualificationsPlaceholder: 'Sizin güclü tərəfləriniz və təcrübəniz',
          conclusion: 'Nəticə',
          conclusionPlaceholder: 'Yekun fikir və minnətdarlıq'
        }
      },
      templates: {
        title: 'Şablon Seçin',
        academic: 'Akademik',
        scholarship: 'Təqaüd',
        volunteer: 'Könüllü',
        internship: 'Təcrübə'
      },
      buttons: {
        next: 'Növbəti',
        previous: 'Əvvəlki',
        generate: 'Yaradın',
        aiHelp: 'AI Köməyi',
        generatingAI: 'AI kömək edir...'
      },
      notifications: {
        selectCV: 'Zəhmət olmasa CV seçin',
        fillRequired: 'Zəhmət olmasa bütün vacib sahələri doldurun!',
        completeContent: 'Zəhmət olmasa motivasiya məktubu məzmununu tamamlayın!',
        generateError: 'Motivasiya məktubu yaradarkən xəta baş verdi!',
        aiError: 'AI köməyi zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
        docxError: 'DOCX faylı yaradılarkən xəta baş verdi'
      }
    },
    english: {
      title: 'Create Motivation Letter',
      backButton: 'Back',
      steps: {
        1: {
          title: 'Basic Information',
          note: '💡 Tip: It is recommended to fill in the basic information, but it is not required to fill in everything.',
          // CV Selection
          selectCV: 'Select CV',
          selectCVPlaceholder: 'Select CV for motivation letter',
          loadingCVs: 'Loading CVs...',
          noCV: 'No CVs found. Please create a CV first.',
          untitledCV: 'Untitled CV',
          noJobTitle: 'No Job Title',
          // Recipient Info
          recipientInfo: 'Recipient Information',
          recipientName: 'Recipient Name',
          recipientNamePlaceholder: 'Dr. John Smith',
          recipientTitle: 'Recipient Title',
          recipientTitlePlaceholder: 'Admissions Committee Chair',
          organization: 'Organization/University',
          organizationPlaceholder: 'Harvard University',
          position: 'Position/Program',
          positionPlaceholder: 'Master\'s Program',
          program: 'Specific program',
          programPlaceholder: 'Computer Science',
          // Letter Language
          letterLanguage: 'Letter Language'
        },
        2: {
          title: 'Content Creation',
          motivation: 'Motivation',
          motivationPlaceholder: 'Why are you applying to this program?',
          goals: 'Goals',
          goalsPlaceholder: 'Your future plans and objectives',
          qualifications: 'Qualifications',
          qualificationsPlaceholder: 'Your strengths and experience',
          conclusion: 'Conclusion',
          conclusionPlaceholder: 'Final thoughts and gratitude'
        }
      },
      templates: {
        title: 'Choose Template',
        academic: 'Academic',
        scholarship: 'Scholarship',
        volunteer: 'Volunteer',
        internship: 'Internship'
      },
      buttons: {
        next: 'Next',
        previous: 'Previous',
        generate: 'Generate',
        aiHelp: 'AI Help',
        generatingAI: 'AI is helping...'
      },
      notifications: {
        selectCV: 'Please select a CV',
        fillRequired: 'Please fill in all required fields!',
        completeContent: 'Please complete the motivation letter content!',
        generateError: 'Error generating motivation letter!',
        aiError: 'Error during AI assistance. Please try again.',
        docxError: 'Error creating DOCX file'
      }
    },
    russian: {
      title: 'Создать мотивационное письмо',
      backButton: 'Назад',
      steps: {
        1: {
          title: 'Основная информация',
          note: '💡 Совет: Рекомендуется заполнить основную информацию, но заполнять все не обязательно.',
          // CV Selection
          selectCV: 'Выберите резюме',
          selectCVPlaceholder: 'Выберите резюме для мотивационного письма',
          loadingCVs: 'Загрузка резюме...',
          noCV: 'Резюме не найдены. Сначала создайте резюме.',
          untitledCV: 'Безымянное резюме',
          noJobTitle: 'Без должности',
          // Recipient Info
          recipientInfo: 'Информация о получателе',
          recipientName: 'Имя получателя',
          recipientNamePlaceholder: 'Др. Иван Иванов',
          recipientTitle: 'Должность получателя',
          recipientTitlePlaceholder: 'Председатель приемной комиссии',
          organization: 'Организация/Университет',
          organizationPlaceholder: 'МГУ им. М.В. Ломоносова',
          position: 'Должность/Программа',
          positionPlaceholder: 'Магистерская программа',
          program: 'Конкретная программа',
          programPlaceholder: 'Информатика'
        },
        2: {
          title: 'Создание содержания',
          motivation: 'Мотивация',
          motivationPlaceholder: 'Почему вы подаете заявку на эту программу?',
          goals: 'Цели',
          goalsPlaceholder: 'Ваши будущие планы и цели',
          qualifications: 'Квалификация',
          qualificationsPlaceholder: 'Ваши сильные стороны и опыт',
          conclusion: 'Заключение',
          conclusionPlaceholder: 'Заключительные мысли и благодарность'
        }
      },
      templates: {
        title: 'Выберите шаблон',
        academic: 'Академический',
        scholarship: 'Стипендия',
        volunteer: 'Волонтерство',
        internship: 'Стажировка'
      },
      buttons: {
        next: 'Далее',
        previous: 'Назад',
        generate: 'Создать',
        aiHelp: 'Помощь ИИ',
        generatingAI: 'ИИ помогает...'
      },
      notifications: {
        selectCV: 'Пожалуйста, выберите CV',
        fillRequired: 'Пожалуйста, заполните все обязательные поля!',
        completeContent: 'Пожалуйста, завершите содержание мотивационного письма!',
        generateError: 'Ошибка при создании мотивационного письма!',
        aiError: 'Ошибка при помощи ИИ. Пожалуйста, попробуйте снова.',
        docxError: 'Ошибка при создании файла DOCX'
      }
    }
  };

  const currentContent = content[siteLanguage] || content.azerbaijani;

  // Toast notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // CV məlumatlarından tam ad əldə etmək üçün helper function
  const getFullNameFromCV = (cv: any) => {
    // cv.data və ya cv.cv_data yoxla
    const cvData = cv.data || cv.cv_data;
    const personalInfo = cvData?.personalInfo;
    
    if (!personalInfo) return cv.title || currentContent.steps[1].untitledCV;

    // Əvvəlcə fullName yoxla
    if (personalInfo.fullName && personalInfo.fullName.trim()) {
      return personalInfo.fullName.trim();
    }

    // Sonra firstName və lastName birləşdir
    if (personalInfo.firstName || personalInfo.lastName) {
      const firstName = personalInfo.firstName || '';
      const lastName = personalInfo.lastName || '';
      const combined = `${firstName} ${lastName}`.trim();
      if (combined) return combined;
    }

    // Son olaraq CV title və ya default
    return cv.title || currentContent.steps[1].untitledCV;
  };

  // CV-dən job title əldə etmək üçün helper function
  const getJobTitleFromCV = (cv: any) => {
    // cv.data və ya cv.cv_data yoxla
    const cvData = cv.data || cv.cv_data;
    const personalInfo = cvData?.personalInfo;
    
    if (!personalInfo) return currentContent.steps[1].noJobTitle;

    return personalInfo.jobTitle || 
           personalInfo.position || 
           personalInfo.profession || 
           currentContent.steps[1].noJobTitle;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // AI köməyi funksiyası
  const handleAIHelp = async () => {
    if (!formData.selectedCvId) {
      showNotification(currentContent.notifications.selectCV, 'error');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const selectedCV = cvs.find(cv => cv.id === formData.selectedCvId);
      // cv.data və ya cv.cv_data yoxla
      const cvData = selectedCV?.data || selectedCV?.cv_data;
      const personalInfo = cvData?.personalInfo;
      const experience = cvData?.experience || [];
      const education = cvData?.education || [];
      const skills = cvData?.skills || [];
      const certifications = cvData?.certifications || [];

      // Format experience for prompt
      const experienceText = experience.length > 0 
        ? experience.slice(0, 3).map((exp: any) => `${exp.position || exp.title} - ${exp.company} (${exp.startDate} - ${exp.endDate || 'Hazırda'})`).join(', ')
        : 'Məlumat yoxdur';

      // Format education for prompt
      const educationText = education.length > 0
        ? education.slice(0, 2).map((edu: any) => `${edu.degree} - ${edu.institution} (${edu.graduationDate || edu.endDate || 'Davam edir'})`).join(', ')
        : 'Məlumat yoxdur';

      // Format skills for prompt
      const skillsText = skills.length > 0
        ? skills.slice(0, 8).map((skill: any) => skill.name || skill.skill).filter(Boolean).join(', ')
        : 'Məlumat yoxdur';

      const prompts = {
        azerbaijani: `
          CV əsasında motivasiya məktubu üçün məzmun yarat. Məlumatlar:
          
          ŞƏXSİ MƏLUMATLAR:
          - Ad: ${personalInfo?.fullName || personalInfo?.firstName + ' ' + personalInfo?.lastName || 'Məlum deyil'}
          - Hazırkı vəzifə: ${personalInfo?.title || personalInfo?.jobTitle || personalInfo?.position || 'Məlum deyil'}
          - Xülasə: ${personalInfo?.summary ? personalInfo.summary.substring(0, 200) + '...' : 'Məlumat yoxdur'}
          
          İŞ TƏCRÜBƏSİ:
          ${experienceText}
          
          TƏHSİL:
          ${educationText}
          
          BACARIQLAR:
          ${skillsText}
          
          MÜRACIƏT MƏLUMATLARI:
          - Təşkilat: ${formData.organization || 'Təyin edilməyib'}
          - Vəzifə/Proqram: ${formData.position || 'Təyin edilməyib'}
          - Xüsusi proqram: ${formData.program || 'Təyin edilməyib'}
          - Şablon: ${formData.template}
          
          Bu məlumatları əsas götürərək professional və şəxsi motivasiya məktubu məzmununu AZƏRBAYCAN dilində yarat. Təcrübə və təhsil məlumatlarını konkret şəkildə istifadə et.
        `,
        english: `
          Create motivation letter content based on CV. Information:
          
          PERSONAL INFORMATION:
          - Name: ${personalInfo?.fullName || personalInfo?.firstName + ' ' + personalInfo?.lastName || 'Unknown'}
          - Current position: ${personalInfo?.title || personalInfo?.jobTitle || personalInfo?.position || 'Unknown'}
          - Summary: ${personalInfo?.summary ? personalInfo.summary.substring(0, 200) + '...' : 'No information'}
          
          WORK EXPERIENCE:
          ${experienceText}
          
          EDUCATION:
          ${educationText}
          
          SKILLS:
          ${skillsText}
          
          APPLICATION DETAILS:
          - Organization: ${formData.organization || 'Not specified'}
          - Position/Program: ${formData.position || 'Not specified'}
          - Specific program: ${formData.program || 'Not specified'}
          - Template: ${formData.template}
          
          Based on this information, create professional and personal motivation letter content in ENGLISH. Use the experience and education details specifically.
        `,
        russian: `
          Создайте содержание мотивационного письма на основе резюме. Информация:
          
          ЛИЧНАЯ ИНФОРМАЦИЯ:
          - Имя: ${personalInfo?.fullName || personalInfo?.firstName + ' ' + personalInfo?.lastName || 'Неизвестно'}
          - Текущая должность: ${personalInfo?.title || personalInfo?.jobTitle || personalInfo?.position || 'Неизвестно'}
          - Резюме: ${personalInfo?.summary ? personalInfo.summary.substring(0, 200) + '...' : 'Нет информации'}
          
          ОПЫТ РАБОТЫ:
          ${experienceText}
          
          ОБРАЗОВАНИЕ:
          ${educationText}
          
          НАВЫКИ:
          ${skillsText}
          
          ДЕТАЛИ ЗАЯВЛЕНИЯ:
          - Организация: ${formData.organization || 'Не указано'}
          - Должность/Программа: ${formData.position || 'Не указано'}
          - Конкретная программа: ${formData.program || 'Не указано'}
          - Шаблон: ${formData.template}
          
          На основе этой информации создайте профессиональное и личное содержание мотивационного письма на РУССКОМ языке. Конкретно используйте детали опыта и образования.
        `
      };

      const prompt = prompts[formData.letterLanguage as keyof typeof prompts];

      const response = await fetch('/api/ai/generate-motivation-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          prompt,
          template: formData.template,
          language: formData.letterLanguage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // AI cavabını form field-lərinə yazaq
        if (data.motivation) setFormData(prev => ({ ...prev, motivation: data.motivation }));
        if (data.goals) setFormData(prev => ({ ...prev, goals: data.goals }));
        if (data.qualifications) setFormData(prev => ({ ...prev, qualifications: data.qualifications }));
        if (data.conclusion) setFormData(prev => ({ ...prev, conclusion: data.conclusion }));
      } else {
        throw new Error('AI köməyi xətası');
      }
    } catch (error) {
      console.error('AI Help Error:', error);
      showNotification(currentContent.notifications.aiError, 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // DOCX faylı yükləmə funksiyası
  const downloadAsDOCX = async () => {
    if (!generatedLetter) return;
    
    try {
      // DOCX sənədi yaradırıq
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Başlıq
            new Paragraph({
              children: [
                new TextRun({
                  text: formData.letterLanguage === 'azerbaijani' ? 'Motivasiya Məktubu' : 
                        formData.letterLanguage === 'russian' ? 'Мотивационное письмо' : 
                        'Motivation Letter',
                  bold: true,
                  size: 32,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
              },
            }),
            
            // Məktub mətni
            ...generatedLetter.split('\n').map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line || ' ', // Boş sətir üçün boşluq əlavə et
                    size: 24,
                  }),
                ],
                spacing: {
                  after: 200,
                },
              })
            ),
          ],
        }],
      });

      // DOCX faylını generasiya et və yüklə
      const buffer = await Packer.toBuffer(doc);
      const uint8Array = new Uint8Array(buffer);
      const blob = new Blob([uint8Array], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `motivation-letter-${formData.organization.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('DOCX export error:', error);
      showNotification(currentContent.notifications.docxError, 'error');
    }
  };

  // Motivasiya məktubunu yaratma funksiyası
  const handleGenerate = async () => {
    // Form validation
    if (!formData.selectedCvId) {
      showNotification(currentContent.notifications.selectCV, 'error');
      return;
    }

    if (!formData.recipientName || !formData.organization || !formData.position) {
      showNotification(currentContent.notifications.fillRequired, 'error');
      return;
    }

    if (!formData.motivation || !formData.goals || !formData.qualifications || !formData.conclusion) {
      showNotification(currentContent.notifications.completeContent, 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedCV = cvs.find(cv => cv.id === formData.selectedCvId);
      // cv.data və ya cv.cv_data yoxla
      const cvData = selectedCV?.data || selectedCV?.cv_data;
      const personalInfo = cvData?.personalInfo;
      const experience = cvData?.experience || [];
      const education = cvData?.education || [];
      const skills = cvData?.skills || [];

      // Get relevant experience and education for the letter
      const relevantExperience = experience.slice(0, 2); // Last 2 experiences
      const relevantEducation = education.slice(0, 1); // Most recent education

      // Format the final motivation letter in selected language
      const letterTemplates = {
        azerbaijani: {
          greeting: 'Hörmətli',
          defaultRecipient: 'Hörmətli Cənab/Xanım',
          closing: 'Hörmətlə'
        },
        english: {
          greeting: 'Dear',
          defaultRecipient: 'Sir/Madam',
          closing: 'Sincerely'
        },
        russian: {
          greeting: 'Уважаемый',
          defaultRecipient: 'Уважаемые господа',
          closing: 'С уважением'
        }
      };

      const template = letterTemplates[formData.letterLanguage as keyof typeof letterTemplates];
      
      // Create additional context section based on CV data
      const createCVContext = () => {
        const sections = [];
        
        // Add experience context if available
        if (relevantExperience.length > 0) {
          const expText = formData.letterLanguage === 'azerbaijani' ? 
            'Mənim iş təcrübəm' : 
            formData.letterLanguage === 'russian' ? 
            'Мой опыт работы' : 
            'My professional experience';
          
          const expDetails = relevantExperience.map((exp: any) => 
            `${exp.position || exp.title} ${formData.letterLanguage === 'azerbaijani' ? 'vəzifəsində' : formData.letterLanguage === 'russian' ? 'в должности' : 'as'} ${exp.company}${exp.duration ? ` (${exp.duration})` : ''}`
          ).join(formData.letterLanguage === 'azerbaijani' ? ' və ' : formData.letterLanguage === 'russian' ? ' и ' : ' and ');
          
          sections.push(`${expText} ${expDetails}${formData.letterLanguage === 'azerbaijani' ? ' sahəsində məni bu müraciət üçün hazırlamışdır.' : formData.letterLanguage === 'russian' ? ' подготовили меня к этой заявке.' : ' has prepared me for this application.'}`);
        }
        
        // Add education context if available
        if (relevantEducation.length > 0) {
          const edu = relevantEducation[0];
          const eduText = formData.letterLanguage === 'azerbaijani' ? 
            'Təhsil sahəsində' : 
            formData.letterLanguage === 'russian' ? 
            'В области образования' : 
            'In terms of education';
          
          sections.push(`${eduText} ${edu.degree || edu.fieldOfStudy} ${formData.letterLanguage === 'azerbaijani' ? 'təhsilimi' : formData.letterLanguage === 'russian' ? 'образование' : 'degree'} ${edu.institution}${formData.letterLanguage === 'azerbaijani' ? '-də almışam.' : formData.letterLanguage === 'russian' ? ' получил в' : ' from'} ${edu.institution}.`);
        }
        
        return sections.length > 0 ? '\n\n' + sections.join(' ') : '';
      };
      
      // Get name from personal info with fallback
      const getFullName = () => {
        if (personalInfo?.fullName && personalInfo.fullName.trim()) {
          return personalInfo.fullName.trim();
        }
        
        const firstName = personalInfo?.firstName?.trim() || '';
        const lastName = personalInfo?.lastName?.trim() || '';
        
        if (firstName || lastName) {
          return `${firstName} ${lastName}`.trim();
        }
        
        return formData.letterLanguage === 'azerbaijani' ? 'Sizin Adınız' : 
               formData.letterLanguage === 'russian' ? 'Ваше имя' : 
               'Your Name';
      };
      
      const motivationLetter = `
${formData.recipientName ? `${formData.recipientName}` : ''}
${formData.recipientTitle ? `${formData.recipientTitle}` : ''}
${formData.organization}

${template.greeting} ${formData.recipientName || template.defaultRecipient},

${formData.motivation}

${formData.goals}

${formData.qualifications}${createCVContext()}

${formData.conclusion}

${template.closing},
${getFullName()}
${personalInfo?.email ? personalInfo.email : ''}
${personalInfo?.phone ? personalInfo.phone : ''}
      `.trim();

      setGeneratedLetter(motivationLetter);
      setStep(3); // Move to result step

    } catch (error) {
      console.error('Generate Error:', error);
      showNotification(currentContent.notifications.generateError, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const templates = [
    { id: 'academic', name: currentContent.templates.academic, icon: '🎓' },
    { id: 'scholarship', name: currentContent.templates.scholarship, icon: '💰' },
    { id: 'volunteer', name: currentContent.templates.volunteer, icon: '❤️' },
    { id: 'internship', name: currentContent.templates.internship, icon: '💼' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out transform">
          <div className={`rounded-lg shadow-lg p-4 max-w-md ${
            notification.type === 'error' ? 'bg-red-500 text-white' :
            notification.type === 'success' ? 'bg-green-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'error' && (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {notification.type === 'success' && (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className="ml-auto flex-shrink-0 inline-flex text-white hover:text-gray-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute left-0 top-0 flex items-center">
            {/* Ana səhifəyə qayıtma buttonu - yalnız step 1-də gizlət */}
            <button
              onClick={() => {
                if (step === 1) {
                  onBack(); // Go back to dashboard
                } else {
                  setStep(step - 1); // Go to previous step
                }
              }}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              {currentContent.backButton}
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentContent.title}
            </h1>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                {currentContent.steps[1].title}
              </h2>

              {/* Information Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  {currentContent.steps[1].note}
                </p>
              </div>

              {/* Template Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {currentContent.templates.title}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleInputChange('template', template.id)}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        formData.template === template.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-2">{template.icon}</div>
                      <div className="text-sm font-medium">{template.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* CV Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentContent.steps[1].selectCV}
                </label>
                {loadingCVs ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    {currentContent.steps[1].loadingCVs}
                  </div>
                ) : cvs.length === 0 ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-red-50 text-red-600">
                    {currentContent.steps[1].noCV}
                  </div>
                ) : (
                  <select
                    value={formData.selectedCvId}
                    onChange={(e) => handleInputChange('selectedCvId', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{currentContent.steps[1].selectCVPlaceholder}</option>
                    {cvs.map((cv, index) => {
                      // CV-nin title-ını istifadə et, yoxdursa default mətn göstər
                      const displayText = cv.title || currentContent.steps[1].untitledCV || 'Untitled CV';
                      
                      return (
                        <option key={cv.id} value={cv.id}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Letter Language Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  {siteLanguage === 'azerbaijani' ? 'Məktub Dili' : 
                   siteLanguage === 'russian' ? 'Язык письма' : 
                   'Letter Language'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'azerbaijani', name: 'Azərbaycan dili', flag: '/flagaz.png' },
                    { id: 'english', name: 'English', flag: '/flagusa.png' },
                    { id: 'russian', name: 'Русский язык', flag: '/flagrus.png' }
                  ].map((language) => (
                    <button
                      key={language.id}
                      type="button"
                      onClick={() => handleInputChange('letterLanguage', language.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-3 ${
                        formData.letterLanguage === language.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <span className="flex items-center">
                        <Image
                          src={language.flag}
                          alt={language.name}
                          width={32}
                          height={24}
                          className="rounded"
                        />
                      </span>
                      <span className="font-medium">{language.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {currentContent.steps[1].recipientInfo}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.steps[1].recipientName}
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    placeholder={currentContent.steps[1].recipientNamePlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.steps[1].recipientTitle}
                  </label>
                  <input
                    type="text"
                    value={formData.recipientTitle}
                    onChange={(e) => handleInputChange('recipientTitle', e.target.value)}
                    placeholder={currentContent.steps[1].recipientTitlePlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.steps[1].organization}
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    placeholder={currentContent.steps[1].organizationPlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.steps[1].position}
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder={currentContent.steps[1].positionPlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.steps[1].program}
                  </label>
                  <input
                    type="text"
                    value={formData.program}
                    onChange={(e) => handleInputChange('program', e.target.value)}
                    placeholder={currentContent.steps[1].programPlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                {currentContent.steps[2].title}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.steps[2].motivation}
                  </label>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    placeholder={currentContent.steps[2].motivationPlaceholder}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.steps[2].goals}
                  </label>
                  <textarea
                    value={formData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    placeholder={currentContent.steps[2].goalsPlaceholder}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.steps[2].qualifications}
                  </label>
                  <textarea
                    value={formData.qualifications}
                    onChange={(e) => handleInputChange('qualifications', e.target.value)}
                    placeholder={currentContent.steps[2].qualificationsPlaceholder}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.steps[2].conclusion}
                  </label>
                  <textarea
                    value={formData.conclusion}
                    onChange={(e) => handleInputChange('conclusion', e.target.value)}
                    placeholder={currentContent.steps[2].conclusionPlaceholder}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-end pt-8 mt-8 border-t">
            {step === 1 && (
              <button
                onClick={() => setStep(step + 1)}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                {currentContent.buttons.next}
              </button>
            )}
            
            {step === 2 && (
              <div className="flex space-x-4">
                <button
                  onClick={handleAIHelp}
                  disabled={isGeneratingAI}
                  className="flex items-center px-6 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  {isGeneratingAI ? currentContent.buttons.generatingAI : currentContent.buttons.aiHelp}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  {isGenerating ? (formData.letterLanguage === 'azerbaijani' ? 'Yaradılır...' : formData.letterLanguage === 'russian' ? 'Создается...' : 'Generating...') : currentContent.buttons.generate}
                </button>
              </div>
            )}

            {/* Step 3: Generated Letter */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                {/* Success Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {formData.letterLanguage === 'azerbaijani' ? 'Motivasiya Məktubunuz Hazırdır!' : 
                     formData.letterLanguage === 'russian' ? 'Ваше мотивационное письмо готово!' : 
                     'Your Motivation Letter is Ready!'}
                  </h2>
                  <p className="text-gray-600">
                    {formData.letterLanguage === 'azerbaijani' ? 'Məktubunuzu yoxlayın və lazım olan əməliyyatları həyata keçirin' : 
                     formData.letterLanguage === 'russian' ? 'Проверьте ваше письмо и выполните необходимые действия' : 
                     'Review your letter and take the necessary actions'}
                  </p>
                </div>

                {/* Action Buttons - Moved to top */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    {formData.letterLanguage === 'azerbaijani' ? 'Əməliyyatlar' : 
                     formData.letterLanguage === 'russian' ? 'Действия' : 
                     'Actions'}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Copy Button */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLetter);
                        // Show success feedback without alert
                        const button = event?.target as HTMLButtonElement;
                        const originalText = button.innerHTML;
                        button.innerHTML = `✅ ${formData.letterLanguage === 'azerbaijani' ? 'Kopyalandı' : 
                                                formData.letterLanguage === 'russian' ? 'Скопировано' : 
                                                'Copied'}`;
                        setTimeout(() => {
                          button.innerHTML = originalText;
                        }, 2000);
                      }}
                      className="group flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      {formData.letterLanguage === 'azerbaijani' ? 'Kopyala' : 
                       formData.letterLanguage === 'russian' ? 'Копировать' : 
                       'Copy'}
                    </button>
                    
                    {/* Download Button */}
                    <button
                      onClick={downloadAsDOCX}
                      className="group flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {formData.letterLanguage === 'azerbaijani' ? 'DOCX Endir' : 
                       formData.letterLanguage === 'russian' ? 'Скачать DOCX' : 
                       'Download DOCX'}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setStep(2);
                        setGeneratedLetter('');
                      }}
                      className="group flex items-center justify-center px-6 py-4 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {formData.letterLanguage === 'azerbaijani' ? 'Redaktə Et' : 
                       formData.letterLanguage === 'russian' ? 'Редактировать' : 
                       'Edit Letter'}
                    </button>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">
                          {formData.letterLanguage === 'azerbaijani' ? 'Tövsiyə:' : 
                           formData.letterLanguage === 'russian' ? 'Рекомендация:' : 
                           'Tip:'}
                        </p>
                        <p>
                          {formData.letterLanguage === 'azerbaijani' ? 'DOCX faylını yükləməklə Microsoft Word və ya Google Docs-da əlavə düzəlişlər edə bilərsiniz. Məktubu göndərməzdən əvvəl yenidən oxuyun.' : 
                           formData.letterLanguage === 'russian' ? 'Загрузите DOCX файл для редактирования в Microsoft Word или Google Docs. Перечитайте письмо перед отправкой.' : 
                           'Download the DOCX file to make additional edits in Microsoft Word or Google Docs. Review the letter before sending.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Letter Preview Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {formData.letterLanguage === 'azerbaijani' ? 'Motivasiya Məktubu' : 
                             formData.letterLanguage === 'russian' ? 'Мотивационное письмо' : 
                             'Motivation Letter'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formData.letterLanguage === 'azerbaijani' ? `${formData.organization} üçün` : 
                             formData.letterLanguage === 'russian' ? `Для ${formData.organization}` : 
                             `For ${formData.organization}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date().toLocaleDateString(
                          formData.letterLanguage === 'azerbaijani' ? 'az-AZ' :
                          formData.letterLanguage === 'russian' ? 'ru-RU' : 'en-US'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Letter Content */}
                  <div className="p-8">
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-8 min-h-96">
                      <pre className="whitespace-pre-wrap text-gray-800 font-serif text-base leading-relaxed tracking-wide">
                        {generatedLetter}
                      </pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
