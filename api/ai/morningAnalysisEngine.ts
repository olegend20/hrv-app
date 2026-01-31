import type {
  MorningAnalysisRequest,
  MorningAnalysisResponse,
  HabitEntry,
  Correlation,
} from '../../types';

/**
 * Comprehensive Morning Analysis Engine
 * Implements all 6 analysis stages for generating personalized daily plans
 */

export async function generateMorningAnalysis(
  request: MorningAnalysisRequest
): Promise<MorningAnalysisResponse> {
  // Stage 1: Status Assessment
  const statusAssessment = assessHRVStatus(request);

  // Stage 2: Previous Day Learning
  const previousDayLearnings = analyzePreviousDayPerformance(request);

  // Stage 3: Correlation Analysis
  const correlationInsights = analyzeCorrelations(request);

  // Stage 4: Goal Alignment
  const goalProgress = assessGoalProgress(request);

  // Stage 5: Focus Area Decision
  const focusArea = determineFocusArea(request, statusAssessment);

  // Stage 6: Recommendation Generation
  const recommendations = await generateRecommendations(request, {
    statusAssessment,
    previousDayLearnings,
    correlationInsights,
    focusArea,
    goalProgress,
  });

  // Combine all insights
  const allInsights = [
    ...statusAssessment.insights,
    ...correlationInsights,
  ];

  return {
    analysis: {
      status: {
        hrvPercentile: statusAssessment.percentile,
        vsSevenDay: statusAssessment.vsSevenDay,
        recoveryState: statusAssessment.state,
      },
      insights: allInsights,
      previousDayLearnings,
      focusArea: focusArea.area,
      reasoning: focusArea.reasoning,
      recommendations,
      goalProgress: goalProgress,
      estimatedEndOfDayHRV: calculateEstimatedHRV(request, focusArea.area),
    },
  };
}

// Stage 1: Status Assessment
function assessHRVStatus(request: MorningAnalysisRequest) {
  const { todayBiometrics, historical, userProfile } = request;

  // Calculate percentile based on age and gender
  const percentile = calculateHRVPercentile(
    todayBiometrics.hrv,
    userProfile.age,
    userProfile.gender
  );

  // Compare to 7-day average
  const vsSevenDay = todayBiometrics.hrv - historical.avg7Day;

  // Determine recovery state
  let state: string;
  if (todayBiometrics.recoveryScore >= 67) {
    state = 'Well Recovered';
  } else if (todayBiometrics.recoveryScore >= 34) {
    state = 'Moderately Recovered';
  } else {
    state = 'Needs Recovery';
  }

  // Generate insights
  const insights: string[] = [];

  if (vsSevenDay > 5) {
    insights.push(`Your HRV is ${Math.round(vsSevenDay)}ms above your 7-day average - excellent recovery!`);
  } else if (vsSevenDay < -5) {
    insights.push(`Your HRV is ${Math.round(Math.abs(vsSevenDay))}ms below your 7-day average - your body needs extra care today`);
  }

  if (todayBiometrics.sleepHours < 7) {
    insights.push('Sleep debt detected - prioritize early bedtime tonight');
  } else if (todayBiometrics.sleepHours >= 8) {
    insights.push('Excellent sleep duration - your body had time to recover');
  }

  if (historical.trend === 'improving') {
    insights.push('Your HRV trend is improving over the last 30 days');
  } else if (historical.trend === 'declining') {
    insights.push('Your HRV has been declining - time to focus on recovery');
  }

  return {
    percentile,
    vsSevenDay,
    state,
    insights,
  };
}

// Stage 2: Previous Day Learning
function analyzePreviousDayPerformance(request: MorningAnalysisRequest): string[] {
  const { yesterdayPlanReview } = request;
  const learnings: string[] = [];

  if (!yesterdayPlanReview) {
    return learnings;
  }

  const adherenceRate =
    yesterdayPlanReview.totalActions > 0
      ? (yesterdayPlanReview.completedActions.length / yesterdayPlanReview.totalActions) * 100
      : 0;

  if (adherenceRate >= 70) {
    learnings.push(`Great job! You completed ${Math.round(adherenceRate)}% of yesterday's plan`);
  } else if (adherenceRate >= 40) {
    learnings.push(`You completed ${Math.round(adherenceRate)}% of yesterday's plan - let's aim higher today`);
  } else if (adherenceRate > 0) {
    learnings.push(`Yesterday was challenging - only ${Math.round(adherenceRate)}% completed. Today's plan is adjusted to be more manageable`);
  }

  if (yesterdayPlanReview.overallRating >= 4) {
    learnings.push('Yesterday felt good - we\'ll maintain similar recommendations');
  } else if (yesterdayPlanReview.overallRating <= 2) {
    learnings.push('Yesterday was tough - today\'s plan focuses on recovery and stress management');
  }

  return learnings;
}

// Stage 3: Correlation Analysis
function analyzeCorrelations(request: MorningAnalysisRequest): string[] {
  const { historical, habitData } = request;
  const insights: string[] = [];

  // Find top positive and negative correlations
  const sortedCorrelations = [...historical.correlations].sort(
    (a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient)
  );

  const topPositive = sortedCorrelations.filter((c) => c.coefficient > 0.3).slice(0, 2);
  const topNegative = sortedCorrelations.filter((c) => c.coefficient < -0.3).slice(0, 2);

  topPositive.forEach((corr) => {
    insights.push(
      `${corr.habitLabel} shows a +${Math.round(corr.percentageDiff)}% impact on your HRV`
    );
  });

  topNegative.forEach((corr) => {
    insights.push(
      `${corr.habitLabel} shows a ${Math.round(corr.percentageDiff)}% negative impact on your HRV`
    );
  });

  return insights;
}

// Stage 4: Goal Alignment
function assessGoalProgress(request: MorningAnalysisRequest) {
  const { todayBiometrics, healthProfile } = request;

  if (!healthProfile.targetHRV) {
    return undefined;
  }

  const currentHRV = todayBiometrics.hrv;
  const targetHRV = healthProfile.targetHRV;
  const gap = targetHRV - currentHRV;
  const onTrack = gap <= targetHRV * 0.1; // Within 10% of target

  // Estimate days to target (assuming 1ms improvement per week)
  const daysToTarget = gap > 0 ? Math.ceil((gap / 1) * 7) : 0;

  return {
    currentHRV,
    targetHRV,
    onTrack,
    daysToTarget,
  };
}

// Stage 5: Focus Area Decision
function determineFocusArea(
  request: MorningAnalysisRequest,
  statusAssessment: ReturnType<typeof assessHRVStatus>
) {
  const { todayBiometrics, historical } = request;

  // Recovery needed if:
  // - HRV < 7-day average OR
  // - Recovery score < 33% OR
  // - Sleep < 6 hours
  if (
    todayBiometrics.hrv < historical.avg7Day ||
    todayBiometrics.recoveryScore < 33 ||
    todayBiometrics.sleepHours < 6
  ) {
    return {
      area: 'Recovery' as const,
      reasoning:
        'Your body needs extra recovery today. Focus on stress management, sleep, and gentle movement.',
    };
  }

  // Push if:
  // - HRV > 7-day average AND
  // - Recovery score > 66%
  if (todayBiometrics.hrv > historical.avg7Day && todayBiometrics.recoveryScore > 66) {
    return {
      area: 'Push' as const,
      reasoning:
        'You\'re well-recovered and ready to challenge yourself. Great day for higher intensity activities.',
    };
  }

  // Maintenance otherwise
  return {
    area: 'Maintenance' as const,
    reasoning:
      'You\'re in a good baseline state. Maintain your routines and avoid major stressors.',
  };
}

// Stage 6: Recommendation Generation
async function generateRecommendations(
  request: MorningAnalysisRequest,
  context: {
    statusAssessment: ReturnType<typeof assessHRVStatus>;
    previousDayLearnings: string[];
    correlationInsights: string[];
    focusArea: ReturnType<typeof determineFocusArea>;
    goalProgress: ReturnType<typeof assessGoalProgress> | undefined;
  }
) {
  const recommendations: MorningAnalysisResponse['analysis']['recommendations'] = [];

  const { focusArea } = context;
  const { todayBiometrics, healthProfile, habitData, recentPlans } = request;

  // Base recommendations on focus area
  if (focusArea.area === 'Recovery') {
    recommendations.push({
      priority: 1,
      category: 'Recovery',
      action: 'Take a 15-minute meditation or breathwork session',
      timing: 'Mid-morning (10-11am)',
      expectedImpact: '+3-5ms HRV tomorrow',
      reasoning: 'Meditation activates parasympathetic nervous system, promoting recovery',
    });

    recommendations.push({
      priority: 1,
      category: 'Sleep',
      action: 'Aim for 8+ hours of sleep tonight',
      timing: 'Bedtime by 10pm',
      expectedImpact: '+5-8ms HRV',
      reasoning: 'Sleep debt is impacting your recovery - prioritize rest',
    });

    recommendations.push({
      priority: 2,
      category: 'Exercise',
      action: 'Light walk or gentle yoga (30 minutes max)',
      timing: 'Afternoon',
      expectedImpact: 'Maintain HRV',
      reasoning: 'Gentle movement aids recovery without additional stress',
    });

    recommendations.push({
      priority: 2,
      category: 'Stress Management',
      action: 'Avoid high-stress meetings or decisions',
      timing: 'All day',
      expectedImpact: '+2-3ms HRV',
      reasoning: 'Your nervous system needs a break from intense demands',
    });
  } else if (focusArea.area === 'Push') {
    recommendations.push({
      priority: 1,
      category: 'Exercise',
      action: 'High-intensity workout or challenging training session',
      timing: 'Morning or early afternoon',
      expectedImpact: 'Improved fitness, potential -5ms HRV tomorrow',
      reasoning: 'You\'re well-recovered - perfect time to stress the system for adaptation',
    });

    recommendations.push({
      priority: 2,
      category: 'Nutrition',
      action: 'Increase protein intake (30g+ per meal)',
      timing: 'All meals',
      expectedImpact: 'Better recovery',
      reasoning: 'Support muscle recovery and adaptation from training',
    });

    recommendations.push({
      priority: 2,
      category: 'Hydration',
      action: 'Drink 3+ liters of water',
      timing: 'Throughout day',
      expectedImpact: 'Optimal performance',
      reasoning: 'High activity days require extra hydration',
    });
  } else {
    // Maintenance
    recommendations.push({
      priority: 1,
      category: 'Exercise',
      action: 'Moderate cardio or strength training (45-60 minutes)',
      timing: 'Morning or afternoon',
      expectedImpact: 'Maintain HRV',
      reasoning: 'Continue building fitness while maintaining recovery balance',
    });

    recommendations.push({
      priority: 2,
      category: 'Nutrition',
      action: '5+ servings of fruits and vegetables',
      timing: 'Throughout day',
      expectedImpact: '+1-2ms HRV',
      reasoning: 'Micronutrients support recovery and reduce inflammation',
    });

    recommendations.push({
      priority: 2,
      category: 'Sleep',
      action: 'Aim for 7-8 hours of quality sleep',
      timing: 'Consistent bedtime',
      expectedImpact: 'Maintain baseline',
      reasoning: 'Consistent sleep maintains your current HRV levels',
    });
  }

  // Add goal-specific recommendation if applicable
  if (healthProfile.primaryGoal) {
    recommendations.push({
      priority: 3,
      category: 'Goal Progress',
      action: `Work toward: ${healthProfile.primaryGoal}`,
      timing: 'Daily',
      expectedImpact: 'Progress toward goal',
      reasoning: 'Aligned with your primary health objective',
    });
  }

  return recommendations;
}

// Helper: Calculate HRV percentile based on age/gender
function calculateHRVPercentile(hrv: number, age: number, gender: string): number {
  // Simplified percentile calculation
  // Real implementation would use actual population data
  const baselineHRV = gender === 'male' ? 60 : 65;
  const ageAdjustment = Math.max(0, (40 - age) * 0.5);
  const adjustedBaseline = baselineHRV + ageAdjustment;

  const percentile = 50 + ((hrv - adjustedBaseline) / adjustedBaseline) * 50;
  return Math.max(1, Math.min(99, Math.round(percentile)));
}

// Helper: Estimate end of day HRV based on focus area
function calculateEstimatedHRV(
  request: MorningAnalysisRequest,
  focusArea: 'Recovery' | 'Maintenance' | 'Push'
): number {
  const { todayBiometrics } = request;
  const currentHRV = todayBiometrics.hrv;

  // Estimate next day HRV based on focus
  if (focusArea === 'Recovery') {
    return Math.round(currentHRV + 5); // Recovery should improve HRV
  } else if (focusArea === 'Push') {
    return Math.round(currentHRV - 3); // Push may temporarily lower HRV
  } else {
    return Math.round(currentHRV + 1); // Maintenance maintains or slightly improves
  }
}
