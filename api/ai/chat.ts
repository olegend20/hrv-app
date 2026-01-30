import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { checkRateLimit } from './rateLimit';

/**
 * Streaming conversational AI health advisor
 * POST /api/ai/chat
 * Body: {
 *   userId?: string,
 *   message: string,
 *   conversationId: string,
 *   context: { userProfile, healthProfile, hrvStats, recentHabits, correlations, goals },
 *   conversationHistory: ChatMessage[]
 * }
 *
 * Returns: Server-Sent Events (SSE) stream
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, message, conversationId, context, conversationHistory } = req.body;

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

  if (!message || !conversationId) {
    return res.status(400).json({ error: 'message and conversationId are required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Missing OpenAI API key in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    const openai = new OpenAI({ apiKey });

    const { userProfile, healthProfile, hrvStats, recentHabits, correlations, goals } =
      context || {};

    // Build the system prompt
    const systemPrompt = `You are a personal health optimization coach specializing in Heart Rate Variability (HRV). You have access to the user's complete health profile, WHOOP data, habits, and HRV trends.

PRIMARY MISSION: Help this user get above the average HRV for their age (${
      userProfile?.age || 'unknown'
    }), then into the top ranges (75th+ percentile).

User Context:
${userProfile ? JSON.stringify(userProfile, null, 2) : 'No user profile available'}
${healthProfile ? JSON.stringify(healthProfile, null, 2) : 'No health profile available'}

${
  hrvStats
    ? `Current HRV Stats:
- Current: ${hrvStats.current}ms (${hrvStats.percentile}th percentile for age ${userProfile?.age})
- 7-day average: ${hrvStats.avg7Day}ms
- 30-day average: ${hrvStats.avg30Day}ms
- Trend: ${hrvStats.trend}
- Target: ${goals?.targetHRV || 50}ms (${goals?.targetPercentile || 50}th percentile)`
    : 'No HRV data available yet'
}

${
  recentHabits && recentHabits.length > 0
    ? `Recent Habits (last 7 days):
${JSON.stringify(recentHabits, null, 2)}`
    : 'No recent habit data'
}

${
  correlations && correlations.length > 0
    ? `Strongest Habit-HRV Correlations:
${JSON.stringify(correlations, null, 2)}`
    : 'No correlation data available yet'
}

Guidelines:
1. Always consider the user's HRV goals in your advice
2. Reference their specific profile (injuries, work stress, family situation, exercise preferences)
3. Use data to support recommendations (e.g., "Your HRV tends to be 8ms higher on days you log meditation")
4. Be encouraging but realistic about timelines
5. Prioritize recovery when HRV is low, suggest pushing when HRV is high
6. Consider their constraints (young kids, stressful job, etc.)
7. Keep responses concise (2-3 paragraphs max unless asked for detail)
8. Use markdown formatting for better readability (bold, bullets, etc.)

You're not a doctor. Remind users to consult healthcare professionals for medical concerns.`;

    // Build messages array for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add conversation history (last 10 messages for context)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.slice(-10).forEach((msg: any) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    });

    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;

      if (content) {
        // Send token as SSE
        res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
      }

      // Check if stream is done
      if (chunk.choices[0]?.finish_reason === 'stop') {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        break;
      }
    }

    res.end();
  } catch (error) {
    console.error('Error in streaming chat:', error);

    // Send error as SSE
    res.write(
      `data: ${JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
      })}\n\n`
    );
    res.end();
  }
}
