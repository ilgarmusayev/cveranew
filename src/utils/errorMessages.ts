import { SiteLanguage } from '@/contexts/SiteLanguageContext';

// Centralized error and notification messages for the entire site
export const errorMessages = {
  azerbaijani: {
    // Generic errors
    genericError: 'Xəta baş verdi',
    networkError: 'Şəbəkə xətası baş verdi',
    serverError: 'Server xətası baş verdi',
    unknownError: 'Naməlum xəta baş verdi',
    accessDenied: 'Giriş qadağandır',
    
    // Loading/Saving errors
    loadingError: 'Yüklənərkən xəta baş verdi',
    savingError: 'Saxlanılarkən xəta baş verdi',
    templateLoadError: 'Şablonlar yüklənərkən xəta baş verdi',
    
    // CV specific errors
    cvLoadError: 'CV yüklənərkən xəta baş verdi',
    cvSaveError: 'CV saxlanılarkən xəta baş verdi',
    cvExportError: 'CV ixrac zamanı xəta baş verdi',
    
    // Profile errors
    profileLoadError: 'Profil məlumatları yüklənərkən xəta baş verdi',
    profileUpdateError: 'Profil yenilənərkən xəta baş verdi',
    
    // Authentication errors
    loginError: 'Giriş zamanı xəta baş verdi',
    invalidCredentials: 'E-poçt və ya şifrə yanlışdır',
    emailNotVerified: 'E-poçt təsdiqlənməyib',
    accountNotFound: 'Hesab tapılmadı',
    emailRequired: 'E-poçt tələb olunur',
    passwordRequired: 'Şifrə tələb olunur',
    invalidEmail: 'Düzgün e-poçt ünvanı daxil edin',
    emailAlreadyExists: 'Bu e-poçt ünvanı artıq mövcuddur. Başqa e-poçt ünvanı istifadə edin.',
    passwordTooShort: 'Şifrə ən azı 8 hərf olmalıdır',
    passwordMismatch: 'Şifrələr uyğun gəlmir',
    termsRequired: 'İstifadə qaydalarını qəbul etməlisiniz',
    nameRequired: 'Ad tələb olunur',
    fieldRequired: 'Zəhmət olmasa bu sahəni doldurun',
    fieldRequiredValid: 'Zəhmət olmasa bu sahəni düzgün doldurun',
    registrationError: 'Qeydiyyat zamanı xəta baş verdi',
    emailVerificationError: 'E-poçt təsdiqi zamanı xəta baş verdi',
    passwordResetError: 'Şifrə sıfırlama zamanı xəta baş verdi',
    
    // Payment/Subscription errors
    paymentError: 'Ödəniş zamanı xəta baş verdi',
    subscriptionCancelError: 'Abunəlik ləğv edilərkən xəta baş verdi',
    
    // LinkedIn errors
    linkedinImportError: 'LinkedIn import xətası',
    linkedinLogoutError: 'LinkedIn çıxış pəncərəsi açıla bilmədi',
    
    // AI errors
    aiError: 'AI tövsiyələri alınarkən xəta baş verdi',
    aiGenerationError: 'AI bacarıq təsviri yaradarkən xəta baş verdi',
    
    // API errors
    apiKeyError: 'API key xətası',
    testError: 'Test xətası',
    
    // File export errors
    pdfExportError: 'PDF ixrac zamanı xəta baş verdi',
    docxExportError: 'DOCX ixrac zamanı xəta baş verdi',
    
    // Contact form errors
    contactFormError: 'Mesaj göndərilərkən xəta baş verdi',
    
    // Admin errors
    adminError: 'İdarəetmə panelində xəta baş verdi',
    userManagementError: 'İstifadəçi idarəetməsində xəta baş verdi',
    
    // Generic messages
    tryAgain: 'Yenidən cəhd et',
    tryAgainLater: 'Daha sonra yenidən cəhd edin',
    contactSupport: 'Dəstək ilə əlaqə saxlayın'
  },

  english: {
    // Generic errors
    genericError: 'An error occurred',
    networkError: 'Network error occurred',
    serverError: 'Server error occurred',
    unknownError: 'Unknown error occurred',
    accessDenied: 'Access denied',
    
    // Loading/Saving errors
    loadingError: 'Error occurred while loading',
    savingError: 'Error occurred while saving',
    templateLoadError: 'Error occurred while loading templates',
    
    // CV specific errors
    cvLoadError: 'Error occurred while loading CV',
    cvSaveError: 'Error occurred while saving CV',
    cvExportError: 'Error occurred while exporting CV',
    
    // Profile errors
    profileLoadError: 'Error occurred while loading profile data',
    profileUpdateError: 'Error occurred while updating profile',
    
    // Authentication errors
    loginError: 'Error occurred during login',
    invalidCredentials: 'Invalid email or password',
    emailNotVerified: 'Email not verified',
    accountNotFound: 'Account not found',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    invalidEmail: 'Please enter a valid email address',
    emailAlreadyExists: 'This email address already exists. Please use a different email address.',
    passwordTooShort: 'Password must be at least 8 characters long',
    passwordMismatch: 'Passwords do not match',
    termsRequired: 'You must accept the terms and conditions',
    nameRequired: 'Name is required',
    fieldRequired: 'Please fill out this field',
    fieldRequiredValid: 'Please fill out this field correctly',
    registrationError: 'Error occurred during registration',
    emailVerificationError: 'Error occurred during email verification',
    passwordResetError: 'Error occurred during password reset',
    
    // Payment/Subscription errors
    paymentError: 'Error occurred during payment',
    subscriptionCancelError: 'Error occurred while cancelling subscription',
    
    // LinkedIn errors
    linkedinImportError: 'LinkedIn import error',
    linkedinLogoutError: 'Could not open LinkedIn logout window',
    
    // AI errors
    aiError: 'Error occurred while getting AI recommendations',
    aiGenerationError: 'Error occurred while generating AI skill description',
    
    // API errors
    apiKeyError: 'API key error',
    testError: 'Test error',
    
    // File export errors
    pdfExportError: 'Error occurred during PDF export',
    docxExportError: 'Error occurred during DOCX export',
    
    // Contact form errors
    contactFormError: 'Error occurred while sending message',
    
    // Admin errors
    adminError: 'Error occurred in admin panel',
    userManagementError: 'Error occurred in user management',
    
    // Generic messages
    tryAgain: 'Try Again',
    tryAgainLater: 'Please try again later',
    contactSupport: 'Contact support'
  },

  russian: {
    // Generic errors
    genericError: 'Произошла ошибка',
    networkError: 'Ошибка сети',
    serverError: 'Ошибка сервера',
    unknownError: 'Неизвестная ошибка',
    accessDenied: 'Доступ запрещён',
    
    // Loading/Saving errors
    loadingError: 'Ошибка загрузки',
    savingError: 'Ошибка сохранения',
    templateLoadError: 'Ошибка загрузки шаблонов',
    
    // CV specific errors
    cvLoadError: 'Ошибка загрузки резюме',
    cvSaveError: 'Ошибка сохранения резюме',
    cvExportError: 'Ошибка экспорта резюме',
    
    // Profile errors
    profileLoadError: 'Ошибка загрузки профиля',
    profileUpdateError: 'Ошибка обновления профиля',
    
    // Authentication errors
    loginError: 'Ошибка входа в систему',
    invalidCredentials: 'Неверный email или пароль',
    emailNotVerified: 'Email не подтверждён',
    accountNotFound: 'Аккаунт не найден',
    emailRequired: 'Требуется email',
    passwordRequired: 'Требуется пароль',
    invalidEmail: 'Введите корректный email',
    emailAlreadyExists: 'Этот email уже существует. Используйте другой email.',
    passwordTooShort: 'Пароль должен содержать минимум 8 символов',
    passwordMismatch: 'Пароли не совпадают',
    termsRequired: 'Необходимо принять условия и положения',
    nameRequired: 'Требуется имя',
    fieldRequired: 'Пожалуйста, заполните это поле',
    fieldRequiredValid: 'Пожалуйста, заполните это поле правильно',
    registrationError: 'Ошибка регистрации',
    emailVerificationError: 'Ошибка подтверждения email',
    passwordResetError: 'Ошибка сброса пароля',
    
    // Payment/Subscription errors
    paymentError: 'Ошибка оплаты',
    subscriptionCancelError: 'Ошибка отмены подписки',
    
    // LinkedIn errors
    linkedinImportError: 'Ошибка импорта из Линкедин',
    linkedinLogoutError: 'Не удалось выйти из Линкедин',
    
    // AI errors
    aiError: 'Ошибка получения AI рекомендаций',
    aiGenerationError: 'Ошибка создания AI описания навыка',
    
    // API errors
    apiKeyError: 'Ошибка API ключа',
    testError: 'Ошибка теста',
    
    // File export errors
    pdfExportError: 'Ошибка экспорта PDF',
    docxExportError: 'Ошибка экспорта DOCX',
    
    // Contact form errors
    contactFormError: 'Ошибка отправки сообщения',
    
    // Admin errors
    adminError: 'Ошибка панели администратора',
    userManagementError: 'Ошибка управления пользователями',
    
    // Generic messages
    tryAgain: 'Попробовать ещё раз',
    tryAgainLater: 'Попробуйте позже',
    contactSupport: 'Обратитесь в поддержку'
  }
};

// Success messages for common operations
export const successMessages = {
  azerbaijani: {
    genericSuccess: 'Əməliyyat uğurla tamamlandı',
    saveSuccess: 'Uğurla saxlanıldı',
    updateSuccess: 'Uğurla yeniləndi',
    deleteSuccess: 'Uğurla silindi',
    createSuccess: 'Uğurla yaradıldı',
    cvSaveSuccess: 'CV uğurla saxlanıldı',
    cvUpdateSuccess: 'CV uğurla yeniləndi',
    cvCreateSuccess: 'CV uğurla yaradıldı',
    profileUpdateSuccess: 'Profil uğurla yeniləndi',
    subscriptionCancelSuccess: 'Abunəlik uğurla ləğv edildi',
    logoutSuccess: 'Uğurla çıxış etdiniz',
    linkedinLogoutSuccess: 'LinkedIn-dən də çıxış etdiniz',
    apiKeyDeleteSuccess: 'API key uğurla silindi',
    testSuccess: 'Test uğurla tamamlandı'
  },
  
  english: {
    genericSuccess: 'Operation completed successfully',
    saveSuccess: 'Saved successfully',
    updateSuccess: 'Updated successfully',
    deleteSuccess: 'Deleted successfully',
    createSuccess: 'Created successfully',
    cvSaveSuccess: 'CV saved successfully',
    cvUpdateSuccess: 'CV updated successfully',
    cvCreateSuccess: 'CV created successfully',
    profileUpdateSuccess: 'Profile updated successfully',
    subscriptionCancelSuccess: 'Subscription cancelled successfully',
    logoutSuccess: 'Logged out successfully',
    linkedinLogoutSuccess: 'Also logged out from LinkedIn',
    apiKeyDeleteSuccess: 'API key deleted successfully',
    testSuccess: 'Test completed successfully'
  },
  
  russian: {
    genericSuccess: 'Операция выполнена успешно',
    saveSuccess: 'Сохранено',
    updateSuccess: 'Обновлено',
    deleteSuccess: 'Удалено',
    createSuccess: 'Создано',
    cvSaveSuccess: 'Резюме сохранено',
    cvUpdateSuccess: 'Резюме обновлено',
    cvCreateSuccess: 'Резюме создано',
    profileUpdateSuccess: 'Профиль обновлён',
    subscriptionCancelSuccess: 'Подписка отменена',
    logoutSuccess: 'Выход выполнен',
    linkedinLogoutSuccess: 'Выход из Линкедин выполнен',
    apiKeyDeleteSuccess: 'API ключ удалён',
    testSuccess: 'Тест завершён'
  }
};

// Warning messages
export const warningMessages = {
  azerbaijani: {
    genericWarning: 'Diqqət!',
    unsavedChanges: 'Saxlanılmamış dəyişikliklər var',
    confirmDelete: 'Silməyə əminsizmi?',
    networkIssue: 'Şəbəkə problemi',
    sessionExpired: 'Sessiyanın müddəti bitmişdir'
  },
  
  english: {
    genericWarning: 'Warning!',
    unsavedChanges: 'You have unsaved changes',
    confirmDelete: 'Are you sure you want to delete?',
    networkIssue: 'Network issue',
    sessionExpired: 'Session has expired'
  },
  
  russian: {
    genericWarning: 'Внимание!',
    unsavedChanges: 'У вас есть несохраненные изменения',
    confirmDelete: 'Вы уверены, что хотите удалить?',
    networkIssue: 'Проблема с сетью',
    sessionExpired: 'Сессия истекла'
  }
};

// Info messages
export const infoMessages = {
  azerbaijani: {
    genericInfo: 'Məlumat',
    loading: 'Yüklənir...',
    processing: 'İşlənir...',
    saving: 'Saxlanılır...',
    redirecting: 'Yönləndirilir...',
    noData: 'Məlumat tapılmadı',
    empty: 'Boşdur'
  },
  
  english: {
    genericInfo: 'Info',
    loading: 'Loading...',
    processing: 'Processing...',
    saving: 'Saving...',
    redirecting: 'Redirecting...',
    noData: 'No data found',
    empty: 'Empty'
  },
  
  russian: {
    genericInfo: 'Информация',
    loading: 'Загружается...',
    processing: 'Обрабатывается...',
    saving: 'Сохраняется...',
    redirecting: 'Перенаправление...',
    noData: 'Данные не найдены',
    empty: 'Пусто'
  }
};

// Helper function to get localized message
export const getLocalizedMessage = (
  messageType: 'error' | 'success' | 'warning' | 'info',
  messageKey: string,
  siteLanguage: SiteLanguage
): string => {
  const messages = {
    error: errorMessages,
    success: successMessages,
    warning: warningMessages,
    info: infoMessages
  };

  const languageMessages = messages[messageType][siteLanguage] || messages[messageType].azerbaijani;
  const fallbackMessage = messageType === 'error' ? 'Xəta baş verdi' : 
                         messageType === 'success' ? 'Uğurla tamamlandı' :
                         messageType === 'warning' ? 'Diqqət!' : 'Məlumat';
  
  return (languageMessages as any)[messageKey] || fallbackMessage;
};

// Hook for easy access to localized messages
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

export const useLocalizedMessages = () => {
  const { siteLanguage } = useSiteLanguage();

  const getErrorMessage = (key: string) => getLocalizedMessage('error', key, siteLanguage);
  const getSuccessMessage = (key: string) => getLocalizedMessage('success', key, siteLanguage);
  const getWarningMessage = (key: string) => getLocalizedMessage('warning', key, siteLanguage);
  const getInfoMessage = (key: string) => getLocalizedMessage('info', key, siteLanguage);

  return {
    getErrorMessage,
    getSuccessMessage,
    getWarningMessage,
    getInfoMessage,
    messages: {
      error: errorMessages[siteLanguage] || errorMessages.azerbaijani,
      success: successMessages[siteLanguage] || successMessages.azerbaijani,
      warning: warningMessages[siteLanguage] || warningMessages.azerbaijani,
      info: infoMessages[siteLanguage] || infoMessages.azerbaijani
    }
  };
};