/**
 * Simple in-memory rate limiting for AI API endpoints
 * In production, this should use Redis or a database
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage (will be lost on serverless function cold start)
// For production, use Redis or DynamoDB
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(
  userId: string,
  limit: number = 10,
  windowMs: number = 24 * 60 * 60 * 1000 // 24 hours
): RateLimitResult {
  const now = Date.now();
  const key = `${userId}`;

  // Get existing entry or create new one
  const entry = rateLimitStore.get(key);

  // If no entry or reset time passed, create new entry
  if (!entry || now >= entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  userId: string,
  limit: number = 10
): RateLimitResult {
  const now = Date.now();
  const key = `${userId}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetTime) {
    return {
      allowed: true,
      remaining: limit,
      resetTime: now + 24 * 60 * 60 * 1000,
    };
  }

  return {
    allowed: entry.count < limit,
    remaining: Math.max(0, limit - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Cleanup old entries (call periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}
