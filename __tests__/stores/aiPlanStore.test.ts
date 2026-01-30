import { useAIPlanStore } from '@/stores/aiPlanStore';
import { DailyPlan } from '@/types';

describe('AI Plan Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAIPlanStore.setState({ plans: [] });
  });

  describe('addPlan', () => {
    it('should add a new daily plan', () => {
      const plan: DailyPlan = {
        id: 'plan-1',
        date: '2024-01-01',
        generatedAt: new Date(),
        todayRecovery: {
          hrv: 45,
          recoveryScore: 65,
          sleepHours: 7.5,
        },
        userContext: 'Feeling good',
        focusArea: 'Maintenance',
        reasoning: 'HRV is stable',
        recommendations: [
          {
            priority: 1,
            category: 'Exercise',
            action: '30-min easy run',
            timing: 'Morning',
            expectedImpact: '+2-3ms',
          },
        ],
        estimatedEndOfDayHRV: 47,
        completed: [],
      };

      useAIPlanStore.getState().addPlan(plan);

      const plans = useAIPlanStore.getState().plans;
      expect(plans).toHaveLength(1);
      expect(plans[0].focusArea).toBe('Maintenance');
    });
  });

  describe('markRecommendationCompleted', () => {
    it('should mark recommendation as completed', () => {
      const plan: DailyPlan = {
        id: 'plan-1',
        date: '2024-01-01',
        generatedAt: new Date(),
        todayRecovery: {
          hrv: 45,
          recoveryScore: 65,
          sleepHours: 7.5,
        },
        userContext: '',
        focusArea: 'Maintenance',
        reasoning: 'HRV is stable',
        recommendations: [
          {
            priority: 1,
            category: 'Exercise',
            action: '30-min easy run',
            timing: 'Morning',
            expectedImpact: '+2-3ms',
          },
        ],
        estimatedEndOfDayHRV: 47,
        completed: [],
      };

      useAIPlanStore.getState().addPlan(plan);
      useAIPlanStore.getState().markRecommendationCompleted('plan-1', 0);

      const updatedPlan = useAIPlanStore.getState().plans[0];
      expect(updatedPlan.completed).toContain('rec-0');
    });
  });

  describe('getAverageAdherence', () => {
    it('should calculate average adherence rate', () => {
      const today = new Date().toISOString().split('T')[0];

      const plan1: DailyPlan = {
        id: 'plan-1',
        date: today,
        generatedAt: new Date(),
        todayRecovery: { hrv: 45, recoveryScore: 65, sleepHours: 7.5 },
        userContext: '',
        focusArea: 'Maintenance',
        reasoning: '',
        recommendations: [
          { priority: 1, category: 'Exercise', action: 'Run', timing: 'AM', expectedImpact: '+2ms' },
          { priority: 2, category: 'Sleep', action: 'Sleep 8h', timing: 'PM', expectedImpact: '+3ms' },
        ],
        estimatedEndOfDayHRV: 47,
        completed: ['rec-0'], // 50% completion
      };

      useAIPlanStore.getState().addPlan(plan1);

      const adherence = useAIPlanStore.getState().getAverageAdherence(7);
      expect(adherence).toBe(50);
    });
  });

  describe('getTodayPlan', () => {
    it('should return plan for today', () => {
      const today = new Date().toISOString().split('T')[0];

      const plan: DailyPlan = {
        id: 'plan-today',
        date: today,
        generatedAt: new Date(),
        todayRecovery: { hrv: 45, recoveryScore: 65, sleepHours: 7.5 },
        userContext: '',
        focusArea: 'Maintenance',
        reasoning: '',
        recommendations: [],
        estimatedEndOfDayHRV: 47,
        completed: [],
      };

      useAIPlanStore.getState().addPlan(plan);

      const todayPlan = useAIPlanStore.getState().getTodayPlan();
      expect(todayPlan).toBeDefined();
      expect(todayPlan?.id).toBe('plan-today');
    });
  });
});
