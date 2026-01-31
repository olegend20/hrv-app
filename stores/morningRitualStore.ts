import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MorningRitualSession,
  MorningRitualStep,
  MorningContext,
  YesterdayPlanReview,
  ScreenshotData,
  HabitEntry,
  DailyPlan,
} from '@/types';

interface MorningRitualState {
  currentSession: MorningRitualSession | null;
  hasHydrated: boolean;

  // Session management
  startSession: () => void;
  completeSession: () => void;
  clearSession: () => void;
  resumeSession: () => MorningRitualSession | null;

  // Step navigation
  setCurrentStep: (step: MorningRitualStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Data updates
  setScreenshots: (screenshots: { recovery: ScreenshotData | null; sleep: ScreenshotData | null }) => void;
  setMorningContext: (context: MorningContext) => void;
  setYesterdayReview: (review: YesterdayPlanReview) => void;
  setHabitData: (habitData: HabitEntry) => void;
  setGeneratedPlan: (plan: DailyPlan) => void;

  // Utilities
  canProceedToNextStep: () => boolean;
  getProgressPercentage: () => number;

  setHasHydrated: (state: boolean) => void;
}

const STEP_ORDER: MorningRitualStep[] = [
  'welcome',
  'screenshots',
  'context',
  'yesterday-review',
  'habits',
  'analysis',
  'plan',
];

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export const useMorningRitualStore = create<MorningRitualState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      hasHydrated: false,

      startSession: () => {
        const today = getTodayDate();
        const existingSession = get().currentSession;

        // If there's an existing session for today
        if (existingSession && existingSession.date === today) {
          // If it's completed, clear it and start new
          if (existingSession.completedAt) {
            // Fall through to create new session
          } else {
            // If incomplete, resume it
            return;
          }
        }

        // Create new session
        const newSession: MorningRitualSession = {
          id: generateSessionId(),
          date: today,
          startedAt: new Date(),
          completedAt: null,
          currentStep: 'welcome',
          screenshots: {
            recovery: null,
            sleep: null,
          },
          morningContext: null,
          yesterdayReview: null,
          habitData: null,
          generatedPlan: null,
        };

        set({ currentSession: newSession });
      },

      completeSession: () => {
        const session = get().currentSession;
        if (session) {
          set({
            currentSession: {
              ...session,
              completedAt: new Date(),
              currentStep: 'plan',
            },
          });
        }
      },

      clearSession: () => {
        set({ currentSession: null });
      },

      resumeSession: () => {
        const session = get().currentSession;
        const today = getTodayDate();

        // Only resume if session is for today and not completed
        if (session && session.date === today && !session.completedAt) {
          return session;
        }

        return null;
      },

      setCurrentStep: (step: MorningRitualStep) => {
        const session = get().currentSession;
        if (session) {
          set({
            currentSession: {
              ...session,
              currentStep: step,
            },
          });
        }
      },

      goToNextStep: () => {
        const session = get().currentSession;
        if (!session) return;

        const currentIndex = STEP_ORDER.indexOf(session.currentStep);
        if (currentIndex < STEP_ORDER.length - 1) {
          const nextStep = STEP_ORDER[currentIndex + 1];
          get().setCurrentStep(nextStep);
        }
      },

      goToPreviousStep: () => {
        const session = get().currentSession;
        if (!session) return;

        const currentIndex = STEP_ORDER.indexOf(session.currentStep);
        if (currentIndex > 0) {
          const previousStep = STEP_ORDER[currentIndex - 1];
          get().setCurrentStep(previousStep);
        }
      },

      setScreenshots: (screenshots) => {
        const session = get().currentSession;
        if (session) {
          set({
            currentSession: {
              ...session,
              screenshots,
            },
          });
        }
      },

      setMorningContext: (context) => {
        const session = get().currentSession;
        if (session) {
          set({
            currentSession: {
              ...session,
              morningContext: context,
            },
          });
        }
      },

      setYesterdayReview: (review) => {
        const session = get().currentSession;
        if (session) {
          set({
            currentSession: {
              ...session,
              yesterdayReview: review,
            },
          });
        }
      },

      setHabitData: (habitData) => {
        const session = get().currentSession;
        if (session) {
          set({
            currentSession: {
              ...session,
              habitData,
            },
          });
        }
      },

      setGeneratedPlan: (plan) => {
        const session = get().currentSession;
        if (session) {
          set({
            currentSession: {
              ...session,
              generatedPlan: plan,
            },
          });
        }
      },

      canProceedToNextStep: () => {
        const session = get().currentSession;
        if (!session) return false;

        switch (session.currentStep) {
          case 'welcome':
            return true;
          case 'screenshots':
            // At least one screenshot required
            return session.screenshots.recovery !== null || session.screenshots.sleep !== null;
          case 'context':
            return session.morningContext !== null;
          case 'yesterday-review':
            // Yesterday review is optional - can always proceed
            return true;
          case 'habits':
            return session.habitData !== null;
          case 'analysis':
            return session.generatedPlan !== null;
          case 'plan':
            return true;
          default:
            return false;
        }
      },

      getProgressPercentage: () => {
        const session = get().currentSession;
        if (!session) return 0;

        const currentIndex = STEP_ORDER.indexOf(session.currentStep);
        return Math.round(((currentIndex + 1) / STEP_ORDER.length) * 100);
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state });
      },
    }),
    {
      name: 'hrv-morning-ritual-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Only persist the current session
      partialize: (state) => ({
        currentSession: state.currentSession,
      }),
    }
  )
);
