import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthProfile } from '@/types';

interface HealthProfileState {
  healthProfile: HealthProfile | null;
  isLoading: boolean;
  hasHydrated: boolean;
  setHealthProfile: (profile: HealthProfile) => void;
  updateHealthProfile: (updates: Partial<HealthProfile>) => void;
  clearHealthProfile: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useHealthProfileStore = create<HealthProfileState>()(
  persist(
    (set, get) => ({
      healthProfile: null,
      isLoading: true,
      hasHydrated: false,

      setHealthProfile: (profile: HealthProfile) => {
        set({ healthProfile: profile, isLoading: false });
      },

      updateHealthProfile: (updates: Partial<HealthProfile>) => {
        const currentProfile = get().healthProfile;
        if (currentProfile) {
          set({
            healthProfile: { ...currentProfile, ...updates },
          });
        }
      },

      clearHealthProfile: () => {
        set({ healthProfile: null });
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state, isLoading: !state });
      },
    }),
    {
      name: 'hrv-health-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
