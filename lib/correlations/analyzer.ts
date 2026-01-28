import { HRVReading, HabitEntry, Correlation } from '@/types';
import { calculateCorrelation, calculateMean, calculatePercentageDiff } from './calculator';
import { calculateSignificance, isSampleSufficient } from './significance';

interface AnalysisResult {
  correlations: Correlation[];
  totalDays: number;
  sufficientData: boolean;
}

interface HabitConfig {
  key: string;
  label: string;
  type: 'binary' | 'numeric';
  extractor: (entry: HabitEntry) => number | null;
}

// Define all habits to analyze
const HABIT_CONFIGS: HabitConfig[] = [
  {
    key: 'sleep_hours',
    label: 'Sleep Duration',
    type: 'numeric',
    extractor: (e) => e.sleep.hours,
  },
  {
    key: 'sleep_quality',
    label: 'Sleep Quality',
    type: 'numeric',
    extractor: (e) => e.sleep.quality,
  },
  {
    key: 'exercise',
    label: 'Exercise',
    type: 'binary',
    extractor: (e) => (e.exercise ? 1 : 0),
  },
  {
    key: 'exercise_duration',
    label: 'Exercise Duration',
    type: 'numeric',
    extractor: (e) => e.exercise?.durationMins ?? null,
  },
  {
    key: 'alcohol',
    label: 'Alcohol',
    type: 'binary',
    extractor: (e) => (e.alcohol.consumed ? 1 : 0),
  },
  {
    key: 'alcohol_units',
    label: 'Alcohol Units',
    type: 'numeric',
    extractor: (e) => (e.alcohol.consumed ? (e.alcohol.units ?? 0) : null),
  },
  {
    key: 'meditation',
    label: 'Meditation',
    type: 'binary',
    extractor: (e) => (e.meditation.practiced ? 1 : 0),
  },
  {
    key: 'meditation_duration',
    label: 'Meditation Duration',
    type: 'numeric',
    extractor: (e) => (e.meditation.practiced ? (e.meditation.durationMins ?? 0) : null),
  },
  {
    key: 'stress',
    label: 'Stress Level',
    type: 'numeric',
    extractor: (e) => e.stressLevel,
  },
  {
    key: 'cold_exposure',
    label: 'Cold Exposure',
    type: 'binary',
    extractor: (e) => (e.coldExposure ? 1 : 0),
  },
];

/**
 * Align habit data with HRV readings by date
 * Returns paired arrays of habit values and HRV values
 */
function alignData(
  habits: HabitEntry[],
  hrvReadings: HRVReading[],
  habitExtractor: (entry: HabitEntry) => number | null,
  useLag: boolean = false
): { habitValues: number[]; hrvValues: number[] } {
  const hrvByDate = new Map<string, number>();
  for (const reading of hrvReadings) {
    hrvByDate.set(reading.date, reading.hrvMs);
  }

  const habitValues: number[] = [];
  const hrvValues: number[] = [];

  for (const habit of habits) {
    const habitValue = habitExtractor(habit);
    if (habitValue === null) continue;

    // If using lag, look at next day's HRV
    let hrvDate = habit.date;
    if (useLag) {
      const nextDay = new Date(habit.date);
      nextDay.setDate(nextDay.getDate() + 1);
      hrvDate = nextDay.toISOString().split('T')[0];
    }

    const hrvValue = hrvByDate.get(hrvDate);
    if (hrvValue !== undefined) {
      habitValues.push(habitValue);
      hrvValues.push(hrvValue);
    }
  }

  return { habitValues, hrvValues };
}

/**
 * Calculate correlation for a single habit
 */
function analyzeHabit(
  config: HabitConfig,
  habits: HabitEntry[],
  hrvReadings: HRVReading[],
  useLag: boolean = false
): Correlation | null {
  const { habitValues, hrvValues } = alignData(
    habits,
    hrvReadings,
    config.extractor,
    useLag
  );

  if (habitValues.length < 7) {
    return null;
  }

  try {
    const coefficient = calculateCorrelation(habitValues, hrvValues);
    const significance = calculateSignificance(coefficient, habitValues.length);

    // For binary habits, calculate average HRV with/without
    let avgHrvWith = 0;
    let avgHrvWithout = 0;

    if (config.type === 'binary') {
      const withHabit: number[] = [];
      const withoutHabit: number[] = [];

      for (let i = 0; i < habitValues.length; i++) {
        if (habitValues[i] === 1) {
          withHabit.push(hrvValues[i]);
        } else {
          withoutHabit.push(hrvValues[i]);
        }
      }

      avgHrvWith = withHabit.length > 0 ? calculateMean(withHabit) : 0;
      avgHrvWithout = withoutHabit.length > 0 ? calculateMean(withoutHabit) : 0;
    } else {
      // For numeric, use median split
      const sortedValues = [...habitValues].sort((a, b) => a - b);
      const median = sortedValues[Math.floor(sortedValues.length / 2)];

      const highHrv: number[] = [];
      const lowHrv: number[] = [];

      for (let i = 0; i < habitValues.length; i++) {
        if (habitValues[i] >= median) {
          highHrv.push(hrvValues[i]);
        } else {
          lowHrv.push(hrvValues[i]);
        }
      }

      avgHrvWith = highHrv.length > 0 ? calculateMean(highHrv) : 0;
      avgHrvWithout = lowHrv.length > 0 ? calculateMean(lowHrv) : 0;
    }

    const percentageDiff = avgHrvWithout > 0
      ? calculatePercentageDiff(avgHrvWith, avgHrvWithout)
      : 0;

    return {
      habitKey: config.key,
      habitLabel: config.label,
      coefficient: Math.round(coefficient * 100) / 100,
      avgHrvWith: Math.round(avgHrvWith),
      avgHrvWithout: Math.round(avgHrvWithout),
      percentageDiff: Math.round(percentageDiff * 10) / 10,
      sampleSize: habitValues.length,
      significance: significance.level,
    };
  } catch (error) {
    console.error(`Error analyzing habit ${config.key}:`, error);
    return null;
  }
}

/**
 * Analyze all habits against HRV data
 */
export function analyzeAllHabits(
  habits: HabitEntry[],
  hrvReadings: HRVReading[],
  useLag: boolean = false
): AnalysisResult {
  const correlations: Correlation[] = [];

  for (const config of HABIT_CONFIGS) {
    const result = analyzeHabit(config, habits, hrvReadings, useLag);
    if (result) {
      correlations.push(result);
    }
  }

  // Sort by absolute correlation coefficient (strongest first)
  correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

  return {
    correlations,
    totalDays: habits.length,
    sufficientData: habits.length >= 14,
  };
}

/**
 * Get habit configs for display
 */
export function getHabitConfigs(): HabitConfig[] {
  return HABIT_CONFIGS;
}

/**
 * Rank correlations by impact
 */
export function rankByImpact(correlations: Correlation[]): Correlation[] {
  return [...correlations].sort((a, b) => {
    // Combine coefficient magnitude and significance
    const scoreA = Math.abs(a.coefficient) * (a.significance === 'high' ? 1.5 : a.significance === 'medium' ? 1 : 0.5);
    const scoreB = Math.abs(b.coefficient) * (b.significance === 'high' ? 1.5 : b.significance === 'medium' ? 1 : 0.5);
    return scoreB - scoreA;
  });
}
