import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyPlan } from '@/types';

interface AIPlanState {
  plans: DailyPlan[];
  onboardingInsights: {
    insights: string[];
    opportunities: string[];
    considerations: string[];
    initialRecommendations: string[];
  } | null;
  isLoading: boolean;
  hasHydrated: boolean;

  // Onboarding insights
  setOnboardingInsights: (insights: {
    insights: string[];
    opportunities: string[];
    considerations: string[];
    initialRecommendations: string[];
  }) => void;

  // Daily plan management
  addPlan: (plan: DailyPlan) => void;
  updatePlan: (id: string, updates: Partial<DailyPlan>) => void;
  getPlanByDate: (date: string) => DailyPlan | undefined;
  getRecentPlans: (days: number) => DailyPlan[];
  getTodayPlan: () => DailyPlan | undefined;

  // Completion tracking
  markRecommendationCompleted: (planId: string, recommendationIndex: number) => void;
  markRecommendationIncomplete: (planId: string, recommendationIndex: number) => void;
  setOutcome: (planId: string, outcome: DailyPlan['outcome']) => void;

  // Analytics
  getAverageAdherence: (days: number) => number;
  getCompletionStats: () => {
    totalPlans: number;
    plansWithOutcomes: number;
    averageCompletion: number;
  };

  setHasHydrated: (state: boolean) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export const useAIPlanStore = create<AIPlanState>()(
  persist(
    (set, get) => ({
      plans: [],
      onboardingInsights: null,
      isLoading: true,
      hasHydrated: false,

      setOnboardingInsights: (insights) => {
        set({ onboardingInsights: insights });
      },

      addPlan: (plan: DailyPlan) => {
        const newPlan = {
          ...plan,
          id: plan.id || `plan-${generateId()}`,
        };

        set((state) => ({
          plans: [...state.plans, newPlan],
        }));
      },

      updatePlan: (id: string, updates: Partial<DailyPlan>) => {
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === id ? { ...plan, ...updates } : plan
          ),
        }));
      },

      getPlanByDate: (date: string) => {
        return get().plans.find((plan) => plan.date === date);
      },

      getRecentPlans: (days: number) => {
        const today = new Date();
        const cutoffDate = new Date(today);
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return get().plans
          .filter((plan) => new Date(plan.date) >= cutoffDate)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      getTodayPlan: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().getPlanByDate(today);
      },

      markRecommendationCompleted: (planId: string, recommendationIndex: number) => {
        const plan = get().plans.find((p) => p.id === planId);
        if (!plan) return;

        const recommendationId = `rec-${recommendationIndex}`;
        if (!plan.completed.includes(recommendationId)) {
          get().updatePlan(planId, {
            completed: [...plan.completed, recommendationId],
          });
        }
      },

      markRecommendationIncomplete: (planId: string, recommendationIndex: number) => {
        const plan = get().plans.find((p) => p.id === planId);
        if (!plan) return;

        const recommendationId = `rec-${recommendationIndex}`;
        get().updatePlan(planId, {
          completed: plan.completed.filter((id) => id !== recommendationId),
        });
      },

      setOutcome: (planId: string, outcome: DailyPlan['outcome']) => {
        get().updatePlan(planId, { outcome });
      },

      getAverageAdherence: (days: number) => {
        const recentPlans = get().getRecentPlans(days);
        if (recentPlans.length === 0) return 0;

        const totalCompletion = recentPlans.reduce((sum, plan) => {
          const completionRate = plan.completed.length / plan.recommendations.length;
          return sum + completionRate;
        }, 0);

        return (totalCompletion / recentPlans.length) * 100;
      },

      getCompletionStats: () => {
        const { plans } = get();
        const plansWithOutcomes = plans.filter((p) => p.outcome).length;

        const totalCompletion = plans.reduce((sum, plan) => {
          if (plan.recommendations.length === 0) return sum;
          return sum + (plan.completed.length / plan.recommendations.length);
        }, 0);

        return {
          totalPlans: plans.length,
          plansWithOutcomes,
          averageCompletion: plans.length > 0 ? (totalCompletion / plans.length) * 100 : 0,
        };
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state, isLoading: !state });
      },
    }),
    {
      name: 'hrv-ai-plan-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Keep only last 30 days of plans to avoid storage bloat
      partialize: (state) => ({
        plans: state.plans.slice(-30),
        onboardingInsights: state.onboardingInsights,
      }),
    }
  )
);
