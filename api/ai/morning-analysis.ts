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
          content: 'Provide a comprehensive deep-dive analysis following the exact structure specified.',
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 3000,
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
  const { todayBiometrics, morningContext, yesterdayPlanReview, healthProfile, historical, habitData } =
    request;

  const hrvChange = todayBiometrics.hrv - historical.avg7Day;
  const hrvChangePercent = Math.round((hrvChange / historical.avg7Day) * 100);

  return `You are an expert HRV & autonomic nervous system coach. Provide a DEEP DIVE analysis of today's data with the insight and depth of a professional coach who truly understands the user's patterns.

TODAY'S DATA:
- HRV: ${todayBiometrics.hrv}ms (${hrvChange > 0 ? 'up' : 'down'} ${Math.abs(hrvChangePercent)}% from ${historical.avg7Day}ms baseline)
- Recovery Score: ${todayBiometrics.recoveryScore}%
- Resting HR: ${todayBiometrics.restingHR} bpm
- Sleep: ${todayBiometrics.sleepHours} hours (quality: ${todayBiometrics.sleepQuality}%)
${todayBiometrics.yesterdayStrain ? `- Yesterday's Strain: ${todayBiometrics.yesterdayStrain}` : ''}

MORNING CONTEXT:
- Sleep Rating: ${morningContext.sleepRating}/5
- Energy Level: ${morningContext.energyLevel}/5
- User Notes: "${morningContext.notes || 'None'}"

HISTORICAL CONTEXT:
- 7-day avg HRV: ${historical.avg7Day}ms
- 30-day avg HRV: ${historical.avg30Day}ms
- Trend: ${historical.trend}

${yesterdayPlanReview ? `YESTERDAY'S PERFORMANCE:
- Plan Adherence: ${Math.round((yesterdayPlanReview.completedActions.length / yesterdayPlanReview.totalActions) * 100)}%
- Day Rating: ${yesterdayPlanReview.overallRating}/5
- Notes: "${yesterdayPlanReview.notes || 'None'}"` : ''}

LIFESTYLE FACTORS (last 24h):
${habitData.exercise ? `- Exercise: ${habitData.exercise.type}, ${habitData.exercise.duration} min` : '- Exercise: None logged'}
${habitData.stress ? `- Stress Level: ${habitData.stress.level}/5` : ''}
${habitData.alcohol?.consumed ? `- Alcohol: Yes` : '- Alcohol: No'}
${habitData.caffeine ? `- Caffeine: ${habitData.caffeine.cups} cups, last at ${habitData.caffeine.lastTime}` : ''}
${habitData.nutrition ? `- Nutrition Quality: ${habitData.nutrition.quality}/5` : ''}
${habitData.hydration ? `- Hydration: ${habitData.hydration.litersConsumed}L` : ''}

USER PROFILE:
- Goal: ${healthProfile.primaryGoal}
- Work: ${healthProfile.workEnvironment.type}, ${healthProfile.workEnvironment.stressLevel} stress
${healthProfile.injuries?.length ? `- Injuries: ${healthProfile.injuries.join(', ')}` : ''}
${healthProfile.familySituation.hasYoungChildren ? `- Family: ${healthProfile.familySituation.numberOfChildren} young children` : ''}

YOUR TASK - Provide a comprehensive analysis in this EXACT structure:

{
  "dataInterpretation": {
    "headline": "One clear sentence stating what the data is ACTUALLY saying (not what it feels like)",
    "autonomicState": "Explain what's happening in the nervous system (parasympathetic vs sympathetic)",
    "keyDistinction": "Important distinction the user should understand (e.g., 'stressed nervous system vs overtrained muscles')"
  },

  "likelyContributors": [
    {
      "rank": 1,
      "factor": "Most likely contributor (e.g., 'Early immune activation')",
      "evidence": ["Specific evidence from their data that supports this"],
      "mechanism": "How this factor affects HRV physiologically",
      "impact": "Estimated impact on HRV (e.g., 'Could explain 60% of the drop')"
    },
    {
      "rank": 2,
      "factor": "Second most likely",
      "evidence": ["Evidence"],
      "mechanism": "How it works",
      "impact": "Impact estimate"
    }
    // Include 2-4 ranked contributors based on their data
  ],

  "whatThisIsNot": [
    "Clear statement of what this is NOT (e.g., 'Not overtraining')",
    "Another reassuring clarification",
    "One more thing they don't need to worry about"
  ],

  "todaysPlan": {
    "approach": "Overall approach for today (e.g., 'Parasympathetic rebuild day')",
    "keyActions": [
      {
        "priority": 1,
        "action": "Specific action",
        "why": "Why this helps today",
        "howTo": "Exactly how to do it"
      }
      // 3-5 prioritized actions
    ],
    "avoid": ["Things to avoid today with brief explanation why"]
  },

  "predictions": {
    "likelyOutcome": "What you expect to happen in next 24-72h based on the data pattern",
    "recoveryTimeline": "Expected recovery timeline",
    "monitorFor": "What to watch for tomorrow",
    "ifThis": "If X happens tomorrow, it means Y",
    "ifThat": "If Z happens tomorrow, it means W"
  },

  "reassurance": {
    "message": "Personal, specific reassurance based on their situation",
    "context": "Why their habits/awareness is helping",
    "encouragement": "Confidence-building perspective"
  }
}

CRITICAL INSTRUCTIONS:
- Be SPECIFIC to their data - reference actual numbers, their notes, their habits
- Use arrows (➡️, ✅, ❌) and formatting for clarity
- Sound like a knowledgeable coach, not a generic bot
- If HRV dropped significantly, explain WHY physiologically
- If they mentioned symptoms/feelings in notes, address them specifically
- Rank contributors by actual likelihood based on the data pattern
- Make predictions based on patterns, not platitudes
- The reassurance should be EARNED - based on real analysis, not empty comfort
- Be conversational but precise - like the example analysis provided
- DO NOT just list generic advice - connect everything to THEIR specific situation TODAY

Return ONLY valid JSON matching this structure.`;
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
      console.error('No JSON found in AI response');
      return baseline;
    }

    const deepDive = JSON.parse(jsonMatch[0]);

    // Combine baseline analysis with deep dive insights
    const enhancedInsights = [
      ...baseline.analysis.insights,
      deepDive.dataInterpretation?.headline || '',
      deepDive.dataInterpretation?.keyDistinction || '',
      ...(deepDive.likelyContributors || []).slice(0, 3).map((c: any) =>
        `${c.factor}: ${c.mechanism}`
      ),
    ].filter(Boolean);

    // Enhanced reasoning with deep dive context
    const enhancedReasoning = `
${deepDive.dataInterpretation?.autonomicState || baseline.analysis.reasoning}

${deepDive.predictions?.likelyOutcome ? '**What to expect:** ' + deepDive.predictions.likelyOutcome : ''}

${deepDive.reassurance?.message || ''}
    `.trim();

    return {
      analysis: {
        ...baseline.analysis,
        insights: enhancedInsights,
        reasoning: enhancedReasoning,
        // Add the full deep dive as a new field for the UI to display
        deepDive: deepDive,
      },
    };
  } catch (error) {
    console.error('Error parsing AI response:', error, '\nResponse:', aiResponse?.substring(0, 500));
    return baseline;
  }
}
