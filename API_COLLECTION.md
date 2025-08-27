# CVERA API Collection / CVERA API Kolleksiyası

Bu fayl CVERA layihəsinin bütün API endpoint-lərini təşkil edir və sıralayır.

## 📋 İçindəkilər / Table of Contents

1. [🔐 Authentication APIs](#authentication-apis)
2. [👤 User Management APIs](#user-management-apis)
3. [📄 CV Management APIs](#cv-management-apis)
4. [🎨 Template APIs](#template-apis)
5. [💳 Subscription & Payment APIs](#subscription--payment-apis)
6. [🔑 Admin & System APIs](#admin--system-apis)
7. [📊 Import & Export APIs](#import--export-apis)
8. [🤖 AI & LinkedIn APIs](#ai--linkedin-apis)
9. [🔧 Debug & Utility APIs](#debug--utility-apis)
10. [📞 Contact & Communication APIs](#contact--communication-apis)

---

## 🔐 Authentication APIs

### 1. User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ad Soyad",
  "email": "email@example.com",
  "password": "password123"
}
```

### 2. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "email@example.com",
  "password": "password123"
}
```

### 3. Token Verification
```http
GET /api/auth/token
Authorization: Bearer {token}
```

### 4. Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### 5. Revoke All Tokens
```http
POST /api/auth/revoke
Authorization: Bearer {token}
```

---

## 👤 User Management APIs

### 1. Get User Profile
```http
GET /api/user/profile
Authorization: Bearer {token}
```

### 2. Update User Profile
```http
PUT /api/user/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Yeni Ad",
  "email": "yeni@email.com",
  "currentPassword": "köhnə_şifrə",
  "newPassword": "yeni_şifrə"
}
```

### 3. Get Current User Info
```http
GET /api/users/me
Authorization: Bearer {token}
```

### 4. Get User Limits
```http
GET /api/user/limits
Authorization: Bearer {token}
```

### 5. Get LinkedIn Data
```http
GET /api/user/linkedin-data
Authorization: Bearer {token}
```

---

## 📄 CV Management APIs

### 1. Get All CVs
```http
GET /api/cvs
Authorization: Bearer {token}
```

### 2. Create New CV
```http
POST /api/cvs
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "CV Başlığı",
  "templateId": "basic",
  "cv_data": {
    "personalInfo": {...},
    "experience": [...],
    "education": [...]
  }
}
```

### 3. Get Specific CV
```http
GET /api/cv/{id}
Authorization: Bearer {token}
```

### 4. Update CV
```http
PUT /api/cv/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Yenilənmiş başlıq",
  "cv_data": {...}
}
```

### 5. Delete CV
```http
DELETE /api/cv/{id}
Authorization: Bearer {token}
```

### 6. Get CVs (Alternative endpoint)
```http
GET /api/cvs/{id}
Authorization: Bearer {token}
```

### 7. Update CVs (Alternative endpoint)
```http
PUT /api/cvs/{id}
Authorization: Bearer {token}
```

### 8. Delete CVs (Alternative endpoint)
```http
DELETE /api/cvs/{id}
Authorization: Bearer {token}
```

---

## 🎨 Template APIs

### 1. Get All Templates
```http
GET /api/templates
Authorization: Bearer {token}
```

### 2. Get Template by ID
```http
GET /api/templates/{id}
Authorization: Bearer {token}
```

---

## 💳 Subscription & Payment APIs

### 1. Create Subscription
```http
POST /api/subscription/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "planType": "premium",
  "paymentMethod": "card"
}
```

### 2. Cancel Subscription
```http
POST /api/subscriptions/cancel
Authorization: Bearer {token}
```

### 3. Upgrade Subscription
```http
POST /api/subscriptions/upgrade
Authorization: Bearer {token}
Content-Type: application/json

{
  "newPlan": "professional"
}
```

### 4. Validate Promo Code
```http
POST /api/promo-code/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "PROMO2024"
}
```

### 5. Apply Promo Code
```http
POST /api/promo-code/apply
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "PROMO2024"
}
```

### 6. Payment Webhooks - Epoint
```http
POST /api/webhooks/epoint
Content-Type: application/json

{
  "transactionId": "12345",
  "status": "success",
  "amount": 29.99
}
```

### 7. Payment Webhooks - Epointaz
```http
POST /api/webhooks/epointaz
Content-Type: application/json

{
  "order_id": "order_123",
  "status": "paid"
}
```

---

## 🔑 Admin & System APIs

### 1. Admin Login
```http
POST /api/system/auth/login
Content-Type: application/json

{
  "email": "admin@cvera.net",
  "password": "admin_password"
}
```

### 2. Get System Users
```http
GET /api/system/users
Authorization: Bearer {admin_token}
```

### 3. Get User Limits (Admin)
```http
GET /api/users/limits
Authorization: Bearer {admin_token}
```

### 4. Get API Keys
```http
GET /api/system/api-keys
Authorization: Bearer {admin_token}
```

### 5. Add API Key
```http
POST /api/system/api-keys
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "service": "linkedin",
  "apiKey": "api_key_value",
  "provider": "ScrapingDog",
  "priority": 1
}
```

### 6. Admin API Keys Management
```http
GET /api/admin/api-keys
Authorization: Bearer {admin_token}
```

### 7. Delete API Key
```http
DELETE /api/admin/api-keys
Authorization: Bearer {admin_token}
```

### 8. System API Keys (Alternative)
```http
GET /api/sistem/api-keys
Authorization: Bearer {admin_token}
```

### 9. Add System API Key
```http
POST /api/sistem/api-keys
Authorization: Bearer {admin_token}
```

### 10. Update System API Key
```http
PUT /api/sistem/api-keys
Authorization: Bearer {admin_token}
```

### 11. Delete System API Key
```http
DELETE /api/sistem/api-keys?id={keyId}
Authorization: Bearer {admin_token}
```

---

## 📊 Import & Export APIs

### 1. Create Import Session
```http
POST /api/import/session
Authorization: Bearer {token}
Content-Type: application/json

{
  "source": "linkedin",
  "profileUrl": "https://linkedin.com/in/username"
}
```

### 2. Get Import Session
```http
GET /api/import/session?session={sessionId}
Authorization: Bearer {token}
```

### 3. Delete Import Session
```http
DELETE /api/import/session?session={sessionId}
Authorization: Bearer {token}
```

### 4. Export CV to PDF
```http
POST /api/cv/export/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "pdf",
  "templateId": "modern"
}
```

### 5. Get Job Status
```http
GET /api/jobs/{jobId}/status
Authorization: Bearer {token}
```

### 6. Get Job Result
```http
GET /api/jobs/{jobId}/result
Authorization: Bearer {token}
```

---

## 🤖 AI & LinkedIn APIs

### 1. Generate AI Summary
```http
POST /api/ai/summary
Authorization: Bearer {token}
Content-Type: application/json

{
  "experience": [...],
  "skills": [...],
  "language": "az"
}
```

### 2. LinkedIn Profile Import
```http
POST /api/linkedin/import
Authorization: Bearer {token}
Content-Type: application/json

{
  "profileUrl": "https://linkedin.com/in/username"
}
```

### 3. Get LinkedIn OAuth URL
```http
GET /api/linkedin/auth
Authorization: Bearer {token}
```

### 4. LinkedIn OAuth Callback
```http
GET /api/linkedin/callback?code={auth_code}&state={state}
Authorization: Bearer {token}
```

---

## 🔧 Debug & Utility APIs

### 1. Debug ScrapingDog API Status
```http
GET /api/debug/scrapingdog-api
Authorization: Bearer {admin_token}
```

### 2. Test ScrapingDog API with Profile
```http
POST /api/debug/scrapingdog-api
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "testProfile": "musayevcreate"
}
```

### 3. Cancel Expired Subscriptions (Cron)
```http
POST /api/cron/cancel-expired-subscriptions
Authorization: Bearer {system_token}
```

### 4. Cancel Expired Subscriptions (Manual Test)
```http
GET /api/cron/cancel-expired-subscriptions
Authorization: Bearer {admin_token}
```

---

## 📞 Contact & Communication APIs

### 1. Send Contact Message
```http
POST /api/contact
Content-Type: application/json

{
  "name": "Ad Soyad",
  "email": "email@example.com",
  "subject": "Mövzu",
  "message": "Mesaj məzmunu"
}
```

---

## 🔧 API Konfiqurasiya Məlumatları

### Base URL
```
Production: https://cvera.net
Development: http://localhost:3000
```

### Authentication
- Bearer token istifadə edilir
- Token header-də göndərilir: `Authorization: Bearer {token}`
- Admin endpoint-ləri üçün admin token tələb olunur

### Content Types
- JSON requests: `Content-Type: application/json`
- File uploads: `Content-Type: multipart/form-data`

### Error Responses
```json
{
  "error": "Xəta mesajı",
  "errorCode": "ERROR_CODE",
  "status": 400
}
```

### Success Responses
```json
{
  "success": true,
  "data": {...},
  "message": "Uğur mesajı"
}
```

---

## 📝 Qeydlər

1. **Rate Limiting**: Bəzi endpoint-lər üçün rate limiting tətbiq edilib
2. **Pagination**: Siyahı endpoint-ləri pagination dəstəkləyir
3. **Filtering**: Axtarış və filtrleme parametrləri dəstəklənir
4. **Validation**: Bütün input-lar server tərəfində validate edilir
5. **Security**: CORS, CSRF protection və input sanitization tətbiq edilib

---

## 🏷️ Tags

- `Authentication` - İstifadəçi doğrulama
- `User Management` - İstifadəçi idarəetməsi  
- `CV Operations` - CV əməliyyatları
- `Admin Panel` - Admin paneli
- `Payment` - Ödəniş sistemi
- `AI Integration` - AI inteqrasiyası
- `LinkedIn Import` - LinkedIn idxalı
- `File Export` - Fayl ixracı
- `Debug Tools` - Debug alətləri

---

*Son yenilənmə: 27 Avqust 2025*
*Layihə: CVERA - CV Generator Platform*
