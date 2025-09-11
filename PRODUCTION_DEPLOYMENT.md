# CVERA Production Deployment Guide

## 🚀 Production Hazırlığı

### 1. Environment Variables
Production-da aşağıdakı environment variables tələb olunur:

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-secure-jwt-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
```

### 2. Database Migration
```bash
# Production database-də migration
npx prisma migrate deploy
npx prisma generate
```

### 3. API Keys Setup
Production-da aşağıdakı API açarları tələb olunur:

#### A) ScrapingDog API Key
- Service: https://scrapingdog.com
- LinkedIn scraping üçün
- Admin panel: `/sistem/api-keys`

#### B) Gemini AI API Key  
- Service: https://ai.google.dev
- AI skills generation üçün
- Admin panel: `/sistem/api-keys`

## 🔧 Deployment Steps

### Vercel Deployment
1. **Environment Variables Əlavə Et:**
   ```
   DATABASE_URL=your_postgres_url
   JWT_SECRET=your_jwt_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

2. **Build və Deploy:**
   ```bash
   npm run build
   vercel deploy --prod
   ```

3. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   ```

4. **API Keys Əlavə Et:**
   - `/sistem/api-keys` səhifəsinə get
   - ScrapingDog və Gemini API açarlarını əlavə et

## 📊 Production Features

### ✅ Hazır Sistemlər
1. **Database-driven API Management**
   - API açarları SQL database-də saxlanılır
   - Avtomatik usage tracking
   - Priority-based key selection
   - Failover mechanism

2. **LinkedIn Import System**
   - ScrapingDog API integration
   - AI skills generation (Gemini)
   - Fallback skills mechanism
   - Complete profile import

3. **Error Handling**
   - API key rotation
   - Graceful degradation
   - Detailed logging
   - User-friendly error messages

### 🔐 Security Features
- JWT-based authentication
- API key encryption
- Rate limiting
- Input validation
- SQL injection protection

## 🔍 Production Testing

### LinkedIn Import Test
1. Production domain-də `/linkedin-import` səhifəsinə get
2. LinkedIn URL və ya username daxil et
3. Import prosesini izlə
4. CV-də skills-lərin əlavə olunduğunu yoxla

### API Keys Test
1. `/sistem/api-keys` admin panel
2. API açarlarının status-unu yoxla
3. Usage statistics-i izlə
4. Test import et

## 📈 Monitoring

### Database Monitoring
```sql
-- API keys status
SELECT service, active, "usageCount", "dailyLimit" 
FROM "ApiKey" 
ORDER BY service;

-- Daily usage
SELECT service, "dailyUsage", "lastUsed"
FROM "ApiKey"
WHERE active = true;
```

### Application Monitoring
- LinkedIn import success rate
- API response times
- Error rates
- User activity

## 🆘 Troubleshooting

### Common Issues
1. **API Key Invalid:**
   - Admin paneldən yeni açar əlavə et
   - Köhnə açarı deactivate et

2. **Database Connection:**
   - DATABASE_URL-i yoxla
   - Prisma migration çalıştır

3. **LinkedIn Import Failed:**
   - ScrapingDog API key yoxla
   - Fallback skills işləyir

### Support
- Admin Panel: `/sistem/api-keys`
- Logs: Vercel dashboard
- Database: PostgreSQL monitoring

---

**🎉 Production-da LinkedIn import sistemi tam avtomatik işləyir!**
