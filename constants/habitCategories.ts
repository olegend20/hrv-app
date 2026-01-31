import { HabitCategory, QuickLogPreset } from '@/types';

// Habit Categories - organized by impact level and UI presentation
export const HABIT_CATEGORIES: HabitCategory[] = [
  // === CORE CATEGORIES (Always visible, high impact) ===
  {
    id: 'sleep',
    name: 'Sleep',
    icon: '😴',
    description: 'Sleep duration, quality, and timing',
    impactLevel: 'major',
    isCore: true,
  },
  {
    id: 'work',
    name: 'Work & Career',
    icon: '💼',
    description: 'Work hours, meetings, deadlines, commute',
    impactLevel: 'major',
    isCore: true,
  },
  {
    id: 'exercise',
    name: 'Exercise & Movement',
    icon: '🏃',
    description: 'Physical activity and daily movement',
    impactLevel: 'major',
    isCore: true,
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    icon: '🥗',
    description: 'Diet quality, meal timing, hydration',
    impactLevel: 'major',
    isCore: true,
  },
  {
    id: 'substances',
    name: 'Alcohol & Caffeine',
    icon: '☕',
    description: 'Alcohol, caffeine, and other substances',
    impactLevel: 'major',
    isCore: true,
  },
  {
    id: 'stress',
    name: 'Stress & Mental Health',
    icon: '🧠',
    description: 'Stress levels, anxiety, mood',
    impactLevel: 'major',
    isCore: true,
  },

  // === OPTIONAL CATEGORIES (Expandable, moderate impact) ===
  {
    id: 'recovery',
    name: 'Recovery Practices',
    icon: '🧘',
    description: 'Meditation, breathwork, cold exposure',
    impactLevel: 'moderate',
    isCore: false,
  },
  {
    id: 'social',
    name: 'Social & Relationships',
    icon: '👥',
    description: 'Social interactions and relationships',
    impactLevel: 'moderate',
    isCore: false,
  },
  {
    id: 'family',
    name: 'Family & Life Balance',
    icon: '👨‍👩‍👧',
    description: 'Parenting, caregiving, work-life balance',
    impactLevel: 'moderate',
    isCore: false,
  },
  {
    id: 'environment',
    name: 'Environment',
    icon: '🌳',
    description: 'Air quality, nature, noise, temperature',
    impactLevel: 'moderate',
    isCore: false,
  },
  {
    id: 'health',
    name: 'Health & Medical',
    icon: '🏥',
    description: 'Illness, pain, medications, supplements',
    impactLevel: 'moderate',
    isCore: false,
  },
  {
    id: 'lifestyle',
    name: 'Technology & Lifestyle',
    icon: '📱',
    description: 'Screen time, blue light, morning light',
    impactLevel: 'moderate',
    isCore: false,
  },
];

// Quick Log Presets for common daily patterns
export const QUICK_LOG_PRESETS: QuickLogPreset[] = [
  {
    id: 'great-day',
    name: 'Great Day',
    icon: '😊',
    description: 'Slept well, low stress, healthy habits',
    values: {
      sleep: { hours: 8, quality: 4 },
      stress: { overallLevel: 2, mood: 4 },
      nutrition: { dietQuality: 4, hydration: 2.5 },
      substances: {
        alcohol: { consumed: false },
        caffeine: { consumed: true, cups: 2, afternoon: false },
      },
    },
  },
  {
    id: 'busy-work',
    name: 'Busy Workday',
    icon: '💼',
    description: 'Lots of meetings, moderate stress',
    values: {
      work: {
        workingHours: 10,
        meetings: 5,
        deadlinePressure: 3,
        mentalFatigue: 4,
      },
      stress: { overallLevel: 3, mood: 3 },
      movement: { sedentaryHours: 8, postureChanges: 'occasional' },
      substances: {
        caffeine: { consumed: true, cups: 3, afternoon: true },
      },
    },
  },
  {
    id: 'recovery',
    name: 'Recovery Day',
    icon: '🛀',
    description: 'Rest day, light activity, self-care',
    values: {
      exercise: { type: 'none', durationMins: 0, intensity: 'light' },
      recovery: {
        meditation: { practiced: true, durationMins: 20 },
        restDay: true,
      },
      stress: { overallLevel: 2, mood: 4 },
      movement: { sedentaryHours: 6 },
    },
  },
  {
    id: 'social-evening',
    name: 'Social Evening',
    icon: '🍷',
    description: 'Late night, alcohol, less sleep',
    values: {
      substances: {
        alcohol: { consumed: true, drinks: 2, timing: 'evening' },
      },
      sleep: { hours: 6.5, quality: 2 },
      social: { socialInteraction: 5, qualityTime: true },
      lifestyle: {
        screenTime: 4,
        blueLight: { evening: true, hoursBeforeBed: 1 },
      },
    },
  },
];

// Get categories filtered by core/optional
export function getCoreCategories(): HabitCategory[] {
  return HABIT_CATEGORIES.filter((cat) => cat.isCore);
}

export function getOptionalCategories(): HabitCategory[] {
  return HABIT_CATEGORIES.filter((cat) => !cat.isCore);
}

// Get category by ID
export function getCategoryById(id: string): HabitCategory | undefined {
  return HABIT_CATEGORIES.find((cat) => cat.id === id);
}

// Get preset by ID
export function getPresetById(id: string): QuickLogPreset | undefined {
  return QUICK_LOG_PRESETS.find((preset) => preset.id === id);
}
