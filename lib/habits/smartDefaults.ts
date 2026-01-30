import { ScreenshotData, HabitEntry, MorningContext } from '@/types';

/**
 * Old HabitForm format (for compatibility with existing component)
 */
export interface OldHabitFormData {
  date: string;
  sleep: {
    hours: number;
    quality: 1 | 2 | 3 | 4 | 5;
  };
  exercise?: {
    type: string;
    durationMins: number;
    intensity: 'low' | 'medium' | 'high';
  };
  alcohol?: {
    consumed: boolean;
    units?: number;
  };
  meditation?: {
    practiced: boolean;
    durationMins?: number;
  };
  stressLevel: 1 | 2 | 3 | 4 | 5;
  coldExposure: boolean;
  notes?: string;
}

/**
 * Smart Defaults for Old Habit Form
 * Pre-fills habit data from screenshots and morning context
 */
export function generateSmartDefaults(
  screenshots: { recovery: ScreenshotData | null; sleep: ScreenshotData | null },
  morningContext: MorningContext | null
): Partial<OldHabitFormData> {
  const defaults: Partial<OldHabitFormData> = {};

  // Extract sleep data from screenshots
  const sleepData = screenshots.sleep?.extractedData;
  const recoveryData = screenshots.recovery?.extractedData;

  // Sleep - pre-fill from screenshot
  if (sleepData) {
    defaults.sleep = {
      hours: sleepData.sleepHours || 7,
      quality: convertSleepQualityToRating(sleepData.sleepQuality),
    };
  } else if (morningContext) {
    // Use morning context as fallback
    defaults.sleep = {
      hours: 7, // Default
      quality: morningContext.sleepRating,
    };
  }

  // Stress - infer from morning context
  if (morningContext) {
    defaults.stressLevel = inferStressFromEnergy(
      morningContext.energyLevel,
      morningContext.sleepRating
    );
  } else {
    defaults.stressLevel = 3; // Default to moderate
  }

  // Meditation - default to false
  defaults.meditation = {
    practiced: false,
    durationMins: 15, // Default suggestion if they toggle it on
  };

  // Alcohol - default to none
  defaults.alcohol = {
    consumed: false,
    units: 2, // Default if they toggle it on
  };

  // Exercise - default to none
  defaults.exercise = undefined;

  // Cold exposure - default to false
  defaults.coldExposure = false;

  // Add notes from morning context
  if (morningContext?.notes) {
    defaults.notes = morningContext.notes;
  }

  return defaults;
}

/**
 * Convert old habit form data to comprehensive HabitEntry format
 */
export function convertToHabitEntry(
  oldData: Omit<OldHabitFormData, 'id'>
): Omit<HabitEntry, 'id'> {
  return {
    date: oldData.date,
    sleep: oldData.sleep,
    stress: {
      overallLevel: oldData.stressLevel,
    },
    exercise: oldData.exercise
      ? {
          type: mapExerciseType(oldData.exercise.type),
          durationMins: oldData.exercise.durationMins,
          intensity: mapIntensity(oldData.exercise.intensity),
        }
      : undefined,
    substances: {
      alcohol: oldData.alcohol || { consumed: false },
    },
    recovery: {
      meditation: oldData.meditation || { practiced: false },
      coldExposure: oldData.coldExposure
        ? {
            practiced: true,
            type: 'cold-shower',
            durationMins: 5,
          }
        : undefined,
    },
    notes: oldData.notes,
  };
}

/**
 * Map exercise type string to HabitEntry exercise type
 */
function mapExerciseType(
  type: string
): 'cardio' | 'strength' | 'yoga' | 'sports' | 'walking' | 'none' {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('run') || lowerType.includes('cycling') || lowerType.includes('swim')) {
    return 'cardio';
  }
  if (lowerType.includes('strength') || lowerType.includes('weight')) {
    return 'strength';
  }
  if (lowerType.includes('yoga')) {
    return 'yoga';
  }
  if (lowerType.includes('walk')) {
    return 'walking';
  }
  if (lowerType.includes('sport')) {
    return 'sports';
  }
  return 'cardio'; // Default
}

/**
 * Map intensity string to HabitEntry intensity
 */
function mapIntensity(
  intensity: 'low' | 'medium' | 'high'
): 'light' | 'moderate' | 'vigorous' | 'high-intensity' {
  switch (intensity) {
    case 'low':
      return 'light';
    case 'medium':
      return 'moderate';
    case 'high':
      return 'vigorous';
    default:
      return 'moderate';
  }
}

/**
 * Convert sleep quality percentage (0-100) to rating (1-5)
 */
function convertSleepQualityToRating(qualityPercent?: number): 1 | 2 | 3 | 4 | 5 {
  if (!qualityPercent) return 3;

  if (qualityPercent >= 90) return 5;
  if (qualityPercent >= 75) return 4;
  if (qualityPercent >= 60) return 3;
  if (qualityPercent >= 40) return 2;
  return 1;
}

/**
 * Infer stress level from energy and sleep ratings
 * Low energy + poor sleep often indicates higher stress
 */
function inferStressFromEnergy(
  energyLevel: 1 | 2 | 3 | 4 | 5,
  sleepRating: 1 | 2 | 3 | 4 | 5
): 1 | 2 | 3 | 4 | 5 {
  // If energy is low despite good sleep, likely stressed
  if (sleepRating >= 4 && energyLevel <= 2) {
    return 4; // Higher stress
  }

  // If both sleep and energy are low, very stressed
  if (sleepRating <= 2 && energyLevel <= 2) {
    return 5; // Very high stress
  }

  // If energy is high, likely low stress
  if (energyLevel >= 4) {
    return Math.max(1, 6 - energyLevel) as 1 | 2 | 3 | 4 | 5;
  }

  // Default to moderate stress
  return 3;
}

/**
 * Create a complete HabitEntry with defaults for required fields
 */
export function createHabitEntryWithDefaults(
  date: string,
  partialData: Partial<HabitEntry>
): Omit<HabitEntry, 'id'> {
  return {
    date,
    sleep: partialData.sleep || {
      hours: 7,
      quality: 3,
    },
    stress: partialData.stress || {
      overallLevel: 3,
    },
    exercise: partialData.exercise,
    substances: partialData.substances,
    recovery: partialData.recovery,
    work: partialData.work,
    movement: partialData.movement,
    nutrition: partialData.nutrition,
    social: partialData.social,
    family: partialData.family,
    environment: partialData.environment,
    health: partialData.health,
    lifestyle: partialData.lifestyle,
    notes: partialData.notes,
    significantEvent: partialData.significantEvent,
  };
}
