# AI Features Documentation

## Overview

The HRV Optimizer app has been transformed into an AI-powered health advisor that helps users maximize their Heart Rate Variability through personalized daily guidance.

## Implemented Features

### 1. Enhanced Onboarding (Milestone 1)
- **8-Step Questionnaire**: Comprehensive health profile collection
  - Age/Gender → Goals → Exercise → Work → Family → Eating → Sleep → Review
- **Automatic WHOOP Sync**: Imports 180 days of data after profile completion
- **AI Profile Analysis**: OpenAI GPT-4 analyzes user profile and generates:
  - Key insights about current HRV
  - Opportunities for improvement
  - Important health considerations
  - 3-5 initial actionable recommendations

**API Endpoint**: `/api/ai/onboarding-analysis`
**Location**: `/app/onboarding.tsx`, `/app/onboarding-summary.tsx`

### 2. Screenshot Upload & Analysis (Milestone 2)
- **WHOOP Screenshot Upload**: Camera or gallery selection
- **GPT-4 Vision Analysis**: Automatically extracts:
  - HRV (Heart Rate Variability)
  - Recovery Score
  - Sleep Hours & Quality
  - Resting Heart Rate
  - Strain Score
- **Data Confirmation**: Users review and can edit extracted data
- **Privacy-First**: Screenshots deleted after extraction

**API Endpoint**: `/api/ai/screenshot-analysis`
**Location**: `/app/screenshot-upload.tsx`, `/app/screenshot-review.tsx`

### 3. Conversational AI Health Advisor (Milestone 3)
- **Context-Aware Chat**: AI coach with full access to:
  - User profile and health history
  - HRV trends and statistics
  - Habit logs and correlations
  - Personal goals
- **Streaming Responses**: Real-time message streaming with SSE
- **Quick Reply Suggestions**: Pre-populated helpful questions
- **Context Pills**: Visual indicators of available data
- **Markdown Support**: Rich formatting in AI responses

**API Endpoint**: `/api/ai/chat`
**Location**: `/app/(tabs)/chat.tsx`

### 4. Daily HRV Optimization Plans (Milestone 4)
- **AI-Generated Daily Plans**: Personalized based on:
  - Today's recovery data (HRV, sleep, strain)
  - Historical trends (7-day, 30-day averages)
  - User constraints (work, family, injuries)
  - Previous plan adherence
- **Focus Areas**: Recovery, Maintenance, or Push
- **Prioritized Recommendations**: 5-8 actions with:
  - Priority level (1-3)
  - Category (Exercise, Nutrition, Sleep, etc.)
  - Specific timing
  - Expected HRV impact
- **Progress Tracking**: Checkbox completion and adherence metrics
- **Outcome Analysis**: Tracks actual vs. predicted HRV changes

**API Endpoint**: `/api/ai/daily-plan`
**Location**: `/app/daily-plan.tsx`

### 5. Dashboard Integration (Milestone 5)
- **AI Coach Summary Card**: Shows today's focus area and top 3 priorities
- **Plan Stats Card**: Displays adherence rates and HRV improvements
- **Quick Actions Menu**: Fast access to upload, plan, chat, and habits
- **Rate Limit Status**: Shows remaining AI calls (10 per day)

**Location**: `/app/(tabs)/index.tsx`

## Rate Limiting & Cost Controls

### Rate Limits
- **10 AI calls per user per day**
- Resets at midnight
- Applied to all AI endpoints
- Graceful error messages

### Implementation
- In-memory rate limiting (for serverless)
- Rate limit headers in all responses
- UI displays remaining calls
- Status endpoint: `/api/ai/rate-limit-status`

**Location**: `/api/lib/rateLimit.ts`

### Cost Estimates (per 100 users/month)
- Onboarding analysis: ~$2
- Screenshot analysis: ~$150
- Daily plans: ~$90
- Chat conversations: ~$60
- **Total: ~$300/month** ($3/user/month)

## AI Models Used

### OpenAI GPT-4o
- **Model**: `gpt-4o`
- **Use Cases**:
  - Onboarding analysis
  - Screenshot vision analysis
  - Conversational chat
  - Daily plan generation
- **Key Features**:
  - JSON mode for structured outputs
  - Vision capabilities for screenshot analysis
  - Streaming for chat responses
  - High context window for full health profiles

## Data Stores

### Zustand Stores (with AsyncStorage persistence)
1. **healthProfileStore**: User's health questionnaire data
2. **screenshotStore**: Uploaded screenshot metadata (images deleted after extraction)
3. **chatStore**: Conversation history (last 50 messages per conversation)
4. **aiPlanStore**: Daily plans (last 30 days) + onboarding insights

**Location**: `/stores/`

## API Architecture

### Vercel Serverless Functions
- **Runtime**: Node.js
- **Region**: Auto (closest to user)
- **Timeout**: 60s (for streaming responses)
- **Environment Variables**:
  - `OPENAI_API_KEY`
  - `WHOOP_CLIENT_ID`
  - `WHOOP_CLIENT_SECRET`

### Request Flow
```
Mobile App → Vercel Serverless Function → OpenAI API → Response
```

### Authentication
- User ID passed in request body
- Rate limiting per user ID
- No authentication tokens (relies on Vercel's built-in security)

## Deployment Instructions

### 1. OpenAI Setup
1. Create account at https://platform.openai.com/
2. Generate API key
3. Add billing information (pay-as-you-go)
4. Recommended: Set usage limits to avoid unexpected costs

### 2. Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 3. Environment Variables
Add in Vercel Dashboard (Settings → Environment Variables):
- `OPENAI_API_KEY` (Production, Preview, Development)
- `WHOOP_CLIENT_ID` (Production, Preview, Development)
- `WHOOP_CLIENT_SECRET` (Production, Preview, Development)

### 4. Mobile App Configuration
Update `.env.local`:
```
EXPO_PUBLIC_API_URL=https://your-app.vercel.app
```

## System Prompts

### Onboarding Analysis
- Focus: Help user reach age-appropriate HRV goals
- Tone: Encouraging, specific, actionable
- Output: Structured JSON with insights and recommendations

### Screenshot Analysis
- Focus: Extract health metrics from WHOOP screenshots
- Confidence scoring: Conservative approach
- Output: JSON with extracted data and confidence level

### Chat Health Advisor
- Focus: Personalized health coaching
- Context: Full access to user data
- Tone: Concise (2-3 paragraphs), supportive
- Guidelines: Prioritize recovery when HRV is low

### Daily Planning
- Focus: Maximize HRV through actionable daily plans
- Logic: Recovery vs. Maintenance vs. Push based on current state
- Output: 5-8 prioritized recommendations with expected impact

## Testing

### Manual Testing Checklist
- [ ] Complete onboarding questionnaire
- [ ] Upload WHOOP screenshot
- [ ] Generate daily plan
- [ ] Send chat message
- [ ] Check rate limit status
- [ ] Test rate limit exceeded scenario
- [ ] Verify data persistence across app restarts

### Rate Limit Testing
```bash
# Test rate limit endpoint
curl "https://your-app.vercel.app/api/ai/rate-limit-status?userId=test123"
```

## Known Limitations

1. **In-Memory Rate Limiting**: Resets on serverless cold starts
   - **Solution for Production**: Use Redis or DynamoDB

2. **No User Authentication**: Relies on client-provided user IDs
   - **Solution for Production**: Implement proper auth (Firebase, Auth0)

3. **Screenshot Storage**: Images temporarily stored locally
   - **Current**: Deleted after extraction
   - **Privacy**: No cloud storage

4. **Correlation Analysis**: Not yet integrated with AI recommendations
   - **Future**: Feed actual habit-HRV correlations to AI

5. **OpenAI Costs**: Can scale quickly with usage
   - **Mitigation**: Rate limiting, usage monitoring

## Future Enhancements

### Short Term
1. Integrate actual correlation analysis into AI recommendations
2. Add Redis for production-grade rate limiting
3. Implement user authentication
4. Add admin dashboard for usage monitoring

### Long Term
1. Custom fine-tuned models for health coaching
2. Multi-modal analysis (voice, images, wearables)
3. Community features (compare with similar users)
4. Integration with other wearables (Apple Watch, Oura, Garmin)

## Troubleshooting

### AI Responses Not Working
1. Check `OPENAI_API_KEY` is set in Vercel
2. Verify API key has credits
3. Check Vercel function logs for errors
4. Ensure `EXPO_PUBLIC_API_URL` points to deployed app

### Rate Limit Issues
1. Check user ID is being passed correctly
2. Verify rate limit status endpoint
3. Clear app data to reset local rate limits

### Screenshot Analysis Fails
1. Ensure image is clear and readable
2. Check image is WHOOP recovery/sleep screen
3. Verify GPT-4o (vision) access on OpenAI account
4. Review API logs for confidence scores

## Support

For issues or questions:
1. Check Vercel function logs
2. Review OpenAI API usage dashboard
3. Test API endpoints directly with curl
4. Check mobile app console logs

## License

Copyright 2026 HRV Optimizer. All rights reserved.
