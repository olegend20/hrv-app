# OAuth Proxy API

This backend service handles WHOOP OAuth authentication securely by keeping the Client Secret server-side.

## Endpoints

### POST /api/auth/whoop/token
Exchange WHOOP authorization code for access and refresh tokens.

**Request Body:**
```json
{
  "code": "authorization_code_from_whoop"
}
```

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

### POST /api/auth/whoop/refresh
Refresh an expired access token using a refresh token.

**Request Body:**
```json
{
  "refresh_token": "refresh_token_from_previous_response"
}
```

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

## Local Development

1. Ensure `.env.local` exists with:
   ```
   WHOOP_CLIENT_ID=your_client_id
   WHOOP_CLIENT_SECRET=your_client_secret
   ```

2. Install Vercel CLI: `npm i -g vercel`

3. Run locally: `vercel dev`

4. Test endpoints at `http://localhost:3000/api/...`

## Deployment

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`

2. Login: `vercel login`

3. Deploy: `vercel --prod`

4. Set environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET`

5. Your API will be available at: `https://your-project.vercel.app/api/...`

6. Update the mobile app with your production API URL

## Security Notes

- The Client Secret is NEVER exposed to the mobile app
- All requests use HTTPS
- CORS is configured to allow mobile app requests
- Environment variables are stored securely in Vercel
