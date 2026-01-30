import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { checkRateLimit } from './rateLimit';

/**
 * Analyze user's onboarding profile and provide personalized HRV insights
 * POST /api/ai/onboarding-analysis
 * Body: {
 *   userId?: string,
 *   userProfile: { age: number, gender: string },
 *   healthProfile: HealthProfile,
 *   hrvStats: { avgHRV: number, currentPercentile: number, trend: string, daysOfData: number },
 *   correlations: Correlation[]
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, userProfile, healthProfile, hrvStats, correlations } = req.body;

  // Check rate limit
  const rateLimitResult = checkRateLimit(userId || 'anonymous', 10);
  if (!rateLimitResult.allowed) {
    const resetDate = new Date(rateLimitResult.resetTime);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `You've reached your daily limit of 10 AI calls. Resets at ${resetDate.toLocaleTimeString()}.`,
      resetTime: rateLimitResult.resetTime,
      remaining: 0,
    });
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

  if (!userProfile || !healthProfile) {
    return res.status(400).json({ error: 'userProfile and healthProfile are required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Missing OpenAI API key in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const openai = new OpenAI({ apiKey });

    // Build the system prompt
    const systemPrompt = `You are a health optimization coach specializing in Heart Rate Variability (HRV). You're analyzing a new user's profile to provide personalized insights.

Primary Goal: Help this user get above the average HRV for their age (${userProfile.age}), then into the top ranges (75th+ percentile).

Current User Data:
- Age: ${userProfile.age}, Gender: ${userProfile.gender}
${hrvStats ? `- Current HRV: ${hrvStats.avgHRV}ms (${hrvStats.currentPercentile}th percentile for age)
- Days of data: ${hrvStats.daysOfData}
- Trend: ${hrvStats.trend}` : '- No HRV data available yet'}

Health Profile:
${JSON.stringify(healthProfile, null, 2)}

${correlations && correlations.length > 0 ? `Existing Habit-HRV Correlations:
${JSON.stringify(correlations, null, 2)}` : 'No correlation data available yet.'}

Provide a brief analysis covering:
1. Key insights about their current HRV relative to goals (or what to expect if no data yet)
2. Opportunities based on their profile (exercise, sleep, stress, nutrition)
3. Important considerations (injuries, work stress, family demands)
4. 3-5 initial actionable recommendations to start improving HRV

Be encouraging, specific, and actionable. Focus on highest-impact changes.

Return your response as a JSON object with this structure:
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "opportunities": ["opportunity 1", "opportunity 2", ...],
  "considerations": ["consideration 1", "consideration 2", ...],
  "initialRecommendations": ["rec 1", "rec 2", "rec 3", "rec 4", "rec 5"]
}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: 'Please analyze this user profile and provide personalized HRV insights.',
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(responseContent);

    // Return the analysis
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error generating onboarding analysis:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
