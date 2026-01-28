import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HRVReading } from '@/types';
import { fetchWhoopHRVData } from '@/lib/whoop/api';
import { useWhoopAuthStore } from './whoopAuthStore';

interface HrvState {
  readings: HRVReading[];
  hasHydrated: boolean;
  lastSyncTime: number | null;
  isSyncing: boolean;
  syncError: string | null;
  importReadings: (newReadings: HRVReading[]) => number;
  getReadingByDate: (date: string) => HRVReading | undefined;
  getReadingsByDateRange: (startDate: string, endDate: string) => HRVReading[];
  getLatestReading: () => HRVReading | undefined;
  clearReadings: () => void;
  setHasHydrated: (state: boolean) => void;
  syncWhoopData: (daysBack?: number) => Promise<number>;
}

export const useHrvStore = create<HrvState>()(
  persist(
    (set, get) => ({
      readings: [],
      hasHydrated: false,
      lastSyncTime: null,
      isSyncing: false,
      syncError: null,

      importReadings: (newReadings: HRVReading[]) => {
        const currentReadings = get().readings;
        const readingsByDate = new Map<string, HRVReading>();

        // Index existing readings by date
        for (const reading of currentReadings) {
          readingsByDate.set(reading.date, reading);
        }

        // Add or update with new readings
        let importedCount = 0;
        for (const reading of newReadings) {
          if (!readingsByDate.has(reading.date)) {
            importedCount++;
          }
          readingsByDate.set(reading.date, reading);
        }

        // Convert back to array and sort
        const allReadings = Array.from(readingsByDate.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        set({ readings: allReadings });
        return importedCount;
      },

      getReadingByDate: (date: string) => {
        return get().readings.find((r) => r.date === date);
      },

      getReadingsByDateRange: (startDate: string, endDate: string) => {
        return get().readings.filter(
          (r) => r.date >= startDate && r.date <= endDate
        );
      },

      getLatestReading: () => {
        const readings = get().readings;
        return readings.length > 0 ? readings[readings.length - 1] : undefined;
      },

      clearReadings: () => {
        set({ readings: [] });
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state });
      },

      syncWhoopData: async (daysBack = 30) => {
        const whoopStore = useWhoopAuthStore.getState();

        if (!whoopStore.isAuthenticated || !whoopStore.accessToken) {
          throw new Error('Not connected to WHOOP');
        }

        set({ isSyncing: true, syncError: null });

        try {
          // Calculate date range
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

          // Fetch data from WHOOP
          const whoopReadings = await fetchWhoopHRVData(
            startDate,
            endDate,
            whoopStore.accessToken
          );

          // Import into store
          const importedCount = get().importReadings(whoopReadings);

          // Update sync time
          set({
            isSyncing: false,
            lastSyncTime: Date.now(),
            syncError: null,
          });

          return importedCount;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Sync failed';
          set({
            isSyncing: false,
            syncError: errorMessage,
          });
          throw error;
        }
      },
    }),
    {
      name: 'hrv-readings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
