#!/bin/bash

echo "🚀 CVERA Production Deployment Script"
echo "====================================="

# 1. Environment Check
echo ""
echo "1️⃣ Environment Variables yoxlanılır..."

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable tələb olunur"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET environment variable tələb olunur" 
    exit 1
fi

echo "✅ Environment variables hazırdır"

# 2. Dependencies
echo ""
echo "2️⃣ Dependencies yüklənir..."
npm install

# 3. Prisma Database Migration
echo ""
echo "3️⃣ Database migration işə salınır..."
npx prisma generate
npx prisma migrate deploy

# 4. Build Application
echo ""
echo "4️⃣ Application build edilir..."
npm run build

# 5. Production Readiness Check
echo ""
echo "5️⃣ Production hazırlığı yoxlanılır..."
node check-production-readiness.js

echo ""
echo "🎉 Production deployment tamamlandı!"
echo ""
echo "📋 Növbəti addımlar:"
echo "   1. /sistem/api-keys səhifəsinə gedin"
echo "   2. ScrapingDog API açarını əlavə edin"
echo "   3. Gemini AI API açarını əlavə edin"
echo "   4. LinkedIn import funksiyasını test edin"
echo ""
echo "🔗 Admin Panel: https://yourdomain.com/sistem/api-keys"
