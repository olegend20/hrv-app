import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { checkRateLimit } from './rateLimit';
import type { MorningAnalysisRequest, MorningAnalysisResponse } from '../../types';
import { generateMorningAnalysis } from './morningAnalysisEngine';

/**
 * Comprehensive Morning Analysis API
 * Analyzes biometrics, yesterday's plan review, habits, and historical data
 * to generate personalized insights and recommendations
 *
 * POST /api/ai/morning-analysis
 * Body: MorningAnalysisRequest
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const request = req.body as MorningAnalysisRequest;

  // Validate required fields
  if (!request.date || !request.todayBiometrics || !request.morningContext || !request.habitData) {
    return res.status(400).json({
      error: 'Missing required fields: date, todayBiometrics, morningContext, habitData',
    });
  }

  // Check rate limit
  const userId = request.userProfile?.id || 'anonymous';
  const rateLimitResult = checkRateLimit(userId, 10);
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
    console.error('Missing OpenAI API key');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Use the analysis engine for baseline analysis
    const baselineAnalysis = await generateMorningAnalysis(request);

    // Enhance with AI for natural language insights and reasoning
    const openai = new OpenAI({ apiKey });

    const systemPrompt = buildSystemPrompt(request, baselineAnalysis);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: 'Generate enhanced insights and reasoning for today\'s plan.',
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    // Parse AI response and merge with baseline analysis
    const enhancedAnalysis = enhanceWithAI(baselineAnalysis, aiResponse);

    return res.status(200).json(enhancedAnalysis);
  } catch (error) {
    console.error('Error generating morning analysis:', error);
    return res.status(500).json({
      error: 'Failed to generate analysis',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function buildSystemPrompt(
  request: MorningAnalysisRequest,
  baseline: MorningAnalysisResponse
): string {
  const { todayBiometrics, morningContext, yesterdayPlanReview, healthProfile, historical } =
    request;

  return `You are an expert HRV optimization coach. Enhance the morning analysis with natural, conversational insights.

TODAY'S DATA:
- HRV: ${todayBiometrics.hrv}ms (vs 7-day avg: ${historical.avg7Day}ms)
- Recovery Score: ${todayBiometrics.recoveryScore}%
- Sleep: ${todayBiometrics.sleepHours} hours
- Sleep Quality: ${todayBiometrics.sleepQuality}%
- Resting HR: ${todayBiometrics.restingHR} bpm

MORNING CONTEXT:
- Sleep Rating: ${morningContext.sleepRating}/5
- Energy Level: ${morningContext.energyLevel}/5
${morningContext.notes ? `- Notes: "${morningContext.notes}"` : ''}

${
  yesterdayPlanReview
    ? `YESTERDAY'S PLAN REVIEW:
- Completed ${yesterdayPlanReview.completedActions.length}/${yesterdayPlanReview.totalActions} actions (${Math.round((yesterdayPlanReview.completedActions.length / yesterdayPlanReview.totalActions) * 100)}%)
- Overall Day Rating: ${yesterdayPlanReview.overallRating}/5
${yesterdayPlanReview.notes ? `- Notes: "${yesterdayPlanReview.notes}"` : ''}`
    : 'No yesterday review available'
}

USER PROFILE:
- Primary Goal: ${healthProfile.primaryGoal}
${healthProfile.targetHRV ? `- Target HRV: ${healthProfile.targetHRV}ms` : ''}
- Work: ${healthProfile.workEnvironment.type}, ${healthProfile.workEnvironment.stressLevel} stress
${healthProfile.familySituation.hasYoungChildren ? `- Young children: ${healthProfile.familySituation.numberOfChildren}` : ''}

BASELINE ANALYSIS:
- Focus Area: ${baseline.analysis.focusArea}
- HRV Percentile: ${baseline.analysis.status.hrvPercentile}%
- Recovery State: ${baseline.analysis.status.recoveryState}

TASK:
Provide 2-3 additional personalized insights based on:
1. The connection between their morning context and biometric data
2. Patterns from yesterday's review (if available)
3. Actionable encouragement aligned with their goal

Keep insights conversational, specific, and encouraging. Return as a JSON object:
{
  "additionalInsights": ["insight1", "insight2", "insight3"],
  "enhancedReasoning": "A personalized explanation for today's focus area"
}`;
}

function enhanceWithAI(
  baseline: MorningAnalysisResponse,
  aiResponse: string | undefined
): MorningAnalysisResponse {
  if (!aiResponse) {
    return baseline;
  }

  try {
    // Extract JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return baseline;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      analysis: {
        ...baseline.analysis,
        insights: [
          ...baseline.analysis.insights,
          ...(parsed.additionalInsights || []),
        ],
        reasoning: parsed.enhancedReasoning || baseline.analysis.reasoning,
      },
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return baseline;
  }
}
