import { getBenchmark, getAgeBracket, Gender, AgeBracket } from '@/constants/benchmarks';

export interface PercentileResult {
  percentile: number;
  bracket: AgeBracket;
  benchmarkP50: number;
  comparison: 'above' | 'below' | 'at';
}

/**
 * Calculate the percentile for a given HRV value based on age and gender.
 * Uses linear interpolation between benchmark percentiles.
 */
export function getPercentile(hrv: number, age: number, gender: Gender): PercentileResult {
  const bracket = getAgeBracket(age);
  const benchmark = getBenchmark(age, gender);

  let percentile: number;

  if (hrv <= benchmark.p25) {
    // Below 25th percentile - extrapolate down
    percentile = Math.max(1, 25 * (hrv / benchmark.p25));
  } else if (hrv <= benchmark.p50) {
    // Between 25th and 50th
    percentile = 25 + 25 * ((hrv - benchmark.p25) / (benchmark.p50 - benchmark.p25));
  } else if (hrv <= benchmark.p75) {
    // Between 50th and 75th
    percentile = 50 + 25 * ((hrv - benchmark.p50) / (benchmark.p75 - benchmark.p50));
  } else {
    // Above 75th percentile - extrapolate up
    percentile = Math.min(99, 75 + 25 * ((hrv - benchmark.p75) / benchmark.p75));
  }

  const comparison = hrv > benchmark.p50 ? 'above' : hrv < benchmark.p50 ? 'below' : 'at';

  return {
    percentile: Math.round(percentile),
    bracket,
    benchmarkP50: benchmark.p50,
    comparison,
  };
}

/**
 * Get a human-readable description of the percentile
 */
export function getPercentileDescription(percentile: number): string {
  if (percentile >= 90) return 'Excellent';
  if (percentile >= 75) return 'Above Average';
  if (percentile >= 50) return 'Average';
  if (percentile >= 25) return 'Below Average';
  return 'Low';
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
