# Vercel Environment Variables Setup

## IMPORTANT: Add these to Vercel Dashboard

Bu environment variable-ları Vercel dashboard-da əlavə etməlisiniz:

### Database
```
DATABASE_URL=postgres://admincvera:ilqarilqar1M%40@cvera.postgres.database.azure.com:5432/cvera?sslmode=require
```

### LinkedIn OAuth
```
LINKEDIN_CLIENT_ID=78gi6jtz8ue28i
LINKEDIN_CLIENT_SECRET=WPL_AP1.tYUQHKB0hjwn5uFV.JqoY8g==
LINKEDIN_REDIRECT_URI=https://cvera.net/api/auth/linkedin/callback
```

### JWT Configuration
```
JWT_SECRET=az8V!hjkJHKL1231jklADJKU2389@qweTFD
JWT_REFRESH_SECRET=refresh_az8V!hjkJHKL1231jklADJKU2389@qweTFD
```

### ePoint Payment System - YENİ API KEYLƏR
```
EPOINT_PUBLIC_KEY=i000200972
EPOINT_PRIVATE_KEY=9qxuQJ3zKMbYULubixGWcwJ1
EPOINT_WEBHOOK_SECRET=epoint-webhook-secret-2024
EPOINT_DEVELOPMENT_MODE=false
EPOINT_MERCHANT_ID=i000200972
```

### ScrapingDog API (LinkedIn Import)
```
SCRAPINGDOG_API_KEY=6882894b855f5678d36484c8
```

### Gemini AI Keys
```
GEMINI_API_KEY=AIzaSyCPw5lA9c4huYqnZ_8gCYMAqUexGVTJGJ4
GEMINI_API_KEY_2=AIzaSyAhbsqb2hE-8LkgxhEb3b9KjXQlI7hTnUE
GEMINI_API_KEY_3=AIzaSyDUwC7l8xO5xKLG-EXAMPLE-PRODUCTION-KEY
```

### Email Configuration
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=no-reply@cvera.net
SMTP_PASS=Cvera2024!
EMAIL_FROM=no-reply@cvera.net
EMAIL_FROM_NAME=CVERA
```

### Features
```
FEATURE_PREMIUM_TEMPLATES=true
FEATURE_AI_SUGGESTIONS=true
```

## Pricing Update - Completed ✅

- Popular Plan: 2.99 AZN
- Premium Plan: 4.99 AZN

## How to add to Vercel:

1. Go to your Vercel dashboard
2. Select your project (cveranew)
3. Go to Settings > Environment Variables
4. Add each variable above
5. Make sure to set them for Production, Preview, and Development environments
6. Redeploy your application

## Payment System Status ✅

ePoint API keys have been updated and are ready for production use.
