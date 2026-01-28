export type SignificanceLevel = 'high' | 'medium' | 'low';

interface SignificanceResult {
  level: SignificanceLevel;
  pValue: number;
  description: string;
}

/**
 * Calculate the statistical significance of a correlation
 * Based on sample size and correlation coefficient strength
 */
export function calculateSignificance(
  coefficient: number,
  sampleSize: number
): SignificanceResult {
  const absCoef = Math.abs(coefficient);

  // Calculate t-statistic
  const tStatistic = (coefficient * Math.sqrt(sampleSize - 2)) /
                     Math.sqrt(1 - coefficient * coefficient);

  // Approximate p-value using t-distribution
  // For simplicity, we use heuristics based on sample size and coefficient
  const pValue = approximatePValue(tStatistic, sampleSize - 2);

  // Determine significance level
  let level: SignificanceLevel;
  let description: string;

  if (sampleSize >= 30 && absCoef >= 0.5 && pValue < 0.01) {
    level = 'high';
    description = 'Strong correlation with high confidence';
  } else if (sampleSize >= 14 && absCoef >= 0.3 && pValue < 0.05) {
    level = 'medium';
    description = 'Moderate correlation with reasonable confidence';
  } else {
    level = 'low';
    description = 'Weak correlation or insufficient data';
  }

  return { level, pValue, description };
}

/**
 * Approximate p-value from t-statistic and degrees of freedom
 * Uses a simplified approximation suitable for mobile apps
 */
function approximatePValue(t: number, df: number): number {
  const absT = Math.abs(t);

  // Use a lookup-based approximation
  // For df >= 30, t >= 2.75 -> p < 0.01
  // For df >= 30, t >= 2.04 -> p < 0.05
  // For df >= 14, t >= 2.98 -> p < 0.01
  // For df >= 14, t >= 2.14 -> p < 0.05

  if (df >= 30) {
    if (absT >= 2.75) return 0.005;
    if (absT >= 2.04) return 0.03;
    if (absT >= 1.70) return 0.08;
    return 0.2;
  }

  if (df >= 14) {
    if (absT >= 2.98) return 0.005;
    if (absT >= 2.14) return 0.03;
    if (absT >= 1.76) return 0.08;
    return 0.2;
  }

  if (df >= 8) {
    if (absT >= 3.36) return 0.005;
    if (absT >= 2.31) return 0.03;
    if (absT >= 1.86) return 0.08;
    return 0.3;
  }

  // Very small samples - high uncertainty
  return 0.5;
}

/**
 * Determine minimum sample size needed for reliable correlation
 */
export function getMinSampleSize(targetSignificance: SignificanceLevel): number {
  switch (targetSignificance) {
    case 'high':
      return 30;
    case 'medium':
      return 14;
    case 'low':
    default:
      return 7;
  }
}

/**
 * Check if sample size is sufficient for meaningful correlation
 */
export function isSampleSufficient(sampleSize: number): boolean {
  return sampleSize >= 7;
}
