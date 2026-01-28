import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/types';

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  hasHydrated: boolean;
  setProfile: (age: number, gender: 'male' | 'female' | 'other') => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  setHasHydrated: (state: boolean) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: true,
      hasHydrated: false,

      setProfile: (age: number, gender: 'male' | 'female' | 'other') => {
        const profile: UserProfile = {
          id: generateId(),
          age,
          gender,
          createdAt: new Date(),
        };
        set({ profile, isLoading: false });
      },

      updateProfile: (updates: Partial<UserProfile>) => {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: { ...currentProfile, ...updates },
          });
        }
      },

      clearProfile: () => {
        set({ profile: null });
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state, isLoading: !state });
      },
    }),
    {
      name: 'hrv-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
