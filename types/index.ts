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
