import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Refresh WHOOP access token using refresh token
 * POST /api/auth/whoop/refresh
 * Body: { refresh_token: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing WHOOP credentials in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Refresh the access token
    const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('WHOOP token refresh failed:', errorData);
      return res.status(tokenResponse.status).json({
        error: 'Failed to refresh access token',
        details: errorData,
      });
    }

    const tokenData = await tokenResponse.json();

    // Return new tokens to the mobile app
    return res.status(200).json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
    });
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
