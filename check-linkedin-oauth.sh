#!/bin/bash

echo "=== LinkedIn OAuth Configuration Check ==="
echo ""

# Check if environment variables are set
if [ -z "$LINKEDIN_CLIENT_ID" ]; then
    echo "❌ LINKEDIN_CLIENT_ID is not set"
else
    echo "✅ LINKEDIN_CLIENT_ID is set: ${LINKEDIN_CLIENT_ID:0:10}..."
fi

if [ -z "$LINKEDIN_CLIENT_SECRET" ]; then
    echo "❌ LINKEDIN_CLIENT_SECRET is not set"
else
    echo "✅ LINKEDIN_CLIENT_SECRET is set: ${LINKEDIN_CLIENT_SECRET:0:10}..."
fi

if [ -z "$LINKEDIN_REDIRECT_URI" ]; then
    echo "❌ LINKEDIN_REDIRECT_URI is not set"
else
    echo "✅ LINKEDIN_REDIRECT_URI is set: $LINKEDIN_REDIRECT_URI"
fi

echo ""
echo "Expected redirect URI should be: https://cvera.net/api/auth/linkedin/callback"
echo ""

# Test if the callback route exists
if [ -f "src/app/api/auth/linkedin/callback/route.ts" ]; then
    echo "✅ LinkedIn callback route exists"
else
    echo "❌ LinkedIn callback route missing"
fi

if [ -f "src/app/api/auth/linkedin/route.ts" ]; then
    echo "✅ LinkedIn auth route exists"
else
    echo "❌ LinkedIn auth route missing"
fi

echo ""
echo "=== Next Steps ==="
echo "1. Ensure LINKEDIN_REDIRECT_URI=https://cvera.net/api/auth/linkedin/callback"
echo "2. In LinkedIn Developer Console, add this exact redirect URI"
echo "3. Test the authentication flow"
