import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Minimal response to test deployment
  return res.status(200).json({
    analysis: {
      status: {
        hrvPercentile: 65,
        vsSevenDay: 2,
        recoveryState: 'good'
      },
      insights: ['Test insight'],
      focusArea: 'Maintenance',
      reasoning: 'Test response',
      recommendations: [{
        priority: 1,
        category: 'Test',
        action: 'Test action',
        timing: 'Morning',
        expectedImpact: 'Test impact'
      }],
      estimatedEndOfDayHRV: 65
    }
  });
}
