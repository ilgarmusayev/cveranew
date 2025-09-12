#!/bin/bash
# Fix Prisma instance across all files

echo "🔄 Fixing Prisma instances to use singleton..."

# Find all TypeScript files that use PrismaClient
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    # Check if file contains PrismaClient import and instance creation
    if grep -q "import.*PrismaClient.*from.*@prisma/client" "$file" && grep -q "const prisma = new PrismaClient" "$file"; then
        echo "📝 Fixing $file"
        
        # Replace PrismaClient import with prisma singleton import
        sed -i 's/import { PrismaClient } from ".*@prisma\/client".*;/import { prisma } from "@\/lib\/prisma";/g' "$file"
        sed -i "s/import { PrismaClient } from '.*@prisma\/client'.*;/import { prisma } from '@\/lib\/prisma';/g" "$file"
        
        # Remove prisma instance creation
        sed -i '/const prisma = new PrismaClient();/d' "$file"
        sed -i '/const prisma = new PrismaClient()/d' "$file"
        
        # Handle cases where PrismaClient is imported with other imports
        sed -i 's/, PrismaClient//g' "$file"
        sed -i 's/PrismaClient, //g' "$file"
        sed -i 's/{ PrismaClient }/{ prisma }/g' "$file"
        
        echo "✅ Fixed $file"
    fi
done

echo "🔄 Fixing remaining files manually..."

# Some specific patterns that might be missed
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "new PrismaClient" | while read file; do
    echo "🔧 Manual fix needed for $file"
    sed -i '/new PrismaClient/d' "$file"
done

echo "✅ Prisma singleton fix completed!"
echo "📋 Files fixed:"
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "prisma.*from.*@/lib/prisma" | head -10
