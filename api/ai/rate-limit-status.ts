import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRateLimitStatus } from './rateLimit';

/**
 * Get current rate limit status for a user
 * GET /api/ai/rate-limit-status?userId=xxx
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = (req.query.userId as string) || 'anonymous';
  const limit = 10; // 10 AI calls per day

  const status = getRateLimitStatus(userId, limit);

  return res.status(200).json({
    limit,
    remaining: status.remaining,
    resetTime: status.resetTime,
    resetTimeFormatted: new Date(status.resetTime).toISOString(),
  });
}
