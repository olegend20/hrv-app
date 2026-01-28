import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HRVReading } from '@/types';

interface HrvState {
  readings: HRVReading[];
  hasHydrated: boolean;
  importReadings: (newReadings: HRVReading[]) => number;
  getReadingByDate: (date: string) => HRVReading | undefined;
  getReadingsByDateRange: (startDate: string, endDate: string) => HRVReading[];
  getLatestReading: () => HRVReading | undefined;
  clearReadings: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useHrvStore = create<HrvState>()(
  persist(
    (set, get) => ({
      readings: [],
      hasHydrated: false,

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
