import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { checkRateLimit } from './rateLimit';

/**
 * Analyze WHOOP screenshot(s) using GPT-4 Vision to extract health metrics
 * POST /api/ai/screenshot-analysis
 * Body: {
 *   userId?: string,
 *   images: Array<{ type: 'recovery' | 'sleep', imageBase64: string }>,
 *   date: string (YYYY-MM-DD),
 *   userContext?: string
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, images, imageBase64, date, userContext } = req.body;

  // Backward compatibility: convert old single-image format to new multi-image format
  let imageArray = images;
  if (!imageArray && imageBase64) {
    // Old format: { imageBase64, date }
    imageArray = [{ type: 'recovery', imageBase64 }];
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

  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

  if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0 || !date) {
    return res.status(400).json({ error: 'images array (or imageBase64) and date are required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Missing OpenAI API key in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const openai = new OpenAI({ apiKey });

    // Build description of what screenshots we're analyzing
    const imageTypes = imageArray.map((img: any) => img.type).join(' and ');

    // System prompt for screenshot analysis
    const systemPrompt = `You are analyzing WHOOP screenshots (${imageTypes}) to extract health metrics.

You will receive ${imageArray.length} screenshot(s). Extract the following data:

From Recovery Screenshot (if provided):
- HRV (ms): Look for "HRV" or "Heart Rate Variability" in milliseconds
- Recovery Score (%): Usually shown as a percentage with a colored indicator (green/yellow/red)
- Resting Heart Rate (bpm): Baseline heart rate
- Strain: Previous day's strain score (if visible)

From Sleep Screenshot (if provided):
- Sleep Hours: Total sleep duration in decimal hours (e.g., 7.5)
- Sleep Quality (%): Performance metric or sleep score
- Sleep stages breakdown (if visible)

Combine all visible data from both screenshots into a single response.

Return as JSON:
{
  "extractedData": {
    "hrv": number | null,
    "recoveryScore": number | null,
    "sleepHours": number | null,
    "sleepQuality": number | null,
    "strain": number | null,
    "restingHR": number | null
  },
  "confidence": number (0.0-1.0),
  "notes": "Any additional observations or uncertainties"
}

If any value is unclear or not visible in either screenshot, set it to null. Be conservative with confidence scores.`;

    // Build content array with text prompt and all images
    const userContent: any[] = [
      {
        type: 'text',
        text: `Please analyze these WHOOP screenshot(s) for date ${date}. ${
          userContext ? `User context: ${userContext}` : ''
        }`,
      },
    ];

    // Add each image to the content array
    imageArray.forEach((img: any) => {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: img.imageBase64,
          detail: 'high',
        },
      });
    });

    // Call OpenAI Vision API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(responseContent);

    // Validate confidence score
    if (analysis.confidence < 0.7) {
      return res.status(200).json({
        ...analysis,
        warning: 'Low confidence in extracted data. Please review carefully.',
      });
    }

    // Return the analysis
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
