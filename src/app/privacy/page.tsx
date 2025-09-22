'use client';

import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

export default function PrivacyPolicyPage() {
  const { siteLanguage } = useSiteLanguage();

  const privacyContent = {
    azerbaijani: {
      title: 'Məxfilik Siyasəti',
      lastUpdated: 'Son yenilənmə: 18 İyul 2025',
      sections: {
        introduction: {
          title: '1. Giriş',
          content: 'CVera platforması olaraq, istifadəçilərimizin məxfiliyini qorumaq bizim üçün önəmlidir. Bu Məxfilik Siyasəti sizin şəxsi məlumatlarınızın necə toplandığını, istifadə edildiyini və qorunduğunu izah edir.'
        },
        dataCollection: {
          title: '2. Topladığımız Məlumatlar',
          personalData: {
            title: '2.1 Şəxsi Məlumatlar',
            items: [
              'Ad və soyad',
              'E-poçt ünvanı',
              'Telefon nömrəsi',
              'İş təcrübəsi və təhsil məlumatları',
              'LinkedIn profil məlumatları (əgər əlaqələndirirsinizsə)'
            ]
          },
          technicalData: {
            title: '2.2 Texniki Məlumatlar',
            items: [
              'IP ünvanı',
              'Brauzer növü və versiyası',
              'Cihaz məlumatları',
              'Platformadan istifadə statistikaları'
            ]
          }
        },
        dataUsage: {
          title: '3. Məlumatların İstifadəsi',
          content: 'Topladığımız məlumatları aşağıdakı məqsədlər üçün istifadə edirik:',
          purposes: [
            'CV yaratma və redaktə xidmətlərinin təmin edilməsi',
            'Hesabınızın idarə edilməsi və təhlükəsizliyinin təmin edilməsi',
            'Müştəri dəstəyi və texniki yardımın göstərilməsi',
            'Xidmətlərimizin təkmilləşdirilməsi',
            'Qanuni öhdəliklərimizin yerinə yetirilməsi'
          ]
        },
        dataSharing: {
          title: '4. Məlumatların Paylaşılması',
          content: 'Şəxsi məlumatlarınızı üçüncü tərəflə paylaşmırıq, satmırıq və ya kirayə vermirik. İstisna hallar:',
          exceptions: [
            'Qanuni tələb olunduqda',
            'Xidmət göstərən tərəfdaşlarımızla (məsələn, ödəniş sistemləri)',
            'Sizin açıq razılığınızla'
          ]
        },
        dataSecurity: {
          title: '5. Məlumatların Təhlükəsizliyi',
          content: 'Şəxsi məlumatlarınızın təhlükəsizliyini təmin etmək üçün müasir şifrələmə texnologiyalarından və təhlükəsizlik tədbirlərindən istifadə edirik.'
        },
        cookiesAnalytics: {
          title: '6. Cookies və Analitika',
          content: 'Vebsaytımız cookies istifadə edir. Bu, istifadəçi təcrübəsini yaxşılaşdırmaq və analitika məlumatları toplamaq üçündür. Brauzer tənzimlərinizi dəyişərək cookies-ləri söndürə bilərsiniz.'
        },
        userRights: {
          title: '7. Sizin Hüquqlarınız',
          content: 'GDPR və digər məxfilik qanunları əsasında sizin aşağıdakı hüquqlarınız var:',
          rights: [
            'Şəxsi məlumatlarınıza giriş hüququ',
            'Məlumatların düzəldilməsi hüququ',
            'Məlumatların silinməsi hüququ',
            'Məlumatların portativliyi hüququ',
            'Emal prosesinin dayandırılması hüququ'
          ]
        },
        dataRetention: {
          title: '8. Məlumatların Saxlanma Müddəti',
          content: 'Şəxsi məlumatlarınızı yalnız zəruri olduğu müddətdə saxlayırıq. Hesabınızı silsəniz, məlumatlarınız 30 gün ərzində silinəcək.'
        },
        childrenPrivacy: {
          title: '9. Uşaqların Məxfiliyi',
          content: 'Xidmətimiz 16 yaşından kiçik uşaqlar üçün nəzərdə tutulmayıb. 16 yaşından kiçik uşaqlardan bilərəkdən şəxsi məlumat toplamırıq.'
        },
        changes: {
          title: '10. Dəyişikliklər',
          content: 'Bu Məxfilik Siyasətində dəyişikliklər edə bilərik. Əhəmiyyətli dəyişikliklər barədə e-poçt vasitəsilə məlumat verəcəyik.'
        },
        contact: {
          title: '11. Əlaqə',
          content: 'Məxfilik siyasəti ilə bağlı suallarınız varsa, bizimlə əlaqə saxlayın:',
          details: {
            email: 'E-poçt: contact@cvera.net',
            address: 'Ünvan: Bakı, Azərbaycan'
          }
        }
      }
    },
    english: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: July 18, 2025',
      sections: {
        introduction: {
          title: '1. Introduction',
          content: 'As the CVera platform, protecting the privacy of our users is important to us. This Privacy Policy explains how your personal information is collected, used and protected.'
        },
        dataCollection: {
          title: '2. Information We Collect',
          personalData: {
            title: '2.1 Personal Information',
            items: [
              'First and last name',
              'Email address',
              'Phone number',
              'Work experience and education information',
              'LinkedIn profile information (if you connect)'
            ]
          },
          technicalData: {
            title: '2.2 Technical Information',
            items: [
              'IP address',
              'Browser type and version',
              'Device information',
              'Platform usage statistics'
            ]
          }
        },
        dataUsage: {
          title: '3. Use of Information',
          content: 'We use the information we collect for the following purposes:',
          purposes: [
            'Providing CV creation and editing services',
            'Managing your account and ensuring security',
            'Providing customer support and technical assistance',
            'Improving our services',
            'Fulfilling our legal obligations'
          ]
        },
        dataSharing: {
          title: '4. Information Sharing',
          content: 'We do not share, sell or rent your personal information to third parties. Exceptions:',
          exceptions: [
            'When legally required',
            'With our service partners (e.g., payment systems)',
            'With your explicit consent'
          ]
        },
        dataSecurity: {
          title: '5. Data Security',
          content: 'We use modern encryption technologies and security measures to ensure the security of your personal information.'
        },
        cookiesAnalytics: {
          title: '6. Cookies and Analytics',
          content: 'Our website uses cookies. This is to improve user experience and collect analytics data. You can turn off cookies by changing your browser settings.'
        },
        userRights: {
          title: '7. Your Rights',
          content: 'Under GDPR and other privacy laws, you have the following rights:',
          rights: [
            'Right to access your personal data',
            'Right to rectification of data',
            'Right to erasure of data',
            'Right to data portability',
            'Right to object to processing'
          ]
        },
        dataRetention: {
          title: '8. Data Retention Period',
          content: 'We retain your personal information only for as long as necessary. If you delete your account, your data will be deleted within 30 days.'
        },
        childrenPrivacy: {
          title: '9. Children\'s Privacy',
          content: 'Our service is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.'
        },
        changes: {
          title: '10. Changes',
          content: 'We may make changes to this Privacy Policy. We will notify you of significant changes by email.'
        },
        contact: {
          title: '11. Contact',
          content: 'If you have questions about the privacy policy, please contact us:',
          details: {
            email: 'Email: contact@cvera.net',
            address: 'Address: Baku, Azerbaijan'
          }
        }
      }
    },
    russian: {
      title: 'Политика конфиденциальности',
      lastUpdated: 'Последнее обновление: 18 июля 2025',
      sections: {
        introduction: {
          title: '1. Введение',
          content: 'Как платформа CVera, защита конфиденциальности наших пользователей важна для нас. Данная Политика конфиденциальности объясняет, как собирается, используется и защищается ваша личная информация.'
        },
        dataCollection: {
          title: '2. Информация, которую мы собираем',
          personalData: {
            title: '2.1 Личная информация',
            items: [
              'Имя и фамилия',
              'Адрес электронной почты',
              'Номер телефона',
              'Информация о трудовом опыте и образовании',
              'Информация профиля LinkedIn (если вы подключаете)'
            ]
          },
          technicalData: {
            title: '2.2 Техническая информация',
            items: [
              'IP-адрес',
              'Тип и версия браузера',
              'Информация об устройстве',
              'Статистика использования платформы'
            ]
          }
        },
        dataUsage: {
          title: '3. Использование информации',
          content: 'Мы используем собираемую информацию для следующих целей:',
          purposes: [
            'Предоставление услуг создания и редактирования резюме',
            'Управление вашим аккаунтом и обеспечение безопасности',
            'Предоставление клиентской поддержки и технической помощи',
            'Улучшение наших услуг',
            'Выполнение наших правовых обязательств'
          ]
        },
        dataSharing: {
          title: '4. Передача информации',
          content: 'Мы не передаем, не продаем и не сдаем в аренду вашу личную информацию третьим лицам. Исключения:',
          exceptions: [
            'Когда это требуется по закону',
            'С нашими сервисными партнерами (например, платежные системы)',
            'С вашего явного согласия'
          ]
        },
        dataSecurity: {
          title: '5. Безопасность данных',
          content: 'Мы используем современные технологии шифрования и меры безопасности для обеспечения безопасности вашей личной информации.'
        },
        cookiesAnalytics: {
          title: '6. Cookies и аналитика',
          content: 'Наш веб-сайт использует cookies. Это для улучшения пользовательского опыта и сбора аналитических данных. Вы можете отключить cookies, изменив настройки браузера.'
        },
        userRights: {
          title: '7. Ваши права',
          content: 'В соответствии с GDPR и другими законами о конфиденциальности, у вас есть следующие права:',
          rights: [
            'Право доступа к вашим личным данным',
            'Право на исправление данных',
            'Право на удаление данных',
            'Право на переносимость данных',
            'Право возражать против обработки'
          ]
        },
        dataRetention: {
          title: '8. Срок хранения данных',
          content: 'Мы храним вашу личную информацию только столько, сколько необходимо. Если вы удалите свой аккаунт, ваши данные будут удалены в течение 30 дней.'
        },
        childrenPrivacy: {
          title: '9. Конфиденциальность детей',
          content: 'Наш сервис не предназначен для детей младше 16 лет. Мы сознательно не собираем личную информацию от детей младше 16 лет.'
        },
        changes: {
          title: '10. Изменения',
          content: 'Мы можем вносить изменения в данную Политику конфиденциальности. О значительных изменениях мы уведомим вас по электронной почте.'
        },
        contact: {
          title: '11. Контакт',
          content: 'Если у вас есть вопросы по политике конфиденциальности, свяжитесь с нами:',
          details: {
            email: 'Email: contact@cvera.net',
            address: 'Адрес: Баку, Азербайджан'
          }
        }
      }
    }
  };

  const content = privacyContent[siteLanguage] || privacyContent.azerbaijani;
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {content.title}
          </h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.introduction.title}</h2>
              <p>
                {content.sections.introduction.content}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.dataCollection.title}</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">{content.sections.dataCollection.personalData.title}</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {content.sections.dataCollection.personalData.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <h3 className="text-lg font-medium text-gray-900 mt-4">{content.sections.dataCollection.technicalData.title}</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {content.sections.dataCollection.technicalData.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.dataUsage.title}</h2>
              <p>{content.sections.dataUsage.content}</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                {content.sections.dataUsage.purposes.map((purpose, index) => (
                  <li key={index}>{purpose}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.dataSharing.title}</h2>
              <p>
                {content.sections.dataSharing.content}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                {content.sections.dataSharing.exceptions.map((exception, index) => (
                  <li key={index}>{exception}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.dataSecurity.title}</h2>
              <p>
                {content.sections.dataSecurity.content}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.cookiesAnalytics.title}</h2>
              <p>
                {content.sections.cookiesAnalytics.content}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.userRights.title}</h2>
              <p>{content.sections.userRights.content}</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                {content.sections.userRights.rights.map((right, index) => (
                  <li key={index}>{right}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.dataRetention.title}</h2>
              <p>
                {content.sections.dataRetention.content}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.childrenPrivacy.title}</h2>
              <p>
                {content.sections.childrenPrivacy.content}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.changes.title}</h2>
              <p>
                {content.sections.changes.content}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.contact.title}</h2>
              <p>
                {content.sections.contact.content}
              </p>
              <div className="mt-3 space-y-1">
                <p><strong>{content.sections.contact.details.email}</strong></p>
                <p><strong>{content.sections.contact.details.address}</strong></p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500">
                <strong>{content.lastUpdated}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
