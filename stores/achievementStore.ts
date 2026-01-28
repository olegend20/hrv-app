import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement } from '@/types';
import { ACHIEVEMENTS, getAchievementById } from '@/constants/achievements';

interface AchievementState {
  achievements: Achievement[];
  hasHydrated: boolean;
  unlockAchievement: (id: string) => boolean; // Returns true if newly unlocked
  isUnlocked: (id: string) => boolean;
  getAchievement: (id: string) => Achievement | undefined;
  updateProgress: (id: string, progress: number, target: number) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: [],
      hasHydrated: false,

      unlockAchievement: (id: string) => {
        const existing = get().achievements.find((a) => a.id === id);
        if (existing?.unlockedAt) {
          return false; // Already unlocked
        }

        const definition = getAchievementById(id);
        if (!definition) {
          return false;
        }

        const achievement: Achievement = {
          id,
          name: definition.name,
          description: definition.description,
          unlockedAt: new Date(),
        };

        if (existing) {
          // Update existing
          set({
            achievements: get().achievements.map((a) =>
              a.id === id ? achievement : a
            ),
          });
        } else {
          // Add new
          set({ achievements: [...get().achievements, achievement] });
        }

        return true;
      },

      isUnlocked: (id: string) => {
        const achievement = get().achievements.find((a) => a.id === id);
        return !!achievement?.unlockedAt;
      },

      getAchievement: (id: string) => {
        return get().achievements.find((a) => a.id === id);
      },

      updateProgress: (id: string, progress: number, target: number) => {
        const existing = get().achievements.find((a) => a.id === id);
        const definition = getAchievementById(id);

        if (!definition) return;

        const achievement: Achievement = {
          id,
          name: definition.name,
          description: definition.description,
          progress,
          target,
          unlockedAt: existing?.unlockedAt,
        };

        if (existing) {
          set({
            achievements: get().achievements.map((a) =>
              a.id === id ? achievement : a
            ),
          });
        } else {
          set({ achievements: [...get().achievements, achievement] });
        }
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state });
      },
    }),
    {
      name: 'hrv-achievements-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Check and unlock achievements based on current state
 */
export function checkAchievements(
  hrvDays: number,
  habitDays: number,
  streak: number,
  daysAtGoal: number,
  hrvImprovement: number,
  hasGoal: boolean
): string[] {
  const store = useAchievementStore.getState();
  const newUnlocks: string[] = [];

  // Data achievements
  if (hrvDays >= 1 && store.unlockAchievement('data_pioneer')) {
    newUnlocks.push('data_pioneer');
  }
  if (hrvDays >= 7 && store.unlockAchievement('week_tracked')) {
    newUnlocks.push('week_tracked');
  }
  if (hrvDays >= 30 && store.unlockAchievement('month_tracked')) {
    newUnlocks.push('month_tracked');
  }

  // Habit achievements
  if (habitDays >= 1 && store.unlockAchievement('first_habit')) {
    newUnlocks.push('first_habit');
  }

  // Streak achievements
  if (streak >= 7 && store.unlockAchievement('streak_7')) {
    newUnlocks.push('streak_7');
  }
  if (streak >= 14 && store.unlockAchievement('streak_14')) {
    newUnlocks.push('streak_14');
  }
  if (streak >= 30 && store.unlockAchievement('streak_30')) {
    newUnlocks.push('streak_30');
  }

  // Progress achievements
  if (daysAtGoal >= 7 && store.unlockAchievement('on_target_7')) {
    newUnlocks.push('on_target_7');
  }
  if (hrvImprovement >= 10 && store.unlockAchievement('hrv_improver_10')) {
    newUnlocks.push('hrv_improver_10');
  }

  // Milestone achievements
  if (habitDays >= 14 && store.unlockAchievement('insights_unlocked')) {
    newUnlocks.push('insights_unlocked');
  }
  if (hasGoal && store.unlockAchievement('goal_setter')) {
    newUnlocks.push('goal_setter');
  }

  return newUnlocks;
}
