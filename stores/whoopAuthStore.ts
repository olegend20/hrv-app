import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WhoopAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  // Actions
  setTokens: (
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ) => void;
  clearTokens: () => void;
  isTokenExpired: () => boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useWhoopAuthStore = create<WhoopAuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      hasHydrated: false,

      setTokens: (accessToken, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set({
          accessToken,
          refreshToken,
          expiresAt,
          isAuthenticated: true,
        });
      },

      clearTokens: () => {
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },

      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        // Consider token expired if less than 5 minutes remaining
        return Date.now() >= expiresAt - 5 * 60 * 1000;
      },

      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },
    }),
    {
      name: 'whoop-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
