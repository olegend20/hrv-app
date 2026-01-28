/**
 * Calculate Pearson correlation coefficient between two arrays
 * Returns a value between -1 and 1
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Arrays must have the same length');
  }

  const n = x.length;
  if (n < 2) {
    throw new Error('Arrays must have at least 2 elements');
  }

  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate numerator (covariance) and denominators (standard deviations)
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  // Handle constant values (no variance)
  if (sumSqX === 0 || sumSqY === 0) {
    return 0;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  return numerator / denominator;
}

/**
 * Calculate the mean of an array of numbers
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation of an array
 */
export function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Calculate the percentage difference between two values
 */
export function calculatePercentageDiff(a: number, b: number): number {
  if (b === 0) return 0;
  return ((a - b) / b) * 100;
}
