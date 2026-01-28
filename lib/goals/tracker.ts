import { HRVReading, UserProfile } from '@/types';
import { getBenchmark } from '@/constants/benchmarks';
import { calculateAverage, getReadingsForLastDays } from '@/lib/hrv/statistics';

export interface GoalProgress {
  currentHrv: number;
  targetHrv: number;
  progress: number; // 0-100
  daysAtGoal: number;
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * Convert a percentile goal to target HRV using benchmarks
 */
export function percentileToTargetHrv(
  percentile: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  const benchmark = getBenchmark(age, gender);

  if (percentile <= 25) {
    return benchmark.p25;
  }
  if (percentile <= 50) {
    // Interpolate between p25 and p50
    const ratio = (percentile - 25) / 25;
    return benchmark.p25 + ratio * (benchmark.p50 - benchmark.p25);
  }
  if (percentile <= 75) {
    // Interpolate between p50 and p75
    const ratio = (percentile - 50) / 25;
    return benchmark.p50 + ratio * (benchmark.p75 - benchmark.p50);
  }
  // Above 75th percentile - extrapolate
  const ratio = (percentile - 75) / 25;
  return benchmark.p75 + ratio * (benchmark.p75 - benchmark.p50);
}

/**
 * Calculate progress toward HRV goal
 */
export function calculateGoalProgress(
  readings: HRVReading[],
  profile: UserProfile
): GoalProgress | null {
  if (readings.length === 0 || !profile.targetPercentile) {
    return null;
  }

  const targetHrv = percentileToTargetHrv(
    profile.targetPercentile,
    profile.age,
    profile.gender
  );

  // Get recent readings
  const last7Days = getReadingsForLastDays(readings, 7);
  const last14Days = getReadingsForLastDays(readings, 14);

  if (last7Days.length === 0) {
    return null;
  }

  const currentHrv = calculateAverage(last7Days.map((r) => r.hrvMs)) ?? 0;
  const progress = Math.min((currentHrv / targetHrv) * 100, 100);

  // Count days at or above goal
  let daysAtGoal = 0;
  const sortedReadings = [...readings].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  for (const reading of sortedReadings) {
    if (reading.hrvMs >= targetHrv) {
      daysAtGoal++;
    } else {
      break; // Stop counting at first day below goal
    }
  }

  // Determine trend
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (last14Days.length >= 7) {
    const avg7Day = calculateAverage(last7Days.map((r) => r.hrvMs)) ?? 0;
    const avg14Day = calculateAverage(last14Days.map((r) => r.hrvMs)) ?? 0;

    if (avg14Day > 0) {
      const change = ((avg7Day - avg14Day) / avg14Day) * 100;
      if (change >= 5) trend = 'improving';
      else if (change <= -5) trend = 'declining';
    }
  }

  return {
    currentHrv: Math.round(currentHrv),
    targetHrv: Math.round(targetHrv),
    progress: Math.round(progress),
    daysAtGoal,
    trend,
  };
}

/**
 * Suggested goal percentiles
 */
export const GOAL_PRESETS = [
  { label: 'Average (50th)', percentile: 50 },
  { label: 'Above Average (75th)', percentile: 75 },
  { label: 'Excellent (90th)', percentile: 90 },
];
