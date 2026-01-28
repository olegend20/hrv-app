import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Exchange WHOOP authorization code for access and refresh tokens
 * POST /api/auth/whoop/token
 * Body: { code: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing WHOOP credentials in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('WHOOP token exchange failed:', errorData);
      return res.status(tokenResponse.status).json({
        error: 'Failed to exchange authorization code',
        details: errorData,
      });
    }

    const tokenData = await tokenResponse.json();

    // Return tokens to the mobile app
    return res.status(200).json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
    });
  } catch (error) {
    console.error('Error exchanging authorization code:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
