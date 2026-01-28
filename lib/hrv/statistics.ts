import { HRVReading } from '@/types';

export interface HrvStatistics {
  current: number | null;
  average7Day: number | null;
  average30Day: number | null;
  min: number | null;
  max: number | null;
  trend: 'improving' | 'declining' | 'stable' | null;
}

/**
 * Calculate the arithmetic mean of an array of numbers
 */
export function calculateAverage(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Get readings from the last N days
 */
export function getReadingsForLastDays(
  readings: HRVReading[],
  days: number
): HRVReading[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  return readings.filter((r) => r.date >= cutoffStr);
}

/**
 * Calculate rolling average for each reading
 */
export function calculateRollingAverage(
  readings: HRVReading[],
  windowDays: number
): { date: string; value: number }[] {
  const result: { date: string; value: number }[] = [];

  for (let i = 0; i < readings.length; i++) {
    const windowStart = Math.max(0, i - windowDays + 1);
    const windowReadings = readings.slice(windowStart, i + 1);
    const avg = calculateAverage(windowReadings.map((r) => r.hrvMs));

    if (avg !== null) {
      result.push({
        date: readings[i].date,
        value: Math.round(avg * 10) / 10,
      });
    }
  }

  return result;
}

/**
 * Calculate comprehensive HRV statistics
 */
export function calculateStatistics(readings: HRVReading[]): HrvStatistics {
  if (readings.length === 0) {
    return {
      current: null,
      average7Day: null,
      average30Day: null,
      min: null,
      max: null,
      trend: null,
    };
  }

  // Sort by date descending to get the most recent
  const sorted = [...readings].sort((a, b) => b.date.localeCompare(a.date));
  const current = sorted[0].hrvMs;

  // Get HRV values
  const allValues = readings.map((r) => r.hrvMs);
  const last7Days = getReadingsForLastDays(readings, 7).map((r) => r.hrvMs);
  const last30Days = getReadingsForLastDays(readings, 30).map((r) => r.hrvMs);
  const last14Days = getReadingsForLastDays(readings, 14).map((r) => r.hrvMs);

  // Calculate averages
  const average7Day = calculateAverage(last7Days);
  const average30Day = calculateAverage(last30Days);

  // Calculate min/max
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  // Calculate trend
  let trend: 'improving' | 'declining' | 'stable' | null = null;
  if (average7Day !== null && last14Days.length > 0) {
    const average14Day = calculateAverage(last14Days);
    if (average14Day !== null) {
      const change = ((average7Day - average14Day) / average14Day) * 100;
      if (change >= 5) {
        trend = 'improving';
      } else if (change <= -5) {
        trend = 'declining';
      } else {
        trend = 'stable';
      }
    }
  }

  return {
    current,
    average7Day: average7Day !== null ? Math.round(average7Day) : null,
    average30Day: average30Day !== null ? Math.round(average30Day) : null,
    min,
    max,
    trend,
  };
}

/**
 * Calculate change between two values as a percentage
 */
export function calculateChange(
  current: number,
  previous: number
): { value: number; direction: 'up' | 'down' | 'same' } {
  if (previous === 0) {
    return { value: 0, direction: 'same' };
  }

  const change = ((current - previous) / previous) * 100;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'same';

  return {
    value: Math.abs(Math.round(change)),
    direction,
  };
}
