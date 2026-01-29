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

    console.log('Opening auth URL:', authUrl);

    // Use WebBrowser for better Expo Go compatibility
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    console.log('Auth session result:', result);

    if (result.type === 'cancel') {
      console.log('User cancelled');
      return null;
    }

    if (result.type !== 'success') {
      throw new Error(`Auth failed: ${result.type}`);
    }

    // Extract code from URL
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');

    console.log('Received code:', code ? 'yes' : 'no');
    console.log('State match:', returnedState === state);

    if (!code) {
      throw new Error('No authorization code received');
    }

    if (returnedState !== state) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    return tokens;

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
