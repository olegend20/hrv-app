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

  // Plan review (for morning ritual)
  setPlanReview: (planId: string, review: DailyPlan['review']) => void;
  getYesterdayPlan: () => DailyPlan | undefined;

  // Analytics
  getAverageAdherence: (days: number) => number;
  getCompletionStats: () => {
    totalPlans: number;
    plansWithOutcomes: number;
    averageCompletion: number;
  };
  getRecentAdherenceStats: (days: number) => {
    averageAdherence: number;
    successfulRecommendations: string[];
    skippedRecommendations: string[];
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

      setPlanReview: (planId: string, review: DailyPlan['review']) => {
        get().updatePlan(planId, { review });
      },

      getYesterdayPlan: () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];
        return get().getPlanByDate(yesterdayDate);
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

      getRecentAdherenceStats: (days: number) => {
        const recentPlans = get().getRecentPlans(days);

        if (recentPlans.length === 0) {
          return {
            averageAdherence: 0,
            successfulRecommendations: [],
            skippedRecommendations: [],
          };
        }

        // Calculate average adherence
        const totalCompletion = recentPlans.reduce((sum, plan) => {
          if (plan.recommendations.length === 0) return sum;
          return sum + (plan.completed.length / plan.recommendations.length);
        }, 0);
        const averageAdherence = (totalCompletion / recentPlans.length) * 100;

        // Track which recommendations were completed vs skipped
        const recommendationTracking: { [key: string]: { completed: number; total: number } } = {};

        recentPlans.forEach((plan) => {
          plan.recommendations.forEach((rec, index) => {
            const key = rec.action; // Use action as key for tracking
            if (!recommendationTracking[key]) {
              recommendationTracking[key] = { completed: 0, total: 0 };
            }
            recommendationTracking[key].total += 1;
            if (plan.completed.includes(`rec-${index}`)) {
              recommendationTracking[key].completed += 1;
            }
          });
        });

        // Identify successful vs skipped recommendations
        const successfulRecommendations: string[] = [];
        const skippedRecommendations: string[] = [];

        Object.entries(recommendationTracking).forEach(([action, stats]) => {
          const completionRate = stats.completed / stats.total;
          if (completionRate >= 0.7) {
            // 70%+ completion = successful
            successfulRecommendations.push(action);
          } else if (completionRate <= 0.3) {
            // 30%- completion = skipped
            skippedRecommendations.push(action);
          }
        });

        return {
          averageAdherence,
          successfulRecommendations,
          skippedRecommendations,
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
