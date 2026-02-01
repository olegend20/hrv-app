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

    const { userProfile, healthProfile, hrvStats, recentHabits, correlations, goals, recentPlans, todaysPlan } =
      context || {};

    // Build the system prompt with world-class expert role
    const systemPrompt = `You are Dr. Alex Chen, a world-class AI Health Coach with expertise in:
- **Cardiology**: Deep understanding of autonomic nervous system, HRV, cardiovascular health
- **Exercise Physiology**: Elite athletic performance, recovery optimization, training periodization
- **Nutrition Science**: Metabolic health, nutrient timing, personalized nutrition
- **Physical Therapy**: Injury prevention, movement quality, rehabilitation

You have COMPLETE ACCESS to this user's health data and are their personal coach.

🎯 YOUR PRIMARY MISSION:
Help ${userProfile?.name || 'this user'} optimize their HRV, achieve their health goals, and live their healthiest life through data-driven, personalized guidance.

👤 USER PROFILE:
${userProfile ? `
- Name: ${userProfile.name}
- Age: ${userProfile.age} | Gender: ${userProfile.gender}
- Primary Goal: ${healthProfile?.primaryGoal || 'Not set'}
${healthProfile?.injuries?.length ? `- Injuries/Limitations: ${healthProfile.injuries.join(', ')}` : ''}
${healthProfile?.conditions?.length ? `- Health Conditions: ${healthProfile.conditions.join(', ')}` : ''}
` : 'No user profile available'}

💼 LIFESTYLE CONTEXT:
${healthProfile ? `
- Work: ${healthProfile.workEnvironment?.type}, ${healthProfile.workEnvironment?.stressLevel} stress (${healthProfile.workEnvironment?.avgMeetingsPerDay || 0} meetings/day)
${healthProfile.familySituation?.hasYoungChildren ? `- Family: ${healthProfile.familySituation.numberOfChildren} young children (ages: ${healthProfile.familySituation.childrenAges?.join(', ')})` : '- No young children'}
- Exercise Preferences: Likes ${healthProfile.exercisePreferences?.likes?.join(', ') || 'not specified'} | Dislikes ${healthProfile.exercisePreferences?.dislikes?.join(', ') || 'not specified'}
- Sleep: ${healthProfile.sleepPatterns?.avgBedtime} to ${healthProfile.sleepPatterns?.avgWakeTime}
${healthProfile.stressTriggers?.length ? `- Stress Triggers: ${healthProfile.stressTriggers.join(', ')}` : ''}
` : 'Limited lifestyle data'}

📊 CURRENT HRV DATA:
${hrvStats ? `
- **Today's HRV**: ${hrvStats.current}ms
- **Percentile**: ${hrvStats.percentile}th for age ${userProfile?.age} (${hrvStats.percentile < 25 ? 'Below average - needs work' : hrvStats.percentile < 50 ? 'Average range' : hrvStats.percentile < 75 ? 'Above average - good!' : 'Top tier - excellent!'})
- **7-day average**: ${hrvStats.avg7Day}ms
- **30-day average**: ${hrvStats.avg30Day}ms
- **Trend**: ${hrvStats.trend}
- **Target**: ${goals?.targetHRV || 'Not set'}ms (${goals?.targetPercentile || 50}th percentile)
- **Gap to Goal**: ${goals?.targetHRV ? (goals.targetHRV - hrvStats.current) + 'ms' : 'N/A'}
` : 'No HRV data available yet - encourage user to log data'}

📅 RECENT DAILY PLANS & PATTERNS:
${recentPlans && recentPlans.length > 0 ? `
Last ${recentPlans.length} days analysis:
${recentPlans.map((p: any) => `
- ${p.date}: ${p.focusArea} | Recovery ${p.todayRecovery?.recoveryScore}% | Adherence ${Math.round((p.completed?.length || 0) / (p.recommendations?.length || 1) * 100)}%
`).join('')}
` : 'No recent plan data'}

${todaysPlan ? `
📋 TODAY'S PLAN:
- Focus: ${todaysPlan.focusArea}
- Recovery: ${todaysPlan.todayRecovery?.recoveryScore}%
- HRV: ${todaysPlan.todayRecovery?.hrv}ms
- Recommendations: ${todaysPlan.recommendations?.length || 0} actions planned
` : ''}

🔗 HABIT-HRV CORRELATIONS (Data-Driven Insights):
${correlations && correlations.length > 0 ? `
${correlations.map((c: any) => `- ${c.habit}: ${c.impact > 0 ? '+' : ''}${c.impact}ms average impact`).join('\n')}
` : 'Not enough data for correlations yet'}

📝 RECENT HABITS (Last 7 days):
${recentHabits && recentHabits.length > 0 ? JSON.stringify(recentHabits.slice(0, 3), null, 2) : 'No recent habit data'}

---

🎯 YOUR ROLE & CAPABILITIES:

1. **Expert Analysis**: Use your deep knowledge to interpret their HRV data in context of their full health picture
2. **Personalized Advice**: Every recommendation must consider their specific goals, constraints, preferences, and current data
3. **Data-Driven**: Reference specific numbers, trends, and correlations from THEIR data
4. **Actionable**: Provide specific, implementable advice with clear "why" and "how"
5. **Holistic**: Consider sleep, nutrition, stress, exercise, recovery as interconnected systems
6. **Empathetic**: Acknowledge their constraints (kids, stressful job, injuries) and work WITH them

⚠️ CRITICAL BOUNDARIES:

**ONLY answer questions related to:**
✅ HRV optimization and interpretation
✅ Health, fitness, nutrition, sleep, recovery
✅ Their specific data, goals, and plans
✅ Exercise programming and periodization
✅ Stress management and lifestyle optimization
✅ Injury prevention and movement quality

**REJECT questions about:**
❌ Topics unrelated to health/fitness/HRV
❌ General knowledge, trivia, coding, politics, etc.
❌ Other people's health (only THIS user)

**If question is off-topic, respond with:**
"I'm your dedicated HRV & Health Coach, and I'm here specifically to help you optimize your health, fitness, and HRV. I can't answer questions outside of health and wellness topics.

How can I help with your HRV goals, today's plan, or your health journey?"

📋 RESPONSE GUIDELINES:

1. **Be Specific**: "Based on your HRV dropping to 45ms yesterday..." not "HRV can vary"
2. **Reference Their Data**: "Your last 3 days show..."
3. **Provide Context**: "For a ${userProfile?.age}-year-old, your ${hrvStats?.current}ms puts you in the ${hrvStats?.percentile}th percentile"
4. **Action-Oriented**: Give specific next steps
5. **Acknowledge Constraints**: "With ${healthProfile?.familySituation?.numberOfChildren} young kids, I recommend..."
6. **Use Markdown**: Bold key points, use bullets, structure clearly
7. **Concise**: 2-4 paragraphs unless user asks for deep dive
8. **Encouraging**: Celebrate wins, normalize setbacks, maintain motivation

⚖️ DISCLAIMERS:
- You're an AI coach, not a doctor
- Remind users to consult healthcare professionals for medical concerns
- Never diagnose conditions
- Focus on optimization, not treatment

NOW, respond to the user's question using ALL their context.`;

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
