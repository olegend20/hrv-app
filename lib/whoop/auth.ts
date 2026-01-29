import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { makeRedirectUri } from 'expo-auth-session';

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
    // Generate PKCE challenge
    const { codeVerifier, codeChallenge } = await generateCodeChallenge();

    // Get redirect URI
    const redirectUri = makeRedirectUri({
      scheme: 'hrvoptimizer',
      path: 'oauth/callback',
    });

    // Build authorization URL
    const authUrl = `${WHOOP_AUTH_URL}?${new URLSearchParams({
      client_id: WHOOP_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read:recovery read:cycles read:sleep read:workout',
      code_challenge: codeChallenge,
      code_challenge_method: 'plain',
    })}`;

    // Open auth session
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== 'success') {
      console.log('Auth cancelled or failed:', result.type);
      return null;
    }

    // Extract authorization code from response URL
    const url = new URL(result.url);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Exchange code for tokens via backend proxy
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
