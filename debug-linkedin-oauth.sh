#!/bin/bash

echo "🔍 LinkedIn OAuth Debug Test"
echo "==============================="
echo

# Test environment variables
echo "📋 Environment Variables:"
if [ -n "$LINKEDIN_CLIENT_ID" ]; then
    echo "✅ LINKEDIN_CLIENT_ID: ${LINKEDIN_CLIENT_ID}"
else
    echo "❌ LINKEDIN_CLIENT_ID: NOT SET"
fi

if [ -n "$LINKEDIN_CLIENT_SECRET" ]; then
    echo "✅ LINKEDIN_CLIENT_SECRET: SET (hidden)"
else
    echo "❌ LINKEDIN_CLIENT_SECRET: NOT SET"
fi

if [ -n "$LINKEDIN_REDIRECT_URI" ]; then
    echo "✅ LINKEDIN_REDIRECT_URI: ${LINKEDIN_REDIRECT_URI}"
else
    echo "❌ LINKEDIN_REDIRECT_URI: NOT SET"
fi

echo
echo "📁 Route Files:"
if [ -f "src/app/api/auth/linkedin/route.ts" ]; then
    echo "✅ Auth route exists: /api/auth/linkedin"
else
    echo "❌ Auth route missing: /api/auth/linkedin"
fi

if [ -f "src/app/api/auth/linkedin/callback/route.ts" ]; then
    echo "✅ Callback route exists: /api/auth/linkedin/callback"
else
    echo "❌ Callback route missing: /api/auth/linkedin/callback"
fi

echo
echo "🔗 Testing LinkedIn OAuth URL Generation:"
echo "Expected redirect URI: https://cvera.net/api/auth/linkedin/callback"
echo

echo "📝 Next Steps:"
echo "1. Visit: https://cvera.net/api/debug/linkedin-callback"
echo "2. Check what parameters LinkedIn is sending"
echo "3. Verify LinkedIn Developer Console settings"
echo "4. Test the actual OAuth flow"
