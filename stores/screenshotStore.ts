import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenshotData } from '@/types';

interface ScreenshotState {
  screenshots: ScreenshotData[];
  isLoading: boolean;
  hasHydrated: boolean;
  addScreenshot: (screenshot: ScreenshotData) => void;
  updateScreenshot: (id: string, updates: Partial<ScreenshotData>) => void;
  deleteScreenshot: (id: string) => void;
  getScreenshotByDate: (date: string) => ScreenshotData | undefined;
  getScreenshotsByDate: (date: string) => ScreenshotData[];
  getScreenshotByDateAndType: (date: string, type: 'recovery' | 'sleep') => ScreenshotData | undefined;
  getRecentScreenshots: (days: number) => ScreenshotData[];
  setHasHydrated: (state: boolean) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export const useScreenshotStore = create<ScreenshotState>()(
  persist(
    (set, get) => ({
      screenshots: [],
      isLoading: true,
      hasHydrated: false,

      addScreenshot: (screenshot: ScreenshotData) => {
        const newScreenshot = {
          ...screenshot,
          id: screenshot.id || generateId(),
        };
        set((state) => ({
          screenshots: [...state.screenshots, newScreenshot],
        }));
      },

      updateScreenshot: (id: string, updates: Partial<ScreenshotData>) => {
        set((state) => ({
          screenshots: state.screenshots.map((screenshot) =>
            screenshot.id === id ? { ...screenshot, ...updates } : screenshot
          ),
        }));
      },

      deleteScreenshot: (id: string) => {
        set((state) => ({
          screenshots: state.screenshots.filter((screenshot) => screenshot.id !== id),
        }));
      },

      getScreenshotByDate: (date: string) => {
        return get().screenshots.find((screenshot) => screenshot.date === date);
      },

      getScreenshotsByDate: (date: string) => {
        return get().screenshots.filter((screenshot) => screenshot.date === date);
      },

      getScreenshotByDateAndType: (date: string, type: 'recovery' | 'sleep') => {
        return get().screenshots.find(
          (screenshot) => screenshot.date === date && screenshot.type === type
        );
      },

      getRecentScreenshots: (days: number) => {
        const today = new Date();
        const cutoffDate = new Date(today);
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return get().screenshots
          .filter((screenshot) => new Date(screenshot.date) >= cutoffDate)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state, isLoading: !state });
      },
    }),
    {
      name: 'hrv-screenshot-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
