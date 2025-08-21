'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            İstifadə Şərtləri
          </h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Şərtlərin Qəbulu</h2>
              <p>
                CVera platformasından istifadə etməklə, bu İstifadə Şərtlərini qəbul etmiş olursunuz. 
                Əgər bu şərtlərlə razı deyilsinizsə, xidmətdən istifadə etməyin.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Xidmət Təsviri</h2>
              <p>
                CVera peşəkar CV yaratma platformasıdır. Xidmətimiz aşağıdakıları təmin edir:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>CV yaratma və redaktə alətləri</li>
                <li>Müxtəlif CV şablonları</li>
                <li>LinkedIn profil inteqrasiyası</li>
                <li>PDF və DOCX formatında yükləmə</li>
                <li>Abunəlik əsaslı premium xüsusiyyətlər</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Hesab Yaratma və Təhlükəsizlik</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">3.1 Hesab Məsuliyyəti</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Hesab məlumatlarınızın dəqiqliyinə görə məsuliyyət daşıyırsınız</li>
                  <li>Parolunuzun təhlükəsizliyini təmin etməlisiniz</li>
                  <li>Hesabınızda baş verən fəaliyyətlərə görə məsuliyyət daşıyırsınız</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900 mt-4">3.2 Hesab Məhdudiyyətləri</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Hər istifadəçi yalnız bir hesab yarada bilər</li>
                  <li>16 yaşından kiçik istifadəçilər qeydiyyatdan keçə bilməz</li>
                  <li>Yalan məlumat verməklə hesab yaratmaq qadağandır</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. İstifadə Qaydaları</h2>
              <p>Platformadan istifadə edərkən aşağıdakılara riayət etməlisiniz:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Qanuni məqsədlər üçün istifadə etmək</li>
                <li>Başqalarının hüquqlarına hörmət göstərmək</li>
                <li>Spam və zərərli kontentdən çəkinmək</li>
                <li>Platformanın təhlükəsizliyinə xələl gətirməmək</li>
                <li>Müəlliflik hüquqlarına riayət etmək</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Qadağan Edilən Fəaliyyətlər</h2>
              <p>Aşağıdakı fəaliyyətlər qəti qadağandır:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Sistemə hack etmək və ya zərər vermək</li>
                <li>Başqalarının hesablarına icazəsiz giriş</li>
                <li>Yalan və ya aldadıcı məlumat paylaşmaq</li>
                <li>Platformanı kommersiya məqsədləri üçün avtomatlaşdırmaq</li>
                <li>Fikri mülkiyyət hüquqlarını pozma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Abunəlik və Ödənişlər</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">6.1 Abunəlik Planları</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Pulsuz:</strong> Əsas funksiyalar, məhdud şablonlar</li>
                  <li><strong>Medium:</strong> Premium şablonlar, LinkedIn inteqrasiyası</li>
                  <li><strong>Premium:</strong> Bütün funksiyalar, limitsiz CV</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900 mt-4">6.2 Ödəniş Şərtləri</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Ödənişlər epoint.az vasitəsilə həyata keçirilir</li>
                  <li>Abunəlik aylıq əsasda yenilənir</li>
                  <li>İmtina halında 30 gün öncədən bildiriş lazımdır</li>
                  <li>Geri qaytarma siyasəti 7 gün ərzində keçərlidir</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Fikri Mülkiyyət</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">7.1 CVera Hüquqları</h3>
                <p>
                  Platform, şablonlar, logo və bütün digər material CVera-nın fikri mülkiyyətidir.
                </p>

                <h3 className="text-lg font-medium text-gray-900 mt-4">7.2 İstifadəçi Məzmunu</h3>
                <p>
                  CV-nizdə yaratdığınız məzmun sizin mülkiyyətinizdir. CVera bu məzmunu 
                  xidmət göstərmək məqsədilə istifadə etmə hüququna malikdir.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Xidmətin Dayandırılması</h2>
              <p>
                CVera bu şərtləri pozduğunuz halda hesabınızı dayandırmaq və ya 
                silmək hüququnu özündə saxlayır. Aşağıdakı hallarda bu baş verə bilər:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>İstifadə şərtlərinin pozulması</li>
                <li>Qanunsuz fəaliyyət</li>
                <li>Sistemə zərər verme cəhdi</li>
                <li>Ödəniş problemləri</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Məsuliyyətin Məhdudlaşdırılması</h2>
              <p>
                CVera platforması "olduğu kimi" təqdim edilir. Xidmətdən istifadə 
                nəticəsində yaranan birbaşa və ya dolayı zərərlərə görə məsuliyyət daşımırıq.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Məxfilik</h2>
              <p>
                Şəxsi məlumatlarınızın emalı <a href="/privacy" className="text-blue-600 hover:underline">
                Məxfilik Siyasəti</a> əsasında həyata keçirilir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Dəyişikliklər</h2>
              <p>
                Bu şərtlərdə dəyişikliklər edə bilərik. Əhəmiyyətli dəyişikliklər 
                barədə 30 gün öncədən xəbərdarlıq edəcəyik.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Qanun və Məhkəmə</h2>
              <p>
                Bu şərtlər Azərbaycan Respublikasının qanunları əsasında tənzimlənir. 
                Mübahisələr Bakı məhkəmələrində həll edilir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Əlaqə</h2>
              <p>
                İstifadə şərtləri ilə bağlı suallarınız varsa, bizimlə əlaqə saxlayın:
              </p>
              <div className="mt-3 space-y-1">
                <p><strong>E-poçt:</strong> support@cvera.net</p>
                <p><strong>Telefon:</strong> +994 XX XXX XX XX</p>
                <p><strong>Ünvan:</strong> Bakı, Azərbaycan</p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500">
                <strong>Son yenilənmə:</strong> 18 İyul 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
