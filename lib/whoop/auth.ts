import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';

const WHOOP_CLIENT_ID = '89088cea-8aa0-4a4d-a981-f4d582c28bf3';
const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const API_BASE_URL = 'https://hrv-app-virid.vercel.app';

WebBrowser.maybeCompleteAuthSession();

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Generate PKCE code challenge for OAuth flow
 */
async function generateCodeChallenge() {
  const codeVerifier = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
  );

  return {
    codeVerifier,
    codeChallenge: codeVerifier, // WHOOP uses plain method
  };
}

/**
 * Start WHOOP OAuth flow
 */
export async function startWhoopAuth(): Promise<TokenResponse | null> {
  try {
    // Use the exact redirect URI registered in WHOOP
    const redirectUri = 'hrvoptimizer://oauth/callback';

    // Generate a random state for CSRF protection (min 8 chars required)
    const state = Math.random().toString(36).substring(2, 15);

    // Build authorization URL - must include 'offline' scope for refresh tokens
    const authUrl = `${WHOOP_AUTH_URL}?${new URLSearchParams({
      client_id: WHOOP_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'offline read:recovery read:cycles read:sleep read:workout',
      state: state,
    })}`;

    console.log('Opening auth URL in system browser:', authUrl);

    // Open in system browser
    const supported = await Linking.canOpenURL(authUrl);
    if (!supported) {
      throw new Error('Cannot open WHOOP authentication URL');
    }

    // Open the URL
    await Linking.openURL(authUrl);

    // Wait for the redirect callback
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        Linking.removeEventListener('url', handleRedirect);
        reject(new Error('OAuth timeout - no response from WHOOP'));
      }, 300000); // 5 minute timeout

      const handleRedirect = ({ url }: { url: string }) => {
        console.log('Received redirect:', url);
        clearTimeout(timeout);
        Linking.removeEventListener('url', handleRedirect);

        try {
          const parsedUrl = new URL(url);
          const code = parsedUrl.searchParams.get('code');

          if (!code) {
            reject(new Error('No authorization code in redirect'));
            return;
          }

          // Exchange code for tokens
          exchangeCodeForTokens(code)
            .then(resolve)
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      };

      Linking.addEventListener('url', handleRedirect);
    });

  } catch (error) {
    console.error('WHOOP auth error:', error);
    throw error;
  }
}

/**
 * Exchange authorization code for tokens via backend proxy
 */
async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/whoop/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to exchange code for tokens');
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshWhoopToken(
  refreshToken: string
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/whoop/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refresh token');
  }

  return response.json();
}
