import { Correlation, Recommendation, HabitEntry } from '@/types';

interface FrequencyAnalysis {
  habitKey: string;
  daysWithHabit: number;
  totalDays: number;
  frequency: number; // 0-1
}

/**
 * Calculate how frequently each habit is practiced
 */
function analyzeHabitFrequency(habits: HabitEntry[]): Map<string, FrequencyAnalysis> {
  const frequencies = new Map<string, FrequencyAnalysis>();
  const totalDays = habits.length;

  if (totalDays === 0) return frequencies;

  // Count occurrences of each binary habit
  const counts: Record<string, number> = {
    exercise: 0,
    meditation: 0,
    alcohol: 0,
    cold_exposure: 0,
    high_sleep_quality: 0,
    low_stress: 0,
  };

  for (const habit of habits) {
    if (habit.exercise) counts.exercise++;
    if (habit.meditation.practiced) counts.meditation++;
    if (habit.alcohol.consumed) counts.alcohol++;
    if (habit.coldExposure) counts.cold_exposure++;
    if (habit.sleep.quality >= 4) counts.high_sleep_quality++;
    if (habit.stressLevel <= 2) counts.low_stress++;
  }

  for (const [key, count] of Object.entries(counts)) {
    frequencies.set(key, {
      habitKey: key,
      daysWithHabit: count,
      totalDays,
      frequency: count / totalDays,
    });
  }

  return frequencies;
}

/**
 * Generate personalized recommendations based on correlations and frequency
 */
export function generateRecommendations(
  correlations: Correlation[],
  habits: HabitEntry[],
  maxRecommendations: number = 5
): Recommendation[] {
  if (correlations.length === 0 || habits.length < 7) {
    return [];
  }

  const frequencies = analyzeHabitFrequency(habits);
  const recommendations: Recommendation[] = [];

  for (const correlation of correlations) {
    // Skip weak correlations
    if (correlation.significance === 'low' && Math.abs(correlation.coefficient) < 0.2) {
      continue;
    }

    const freq = frequencies.get(correlation.habitKey);
    const currentFreq = freq?.frequency ?? 0.5;

    // Positive correlation (habit helps HRV)
    if (correlation.percentageDiff > 0 && correlation.coefficient > 0) {
      // User does this infrequently - recommend increasing
      if (currentFreq < 0.7) {
        const impactScore = correlation.coefficient * (1 - currentFreq) * 100;
        recommendations.push({
          habitKey: correlation.habitKey,
          habitLabel: correlation.habitLabel,
          action: 'increase',
          impactScore: Math.round(impactScore * 10) / 10,
          message: `Try ${correlation.habitLabel.toLowerCase()} today`,
          expectedImpact: `+${Math.round(correlation.percentageDiff)}% HRV on ${correlation.habitLabel.toLowerCase()} days`,
        });
      }
    }

    // Negative correlation (habit hurts HRV)
    if (correlation.percentageDiff < 0 && correlation.coefficient < 0) {
      // User does this frequently - recommend decreasing
      if (currentFreq > 0.3) {
        const impactScore = Math.abs(correlation.coefficient) * currentFreq * 100;
        recommendations.push({
          habitKey: correlation.habitKey,
          habitLabel: correlation.habitLabel,
          action: 'decrease',
          impactScore: Math.round(impactScore * 10) / 10,
          message: `Consider reducing ${correlation.habitLabel.toLowerCase()}`,
          expectedImpact: `${Math.round(correlation.percentageDiff)}% HRV impact`,
        });
      }
    }
  }

  // Sort by impact score (highest first)
  recommendations.sort((a, b) => b.impactScore - a.impactScore);

  // Return top recommendations
  return recommendations.slice(0, maxRecommendations);
}

/**
 * Get today's focus recommendation
 * Rotates through recommendations to keep variety
 */
export function getTodaysFocus(
  recommendations: Recommendation[],
  todayHabits: HabitEntry | undefined
): Recommendation | null {
  if (recommendations.length === 0) return null;

  // If user has today's habits, filter out what they've already done
  if (todayHabits) {
    const alreadyDone = new Set<string>();

    if (todayHabits.exercise) alreadyDone.add('exercise');
    if (todayHabits.meditation.practiced) alreadyDone.add('meditation');
    if (todayHabits.coldExposure) alreadyDone.add('cold_exposure');

    const remaining = recommendations.filter(
      (r) => r.action === 'increase' && !alreadyDone.has(r.habitKey)
    );

    if (remaining.length > 0) return remaining[0];
  }

  // Return first 'increase' recommendation
  const increaseRecs = recommendations.filter((r) => r.action === 'increase');
  if (increaseRecs.length > 0) return increaseRecs[0];

  return recommendations[0];
}

/**
 * Generate a weekly plan distributing recommendations
 */
export function generateWeeklyPlan(
  recommendations: Recommendation[]
): Map<number, Recommendation[]> {
  const plan = new Map<number, Recommendation[]>();

  // Initialize 7 days (0 = Sunday, 6 = Saturday)
  for (let i = 0; i < 7; i++) {
    plan.set(i, []);
  }

  // Distribute recommendations across days
  const increaseRecs = recommendations.filter((r) => r.action === 'increase');

  for (let i = 0; i < increaseRecs.length; i++) {
    // Spread recommendations across weekdays
    const day = i % 7;
    plan.get(day)!.push(increaseRecs[i]);
  }

  return plan;
}
