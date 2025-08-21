#!/bin/bash

echo "=== LinkedIn OAuth Configuration Check ==="
echo "Checking environment variables..."

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✓ .env.local file exists"
    echo "LINKEDIN_REDIRECT_URI from .env.local:"
    grep "LINKEDIN_REDIRECT_URI" .env.local || echo "❌ LINKEDIN_REDIRECT_URI not found in .env.local"
else
    echo "❌ .env.local file not found"
fi

echo ""
echo "Expected values:"
echo "Production: LINKEDIN_REDIRECT_URI=https://cvera.net/api/auth/callback/linkedin"
echo "Development: LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/callback/linkedin"
echo ""
echo "=== Next Steps ==="
echo "1. Create or update .env.local with the correct LINKEDIN_REDIRECT_URI"
echo "2. Make sure the same URL is registered in your LinkedIn Developer App"
echo "3. Restart your development server after making changes"
