// Core Types for HRV Optimizer App

export interface UserProfile {
  id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  targetPercentile?: number;
  createdAt: Date;
}

export interface HRVReading {
  id: string;
  date: string; // YYYY-MM-DD
  hrvMs: number; // RMSSD in milliseconds
  restingHR: number;
  recoveryScore?: number; // WHOOP recovery %
  source: 'whoop_csv' | 'whoop_api' | 'manual';
  rawData?: Record<string, unknown>;
}

// Comprehensive HRV Habit Entry - Research-backed factors for 30-50 year olds
export interface HabitEntry {
  id: string;
  date: string; // YYYY-MM-DD

  // ============ WORK & PROFESSIONAL ============
  work?: {
    workingHours?: number; // Hours worked today
    meetings?: number; // Number of meetings
    highStakeMeetings?: boolean; // Stressful/important meetings
    deadlinePressure?: 1 | 2 | 3 | 4 | 5; // 1=none, 5=extreme
    commuteTime?: number; // Minutes commuting
    commuteStress?: 1 | 2 | 3 | 4 | 5; // Traffic, delays, etc.
    workEnvironment?: 'office' | 'home' | 'hybrid' | 'outdoor' | 'other';
    mentalFatigue?: 1 | 2 | 3 | 4 | 5; // Cognitive load
  };

  // ============ SLEEP ============
  sleep: {
    hours: number; // Total sleep duration
    quality: 1 | 2 | 3 | 4 | 5; // Self-reported quality
    bedtime?: string; // HH:MM
    wakeTime?: string; // HH:MM
    interruptions?: number; // Wake-ups during night
    sleepDebt?: boolean; // Catching up from previous nights
  };

  // ============ EXERCISE & MOVEMENT ============
  exercise?: {
    type: 'cardio' | 'strength' | 'yoga' | 'sports' | 'walking' | 'none';
    subtype?: string; // Running, cycling, weights, etc.
    durationMins: number;
    intensity: 'light' | 'moderate' | 'vigorous' | 'high-intensity';
    timing?: 'morning' | 'afternoon' | 'evening'; // When exercised
  };

  movement?: {
    sedentaryHours?: number; // Hours sitting/lying
    steps?: number; // Daily step count
    postureChanges?: 'frequent' | 'occasional' | 'rare'; // Standing/sitting transitions
  };

  // ============ NUTRITION & DIET ============
  nutrition?: {
    meals?: number; // Number of meals
    mealTiming?: 'regular' | 'irregular' | 'late-eating';
    dietQuality?: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
    processedFoods?: boolean; // Significant processed food intake
    vegetables?: number; // Servings of fruits/vegetables
    hydration?: number; // Liters of water
    bloodSugarSpike?: boolean; // Large meal or high-glycemic foods
    fasting?: boolean; // Intermittent fasting today
    fastingHours?: number; // Hours fasted
  };

  // ============ SUBSTANCES ============
  substances?: {
    // Alcohol
    alcohol?: {
      consumed: boolean;
      drinks?: number; // Standard drinks
      timing?: 'afternoon' | 'evening' | 'late-night';
    };

    // Caffeine
    caffeine?: {
      consumed: boolean;
      cups?: number; // Cups of coffee/tea
      lastTime?: string; // HH:MM of last caffeine
      afternoon?: boolean; // Any caffeine after 2pm
    };

    // Nicotine/Vaping
    nicotine?: {
      used: boolean;
      type?: 'cigarettes' | 'vaping' | 'nicotine-gum' | 'other';
      amount?: number; // Cigarettes or vaping sessions
    };
  };

  // ============ STRESS & MENTAL HEALTH ============
  stress: {
    overallLevel: 1 | 2 | 3 | 4 | 5; // 1=calm, 5=overwhelmed
    acuteStress?: boolean; // Specific stressful event today
    chronicStress?: boolean; // Ongoing situation
    anxiety?: 1 | 2 | 3 | 4 | 5;
    mood?: 1 | 2 | 3 | 4 | 5; // 1=very low, 5=great
  };

  // ============ RECOVERY PRACTICES ============
  recovery?: {
    meditation?: {
      practiced: boolean;
      durationMins?: number;
      type?: 'mindfulness' | 'breathing' | 'body-scan' | 'guided' | 'other';
    };

    breathwork?: {
      practiced: boolean;
      durationMins?: number;
      type?: 'box-breathing' | 'resonance' | 'wim-hof' | 'other';
    };

    coldExposure?: {
      practiced: boolean;
      type?: 'cold-shower' | 'ice-bath' | 'cold-plunge' | 'other';
      durationMins?: number;
    };

    sauna?: {
      used: boolean;
      durationMins?: number;
    };

    massage?: boolean;
    stretching?: boolean;
    restDay?: boolean; // Intentional rest/recovery day
  };

  // ============ SOCIAL & RELATIONSHIPS ============
  social?: {
    socialInteraction?: 1 | 2 | 3 | 4 | 5; // 1=isolated, 5=very social
    qualityTime?: boolean; // Meaningful time with loved ones
    relationshipConflict?: boolean; // Arguments or tension
    loneliness?: 1 | 2 | 3 | 4 | 5; // Felt lonely today
  };

  // ============ FAMILY & LIFE SITUATION ============
  family?: {
    parentingStress?: 1 | 2 | 3 | 4 | 5; // If applicable
    sleepDisruption?: boolean; // Kids woke you up
    caregivingDemands?: boolean; // Caring for parents/family
    workLifeBalance?: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  };

  // ============ ENVIRONMENTAL ============
  environment?: {
    airQuality?: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
    outdoorTime?: number; // Minutes outside
    natureExposure?: boolean; // Time in nature/green space
    noiseLevel?: 1 | 2 | 3 | 4 | 5; // 1=quiet, 5=very noisy
    temperature?: 'comfortable' | 'too-cold' | 'too-hot';
  };

  // ============ HEALTH & MEDICAL ============
  health?: {
    illness?: boolean; // Feeling sick or fighting illness
    pain?: {
      present: boolean;
      level?: 1 | 2 | 3 | 4 | 5; // Pain severity
      type?: string; // Headache, back pain, etc.
    };
    medication?: {
      taken: boolean;
      names?: string; // Medication names
    };
    supplements?: string[]; // List of supplements taken
    menstrualCycle?: {
      tracking: boolean;
      phase?: 'follicular' | 'ovulation' | 'luteal' | 'menstrual';
      symptoms?: boolean; // PMS or other symptoms
    };
  };

  // ============ LIFESTYLE & TECH ============
  lifestyle?: {
    screenTime?: number; // Hours of screen time
    blueLight?: {
      evening: boolean; // Screen use before bed
      hoursBeforeBed?: number;
    };
    morningLight?: boolean; // Got morning sunlight
    sleepHygiene?: 1 | 2 | 3 | 4 | 5; // Quality of evening routine
  };

  // ============ NOTES ============
  notes?: string; // Free-form notes about the day
  significantEvent?: string; // Any major life event
}

// Habit Category Metadata for UI organization
export interface HabitCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  impactLevel: 'major' | 'moderate' | 'minor';
  isCore: boolean; // Show by default vs optional
}

// Quick Log Presets for fast daily logging
export interface QuickLogPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  values: Partial<Omit<HabitEntry, 'id' | 'date'>>;
}

export interface Correlation {
  habitKey: string;
  habitLabel: string;
  coefficient: number; // -1 to 1
  avgHrvWith: number;
  avgHrvWithout: number;
  percentageDiff: number;
  sampleSize: number;
  significance: 'high' | 'medium' | 'low';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: Date;
  progress?: number;
  target?: number;
}

export interface Recommendation {
  habitKey: string;
  habitLabel: string;
  action: 'increase' | 'decrease';
  impactScore: number;
  message: string;
  expectedImpact: string;
}

// Milestone 1: Enhanced Onboarding Types

export interface HealthProfile {
  // Medical History
  injuries: string[];
  conditions: string[];
  medications: string[];

  // Goals
  primaryGoal: string;
  secondaryGoals: string[];
  targetHRV?: number;

  // Exercise
  exercisePreferences: {
    likes: string[];
    dislikes: string[];
    currentFrequency: string;
  };

  // Work
  workEnvironment: {
    type: string; // "desk job", "active", "remote", etc.
    stressLevel: 'low' | 'moderate' | 'moderate-high' | 'high';
    avgMeetingsPerDay: number;
    deskWork: boolean;
  };

  // Family
  familySituation: {
    hasYoungChildren: boolean;
    numberOfChildren: number;
    childrenAges: number[];
  };

  // Nutrition
  eatingHabits: {
    fruitsVeggiesPerDay: number;
    waterIntakeLiters: number;
    supplements: string[];
    dietaryRestrictions: string[];
  };

  // Sleep
  sleepPatterns: {
    avgBedtime: string;
    avgWakeTime: string;
    difficulties: string[];
  };

  // Stress
  stressTriggers: string[];
}

// Milestone 2: Screenshot Upload Types

export interface ScreenshotData {
  id: string;
  date: string; // ISO date
  type: 'recovery' | 'sleep'; // Type of screenshot
  uploadedAt: Date;
  imageUri?: string; // Temporary, deleted after extraction
  extractedData: {
    hrv?: number;
    recoveryScore?: number;
    sleepHours?: number;
    sleepQuality?: number;
    strain?: number;
    restingHR?: number;
  };
  rawAIResponse: string;
  userContext?: string; // "How was your day?"
}

// Milestone 3: Conversational AI Types

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: {
    includedHRVData?: boolean;
    includedHabits?: boolean;
    includedGoals?: boolean;
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

// Milestone 4: Daily Planning Types

export interface DailyPlan {
  id: string;
  date: string; // ISO date
  generatedAt: Date;

  // Input data
  todayRecovery: {
    hrv: number;
    recoveryScore: number;
    sleepHours: number;
  };
  userContext: string;

  // AI output
  focusArea: 'Recovery' | 'Maintenance' | 'Push';
  reasoning: string;
  recommendations: Array<{
    priority: 1 | 2 | 3;
    category: 'Exercise' | 'Nutrition' | 'Stress Management' | 'Sleep' | 'Hydration' | 'Recovery';
    action: string;
    timing: string;
    expectedImpact: string;
    reasoning?: string;
  }>;
  estimatedEndOfDayHRV: number;

  // NEW: Previous day analysis
  previousDayAnalysis?: {
    planId: string | null;
    adherenceRate: number;
    successfulActions: string[];
    learnedInsights: string[];
  };

  // NEW: Goal alignment
  goalAlignment?: {
    primaryGoal: string;
    progressToGoal: string;
    recommendationsAligned: number;
  };

  // NEW: Contextual factors
  contextualFactors?: {
    workload: 'light' | 'moderate' | 'heavy';
    familyDemands: 'low' | 'moderate' | 'high';
    injuries: string[];
  };

  // Tracking
  completed: string[]; // IDs of completed recommendations
  outcome?: {
    followedPlan: boolean;
    actualNextDayHRV: number;
    userNotes: string;
  };

  // NEW: Plan review data
  review?: {
    completedAt: Date;
    overallRating: 1 | 2 | 3 | 4 | 5;
    completedActions: string[];
    notes: string;
  };
}

// Morning Ritual Types

export type MorningRitualStep =
  | 'welcome'
  | 'screenshots'
  | 'context'
  | 'yesterday-review'
  | 'habits'
  | 'analysis'
  | 'plan';

export interface MorningContext {
  sleepRating: 1 | 2 | 3 | 4 | 5;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface YesterdayPlanReview {
  planId: string;
  completedActions: string[];
  totalActions: number;
  overallRating: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface MorningRitualSession {
  id: string;
  date: string; // YYYY-MM-DD
  startedAt: Date;
  completedAt: Date | null;
  currentStep: MorningRitualStep;

  screenshots: {
    recovery: ScreenshotData | null;
    sleep: ScreenshotData | null;
  };

  morningContext: MorningContext | null;
  yesterdayReview: YesterdayPlanReview | null;
  habitData: HabitEntry | null;
  generatedPlan: DailyPlan | null;
}

export interface MorningAnalysisRequest {
  date: string;
  todayBiometrics: {
    hrv: number;
    recoveryScore: number;
    sleepHours: number;
    sleepQuality: number;
    restingHR: number;
    yesterdayStrain?: number;
  };
  morningContext: MorningContext;
  yesterdayPlanReview: YesterdayPlanReview | null;
  habitData: HabitEntry;
  historical: {
    avg7Day: number;
    avg30Day: number;
    trend: string;
    correlations: Correlation[];
  };
  userProfile: UserProfile;
  healthProfile: HealthProfile;
  recentPlans?: {
    last7Days: {
      averageAdherence: number;
      successfulRecommendations: string[];
      skippedRecommendations: string[];
    };
  };
}

export interface MorningAnalysisResponse {
  analysis: {
    status: {
      hrvPercentile: number;
      vsSevenDay: number;
      recoveryState: string;
    };
    insights: string[];
    previousDayLearnings: string[];
    focusArea: 'Recovery' | 'Maintenance' | 'Push';
    reasoning: string;
    recommendations: Array<{
      priority: 1 | 2 | 3;
      category: string;
      action: string;
      timing: string;
      expectedImpact: string;
      reasoning: string;
    }>;
    goalProgress?: {
      currentHRV: number;
      targetHRV: number;
      onTrack: boolean;
      daysToTarget: number;
    };
    estimatedEndOfDayHRV: number;
  };
}
