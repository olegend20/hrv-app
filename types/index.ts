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

export interface HabitEntry {
  id: string;
  date: string; // YYYY-MM-DD
  sleep: {
    hours: number;
    quality: 1 | 2 | 3 | 4 | 5;
    bedtime?: string;
  };
  exercise?: {
    type: string;
    durationMins: number;
    intensity: 'low' | 'medium' | 'high';
  };
  alcohol: {
    consumed: boolean;
    units?: number;
  };
  meditation: {
    practiced: boolean;
    durationMins?: number;
  };
  caffeine?: {
    lastIntakeTime: string;
    mgEstimate?: number;
  };
  stressLevel: 1 | 2 | 3 | 4 | 5;
  coldExposure: boolean;
  notes?: string;
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
  }>;
  estimatedEndOfDayHRV: number;

  // Tracking
  completed: string[]; // IDs of completed recommendations
  outcome?: {
    followedPlan: boolean;
    actualNextDayHRV: number;
    userNotes: string;
  };
}
