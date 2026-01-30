import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { checkRateLimit } from './rateLimit';

/**
 * Generate personalized daily HRV optimization plan
 * POST /api/ai/daily-plan
 * Body: {
 *   userId?: string,
 *   date: string (YYYY-MM-DD),
 *   todayData: { hrv: number, recoveryScore: number, sleepHours: number, strain?: number },
 *   userContext: string,
 *   historicalData: { avg7Day: number, avg30Day: number, trend: string },
 *   correlations: Correlation[],
 *   goals: { targetHRV: number, targetPercentile: number },
 *   userProfile: { age: number, gender: string },
 *   healthProfile: HealthProfile,
 *   recentPlans?: { adherenceRate: number, successfulRecs: string[] }
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    userId,
    date,
    todayData,
    userContext,
    historicalData,
    correlations,
    goals,
    userProfile,
    healthProfile,
    recentPlans,
  } = req.body;

  if (!date || !todayData) {
    return res.status(400).json({ error: 'date and todayData are required' });
  }

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

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Missing OpenAI API key in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const openai = new OpenAI({ apiKey });

    // Calculate days to target
    let daysToTarget = 'unknown';
    if (historicalData && goals) {
      const currentHRV = todayData.hrv;
      const targetHRV = goals.targetHRV || 50;
      const avgImprovement = 0.5; // Assume 0.5ms improvement per day with good adherence
      const daysNeeded = Math.max(0, Math.ceil((targetHRV - currentHRV) / avgImprovement));
      daysToTarget = daysNeeded > 0 ? `~${daysNeeded}` : 'target reached';
    }

    // Build the system prompt
    const systemPrompt = `You are creating a personalized daily HRV optimization plan for a user based on their current recovery state.

PRIMARY GOAL: Maximize HRV over time to get user above age-average, then into top ranges (75th+ percentile).

User Profile:
${userProfile ? JSON.stringify(userProfile, null, 2) : 'No user profile'}
${healthProfile ? JSON.stringify(healthProfile, null, 2) : 'No health profile'}

Today's Data (${date}):
- HRV: ${todayData.hrv}ms
- Recovery Score: ${todayData.recoveryScore}%
- Sleep: ${todayData.sleepHours} hours
${todayData.strain ? `- Yesterday's Strain: ${todayData.strain}` : ''}
- User's context: "${userContext || 'None provided'}"

Historical Context:
${
  historicalData
    ? `- 7-day HRV average: ${historicalData.avg7Day}ms
- 30-day HRV average: ${historicalData.avg30Day}ms
- Recent trend: ${historicalData.trend}
- Days until target HRV: ${daysToTarget}`
    : 'No historical data available'
}

${
  correlations && correlations.length > 0
    ? `Top Habit-HRV Correlations:
${JSON.stringify(correlations.slice(0, 5), null, 2)}`
    : 'No correlation data yet'
}

${
  recentPlans
    ? `Recent Plan Adherence:
- Last 7 days: ${recentPlans.adherenceRate}% completion
- Successful recommendations: ${recentPlans.successfulRecs.join(', ')}`
    : 'No recent plan data'
}

Create a daily plan with:

1. **focusArea**: "Recovery", "Maintenance", or "Push"
   - Recovery: HRV < 7-day avg OR recovery score < 33%
   - Push: HRV > 7-day avg AND recovery score > 66%
   - Maintenance: In between

2. **reasoning**: 2-3 sentences explaining today's focus based on data

3. **recommendations**: 5-8 specific, actionable items prioritized by expected impact
   Each recommendation MUST include:
   - priority: 1 (highest), 2 (medium), or 3 (lowest)
   - category: "Exercise", "Nutrition", "Stress Management", "Sleep", "Hydration", or "Recovery"
   - action: Specific instruction (e.g., "20-minute easy walk at lunch")
   - timing: When to do it (e.g., "Morning", "Afternoon", "Evening", "Before bed")
   - expectedImpact: Estimated HRV change (e.g., "+3-5ms based on your meditation correlation")

4. **estimatedEndOfDayHRV**: Based on adherence to plan (be realistic)

Tailor to user's:
- Constraints (work meetings, kids, injuries)
- Preferences (exercise likes/dislikes)
- Proven correlations from their data
- Previous successful recommendations

Be specific, actionable, and realistic. Consider timing and feasibility.

Return ONLY valid JSON following this EXACT structure:
{
  "focusArea": "Recovery" | "Maintenance" | "Push",
  "reasoning": "string",
  "recommendations": [
    {
      "priority": 1 | 2 | 3,
      "category": "Exercise" | "Nutrition" | "Stress Management" | "Sleep" | "Hydration" | "Recovery",
      "action": "string",
      "timing": "string",
      "expectedImpact": "string"
    }
  ],
  "estimatedEndOfDayHRV": number
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
          content: 'Please create a personalized daily HRV optimization plan for this user.',
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const planData = JSON.parse(responseContent);

    // Construct the full DailyPlan object
    const dailyPlan = {
      id: `plan-${Date.now()}`,
      date,
      generatedAt: new Date().toISOString(),
      todayRecovery: {
        hrv: todayData.hrv,
        recoveryScore: todayData.recoveryScore,
        sleepHours: todayData.sleepHours,
      },
      userContext: userContext || '',
      focusArea: planData.focusArea,
      reasoning: planData.reasoning,
      recommendations: planData.recommendations || [],
      estimatedEndOfDayHRV: planData.estimatedEndOfDayHRV || todayData.hrv,
      completed: [],
    };

    // Return the daily plan
    return res.status(200).json(dailyPlan);
  } catch (error) {
    console.error('Error generating daily plan:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
