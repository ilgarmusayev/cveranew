'use client';

import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

export default function TermsPage() {
  const { siteLanguage } = useSiteLanguage();

  const termsContent = {
    azerbaijani: {
      title: 'İstifadə Şərtləri',
      lastUpdated: 'Son yenilənmə: 18 İyul 2025',
      sections: {
        acceptance: {
          title: '1. Şərtlərin Qəbulu',
          content: 'CVera platformasından istifadə etməklə, bu İstifadə Şərtlərini qəbul etmiş olursunuz. Əgər bu şərtlərlə razı deyilsinizsə, xidmətdən istifadə etməyin.'
        },
        serviceDescription: {
          title: '2. Xidmət Təsviri',
          content: 'CVera peşəkar CV yaratma platformasıdır. Xidmətimiz aşağıdakıları təmin edir:',
          features: [
            'CV yaratma və redaktə alətləri',
            'Müxtəlif CV şablonları',
            'LinkedIn profil inteqrasiyası',
            'PDF və DOCX formatında yükləmə',
            'Abunəlik əsaslı premium xüsusiyyətlər'
          ]
        },
        accountSecurity: {
          title: '3. Hesab Yaratma və Təhlükəsizlik',
          responsibility: {
            title: '3.1 Hesab Məsuliyyəti',
            items: [
              'Hesab məlumatlarınızın dəqiqliyinə görə məsuliyyət daşıyırsınız',
              'Parolunuzun təhlükəsizliyini təmin etməlisiniz',
              'Hesabınızda baş verən fəaliyyətlərə görə məsuliyyət daşıyırsınız'
            ]
          },
          limitations: {
            title: '3.2 Hesab Məhdudiyyətləri',
            items: [
              'Hər istifadəçi yalnız bir hesab yarada bilər',
              '16 yaşından kiçik istifadəçilər qeydiyyatdan keçə bilməz',
              'Yalan məlumat verməklə hesab yaratmaq qadağandır'
            ]
          }
        },
        usageRules: {
          title: '4. İstifadə Qaydaları',
          content: 'Platformadan istifadə edərkən aşağıdakılara riayət etməlisiniz:',
          rules: [
            'Qanuni məqsədlər üçün istifadə etmək',
            'Başqalarının hüquqlarına hörmət göstərmək',
            'Spam və zərərli kontentdən çəkinmək',
            'Platformanın təhlükəsizliyinə xələl gətirməmək',
            'Müəlliflik hüquqlarına riayət etmək'
          ]
        },
        prohibitedActivities: {
          title: '5. Qadağan Edilən Fəaliyyətlər',
          content: 'Aşağıdakı fəaliyyətlər qəti qadağandır:',
          activities: [
            'Sistemə hack etmək və ya zərər vermək',
            'Başqalarının hesablarına icazəsiz giriş',
            'Yalan və ya aldadıcı məlumat paylaşmaq',
            'Platformanı kommersiya məqsədləri üçün avtomatlaşdırmaq',
            'Fikri mülkiyyət hüquqlarını pozma'
          ]
        },
        subscriptionPayments: {
          title: '6. Abunəlik və Ödənişlər',
          plans: {
            title: '6.1 Abunəlik Planları',
            items: [
              'Pulsuz: Əsas funksiyalar, məhdud şablonlar',
              'Populyar: Premium şablonlar, LinkedIn inteqrasiyası',
              'Premium: Bütün funksiyalar, limitsiz CV'
            ]
          },
          paymentTerms: {
            title: '6.2 Ödəniş Şərtləri',
            items: [
              'Ödənişlər epoint.az vasitəsilə həyata keçirilir',
              'Abunəlik aylıq əsasda yenilənir',
              'İmtina halında 30 gün öncədən bildiriş lazımdır',
            ]
          }
        },
        intellectualProperty: {
          title: '7. Fikri Mülkiyyət',
          cveraRights: {
            title: '7.1 CVera Hüquqları',
            content: 'Platform, şablonlar, logo və bütün digər material CVera-nın fikri mülkiyyətidir.'
          },
          userContent: {
            title: '7.2 İstifadəçi Məzmunu',
            content: 'CV-nizdə yaratdığınız məzmun sizin mülkiyyətinizdir. CVera bu məzmunu xidmət göstərmək məqsədilə istifadə etmə hüququna malikdir.'
          }
        },
        serviceTermination: {
          title: '8. Xidmətin Dayandırılması',
          content: 'CVera bu şərtləri pozduğunuz halda hesabınızı dayandırmaq və ya silmək hüququnu özündə saxlayır. Aşağıdakı hallarda bu baş verə bilər:',
          reasons: [
            'İstifadə şərtlərinin pozulması',
            'Qanunsuz fəaliyyət',
            'Sistemə zərər verme cəhdi',
            'Ödəniş problemləri'
          ]
        },
        liabilityLimitation: {
          title: '9. Məsuliyyətin Məhdudlaşdırılması',
          content: 'CVera platforması "olduğu kimi" təqdim edilir. Xidmətdən istifadə nəticəsində yaranan birbaşa və ya dolayı zərərlərə görə məsuliyyət daşımırıq.'
        },
        privacy: {
          title: '10. Məxfilik',
          content: 'Şəxsi məlumatlarınızın emalı Məxfilik Siyasəti əsasında həyata keçirilir.',
          linkText: 'Məxfilik Siyasəti'
        },
        changes: {
          title: '11. Dəyişikliklər',
          content: 'Bu şərtlərdə dəyişikliklər edə bilərik. Əhəmiyyətli dəyişikliklər barədə 30 gün öncədən xəbərdarlıq edəcəyik.'
        },
        lawCourt: {
          title: '12. Qanun və Məhkəmə',
          content: 'Bu şərtlər Azərbaycan Respublikasının qanunları əsasında tənzimlənir. Mübahisələr Bakı məhkəmələrində həll edilir.'
        },
        contact: {
          title: '13. Əlaqə',
          content: 'İstifadə şərtləri ilə bağlı suallarınız varsa, bizimlə əlaqə saxlayın:',
          details: {
            email: 'E-poçt: support@cvera.net',
            phone: 'Telefon: +994 10 424 24 10',
            address: 'Ünvan: Bakı, Azərbaycan'
          }
        }
      }
    },
    english: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: July 18, 2025',
      sections: {
        acceptance: {
          title: '1. Acceptance of Terms',
          content: 'By using the CVera platform, you agree to these Terms of Service. If you do not agree with these terms, please do not use the service.'
        },
        serviceDescription: {
          title: '2. Service Description',
          content: 'CVera is a professional CV creation platform. Our service provides the following:',
          features: [
            'CV creation and editing tools',
            'Various CV templates',
            'LinkedIn profile integration',
            'PDF and DOCX format downloads',
            'Subscription-based premium features'
          ]
        },
        accountSecurity: {
          title: '3. Account Creation and Security',
          responsibility: {
            title: '3.1 Account Responsibility',
            items: [
              'You are responsible for the accuracy of your account information',
              'You must ensure the security of your password',
              'You are responsible for activities that occur in your account'
            ]
          },
          limitations: {
            title: '3.2 Account Limitations',
            items: [
              'Each user can only create one account',
              'Users under 16 years old cannot register',
              'Creating an account with false information is prohibited'
            ]
          }
        },
        usageRules: {
          title: '4. Usage Rules',
          content: 'When using the platform, you must comply with the following:',
          rules: [
            'Use for legal purposes',
            'Respect the rights of others',
            'Avoid spam and harmful content',
            'Do not compromise platform security',
            'Comply with copyright laws'
          ]
        },
        prohibitedActivities: {
          title: '5. Prohibited Activities',
          content: 'The following activities are strictly prohibited:',
          activities: [
            'Hacking or damaging the system',
            'Unauthorized access to others\' accounts',
            'Sharing false or misleading information',
            'Automating the platform for commercial purposes',
            'Violating intellectual property rights'
          ]
        },
        subscriptionPayments: {
          title: '6. Subscription and Payments',
          plans: {
            title: '6.1 Subscription Plans',
            items: [
              'Free: Basic features, limited templates',
              'Populyar: Premium templates, LinkedIn integration',
              'Premium: All features, unlimited CVs'
            ]
          },
          paymentTerms: {
            title: '6.2 Payment Terms',
            items: [
              'Payments are processed through epoint.az',
              'Subscription renews monthly',
              '30 days notice required for cancellation',
              'Refund policy is valid for 7 days'
            ]
          }
        },
        intellectualProperty: {
          title: '7. Intellectual Property',
          cveraRights: {
            title: '7.1 CVera Rights',
            content: 'The platform, templates, logo and all other materials are intellectual property of CVera.'
          },
          userContent: {
            title: '7.2 User Content',
            content: 'The content you create in your CV is your property. CVera has the right to use this content for service provision purposes.'
          }
        },
        serviceTermination: {
          title: '8. Service Termination',
          content: 'CVera reserves the right to suspend or delete your account if you violate these terms. This may occur in the following cases:',
          reasons: [
            'Violation of terms of service',
            'Illegal activity',
            'Attempt to damage the system',
            'Payment issues'
          ]
        },
        liabilityLimitation: {
          title: '9. Limitation of Liability',
          content: 'The CVera platform is provided "as is". We are not responsible for direct or indirect damages resulting from use of the service.'
        },
        privacy: {
          title: '10. Privacy',
          content: 'Processing of your personal data is carried out based on the Privacy Policy.',
          linkText: 'Privacy Policy'
        },
        changes: {
          title: '11. Changes',
          content: 'We may make changes to these terms. We will provide 30 days notice for significant changes.'
        },
        lawCourt: {
          title: '12. Law and Court',
          content: 'These terms are governed by the laws of the Republic of Azerbaijan. Disputes are resolved in Baku courts.'
        },
        contact: {
          title: '13. Contact',
          content: 'If you have questions about the terms of service, please contact us:',
          details: {
            email: 'Email: support@cvera.net',
            phone: 'Phone: +994 10 424 24 10',
            address: 'Address: Baku, Azerbaijan'
          }
        }
      }
    },
    russian: {
      title: 'Условия использования',
      lastUpdated: 'Последнее обновление: 18 июля 2025',
      sections: {
        acceptance: {
          title: '1. Принятие условий',
          content: 'Используя платформу CVera, вы соглашаетесь с данными Условиями использования. Если вы не согласны с этими условиями, пожалуйста, не используйте сервис.'
        },
        serviceDescription: {
          title: '2. Описание сервиса',
          content: 'CVera - это платформа для создания профессиональных резюме. Наш сервис предоставляет следующее:',
          features: [
            'Инструменты создания и редактирования резюме',
            'Различные шаблоны резюме',
            'Интеграция с профилем LinkedIn',
            'Загрузка в форматах PDF и DOCX',
            'Премиум-функции на основе подписки'
          ]
        },
        accountSecurity: {
          title: '3. Создание аккаунта и безопасность',
          responsibility: {
            title: '3.1 Ответственность за аккаунт',
            items: [
              'Вы несете ответственность за точность информации в аккаунте',
              'Вы должны обеспечить безопасность вашего пароля',
              'Вы несете ответственность за действия в вашем аккаунте'
            ]
          },
          limitations: {
            title: '3.2 Ограничения аккаунта',
            items: [
              'Каждый пользователь может создать только один аккаунт',
              'Пользователи младше 16 лет не могут регистрироваться',
              'Создание аккаунта с ложной информацией запрещено'
            ]
          }
        },
        usageRules: {
          title: '4. Правила использования',
          content: 'При использовании платформы вы должны соблюдать следующее:',
          rules: [
            'Использовать в законных целях',
            'Уважать права других',
            'Избегать спама и вредоносного контента',
            'Не нарушать безопасность платформы',
            'Соблюдать авторские права'
          ]
        },
        prohibitedActivities: {
          title: '5. Запрещенные действия',
          content: 'Следующие действия строго запрещены:',
          activities: [
            'Взлом или повреждение системы',
            'Несанкционированный доступ к чужим аккаунтам',
            'Распространение ложной или вводящей в заблуждение информации',
            'Автоматизация платформы в коммерческих целях',
            'Нарушение прав интеллектуальной собственности'
          ]
        },
        subscriptionPayments: {
          title: '6. Подписка и платежи',
          plans: {
            title: '6.1 Планы подписки',
            items: [
              'Бесплатный: Основные функции, ограниченные шаблоны',
              'Средний: Премиум шаблоны, интеграция LinkedIn',
              'Премиум: Все функции, неограниченные резюме'
            ]
          },
          paymentTerms: {
            title: '6.2 Условия оплаты',
            items: [
              'Платежи обрабатываются через epoint.az',
              'Подписка продлевается ежемесячно',
              'Требуется уведомление за 30 дней для отмены',
              'Политика возврата действует в течение 7 дней'
            ]
          }
        },
        intellectualProperty: {
          title: '7. Интеллектуальная собственность',
          cveraRights: {
            title: '7.1 Права CVera',
            content: 'Платформа, шаблоны, логотип и все другие материалы являются интеллектуальной собственностью CVera.'
          },
          userContent: {
            title: '7.2 Пользовательский контент',
            content: 'Контент, который вы создаете в своем резюме, является вашей собственностью. CVera имеет право использовать этот контент для целей предоставления услуг.'
          }
        },
        serviceTermination: {
          title: '8. Прекращение сервиса',
          content: 'CVera оставляет за собой право приостановить или удалить ваш аккаунт при нарушении этих условий. Это может произойти в следующих случаях:',
          reasons: [
            'Нарушение условий использования',
            'Незаконная деятельность',
            'Попытка повредить систему',
            'Проблемы с оплатой'
          ]
        },
        liabilityLimitation: {
          title: '9. Ограничение ответственности',
          content: 'Платформа CVera предоставляется "как есть". Мы не несем ответственности за прямой или косвенный ущерб в результате использования сервиса.'
        },
        privacy: {
          title: '10. Конфиденциальность',
          content: 'Обработка ваших персональных данных осуществляется в соответствии с Политикой конфиденциальности.',
          linkText: 'Политика конфиденциальности'
        },
        changes: {
          title: '11. Изменения',
          content: 'Мы можем вносить изменения в эти условия. О значительных изменениях мы будем уведомлять за 30 дней.'
        },
        lawCourt: {
          title: '12. Закон и суд',
          content: 'Эти условия регулируются законами Азербайджанской Республики. Споры разрешаются в судах Баку.'
        },
        contact: {
          title: '13. Контакт',
          content: 'Если у вас есть вопросы по условиям использования, свяжитесь с нами:',
          details: {
            email: 'Электронная почта: support@cvera.net',
            phone: 'Телефон: +994 10 424 24 10',
            address: 'Адрес: Баку, Азербайджан'
          }
        }
      }
    }
  };

  const content = termsContent[siteLanguage] || termsContent.azerbaijani;
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {content.title}
          </h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.acceptance.title}</h2>
              <p>
                {content.sections.acceptance.content}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.serviceDescription.title}</h2>
              <p>
                {content.sections.serviceDescription.content}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                {content.sections.serviceDescription.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.accountSecurity.title}</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">{content.sections.accountSecurity.responsibility.title}</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {content.sections.accountSecurity.responsibility.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <h3 className="text-lg font-medium text-gray-900 mt-4">{content.sections.accountSecurity.limitations.title}</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {content.sections.accountSecurity.limitations.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.usageRules.title}</h2>
              <p>{content.sections.usageRules.content}</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                {content.sections.usageRules.rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.prohibitedActivities.title}</h2>
              <p>{content.sections.prohibitedActivities.content}</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                {content.sections.prohibitedActivities.activities.map((activity, index) => (
                  <li key={index}>{activity}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.subscriptionPayments.title}</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">{content.sections.subscriptionPayments.plans.title}</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {content.sections.subscriptionPayments.plans.items.map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ul>

                <h3 className="text-lg font-medium text-gray-900 mt-4">{content.sections.subscriptionPayments.paymentTerms.title}</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {content.sections.subscriptionPayments.paymentTerms.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.intellectualProperty.title}</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">{content.sections.intellectualProperty.cveraRights.title}</h3>
                <p>
                  {content.sections.intellectualProperty.cveraRights.content}
                </p>

                <h3 className="text-lg font-medium text-gray-900 mt-4">{content.sections.intellectualProperty.userContent.title}</h3>
                <p>
                  {content.sections.intellectualProperty.userContent.content}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.serviceTermination.title}</h2>
              <p>
                {content.sections.serviceTermination.content}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                {content.sections.serviceTermination.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.liabilityLimitation.title}</h2>
              <p>
                {content.sections.liabilityLimitation.content}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.privacy.title}</h2>
              <p>
                {content.sections.privacy.content} <a href="/privacy" className="text-blue-600 hover:underline">
                {content.sections.privacy.linkText}</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.changes.title}</h2>
              <p>
                {content.sections.changes.content}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.lawCourt.title}</h2>
              <p>
                {content.sections.lawCourt.content}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{content.sections.contact.title}</h2>
              <p>
                {content.sections.contact.content}
              </p>
              <div className="mt-3 space-y-1">
                <p><strong>{content.sections.contact.details.email}</strong></p>
                <p><strong>{content.sections.contact.details.phone}</strong></p>
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
