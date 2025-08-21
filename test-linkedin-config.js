// Test LinkedIn OAuth Configuration
const LINKEDIN_CONFIG = {
  clientId: process.env.LINKEDIN_CLIENT_ID,
  redirectUri: process.env.LINKEDIN_REDIRECT_URI,
};

console.log('LinkedIn OAuth Configuration:');
console.log('Client ID:', LINKEDIN_CONFIG.clientId);
console.log('Redirect URI:', LINKEDIN_CONFIG.redirectUri);
console.log('Expected production URI: https://cvera.net/api/auth/linkedin/callback');

// Create the authorization URL to see what's being sent
const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', LINKEDIN_CONFIG.clientId);
authUrl.searchParams.set('redirect_uri', LINKEDIN_CONFIG.redirectUri);
authUrl.searchParams.set('scope', 'r_liteprofile r_emailaddress');
authUrl.searchParams.set('state', 'test123');

console.log('\nGenerated LinkedIn Auth URL:');
console.log(authUrl.toString());
